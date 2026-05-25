import asyncio
import logging

from app.api.v1.api import api_router
from app.api.v1.ws_manager import manager as ws_manager
from app.core.config import settings
from app.db import models  # noqa: F401 — register all ORM models with Base
from app.db.database import Base, SessionLocal, engine
from app.db.models import Hotspot
from app.db.seed import migrate_schema, seed_default_data
from app.services.firms_service import sync_firms

# Reuse the existing single-file app to preserve legacy endpoints (/api/hotspots, /api/incidents, etc.)
from main import app  # noqa: E402

logger = logging.getLogger(__name__)

app.include_router(api_router, prefix="/api/v1")

_last_hotspot_id: int = 0


async def _hotspot_poller() -> None:
    """Poll every 5 s for new hotspots and broadcast to connected WS clients."""
    global _last_hotspot_id
    while True:
        await asyncio.sleep(5)
        if ws_manager.count == 0:
            continue
        db = SessionLocal()
        try:
            rows = (
                db.query(Hotspot)
                .filter(Hotspot.id > _last_hotspot_id)
                .order_by(Hotspot.id.asc())
                .all()
            )
            for h in rows:
                await ws_manager.broadcast({
                    "type": "hotspot_new",
                    "data": {
                        "id": h.id,
                        "device_id": h.device_id,
                        "confidence_score": h.confidence_score,
                        "detected_at": h.detected_at.isoformat() if h.detected_at else None,
                        "snapshot_url": h.snapshot_url,
                    },
                })
                _last_hotspot_id = h.id
        except Exception as exc:
            print(f"⚠️  WS poller error: {exc}")
        finally:
            db.close()


async def _firms_sync_loop() -> None:
    """Periodically pull NASA FIRMS satellite hotspot data into the local DB."""
    if not settings.firms_sync_hours or not settings.firms_map_key:
        if not settings.firms_map_key:
            logger.warning(
                "FIRMS auto-sync disabled: FIRMS_MAP_KEY not set. "
                "Register at https://firms.modaps.eosdis.nasa.gov/api/"
            )
        return

    # Wait a bit after startup before the first sync
    await asyncio.sleep(15)
    while True:
        db = SessionLocal()
        try:
            result = await sync_firms(db, days=1)
            logger.info("FIRMS auto-sync: %s", result)
        except Exception as exc:
            logger.exception("FIRMS auto-sync error: %s", exc)
        finally:
            db.close()
        await asyncio.sleep(settings.firms_sync_hours * 3600)


@app.on_event("startup")
async def on_startup():
    global _last_hotspot_id
    Base.metadata.create_all(bind=engine)
    migrate_schema()
    seed_default_data()

    # Initialise last seen hotspot ID so we don't replay old data on first connect
    db = SessionLocal()
    try:
        latest = db.query(Hotspot.id).order_by(Hotspot.id.desc()).first()
        _last_hotspot_id = latest[0] if latest else 0
    finally:
        db.close()

    asyncio.create_task(_hotspot_poller())
    asyncio.create_task(_firms_sync_loop())
