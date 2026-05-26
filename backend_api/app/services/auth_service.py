from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status

from app.core.security import create_access_token, verify_password
from app.db.models import AuditLog, User
from app.schemas.token_schema import LoginResponse


def login(db: Session, username: str, password: str, ip_address: str | None = None) -> LoginResponse:
    user = (
        db.query(User)
        .options(joinedload(User.roles))
        .filter(
            (User.username == username) | (User.email == username),
            User.is_active.is_(True),
        )
        .first()
    )

    if not user or not verify_password(password, user.hashed_password):
        _write_audit(db, user_id=user.id if user else None, action="login_failed", ip=ip_address)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sai tên đăng nhập hoặc mật khẩu",
        )

    _write_audit(db, user_id=user.id, action="login", ip=ip_address)

    token = create_access_token({"sub": str(user.id), "username": user.username})
    return LoginResponse(access_token=token, token_type="bearer", user=user)


def _write_audit(db: Session, *, user_id: int | None, action: str, ip: str | None) -> None:
    try:
        db.add(AuditLog(user_id=user_id, action=action, resource="auth", ip_address=ip))
        db.commit()
    except Exception:
        db.rollback()
