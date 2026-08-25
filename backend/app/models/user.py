from typing import List, Optional

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)

    username: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        unique=True,
        index=True,
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    full_name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    role: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="assessor",
    )

    # Which department this account belongs to -- currently only used
    # to scope SIWES coordinators (they only see students in their own
    # department). Nullable/unused for other roles for now; the scoping
    # model is deliberately department-based from the start so it holds
    # up once other departments start using this system, not just CSDT.
    department_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("departments.id"),
        nullable=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    is_deleted: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    department: Mapped[Optional["Department"]] = relationship()

    assessments: Mapped[List["Assessment"]] = relationship(
        back_populates="assessor"
    )

    audit_logs: Mapped[List["AuditLog"]] = relationship(
        back_populates="user"
    )
