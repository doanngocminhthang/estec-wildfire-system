from pydantic import BaseModel
from typing import List


class LoginRequest(BaseModel):
    username: str
    password: str


class RoleInfo(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}


class UserInfo(BaseModel):
    id: int
    username: str
    email: str
    roles: List[RoleInfo] = []

    model_config = {"from_attributes": True}


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserInfo
