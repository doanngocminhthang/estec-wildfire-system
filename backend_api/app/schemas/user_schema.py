from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class RoleResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None

    model_config = {"from_attributes": True}


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    is_active: bool
    full_name: Optional[str] = None
    phone: Optional[str] = None
    unit: Optional[str] = None
    roles: List[RoleResponse] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role_names: List[str] = []


class UserUpdate(BaseModel):
    email: Optional[str] = None
    is_active: Optional[bool] = None
    role_names: Optional[List[str]] = None


class ProfileUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    unit: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
