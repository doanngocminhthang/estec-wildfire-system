from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_db_session
from app.db.models import User
from app.middleware.auth import get_current_user, require_role
from app.schemas.task_schema import TaskCreate, TaskResponse, TaskStatusUpdate
from app.services.task_service import create_task, delete_task, get_tasks, update_task_status

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.post("/", response_model=TaskResponse, status_code=201)
def create_task_endpoint(
    payload: TaskCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_role("admin")),
):
    """Giao nhiệm vụ xác minh cho kiểm lâm (chỉ admin)."""
    return create_task(db, payload, assigned_by_id=current_user.id)


@router.get("/", response_model=List[TaskResponse])
def list_tasks(
    incident_id: Optional[int] = Query(default=None),
    db: Session = Depends(get_db_session),
    _: User = Depends(get_current_user),
):
    """Lấy danh sách nhiệm vụ, tùy chọn lọc theo sự cố."""
    return get_tasks(db, incident_id=incident_id)


@router.patch("/{task_id}/status", response_model=TaskResponse)
def update_status_endpoint(
    task_id: int,
    payload: TaskStatusUpdate,
    db: Session = Depends(get_db_session),
    _: User = Depends(get_current_user),
):
    """Cập nhật trạng thái nhiệm vụ (kiểm lâm cập nhật kết quả)."""
    return update_task_status(db, task_id, payload)


@router.delete("/{task_id}", status_code=204)
def delete_task_endpoint(
    task_id: int,
    db: Session = Depends(get_db_session),
    _: User = Depends(require_role("admin")),
):
    """Hủy nhiệm vụ (chỉ admin)."""
    delete_task(db, task_id)
