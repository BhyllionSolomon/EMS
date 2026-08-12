from io import BytesIO

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from openpyxl import load_workbook

from app.core.database import get_db
from app.models.student import Student
from app.models.assessment import Assessment
from app.models.user import User
from app.api.v1.auth import get_current_user


router = APIRouter(
    prefix="/imports",
    tags=["Excel Import"],
)


# Excel column name -> EMS field
COLUMN_ALIASES = {
    "matric number": "matric_number",
    "matriculation number": "matric_number",

    "name of student": "full_name",
    "student name": "full_name",
    "name": "full_name",

    "dress": "dressing_appearance",
    "dressing & appearance": "dressing_appearance",

    "oral presentation": "oral_presentation",

    "slide presentation": "slide_presentation",

    "depth of understanding": "depth_of_understanding",

    "project implementation": "project_implementation",

    "referencing & documentation": "referencing_documentation",

    "contribution & originality": "contribution_originality",

    "professional conduct": "professional_conduct",
}


def clean_header(value):
    if value is None:
        return ""

    return (
        str(value)
        .replace("\n", " ")
        .strip()
        .lower()
    )


def get_headers(ws):
    headers = {}

    for column in range(1, ws.max_column + 1):
        value = ws.cell(8, column).value
        header = clean_header(value)

        if header:
            headers[header] = column

    return headers


def get_value(ws, headers, name):
    column = headers.get(name)

    if not column:
        return None

    return ws.cell(
        ws._current_row,
        column,
    ).value


@router.post("/excel")
async def import_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not file.filename.lower().endswith(".xlsx"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only .xlsx Excel files are supported.",
        )

    contents = await file.read()

    try:
        workbook = load_workbook(
            filename=BytesIO(contents),
            data_only=True,
        )
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Unable to read the Excel file.",
        )

    imported = 0
    skipped = 0
    errors = []

    for worksheet_name in workbook.sheetnames:

        # Ignore non-programme sheets such as Index
        if worksheet_name.strip().lower() == "index":
            continue

        ws = workbook[worksheet_name]

        headers = get_headers(ws)

        matric_column = None

        for header, column in headers.items():
            if header in (
                "matric number",
                "matriculation number",
            ):
                matric_column = column
                break

        if matric_column is None:
            skipped += 1
            continue

        for row_number in range(9, ws.max_row + 1):

            ws._current_row = row_number

            matric = ws.cell(
                row_number,
                matric_column,
            ).value

            # Empty row/student = skip
            if matric is None or str(matric).strip() == "":
                skipped += 1
                continue

            matric = str(matric).strip()

            try:

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
                        f"{worksheet_name} row {row_number}: "
                        f"student {matric} does not exist in EMS."
                    )
                    continue

                scores = {}

                for excel_header, ems_field in COLUMN_ALIASES.items():

                    if excel_header in headers:

                        value = ws.cell(
                            row_number,
                            headers[excel_header],
                        ).value

                        if value is not None and ems_field not in (
                            "matric_number",
                            "full_name",
                        ):
                            scores[ems_field] = float(value)

                # No assessment values = skip
                if not scores:
                    skipped += 1
                    continue

                assessment = Assessment(
                    student_id=student.id,
                    assessor_id=current_user.id,
                    **scores,
                )

                db.add(assessment)
                imported += 1

            except Exception as exc:
                errors.append(
                    f"{worksheet_name} row {row_number}: {str(exc)}"
                )

    db.commit()

    return {
        "message": "Excel import completed.",
        "imported": imported,
        "skipped": skipped,
        "errors": errors,
    }
