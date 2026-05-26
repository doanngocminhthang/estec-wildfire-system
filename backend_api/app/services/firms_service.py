"""
NASA FIRMS (Fire Information for Resource Management System) integration.

Fetches near-real-time hotspot data from MODIS/VIIRS satellites for
Thanh Hoa province and upserts into the local hotspots table.

Data sources:
  VIIRS_SNPP_NRT  — Suomi-NPP VIIRS (~375 m, best NRT)
  VIIRS_NOAA20_NRT — NOAA-20 VIIRS (~375 m)
  MODIS_NRT        — Terra/Aqua MODIS (~1 km, legacy)

API key: register free at https://firms.modaps.eosdis.nasa.gov/api/
Set env var FIRMS_MAP_KEY=<your-key>
"""

import asyncio
import csv
import io
import logging
from datetime import datetime, timezone

import httpx
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings

logger = logging.getLogger("firms")

FIRMS_BASE = "https://firms.modaps.eosdis.nasa.gov/api/area/csv"

# Each tuple: (firms_source_key, device_label_in_db)
SYNC_SOURCES = [
    ("VIIRS_SNPP_NRT",   "SNPP"),
    ("VIIRS_NOAA20_NRT", "NOAA20"),
    ("MODIS_NRT",        "MODIS"),
]

# VIIRS confidence is categorical; MODIS is 0-100 integer
_VIIRS_CONF = {"l": 35.0, "n": 70.0, "h": 90.0}

# Module-level state; survives across requests within the same process
_sync_state: dict = {
    "at": None,
    "inserted": 0,
    "fetched": 0,
    "error": None,
}


# ---------------------------------------------------------------------------
# Parsing helpers
# ---------------------------------------------------------------------------

def _parse_dt(acq_date: str, acq_time: str) -> datetime:
    """FIRMS acq_date='2024-04-15', acq_time='0835' → UTC datetime."""
    return datetime.strptime(
        f"{acq_date} {acq_time.zfill(4)}", "%Y-%m-%d %H%M"
    ).replace(tzinfo=timezone.utc)


def _confidence(row: dict, source_key: str) -> float:
    raw = (row.get("confidence") or "").strip().lower()
    if "VIIRS" in source_key:
        return _VIIRS_CONF.get(raw, 70.0)
    try:
        return max(0.0, min(100.0, float(raw)))
    except (ValueError, TypeError):
        return 50.0


def _parse_csv(csv_text: str, source_key: str, label: str) -> list[dict]:
    """Parse FIRMS CSV response into a list of row dicts ready for upsert."""
    rows: list[dict] = []
    reader = csv.DictReader(io.StringIO(csv_text))
    for row in reader:
        try:
            lat = float(row["latitude"])
            lon = float(row["longitude"])
            satellite = row.get("satellite", label).strip()
            acq_date = row["acq_date"].strip()
            acq_time = (row.get("acq_time") or "0000").strip()
            detected_at = _parse_dt(acq_date, acq_time)
            confidence = _confidence(row, source_key)
            frp: float | None = None
            try:
                frp = float(row.get("frp") or "")
            except (ValueError, TypeError):
                pass

            # Deduplication key: lat/lon rounded to 4 dp + time + satellite
            firms_uid = f"{lat:.4f}_{lon:.4f}_{acq_date}_{acq_time}_{satellite}"

            rows.append({
                "device_id": f"FIRMS_{label}",
                "confidence_score": confidence,
                "detected_at": detected_at,
                "lon": lon,
                "lat": lat,
                "frp": frp,
                "satellite": satellite,
                "source": f"FIRMS_{source_key}",
                "firms_uid": firms_uid,
            })
        except Exception as exc:
            logger.debug("Skip FIRMS row: %s", exc)
    return rows


# ---------------------------------------------------------------------------
# DB upsert
# ---------------------------------------------------------------------------

_INSERT_SQL = text("""
    INSERT INTO hotspots
        (device_id, confidence_score, detected_at, geom, frp, satellite, source, firms_uid)
    VALUES
        (:device_id, :confidence_score, :detected_at,
         ST_SetSRID(ST_MakePoint(:lon, :lat), 4326),
         :frp, :satellite, :source, :firms_uid)
    ON CONFLICT (firms_uid) DO NOTHING
""")


def upsert_hotspots(db: Session, rows: list[dict]) -> int:
    """Insert rows, skipping duplicates. Returns count of newly inserted rows."""
    if not rows:
        return 0
    inserted = 0
    for r in rows:
        result = db.execute(_INSERT_SQL, r)
        inserted += result.rowcount
    db.commit()
    return inserted


# ---------------------------------------------------------------------------
# Main sync coroutine
# ---------------------------------------------------------------------------

async def sync_firms(db: Session, days: int = 1) -> dict:
    """
    Fetch hotspot data from all FIRMS sources for the configured bounding box
    and upsert into the local DB. Returns sync result dict.
    """
    global _sync_state

    if not settings.firms_map_key:
        msg = (
            "FIRMS_MAP_KEY not set. "
            "Register at https://firms.modaps.eosdis.nasa.gov/api/ "
            "then set the FIRMS_MAP_KEY environment variable."
        )
        logger.warning(msg)
        _sync_state = {**_sync_state, "error": msg, "at": datetime.now(timezone.utc).isoformat()}
        return _sync_state

    total_fetched = 0
    total_inserted = 0

    for source_key, label in SYNC_SOURCES:
        url = (
            f"{FIRMS_BASE}/{settings.firms_map_key}"
            f"/{source_key}/{settings.firms_bbox}/{days}"
        )
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.get(url)
                resp.raise_for_status()

            rows = _parse_csv(resp.text, source_key, label)
            total_fetched += len(rows)
            ins = upsert_hotspots(db, rows)
            total_inserted += ins
            logger.info("FIRMS %s → fetched %d, inserted %d new", source_key, len(rows), ins)

        except httpx.HTTPStatusError as exc:
            # 429 = rate limit, 401 = bad key
            logger.error("FIRMS HTTP %s (%s): %s", exc.response.status_code, source_key, exc)
        except httpx.RequestError as exc:
            logger.error("FIRMS network error (%s): %s", source_key, exc)
        except Exception as exc:
            logger.exception("FIRMS unexpected error (%s): %s", source_key, exc)

    _sync_state = {
        "at": datetime.now(timezone.utc).isoformat(),
        "inserted": total_inserted,
        "fetched": total_fetched,
        "error": None,
    }
    logger.info(
        "FIRMS sync complete: fetched=%d inserted=%d bbox=%s",
        total_fetched, total_inserted, settings.firms_bbox,
    )

    # Fire webhooks for new hotspots (late import avoids circular dependency at load time)
    if total_inserted > 0:
        from app.services.webhook_service import fire_event  # noqa: PLC0415
        asyncio.create_task(fire_event(
            "hotspot_new",
            {"count": total_inserted, "source": "FIRMS", "bbox": settings.firms_bbox},
        ))

    return _sync_state


# ---------------------------------------------------------------------------
# Status helper (called by API endpoint)
# ---------------------------------------------------------------------------

def get_firms_status(db: Session) -> dict:
    total_in_db = db.execute(
        text("SELECT COUNT(*) FROM hotspots WHERE source LIKE 'FIRMS_%'")
    ).scalar() or 0
    return {**_sync_state, "total_in_db": int(total_in_db)}
