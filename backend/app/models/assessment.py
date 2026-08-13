from decimal import Decimal
from typing import Optional

from sqlalchemy import (
    Boolean,
    ForeignKey,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Assessment(Base, TimestampMixin):
    __tablename__ = "assessments"
    __table_args__ = (
        # One score per (student, assessor, stage). A lecturer or the
        # external supervisor re-submitting for the same student updates
        # their existing row instead of creating a duplicate.
        UniqueConstraint(
            "student_id",
            "assessor_id",
            "assessment_type",
            name="uq_assessment_student_assessor_type",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    student_id: Mapped[int] = mapped_column(
        ForeignKey("students.id"),
        nullable=False,
    )

    assessor_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    # "internal" = one of the (up to 4) department lecturers.
    # "external" = the external supervisor's final-stage score.
    assessment_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="internal",
        server_default="internal",
    )

    dress: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False
    )

    report_format: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False
    )

    problem_solved: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False
    )

    clarity_of_writeup: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False
    )

    result_presentation: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False
    )

    evidence_of_understanding: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False
    )

    knowledge_contribution: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False
    )

    reference: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False
    )

    total_score: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False
    )

    recommendation: Mapped[str] = mapped_column(
        String(20), nullable=False
    )

    remarks: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )

    is_deleted: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )

    student: Mapped["Student"] = relationship(
        back_populates="assessments"
    )

    assessor: Mapped["User"] = relationship(
        back_populates="assessments"
    )


class AssessmentRubric(Base, TimestampMixin):
    __tablename__ = "assessment_rubrics"

    id: Mapped[int] = mapped_column(primary_key=True)

    criterion: Mapped[str] = mapped_column(
        String(100), nullable=False, unique=True
    )

    max_score: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
