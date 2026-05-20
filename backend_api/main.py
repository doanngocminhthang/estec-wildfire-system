import os
import json
from pathlib import Path
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from psycopg2.extras import RealDictCursor
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

_BASE_DIR = Path(__file__).parent

# Khởi tạo ứng dụng FastAPI
app = FastAPI(
    title="Wildfire Monitoring API",
    description="API cho hệ thống giám sát và cảnh báo cháy rừng (IGNIS MONITOR)",
    version="1.0.0"
)

# Cấu hình CORS để frontend có thể gọi API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Trong môi trường production nên cấu hình cụ thể domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cấu hình Database từ biến môi trường
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '5433') # Port bên ngoài của PostGIS trong docker-compose là 5433
DB_NAME = os.getenv('DB_NAME', 'wildfire_db')
DB_USER = os.getenv('DB_USER', 'wildfire_admin')
DB_PASS = os.getenv('DB_PASSWORD', 'wildfire_password')

def get_db_connection():
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASS
        )
        return conn
    except Exception as e:
        print(f"Lỗi kết nối cơ sở dữ liệu: {e}")
        return None

# --- Models ---
class Hotspot(BaseModel):
    id: int
    device_id: str
    confidence_score: float
    detected_at: datetime
    longitude: float
    latitude: float
    snapshot_url: Optional[str] = None

class SystemStats(BaseModel):
    total_incidents: int
    active_sensors: int
    avg_confidence: float
    extreme_count: int
    high_count: int
    low_count: int


class Incident(BaseModel):
    id: int
    incident_code: str
    title: str
    status: str
    priority: str
    burn_area_acres: float
    description: Optional[str] = None
    source_hotspot_id: Optional[int] = None
    longitude: Optional[float] = None
    latitude: Optional[float] = None
    created_at: datetime
    updated_at: datetime


class IncidentCreate(BaseModel):
    incident_code: Optional[str] = None
    title: str
    status: str = "uncontrolled"
    priority: str = "medium"
    burn_area_acres: float = 0
    description: Optional[str] = None
    source_hotspot_id: Optional[int] = None
    longitude: Optional[float] = None
    latitude: Optional[float] = None


class IncidentStatusUpdate(BaseModel):
    status: str

# --- Routes ---

@app.get("/")
def read_root():
    return {"message": "Wildfire Monitoring API is running!"}

@app.get("/api/health")
def health_check():
    conn = get_db_connection()
    if conn:
        conn.close()
        return {"status": "healthy", "database": "connected"}
    return {"status": "unhealthy", "database": "disconnected"}

@app.get("/api/hotspots", response_model=List[Hotspot])
def get_hotspots(limit: int = 100):
    """Lấy danh sách các điểm cháy mới nhất."""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Không thể kết nối cơ sở dữ liệu")
        
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        # Sử dụng hàm ST_X và ST_Y của PostGIS để lấy toạ độ
        query = """
            SELECT 
                id, 
                device_id, 
                confidence_score, 
                detected_at, 
                ST_X(geom) as longitude, 
                ST_Y(geom) as latitude, 
                snapshot_url
            FROM hotspots
            ORDER BY detected_at DESC
            LIMIT %s
        """
        cursor.execute(query, (limit,))
        records = cursor.fetchall()
        return records
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.get("/api/hotspots/geojson")
def get_hotspots_geojson(limit: int = 100):
    """Lấy danh sách các điểm cháy dưới dạng GeoJSON để dễ dàng vẽ lên bản đồ."""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Không thể kết nối cơ sở dữ liệu")
        
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        query = """
            SELECT json_build_object(
                'type', 'FeatureCollection',
                'features', json_agg(ST_AsGeoJSON(t.*)::json)
            ) AS geojson
            FROM (
                SELECT id, device_id, confidence_score, detected_at, snapshot_url, geom
                FROM hotspots
                ORDER BY detected_at DESC
                LIMIT %s
            ) AS t;
        """
        cursor.execute(query, (limit,))
        record = cursor.fetchone()
        return record['geojson'] if record and record['geojson'] else {"type": "FeatureCollection", "features": []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.get("/api/hotspots/stats", response_model=SystemStats)
def get_system_stats():
    """Lấy số liệu thống kê tổng quan của hệ thống."""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Không thể kết nối cơ sở dữ liệu")
        
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Tổng số điểm cháy
        cursor.execute("SELECT COUNT(*) as total FROM hotspots")
        total_incidents = cursor.fetchone()['total']
        
        # Số thiết bị (sensor) đang hoạt động (có gửi dữ liệu)
        cursor.execute("SELECT COUNT(DISTINCT device_id) as active_sensors FROM hotspots")
        active_sensors = cursor.fetchone()['active_sensors']
        
        # Mức độ tự tin trung bình
        cursor.execute("SELECT AVG(confidence_score) as avg_confidence FROM hotspots")
        avg_res = cursor.fetchone()['avg_confidence']
        avg_confidence = round(float(avg_res), 2) if avg_res else 0.0
        
        # Mức độ nghiêm trọng
        cursor.execute("SELECT COUNT(*) as extreme_count FROM hotspots WHERE confidence_score > 90")
        extreme_count = cursor.fetchone()['extreme_count']
        
        cursor.execute("SELECT COUNT(*) as high_count FROM hotspots WHERE confidence_score <= 90 AND confidence_score > 70")
        high_count = cursor.fetchone()['high_count']
        
        cursor.execute("SELECT COUNT(*) as low_count FROM hotspots WHERE confidence_score <= 70")
        low_count = cursor.fetchone()['low_count']
        
        return {
            "total_incidents": total_incidents,
            "active_sensors": active_sensors,
            "avg_confidence": avg_confidence,
            "extreme_count": extreme_count,
            "high_count": high_count,
            "low_count": low_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@app.get("/api/boundaries/province")
def get_province_boundary():
    """Ranh giới tỉnh Thanh Hóa (GeoJSON)."""
    path = _BASE_DIR / "thanh_hoa_province.geojson"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Chưa có dữ liệu ranh giới tỉnh")
    return json.loads(path.read_text(encoding="utf-8"))


@app.get("/api/boundaries/districts")
def get_district_boundaries():
    """Ranh giới 27 huyện/thị/thành thuộc tỉnh Thanh Hóa (GeoJSON)."""
    path = _BASE_DIR / "thanh_hoa_districts.geojson"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Chưa có dữ liệu ranh giới huyện")
    return json.loads(path.read_text(encoding="utf-8"))


@app.get("/api/incidents/geojson")
def get_incidents_geojson(status: Optional[str] = Query(default=None)):
    """Lấy sự cố có toạ độ dưới dạng GeoJSON FeatureCollection."""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Không thể kết nối cơ sở dữ liệu")

    cursor = None
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        where = "WHERE geom IS NOT NULL"
        params: list = []
        if status:
            where += " AND status = %s"
            params.append(status)

        cursor.execute(
            f"""
            SELECT json_build_object(
                'type', 'FeatureCollection',
                'features', COALESCE(json_agg(
                    json_build_object(
                        'type', 'Feature',
                        'geometry', ST_AsGeoJSON(geom)::json,
                        'properties', json_build_object(
                            'id',               id,
                            'incident_code',    incident_code,
                            'title',            title,
                            'status',           status,
                            'priority',         priority,
                            'burn_area_acres',  burn_area_acres
                        )
                    )
                ), '[]'::json)
            ) AS geojson
            FROM incidents
            {where}
            """,
            tuple(params),
        )
        record = cursor.fetchone()
        return record["geojson"] if record and record["geojson"] else {"type": "FeatureCollection", "features": []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        conn.close()


@app.get("/api/incidents", response_model=List[Incident])
def get_incidents(
    status: Optional[str] = Query(default=None, description="Lọc theo trạng thái sự cố"),
    limit: int = Query(default=100, ge=1, le=500)
):
    """Lấy danh sách sự cố mới nhất để hiển thị cho trang điều phối."""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Không thể kết nối cơ sở dữ liệu")

    cursor = None
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        query = """
            SELECT
                id,
                incident_code,
                title,
                status,
                priority,
                burn_area_acres,
                description,
                source_hotspot_id,
                ST_X(geom) AS longitude,
                ST_Y(geom) AS latitude,
                created_at,
                updated_at
            FROM incidents
        """
        params = []

        if status:
            query += " WHERE status = %s"
            params.append(status)

        query += " ORDER BY updated_at DESC LIMIT %s"
        params.append(limit)

        cursor.execute(query, tuple(params))
        return cursor.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        conn.close()


@app.get("/api/incidents/{incident_id}", response_model=Incident)
def get_incident_detail(incident_id: int):
    """Lấy chi tiết một sự cố theo ID."""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Không thể kết nối cơ sở dữ liệu")

    cursor = None
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute(
            """
            SELECT
                id,
                incident_code,
                title,
                status,
                priority,
                burn_area_acres,
                description,
                source_hotspot_id,
                ST_X(geom) AS longitude,
                ST_Y(geom) AS latitude,
                created_at,
                updated_at
            FROM incidents
            WHERE id = %s
            """,
            (incident_id,),
        )
        incident = cursor.fetchone()
        if not incident:
            raise HTTPException(status_code=404, detail="Không tìm thấy sự cố")
        return incident
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        conn.close()


@app.post("/api/incidents", response_model=Incident, status_code=201)
def create_incident(payload: IncidentCreate):
    """Tạo một sự cố mới từ dữ liệu điều phối hoặc từ luồng cảnh báo."""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Không thể kết nối cơ sở dữ liệu")

    cursor = None
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        incident_code = payload.incident_code or f"INC-{datetime.now().strftime('%Y%m%d%H%M%S')}"

        cursor.execute(
            """
            INSERT INTO incidents (
                incident_code,
                title,
                status,
                priority,
                burn_area_acres,
                description,
                source_hotspot_id,
                geom
            )
            VALUES (
                %s, %s, %s, %s, %s, %s, %s,
                CASE
                    WHEN %s IS NULL OR %s IS NULL THEN NULL
                    ELSE ST_SetSRID(ST_MakePoint(%s, %s), 4326)
                END
            )
            RETURNING
                id,
                incident_code,
                title,
                status,
                priority,
                burn_area_acres,
                description,
                source_hotspot_id,
                ST_X(geom) AS longitude,
                ST_Y(geom) AS latitude,
                created_at,
                updated_at
            """,
            (
                incident_code,
                payload.title,
                payload.status,
                payload.priority,
                payload.burn_area_acres,
                payload.description,
                payload.source_hotspot_id,
                payload.longitude,
                payload.latitude,
                payload.longitude,
                payload.latitude,
            ),
        )
        created = cursor.fetchone()
        conn.commit()
        return created
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        raise HTTPException(status_code=409, detail="incident_code đã tồn tại")
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        conn.close()


@app.patch("/api/incidents/{incident_id}/status", response_model=Incident)
def update_incident_status(incident_id: int, payload: IncidentStatusUpdate):
    """Cập nhật trạng thái xử lý sự cố."""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Không thể kết nối cơ sở dữ liệu")

    cursor = None
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute(
            """
            UPDATE incidents
            SET status = %s, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
            RETURNING
                id,
                incident_code,
                title,
                status,
                priority,
                burn_area_acres,
                description,
                source_hotspot_id,
                ST_X(geom) AS longitude,
                ST_Y(geom) AS latitude,
                created_at,
                updated_at
            """,
            (payload.status, incident_id),
        )
        updated = cursor.fetchone()
        if not updated:
            conn.rollback()
            raise HTTPException(status_code=404, detail="Không tìm thấy sự cố")

        conn.commit()
        return updated
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        conn.close()
