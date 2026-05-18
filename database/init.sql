-- Kích hoạt extension PostGIS cho cơ sở dữ liệu (Database PostGIS image tự động gọi script này nếu đặt trong docker-entrypoint-initdb.d)
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Tạo bảng quản lý điểm cháy (Hotspots)
CREATE TABLE IF NOT EXISTS hotspots (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(100) NOT NULL,
    confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 100),
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    geom geometry(Point, 4326), -- Tọa độ địa lý (Kinh độ, Vĩ độ) chuẩn EPSG:4326
    snapshot_url VARCHAR(255)
);

-- Tạo Index trên cột không gian (geom) để tối ưu truy vấn GIS
CREATE INDEX IF NOT EXISTS hotspots_geom_idx ON hotspots USING GIST (geom);

-- Chèn dữ liệu mẫu (Dummy data) cho test
INSERT INTO hotspots (device_id, confidence_score, geom, snapshot_url)
VALUES 
    ('CAM_001', 95.5, ST_SetSRID(ST_MakePoint(105.804817, 21.028511), 4326), 'dummy_url_1.jpg'),
    ('DRONE_02', 88.0, ST_SetSRID(ST_MakePoint(105.815, 21.030), 4326), 'dummy_url_2.jpg')
ON CONFLICT DO NOTHING;
