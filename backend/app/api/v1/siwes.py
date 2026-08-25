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

from app.schemas.siwes import (
    SiwesPlacementCreate,
    SiwesPlacementUpdate,
    SiwesPlacementResponse,
    SiwesLogEntryCreate,
    SiwesLogEntryResponse,
    SiwesCoordinatorCommentCreate,
    SiwesCoordinatorCommentResponse,
    SiwesAssessmentCreate,
    SiwesAssessmentResponse,
    SiwesStudentReport,
)
from app.schemas.student_document import DocumentResponse

from app.services.student_service import get_student, get_student_by_user
from app.services import siwes_service
from app.services import siwes_document_service
from app.services import siwes_assessment_service


router = APIRouter(prefix="/siwes", tags=["SIWES"])


# Admin/assessor keep full access, matching the FYP module. A student
# can only ever touch the single placement linked to their own
# record. A SIWES coordinator gets read/comment access, but only for
# students within their own department (see department_id on User).
STAFF_ROLES = {"admin", "assessor"}


def _own_student_or_none(db: Session, current_user):
    if current_user.role != "student":
        return None

    return get_student_by_user(db, current_user.id)


def _can_manage_placement(current_user, placement) -> bool:
    if current_user.role in STAFF_ROLES:
        return True

    return False


def _can_view_placement(db: Session, current_user, placement) -> bool:
    if current_user.role in STAFF_ROLES:
        return True

    if current_user.role == "student":
        student = get_student(db, placement.student_id)
        return bool(student and student.user_id == current_user.id)

    if current_user.role == "siwes_coordinator":
        return siwes_service.coordinator_can_access_placement(
            db, current_user.department_id, placement
        )

    return False


def _get_placement_or_404(db: Session, placement_id: int):
    placement = siwes_service.get_placement(db, placement_id)

    if not placement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SIWES placement not found",
        )

    return placement


# ---------------------------------------------------------------
# Placement
# ---------------------------------------------------------------


@router.post(
    "/placements/student/{student_id}",
    response_model=SiwesPlacementResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_placement(
    student_id: int,
    data: SiwesPlacementCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    student = get_student(db, student_id)

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    if current_user.role == "student":
        if not student.user_id or student.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only create your own SIWES placement",
            )
    elif current_user.role not in STAFF_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this action",
        )

    try:
        return siwes_service.create_placement(
            db, student_id, data, current_user.id
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e),
        )


@router.get(
    "/placements/",
    response_model=list[SiwesPlacementResponse],
)
def list_placements(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.role == "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Use /siwes/placements/me to view your own placement",
        )

    all_placements = siwes_service.get_all_placements(db)

    if current_user.role in STAFF_ROLES or current_user.role == "admin":
        return all_placements

    if current_user.role == "siwes_coordinator":
        return [
            p
            for p in all_placements
            if siwes_service.coordinator_can_access_placement(
                db, current_user.department_id, p
            )
        ]

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have access to this action",
    )


@router.get(
    "/placements/me",
    response_model=SiwesPlacementResponse,
)
def read_my_placement(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only student accounts can use this endpoint",
        )

    student = _own_student_or_none(db, current_user)

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You have not submitted your student details yet",
        )

    placement = siwes_service.get_placement_by_student(db, student.id)

    if not placement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You have not registered a SIWES placement yet",
        )

    return placement


@router.get(
    "/placements/student/{student_id}",
    response_model=SiwesPlacementResponse,
)
def read_placement_for_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    placement = siwes_service.get_placement_by_student(db, student_id)

    if not placement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SIWES placement not found",
        )

    if not _can_view_placement(db, current_user, placement):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this placement",
        )

    return placement


@router.put(
    "/placements/{placement_id}",
    response_model=SiwesPlacementResponse,
)
def update_placement(
    placement_id: int,
    data: SiwesPlacementUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    placement = _get_placement_or_404(db, placement_id)

    can_edit = _can_manage_placement(current_user, placement)

    if not can_edit and current_user.role == "student":
        student = get_student(db, placement.student_id)
        can_edit = bool(student and student.user_id == current_user.id)

    if not can_edit:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this placement",
        )

    return siwes_service.update_placement(db, placement, data)


# ---------------------------------------------------------------
# Weekly log entries
# ---------------------------------------------------------------


@router.post(
    "/placements/{placement_id}/log-entries",
    response_model=SiwesLogEntryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_log_entry(
    placement_id: int,
    data: SiwesLogEntryCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    placement = _get_placement_or_404(db, placement_id)

    if current_user.role == "siwes_coordinator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Coordinators cannot create log entries",
        )

    can_edit = _can_manage_placement(current_user, placement)

    if not can_edit and current_user.role == "student":
        student = get_student(db, placement.student_id)
        can_edit = bool(student and student.user_id == current_user.id)

    if not can_edit:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this placement",
        )

    try:
        return siwes_service.create_log_entry(
            db, placement_id, data, current_user.id
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e),
        )


@router.get(
    "/placements/{placement_id}/log-entries",
    response_model=list[SiwesLogEntryResponse],
)
def list_log_entries(
    placement_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    placement = _get_placement_or_404(db, placement_id)

    if not _can_view_placement(db, current_user, placement):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this placement",
        )

    return siwes_service.get_log_entries(db, placement_id)


def _get_log_entry_and_placement(db: Session, log_entry_id: int):
    entry = siwes_service.get_log_entry(db, log_entry_id)

    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Log entry not found",
        )

    placement = siwes_service.get_placement(db, entry.placement_id)

    return entry, placement


@router.put(
    "/log-entries/{log_entry_id}",
    response_model=SiwesLogEntryResponse,
)
def update_log_entry(
    log_entry_id: int,
    description: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    entry, placement = _get_log_entry_and_placement(db, log_entry_id)

    can_edit = _can_manage_placement(current_user, placement)

    if not can_edit and current_user.role == "student":
        student = get_student(db, placement.student_id)
        can_edit = bool(student and student.user_id == current_user.id)

    if not can_edit:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this log entry",
        )

    return siwes_service.update_log_entry(db, entry, description)


@router.delete(
    "/log-entries/{log_entry_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_log_entry(
    log_entry_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    entry, placement = _get_log_entry_and_placement(db, log_entry_id)

    can_edit = _can_manage_placement(current_user, placement)

    if not can_edit and current_user.role == "student":
        student = get_student(db, placement.student_id)
        can_edit = bool(student and student.user_id == current_user.id)

    if not can_edit:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this log entry",
        )

    siwes_service.delete_log_entry(db, entry)

    return None


# ---------------------------------------------------------------
# Mandatory signed-page documents on a log entry
# ---------------------------------------------------------------


@router.post(
    "/log-entries/{log_entry_id}/documents",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_log_document(
    log_entry_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    entry, placement = _get_log_entry_and_placement(db, log_entry_id)

    can_edit = _can_manage_placement(current_user, placement)

    if not can_edit and current_user.role == "student":
        student = get_student(db, placement.student_id)
        can_edit = bool(student and student.user_id == current_user.id)

    if not can_edit:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this log entry",
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

    return siwes_document_service.save_log_document(
        db,
        log_entry_id=log_entry_id,
        file_name=file.filename or "document",
        content_type=file.content_type,
        file_bytes=file_bytes,
        uploaded_by_id=current_user.id,
    )


@router.get(
    "/log-entries/{log_entry_id}/documents/{document_id}/download",
)
def download_log_document(
    log_entry_id: int,
    document_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    entry, placement = _get_log_entry_and_placement(db, log_entry_id)

    if not _can_view_placement(db, current_user, placement):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this log entry",
        )

    document = siwes_document_service.get_log_document(db, document_id)

    if not document or document.log_entry_id != log_entry_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    file_path = siwes_document_service.get_log_document_path(document)

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File is missing from storage",
        )

    return FileResponse(
        path=file_path,
        filename=document.file_name,
        media_type=document.content_type or "application/octet-stream",
    )


@router.delete(
    "/log-entries/{log_entry_id}/documents/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_log_document(
    log_entry_id: int,
    document_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    entry, placement = _get_log_entry_and_placement(db, log_entry_id)

    can_edit = _can_manage_placement(current_user, placement)

    if not can_edit and current_user.role == "student":
        student = get_student(db, placement.student_id)
        can_edit = bool(student and student.user_id == current_user.id)

    if not can_edit:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this log entry",
        )

    document = siwes_document_service.get_log_document(db, document_id)

    if not document or document.log_entry_id != log_entry_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    siwes_document_service.delete_log_document(
        db, document, current_user.id
    )

    return None


# ---------------------------------------------------------------
# Coordinator comments
# ---------------------------------------------------------------


@router.post(
    "/placements/{placement_id}/coordinator-comments",
    response_model=SiwesCoordinatorCommentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_coordinator_comment(
    placement_id: int,
    data: SiwesCoordinatorCommentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    placement = _get_placement_or_404(db, placement_id)

    allowed = current_user.role == "admin"

    if current_user.role == "siwes_coordinator":
        allowed = siwes_service.coordinator_can_access_placement(
            db, current_user.department_id, placement
        )

    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only a SIWES coordinator can leave a visit comment",
        )

    comment = siwes_service.create_coordinator_comment(
        db, placement_id, current_user.id, data
    )

    return SiwesCoordinatorCommentResponse(
        id=comment.id,
        placement_id=comment.placement_id,
        coordinator_id=comment.coordinator_id,
        coordinator_name=current_user.full_name,
        comment=comment.comment,
        visit_date=comment.visit_date,
        created_at=comment.created_at,
    )


@router.get(
    "/placements/{placement_id}/coordinator-comments",
    response_model=list[SiwesCoordinatorCommentResponse],
)
def list_coordinator_comments(
    placement_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    placement = _get_placement_or_404(db, placement_id)

    if not _can_view_placement(db, current_user, placement):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this placement",
        )

    comments = siwes_service.get_coordinator_comments(db, placement_id)

    return [
        SiwesCoordinatorCommentResponse(
            id=c.id,
            placement_id=c.placement_id,
            coordinator_id=c.coordinator_id,
            coordinator_name=c.coordinator.full_name
            if c.coordinator
            else None,
            comment=c.comment,
            visit_date=c.visit_date,
            created_at=c.created_at,
        )
        for c in comments
    ]


# ---------------------------------------------------------------
# Assessment (October presentation)
# ---------------------------------------------------------------


def _block_students(current_user):
    if current_user.role == "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not available to student accounts",
        )


@router.get(
    "/assessments/",
    response_model=list[SiwesAssessmentResponse],
)
def read_all_assessments(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _block_students(current_user)
    return siwes_assessment_service.get_all_assessments(db)


@router.post(
    "/assessments/",
    response_model=SiwesAssessmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_assessment(
    data: SiwesAssessmentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _block_students(current_user)

    try:
        return siwes_assessment_service.create_or_update_assessment(
            db, data, current_user.id
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.get(
    "/assessments/me",
    response_model=SiwesStudentReport,
)
def read_my_siwes_report(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only student accounts can use this endpoint",
        )

    student = _own_student_or_none(db, current_user)

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You have not submitted your details yet",
        )

    return siwes_assessment_service.get_student_report(db, student.id)


@router.get(
    "/assessments/student/{student_id}/report",
    response_model=SiwesStudentReport,
)
def read_student_report(
    student_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _block_students(current_user)
    return siwes_assessment_service.get_student_report(db, student_id)


@router.delete(
    "/assessments/{assessment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_assessment(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _block_students(current_user)

    assessment = siwes_assessment_service.delete_assessment(
        db, assessment_id
    )

    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found",
        )

    return None
