from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.security import decode_token, http_bearer
from app.db.database import get_db_session
from app.db.models import User


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(http_bearer),
    db: Session = Depends(get_db_session),
) -> User:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Thiếu token xác thực",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_token(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token không hợp lệ")
    user = db.query(User).filter(User.id == int(user_id), User.is_active.is_(True)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Người dùng không tồn tại hoặc đã bị vô hiệu hóa",
        )
    return user


def require_role(*roles: str):
    """Dependency factory: yêu cầu người dùng có ít nhất một trong các role chỉ định."""
    def _check(current_user: User = Depends(get_current_user)) -> User:
        user_role_names = {r.name for r in current_user.roles}
        if not any(role in user_role_names for role in roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Không có quyền truy cập",
            )
        return current_user
    return _check
