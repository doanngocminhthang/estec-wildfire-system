import logging

from sqlalchemy import text

from app.core.security import hash_password
from app.db.database import SessionLocal, engine
from app.db.models import Permission, Role, User

logger = logging.getLogger(__name__)

_DEFAULT_ROLES = [
    ("admin",      "Quản trị hệ thống"),
    ("dispatcher", "Điều phối viên"),
    ("ranger",     "Kiểm lâm viên"),
    ("citizen",    "Công dân"),
]

_DEFAULT_PERMISSIONS = [
    ("view_incidents",   "Xem sự cố"),
    ("create_incidents", "Tạo sự cố"),
    ("edit_incidents",   "Chỉnh sửa sự cố"),
    ("delete_incidents", "Xóa sự cố"),
    ("view_users",       "Xem người dùng"),
    ("manage_users",     "Quản lý người dùng"),
    ("view_hotspots",    "Xem điểm cháy"),
    ("view_analytics",   "Xem phân tích"),
]

_DEFAULT_RANGERS = [
    ("ranger01", "ranger01@wildfire.local", "Ranger@123"),
    ("ranger02", "ranger02@wildfire.local", "Ranger@123"),
    ("ranger03", "ranger03@wildfire.local", "Ranger@123"),
]


_PROFILE_COLUMNS = [
    ("full_name", "VARCHAR(150)"),
    ("phone",     "VARCHAR(30)"),
    ("unit",      "VARCHAR(150)"),
]

# Extra columns added to hotspots for FIRMS satellite integration
_HOTSPOT_FIRMS_COLUMNS = [
    ("satellite", "VARCHAR(50)"),
    ("source",    "VARCHAR(50)"),
    ("frp",       "FLOAT"),
    ("firms_uid", "VARCHAR(120)"),
]


def _exec_ddl(sql: str) -> None:
    """Run a DDL statement in its own connection; silently skip if it fails (e.g. already exists)."""
    try:
        with engine.connect() as c:
            c.execute(text(sql))
            c.commit()
    except Exception as exc:
        logger.debug("DDL skipped (likely already applied): %s", exc)


def migrate_schema() -> None:
    """Add any missing columns/tables to existing schema (idempotent)."""
    with engine.connect() as conn:
        # User profile columns
        for col, col_type in _PROFILE_COLUMNS:
            conn.execute(text(
                f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {col} {col_type}"
            ))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS bulletins (
                id SERIAL PRIMARY KEY,
                title VARCHAR(200) NOT NULL,
                body TEXT NOT NULL,
                priority VARCHAR(20) NOT NULL DEFAULT 'info',
                is_active BOOLEAN NOT NULL DEFAULT TRUE,
                created_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT bulletins_priority_check
                    CHECK (priority IN ('info', 'warning', 'critical'))
            )
        """))

        # FIRMS satellite integration columns on hotspots
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
        conn.execute(text(
            "ALTER TABLE hotspots ADD COLUMN IF NOT EXISTS geom geometry(Point, 4326)"
        ))
        for col, col_type in _HOTSPOT_FIRMS_COLUMNS:
            conn.execute(text(
                f"ALTER TABLE hotspots ADD COLUMN IF NOT EXISTS {col} {col_type}"
            ))

        conn.commit()

    # Unique constraint on firms_uid — no IF NOT EXISTS in PostgreSQL for constraints,
    # so we use a helper that ignores duplicate-object errors.
    _exec_ddl(
        "ALTER TABLE hotspots ADD CONSTRAINT uq_hotspots_firms_uid UNIQUE (firms_uid)"
    )
    # Spatial index for map queries
    _exec_ddl(
        "CREATE INDEX IF NOT EXISTS ix_hotspots_geom "
        "ON hotspots USING GIST (geom) WHERE geom IS NOT NULL"
    )

    # Camera station & fire detection tables
    with engine.connect() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS camera_stations (
                id SERIAL PRIMARY KEY,
                station_code VARCHAR(50) NOT NULL UNIQUE,
                name VARCHAR(150) NOT NULL,
                province VARCHAR(100),
                latitude DOUBLE PRECISION NOT NULL,
                longitude DOUBLE PRECISION NOT NULL,
                rtsp_url VARCHAR(500),
                ptz_url VARCHAR(500),
                cam_username VARCHAR(100),
                cam_password VARCHAR(100),
                image_width INTEGER NOT NULL DEFAULT 1920,
                image_height INTEGER NOT NULL DEFAULT 1080,
                absolute_zoom INTEGER NOT NULL DEFAULT 1000,
                field_of_view DOUBLE PRECISION,
                tilt_angle DOUBLE PRECISION,
                cam_height_agl DOUBLE PRECISION,
                ground_elevation DOUBLE PRECISION,
                is_active BOOLEAN NOT NULL DEFAULT TRUE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        """))
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS fire_detections (
                id SERIAL PRIMARY KEY,
                station_id INTEGER REFERENCES camera_stations(id) ON DELETE SET NULL,
                station_code VARCHAR(50) NOT NULL,
                detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                confidence DOUBLE PRECISION NOT NULL,
                bbox_x1 DOUBLE PRECISION,
                bbox_y1 DOUBLE PRECISION,
                bbox_x2 DOUBLE PRECISION,
                bbox_y2 DOUBLE PRECISION,
                azimuth DOUBLE PRECISION,
                fire_longitude DOUBLE PRECISION,
                fire_latitude DOUBLE PRECISION,
                fire_elevation_m DOUBLE PRECISION,
                slope_deg DOUBLE PRECISION,
                aspect_deg DOUBLE PRECISION,
                distance_m DOUBLE PRECISION,
                commune VARCHAR(150),
                commune_code VARCHAR(50),
                district VARCHAR(150),
                district_code VARCHAR(50),
                province VARCHAR(150),
                province_code VARCHAR(50),
                snapshot_path VARCHAR(500),
                status VARCHAR(20) NOT NULL DEFAULT 'pending',
                created_incident_id INTEGER REFERENCES incidents(id) ON DELETE SET NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT fire_detections_status_check
                    CHECK (status IN ('pending', 'confirmed', 'rejected'))
            )
        """))
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS weather_records (
                id SERIAL PRIMARY KEY,
                station_code VARCHAR(50) NOT NULL,
                recorded_at TIMESTAMPTZ NOT NULL,
                temperature DOUBLE PRECISION,
                humidity DOUBLE PRECISION,
                wind_speed DOUBLE PRECISION,
                rainfall DOUBLE PRECISION,
                fire_danger_index DOUBLE PRECISION,
                danger_level INTEGER,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        """))
        conn.commit()

    _exec_ddl("CREATE INDEX IF NOT EXISTS ix_fire_detections_station ON fire_detections(station_code, detected_at DESC)")
    _exec_ddl("CREATE INDEX IF NOT EXISTS ix_weather_records_station ON weather_records(station_code, recorded_at DESC)")


def seed_default_data() -> None:
    """Seed roles, permissions, admin và ranger users nếu chưa tồn tại."""
    db = SessionLocal()
    try:
        # Seed roles
        for name, desc in _DEFAULT_ROLES:
            if not db.query(Role).filter(Role.name == name).first():
                db.add(Role(name=name, description=desc))
        db.commit()

        # Seed permissions
        for name, desc in _DEFAULT_PERMISSIONS:
            if not db.query(Permission).filter(Permission.name == name).first():
                db.add(Permission(name=name, description=desc))
        db.commit()

        # Seed admin user
        if not db.query(User).filter(User.username == "admin").first():
            admin_role = db.query(Role).filter(Role.name == "admin").first()
            admin = User(
                username="admin",
                email="admin@wildfire.local",
                hashed_password=hash_password("Admin@123"),
                is_active=True,
            )
            db.add(admin)
            db.flush()
            if admin_role:
                admin.roles.append(admin_role)
            db.commit()
            print("✅ Admin user created: admin / Admin@123")
        else:
            print("ℹ️  Admin user already exists")

        # Seed ranger users
        ranger_role = db.query(Role).filter(Role.name == "ranger").first()
        for username, email, password in _DEFAULT_RANGERS:
            if not db.query(User).filter(User.username == username).first():
                user = User(
                    username=username,
                    email=email,
                    hashed_password=hash_password(password),
                    is_active=True,
                )
                db.add(user)
                db.flush()
                if ranger_role:
                    user.roles.append(ranger_role)
                db.commit()
                print(f"✅ Ranger created: {username} / {password}")
            else:
                print(f"ℹ️  Ranger '{username}' already exists")

    except Exception as exc:
        db.rollback()
        print(f"⚠️  Seeder error: {exc}")
    finally:
        db.close()
