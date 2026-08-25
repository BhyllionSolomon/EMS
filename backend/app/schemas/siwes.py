from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field

from app.schemas.student_document import DocumentResponse


# ---------------------------------------------------------------
# Placement
# ---------------------------------------------------------------


class SiwesPlacementCreate(BaseModel):
    company_name: str
    company_address: str
    industry_supervisor_name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class SiwesPlacementUpdate(BaseModel):
    company_name: Optional[str] = None
    company_address: Optional[str] = None
    industry_supervisor_name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class SiwesPlacementResponse(BaseModel):
    id: int
    student_id: int
    company_name: str
    company_address: str
    industry_supervisor_name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    created_by_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------
# Weekly log entries
# ---------------------------------------------------------------


class SiwesLogEntryCreate(BaseModel):
    week_start_date: date
    week_end_date: date
    description: str


class SiwesLogEntryResponse(BaseModel):
    id: int
    placement_id: int
    week_start_date: date
    week_end_date: date
    description: str
    submitted_by_id: Optional[int] = None
    created_at: datetime
    documents: List[DocumentResponse] = []

    class Config:
        from_attributes = True


# ---------------------------------------------------------------
# Coordinator comments
# ---------------------------------------------------------------


class SiwesCoordinatorCommentCreate(BaseModel):
    comment: str
    visit_date: date


class SiwesCoordinatorCommentResponse(BaseModel):
    id: int
    placement_id: int
    coordinator_id: int
    coordinator_name: Optional[str] = None
    comment: str
    visit_date: date
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------
# Assessment (October presentation)
# ---------------------------------------------------------------


class SiwesAssessmentCreate(BaseModel):
    student_id: int

    originality: Decimal = Field(ge=0, le=15)
    clarity_of_writeup: Decimal = Field(ge=0, le=10)
    technicality: Decimal = Field(ge=0, le=10)
    dressing_grammar: Decimal = Field(ge=0, le=10)
    figures_pictures_titles: Decimal = Field(ge=0, le=10)
    project_goal: Decimal = Field(ge=0, le=15)
    report_formatting: Decimal = Field(ge=0, le=15)
    reference_apa: Decimal = Field(ge=0, le=15)

    remarks: Optional[str] = None


class SiwesAssessmentResponse(BaseModel):
    id: int
    student_id: int
    assessor_id: int

    originality: Decimal
    clarity_of_writeup: Decimal
    technicality: Decimal
    dressing_grammar: Decimal
    figures_pictures_titles: Decimal
    project_goal: Decimal
    report_formatting: Decimal
    reference_apa: Decimal

    total_score: Decimal
    recommendation: str
    remarks: Optional[str] = None
    is_deleted: bool

    class Config:
        from_attributes = True


class SiwesAssessorComment(BaseModel):
    assessor_name: str
    remarks: str


class SiwesStudentReport(BaseModel):
    student_id: int

    status: str

    assessments_submitted: int
    assessments_required: int

    average_total: Optional[Decimal] = None
    recommendation: Optional[str] = None

    areas_to_improve: List[str] = []

    assessor_comments: List[SiwesAssessorComment] = []
