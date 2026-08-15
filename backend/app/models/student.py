from datetime import date
from typing import Optional

from sqlalchemy import Date, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Student(Base, TimestampMixin):
    __tablename__ = "students"
    __table_args__ = (
        UniqueConstraint(
            "matric_number",
            "academic_session_id",
            name="uq_student_matric_session",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    matric_number: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )

    full_name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    programme_id: Mapped[int] = mapped_column(
        ForeignKey("programmes.id"),
        nullable=False,
    )

    level_id: Mapped[int] = mapped_column(
        ForeignKey("levels.id"),
        nullable=False,
    )

    academic_session_id: Mapped[int] = mapped_column(
        ForeignKey("academic_sessions.id"),
        nullable=False,
    )

    project_title: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    supervisor: Mapped[Optional[str]] = mapped_column(
        String(200),
        nullable=True,
    )

    presentation_date: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
    )

    # The student account this record belongs to, if the student
    # submitted it themselves (via their own login). Null for records
    # an admin/assessor created without a linked student account yet.
    user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
        unique=True,
    )

    # Whoever actually created this row -- a student self-submitting,
    # or an admin/assessor filling it in on the student's behalf.
    # Kept separate from user_id so a record can be self-submitted
    # (user_id == created_by_id) vs admin-assisted (they differ).
    created_by_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
    )

    programme: Mapped["Programme"] = relationship(
        back_populates="students"
    )

    level: Mapped["Level"] = relationship()

    academic_session: Mapped["AcademicSession"] = relationship()

    owner: Mapped[Optional["User"]] = relationship(
        foreign_keys=[user_id],
    )

    created_by: Mapped[Optional["User"]] = relationship(
        foreign_keys=[created_by_id],
    )

    assessments: Mapped[list["Assessment"]] = relationship(
        back_populates="student",
        cascade="all, delete-orphan",
    )

    documents: Mapped[list["StudentDocument"]] = relationship(
        back_populates="student",
        cascade="all, delete-orphan",
    )
