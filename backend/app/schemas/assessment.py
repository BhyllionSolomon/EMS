from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field


class AssessmentCreate(BaseModel):
    student_id: int

    dress: Decimal = Field(ge=0, le=10)
    report_format: Decimal = Field(ge=0, le=10)
    problem_solved: Decimal = Field(ge=0, le=15)
    clarity_of_writeup: Decimal = Field(ge=0, le=10)
    result_presentation: Decimal = Field(ge=0, le=15)
    evidence_of_understanding: Decimal = Field(ge=0, le=10)
    knowledge_contribution: Decimal = Field(ge=0, le=15)
    reference: Decimal = Field(ge=0, le=15)

    remarks: Optional[str] = None


class AssessmentResponse(BaseModel):
    id: int
    student_id: int
    assessor_id: int
    assessment_type: str

    dress: Decimal
    report_format: Decimal
    problem_solved: Decimal
    clarity_of_writeup: Decimal
    result_presentation: Decimal
    evidence_of_understanding: Decimal
    knowledge_contribution: Decimal
    reference: Decimal

    total_score: Decimal
    recommendation: str
    remarks: Optional[str] = None
    is_deleted: bool

    class Config:
        from_attributes = True


class LecturerComment(BaseModel):
    lecturer_name: str
    remarks: str


class StudentAssessmentReport(BaseModel):
    student_id: int

    # "pending" while fewer than the required number of lecturers have
    # scored the student; "ready" once the internal stage is complete.
    status: str

    internal_assessments_submitted: int
    internal_assessments_required: int

    internal_average_total: Optional[Decimal] = None
    internal_recommendation: Optional[str] = None

    # Auto-generated pointers on what the student should fix before
    # facing the external supervisor, based on low-scoring criteria.
    areas_to_improve: List[str] = []

    lecturer_comments: List[LecturerComment] = []

    external_assessment: Optional[AssessmentResponse] = None
