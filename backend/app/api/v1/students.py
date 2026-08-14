from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth_dependency import get_current_user

from app.schemas.student import (
    StudentCreate,
    StudentUpdate,
    StudentResponse,
)

from app.services.student_service import (
    create_student,
    get_students,
    get_student,
    update_student,
    delete_student,
)


router = APIRouter(
    prefix="/students",
    tags=["Students"],
)


@router.post(
    "/self-register",
    response_model=StudentResponse,
    status_code=status.HTTP_201_CREATED,
)
def self_register(
    student: StudentCreate,
    db: Session = Depends(get_db),
):
    """
    Public, unauthenticated endpoint that lets a student submit their
    own project details (name, matric number, supervisor, project
    title, programme, level, session) ahead of their presentation.
    Insert-only -- editing or deleting a record still requires a
    logged-in staff account via the routes below.
    """

    try:
        new_student = create_student(
            db,
            student,
            user_id=None,
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
    try:
        new_student = create_student(
            db,
            student,
            current_user.id,
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
    student = update_student(
        db,
        student_id,
        student_data,
        current_user.id,
    )

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    return student


@router.delete(
    "/{student_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete(
    student_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
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
