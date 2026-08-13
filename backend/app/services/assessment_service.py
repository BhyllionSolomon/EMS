from decimal import Decimal
from typing import Optional

from sqlalchemy.orm import Session

from app.models.assessment import Assessment
from app.models.student import Student
from app.models.user import User
from app.schemas.assessment import AssessmentCreate, StudentAssessmentReport, LecturerComment


# How many department lecturers must independently score a student
# before the internal stage is considered complete and the external
# supervisor is allowed to score them.
REQUIRED_INTERNAL_ASSESSMENTS = 4

CRITERIA_FIELDS = [
    "dress",
    "report_format",
    "problem_solved",
    "clarity_of_writeup",
    "result_presentation",
    "evidence_of_understanding",
    "knowledge_contribution",
    "reference",
]

MAX_SCORES = {
    "dress": Decimal("10"),
    "report_format": Decimal("10"),
    "problem_solved": Decimal("15"),
    "clarity_of_writeup": Decimal("10"),
    "result_presentation": Decimal("15"),
    "evidence_of_understanding": Decimal("10"),
    "knowledge_contribution": Decimal("15"),
    "reference": Decimal("15"),
}

CRITERION_LABELS = {
    "dress": "Dress & Appearance",
    "report_format": "Report Format",
    "problem_solved": "Problem Solved",
    "clarity_of_writeup": "Clarity of Write-up",
    "result_presentation": "Result Presentation",
    "evidence_of_understanding": "Evidence of Understanding",
    "knowledge_contribution": "Knowledge Contribution",
    "reference": "Reference",
}

# A criterion is flagged as an "area to improve" once the average score
# falls below this fraction of the maximum obtainable score.
IMPROVEMENT_THRESHOLD = Decimal("0.6")

IMPROVEMENT_SUGGESTIONS = {
    "dress": "Dress more formally and appropriately for the presentation.",
    "report_format": "Improve the structure and formatting of the written report.",
    "problem_solved": "Clarify how the stated problem was actually solved; strengthen the solution.",
    "clarity_of_writeup": "Rewrite unclear sections of the report for better readability.",
    "result_presentation": "Present results more clearly, e.g. with better charts, tables, or explanations.",
    "evidence_of_understanding": "Be ready to demonstrate deeper understanding of the project's concepts.",
    "knowledge_contribution": "Strengthen the project's original contribution to knowledge.",
    "reference": "Add more references and format citations consistently.",
}


def calculate_total_score(scores: dict) -> Decimal:
    return sum((scores[field] for field in CRITERIA_FIELDS), Decimal("0"))


def calculate_recommendation(total_score: Decimal) -> str:
    return "Pass" if total_score >= Decimal("50") else "Fail"


def get_all_assessments(db: Session):
    return (
        db.query(Assessment)
        .filter(Assessment.is_deleted == False)
        .all()
    )


def get_assessment(db: Session, assessment_id: int):
    return (
        db.query(Assessment)
        .filter(
            Assessment.id == assessment_id,
            Assessment.is_deleted == False,
        )
        .first()
    )


def get_student_assessments(db: Session, student_id: int):
    return (
        db.query(Assessment)
        .filter(
            Assessment.student_id == student_id,
            Assessment.is_deleted == False,
        )
        .all()
    )


def _internal_assessments(db: Session, student_id: int):
    return (
        db.query(Assessment)
        .filter(
            Assessment.student_id == student_id,
            Assessment.assessment_type == "internal",
            Assessment.is_deleted == False,
        )
        .all()
    )


def create_or_update_assessment(
    db: Session,
    assessment_data: AssessmentCreate,
    assessor_id: int,
    assessment_type: str = "internal",
) -> Assessment:
    student = (
        db.query(Student)
        .filter(Student.id == assessment_data.student_id)
        .first()
    )

    if not student:
        raise ValueError("Student not found")

    if assessment_type == "external":
        internal_count = len(
            _internal_assessments(db, assessment_data.student_id)
        )

        if internal_count < REQUIRED_INTERNAL_ASSESSMENTS:
            raise ValueError(
                "The 4 internal lecturer assessments must be completed "
                f"before the external supervisor can score this student "
                f"({internal_count}/{REQUIRED_INTERNAL_ASSESSMENTS} so far)."
            )

    scores = {
        field: getattr(assessment_data, field)
        for field in CRITERIA_FIELDS
    }

    total_score = calculate_total_score(scores)
    recommendation = calculate_recommendation(total_score)

    existing = (
        db.query(Assessment)
        .filter(
            Assessment.student_id == assessment_data.student_id,
            Assessment.assessor_id == assessor_id,
            Assessment.assessment_type == assessment_type,
            Assessment.is_deleted == False,
        )
        .first()
    )

    if existing:
        for field in CRITERIA_FIELDS:
            setattr(existing, field, scores[field])

        existing.total_score = total_score
        existing.recommendation = recommendation
        existing.remarks = assessment_data.remarks

        db.commit()
        db.refresh(existing)

        return existing

    assessment = Assessment(
        student_id=assessment_data.student_id,
        assessor_id=assessor_id,
        assessment_type=assessment_type,
        total_score=total_score,
        recommendation=recommendation,
        remarks=assessment_data.remarks,
        **scores,
    )

    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    return assessment


def delete_assessment(db: Session, assessment_id: int):
    assessment = get_assessment(db, assessment_id)

    if not assessment:
        return None

    assessment.is_deleted = True

    db.commit()
    db.refresh(assessment)

    return assessment


def get_student_report(db: Session, student_id: int) -> StudentAssessmentReport:
    internal = _internal_assessments(db, student_id)

    submitted = len(internal)

    if submitted < REQUIRED_INTERNAL_ASSESSMENTS:
        return StudentAssessmentReport(
            student_id=student_id,
            status="pending",
            internal_assessments_submitted=submitted,
            internal_assessments_required=REQUIRED_INTERNAL_ASSESSMENTS,
        )

    # Average each criterion across all lecturers who scored this student.
    averages = {}

    for field in CRITERIA_FIELDS:
        total = sum((getattr(a, field) for a in internal), Decimal("0"))
        averages[field] = total / Decimal(len(internal))

    average_total = calculate_total_score(averages)
    recommendation = calculate_recommendation(average_total)

    areas_to_improve = []

    for field in CRITERIA_FIELDS:
        threshold = MAX_SCORES[field] * IMPROVEMENT_THRESHOLD

        if averages[field] < threshold:
            areas_to_improve.append(IMPROVEMENT_SUGGESTIONS[field])

    lecturer_comments = []

    for a in internal:
        if a.remarks:
            lecturer = db.query(User).filter(User.id == a.assessor_id).first()

            lecturer_comments.append(
                LecturerComment(
                    lecturer_name=lecturer.full_name if lecturer else "Unknown",
                    remarks=a.remarks,
                )
            )

    external = (
        db.query(Assessment)
        .filter(
            Assessment.student_id == student_id,
            Assessment.assessment_type == "external",
            Assessment.is_deleted == False,
        )
        .first()
    )

    return StudentAssessmentReport(
        student_id=student_id,
        status="ready",
        internal_assessments_submitted=submitted,
        internal_assessments_required=REQUIRED_INTERNAL_ASSESSMENTS,
        internal_average_total=average_total,
        internal_recommendation=recommendation,
        areas_to_improve=areas_to_improve,
        lecturer_comments=lecturer_comments,
        external_assessment=external,
    )
