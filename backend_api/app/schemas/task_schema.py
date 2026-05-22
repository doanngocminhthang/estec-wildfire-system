from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AssigneeInfo(BaseModel):
    id: int
    username: str
    email: str

    model_config = {"from_attributes": True}


class TaskCreate(BaseModel):
    incident_id: int
    assigned_to_id: int
    deadline: Optional[datetime] = None
    note: Optional[str] = None


class TaskStatusUpdate(BaseModel):
    status: str
    result_note: Optional[str] = None


class TaskResponse(BaseModel):
    id: int
    incident_id: int
    status: str
    deadline: Optional[datetime] = None
    note: Optional[str] = None
    result_note: Optional[str] = None
    assigned_to: Optional[AssigneeInfo] = None
    assigned_by: Optional[AssigneeInfo] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
