from sqlalchemy import (
    Boolean, CheckConstraint, Column, DateTime, Float, ForeignKey,
    Integer, String, Table, Text, func,
)
from sqlalchemy.dialects.postgresql import DOUBLE_PRECISION, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import expression

from app.db.database import Base

# ---------- Junction tables ----------

user_roles_table = Table(
    "user_roles",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
)

role_permissions_table = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("permission_id", Integer, ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
)

# ---------- Auth models ----------

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    full_name = Column(String(150), nullable=True)
    phone = Column(String(30), nullable=True)
    unit = Column(String(150), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    roles = relationship("Role", secondary=user_roles_table, back_populates="users")
    audit_logs = relationship("AuditLog", back_populates="user")


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    users = relationship("User", secondary=user_roles_table, back_populates="roles")
    permissions = relationship("Permission", secondary=role_permissions_table, back_populates="roles")


class Permission(Base):
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)

    roles = relationship("Role", secondary=role_permissions_table, back_populates="permissions")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    resource = Column(String(100), nullable=True)
    changes = Column(JSONB, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="audit_logs")

# ---------- Domain models ----------

class Hotspot(Base):
    __tablename__ = "hotspots"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(100), nullable=False)
    confidence_score = Column(Float, nullable=True)
    detected_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    snapshot_url = Column(String(255), nullable=True)

    __table_args__ = (
        CheckConstraint(
            "confidence_score >= 0 AND confidence_score <= 100",
            name="hotspots_confidence_score_check",
        ),
    )


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    incident_code = Column(String(50), unique=True, nullable=False)
    title = Column(String(150), nullable=False)
    status = Column(String(30), nullable=False, server_default=expression.text("'uncontrolled'"))
    priority = Column(String(20), nullable=False, server_default=expression.text("'medium'"))
    burn_area_acres = Column(DOUBLE_PRECISION, nullable=False, server_default=expression.text("0"))
    source_hotspot_id = Column(Integer, ForeignKey("hotspots.id", ondelete="SET NULL"), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    tasks = relationship("Task", back_populates="incident")

    __table_args__ = (
        CheckConstraint(
            "status IN ('uncontrolled', 'containing', 'controlled')",
            name="incidents_status_check",
        ),
        CheckConstraint(
            "priority IN ('low', 'medium', 'high', 'critical')",
            name="incidents_priority_check",
        ),
    )


class Bulletin(Base):
    __tablename__ = "bulletins"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    body = Column(Text, nullable=False)
    priority = Column(String(20), nullable=False, server_default=expression.text("'info'"))
    is_active = Column(Boolean, default=True, nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    created_by = relationship("User")

    __table_args__ = (
        CheckConstraint(
            "priority IN ('info', 'warning', 'critical')",
            name="bulletins_priority_check",
        ),
    )


class APIKey(Base):
    """API key cho hệ thống bên ngoài tích hợp."""
    __tablename__ = "api_keys"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    key_hash = Column(String(64), nullable=False, unique=True)  # SHA-256 hex
    key_prefix = Column(String(16), nullable=False)             # first chars for display
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    created_by = relationship("User", foreign_keys=[created_by_id])


class Webhook(Base):
    """Webhook endpoint cho push notification đến hệ thống bên ngoài."""
    __tablename__ = "webhooks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    url = Column(String(500), nullable=False)
    events = Column(JSONB, nullable=False, server_default=expression.text("'[]'::jsonb"))
    secret = Column(String(64), nullable=False)  # HMAC-SHA256 signing secret
    is_active = Column(Boolean, default=True, nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    last_triggered_at = Column(DateTime(timezone=True), nullable=True)
    failure_count = Column(Integer, nullable=False, server_default=expression.text("0"))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    created_by = relationship("User", foreign_keys=[created_by_id])


class CameraStation(Base):
    """Trạm camera quan sát cháy rừng (tương đương bảng Tram của HoanVo)."""
    __tablename__ = "camera_stations"

    id = Column(Integer, primary_key=True, index=True)
    station_code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False)
    province = Column(String(100), nullable=True)
    latitude = Column(DOUBLE_PRECISION, nullable=False)
    longitude = Column(DOUBLE_PRECISION, nullable=False)
    # Camera optics & PTZ
    rtsp_url = Column(String(500), nullable=True)
    ptz_url = Column(String(500), nullable=True)
    cam_username = Column(String(100), nullable=True)
    cam_password = Column(String(100), nullable=True)
    image_width = Column(Integer, nullable=False, server_default=expression.text("1920"))
    image_height = Column(Integer, nullable=False, server_default=expression.text("1080"))
    absolute_zoom = Column(Integer, nullable=False, server_default=expression.text("1000"))
    # Camera geometry for coordinate calculation
    field_of_view = Column(DOUBLE_PRECISION, nullable=True)   # horizontal FOV degrees
    tilt_angle = Column(DOUBLE_PRECISION, nullable=True)       # center tilt (gocdung)
    cam_height_agl = Column(DOUBLE_PRECISION, nullable=True)   # height above ground (m)
    ground_elevation = Column(DOUBLE_PRECISION, nullable=True) # DEM elevation at station (m)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    detections = relationship("FireDetection", back_populates="station")


class FireDetection(Base):
    """Kết quả phát hiện cháy từ camera + AI (tương đương bảng DamChay của HoanVo)."""
    __tablename__ = "fire_detections"

    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("camera_stations.id", ondelete="SET NULL"), nullable=True, index=True)
    station_code = Column(String(50), nullable=False, index=True)
    detected_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    confidence = Column(DOUBLE_PRECISION, nullable=False)
    # Detection bounding box (pixels)
    bbox_x1 = Column(DOUBLE_PRECISION, nullable=True)
    bbox_y1 = Column(DOUBLE_PRECISION, nullable=True)
    bbox_x2 = Column(DOUBLE_PRECISION, nullable=True)
    bbox_y2 = Column(DOUBLE_PRECISION, nullable=True)
    # Camera PTZ state at detection time
    azimuth = Column(DOUBLE_PRECISION, nullable=True)   # tenths of degree (e.g. 1800 = 180°)
    # Calculated fire location
    fire_longitude = Column(DOUBLE_PRECISION, nullable=True)
    fire_latitude = Column(DOUBLE_PRECISION, nullable=True)
    fire_elevation_m = Column(DOUBLE_PRECISION, nullable=True)
    slope_deg = Column(DOUBLE_PRECISION, nullable=True)
    aspect_deg = Column(DOUBLE_PRECISION, nullable=True)
    distance_m = Column(DOUBLE_PRECISION, nullable=True)
    # Administrative unit
    commune = Column(String(150), nullable=True)
    commune_code = Column(String(50), nullable=True)
    district = Column(String(150), nullable=True)
    district_code = Column(String(50), nullable=True)
    province = Column(String(150), nullable=True)
    province_code = Column(String(50), nullable=True)
    # Snapshot & status
    snapshot_path = Column(String(500), nullable=True)
    status = Column(String(20), nullable=False, server_default=expression.text("'pending'"))
    created_incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    station = relationship("CameraStation", back_populates="detections")

    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'confirmed', 'rejected')",
            name="fire_detections_status_check",
        ),
    )


class WeatherRecord(Base):
    """Bản ghi dữ liệu thời tiết từ trạm cảm biến."""
    __tablename__ = "weather_records"

    id = Column(Integer, primary_key=True, index=True)
    station_code = Column(String(50), nullable=False, index=True)
    recorded_at = Column(DateTime(timezone=True), nullable=False, index=True)
    temperature = Column(DOUBLE_PRECISION, nullable=True)    # °C
    humidity = Column(DOUBLE_PRECISION, nullable=True)       # %
    wind_speed = Column(DOUBLE_PRECISION, nullable=True)     # m/s
    rainfall = Column(DOUBLE_PRECISION, nullable=True)       # mm
    fire_danger_index = Column(DOUBLE_PRECISION, nullable=True)  # chỉ số P
    danger_level = Column(Integer, nullable=True)            # cấp nguy cơ 1-5
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_to_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    assigned_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(30), nullable=False, server_default=expression.text("'pending'"))
    deadline = Column(DateTime(timezone=True), nullable=True)
    note = Column(Text, nullable=True)
    result_note = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    incident = relationship("Incident", back_populates="tasks")
    assigned_to = relationship("User", foreign_keys=[assigned_to_id])
    assigned_by = relationship("User", foreign_keys=[assigned_by_id])

    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'in_progress', 'done', 'cancelled')",
            name="tasks_status_check",
        ),
    )
