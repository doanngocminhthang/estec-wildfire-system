# 🚀 QUICK START GUIDE - ESTEC Wildfire System
**How to start development TODAY** | Target: Team ready in 30 minutes

---

## 📋 PRE-REQUIREMENTS (Verify on your machine)

```bash
# Check versions
python --version              # Python 3.11+
node --version               # Node.js 18+
docker --version             # Docker 24+
docker-compose --version     # Docker Compose 2+
git --version                # Git 2.39+

# All good? Continue ⬇️
```

**If missing:**
- Python 3.11: https://www.python.org/downloads/
- Node.js: https://nodejs.org/en/

- Docker Desktop: https://www.docker.com/products/docker-desktop/

---

## 🔥 5-MINUTE SETUP

### Step 1: Clone & enter repo
```bash
git clone https://github.com/doanngocminhthang/estec-wildfire-system.git
cd estec-wildfire-system
cd estec---wildfire---code
```

### Step 2: Copy environment file
```bash
# Copy .env template (adjust if needed)
cp .env.example .env

# On Windows PowerShell:
# Copy-Item .env.example .env
```

### Step 3: Start Docker stack
```bash
# Start all services (PostgreSQL, Redis, MQTT, Nginx)
docker-compose up -d

# Wait ~10 seconds for services to start
sleep 10

# Check all services are healthy
docker-compose ps
# All should show "healthy" or "Up"
```

### Step 4: Initialize database
```bash
# Create schema + seed data
docker exec estec-wildfire-db psql -U wildfire_admin -d wildfire_db -f /docker-entrypoint-initdb.d/01-init.sql

# Or manually:
# docker exec -it estec-wildfire-db psql -U wildfire_admin -d wildfire_db
# Then paste SQL commands from database/init.sql
```

### Step 5: Start Backend API
```bash
# Open new terminal/tab
cd backend_api

# Install Python dependencies
pip install -r requirements.txt

# Start FastAPI server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Expected output:
# INFO:     Started server process [PID]
# INFO:     Waiting for application startup.
# INFO:     Application startup complete
# INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Step 6: Start Frontend (in separate terminal)
```bash
# Open new terminal/tab
cd frontend-code

# Install Node dependencies
npm install

# Start Next.js dev server
npm run dev

# Expected output:
# ▲ Next.js 14.0.0
# - Local:        http://localhost:3000
# - Environments: .env.local
# Ready in 1234ms
```

### Step 7: Verify everything works
```bash
# Test Backend API
curl http://localhost:8000/api/health
# Should return: {"status": "healthy", "database": "connected"}

# Test Frontend
# Open browser: http://localhost:3000
# Should load dashboard/login page

# Test via Nginx proxy
curl http://localhost/api/health
# Should also work
```

---

## ✅ YOU'RE SET UP!

| Service | URL | What to Check |
|---------|-----|---------------|
| **Frontend** | http://localhost:3000 | Should load login page |
| **Backend API** | http://localhost:8000/docs | Should see Swagger UI |
| **Nginx Proxy** | http://localhost/api/health | Should return {"status": "ok"} |
| **PostgreSQL** | localhost:5433 | `psql -h localhost -p 5433 -U wildfire_admin` |
| **Redis** | localhost:6379 | `redis-cli ping` → PONG |
| **MQTT** | localhost:1883 | `mosquitto_pub -h localhost -t test -m "hi"` |

---

## 🧠 UNDERSTAND THE ARCHITECTURE

```
User's Browser (http://localhost:3000)
         ↓
    React App (Next.js)
         ↓
Nginx Reverse Proxy (http://localhost:80)
         ↓
FastAPI Backend (http://localhost:8000)
    ├─ User Auth
    ├─ Incidents API
    ├─ WebSocket (real-time updates)
    └─ Other endpoints
         ↓
PostgreSQL+PostGIS (port 5433)
    ├─ Users, Roles, Permissions
    ├─ Incidents, Hotspots
    ├─ Spatial data (geom columns)
    └─ Audit logs
         ↓
Redis (port 6379)
    ├─ Session cache
    ├─ Temporary data
    └─ Rate-limiting counters
         ↓
MQTT Broker (port 1883)
    └─ IoT sensor messages
```

---

## 📂 PROJECT STRUCTURE OVERVIEW

```
estec-wildfire-code/
├── backend_api/               # FastAPI application
│   ├── app/
│   │   ├── main.py           # FastAPI app entry
│   │   ├── db/               # Database models
│   │   ├── api/              # API endpoints (v1)
│   │   ├── core/             # Config, security
│   │   ├── middleware/       # Auth, audit, errors
│   │   └── services/         # Business logic
│   ├── tests/                # Unit & integration tests
│   ├── alembic/              # Database migrations
│   ├── requirements.txt
│   ├── Dockerfile
│   └── docker-entrypoint.sh
│
├── frontend-code/            # React/Next.js application
│   ├── app/                  # Next.js app router
│   │   ├── page.tsx          # Home page
│   │   ├── dashboard/        # Dashboard route
│   │   ├── login/            # Login route
│   │   └── layout.tsx        # Root layout
│   ├── components/           # React components
│   ├── lib/                  # Utilities (API client, auth)
│   ├── store/                # Redux store
│   ├── public/               # Static assets
│   ├── package.json
│   ├── Dockerfile
│   └── next.config.js
│
├── database/                 # Database files
│   ├── init.sql              # Initial schema + seed data
│   └── migrations/           # Alembic migrations
│
├── mosquitto/                # MQTT broker config
│   └── config/mosquitto.conf
│
├── volumes/                  # Docker volumes (data persistence)
│   ├── db-data/              # PostgreSQL data
│   ├── mosquitto-data/       # MQTT data
│   └── mosquitto-log/        # MQTT logs
│
├── docker-compose.yml        # Docker services orchestration
├── nginx.conf                # Nginx reverse proxy config
├── IMPLEMENTATION_PLAN.md    # 6-month detailed plan
├── SPRINT_1_CHECKLIST.md     # Sprint 1 tasks (this week)
├── QUICK_START_GUIDE.md      # This file
└── .env.example              # Environment template
```

---

## 🔐 DEFAULT CREDENTIALS

**Database:**
- Host: localhost:5433
- User: wildfire_admin
- Password: wildfire_password
- Database: wildfire_db

**Redis:**
- Host: localhost:6379
- No authentication (dev only)

**MQTT:**
- Host: localhost:1883
- Topics: wildfire/alerts/#

⚠️ **CHANGE IN PRODUCTION!**

---

## 🧪 COMMON COMMANDS

### Backend
```bash
# Start development server (with auto-reload)
cd backend_api
python -m uvicorn app.main:app --reload

# Run tests
pytest tests/ -v

# Create database migration
alembic revision --autogenerate -m "Add new table"

# Apply migrations
alembic upgrade head

# Access API docs (Swagger UI)
# Visit: http://localhost:8000/docs
```

### Frontend
```bash
# Start dev server (with hot-reload)
cd frontend-code
npm run dev

# Build for production
npm run build

# Start production build
npm run start

# Run linter + format
npm run lint
npm run format
```

### Docker
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f backend   # Backend logs
docker-compose logs -f db        # Database logs

# Execute command in service
docker exec -it estec-wildfire-backend bash  # SSH into backend

# Rebuild image (after dependency changes)
docker-compose up -d --build
```

### Database (PostgreSQL)
```bash
# Connect to database
psql -h localhost -p 5433 -U wildfire_admin -d wildfire_db

# Useful queries:
SELECT * FROM users;                    # List users
SELECT * FROM incidents;                # List incidents
SELECT * FROM audit_logs LIMIT 10;      # Recent audit logs
```

### Redis
```bash
# Connect to Redis
redis-cli -h localhost -p 6379

# Common commands:
KEYS *                 # List all keys
GET key_name           # Get value
SET key_name value     # Set value
DEL key_name           # Delete key
```

### MQTT
```bash
# Subscribe to alerts
mosquitto_sub -h localhost -t "wildfire/alerts/#"

# Publish test message
mosquitto_pub -h localhost -t "wildfire/alerts/test" -m '{"test": "data"}'
```

---

## 🐛 TROUBLESHOOTING

### "docker-compose: command not found"
```bash
# Docker Compose v2 uses: docker compose (not docker-compose)
# Try:
docker compose up -d
# Or upgrade Docker Desktop
```

### "Connection refused" on http://localhost:8000
```bash
# Backend not running? Check:
docker ps | grep backend
# Should show running container

# If not running:
docker-compose logs backend  # Check error logs
docker-compose restart backend
```

### "Port already in use"
```bash
# Another app using port 3000 or 8000?
# Option 1: Kill the process
# Windows: netstat -ano | findstr :8000
# Mac/Linux: lsof -i :8000 | grep LISTEN

# Option 2: Change port in docker-compose.yml
# Change "8000:8000" to "8001:8000"
```

### "Cannot connect to database"
```bash
# PostgreSQL not started?
docker-compose logs db

# Database initialization failed?
docker exec estec-wildfire-db psql -U wildfire_admin -c "SELECT version();"
```

### "ModuleNotFoundError" in FastAPI
```bash
# Dependencies not installed?
cd backend_api
pip install -r requirements.txt
```

### "npm install fails"
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install
```

---

## 🤝 TEAM ONBOARDING WORKFLOW

**For each new team member:**

1. **Clone repo** (step 1 above)
2. **Install tools** (Python 3.11+, Node 18+, Docker)
3. **Follow 5-minute setup** (steps 2-7)
4. **Run tests** to verify
5. **Read IMPLEMENTATION_PLAN.md** (understand big picture)
6. **Read SPRINT_1_CHECKLIST.md** (know your tasks)
7. **Sync with team** (clarify role + dependencies)

---

## 📞 NEED HELP?

| Question | Resource |
|----------|----------|
| "How do I add a new API endpoint?" | `/backend_api/app/api/v1/endpoints/` - copy existing pattern |
| "How do I create a React component?" | `/frontend-code/components/` - check existing components |
| "Database migration failed" | `alembic upgrade head --sql` to see SQL being executed |
| "WebSocket not connecting" | Check browser console for connection errors |
| "Performance issue" | Run `docker stats` to see resource usage |

---

## ✨ NEXT STEPS

**After you're set up:**

1. Read [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) (understand 6-month roadmap)
2. Read [SPRINT_1_CHECKLIST.md](./SPRINT_1_CHECKLIST.md) (know your Sprint 1 task)
3. Join **daily standup** (10 AM)
4. Pick a task from [SPRINT_1_CHECKLIST.md](./SPRINT_1_CHECKLIST.md) and start coding!

---

## 🎯 SUCCESS CRITERIA (You're ready when...)

- ✅ `docker-compose ps` shows all services healthy
- ✅ `curl http://localhost:8000/api/health` returns 200 OK
- ✅ `http://localhost:3000` loads in browser
- ✅ You can read IMPLEMENTATION_PLAN.md
- ✅ You understand your role in SPRINT_1_CHECKLIST.md

**You're good to go! 🚀**

---

**Version:** 1.0 | **Last Updated:** May 18, 2026  
**Questions?** Ask in Slack #estec-wildfire-dev
