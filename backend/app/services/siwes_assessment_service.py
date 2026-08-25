from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.siwes import SiwesAssessment
from app.models.student import Student
from app.models.user import User
from app.schemas.siwes import (
    SiwesAssessmentCreate,
    SiwesStudentReport,
    SiwesAssessorComment,
)


# How many assessors must independently score a SIWES presentation
# before it's considered complete. Kept as its own constant, separate
# from the FYP module's REQUIRED_INTERNAL_ASSESSMENTS, since there's
# no confirmed department policy yet on how many SIWES assessors are
# assigned per student -- adjust this single number if it turns out
# to be more than one in practice.
REQUIRED_ASSESSMENTS = 1

CRITERIA_FIELDS = [
    "originality",
    "clarity_of_writeup",
    "technicality",
    "dressing_grammar",
    "figures_pictures_titles",
    "project_goal",
    "report_formatting",
    "reference_apa",
]

MAX_SCORES = {
    "originality": Decimal("15"),
    "clarity_of_writeup": Decimal("10"),
    "technicality": Decimal("10"),
    "dressing_grammar": Decimal("10"),
    "figures_pictures_titles": Decimal("10"),
    "project_goal": Decimal("15"),
    "report_formatting": Decimal("15"),
    "reference_apa": Decimal("15"),
}

CRITERION_LABELS = {
    "originality": "Originality of Write-up",
    "clarity_of_writeup": "Clarity of Write-up",
    "technicality": "Technicality",
    "dressing_grammar": "Dressing / Grammar",
    "figures_pictures_titles": "Figures, Pictures & Titles",
    "project_goal": "Project Goal",
    "report_formatting": "Report Formatting",
    "reference_apa": "Reference (APA Format)",
}

IMPROVEMENT_THRESHOLD = Decimal("0.6")

IMPROVEMENT_SUGGESTIONS = {
    "originality": "Strengthen the originality of the write-up's ideas and contribution.",
    "clarity_of_writeup": "Rewrite unclear sections of the report for better readability.",
    "technicality": "Deepen the technical detail and accuracy of the report.",
    "dressing_grammar": "Proofread more carefully and dress appropriately for the presentation.",
    "figures_pictures_titles": "Add clearer figures, pictures, and properly labelled titles.",
    "project_goal": "State the project's goal and objectives more clearly.",
    "report_formatting": "Follow the required report formatting more closely.",
    "reference_apa": "Correct the reference list to consistently follow APA format.",
}


def calculate_total_score(scores: dict) -> Decimal:
    return sum((scores[field] for field in CRITERIA_FIELDS), Decimal("0"))


def calculate_recommendation(total_score: Decimal) -> str:
    return "Pass" if total_score >= Decimal("50") else "Fail"


def get_all_assessments(db: Session):
    return (
        db.query(SiwesAssessment)
        .filter(SiwesAssessment.is_deleted == False)
        .all()
    )


def get_assessment(db: Session, assessment_id: int):
    return (
        db.query(SiwesAssessment)
        .filter(
            SiwesAssessment.id == assessment_id,
            SiwesAssessment.is_deleted == False,
        )
        .first()
    )


def _student_assessments(db: Session, student_id: int):
    return (
        db.query(SiwesAssessment)
        .filter(
            SiwesAssessment.student_id == student_id,
            SiwesAssessment.is_deleted == False,
        )
        .all()
    )


def create_or_update_assessment(
    db: Session,
    data: SiwesAssessmentCreate,
    assessor_id: int,
) -> SiwesAssessment:
    student = (
        db.query(Student)
        .filter(Student.id == data.student_id)
        .first()
    )

    if not student:
        raise ValueError("Student not found")

    scores = {
        field: getattr(data, field) for field in CRITERIA_FIELDS
    }

    total_score = calculate_total_score(scores)
    recommendation = calculate_recommendation(total_score)

    existing = (
        db.query(SiwesAssessment)
        .filter(
            SiwesAssessment.student_id == data.student_id,
            SiwesAssessment.assessor_id == assessor_id,
            SiwesAssessment.is_deleted == False,
        )
        .first()
    )

    if existing:
        for field in CRITERIA_FIELDS:
            setattr(existing, field, scores[field])

        existing.total_score = total_score
        existing.recommendation = recommendation
        existing.remarks = data.remarks

        db.commit()
        db.refresh(existing)

        return existing

    assessment = SiwesAssessment(
        student_id=data.student_id,
        assessor_id=assessor_id,
        total_score=total_score,
        recommendation=recommendation,
        remarks=data.remarks,
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


def get_student_report(db: Session, student_id: int) -> SiwesStudentReport:
    assessments = _student_assessments(db, student_id)

    submitted = len(assessments)

    if submitted < REQUIRED_ASSESSMENTS:
        return SiwesStudentReport(
            student_id=student_id,
            status="pending",
            assessments_submitted=submitted,
            assessments_required=REQUIRED_ASSESSMENTS,
        )

    averages = {}

    for field in CRITERIA_FIELDS:
        total = sum(
            (getattr(a, field) for a in assessments), Decimal("0")
        )
        averages[field] = total / Decimal(len(assessments))

    average_total = calculate_total_score(averages)
    recommendation = calculate_recommendation(average_total)

    areas_to_improve = []

    for field in CRITERIA_FIELDS:
        threshold = MAX_SCORES[field] * IMPROVEMENT_THRESHOLD

        if averages[field] < threshold:
            areas_to_improve.append(IMPROVEMENT_SUGGESTIONS[field])

    assessor_comments = []

    for a in assessments:
        if a.remarks:
            assessor = (
                db.query(User).filter(User.id == a.assessor_id).first()
            )

            assessor_comments.append(
                SiwesAssessorComment(
                    assessor_name=assessor.full_name
                    if assessor
                    else "Unknown",
                    remarks=a.remarks,
                )
            )

    return SiwesStudentReport(
        student_id=student_id,
        status="ready",
        assessments_submitted=submitted,
        assessments_required=REQUIRED_ASSESSMENTS,
        average_total=average_total,
        recommendation=recommendation,
        areas_to_improve=areas_to_improve,
        assessor_comments=assessor_comments,
    )
