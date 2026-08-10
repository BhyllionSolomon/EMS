from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class AssessmentCreate(BaseModel):
    student_id: int

    dressing_appearance: Decimal = Field(
        ge=0,
        le=10,
    )

    oral_presentation: Decimal = Field(
        ge=0,
        le=10,
    )

    slide_presentation: Decimal = Field(
        ge=0,
        le=10,
    )

    depth_of_understanding: Decimal = Field(
        ge=0,
        le=15,
    )

    project_implementation: Decimal = Field(
        ge=0,
        le=15,
    )

    referencing_documentation: Decimal = Field(
        ge=0,
        le=15,
    )

    contribution_originality: Decimal = Field(
        ge=0,
        le=15,
    )

    professional_conduct: Decimal = Field(
        ge=0,
        le=10,
    )

    remarks: Optional[str] = None


class AssessmentResponse(BaseModel):
    student_id: int

    dressing_appearance: Decimal
    oral_presentation: Decimal
    slide_presentation: Decimal
    depth_of_understanding: Decimal
    project_implementation: Decimal
    referencing_documentation: Decimal
    contribution_originality: Decimal
    professional_conduct: Decimal

    total_score: Decimal
    remarks: Optional[str] = None
    recommendation: str

    id: int
    assessor_id: int
    is_deleted: bool

    class Config:
        from_attributes = True