from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.assessment import Assessment
from app.models.student import Student
from app.schemas.assessment import AssessmentCreate


def calculate_total_score(
    assessment_data: AssessmentCreate,
) -> Decimal:

    total = (
        assessment_data.dressing_appearance
        + assessment_data.oral_presentation
        + assessment_data.slide_presentation
        + assessment_data.depth_of_understanding
        + assessment_data.project_implementation
        + assessment_data.referencing_documentation
        + assessment_data.contribution_originality
        + assessment_data.professional_conduct
    )

    return total


def calculate_recommendation(
    total_score: Decimal,
) -> str:

    if total_score >= Decimal("50"):
        return "Pass"

    return "Fail"


def get_all_assessments(
    db: Session,
):
    return (
        db.query(Assessment)
        .filter(
            Assessment.is_deleted == False
        )
        .all()
    )


def get_assessment(
    db: Session,
    assessment_id: int,
):
    return (
        db.query(Assessment)
        .filter(
            Assessment.id == assessment_id,
            Assessment.is_deleted == False,
        )
        .first()
    )


def get_student_assessments(
    db: Session,
    student_id: int,
):
    return (
        db.query(Assessment)
        .filter(
            Assessment.student_id == student_id,
            Assessment.is_deleted == False,
        )
        .all()
    )


def create_assessment(
    db: Session,
    assessment_data: AssessmentCreate,
    assessor_id: int,
):
    # Check that the student exists
    student = (
        db.query(Student)
        .filter(
            Student.id == assessment_data.student_id
        )
        .first()
    )

    if not student:
        raise ValueError(
            "Student not found"
        )

    # Calculate total score on the server
    total_score = calculate_total_score(
        assessment_data
    )

    # Calculate recommendation on the server
    recommendation = calculate_recommendation(
        total_score
    )

    # Create assessment
    assessment = Assessment(
        student_id=assessment_data.student_id,

        dressing_appearance=(
            assessment_data.dressing_appearance
        ),

        oral_presentation=(
            assessment_data.oral_presentation
        ),

        slide_presentation=(
            assessment_data.slide_presentation
        ),

        depth_of_understanding=(
            assessment_data.depth_of_understanding
        ),

        project_implementation=(
            assessment_data.project_implementation
        ),

        referencing_documentation=(
            assessment_data.referencing_documentation
        ),

        contribution_originality=(
            assessment_data.contribution_originality
        ),

        professional_conduct=(
            assessment_data.professional_conduct
        ),

        total_score=total_score,

        recommendation=recommendation,

        remarks=assessment_data.remarks,

        assessor_id=assessor_id,
    )

    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    return assessment


def delete_assessment(
    db: Session,
    assessment_id: int,
):
    assessment = get_assessment(
        db,
        assessment_id,
    )

    if not assessment:
        return None

    assessment.is_deleted = True

    db.commit()
    db.refresh(assessment)

    return assessment