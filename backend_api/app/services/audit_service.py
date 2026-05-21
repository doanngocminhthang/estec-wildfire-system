from typing import Any

from sqlalchemy.orm import Session

from app.db.models import AuditLog


def log_action(
    db: Session,
    action: str,
    user_id: int | None = None,
    resource: str | None = None,
    changes: dict[str, Any] | None = None,
    ip_address: str | None = None,
) -> None:
    entry = AuditLog(
        user_id=user_id,
        action=action,
        resource=resource,
        changes=changes,
        ip_address=ip_address,
    )
    db.add(entry)
    db.commit()
