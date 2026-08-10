from datetime import date
from pydantic import BaseModel


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

    class Config:
        from_attributes = True