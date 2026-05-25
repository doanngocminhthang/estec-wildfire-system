"""
Camera stations management + fire detection ingestion endpoint.
Provides CRUD for camera_stations and an ingest endpoint for
external camera AI services (like HoanVo's run_model.py) to POST results.
"""
import asyncio
import logging
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import get_db_session
from app.db.models import CameraStation, FireDetection, Incident
from app.middleware.auth import require_role
from app.services.camera_geo import (
    calculate_fire_coordinates,
    find_administrative_unit,
    haversine_distance,
)
from app.services.webhook_service import fire_event

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cameras", tags=["cameras"])


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class StationCreate(BaseModel):
    station_code: str
    name: str
    province: Optional[str] = None
    latitude: float
    longitude: float
    rtsp_url: Optional[str] = None
    ptz_url: Optional[str] = None
    cam_username: Optional[str] = None
    cam_password: Optional[str] = None
    image_width: int = 1920
    image_height: int = 1080
    absolute_zoom: int = 1000
    field_of_view: Optional[float] = None
    tilt_angle: Optional[float] = None
    cam_height_agl: Optional[float] = None
    ground_elevation: Optional[float] = None
    is_active: bool = True


class StationOut(BaseModel):
    id: int
    station_code: str
    name: str
    province: Optional[str]
    latitude: float
    longitude: float
    rtsp_url: Optional[str]
    ptz_url: Optional[str]
    image_width: int
    image_height: int
    absolute_zoom: int
    field_of_view: Optional[float]
    tilt_angle: Optional[float]
    cam_height_agl: Optional[float]
    ground_elevation: Optional[float]
    is_active: bool
    created_at: datetime
    model_config = {"from_attributes": True}


class FireDetectionIngest(BaseModel):
    """Payload sent by camera AI service when fire is detected."""
    station_code: str
    confidence: float
    bbox_x1: Optional[float] = None
    bbox_y1: Optional[float] = None
    bbox_x2: Optional[float] = None
    bbox_y2: Optional[float] = None
    azimuth: Optional[float] = None        # tenths of degree (e.g. 1800 = 180°)
    fire_longitude: Optional[float] = None
    fire_latitude: Optional[float] = None
    fire_elevation_m: Optional[float] = None
    slope_deg: Optional[float] = None
    aspect_deg: Optional[float] = None
    distance_m: Optional[float] = None
    commune: Optional[str] = None
    commune_code: Optional[str] = None
    district: Optional[str] = None
    district_code: Optional[str] = None
    province: Optional[str] = None
    province_code: Optional[str] = None
    snapshot_path: Optional[str] = None
    detected_at: Optional[datetime] = None
    # If coords not yet computed, pass camera info and we'll compute here
    compute_coords: bool = False


class FireDetectionOut(BaseModel):
    id: int
    station_code: str
    detected_at: datetime
    confidence: float
    azimuth: Optional[float]
    fire_longitude: Optional[float]
    fire_latitude: Optional[float]
    fire_elevation_m: Optional[float]
    slope_deg: Optional[float]
    aspect_deg: Optional[float]
    distance_m: Optional[float]
    commune: Optional[str]
    district: Optional[str]
    province: Optional[str]
    snapshot_path: Optional[str]
    status: str
    created_at: datetime
    model_config = {"from_attributes": True}


class DetectionStatusUpdate(BaseModel):
    status: str  # confirmed | rejected


# ---------------------------------------------------------------------------
# Camera station CRUD
# ---------------------------------------------------------------------------

@router.get("/stations", response_model=List[StationOut])
def list_stations(db: Session = Depends(get_db_session),
                  _user=Depends(require_role("ranger"))):
    return db.query(CameraStation).order_by(CameraStation.station_code).all()


@router.post("/stations", response_model=StationOut, status_code=201)
def create_station(body: StationCreate, db: Session = Depends(get_db_session),
                   _user=Depends(require_role("admin"))):
    if db.query(CameraStation).filter(CameraStation.station_code == body.station_code).first():
        raise HTTPException(400, "Station code already exists")
    station = CameraStation(**body.model_dump())
    db.add(station)
    db.commit()
    db.refresh(station)
    return station


@router.put("/stations/{station_id}", response_model=StationOut)
def update_station(station_id: int, body: StationCreate,
                   db: Session = Depends(get_db_session),
                   _user=Depends(require_role("admin"))):
    station = db.query(CameraStation).filter(CameraStation.id == station_id).first()
    if not station:
        raise HTTPException(404, "Station not found")
    for k, v in body.model_dump().items():
        setattr(station, k, v)
    db.commit()
    db.refresh(station)
    return station


@router.delete("/stations/{station_id}", status_code=204)
def delete_station(station_id: int, db: Session = Depends(get_db_session),
                   _user=Depends(require_role("admin"))):
    station = db.query(CameraStation).filter(CameraStation.id == station_id).first()
    if not station:
        raise HTTPException(404, "Station not found")
    db.delete(station)
    db.commit()


# ---------------------------------------------------------------------------
# Fire detection ingestion (called by camera AI service)
# ---------------------------------------------------------------------------

@router.post("/ingest", response_model=FireDetectionOut, status_code=201)
def ingest_fire_detection(body: FireDetectionIngest, db: Session = Depends(get_db_session)):
    """
    Receive a fire detection result from camera AI (HoanVo's run_model.py or equivalent).
    No JWT required — the camera AI service runs on the same trusted network.
    If compute_coords=True, computes fire coordinates from bounding box using DEM.
    Automatically creates an Incident if confidence >= 0.8.
    """
    station = db.query(CameraStation).filter(
        CameraStation.station_code == body.station_code
    ).first()

    fire_lon = body.fire_longitude
    fire_lat = body.fire_latitude
    fire_elev = body.fire_elevation_m
    slope = body.slope_deg
    aspect = body.aspect_deg
    dist_m = body.distance_m
    commune = body.commune
    commune_code = body.commune_code
    district = body.district
    district_code = body.district_code
    province = body.province
    province_code = body.province_code

    # Optionally compute coordinates from bounding box when not pre-computed
    if body.compute_coords and station and all(v is not None for v in [
        body.bbox_x1, body.bbox_x2, body.bbox_y1, body.bbox_y2,
        body.azimuth, station.field_of_view, station.tilt_angle,
        station.cam_height_agl,
    ]):
        fire_lon, fire_lat, fire_elev, slope, aspect = calculate_fire_coordinates(
            azimuth_tenths=body.azimuth,
            x1=body.bbox_x1, x2=body.bbox_x2,
            y1=body.bbox_y1, y2=body.bbox_y2,
            camera_lon=station.longitude,
            camera_lat=station.latitude,
            image_width=station.image_width,
            image_height=station.image_height,
            field_of_view=station.field_of_view,
            tilt_angle=station.tilt_angle,
            cam_height_agl=station.cam_height_agl,
            ground_elevation=station.ground_elevation or 0.0,
            dem_path=settings.dem_path or None,
        )
        if fire_lon and fire_lat:
            dist_m = haversine_distance(station.latitude, station.longitude, fire_lat, fire_lon)
            if settings.shapefile_path:
                commune, commune_code, district, district_code, province, province_code = \
                    find_administrative_unit(fire_lon, fire_lat, settings.shapefile_path)

    detection = FireDetection(
        station_id=station.id if station else None,
        station_code=body.station_code,
        detected_at=body.detected_at or datetime.now(timezone.utc),
        confidence=body.confidence,
        bbox_x1=body.bbox_x1, bbox_y1=body.bbox_y1,
        bbox_x2=body.bbox_x2, bbox_y2=body.bbox_y2,
        azimuth=body.azimuth,
        fire_longitude=fire_lon, fire_latitude=fire_lat,
        fire_elevation_m=fire_elev,
        slope_deg=slope, aspect_deg=aspect,
        distance_m=dist_m,
        commune=commune, commune_code=commune_code,
        district=district, district_code=district_code,
        province=province, province_code=province_code,
        snapshot_path=body.snapshot_path,
        status="pending",
    )
    db.add(detection)
    db.flush()

    # Auto-create incident for high-confidence detections
    created_incident = None
    if body.confidence >= 0.8 and fire_lon and fire_lat:
        loc_parts = [x for x in [commune, district, province] if x]
        loc_str = ", ".join(loc_parts) if loc_parts else body.station_code
        incident = Incident(
            incident_code=f"CAM-{detection.id:05d}",
            title=f"Phát hiện cháy rừng tại {loc_str}",
            status="uncontrolled",
            priority="critical" if body.confidence >= 0.9 else "high",
            description=(
                f"Phát hiện tự động từ camera {body.station_code}. "
                f"Độ tin cậy: {body.confidence * 100:.1f}%. "
                f"Tọa độ: {fire_lat:.5f}°N {fire_lon:.5f}°E. "
                f"Khoảng cách: {dist_m:.0f} m." if dist_m else ""
            ),
        )
        db.add(incident)
        db.flush()
        detection.created_incident_id = incident.id
        created_incident = incident

    db.commit()
    db.refresh(detection)

    # Fire webhook async (fire-and-forget)
    event_data = {
        "detection_id": detection.id,
        "station_code": body.station_code,
        "confidence": body.confidence,
        "fire_lon": fire_lon,
        "fire_lat": fire_lat,
        "incident_id": created_incident.id if created_incident else None,
    }
    asyncio.create_task(fire_event("hotspot_new", event_data))

    # Send email alert if configured
    if settings.smtp_sender_email and body.confidence >= 0.8:
        asyncio.create_task(_send_alert_email_bg(detection, body.snapshot_path))

    return detection


async def _send_alert_email_bg(detection: FireDetection, snapshot_path: Optional[str]):
    from app.services.email_alert import send_fire_alert_email
    receivers = [e.strip() for e in settings.alert_email_recipients.split(",") if e.strip()]
    if not receivers:
        return
    send_fire_alert_email(
        smtp_host=settings.smtp_host,
        smtp_port=settings.smtp_port,
        sender_email=settings.smtp_sender_email,
        sender_password=settings.smtp_sender_password,
        receiver_emails=receivers,
        detection_id=detection.id,
        station_code=detection.station_code,
        detected_at_str=detection.detected_at.strftime("%H:%M:%S %d/%m/%Y"),
        fire_lon=detection.fire_longitude,
        fire_lat=detection.fire_latitude,
        azimuth_deg=(detection.azimuth / 10.0) if detection.azimuth else None,
        distance_m=detection.distance_m,
        elevation_m=detection.fire_elevation_m,
        slope_deg=detection.slope_deg or 0.0,
        aspect_deg=detection.aspect_deg or 0.0,
        commune=detection.commune,
        district=detection.district,
        province=detection.province,
        confidence=detection.confidence,
        snapshot_path=snapshot_path,
    )


# ---------------------------------------------------------------------------
# Fire detection listing & status update
# ---------------------------------------------------------------------------

@router.get("/detections", response_model=List[FireDetectionOut])
def list_detections(
    station_code: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db_session),
    _user=Depends(require_role("ranger")),
):
    q = db.query(FireDetection)
    if station_code:
        q = q.filter(FireDetection.station_code == station_code)
    if status:
        q = q.filter(FireDetection.status == status)
    return q.order_by(FireDetection.detected_at.desc()).limit(limit).all()


@router.patch("/detections/{detection_id}", response_model=FireDetectionOut)
def update_detection_status(
    detection_id: int,
    body: DetectionStatusUpdate,
    db: Session = Depends(get_db_session),
    _user=Depends(require_role("dispatcher")),
):
    if body.status not in ("confirmed", "rejected"):
        raise HTTPException(400, "status must be 'confirmed' or 'rejected'")
    det = db.query(FireDetection).filter(FireDetection.id == detection_id).first()
    if not det:
        raise HTTPException(404, "Detection not found")
    det.status = body.status
    db.commit()
    db.refresh(det)
    return det
