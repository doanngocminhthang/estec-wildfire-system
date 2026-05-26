"""
Weather sensor data ingestion endpoint.
Compatible with HoanVo's api_insertsensordata_SocSon() pattern.
"""
import logging
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db_session
from app.db.models import WeatherRecord
from app.middleware.auth import require_role
from app.services.camera_geo import calculate_fire_danger_index

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sensors", tags=["sensors"])


class WeatherIngest(BaseModel):
    station_code: str
    recorded_at: Optional[datetime] = None
    temperature: Optional[float] = None       # °C
    humidity: Optional[float] = None          # %
    wind_speed: Optional[float] = None        # m/s
    rainfall: Optional[float] = None          # mm (past 24h or current measurement)
    fire_danger_index: Optional[float] = None # pre-computed P; computed here if absent
    danger_level: Optional[int] = None


class WeatherOut(BaseModel):
    id: int
    station_code: str
    recorded_at: datetime
    temperature: Optional[float]
    humidity: Optional[float]
    wind_speed: Optional[float]
    rainfall: Optional[float]
    fire_danger_index: Optional[float]
    danger_level: Optional[int]
    created_at: datetime
    model_config = {"from_attributes": True}


@router.post("/ingest", response_model=WeatherOut, status_code=201)
def ingest_weather(body: WeatherIngest, db: Session = Depends(get_db_session)):
    """
    Receive weather data from a weather station sensor.
    No JWT required — called by embedded sensors on the local network.
    Automatically computes fire danger index P if not provided.
    """
    fdi = body.fire_danger_index
    level = body.danger_level

    if fdi is None and all(v is not None for v in [
        body.temperature, body.humidity, body.wind_speed, body.rainfall
    ]):
        fdi, level = calculate_fire_danger_index(
            temperature=body.temperature,
            humidity=body.humidity,
            wind_speed=body.wind_speed,
            rainfall_mm=body.rainfall,
        )

    record = WeatherRecord(
        station_code=body.station_code,
        recorded_at=body.recorded_at or datetime.now(timezone.utc),
        temperature=body.temperature,
        humidity=body.humidity,
        wind_speed=body.wind_speed,
        rainfall=body.rainfall,
        fire_danger_index=fdi,
        danger_level=level,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/latest", response_model=List[WeatherOut])
def get_latest_weather(
    station_code: Optional[str] = None,
    db: Session = Depends(get_db_session),
    _user=Depends(require_role("ranger")),
):
    """Return the most recent weather record per station (or filtered by station_code)."""
    from sqlalchemy import func, text
    if station_code:
        return (
            db.query(WeatherRecord)
            .filter(WeatherRecord.station_code == station_code)
            .order_by(WeatherRecord.recorded_at.desc())
            .limit(24)
            .all()
        )
    # Latest record per station using a subquery
    subq = (
        db.query(
            WeatherRecord.station_code,
            func.max(WeatherRecord.recorded_at).label("max_at"),
        )
        .group_by(WeatherRecord.station_code)
        .subquery()
    )
    return (
        db.query(WeatherRecord)
        .join(subq, (WeatherRecord.station_code == subq.c.station_code) &
                    (WeatherRecord.recorded_at == subq.c.max_at))
        .order_by(WeatherRecord.station_code)
        .all()
    )
