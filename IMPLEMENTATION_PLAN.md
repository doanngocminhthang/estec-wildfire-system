# 🚀 IMPLEMENTATION PLAN: ESTEC Wildfire - Thanh Hóa
**Version:** 1.0 | **Date:** May 18, 2026 | **Status:** Active Development

---

## 📊 PROJECT OVERVIEW

| Item | Details |
|------|---------|
| **Project Name** | ESTEC Wildfire Detection & Management System (Thanh Hóa Expansion) |
| **Codebase Transition** | Wildfire---Web---HoanVo (Django) → estec-wildfire-code (FastAPI) |
| **Current Team** | 5 people (1 Full-stack, 1 Frontend, 1 AI, 2 DevOps/QA) |
| **Target Team** | 9 people (+4 additions in Month 2-3) |
| **Timeline** | 6 months (26 weeks, 6 sprints) |
| **Deployment** | On-premise Server (Thanh Hóa) |
| **Current Issues** | Performance bottlenecks, functional gaps, weak security/RBAC, outdated UI |

---

## 🎯 KEY OBJECTIVES

### Must-Have (Giai đoạn 1: Month 1-3)
- ✅ Migrate Django → FastAPI (performance, real-time)
- ✅ Fix security issues (RBAC, JWT, rate-limiting)
- ✅ Optimize database queries + caching (Redis)
- ✅ Modernize UI/UX (React/Next.js + Tailwind)
- ✅ Real-time incident dashboard (WebSocket)

### Should-Have (Giai đoạn 2: Month 4-5)
- 🔄 AI detection integration (YOLOv8 inference server)
- 🔄 Hikvision camera integration + RTSP stream processing
- 🔄 Nesterov Fire Weather Index forecasting
- 🔄 Response unit management + dispatcher dashboard

### Nice-to-Have (Giai đoạn 3: Month 6)
- 📱 Mobile app (Flutter) - offline sync
- 📊 Advanced analytics + PDF export
- 🛡️ Security audit + penetration testing
- 📈 Load testing (100+ RPS) + optimization

---

## 📋 TEAM STRUCTURE & RESPONSIBILITIES

```
Project Lead/Tech Lead (Coordinator)
│
├─── Full-stack Backend Developer (1 person)
│    ├─ FastAPI API development
│    ├─ Database schema + optimization
│    ├─ RBAC + Auth middleware
│    └─ Real-time WebSocket handlers
│
├─── Frontend Developer (1 person)
│    ├─ React/Next.js UI components
│    ├─ MapLibre GL map integration
│    ├─ Dashboard + incident management UI
│    └─ Form validation + state management
│
├─── AI/ML Engineer (1 person)
│    ├─ YOLOv8 model serving
│    ├─ Camera stream processing
│    ├─ Fire Weather Index model
│    └─ Model optimization + edge deployment
│
└─── DevOps/QA Team (2 people)
     ├─ Docker + Docker Compose setup
     ├─ Database administration (PostgreSQL+PostGIS)
     ├─ Automated testing (pytest, Playwright)
     ├─ Deployment scripting
     └─ Performance monitoring (Prometheus/Grafana)
```

**Hiring Plan (Month 2-3):**
- +1 Senior Backend (scale FastAPI architecture)
- +1 Frontend/Full-stack (scale UI components)
- +1 DevOps/SRE (Kubernetes, monitoring)
- +1 QA Automation Engineer

---

## 🗓️ 6-MONTH SPRINT BREAKDOWN

### SPRINT 1 (Week 1-4): Foundation & Architecture
**Goal:** Project bootstrap + FastAPI setup + team alignment

**Task List:**
```
1.1 [Backend] Set up FastAPI project structure
    ├─ FastAPI app initialization
    ├─ Pydantic models for data validation
    ├─ Database connection (PostgreSQL+PostGIS)
    ├─ Alembic migrations setup
    └─ Requirements.txt with core dependencies

1.2 [DevOps] Docker Compose stack v1
    ├─ FastAPI service container
    ├─ PostgreSQL+PostGIS container
    ├─ Redis cache container
    ├─ MQTT broker (Mosquitto) container
    ├─ Nginx reverse proxy
    └─ Health checks for all services

1.3 [Backend] Authentication & RBAC foundation
    ├─ JWT token generation/validation
    ├─ Login endpoint (POST /api/auth/login)
    ├─ User roles enum: admin, dispatcher, ranger, citizen
    ├─ Role-based permission decorator
    └─ Audit log table + middleware

1.4 [Frontend] React/Next.js project init
    ├─ Next.js 14+ setup with TypeScript
    ├─ Tailwind CSS + UI component library
    ├─ Redux Toolkit for state management
    ├─ Layout skeleton (sidebar + top bar)
    └─ Basic routing structure

1.5 [DevOps] CI/CD pipeline phase 1
    ├─ GitHub Actions workflow (lint, test, build)
    ├─ Docker image build & push to registry
    ├─ README with setup instructions
    └─ .env.example template

**Deliverable:** 
- Working FastAPI + React dev environment (localhost:3000 + localhost:8000)
- Team can docker-compose up and develop
- Passing CI/CD on PRs
```

---

### SPRINT 2 (Week 5-8): User Management & Database
**Goal:** User system + spatial database + basic APIs

**Task List:**
```
2.1 [Backend] User/Role management APIs
    ├─ POST /api/users (create user)
    ├─ GET /api/users (list, with pagination)
    ├─ PATCH /api/users/{id} (update profile)
    ├─ DELETE /api/users/{id} (soft delete)
    ├─ POST /api/roles (CRUD role permissions)
    └─ Password reset flow (OTP/Email)

2.2 [Backend] Region (địa bàn) management
    ├─ Regions table (geometry POLYGON for boundaries)
    ├─ Region metadata (name, fire_class, managed_by_unit)
    ├─ Spatial index on geometry
    ├─ GET /api/regions (list with GeoJSON)
    └─ Permission filtering (user can only see assigned regions)

2.3 [Backend] Database optimization
    ├─ Add indexes on foreign keys
    ├─ Analyze query performance (EXPLAIN)
    ├─ Add Redis connection pool
    ├─ Caching decorator for repeated queries
    └─ Audit log retention policy (6 months)

2.4 [Frontend] Login & authorization flow
    ├─ Login page UI
    ├─ JWT token storage (localStorage/sessionStorage)
    ├─ Protected routes + redirect to login
    ├─ User profile page (view/edit)
    └─ Logout functionality

2.5 [Frontend] Map component integration
    ├─ MapLibre GL initialization
    ├─ OSM/Satellite base layer toggle
    ├─ Region boundary overlay (from /api/regions)
    ├─ Zoom/pan controls
    └─ Responsive design

**Deliverable:**
- User system fully functional (signup → login → dashboard)
- Spatial regions visible on map
- Authorization working (role-based access)
```

---

### SPRINT 3 (Week 9-12): Real-time Incident Management
**Goal:** Hotspots + Incidents + WebSocket live updates

**Task List:**
```
3.1 [Backend] Hotspots & Incidents APIs
    ├─ POST /api/hotspots (create from sensor/camera)
    ├─ GET /api/hotspots (spatial query within region)
    ├─ POST /api/incidents (create from hotspot)
    ├─ PATCH /api/incidents/{id}/status (update: uncontrolled→containing→controlled→closed)
    ├─ GET /api/incidents/{id} (detail with timeline)
    ├─ Spatial filtering by region + confidence threshold
    └─ Response time optimization (<300ms p95)

3.2 [Backend] Real-time WebSocket
    ├─ WebSocket endpoint setup (ws://localhost:8000/ws/dashboard)
    ├─ Broadcast incident updates to connected clients
    ├─ Heartbeat keep-alive mechanism
    ├─ Connection pool management
    └─ Error handling + reconnection logic

3.3 [Backend] Alert generation & notifications
    ├─ Alert triggering logic (hotspot.confidence > threshold)
    ├─ MQTT publish to topic wildfire/alerts
    ├─ Email notification (SMTP integration)
    ├─ SMS gateway integration (optional)
    ├─ In-app notification model
    └─ Notification preference settings (by role)

3.4 [Frontend] Incident management dashboard
    ├─ Incident list view (sortable, filterable)
    ├─ Incident detail panel (coordinates, status, timeline)
    ├─ Real-time marker animation on map
    ├─ Status change dropdown (with confirmation)
    ├─ Comment/note section on incident
    └─ Live update refresh rate: 1-5 seconds

3.5 [Frontend] Map layer controls
    ├─ Toggle hotspot markers on/off
    ├─ Toggle incident polygons
    ├─ Color coding by severity (green/yellow/red)
    ├─ Heatmap overlay option
    ├─ Legend + scale display
    └─ Click-to-view incident details

**Deliverable:**
- Create incident → See on map in real-time → Update status
- Multiple users connected see updates simultaneously (WebSocket)
- Full incident lifecycle working
```

---

### SPRINT 4 (Week 13-16): AI Detection & Sensor Integration
**Goal:** YOLOv8 inference + camera stream processing + forecasting

**Task List:**
```
4.1 [AI] YOLOv8 inference service
    ├─ Model loading (YOLOv8n for edge, YOLOv8m for accuracy)
    ├─ ONNX runtime setup (for edge deployment)
    ├─ Image upload endpoint: POST /api/ai/detect
    ├─ Confidence filtering (threshold configurable)
    ├─ Output: bounding box + confidence + coordinates
    ├─ Inference latency optimization (<500ms)
    └─ Model versioning support

4.2 [DevOps] Hikvision camera integration
    ├─ RTSP stream consumer (ffmpeg + OpenCV)
    ├─ Frame extraction every N seconds
    ├─ Send frame to AI service for inference
    ├─ Store detection result to database
    ├─ Error handling (stream loss, network interruption)
    └─ Camera status monitoring

4.3 [Backend] Sensor data ingestion
    ├─ MQTT consumer for IoT sensors
    ├─ Weather station data: temperature, humidity, wind
    ├─ Smoke/CO sensors integration
    ├─ Data validation + outlier detection
    ├─ Store to TimescaleDB hypertable
    └─ Real-time metric aggregation (5-min intervals)

4.4 [Backend] Fire Weather Index (Nesterov Index)
    ├─ Fetch weather data (daily)
    ├─ Calculate FWI = temperature + humidity + wind
    ├─ Classify risk level: I, II, III, IV, V
    ├─ Display risk heatmap on map
    ├─ Forecast for next 7 days
    └─ Alert when FWI crosses threshold

4.5 [DevOps] AI service containerization
    ├─ Separate Docker image for AI inference
    ├─ GPU support (NVIDIA CUDA if available)
    ├─ Model caching + serving optimization
    ├─ Health check endpoint
    └─ Scalable deployment (multiple replicas)

**Deliverable:**
- Upload image → AI detects fire → Alert auto-generated
- Camera stream continuously monitored
- Risk forecast visible on dashboard
```

---

### SPRINT 5 (Week 17-20): Response Management & Mobile
**Goal:** Dispatcher operations + field team coordination + mobile app

**Task List:**
```
5.1 [Backend] Response unit management
    ├─ Response units table (name, type: engine/truck/crew, location, status)
    ├─ Assignment logic (find nearest available unit)
    ├─ POST /api/assignments (create task → send to unit)
    ├─ PATCH /api/assignments/{id}/status (in-transit → on-scene → done)
    ├─ Track unit geolocation (live tracking)
    ├─ Estimated arrival time (ETA) calculation
    └─ Resource utilization metrics

5.2 [Frontend] Dispatcher dashboard
    ├─ Unit map view (live location + status)
    ├─ Assignment creation workflow
    ├─ Drag-drop incident to unit assignment
    ├─ Communication panel (message to units)
    ├─ KPI dashboard (avg response time, units in use)
    └─ Resource allocation suggestions (AI-driven)

5.3 [Mobile/Flutter] Mobile app skeleton
    ├─ Flutter project setup
    ├─ Bottom tab navigation (Tasks, Map, Profile, Settings)
    ├─ Authentication flow (login → token storage)
    ├─ Offline-first architecture (local SQLite)
    ├─ Network connectivity detection
    └─ Push notification setup

5.4 [Mobile/Flutter] Field team operations
    ├─ Assigned tasks list view
    ├─ Task detail + map navigation
    ├─ Status update buttons (on-way, arrived, completed)
    ├─ Photo/video capture + upload
    ├─ Real-time geolocation sharing
    ├─ Offline task cache + auto-sync when online
    └─ SOS button for emergency

5.5 [Backend] Mobile API endpoints
    ├─ GET /api/tasks/me (assigned to current user)
    ├─ PATCH /api/tasks/{id}/status
    ├─ POST /api/tasks/{id}/evidence (photo/video upload)
    ├─ POST /api/location/track (geolocation ping)
    ├─ Lightweight responses for mobile (gzip, pagination)
    └─ Offline sync endpoint (delta sync)

**Deliverable:**
- Dispatcher assigns incident → Unit receives notification on mobile
- Field team updates status → Dispatcher sees real-time
- Offline support (works without internet)
```

---

### SPRINT 6 (Week 21-26): Analytics, Reporting & Production Hardening
**Goal:** Dashboards + Reports + Security + Performance + Deployment ready

**Task List:**
```
6.1 [Backend] Reporting & export
    ├─ POST /api/reports/generate (PDF, Excel templates)
    ├─ Scheduled reports (daily, weekly, monthly)
    ├─ Data filtering (date range, region, status)
    ├─ Export to CSV, GeoJSON, KML
    ├─ Digital signature integration (if required)
    └─ Report access logging (audit trail)

6.2 [Frontend] Analytics dashboard
    ├─ KPI cards (total incidents, avg response time, units utilized)
    ├─ Timeline chart (incidents per day/hour)
    ├─ Heatmap (incident density by region)
    ├─ Trending analysis (month-over-month)
    ├─ Drill-down capability (click chart → detail view)
    └─ Export reports directly from dashboard

6.3 [DevOps] Security & performance
    ├─ Penetration testing + vulnerability scan
    ├─ OWASP top 10 remediation
    ├─ Database encryption at rest + in transit (SSL/TLS)
    ├─ Secret management (env vars, vault)
    ├─ API rate-limiting per user/role
    └─ SQL injection prevention + input validation

6.4 [DevOps] Load testing & optimization
    ├─ Apache JMeter / k6 load test (100+ concurrent users)
    ├─ Identify bottlenecks (DB, API, frontend)
    ├─ Cache layer tuning (Redis TTL)
    ├─ Database query optimization (EXPLAIN ANALYZE)
    ├─ Frontend code splitting + lazy loading
    └─ Document optimization results

6.5 [DevOps] Production deployment
    ├─ Kubernetes manifests (if scaling beyond single server)
    ├─ Or: VM deployment scripts (systemd services, Nginx config)
    ├─ Database backup strategy (daily snapshots)
    ├─ Disaster recovery plan (RTO/RPO)
    ├─ Monitoring stack (Prometheus + Grafana + Loki)
    ├─ Alert thresholds (CPU, memory, disk, API errors)
    └─ Runbook for on-call support

6.6 [All] Documentation & knowledge transfer
    ├─ API documentation (OpenAPI/Swagger)
    ├─ User manual (screenshots, workflows)
    ├─ System architecture diagram
    ├─ Troubleshooting guide
    ├─ Developer setup guide
    └─ Team training sessions

6.7 [All] Testing coverage
    ├─ Unit tests (>80% code coverage)
    ├─ Integration tests (API endpoints)
    ├─ E2E tests (critical user workflows)
    ├─ Mobile app testing (on real devices/emulator)
    └─ Load/stress testing

**Deliverable:**
- Production-ready system deployed on Thanh Hóa server
- All teams trained + documentation complete
- Monitoring in place + incident response procedures ready
```

---

## 📈 SUCCESS METRICS

| Metric | Target | Timeline |
|--------|--------|----------|
| **Performance** | API p95 latency < 300ms | Week 8 |
| **Uptime** | 99.5% availability | Week 26 |
| **Code Coverage** | >80% test coverage | Week 24 |
| **Security** | Zero OWASP Top 10 issues | Week 24 |
| **User Adoption** | 10+ concurrent users on Day 1 | Week 26 |
| **AI Accuracy** | Detection confidence ≥92% | Week 16 |
| **Response Time** | Incident alert sent <30 seconds | Week 12 |
| **Mobile** | Offline sync works, <100MB app size | Week 20 |

---

## 🛠️ TECH STACK FINALIZED

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Backend API** | FastAPI + Uvicorn + Pydantic | Async, high-throughput |
| **Frontend** | React 18 + Next.js 14 + TypeScript | SSR, SEO-friendly |
| **Mobile** | Flutter 3.13+ | Android 8+ / iOS 14+ |
| **Database** | PostgreSQL 15 + PostGIS + TimescaleDB | Spatial + time-series |
| **Cache** | Redis 7+ | Session, real-time data |
| **Message Queue** | RabbitMQ or NATS | Async task processing |
| **Message Broker** | MQTT (Mosquitto/EMQX) | IoT sensor communication |
| **AI/ML** | PyTorch + YOLOv8 + ONNX | Edge inference capable |
| **Container** | Docker + Docker Compose | Dev & deployment |
| **Web Server** | Nginx | Reverse proxy, SSL termination |
| **Monitoring** | Prometheus + Grafana + Loki | Metrics, logs, alerts |
| **CI/CD** | GitHub Actions | Auto lint, test, build |

---

## 🚀 GETTING STARTED

### Prerequisites
```bash
# Install Docker & Docker Compose
# Install Python 3.11+
# Install Node.js 18+
# Install Git

# Clone repo
git clone https://github.com/doanngocminhthang/estec-wildfire-system.git
cd estec-wildfire-code

# Copy env template
cp .env.example .env

# Start stack
docker-compose up -d

# Initialize database
docker exec estec-wildfire-db psql -U wildfire_admin -d wildfire_db -f database/init.sql

# Start development servers
# Backend: cd backend_api && python -m uvicorn main:app --reload
# Frontend: cd frontend-code && npm run dev
```

---

## 📞 CONTACTS & ESCALATION

| Role | Person | Contact |
|------|--------|---------|
| **Project Lead** | [Name] | [Email] |
| **Tech Lead** | [Name] | [Email] |
| **Backend Lead** | [Name] | [Email] |
| **Frontend Lead** | [Name] | [Email] |
| **AI/ML Lead** | [Name] | [Email] |

---

## 📝 CHANGE LOG

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | May 18, 2026 | Initial plan created (FastAPI migration, 6 sprints, 5-person team) |

---

**Status:** ✅ READY FOR EXECUTION | **Next Meeting:** Week 1 Day 1 (Project Kickoff)
