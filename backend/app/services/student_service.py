from sqlalchemy.orm import Session
from typing import Optional

from app.models.student import Student
from app.models.academic import (
    Programme,
    Level,
    AcademicSession,
)
from app.schemas.student import (
    StudentCreate,
    StudentUpdate,
)
from app.services.audit_service import create_audit_log


def create_student(
    db: Session,
    student_data: StudentCreate,
    user_id: Optional[int] = None,
):
    # Check for duplicate matric number
    existing_student = (
        db.query(Student)
        .filter(
            Student.matric_number
            == student_data.matric_number
        )
        .first()
    )

    if existing_student:
        return None

    # Check programme exists
    programme = (
        db.query(Programme)
        .filter(
            Programme.id
            == student_data.programme_id
        )
        .first()
    )

    if not programme:
        raise ValueError("Programme not found")

    # Check level exists
    level = (
        db.query(Level)
        .filter(
            Level.id
            == student_data.level_id
        )
        .first()
    )

    if not level:
        raise ValueError("Level not found")

    # Check academic session exists
    academic_session = (
        db.query(AcademicSession)
        .filter(
            AcademicSession.id
            == student_data.academic_session_id
        )
        .first()
    )

    if not academic_session:
        raise ValueError(
            "Academic session not found"
        )

    # Create student
    student = Student(
        **student_data.model_dump()
    )

    db.add(student)
    db.commit()
    db.refresh(student)

    # Create audit log
    create_audit_log(
        db=db,
        user_id=user_id,
        action="CREATE",
        entity_type="Student",
        entity_id=str(student.id),
        details=(
            f"Self-registered as {student.matric_number}"
            if user_id is None
            else f"Created student {student.matric_number}"
        ),
    )

    return student


def get_students(
    db: Session,
):
    return (
        db.query(Student)
        .all()
    )


def get_student(
    db: Session,
    student_id: int,
):
    return (
        db.query(Student)
        .filter(
            Student.id == student_id
        )
        .first()
    )


def update_student(
    db: Session,
    student_id: int,
    data: StudentUpdate,
    user_id: int,
):
    student = get_student(
        db,
        student_id,
    )

    if not student:
        return None

    changes = data.model_dump(
        exclude_unset=True
    )

    for key, value in changes.items():
        setattr(
            student,
            key,
            value,
        )

    db.commit()
    db.refresh(student)

    # Create audit log
    create_audit_log(
        db=db,
        user_id=user_id,
        action="UPDATE",
        entity_type="Student",
        entity_id=str(student.id),
        details=(
            f"Updated student "
            f"{student.matric_number}"
        ),
    )

    return student


def delete_student(
    db: Session,
    student_id: int,
    user_id: int,
):
    student = get_student(
        db,
        student_id,
    )

    if not student:
        return False

    matric_number = student.matric_number
    student_id_value = student.id

    db.delete(student)
    db.commit()

    # Create audit log
    create_audit_log(
        db=db,
        user_id=user_id,
        action="DELETE",
        entity_type="Student",
        entity_id=str(student_id_value),
        details=(
            f"Deleted student "
            f"{matric_number}"
        ),
    )

    return True
