from datetime import date
from decimal import Decimal
from typing import Optional

from sqlalchemy import (
    Boolean,
    Date,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class SiwesPlacement(Base, TimestampMixin):
    """
    One per student -- where they're doing their industrial training.
    Created once, at the start of the placement (mirrors the
    Student's own registration -- an admin can also create/fix this
    on a student's behalf, same pattern as everywhere else).
    """

    __tablename__ = "siwes_placements"

    id: Mapped[int] = mapped_column(primary_key=True)

    student_id: Mapped[int] = mapped_column(
        ForeignKey("students.id"),
        nullable=False,
        unique=True,
    )

    company_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    company_address: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    # Kept as plain text, not a login -- the industry supervisor
    # never needs an account in this system.
    industry_supervisor_name: Mapped[Optional[str]] = mapped_column(
        String(200),
        nullable=True,
    )

    start_date: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
    )

    end_date: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
    )

    created_by_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
    )

    student: Mapped["Student"] = relationship()

    created_by: Mapped[Optional["User"]] = relationship()

    log_entries: Mapped[list["SiwesLogEntry"]] = relationship(
        back_populates="placement",
        cascade="all, delete-orphan",
    )

    coordinator_comments: Mapped[list["SiwesCoordinatorComment"]] = (
        relationship(
            back_populates="placement",
            cascade="all, delete-orphan",
        )
    )


class SiwesLogEntry(Base, TimestampMixin):
    """
    One week of the logbook. The mandatory signed-page photo lives on
    SiwesLogDocument -- an entry isn't really "complete" without one,
    enforced at the API layer rather than the database, so a student
    can still save a draft description before they've uploaded the
    photo.
    """

    __tablename__ = "siwes_log_entries"
    __table_args__ = (
        UniqueConstraint(
            "placement_id",
            "week_start_date",
            name="uq_siwes_log_placement_week",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    placement_id: Mapped[int] = mapped_column(
        ForeignKey("siwes_placements.id"),
        nullable=False,
    )

    week_start_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    week_end_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    submitted_by_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
    )

    placement: Mapped["SiwesPlacement"] = relationship(
        back_populates="log_entries"
    )

    submitted_by: Mapped[Optional["User"]] = relationship()

    documents: Mapped[list["SiwesLogDocument"]] = relationship(
        back_populates="log_entry",
        cascade="all, delete-orphan",
    )


class SiwesLogDocument(Base, TimestampMixin):
    """
    The mandatory photo/scan of the physically-signed weekly page.
    Same storage pattern as StudentDocument, just scoped to a log
    entry instead of a student directly.
    """

    __tablename__ = "siwes_log_documents"

    id: Mapped[int] = mapped_column(primary_key=True)

    log_entry_id: Mapped[int] = mapped_column(
        ForeignKey("siwes_log_entries.id"),
        nullable=False,
        index=True,
    )

    file_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    stored_filename: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True,
    )

    content_type: Mapped[Optional[str]] = mapped_column(
        String(150),
        nullable=True,
    )

    file_size: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    uploaded_by_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
    )

    log_entry: Mapped["SiwesLogEntry"] = relationship(
        back_populates="documents"
    )

    uploaded_by: Mapped[Optional["User"]] = relationship()


class SiwesCoordinatorComment(Base, TimestampMixin):
    """
    A departmental SIWES coordinator's notes from a supervision visit
    -- separate from, and much less frequent than, the industry
    supervisor's weekly sign-off.
    """

    __tablename__ = "siwes_coordinator_comments"

    id: Mapped[int] = mapped_column(primary_key=True)

    placement_id: Mapped[int] = mapped_column(
        ForeignKey("siwes_placements.id"),
        nullable=False,
    )

    coordinator_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    comment: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    visit_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    placement: Mapped["SiwesPlacement"] = relationship(
        back_populates="coordinator_comments"
    )

    coordinator: Mapped["User"] = relationship()


class SiwesAssessment(Base, TimestampMixin):
    """
    The October presentation score -- its own rubric (see
    siwes_assessment_service.py), independent of the Final Year
    Project's Assessment table. Same multi-assessor-then-average
    pattern, in its own table so neither module can break the other.
    """

    __tablename__ = "siwes_assessments"
    __table_args__ = (
        UniqueConstraint(
            "student_id",
            "assessor_id",
            name="uq_siwes_assessment_student_assessor",
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

    originality: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False
    )

    clarity_of_writeup: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False
    )

    technicality: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False
    )

    dressing_grammar: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False
    )

    figures_pictures_titles: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False
    )

    project_goal: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False
    )

    report_formatting: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False
    )

    reference_apa: Mapped[Decimal] = mapped_column(
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

    student: Mapped["Student"] = relationship()

    assessor: Mapped["User"] = relationship()
