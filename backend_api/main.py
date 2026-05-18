import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from psycopg2.extras import RealDictCursor
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

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
        
        return {
            "total_incidents": total_incidents,
            "active_sensors": active_sensors,
            "avg_confidence": avg_confidence
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()
