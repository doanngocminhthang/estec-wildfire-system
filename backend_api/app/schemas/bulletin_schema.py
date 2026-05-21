from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class BulletinCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    body: str = Field(..., min_length=1)
    priority: Literal["info", "warning", "critical"] = "info"


class BulletinResponse(BaseModel):
    id: int
    title: str
    body: str
    priority: str
    is_active: bool
    created_by_id: Optional[int] = None
    created_by_username: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
