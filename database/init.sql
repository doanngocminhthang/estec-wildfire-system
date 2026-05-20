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

-- Bảng sự cố tổng hợp phục vụ điều phối xử lý (incident lifecycle)
CREATE TABLE IF NOT EXISTS incidents (
    id SERIAL PRIMARY KEY,
    incident_code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(150) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'uncontrolled' CHECK (status IN ('uncontrolled', 'containing', 'controlled')),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    burn_area_acres FLOAT NOT NULL DEFAULT 0,
    source_hotspot_id INTEGER REFERENCES hotspots(id) ON DELETE SET NULL,
    geom geometry(Point, 4326),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS incidents_geom_idx ON incidents USING GIST (geom);

-- =====================================================================
-- Auth tables
-- =====================================================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    changes JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Default roles
INSERT INTO roles (name, description) VALUES
    ('admin', 'Quản trị hệ thống'),
    ('dispatcher', 'Điều phối viên'),
    ('ranger', 'Kiểm lâm viên'),
    ('citizen', 'Công dân')
ON CONFLICT (name) DO NOTHING;

-- Default permissions
INSERT INTO permissions (name, description) VALUES
    ('view_incidents', 'Xem sự cố'),
    ('create_incidents', 'Tạo sự cố'),
    ('edit_incidents', 'Chỉnh sửa sự cố'),
    ('delete_incidents', 'Xóa sự cố'),
    ('view_users', 'Xem người dùng'),
    ('manage_users', 'Quản lý người dùng'),
    ('view_hotspots', 'Xem điểm cháy'),
    ('view_analytics', 'Xem phân tích')
ON CONFLICT (name) DO NOTHING;

-- =====================================================================
-- Chèn dữ liệu mẫu (Dummy data) cho test
INSERT INTO hotspots (device_id, confidence_score, geom, snapshot_url)
VALUES 
    ('CAM_001', 95.5, ST_SetSRID(ST_MakePoint(105.804817, 21.028511), 4326), 'dummy_url_1.jpg'),
    ('DRONE_02', 88.0, ST_SetSRID(ST_MakePoint(105.815, 21.030), 4326), 'dummy_url_2.jpg')
ON CONFLICT DO NOTHING;

-- Chèn dữ liệu sự cố mẫu cho trang incidents/map
INSERT INTO incidents (incident_code, title, status, priority, burn_area_acres, geom, description)
VALUES
    ('EV-009', 'Echo-Victor 9', 'uncontrolled', 'critical', 1420, ST_SetSRID(ST_MakePoint(105.8042, 21.0310), 4326), 'Rapid spread detected, wind shifts favoring eastern flank.'),
    ('SD-002', 'Sierra-Delta 2', 'containing', 'high', 530, ST_SetSRID(ST_MakePoint(105.8125, 21.0298), 4326), 'Perimeter holding. Aerial support active.'),
    ('BT-004', 'Bravo-Tango 4', 'controlled', 'medium', 110, ST_SetSRID(ST_MakePoint(105.8190, 21.0331), 4326), 'Mop-up operations in progress.')
ON CONFLICT (incident_code) DO NOTHING;
