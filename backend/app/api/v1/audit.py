from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth_dependency import get_current_user

from app.schemas.audit import AuditLogResponse
from app.services.audit_service import get_audit_logs


router = APIRouter(
    prefix="/audit-logs",
    tags=["Audit Logs"],
)


@router.get(
    "/",
    response_model=list[AuditLogResponse],
)
def read_audit_logs(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return get_audit_logs(db)