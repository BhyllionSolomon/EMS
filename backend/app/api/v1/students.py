import os

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.auth_dependency import get_current_user

from app.schemas.student import (
    StudentCreate,
    StudentUpdate,
    StudentResponse,
)
from app.schemas.student_document import DocumentResponse

from app.services.student_service import (
    create_student,
    get_students,
    get_student,
    get_student_by_user,
    update_student,
    delete_student,
)
from app.services.document_service import (
    save_document,
    get_document,
    get_document_path,
    delete_document,
)


router = APIRouter(
    prefix="/students",
    tags=["Students"],
)


# Admin/assessor retain full, unrestricted student-management access
# exactly as before. A "student" account is additionally allowed to
# create/view/edit only the single record linked to their own login.
STAFF_ROLES = {"admin", "assessor"}


def _can_manage(current_user, student) -> bool:
    if current_user.role in STAFF_ROLES:
        return True

    if current_user.role == "student":
        return student.user_id == current_user.id

    return False


@router.get(
    "/me",
    response_model=StudentResponse,
)
def read_my_student_record(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Used by the student-facing "Students" page to check whether the
    logged-in student already has a submitted record (so the form
    can switch from "register" to "edit") without exposing anyone
    else's data.
    """

    student = get_student_by_user(db, current_user.id)

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You have not submitted your details yet",
        )

    return student


@router.post(
    "/",
    response_model=StudentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create(
    student: StudentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    owner_user_id = None

    if current_user.role == "student":
        existing = get_student_by_user(db, current_user.id)

        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "You have already submitted your details. "
                    "Use the edit option to update them instead."
                ),
            )

        owner_user_id = current_user.id

    try:
        new_student = create_student(
            db,
            student,
            created_by_id=current_user.id,
            owner_user_id=owner_user_id,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    if new_student is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A student with this matric number already exists",
        )

    return new_student


@router.get(
    "/",
    response_model=list[StudentResponse],
)
def read_students(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.role == "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Use /students/me to view your own record",
        )

    return get_students(db)


@router.get(
    "/{student_id}",
    response_model=StudentResponse,
)
def read_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    student = get_student(
        db,
        student_id,
    )

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    if not _can_manage(current_user, student):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this student record",
        )

    return student


@router.put(
    "/{student_id}",
    response_model=StudentResponse,
)
def update(
    student_id: int,
    student_data: StudentUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    student = get_student(db, student_id)

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    if not _can_manage(current_user, student):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this student record",
        )

    updated = update_student(
        db,
        student_id,
        student_data,
        current_user.id,
    )

    return updated


@router.delete(
    "/{student_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete(
    student_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.role not in STAFF_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator or assessor access required",
        )

    deleted = delete_student(
        db,
        student_id,
        current_user.id,
    )

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    return None


# ---------------------------------------------------------------
# Project documents
# ---------------------------------------------------------------


@router.post(
    "/{student_id}/documents",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_document(
    student_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    student = get_student(db, student_id)

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    if not _can_manage(current_user, student):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this student record",
        )

    file_bytes = await file.read()

    max_bytes = settings.max_upload_size_mb * 1024 * 1024

    if len(file_bytes) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=(
                f"File exceeds the {settings.max_upload_size_mb}MB "
                f"upload limit"
            ),
        )

    document = save_document(
        db,
        student_id=student_id,
        file_name=file.filename or "document",
        content_type=file.content_type,
        file_bytes=file_bytes,
        uploaded_by_id=current_user.id,
    )

    return document


@router.get(
    "/{student_id}/documents/{document_id}/download",
)
def download_document(
    student_id: int,
    document_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    student = get_student(db, student_id)

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    if not _can_manage(current_user, student):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this student record",
        )

    document = get_document(db, document_id)

    if not document or document.student_id != student_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    file_path = get_document_path(document)

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File is missing from storage",
        )

    return FileResponse(
        path=file_path,
        filename=document.file_name,
        media_type=document.content_type
        or "application/octet-stream",
    )


@router.delete(
    "/{student_id}/documents/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_document(
    student_id: int,
    document_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    student = get_student(db, student_id)

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    if not _can_manage(current_user, student):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this student record",
        )

    document = get_document(db, document_id)

    if not document or document.student_id != student_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    delete_document(db, document, current_user.id)

    return None
