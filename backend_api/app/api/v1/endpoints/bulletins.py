from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db_session
from app.db.models import Bulletin, User
from app.middleware.auth import get_current_user, require_role
from app.schemas.bulletin_schema import BulletinCreate, BulletinResponse
from app.services.audit_service import log_action

router = APIRouter(prefix="/bulletins", tags=["bulletins"])


def _to_response(b: Bulletin) -> BulletinResponse:
    return BulletinResponse(
        id=b.id,
        title=b.title,
        body=b.body,
        priority=b.priority,
        is_active=b.is_active,
        created_by_id=b.created_by_id,
        created_by_username=b.created_by.username if b.created_by else None,
        created_at=b.created_at,
    )


@router.get("/", response_model=List[BulletinResponse])
def list_bulletins(
    db: Session = Depends(get_db_session),
    _: User = Depends(get_current_user),
):
    """Lấy danh sách thông báo đang hoạt động (mọi user)."""
    rows = (
        db.query(Bulletin)
        .filter(Bulletin.is_active == True)
        .order_by(Bulletin.created_at.desc())
        .all()
    )
    return [_to_response(b) for b in rows]


@router.post("/", response_model=BulletinResponse, status_code=201)
def create_bulletin(
    payload: BulletinCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_role("admin")),
):
    """Đăng thông báo mới (chỉ admin)."""
    b = Bulletin(
        title=payload.title,
        body=payload.body,
        priority=payload.priority,
        created_by_id=current_user.id,
    )
    db.add(b)
    db.commit()
    db.refresh(b)
    log_action(db, action="create_bulletin", user_id=current_user.id,
               resource=f"bulletin:{b.id}",
               changes={"title": payload.title, "priority": payload.priority})
    return _to_response(b)


@router.delete("/{bulletin_id}", status_code=204)
def delete_bulletin(
    bulletin_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_role("admin")),
):
    """Ẩn/xóa thông báo (chỉ admin)."""
    b = db.query(Bulletin).filter(Bulletin.id == bulletin_id).first()
    if not b:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy thông báo")
    b.is_active = False
    db.commit()
    log_action(db, action="delete_bulletin", user_id=current_user.id, resource=f"bulletin:{bulletin_id}")
