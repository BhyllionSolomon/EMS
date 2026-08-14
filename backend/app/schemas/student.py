from datetime import date, datetime
from pydantic import BaseModel

from app.schemas.academic import (
    ProgrammeResponse,
    LevelResponse,
    SessionResponse,
)


class StudentBase(BaseModel):
    matric_number: str
    full_name: str
    programme_id: int
    level_id: int
    academic_session_id: int
    project_title: str
    supervisor: str | None = None
    presentation_date: date | None = None


class StudentCreate(StudentBase):
    pass


class StudentUpdate(BaseModel):
    full_name: str | None = None
    project_title: str | None = None
    supervisor: str | None = None
    presentation_date: date | None = None


class StudentResponse(StudentBase):
    id: int
    created_at: datetime

    # Nested objects so the frontend can display names directly,
    # without a separate lookup call per id.
    programme: ProgrammeResponse | None = None
    level: LevelResponse | None = None
    academic_session: SessionResponse | None = None

    class Config:
        from_attributes = True
