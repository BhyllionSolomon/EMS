from decimal import Decimal
from typing import Optional

from sqlalchemy import Boolean, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Assessment(Base, TimestampMixin):
    __tablename__ = "assessments"

    id: Mapped[int] = mapped_column(primary_key=True)

    student_id: Mapped[int] = mapped_column(
        ForeignKey("students.id"),
        nullable=False,
    )

    assessor_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    dressing_appearance: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False
    )

    oral_presentation: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False
    )

    slide_presentation: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False
    )

    depth_of_understanding: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False
    )

    project_implementation: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False
    )

    referencing_documentation: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False
    )

    contribution_originality: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False
    )

    professional_conduct: Mapped[Decimal] = mapped_column(
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
