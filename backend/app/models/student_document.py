from typing import Optional

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class StudentDocument(Base, TimestampMixin):
    __tablename__ = "student_documents"

    id: Mapped[int] = mapped_column(primary_key=True)

    student_id: Mapped[int] = mapped_column(
        ForeignKey("students.id"),
        nullable=False,
        index=True,
    )

    # Original filename as uploaded, shown in the UI.
    file_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    # Randomised name the file is actually stored under on disk, so
    # two students uploading "report.pdf" never collide.
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

    student: Mapped["Student"] = relationship(
        back_populates="documents"
    )

    uploaded_by: Mapped[Optional["User"]] = relationship()
