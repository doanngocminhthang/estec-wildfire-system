# 🚀 SPRINT 1 EXECUTION CHECKLIST (Week 1-4)
**Title:** Foundation & Architecture  
**Goal:** Project bootstrap + FastAPI setup + team alignment  
**Team:** 5 people  
**Start Date:** Week 1 | **End Date:** Week 4  

---

## PREREQUISITE SETUP (Day 1)

### Environment Setup for All
- [ ] **Shared GitHub repo access**
  - [ ] All team members fork the repo
  - [ ] Configure GitHub SSH keys
  - [ ] Set up branch protection rules (main branch)
  - [ ] Configure GitHub Actions secrets (.env vars)

- [ ] **Developer machine setup**
  - [ ] Python 3.11+ installed
  - [ ] Node.js 18+ LTS installed
  - [ ] Docker Desktop installed + running
  - [ ] Docker Compose v2+
  - [ ] VS Code / IDE configured
  - [ ] Git configured (name, email, GPG key)

- [ ] **Communication setup**
  - [ ] Slack/Teams channel created
  - [ ] Daily standup scheduled (10 AM)
  - [ ] Weekly review meeting scheduled (Friday)
  - [ ] Project backlog tool setup (Jira/GitHub Issues)

---

## TASK 1.1: FastAPI Project Structure Setup
**Owner:** Full-stack Backend Developer  
**Duration:** 3-4 days  
**Priority:** CRITICAL

### 1.1.1 Initialize FastAPI project
```bash
# Create directory structure
backend_api/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app entry point
│   ├── config.py                  # Configuration (DB, JWT secrets)
│   ├── dependencies.py            # Shared dependencies
│   ├── core/
│   │   ├── security.py            # JWT, password hashing
│   │   ├── config.py              # Environment variables
│   │   └── constants.py           # App constants
│   ├── models/                    # Pydantic models
│   │   ├── user.py
│   │   ├── incident.py
│   │   ├── hotspot.py
│   │   └── alert.py
│   ├── schemas/                   # Request/response schemas
│   │   ├── user_schema.py
│   │   ├── incident_schema.py
│   │   └── token_schema.py
│   ├── db/
│   │   ├── database.py            # SQLAlchemy setup
│   │   ├── session.py             # Session management
│   │   └── models.py              # SQLAlchemy ORM models
│   ├── api/
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── endpoints/
│   │   │   │   ├── users.py
│   │   │   │   ├── incidents.py
│   │   │   │   ├── hotspots.py
│   │   │   │   ├── regions.py
│   │   │   │   └── health.py
│   │   │   └── api.py             # Route aggregator
│   ├── middleware/
│   │   ├── auth.py                # JWT verification middleware
│   │   ├── audit.py               # Audit logging middleware
│   │   └── error.py               # Global error handler
│   └── services/
│       ├── user_service.py
│       ├── incident_service.py
│       └── auth_service.py
├── tests/
│   ├── test_auth.py
│   ├── test_users.py
│   └── test_incidents.py
├── alembic/                       # Database migrations
│   ├── versions/
│   └── env.py
├── requirements.txt
├── .env.example
├── Dockerfile
└── docker-entrypoint.sh
```

**Checklist:**
- [x] Create directory structure
- [ ] Initialize git repo (if not already)
- [x] Create requirements.txt with core dependencies:
  ```txt
  fastapi==0.104.1
  uvicorn[standard]==0.24.0
  sqlalchemy==2.0.23
  psycopg2-binary==2.9.9
  pydantic==2.5.0
  pydantic-settings==2.1.0
  python-jose[cryptography]==3.3.0
  passlib[bcrypt]==1.7.4
  python-multipart==0.0.6
  alembic==1.13.0
  redis==5.0.1
  pytest==7.4.3
  pytest-asyncio==0.21.1
  pytest-cov==4.1.0
  httpx==0.25.2
  ```
- [x] Create `.env.example` template
- [x] Initialize FastAPI app in `app/main.py`

### 1.1.2 Database connection setup
- [x] Create `app/db/database.py` with SQLAlchemy PostgreSQL connection
- [x] Test connection to local PostgreSQL (via Docker)
- [x] Verify PostGIS extension available

### 1.1.3 Configuration management
- [x] Create `app/core/config.py` with Pydantic Settings
- [x] Load from `.env` (DB host, port, name, JWT secret, etc.)
- [ ] Support multiple environments (dev, test, prod)

### 1.1.4 Alembic migrations
- [x] `alembic init alembic`
- [x] Configure `alembic.ini` to use SQLAlchemy models
- [x] Create first migration: `alembic revision --autogenerate -m "Initial schema"`
- [x] Test migration: `alembic upgrade head`

**Definition of Done:**
```bash
✅ cd backend_api && python -m uvicorn app.main:app --reload
✅ API accessible at http://localhost:8000
✅ GET /api/v1/health returns {"status": "ok"}
✅ Database migrations applied successfully
```

---

## TASK 1.2: Docker Compose Stack v1 Setup
**Owner:** DevOps Engineer #1  
**Duration:** 2-3 days  
**Priority:** CRITICAL

### 1.2.1 Create docker-compose.yml
```yaml
version: '3.9'

services:
  # PostgreSQL with PostGIS
  db:
    image: postgis/postgis:15-3.4
    container_name: estec-wildfire-db
    environment:
      POSTGRES_USER: wildfire_admin
      POSTGRES_PASSWORD: wildfire_password
      POSTGRES_DB: wildfire_db
      POSTGRES_INITDB_ARGS: "-c shared_preload_libraries=pg_stat_statements"
    ports:
      - "5433:5432"
    volumes:
      - db_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/01-init.sql
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "wildfire_admin", "-d", "wildfire_db"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - wildfire_net

  # Redis cache
  redis:
    image: redis:7-alpine
    container_name: estec-wildfire-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - wildfire_net

  # MQTT Broker
  mqtt:
    image: eclipse-mosquitto:latest
    container_name: estec-wildfire-mqtt
    ports:
      - "1883:1883"
      - "9001:9001"
    volumes:
      - ./mosquitto/config/mosquitto.conf:/mosquitto/config/mosquitto.conf
      - mosquitto_data:/mosquitto/data
      - mosquitto_log:/mosquitto/log
    healthcheck:
      test: ["CMD", "mosquitto_pub", "-h", "localhost", "-t", "test", "-m", "test"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - wildfire_net

  # FastAPI Backend
  backend:
    build:
      context: ./backend_api
      dockerfile: Dockerfile
    container_name: estec-wildfire-backend
    environment:
      DB_HOST: db
      DB_PORT: 5432
      DB_NAME: wildfire_db
      DB_USER: wildfire_admin
      DB_PASSWORD: wildfire_password
      REDIS_URL: redis://redis:6379
      JWT_SECRET_KEY: your_secret_key_change_in_prod
      MQTT_HOST: mqtt
      MQTT_PORT: 1883
    ports:
      - "8000:8000"
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
      mqtt:
        condition: service_healthy
    volumes:
      - ./backend_api:/app
    command: python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/v1/health"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - wildfire_net

  # Nginx reverse proxy
  nginx:
    image: nginx:alpine
    container_name: estec-wildfire-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
    networks:
      - wildfire_net

volumes:
  db_data:
  redis_data:
  mosquitto_data:
  mosquitto_log:

networks:
  wildfire_net:
    driver: bridge
```

**Checklist:**
- [x] Copy above docker-compose.yml to project root
- [x] Create `nginx.conf` for reverse proxy:
  ```nginx
  events { worker_connections 1024; }
  http {
      upstream backend {
          server backend:8000;
      }
      server {
          listen 80;
          location /api/ {
              proxy_pass http://backend;
              proxy_set_header Host $host;
              proxy_set_header X-Real-IP $remote_addr;
          }
      }
  }
  ```
- [x] Test: `docker-compose up -d`
- [x] Verify all services healthy: `docker-compose ps`
- [x] Test endpoints:
  - [x] `curl http://localhost:8000/api/v1/health`
  - [x] `curl http://localhost/api/v1/health` (via Nginx)
  - [x] `redis-cli -p 6379 ping` (Redis)
  - [ ] `psql -h localhost -p 5433 -U wildfire_admin -d wildfire_db` (PostgreSQL)
  - [x] `mosquitto_pub -h localhost -t test -m "hello"` (MQTT)

**Definition of Done:**
```bash
✅ docker-compose up -d completes without errors
✅ All services show "healthy" status
✅ curl http://localhost/api/v1/health returns {"status": "ok"}
✅ Can connect to each service individually
```

---

## TASK 1.3: Authentication & RBAC Foundation
**Owner:** Full-stack Backend Developer (with DevOps support)  
**Duration:** 3-4 days  
**Priority:** CRITICAL

### 1.3.1 Database schema for auth
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_roles (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE role_permissions (
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    changes JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Checklist:**
- [ ] Add schema to `database/init.sql`
- [ ] Run migration: `docker exec estec-wildfire-backend alembic upgrade head`
- [ ] Insert default roles:
  ```sql
  INSERT INTO roles (name, description) VALUES
  ('admin', 'System administrator'),
  ('dispatcher', 'Incident dispatcher'),
  ('ranger', 'Field ranger'),
  ('citizen', 'Public citizen');
  ```
- [ ] Insert default permissions (see/edit/delete incidents, users, etc.)

### 1.3.2 JWT auth implementation
- [ ] Create `app/core/security.py`:
  ```python
  from fastapi import Depends, HTTPException, status
  from fastapi.security import HTTPBearer, HTTPAuthCredentials
  from jose import JWTError, jwt
  from datetime import datetime, timedelta
  from app.core.config import settings
  
  def create_access_token(data: dict, expires_delta: timedelta = None):
      to_encode = data.copy()
      expire = datetime.utcnow() + (expires_delta or timedelta(hours=24))
      to_encode.update({"exp": expire})
      return jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
  
  def verify_token(token: str):
      try:
          payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
          return payload
      except JWTError:
          raise HTTPException(status_code=401, detail="Invalid token")
  ```
- [ ] Create `app/middleware/auth.py` middleware for all protected endpoints
- [ ] Test JWT generation + validation

### 1.3.3 Login endpoint
- [ ] `POST /api/v1/auth/login` (username/password → returns JWT token + user info)
- [ ] Implement password hashing (bcrypt)
- [ ] Add rate-limiting (5 attempts per minute per IP)
- [ ] Audit log every login attempt

### 1.3.4 RBAC decorator
- [ ] Create `@require_role("admin")` decorator
- [ ] Create `@require_permission("view_incidents")` decorator
- [ ] Implement permission checking in middleware

**Definition of Done:**
```bash
✅ POST /api/v1/auth/login returns {"access_token": "...", "user": {...}}
✅ Protected endpoints reject requests without token
✅ Token expires after 24 hours
✅ Audit logs recorded for all auth actions
✅ @require_role decorator works on endpoints
```

---

## TASK 1.4: React/Next.js Frontend Project Init
**Owner:** Frontend Developer (with Full-stack support)  
**Duration:** 2-3 days  
**Priority:** HIGH

### 1.4.1 Initialize Next.js project
```bash
npx create-next-app@latest frontend-app \
  --typescript \
  --tailwind \
  --eslint \
  --app
```

### 1.4.2 Project structure
```
frontend-app/
├── app/
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   ├── dashboard/
│   │   └── page.tsx         # Dashboard (protected)
│   ├── login/
│   │   └── page.tsx         # Login page
│   └── api/
│       └── auth/
│           └── route.ts     # Auth API routes
├── components/
│   ├── Layout.tsx           # Main layout wrapper
│   ├── Navigation.tsx       # Sidebar navigation
│   ├── Map.tsx              # MapLibre GL component
│   ├── IncidentCard.tsx
│   └── common/
│       ├── Header.tsx
│       ├── Button.tsx
│       └── Modal.tsx
├── lib/
│   ├── api.ts               # API client
│   ├── auth.ts              # Auth utilities
│   └── constants.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useIncidents.ts
│   └── useFetch.ts
├── store/
│   └── redux/               # Redux Toolkit setup
│       ├── slices/
│       │   ├── authSlice.ts
│       │   ├── incidentSlice.ts
│       │   └── uiSlice.ts
│       └── store.ts
├── styles/
│   └── globals.css
├── public/
├── .env.local.example
├── next.config.js
└── tsconfig.json
```

**Checklist:**
- [ ] `npx create-next-app@latest` with options above
- [ ] Install additional dependencies:
  ```bash
  npm install maplibre-gl @types/maplibre-gl \
    @reduxjs/toolkit react-redux axios \
    zustand (or Redux choice)
  ```
- [ ] Create `.env.local.example`:
  ```env
  NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
  NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here
  ```
- [ ] Create basic Layout component
- [ ] Create Navigation/Sidebar component
- [ ] Set up Redux store

### 1.4.3 Basic routing
- [ ] `/` → Home/Dashboard (redirect to /dashboard if authenticated)
- [ ] `/login` → Login page
- [ ] `/dashboard` → Main dashboard (protected)
- [ ] `/profile` → User profile (protected)

### 1.4.4 MapLibre GL integration
- [ ] Create `components/Map.tsx` component
- [ ] Load OSM base layer
- [ ] Zoom + Pan controls
- [ ] Responsive sizing

**Definition of Done:**
```bash
✅ npm run dev starts on localhost:3000
✅ Navigation working (sidebar links)
✅ Map displays with OSM base layer
✅ Protected routes redirect to /login if unauthenticated
```

---

## TASK 1.5: CI/CD Pipeline Phase 1
**Owner:** DevOps Engineer #2  
**Duration:** 2 days  
**Priority:** HIGH

### 1.5.1 GitHub Actions workflow
- [ ] Create `.github/workflows/ci.yml`:
  ```yaml
  name: CI Pipeline
  on: [push, pull_request]
  
  jobs:
    backend-test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - name: Set up Python
          uses: actions/setup-python@v4
          with:
            python-version: 3.11
        - name: Install dependencies
          run: cd backend_api && pip install -r requirements.txt
        - name: Lint with flake8
          run: cd backend_api && flake8 app --count --max-line-length=88
        - name: Run tests
          run: cd backend_api && pytest tests/ --cov=app
    
    frontend-test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - name: Set up Node
          uses: actions/setup-node@v3
          with:
            node-version: 18
        - name: Install dependencies
          run: cd frontend-app && npm ci
        - name: Lint
          run: cd frontend-app && npm run lint
        - name: Build
          run: cd frontend-app && npm run build
  ```

- [ ] Configure GitHub Secrets:
  - `DB_PASSWORD`
  - `JWT_SECRET_KEY`
  - `REGISTRY_USERNAME` (Docker registry)
  - `REGISTRY_PASSWORD`

### 1.5.2 Pre-commit hooks
- [ ] Install `pre-commit` framework
- [ ] Configure `.pre-commit-config.yaml`:
  ```yaml
  repos:
    - repo: https://github.com/pre-commit/pre-commit-hooks
      hooks:
        - id: trailing-whitespace
        - id: end-of-file-fixer
    - repo: https://github.com/psf/black
      hooks:
        - id: black
    - repo: https://github.com/PyCQA/flake8
      hooks:
        - id: flake8
  ```

**Definition of Done:**
```bash
✅ Push to GitHub triggers CI workflow
✅ PR shows test results
✅ All checks pass before merge
✅ Docker image builds successfully
```

---

## 📋 SPRINT 1 SUMMARY CHECKLIST

### Core Tasks Status
- [ ] **1.1 FastAPI Setup** - DONE
- [ ] **1.2 Docker Compose** - DONE
- [ ] **1.3 Auth & RBAC** - DONE
- [ ] **1.4 Frontend Init** - DONE
- [ ] **1.5 CI/CD** - DONE

### Testing & QA
- [ ] All endpoints tested (manual curl + Postman)
- [ ] Docker stack tested (all services healthy)
- [ ] Frontend loads without errors
- [ ] Auth flow tested end-to-end

### Documentation
- [ ] README updated with setup instructions
- [ ] API endpoints documented (Swagger)
- [ ] Team trained on dev environment setup

### Deliverables
- [ ] Code pushed to GitHub (main branch)
- [ ] Docker Compose runs `docker-compose up -d` successfully
- [ ] Team can docker-compose + dev locally
- [ ] CI/CD pipeline runs on PRs
- [ ] Sprint 1 Demo: Show login + dashboard skeleton + map

---

## 🎯 SUCCESS CRITERIA (Sprint 1 End)

```
✅ Development environment fully functional for all 5 team members
✅ Backend API running with auth working
✅ Frontend loads and routes work
✅ All services in Docker Compose pass health checks
✅ CI/CD pipeline prevents broken code from merging
✅ Zero critical bugs in main branch
✅ Team productivity: able to start Sprint 2 tasks immediately
```

---

## 📅 SPRINT 1 TIMELINE

| Week | Backend | Frontend | DevOps | Sync Point |
|------|---------|----------|--------|-----------|
| **Week 1** | FastAPI init (1.1) | Next.js init (1.4) | Docker setup (1.2) | Daily standup |
| **Week 2** | DB schema + migration | Components + routing | Service health checks | Mid-sprint review |
| **Week 3** | Auth + JWT (1.3) | Map + Layout | CI/CD pipeline (1.5) | Testing sprint tasks |
| **Week 4** | RBAC + audit logging | Protected routes | Deployment scripts | **Sprint 1 Demo + Review** |

---

## 🚨 RISKS & MITIGATION

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Team unfamiliar with FastAPI | HIGH | Pair programming, documentation |
| Database connection issues | HIGH | Test DB connectivity first day |
| Docker networking complexity | MEDIUM | Use docker-compose, clear networking |
| PostgreSQL PostGIS setup | MEDIUM | Pre-built image (postgis/postgis) |
| JWT implementation bugs | HIGH | Thorough testing + external library review |

---

**Next Steps:** Upon Sprint 1 completion → Sprint 2 Kickoff (User & Region management)
