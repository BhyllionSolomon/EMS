from decimal import Decimal
from typing import Optional

from sqlalchemy import CheckConstraint, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Assessment(Base, TimestampMixin):
    __tablename__ = "assessments"

    id: Mapped[int] = mapped_column(primary_key=True)

    student_id: Mapped[int] = mapped_column(
        ForeignKey("students.id"),
        nullable=False,
        index=True,
    )

    assessor_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    dressing_appearance: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        nullable=False,
    )

    oral_presentation: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        nullable=False,
    )

    slide_presentation: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        nullable=False,
    )

    depth_of_understanding: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        nullable=False,
    )

    project_implementation: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        nullable=False,
    )

    referencing_documentation: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        nullable=False,
    )

    contribution_originality: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        nullable=False,
    )

    professional_conduct: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        nullable=False,
    )

    total_score: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        nullable=False,
    )

    remarks: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    recommendation: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    is_deleted: Mapped[bool] = mapped_column(
        default=False,
        nullable=False,
    )

    student: Mapped["Student"] = relationship(
        back_populates="assessments"
    )

    assessor: Mapped["User"] = relationship(
        back_populates="assessments"
    )

    __table_args__ = (
        CheckConstraint(
            "dressing_appearance >= 0 AND dressing_appearance <= 10",
            name="ck_dressing_appearance",
        ),
        CheckConstraint(
            "oral_presentation >= 0 AND oral_presentation <= 10",
            name="ck_oral_presentation",
        ),
        CheckConstraint(
            "slide_presentation >= 0 AND slide_presentation <= 10",
            name="ck_slide_presentation",
        ),
        CheckConstraint(
            "depth_of_understanding >= 0 AND depth_of_understanding <= 15",
            name="ck_depth_understanding",
        ),
        CheckConstraint(
            "project_implementation >= 0 AND project_implementation <= 15",
            name="ck_project_implementation",
        ),
        CheckConstraint(
            "referencing_documentation >= 0 AND referencing_documentation <= 15",
            name="ck_referencing_documentation",
        ),
        CheckConstraint(
            "contribution_originality >= 0 AND contribution_originality <= 15",
            name="ck_contribution_originality",
        ),
        CheckConstraint(
            "professional_conduct >= 0 AND professional_conduct <= 10",
            name="ck_professional_conduct",
        ),
        CheckConstraint(
            "total_score >= 0 AND total_score <= 100",
            name="ck_total_score",
        ),
    )


class AssessmentRubric(Base, TimestampMixin):
    __tablename__ = "assessment_rubrics"

    id: Mapped[int] = mapped_column(primary_key=True)

    criterion_name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    maximum_score: Mapped[int] = mapped_column(
        nullable=False,
    )

    display_order: Mapped[int] = mapped_column(
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        default=True,
        nullable=False,
    )