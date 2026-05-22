# 🔥 ESTEC Wildfire Detection & Management System
**Hệ thống Giám sát và Phát hiện Cháy rừng**

![Status](https://img.shields.io/badge/Status-Development-blue)
![Version](https://img.shields.io/badge/Version-1.0.0-green)
![Team](https://img.shields.io/badge/Team-5%2F9-orange)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 📖 OVERVIEW

**ESTEC Wildfire System** is a comprehensive **AI-powered forest fire detection and management platform** designed for Thanh Hóa Province (Vietnam). The system integrates:

- 🤖 **AI Detection** (YOLOv8) for real-time smoke/fire identification from camera streams
- 🗺️ **GIS Mapping** (PostGIS) for spatial analysis and incident tracking
- 📱 **Mobile App** (Flutter) for field teams with offline-first support
- ⚡ **Real-time Dashboard** (React/Next.js) for dispatch operations
- 🔐 **Security & RBAC** for role-based access control
- ☁️ **Scalable Architecture** (FastAPI, PostgreSQL, Docker)

**Current Phase:** Transitioning from Django to **FastAPI modern stack** (v1.0 May 2026)

---

## 🎯 PROJECT GOALS

### Business Objectives
- Detect forest fires **<5 minutes** (currently ~30 min avg)
- Achieve **>90% incident response accuracy**
- Enable data-driven decision making for forestry officials
- Engage community in fire monitoring + reporting

### Technical Objectives
- API handling **≥100 RPS** with p95 latency <300ms
- AI model accuracy **≥92%** on test dataset
- System uptime **99.5%** availability
- Support **10+ concurrent users** in initial phase
- Scale to **26+ camera nodes** (Thanh Hóa expansion)

---

## 🏗️ SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND LAYER                                               │
├─ Web Dashboard (React/Next.js)  │  Mobile App (Flutter)  ──┤
└──────────────────┬────────────────────────────────┬─────────┘
                   │ REST/WebSocket                  │ REST/Push
┌──────────────────▼────────────────────────────────▼─────────┐
│ NGINX REVERSE PROXY (Rate-Limiting, SSL, Load-Balancing)   │
└──────────────────┬────────────────────────────────────────┬─┘
                   │ HTTP 1.1 / 2                          │
┌──────────────────▼────────────────────────────────────────▼┐
│ FASTAPI MICROSERVICES                                       │
├─ Auth Service      │ Incident API  │ AI Service            │
├─ User Management   │ Real-time WS  │ Forecast Engine       │
├─ Region CRUD       │ Notifications │ IoT Ingestion         │
└──────────────┬──────────────────────────────┬───────────────┘
               │ SQL Queries                  │ MQTT/HTTP
┌──────────────▼──────────────────────────────▼────────────────┐
│ DATA LAYER                                                    │
├─ PostgreSQL 15  (Users, Incidents, Audit Logs)             │
├─ PostGIS        (Spatial queries, geometry)                 │
├─ TimescaleDB    (Time-series sensor readings)               │
├─ Redis 7        (Session cache, real-time data)             │
└──────────────┬──────────────────┬──────────────────────────┘
               │                  │
┌──────────────▼──┐  ┌────────────▼───────┐
│ Mosquitto MQTT  │  │ MinIO S3 Storage   │
│ (IoT sensors)   │  │ (Images, videos)   │
└─────────────────┘  └────────────────────┘
```

---

## 📋 TECH STACK

| Layer | Technology | Why |
|-------|-----------|-----|
| **Backend** | FastAPI + Uvicorn + SQLAlchemy | Async, modern, high-performance |
| **Frontend** | React 18 + Next.js 14 + TypeScript + Tailwind | Type-safe, SSR, component-driven |
| **Mobile** | Flutter 3.13+ | One codebase for iOS/Android, offline-first |
| **Database** | PostgreSQL 15 + PostGIS + TimescaleDB | Spatial data + time-series + ACID |
| **Cache** | Redis 7 | Session management + real-time data |
| **Message Queue** | RabbitMQ / NATS | Async task processing |
| **Message Broker** | MQTT (Mosquitto/EMQX) | IoT sensor communication |
| **AI/ML** | PyTorch + YOLOv8 + ONNX | Real-time fire detection |
| **Container** | Docker + Docker Compose | Reproducible local dev + deployment |
| **Web Server** | Nginx | Reverse proxy, load balancing |
| **Monitoring** | Prometheus + Grafana + Loki | Metrics, logs, alerts |
| **CI/CD** | GitHub Actions | Auto-build, test, push to registry |

---

## 🚀 GETTING STARTED

### Requirements
- Python 3.11+
- Node.js 18+ LTS
- Docker Desktop (latest)
- Git 2.39+

### Quick Start (5 minutes)
```bash
# Clone repository
git clone https://github.com/doanngocminhthang/estec-wildfire-system.git
cd estec-wildfire-code

# Copy environment
cp .env.example .env

# Start Docker stack
docker-compose up -d

# Initialize database
docker exec estec-wildfire-db psql -U wildfire_admin -d wildfire_db -f /docker-entrypoint-initdb.d/01-init.sql

# Start backend (new terminal)
cd backend_api && pip install -r requirements.txt
python -m uvicorn app.main:app --reload

# Start frontend (new terminal)
cd frontend-code && npm install && npm run dev

# Open browser
# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/docs
```

**👉 Full guide:** See [QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md)

---

## 📅 PROJECT ROADMAP (6 Months)

### PHASE 1: Foundation (Week 1-8)
- ✅ FastAPI project structure
- ✅ PostgreSQL + PostGIS setup
- ✅ JWT Authentication + RBAC
- ✅ React/Next.js frontend scaffold
- ✅ Docker Compose stack
- ✅ CI/CD pipeline

### PHASE 2: Real-time Core (Week 9-12)
- 🔄 Incident lifecycle management
- 🔄 WebSocket real-time dashboard
- 🔄 Alert generation + notifications
- 🔄 Map layer rendering (MapLibre GL)

### PHASE 3: AI Integration (Week 13-16)
- 🔄 YOLOv8 inference server
- 🔄 Camera stream processing (RTSP)
- 🔄 Fire Weather Index forecasting
- 🔄 IoT sensor data ingestion (MQTT)

### PHASE 4: Response Mgmt (Week 17-20)
- 🔄 Response unit assignment
- 🔄 Dispatcher dashboard
- 🔄 Flutter mobile app
- 🔄 Offline sync + geolocation

### PHASE 5: Analytics (Week 21-24)
- 🔄 PDF/Excel report generation
- 🔄 Analytics dashboard + charts
- 🔄 Query optimization
- 🔄 Data export APIs

### PHASE 6: Production (Week 25-26)
- 🔄 Security audit + hardening
- 🔄 Load testing (100+ RPS)
- 🔄 Full test coverage (>80%)
- 🔄 Deployment + documentation

**👉 Detailed plan:** See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)

---

## 👥 TEAM STRUCTURE

**Current Team (5 people):**
- 1 Full-stack Backend Developer
- 1 Frontend Developer (React/Next.js)
- 1 AI/ML Engineer (YOLOv8, forecasting)
- 2 DevOps/QA Engineers

**Planned Expansion (→9 people, Month 2-3):**
- +1 Senior Backend (FastAPI scaling)
- +1 Frontend/Full-stack (UI components)
- +1 DevOps/SRE (Kubernetes, monitoring)
- +1 QA Automation (testing)

---

## 📂 REPOSITORY STRUCTURE

```
estec-wildfire-code/
├── backend_api/                    # FastAPI application
│   ├── app/main.py                # Entry point
│   ├── app/api/v1/                # API endpoints
│   ├── app/db/                    # Database models
│   ├── app/core/                  # Config, security
│   ├── app/middleware/            # Auth, audit, errors
│   ├── tests/                     # Unit tests
│   ├── alembic/                   # Database migrations
│   └── requirements.txt
│
├── frontend-code/                  # React/Next.js app
│   ├── app/                       # Next.js pages + layouts
│   ├── components/                # React components
│   ├── lib/                       # Utilities
│   ├── store/                     # Redux state
│   └── package.json
│
├── database/                      # Database schemas
│   ├── init.sql                   # Initial setup
│   └── migrations/                # Alembic versions
│
├── mosquitto/                     # MQTT broker config
│
├── docker-compose.yml             # Service orchestration
├── nginx.conf                     # Reverse proxy config
│
├── IMPLEMENTATION_PLAN.md         # 6-month detailed roadmap
├── SPRINT_1_CHECKLIST.md          # Sprint 1 tasks
├── QUICK_START_GUIDE.md           # Setup instructions
├── README.md                      # This file
└── .env.example                   # Environment template
```

---

## 🔑 KEY FEATURES

### 1. Real-time Incident Detection
- Upload image → AI detects fire within 500ms
- Auto-generate incident alert
- Broadcast to dispatch dashboard via WebSocket

### 2. GIS Mapping & Visualization
- Interactive map (MapLibre GL) with multiple layers
- Incident markers with real-time status
- Heatmap showing fire risk concentration
- Region boundaries (PostGIS spatial queries)

### 3. Dispatch Operations
- Assign incidents to response units (engine crews, helicopters)
- Real-time unit tracking (geolocation)
- Estimated arrival time (ETA) calculation
- Communication channel per incident

### 4. Mobile Field Team App
- Offline-first (works without internet)
- Push notifications for assigned tasks
- Photo/video capture with auto-geotag
- Status update (on-way → arrived → completed)
- Auto-sync when online

### 5. Analytics & Reporting
- KPI dashboard (response time, unit utilization, burn area)
- Trending analysis (month-over-month comparison)
- Automated reports (PDF/Excel) via email/download
- Data export (CSV, GeoJSON, KML)

### 6. Security & Audit
- JWT-based authentication + refresh tokens
- Role-Based Access Control (RBAC: admin, dispatcher, ranger, citizen)
- Audit logging for all critical actions
- Rate-limiting per user/IP
- OWASP Top 10 compliance

---

## 🧪 TESTING & QUALITY

### Test Coverage Targets
| Layer | Framework | Target |
|-------|-----------|--------|
| **Backend** | pytest | >80% code coverage |
| **Frontend** | Playwright + Jest | >70% coverage |
| **Integration** | Docker + GitHub Actions | All PRs tested |
| **Load Test** | k6 / Apache JMeter | 100+ concurrent users |

### Code Quality
- Pre-commit hooks (black, flake8)
- Linting (ESLint, Pylint)
- Type checking (mypy, TypeScript)
- Security scanning (Bandit, npm audit)

---

## 📊 PERFORMANCE TARGETS

| Metric | Target | Verification |
|--------|--------|---------------|
| **API Response Time (p95)** | <300ms | `curl -w %{time_total}` |
| **Throughput** | ≥100 RPS | Apache JMeter load test |
| **Database Query** | <100ms | PostgreSQL EXPLAIN ANALYZE |
| **Frontend Load Time** | <2s | Lighthouse audit |
| **System Uptime** | 99.5% | Monthly availability report |
| **AI Inference** | <500ms | YOLOv8 model latency |

---

## 🔒 SECURITY CONSIDERATIONS

- ✅ **Authentication:** JWT tokens with 24-hour expiry + refresh flow
- ✅ **Encryption:** At-rest (pgcrypto) + in-transit (TLS 1.3)
- ✅ **RBAC:** Fine-grained permissions per role
- ✅ **Rate-Limiting:** 100 req/min per IP (configurable)
- ✅ **Input Validation:** Pydantic models + SQL parameterization
- ✅ **Audit Trail:** All actions logged with user ID + timestamp
- ✅ **Secrets Management:** Environment variables + vault (prod)

---

## 🚢 DEPLOYMENT

### Development
```bash
docker-compose up -d  # Local stack with hot-reload
```

### Staging / Production
```bash
# Kubernetes deployment (optional)
kubectl apply -f k8s/

# Or: Single VM deployment
ansible-playbook deploy.yml --inventory=prod
```

### Monitoring
- **Metrics:** Prometheus + Grafana
- **Logs:** ELK Stack or Loki
- **Alerts:** PagerDuty / Slack notifications

---

## 📚 DOCUMENTATION

| Document | Purpose |
|----------|---------|
| [QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md) | 5-min setup for developers |
| [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) | 6-month roadmap + task breakdown |
| [SPRINT_1_CHECKLIST.md](./SPRINT_1_CHECKLIST.md) | Week 1-4 detailed tasks |
| [API_DOCS.md](#) | OpenAPI/Swagger endpoints (auto-generated) |
| [DEPLOYMENT_GUIDE.md](#) | Production deployment steps |
| [TROUBLESHOOTING.md](#) | Common issues + solutions |

---

## 🤝 CONTRIBUTING

### Development Workflow
1. Create feature branch: `git checkout -b feature/my-feature`
2. Commit changes: `git commit -am "Add my feature"`
3. Push to GitHub: `git push origin feature/my-feature`
4. Open Pull Request (CI/CD runs tests automatically)
5. Code review + merge to `main`

### Code Standards
- **Backend:** PEP 8 (black formatter, flake8 linter)
- **Frontend:** Prettier + ESLint
- **Commit Messages:** Conventional Commits (`feat:`, `fix:`, `docs:`)

---

## 📞 SUPPORT & CONTACT

| Role | Contact |
|------|---------|
| **Project Lead** | [Name/Email] |
| **Tech Lead** | [Name/Email] |
| **Backend** | [Name/Email] |
| **Frontend** | [Name/Email] |
| **DevOps** | [Name/Email] |

**Slack Channel:** #estec-wildfire-dev  
**Daily Standup:** 10 AM (Vietnam Time)  
**Weekly Review:** Friday 4 PM

---

## 📜 LICENSE

This project is licensed under the **MIT License** - see [LICENSE](./LICENSE) file for details.

---

## 🙏 ACKNOWLEDGMENTS

- **Thanh Hóa Provincial Forestry Department** (End-user, requirements)
- **ESTEC Company** (Development partner)
- **AI/ML Community** (YOLOv8, PyTorch ecosystem)
- **Open-source Projects** (FastAPI, PostgreSQL, React, Flutter)

---

## 📝 CHANGELOG

| Version | Date | Changes |
|---------|------|---------|
| **1.0.0** | May 18, 2026 | Initial project setup (FastAPI migration, team structure, roadmap) |
| 0.9.0 | May 10, 2026 | Django codebase (Wildfire---Web---HoanVo) |

---

## 🎯 NEXT STEPS

1. **Today:** Read [QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md) and get dev environment running
2. **This Week:** Complete [SPRINT_1_CHECKLIST.md](./SPRINT_1_CHECKLIST.md) tasks
3. **Next Week:** Sprint 1 demo + Sprint 2 planning
4. **Month 1:** Foundation complete, team fully onboarded
5. **Month 6:** Production-ready v1.0 deployed to Thanh Hóa

---

**Made with ❤️ for Forest Conservation** | **Status:** 🟢 Active Development

Visit [QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md) to begin! 🚀
