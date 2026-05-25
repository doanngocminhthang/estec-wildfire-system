"""
Webhook delivery service.

Signs each payload with HMAC-SHA256 and sends it to registered URLs.
Called fire-and-forget via asyncio.create_task() so it never blocks the caller.

Payload format:
  POST <url>
  Content-Type: application/json
  X-Wildfire-Event: <event>
  X-Wildfire-Signature: sha256=<hex-digest>

  {"event": "<event>", "timestamp": "<iso>", "data": {...}}

Supported events: hotspot_new, incident_new, incident_updated, alert_critical, test
"""

import hashlib
import hmac
import json
import logging
from datetime import datetime, timezone

import httpx
from sqlalchemy import text

from app.db.database import SessionLocal

logger = logging.getLogger("webhook")

KNOWN_EVENTS = [
    "hotspot_new",
    "incident_new",
    "incident_updated",
    "alert_critical",
    "test",
]


def _sign(body: bytes, secret: str) -> str:
    return hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()


async def _post(url: str, secret: str, event: str, data: dict) -> tuple[bool, int]:
    """Send one webhook delivery. Returns (success, http_status)."""
    payload = {
        "event": event,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data": data,
    }
    body = json.dumps(payload, default=str).encode()
    sig = _sign(body, secret)
    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            resp = await client.post(
                url,
                content=body,
                headers={
                    "Content-Type": "application/json",
                    "X-Wildfire-Event": event,
                    "X-Wildfire-Signature": f"sha256={sig}",
                    "User-Agent": "PCCCR-Wildfire/1.0",
                },
            )
        return resp.is_success, resp.status_code
    except httpx.TimeoutException:
        logger.warning("Webhook timeout → %s", url)
        return False, 0
    except Exception as exc:
        logger.warning("Webhook error → %s: %s", url, exc)
        return False, 0


async def fire_event(event: str, data: dict) -> None:
    """
    Deliver `event` to all active webhooks subscribed to it.
    Opens its own DB session so it can be called from asyncio.create_task().
    """
    db = SessionLocal()
    try:
        rows = db.execute(text("""
            SELECT id, url, secret
            FROM webhooks
            WHERE is_active = true
              AND events @> :ev::jsonb
        """), {"ev": json.dumps([event])}).fetchall()

        if not rows:
            return

        now_iso = datetime.now(timezone.utc).isoformat()
        for wh_id, url, secret in rows:
            ok, _ = await _post(url, secret, event, data)
            if ok:
                db.execute(text("""
                    UPDATE webhooks
                    SET last_triggered_at = :now, failure_count = 0
                    WHERE id = :id
                """), {"now": now_iso, "id": wh_id})
            else:
                db.execute(text("""
                    UPDATE webhooks
                    SET failure_count = failure_count + 1
                    WHERE id = :id
                """), {"id": wh_id})
            db.commit()

    except Exception as exc:
        logger.exception("fire_event(%s) error: %s", event, exc)
    finally:
        db.close()


async def test_delivery(url: str, secret: str) -> dict:
    """Send a test ping to a webhook URL. Returns result dict."""
    ok, status = await _post(
        url, secret, "test",
        {"message": "Test webhook từ hệ thống PCCCR Wildfire"},
    )
    return {"ok": ok, "status": status}
