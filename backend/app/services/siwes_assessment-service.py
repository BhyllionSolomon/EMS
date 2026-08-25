import os
import uuid
from typing import Optional

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.siwes import SiwesLogDocument
from app.services.audit_service import create_audit_log


def _resolve_upload_dir() -> str:
    directory = os.path.join(settings.upload_dir, "..", "siwes_logs")
    directory = os.path.normpath(directory)
    os.makedirs(directory, exist_ok=True)
    return directory


def save_log_document(
    db: Session,
    log_entry_id: int,
    file_name: str,
    content_type: Optional[str],
    file_bytes: bytes,
    uploaded_by_id: Optional[int],
) -> SiwesLogDocument:
    directory = _resolve_upload_dir()

    extension = os.path.splitext(file_name)[1]
    stored_filename = f"{uuid.uuid4().hex}{extension}"

    full_path = os.path.join(directory, stored_filename)

    with open(full_path, "wb") as destination:
        destination.write(file_bytes)

    document = SiwesLogDocument(
        log_entry_id=log_entry_id,
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
        entity_type="SiwesLogDocument",
        entity_id=str(document.id),
        details=(
            f"Uploaded signed log page '{file_name}' for "
            f"log entry #{log_entry_id}"
        ),
    )

    return document


def get_log_document(
    db: Session,
    document_id: int,
) -> Optional[SiwesLogDocument]:
    return (
        db.query(SiwesLogDocument)
        .filter(SiwesLogDocument.id == document_id)
        .first()
    )


def get_log_document_path(document: SiwesLogDocument) -> str:
    directory = _resolve_upload_dir()
    return os.path.join(directory, document.stored_filename)


def delete_log_document(
    db: Session,
    document: SiwesLogDocument,
    user_id: Optional[int],
) -> None:
    file_path = get_log_document_path(document)

    log_entry_id = document.log_entry_id
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
        entity_type="SiwesLogDocument",
        entity_id=str(document.id),
        details=(
            f"Deleted signed log page '{file_name}' for "
            f"log entry #{log_entry_id}"
        ),
    )
