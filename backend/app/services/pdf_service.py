
import io

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


def generate_student_report_pdf(student, report) -> bytes:
    buffer = io.BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Heading1"],
        fontSize=16,
    )

    heading_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontSize=12,
        spaceBefore=14,
    )

    body_style = styles["BodyText"]

    elements = []

    elements.append(
        Paragraph(
            "Student Project Assessment Report", title_style
        )
    )
    elements.append(Spacer(1, 0.3 * cm))

    identity_rows = [
        ["Name", student.full_name],
        ["Matric Number", student.matric_number],
        [
            "Programme",
            student.programme.name if student.programme else "-",
        ],
        [
            "Academic Session",
            student.academic_session.name
            if student.academic_session
            else "-",
        ],
        ["Project Title", student.project_title or "-"],
    ]

    identity_table = Table(
        identity_rows, colWidths=[4 * cm, 12 * cm]
    )

    identity_table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("LINEBELOW", (0, 0), (-1, -1), 0.3, colors.lightgrey),
            ]
        )
    )

    elements.append(identity_table)

    elements.append(
        Paragraph("Internal Assessment", heading_style)
    )

    status_label = (
        "Complete"
        if report.status == "ready"
        else "In progress"
    )

    internal_rows = [
        ["Status", status_label],
        [
            "Lecturers Scored",
            f"{report.internal_assessments_submitted} of "
            f"{report.internal_assessments_required}",
        ],
        [
            "Average Score",
            f"{report.internal_average_total:.2f} / 100"
            if report.internal_average_total is not None
            else "Pending",
        ],
        [
            "Recommendation",
            report.internal_recommendation or "Pending",
        ],
    ]

    internal_table = Table(
        internal_rows, colWidths=[4 * cm, 12 * cm]
    )

    internal_table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("LINEBELOW", (0, 0), (-1, -1), 0.3, colors.lightgrey),
            ]
        )
    )

    elements.append(internal_table)

    if report.areas_to_improve:
        elements.append(
            Paragraph("Areas to Improve", heading_style)
        )

        for area in report.areas_to_improve:
            elements.append(
                Paragraph(f"\u2022 {area}", body_style)
            )

    if report.lecturer_comments:
        elements.append(
            Paragraph("Lecturer Remarks", heading_style)
        )

        for comment in report.lecturer_comments:
            elements.append(
                Paragraph(
                    f"<b>{comment.lecturer_name}:</b> "
                    f"{comment.remarks or '-'}",
                    body_style,
                )
            )

    elements.append(
        Paragraph("External Supervisor", heading_style)
    )

    if report.external_assessment:
        external_rows = [
            [
                "Score",
                f"{report.external_assessment.total_score:.2f} / 100",
            ],
            [
                "Recommendation",
                report.external_assessment.recommendation,
            ],
        ]

        external_table = Table(
            external_rows, colWidths=[4 * cm, 12 * cm]
        )

        external_table.setStyle(
            TableStyle(
                [
                    (
                        "FONTNAME",
                        (0, 0),
                        (0, -1),
                        "Helvetica-Bold",
                    ),
                    ("FONTSIZE", (0, 0), (-1, -1), 9),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                ]
            )
        )

        elements.append(external_table)
    else:
        elements.append(
            Paragraph(
                "No external supervisor score yet.", body_style
            )
        )

    doc.build(elements)

    return buffer.getvalue()
