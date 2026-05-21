from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db_session
from app.db.models import User
from app.middleware.auth import get_current_user, require_role
from app.schemas.user_schema import ProfileUpdate, UserCreate, UserResponse, UserUpdate
from app.services.user_service import create_user, delete_user, get_user_by_id, get_users, update_me, update_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Lấy thông tin người dùng hiện tại."""
    return current_user


@router.patch("/me", response_model=UserResponse)
def update_me_endpoint(
    payload: ProfileUpdate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    """Cập nhật hồ sơ cá nhân (user tự cập nhật)."""
    return update_me(db, current_user, payload)


@router.get("/", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db_session),
    _: User = Depends(require_role("admin")),
):
    """Lấy danh sách người dùng (chỉ admin)."""
    return get_users(db)


@router.post("/", response_model=UserResponse, status_code=201)
def create_user_endpoint(
    payload: UserCreate,
    db: Session = Depends(get_db_session),
    _: User = Depends(require_role("admin")),
):
    """Tạo người dùng mới (chỉ admin)."""
    return create_user(db, payload)


@router.get("/{user_id}", response_model=UserResponse)
def get_user_endpoint(
    user_id: int,
    db: Session = Depends(get_db_session),
    _: User = Depends(require_role("admin")),
):
    return get_user_by_id(db, user_id)


@router.patch("/{user_id}", response_model=UserResponse)
def update_user_endpoint(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db_session),
    _: User = Depends(require_role("admin")),
):
    """Cập nhật thông tin người dùng (chỉ admin)."""
    return update_user(db, user_id, payload)


@router.delete("/{user_id}", status_code=204)
def delete_user_endpoint(
    user_id: int,
    db: Session = Depends(get_db_session),
    _: User = Depends(require_role("admin")),
):
    """Vô hiệu hóa tài khoản người dùng (chỉ admin)."""
    delete_user(db, user_id)
