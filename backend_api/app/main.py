import asyncio

from app.api.v1.api import api_router
from app.api.v1.ws_manager import manager as ws_manager
from app.db import models  # noqa: F401 — register all ORM models with Base
from app.db.database import Base, SessionLocal, engine
from app.db.models import Hotspot
from app.db.seed import migrate_schema, seed_default_data

# Reuse the existing single-file app to preserve legacy endpoints (/api/hotspots, /api/incidents, etc.)
from main import app  # noqa: E402

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
