from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
def health_check_v1():
    return {"status": "ok"}
