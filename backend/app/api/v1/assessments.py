from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth_dependency import get_current_user
from app.core.role_dependency import require_role

from app.schemas.assessment import (
    AssessmentCreate,
    AssessmentResponse,
    StudentAssessmentReport,
)

from app.services.assessment_service import (
    create_or_update_assessment,
    delete_assessment,
    get_all_assessments,
    get_assessment,
    get_student_assessments,
    get_student_report,
)


router = APIRouter(
    prefix="/assessments",
    tags=["Assessments"],
)


def _block_students(current_user):
    # Every endpoint here was written when every authenticated user
    # was trusted staff. Now that "student" is a real login, it must
    # be explicitly kept out of scoring, reports, and score lists --
    # none of that is exposed to the student-facing workflow.
    if current_user.role == "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not available to student accounts",
        )


@router.get(
    "/",
    response_model=list[AssessmentResponse],
)
def read_all_assessments(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _block_students(current_user)
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
    """
    Submit or update one of the (up to 4) internal lecturer scores for a
    student. Calling this again for the same student simply updates the
    calling lecturer's own previous score.
    """

    _block_students(current_user)

    try:
        return create_or_update_assessment(
            db=db,
            assessment_data=assessment,
            assessor_id=current_user.id,
            assessment_type="internal",
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.post(
    "/external",
    response_model=AssessmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_external(
    assessment: AssessmentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role("admin", "external_supervisor")
    ),
):
    """
    Submit or update the external supervisor's final-stage score.
    Only allowed once all 4 internal lecturer assessments are in.
    """

    try:
        return create_or_update_assessment(
            db=db,
            assessment_data=assessment,
            assessor_id=current_user.id,
            assessment_type="external",
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
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
    _block_students(current_user)

    assessment = get_assessment(db, assessment_id)

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
    _block_students(current_user)
    return get_student_assessments(db, student_id)


@router.get(
    "/student/{student_id}/report",
    response_model=StudentAssessmentReport,
)
def read_student_report(
    student_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Aggregate report: once all 4 lecturers have scored a student, this
    returns the averaged score, recommendation, auto-generated areas to
    improve, and each lecturer's remarks -- everything the student needs
    before facing the external supervisor.
    """

    _block_students(current_user)

    return get_student_report(db, student_id)


@router.delete(
    "/{assessment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _block_students(current_user)

    assessment = delete_assessment(db, assessment_id)

    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found",
        )

    return None
