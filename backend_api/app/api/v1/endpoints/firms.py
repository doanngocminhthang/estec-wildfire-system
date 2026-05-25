from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.database import get_db_session
from app.db.models import User
from app.middleware.auth import get_current_user, require_role
from app.services.firms_service import get_firms_status, sync_firms

router = APIRouter(prefix="/firms", tags=["firms"])


@router.get("/status")
def firms_status(
    db: Session = Depends(get_db_session),
    _: User = Depends(get_current_user),
):
    """
    Last FIRMS sync info + total satellite hotspots in DB.
    Requires authentication.
    """
    return get_firms_status(db)


@router.post("/sync")
async def firms_sync_now(
    days: int = Query(default=1, ge=1, le=7, description="Số ngày dữ liệu cần kéo (1–7)"),
    db: Session = Depends(get_db_session),
    _: User = Depends(require_role("admin")),
):
    """
    Kích hoạt đồng bộ dữ liệu FIRMS thủ công.
    Chỉ admin mới có quyền.
    days=1 → lấy 24 giờ qua; days=7 → lấy 7 ngày qua (cẩn thận với giới hạn API).
    """
    result = await sync_firms(db, days=days)
    if result.get("error"):
        raise HTTPException(status_code=503, detail=result["error"])
    return result
