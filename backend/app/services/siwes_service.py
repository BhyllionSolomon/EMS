from typing import Optional

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.siwes import (
    SiwesPlacement,
    SiwesLogEntry,
    SiwesCoordinatorComment,
)
from app.models.student import Student
from app.schemas.siwes import (
    SiwesPlacementCreate,
    SiwesPlacementUpdate,
    SiwesLogEntryCreate,
    SiwesCoordinatorCommentCreate,
)


# ---------------------------------------------------------------
# Placement
# ---------------------------------------------------------------


def get_placement(db: Session, placement_id: int) -> Optional[SiwesPlacement]:
    return (
        db.query(SiwesPlacement)
        .filter(SiwesPlacement.id == placement_id)
        .first()
    )


def get_placement_by_student(
    db: Session, student_id: int
) -> Optional[SiwesPlacement]:
    return (
        db.query(SiwesPlacement)
        .filter(SiwesPlacement.student_id == student_id)
        .first()
    )


def get_all_placements(db: Session):
    return db.query(SiwesPlacement).all()


def create_placement(
    db: Session,
    student_id: int,
    data: SiwesPlacementCreate,
    created_by_id: Optional[int],
) -> SiwesPlacement:
    placement = SiwesPlacement(
        student_id=student_id,
        company_name=data.company_name,
        company_address=data.company_address,
        industry_supervisor_name=data.industry_supervisor_name,
        start_date=data.start_date,
        end_date=data.end_date,
        created_by_id=created_by_id,
    )

    db.add(placement)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()

        raise ValueError(
            "This student already has a SIWES placement recorded."
        )

    db.refresh(placement)

    return placement


def update_placement(
    db: Session,
    placement: SiwesPlacement,
    data: SiwesPlacementUpdate,
) -> SiwesPlacement:
    updates = data.model_dump(exclude_unset=True)

    for field, value in updates.items():
        setattr(placement, field, value)

    db.commit()
    db.refresh(placement)

    return placement


# ---------------------------------------------------------------
# Weekly log entries
# ---------------------------------------------------------------


def get_log_entries(db: Session, placement_id: int):
    return (
        db.query(SiwesLogEntry)
        .filter(SiwesLogEntry.placement_id == placement_id)
        .order_by(SiwesLogEntry.week_start_date)
        .all()
    )


def get_log_entry(db: Session, log_entry_id: int) -> Optional[SiwesLogEntry]:
    return (
        db.query(SiwesLogEntry)
        .filter(SiwesLogEntry.id == log_entry_id)
        .first()
    )


def create_log_entry(
    db: Session,
    placement_id: int,
    data: SiwesLogEntryCreate,
    submitted_by_id: Optional[int],
) -> SiwesLogEntry:
    entry = SiwesLogEntry(
        placement_id=placement_id,
        week_start_date=data.week_start_date,
        week_end_date=data.week_end_date,
        description=data.description,
        submitted_by_id=submitted_by_id,
    )

    db.add(entry)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()

        raise ValueError(
            "A log entry for this week already exists. Edit that "
            "one instead of creating a new one."
        )

    db.refresh(entry)

    return entry


def update_log_entry(
    db: Session,
    entry: SiwesLogEntry,
    description: str,
) -> SiwesLogEntry:
    entry.description = description

    db.commit()
    db.refresh(entry)

    return entry


def delete_log_entry(db: Session, entry: SiwesLogEntry) -> None:
    db.delete(entry)
    db.commit()


# ---------------------------------------------------------------
# Coordinator comments
# ---------------------------------------------------------------


def get_coordinator_comments(db: Session, placement_id: int):
    return (
        db.query(SiwesCoordinatorComment)
        .filter(SiwesCoordinatorComment.placement_id == placement_id)
        .order_by(SiwesCoordinatorComment.visit_date.desc())
        .all()
    )


def create_coordinator_comment(
    db: Session,
    placement_id: int,
    coordinator_id: int,
    data: SiwesCoordinatorCommentCreate,
) -> SiwesCoordinatorComment:
    comment = SiwesCoordinatorComment(
        placement_id=placement_id,
        coordinator_id=coordinator_id,
        comment=data.comment,
        visit_date=data.visit_date,
    )

    db.add(comment)
    db.commit()
    db.refresh(comment)

    return comment


# ---------------------------------------------------------------
# Coordinator scoping (department-based, see User.department_id)
# ---------------------------------------------------------------


def coordinator_can_access_placement(
    db: Session,
    coordinator_department_id: Optional[int],
    placement: SiwesPlacement,
) -> bool:
    """
    A coordinator only sees placements for students in their own
    department -- admins bypass this check entirely (they're the
    university-level view for now, until that becomes its own role).
    """

    if coordinator_department_id is None:
        return False

    student = (
        db.query(Student)
        .filter(Student.id == placement.student_id)
        .first()
    )

    if not student:
        return False

    return student.programme.department_id == coordinator_department_id
