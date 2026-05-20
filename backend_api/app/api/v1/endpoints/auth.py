from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.db.database import get_db_session
from app.schemas.token_schema import LoginRequest, LoginResponse
from app.services.auth_service import login

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/login", response_model=LoginResponse)
def login_endpoint(payload: LoginRequest, request: Request, db: Session = Depends(get_db_session)):
    """Đăng nhập và nhận JWT access token."""
    ip_address = request.client.host if request.client else None
    return login(db, payload.username, payload.password, ip_address)
