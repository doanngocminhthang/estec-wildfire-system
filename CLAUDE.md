# IGNIS MONITOR — Wildfire Monitoring System

Hệ thống giám sát và cảnh báo cháy rừng cho tỉnh Thanh Hóa (ESTEC).

## Tổng quan kiến trúc

```
frontend-app/   React 18 + Vite + TypeScript + Tailwind CSS + i18next (vi/en)
backend_api/    FastAPI (Python) — hai layer: main.py (legacy) + app/ (mới)
ingestion_worker/ Python — nhận MQTT → lưu DB
database/       init.sql — PostgreSQL + PostGIS schema
docker-compose.yml  — tất cả services
```

**Stack:**
- DB: PostgreSQL 15 + PostGIS (`wildfire_postgis`, port 5433)
- Cache: Redis 7 (`wildfire_redis`, port 6379)
- MQTT: Eclipse Mosquitto 2 (`wildfire_mqtt`, port 1883/9001)
- Backend: FastAPI trên port 8000 (`wildfire_backend`)
- Frontend dev: Vite trên port 3000 (proxy `/api` → `localhost:8000`)
- GeoServer: port 8080 (bản đồ GIS, chạy riêng khi cần)

## Chạy dự án

```bash
# Khởi động toàn bộ backend (DB + Redis + MQTT + API)
docker compose up -d db redis mqtt backend_api

# Frontend dev server
cd frontend-app
npm install   # lần đầu
npx vite --host
# → http://localhost:3000
```

**Tài khoản mặc định (seeded tự động):**
- Admin: `admin` / `Admin@123`
- Ranger: `ranger01–03` / `Ranger@123`

**Health check:**
```bash
curl http://localhost:8000/api/v1/health
```

## Cấu trúc Backend (`backend_api/`)

```
main.py                  Legacy API (hotspots, incidents, search, boundaries)
app/
  main.py                FastAPI app entry — mount /api/v1
  core/config.py         Settings (pydantic-settings, đọc .env)
  core/security.py       JWT + password hashing (bcrypt)
  db/models.py           SQLAlchemy ORM models
  db/seed.py             migrate_schema() + seed_default_data() (chạy lúc startup)
  api/v1/endpoints/      auth, users, tasks, bulletins, firms, cameras, sensors,
                         integrations, audit, ws
  services/              auth_service, firms_service, camera_geo, email_alert,
                         webhook_service, task_service, user_service
  middleware/auth.py     JWT middleware
  schemas/               Pydantic request/response schemas
```

**API base path:** `/api/v1/` (app mới) và `/api/` (legacy main.py)

**Auth flow:** JWT Bearer token → lưu `localStorage('access_token')` + `localStorage('user')`.

## Cấu trúc Frontend (`frontend-app/src/`)

```
pages/         Dashboard, Hotspots, Incidents, MapPage, CameraStations,
               Bulletins, Users, Tasks, AuditLog, Integrations,
               Analytics, Search, Profile, Login, FAQ, ...
components/    Layout, Sidebar, ProtectedRoute, NotificationBell, LangSwitcher
store/         authStore.ts (Zustand)
api/           client.ts (axios, baseURL=/api/v1), dataClient.ts (legacy /api)
i18n/          vi.json + en.json — 100% i18n, key lưu localStorage('wf-lang')
utils/         exportUtils.ts
```

**Routing:** React Router v6. Protected routes kiểm tra `useAuthStore().isAuthenticated()`.

**Role-based UI:** `useAuthStore().hasRole('admin')` — roles: `admin | dispatcher | ranger | citizen`.

## Database schema chính

| Bảng | Mô tả |
|---|---|
| `hotspots` | Điểm cháy (IoT + FIRMS satellite). Có cột `geom` (PostGIS Point 4326), `satellite`, `source`, `frp`, `firms_uid` |
| `incidents` | Sự cố cháy rừng. `status`: `uncontrolled/containing/controlled`. `priority`: `low/medium/high/critical` |
| `camera_stations` | Trạm camera quan sát — PTZ, RTSP, tọa độ, thông số quang học |
| `fire_detections` | Kết quả AI phát hiện cháy từ camera |
| `weather_records` | Dữ liệu thời tiết từ sensor (nhiệt độ, độ ẩm, chỉ số P) |
| `tasks` | Nhiệm vụ gắn với incident. `status`: `pending/in_progress/done/cancelled` |
| `bulletins` | Thông báo hệ thống. `priority`: `info/warning/critical` |
| `users/roles/permissions` | RBAC: user_roles (n-n), role_permissions (n-n) |
| `api_keys` | API key cho tích hợp bên ngoài (SHA-256 hash) |
| `webhooks` | Push notification đến hệ thống ngoài (HMAC-SHA256) |
| `audit_logs` | Log hành động người dùng |

**Schema migrations:** `db/seed.py::migrate_schema()` — idempotent, chạy tự động khi backend start. Không dùng Alembic cho migrations thực tế.

## Cấu hình môi trường

File `.env` trong `backend_api/` (xem `.env.example`):

```
DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
JWT_SECRET_KEY
REDIS_URL
MQTT_HOST, MQTT_PORT
FIRMS_MAP_KEY          # NASA FIRMS API key (miễn phí)
FIRMS_BBOX             # default: 104.2,19.0,106.5,20.8 (Thanh Hóa)
FIRMS_SYNC_HOURS       # tự động sync mỗi N giờ (0=tắt)
SMTP_HOST, SMTP_PORT, SMTP_SENDER_EMAIL, SMTP_SENDER_PASSWORD
ALERT_EMAIL_RECIPIENTS # comma-separated
```

## Conventions

- **Python:** FastAPI dependency injection qua `Depends()`. DB session qua `SessionLocal`. Pydantic v2 schemas tách biệt với ORM models.
- **TypeScript:** Zustand cho global state (auth). Axios interceptor tự động gắn Bearer token. 401 trên auth endpoint → force logout; 401 trên data endpoint khi có token → không logout (backend nên trả 403).
- **i18n:** Mọi text người dùng thấy phải có key trong cả `vi.json` và `en.json`. Dùng `useTranslation()` hook.
- **Geometry:** Tọa độ lưu dạng PostGIS `geometry(Point, 4326)`. Query dùng `ST_X(geom)` / `ST_Y(geom)`, insert dùng `ST_SetSRID(ST_MakePoint(lng, lat), 4326)`.

## Lưu ý quan trọng

- Port DB ra ngoài là **5433** (không phải 5432) để tránh xung đột với PostgreSQL local.
- `backend_api/main.py` là legacy entry point (direct psycopg2). `backend_api/app/` là app mới (SQLAlchemy + dependency injection). Frontend dùng cả hai: `/api/v1/*` cho app mới, `/api/*` cho legacy.
- Camera AI (OpenCV, YOLOv5/v8, rasterio) là tùy chọn — không cài mặc định.
- GeoServer (`wildfire_geoserver`, port 8080) chạy riêng, chỉ cần khi làm việc với WMS/WFS layers.
