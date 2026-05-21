from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_db_session
from app.db.models import AuditLog, User
from app.middleware.auth import require_role
from app.schemas.audit_schema import AuditLogResponse

router = APIRouter(prefix="/audit-logs", tags=["audit"])


@router.get("/", response_model=List[AuditLogResponse])
def list_audit_logs(
    user_id: Optional[int] = Query(default=None),
    action: Optional[str] = Query(default=None),
    date_from: Optional[datetime] = Query(default=None),
    date_to: Optional[datetime] = Query(default=None),
    limit: int = Query(default=100, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db_session),
    _: User = Depends(require_role("admin")),
):
    """Lấy danh sách audit log (chỉ admin)."""
    q = db.query(AuditLog)
    if user_id is not None:
        q = q.filter(AuditLog.user_id == user_id)
    if action:
        q = q.filter(AuditLog.action.ilike(f"%{action}%"))
    if date_from:
        q = q.filter(AuditLog.created_at >= date_from)
    if date_to:
        q = q.filter(AuditLog.created_at <= date_to)
    rows = q.order_by(AuditLog.created_at.desc()).offset(offset).limit(limit).all()
    result = []
    for row in rows:
        item = AuditLogResponse(
            id=row.id,
            user_id=row.user_id,
            username=row.user.username if row.user else None,
            action=row.action,
            resource=row.resource,
            changes=row.changes,
            ip_address=row.ip_address,
            created_at=row.created_at,
        )
        result.append(item)
    return result
