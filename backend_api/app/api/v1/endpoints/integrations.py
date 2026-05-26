import hashlib
import secrets
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db_session
from app.db.models import APIKey, User, Webhook
from app.middleware.auth import require_role
from app.services.webhook_service import KNOWN_EVENTS, test_delivery

router = APIRouter(prefix="/integrations", tags=["integrations"])


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class APIKeyCreate(BaseModel):
    name: str
    expires_at: Optional[datetime] = None


class APIKeyOut(BaseModel):
    id: int
    name: str
    key_prefix: str
    is_active: bool
    last_used_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    created_at: datetime
    raw_key: Optional[str] = None  # only returned at creation
    model_config = {"from_attributes": True}


class WebhookCreate(BaseModel):
    name: str
    url: str
    events: List[str]


class WebhookOut(BaseModel):
    id: int
    name: str
    url: str
    events: list
    is_active: bool
    last_triggered_at: Optional[datetime] = None
    failure_count: int
    created_at: datetime
    secret: Optional[str] = None  # only returned at creation
    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# API Keys
# ---------------------------------------------------------------------------

@router.get("/api-keys", response_model=List[APIKeyOut])
def list_api_keys(
    db: Session = Depends(get_db_session),
    _: User = Depends(require_role("admin")),
):
    """Danh sách API keys (chỉ admin)."""
    return db.query(APIKey).order_by(APIKey.created_at.desc()).all()


@router.post("/api-keys", response_model=APIKeyOut, status_code=201)
def create_api_key(
    payload: APIKeyCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_role("admin")),
):
    """
    Tạo API key mới. Raw key chỉ trả về một lần — lưu lại ngay.
    Format: wf_<random43chars>
    """
    raw = "wf_" + secrets.token_urlsafe(32)
    key = APIKey(
        name=payload.name,
        key_hash=hashlib.sha256(raw.encode()).hexdigest(),
        key_prefix=raw[:12],
        created_by_id=current_user.id,
        expires_at=payload.expires_at,
    )
    db.add(key)
    db.commit()
    db.refresh(key)
    out = APIKeyOut.model_validate(key)
    out.raw_key = raw
    return out


@router.delete("/api-keys/{key_id}", status_code=204)
def delete_api_key(
    key_id: int,
    db: Session = Depends(get_db_session),
    _: User = Depends(require_role("admin")),
):
    """Xóa (thu hồi) API key."""
    key = db.query(APIKey).filter(APIKey.id == key_id).first()
    if not key:
        raise HTTPException(status_code=404, detail="API key không tồn tại")
    db.delete(key)
    db.commit()


# ---------------------------------------------------------------------------
# Webhooks
# ---------------------------------------------------------------------------

@router.get("/webhooks", response_model=List[WebhookOut])
def list_webhooks(
    db: Session = Depends(get_db_session),
    _: User = Depends(require_role("admin")),
):
    """Danh sách webhook endpoints (chỉ admin)."""
    return db.query(Webhook).order_by(Webhook.created_at.desc()).all()


@router.post("/webhooks", response_model=WebhookOut, status_code=201)
def create_webhook(
    payload: WebhookCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_role("admin")),
):
    """
    Đăng ký webhook mới. Secret chỉ trả về một lần — lưu lại ngay.
    Dùng secret để xác thực chữ ký HMAC-SHA256 trên header X-Wildfire-Signature.
    """
    invalid = [e for e in payload.events if e not in KNOWN_EVENTS]
    if invalid:
        raise HTTPException(status_code=422, detail=f"Event không hợp lệ: {invalid}")
    if not payload.events:
        raise HTTPException(status_code=422, detail="Phải chọn ít nhất một event")

    secret = secrets.token_hex(32)
    wh = Webhook(
        name=payload.name,
        url=payload.url,
        events=payload.events,
        secret=secret,
        created_by_id=current_user.id,
    )
    db.add(wh)
    db.commit()
    db.refresh(wh)
    out = WebhookOut.model_validate(wh)
    out.secret = secret
    return out


@router.delete("/webhooks/{wh_id}", status_code=204)
def delete_webhook(
    wh_id: int,
    db: Session = Depends(get_db_session),
    _: User = Depends(require_role("admin")),
):
    """Xóa webhook."""
    wh = db.query(Webhook).filter(Webhook.id == wh_id).first()
    if not wh:
        raise HTTPException(status_code=404, detail="Webhook không tồn tại")
    db.delete(wh)
    db.commit()


@router.post("/webhooks/{wh_id}/test")
async def test_webhook(
    wh_id: int,
    db: Session = Depends(get_db_session),
    _: User = Depends(require_role("admin")),
):
    """Gửi test payload tới webhook URL và trả về kết quả HTTP."""
    wh = db.query(Webhook).filter(Webhook.id == wh_id).first()
    if not wh:
        raise HTTPException(status_code=404, detail="Webhook không tồn tại")
    return await test_delivery(wh.url, wh.secret)


# ---------------------------------------------------------------------------
# Events reference
# ---------------------------------------------------------------------------

@router.get("/events")
def list_events(_: User = Depends(require_role("admin"))):
    """Danh sách event types hỗ trợ."""
    return [e for e in KNOWN_EVENTS if e != "test"]
