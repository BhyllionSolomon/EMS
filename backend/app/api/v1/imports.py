from io import BytesIO
from decimal import Decimal, InvalidOperation

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session
from openpyxl import load_workbook

from app.core.database import get_db
from app.core.auth_dependency import get_current_user

from app.models.student import Student
from app.models.assessment import Assessment
from app.models.user import User


router = APIRouter(
    prefix="/imports",
    tags=["Excel Import"],
)


COLUMN_ALIASES = {
    "matric number": "matric_number",
    "matriculation number": "matric_number",

    "name of student": "full_name",
    "student name": "full_name",
    "name": "full_name",

    "dress": "dressing_appearance",
    "dressing": "dressing_appearance",
    "dressing & appearance": "dressing_appearance",

    "oral presentation": "oral_presentation",

    "slide presentation": "slide_presentation",

    "depth of understanding": "depth_of_understanding",

    "project implementation": "project_implementation",

    "referencing & documentation": "referencing_documentation",
    "referencing and documentation": "referencing_documentation",

    "contribution & originality": "contribution_originality",
    "contribution and originality": "contribution_originality",

    "professional conduct": "professional_conduct",
}


REQUIRED_SCORES = [
    "dressing_appearance",
    "oral_presentation",
    "slide_presentation",
    "depth_of_understanding",
    "project_implementation",
    "referencing_documentation",
    "contribution_originality",
    "professional_conduct",
]


def clean_header(value):
    if value is None:
        return ""

    return " ".join(
        str(value)
        .replace("\n", " ")
        .strip()
        .lower()
        .split()
    )


def get_recommendation(total):
    return "Pass" if total >= 50 else "Fail"


def find_headers(ws):
    """
    Search the first 12 rows for the Excel header row.

    Returns:
        (header_row, headers)

    headers format:
        {
            "matric number": column_number,
            "oral presentation": column_number,
            ...
        }
    """

    for row_number in range(
        1,
        min(ws.max_row, 12) + 1,
    ):

        candidate_headers = {}

        for column in range(
            1,
            ws.max_column + 1,
        ):

            value = clean_header(
                ws.cell(
                    row_number,
                    column,
                ).value
            )

            if value:
                candidate_headers[value] = column

        if (
            "matric number" in candidate_headers
            or "matriculation number" in candidate_headers
        ):
            return row_number, candidate_headers

    return None, {}


def parse_score(value):
    """
    Convert an Excel score to Decimal.

    Returns None when the value is not usable.
    """

    if value is None:
        return None

    if isinstance(value, str):
        value = value.strip()

        if not value:
            return None

    try:
        return Decimal(str(value))

    except (InvalidOperation, ValueError, TypeError):
        return None


@router.post("/excel")
async def import_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    # ---------------------------------------------------------
    # 1. Validate file
    # ---------------------------------------------------------

    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file selected.",
        )

    if not file.filename.lower().endswith(".xlsx"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only .xlsx Excel files are supported.",
        )

    contents = await file.read()

    if not contents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded Excel file is empty.",
        )

    # ---------------------------------------------------------
    # 2. Open workbook
    # ---------------------------------------------------------

    try:
        workbook = load_workbook(
            filename=BytesIO(contents),
            data_only=True,
        )

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to read the Excel file.",
        )

    imported = 0
    skipped = 0
    errors = []

    # ---------------------------------------------------------
    # 3. Process worksheets
    # ---------------------------------------------------------

    for sheet_name in workbook.sheetnames:

        # Ignore summary/index sheets
        if sheet_name.strip().lower() in {
            "index",
            "summary",
            "contents",
        }:
            continue

        ws = workbook[sheet_name]

        # -----------------------------------------------------
        # Find header row
        # -----------------------------------------------------

        header_row, headers = find_headers(ws)

        if header_row is None:
            skipped += 1

            errors.append(
                f"{sheet_name}: "
                "No valid matriculation-number header found."
            )

            continue

        # -----------------------------------------------------
        # Find matriculation column
        # -----------------------------------------------------

        matric_column = headers.get(
            "matric number"
        )

        if matric_column is None:
            matric_column = headers.get(
                "matriculation number"
            )

        if matric_column is None:
            skipped += 1

            errors.append(
                f"{sheet_name}: "
                "Matric number column not found."
            )

            continue

        # -----------------------------------------------------
        # Process student rows
        # -----------------------------------------------------

        for row_number in range(
            header_row + 1,
            ws.max_row + 1,
        ):

            matric_value = ws.cell(
                row_number,
                matric_column,
            ).value

            # Empty row
            if (
                matric_value is None
                or str(matric_value).strip() == ""
            ):
                skipped += 1
                continue

            matric = str(
                matric_value
            ).strip()

            try:

                # -------------------------------------------------
                # Find student in EMS
                # -------------------------------------------------

                student = (
                    db.query(Student)
                    .filter(
                        Student.matric_number == matric,
                        Student.is_deleted == False,
                    )
                    .first()
                )

                if not student:

                    errors.append(
                        f"{sheet_name}, row {row_number}: "
                        f"student {matric} not found in EMS."
                    )

                    continue

                # -------------------------------------------------
                # Extract assessment scores
                # -------------------------------------------------

                scores = {}

                invalid_scores = []

                for (
                    excel_header,
                    ems_field,
                ) in COLUMN_ALIASES.items():

                    if excel_header not in headers:
                        continue

                    if ems_field in {
                        "matric_number",
                        "full_name",
                    }:
                        continue

                    column = headers[
                        excel_header
                    ]

                    value = ws.cell(
                        row_number,
                        column,
                    ).value

                    if (
                        value is None
                        or str(value).strip() == ""
                    ):
                        continue

                    score = parse_score(value)

                    if score is None:

                        invalid_scores.append(
                            f"{excel_header}='{value}'"
                        )

                        continue

                    scores[
                        ems_field
                    ] = score

                # -------------------------------------------------
                # Invalid score values
                # -------------------------------------------------

                if invalid_scores:

                    errors.append(
                        f"{sheet_name}, row {row_number}: "
                        f"invalid scores: "
                        f"{', '.join(invalid_scores)}."
                    )

                    continue

                # -------------------------------------------------
                # Check all eight criteria
                # -------------------------------------------------

                missing = [
                    field
                    for field in REQUIRED_SCORES
                    if field not in scores
                ]

                if missing:

                    errors.append(
                        f"{sheet_name}, row {row_number}: "
                        f"missing scores: "
                        f"{', '.join(missing)}."
                    )

                    continue

                # -------------------------------------------------
                # Validate individual score ranges
                # -------------------------------------------------

                maximum_scores = {
                    "dressing_appearance": Decimal("10"),
                    "oral_presentation": Decimal("10"),
                    "slide_presentation": Decimal("10"),
                    "depth_of_understanding": Decimal("15"),
                    "project_implementation": Decimal("15"),
                    "referencing_documentation": Decimal("15"),
                    "contribution_originality": Decimal("15"),
                    "professional_conduct": Decimal("10"),
                }

                invalid_range = []

                for field in REQUIRED_SCORES:

                    score = scores[field]

                    maximum = maximum_scores[field]

                    if (
                        score < 0
                        or score > maximum
                    ):

                        invalid_range.append(
                            f"{field}={score} "
                            f"(maximum {maximum})"
                        )

                if invalid_range:

                    errors.append(
                        f"{sheet_name}, row {row_number}: "
                        f"scores outside valid ranges: "
                        f"{', '.join(invalid_range)}."
                    )

                    continue

                # -------------------------------------------------
                # Calculate total
                # -------------------------------------------------

                total_score = sum(
                    (
                        scores[field]
                        for field in REQUIRED_SCORES
                    ),
                    Decimal("0"),
                )

                if (
                    total_score < 0
                    or total_score > 100
                ):

                    errors.append(
                        f"{sheet_name}, row {row_number}: "
                        f"total score {total_score} "
                        "is outside 0-100."
                    )

                    continue

                # -------------------------------------------------
                # Create assessment
                # -------------------------------------------------

                assessment = Assessment(
                    student_id=student.id,

                    assessor_id=current_user.id,

                    dressing_appearance=scores[
                        "dressing_appearance"
                    ],

                    oral_presentation=scores[
                        "oral_presentation"
                    ],

                    slide_presentation=scores[
                        "slide_presentation"
                    ],

                    depth_of_understanding=scores[
                        "depth_of_understanding"
                    ],

                    project_implementation=scores[
                        "project_implementation"
                    ],

                    referencing_documentation=scores[
                        "referencing_documentation"
                    ],

                    contribution_originality=scores[
                        "contribution_originality"
                    ],

                    professional_conduct=scores[
                        "professional_conduct"
                    ],

                    total_score=total_score,

                    recommendation=get_recommendation(
                        total_score
                    ),

                    remarks=None,

                    is_deleted=False,
                )

                db.add(assessment)

                imported += 1

            except Exception as exc:

                errors.append(
                    f"{sheet_name}, row {row_number}: "
                    f"{str(exc)}"
                )

    # ---------------------------------------------------------
    # 4. Commit everything
    # ---------------------------------------------------------

    try:

        db.commit()

    except Exception as exc:

        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Excel import failed: {str(exc)}",
        )

    # ---------------------------------------------------------
    # 5. Return result
    # ---------------------------------------------------------

    return {
        "message": "Excel import completed.",
        "imported": imported,
        "skipped": skipped,
        "errors": errors,
    }
