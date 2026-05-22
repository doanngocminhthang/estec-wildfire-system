from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.db.models import Task, User
from app.schemas.task_schema import TaskCreate, TaskStatusUpdate


def create_task(db: Session, payload: TaskCreate, assigned_by_id: int) -> Task:
    ranger = db.query(User).filter(User.id == payload.assigned_to_id, User.is_active == True).first()
    if not ranger:
        raise HTTPException(status_code=404, detail="Không tìm thấy kiểm lâm viên")

    task = Task(
        incident_id=payload.incident_id,
        assigned_to_id=payload.assigned_to_id,
        assigned_by_id=assigned_by_id,
        deadline=payload.deadline,
        note=payload.note,
        status="pending",
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def get_tasks(db: Session, incident_id: int | None = None) -> list[Task]:
    q = db.query(Task)
    if incident_id is not None:
        q = q.filter(Task.incident_id == incident_id)
    return q.order_by(Task.created_at.desc()).all()


def update_task_status(db: Session, task_id: int, payload: TaskStatusUpdate) -> Task:
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Không tìm thấy nhiệm vụ")

    valid = {"pending", "in_progress", "done", "cancelled"}
    if payload.status not in valid:
        raise HTTPException(status_code=422, detail=f"Trạng thái không hợp lệ. Phải là: {valid}")

    task.status = payload.status
    if payload.result_note is not None:
        task.result_note = payload.result_note
    task.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(task)
    return task


def delete_task(db: Session, task_id: int) -> None:
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Không tìm thấy nhiệm vụ")
    db.delete(task)
    db.commit()
