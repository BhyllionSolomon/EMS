import os
import uuid
from typing import Optional

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.student_document import StudentDocument
from app.services.audit_service import create_audit_log


def _resolve_upload_dir() -> str:
    directory = settings.upload_dir
    os.makedirs(directory, exist_ok=True)
    return directory


def save_document(
    db: Session,
    student_id: int,
    file_name: str,
    content_type: Optional[str],
    file_bytes: bytes,
    uploaded_by_id: Optional[int],
) -> StudentDocument:
    directory = _resolve_upload_dir()

    extension = os.path.splitext(file_name)[1]
    stored_filename = f"{uuid.uuid4().hex}{extension}"

    full_path = os.path.join(directory, stored_filename)

    with open(full_path, "wb") as destination:
        destination.write(file_bytes)

    document = StudentDocument(
        student_id=student_id,
        file_name=file_name,
        stored_filename=stored_filename,
        content_type=content_type,
        file_size=len(file_bytes),
        uploaded_by_id=uploaded_by_id,
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    create_audit_log(
        db=db,
        user_id=uploaded_by_id,
        action="CREATE",
        entity_type="StudentDocument",
        entity_id=str(document.id),
        details=f"Uploaded document '{file_name}' for student #{student_id}",
    )

    return document


def get_document(
    db: Session,
    document_id: int,
) -> Optional[StudentDocument]:
    return (
        db.query(StudentDocument)
        .filter(StudentDocument.id == document_id)
        .first()
    )


def get_document_path(document: StudentDocument) -> str:
    return os.path.join(
        settings.upload_dir,
        document.stored_filename,
    )


def delete_document(
    db: Session,
    document: StudentDocument,
    user_id: Optional[int],
) -> None:
    file_path = get_document_path(document)

    student_id = document.student_id
    file_name = document.file_name

    db.delete(document)
    db.commit()

    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except OSError:
            pass

    create_audit_log(
        db=db,
        user_id=user_id,
        action="DELETE",
        entity_type="StudentDocument",
        entity_id=str(document.id),
        details=f"Deleted document '{file_name}' for student #{student_id}",
    )
