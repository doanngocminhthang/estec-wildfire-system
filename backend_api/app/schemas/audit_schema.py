from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel


class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    username: Optional[str] = None
    action: str
    resource: Optional[str] = None
    changes: Optional[Any] = None
    ip_address: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
