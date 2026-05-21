from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.db.database import get_db_session
from app.db.models import User
from app.middleware.auth import get_current_user
from app.schemas.token_schema import LoginRequest, LoginResponse
from app.schemas.user_schema import ChangePasswordRequest
from app.services.audit_service import log_action
from app.services.auth_service import login

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/login", response_model=LoginResponse)
def login_endpoint(payload: LoginRequest, request: Request, db: Session = Depends(get_db_session)):
    """Đăng nhập và nhận JWT access token."""
    ip_address = request.client.host if request.client else None
    return login(db, payload.username, payload.password, ip_address)


@router.post("/change-password", status_code=204)
def change_password_endpoint(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    """Đổi mật khẩu (user tự đổi, cần cung cấp mật khẩu hiện tại)."""
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mật khẩu hiện tại không đúng",
        )
    if len(payload.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Mật khẩu mới phải có ít nhất 8 ký tự",
        )
    current_user.hashed_password = hash_password(payload.new_password)
    db.commit()
    log_action(db, action="change_password", user_id=current_user.id, resource=f"user:{current_user.id}")
