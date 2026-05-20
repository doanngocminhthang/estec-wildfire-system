from app.api.v1.api import api_router
from app.db import models  # noqa: F401 — register all ORM models with Base
from app.db.database import Base, engine
from app.db.seed import seed_default_data

# Reuse the existing single-file app to preserve legacy endpoints (/api/hotspots, /api/incidents, etc.)
from main import app  # noqa: E402

app.include_router(api_router, prefix="/api/v1")


@app.on_event("startup")
async def on_startup():
    # Create any missing tables (safe / idempotent — skips tables that already exist)
    Base.metadata.create_all(bind=engine)
    seed_default_data()
