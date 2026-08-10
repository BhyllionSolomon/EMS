from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth_dependency import get_current_user

from app.schemas.assessment import (
    AssessmentCreate,
    AssessmentResponse,
)

from app.services.assessment_service import (
    create_assessment,
    delete_assessment,
    get_all_assessments,
    get_assessment,
    get_student_assessments,
)


router = APIRouter(
    prefix="/assessments",
    tags=["Assessments"],
)


@router.get(
    "/",
    response_model=list[AssessmentResponse],
)
def read_all_assessments(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return get_all_assessments(db)


@router.post(
    "/",
    response_model=AssessmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create(
    assessment: AssessmentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        return create_assessment(
            db=db,
            assessment_data=assessment,
            assessor_id=current_user.id,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.get(
    "/{assessment_id}",
    response_model=AssessmentResponse,
)
def read_one(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    assessment = get_assessment(
        db,
        assessment_id,
    )

    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found",
        )

    return assessment


@router.get(
    "/student/{student_id}",
    response_model=list[AssessmentResponse],
)
def read_student_assessments(
    student_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return get_student_assessments(
        db,
        student_id,
    )


@router.delete(
    "/{assessment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    assessment = delete_assessment(
        db,
        assessment_id,
    )

    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found",
        )

    return None