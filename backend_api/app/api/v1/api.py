from fastapi import APIRouter

from app.api.v1.health import router as health_router
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.users import router as users_router
from app.api.v1.endpoints.tasks import router as tasks_router
from app.api.v1.endpoints.ws import router as ws_router
from app.api.v1.endpoints.audit import router as audit_router
from app.api.v1.endpoints.bulletins import router as bulletins_router
from app.api.v1.endpoints.firms import router as firms_router
from app.api.v1.endpoints.integrations import router as integrations_router
from app.api.v1.endpoints.cameras import router as cameras_router
from app.api.v1.endpoints.sensors import router as sensors_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(tasks_router)
api_router.include_router(ws_router)
api_router.include_router(audit_router)
api_router.include_router(bulletins_router)
api_router.include_router(firms_router)
api_router.include_router(integrations_router)
api_router.include_router(cameras_router)
api_router.include_router(sensors_router)
