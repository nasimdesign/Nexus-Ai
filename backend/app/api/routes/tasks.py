"""
Tasks & Projects API — full CRUD.
"""
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.task import Task, Project, SubTask

router = APIRouter(tags=["tasks"])


# ─── Schemas ──────────────────────────────────────────────────────────────────

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "todo"
    priority: str = "medium"
    project_id: Optional[str] = None
    due_date: Optional[str] = None
    estimated_hours: Optional[float] = None
    tags: Optional[list[str]] = None
    assignee: Optional[str] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    project_id: Optional[str] = None
    due_date: Optional[str] = None
    estimated_hours: Optional[float] = None
    logged_hours: Optional[float] = None
    tags: Optional[list[str]] = None
    assignee: Optional[str] = None

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    client: Optional[str] = None
    color: str = "#9700ce"
    hours_budget: Optional[float] = None
    due_date: Optional[str] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    client: Optional[str] = None
    status: Optional[str] = None
    color: Optional[str] = None
    hours_budget: Optional[float] = None
    due_date: Optional[str] = None

class SubTaskCreate(BaseModel):
    title: str


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _task_dict(t: Task) -> dict:
    return {
        "id": t.id,
        "title": t.title,
        "description": t.description,
        "status": t.status,
        "priority": t.priority,
        "project_id": t.project_id,
        "due_date": str(t.due_date) if t.due_date else None,
        "estimated_hours": t.estimated_hours,
        "logged_hours": t.logged_hours,
        "tags": t.tags or [],
        "assignee": t.assignee,
        "subtasks": [{"id": s.id, "title": s.title, "completed": s.completed} for s in (t.subtasks or [])],
        "created_at": t.created_at.isoformat(),
        "updated_at": t.updated_at.isoformat(),
    }

def _project_dict(p: Project) -> dict:
    done = sum(1 for t in p.tasks if t.status == "done" and not t.is_deleted)
    total = sum(1 for t in p.tasks if not t.is_deleted)
    hours = sum(ts.hours for ts in p.timesheets if not ts.is_deleted) if p.timesheets else 0
    return {
        "id": p.id,
        "name": p.name,
        "description": p.description,
        "client": p.client,
        "status": p.status,
        "color": p.color,
        "hours_budget": p.hours_budget,
        "due_date": str(p.due_date) if p.due_date else None,
        "tasks_total": total,
        "tasks_done": done,
        "progress": round((done / total * 100) if total else 0),
        "hours_logged": round(hours, 2),
        "created_at": p.created_at.isoformat(),
    }


# ─── Projects ─────────────────────────────────────────────────────────────────

project_router = APIRouter(prefix="/projects")

@project_router.get("")
async def list_projects(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Project)
        .options(selectinload(Project.tasks), selectinload(Project.timesheets))
        .where(and_(Project.user_id == current_user.id, Project.is_deleted == False))
        .order_by(Project.created_at.desc())
    )
    return [_project_dict(p) for p in result.scalars().all()]

@project_router.post("", status_code=201)
async def create_project(data: ProjectCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    p = Project(user_id=current_user.id, **data.model_dump(exclude={"due_date"}))
    if data.due_date:
        from datetime import datetime
        p.due_date = datetime.strptime(data.due_date, "%Y-%m-%d").date()
    db.add(p)
    await db.commit()
    await db.refresh(p)
    return {"id": p.id, "name": p.name, "color": p.color, "status": p.status}

@project_router.patch("/{project_id}")
async def update_project(project_id: str, data: ProjectUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(and_(Project.id == project_id, Project.user_id == current_user.id)))
    p = result.scalar_one_or_none()
    if not p:
        raise HTTPException(404, "Project not found")
    for field, value in data.model_dump(exclude_none=True, exclude={"due_date"}).items():
        setattr(p, field, value)
    if data.due_date:
        from datetime import datetime
        p.due_date = datetime.strptime(data.due_date, "%Y-%m-%d").date()
    await db.commit()
    return {"id": p.id, "name": p.name}

@project_router.delete("/{project_id}")
async def delete_project(project_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(and_(Project.id == project_id, Project.user_id == current_user.id)))
    p = result.scalar_one_or_none()
    if not p:
        raise HTTPException(404, "Project not found")
    p.is_deleted = True
    await db.commit()
    return {"deleted": True}


# ─── Tasks ────────────────────────────────────────────────────────────────────

task_router = APIRouter(prefix="/tasks")

@task_router.get("")
async def list_tasks(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    project_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy.orm import selectinload
    q = select(Task).options(selectinload(Task.subtasks)).where(
        and_(Task.user_id == current_user.id, Task.is_deleted == False)
    )
    if status:
        q = q.where(Task.status == status)
    if priority:
        q = q.where(Task.priority == priority)
    if project_id:
        q = q.where(Task.project_id == project_id)
    result = await db.execute(q.order_by(Task.created_at.desc()))
    return [_task_dict(t) for t in result.scalars().all()]

@task_router.post("", status_code=201)
async def create_task(data: TaskCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    t = Task(user_id=current_user.id, **data.model_dump(exclude={"due_date"}))
    if data.due_date:
        from datetime import datetime
        t.due_date = datetime.strptime(data.due_date, "%Y-%m-%d").date()
    db.add(t)
    await db.commit()
    await db.refresh(t)
    return _task_dict(t)

@task_router.get("/{task_id}")
async def get_task(task_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Task).options(selectinload(Task.subtasks))
        .where(and_(Task.id == task_id, Task.user_id == current_user.id, Task.is_deleted == False))
    )
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(404, "Task not found")
    return _task_dict(t)

@task_router.patch("/{task_id}")
async def update_task(task_id: str, data: TaskUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from datetime import datetime, timezone
    result = await db.execute(select(Task).where(and_(Task.id == task_id, Task.user_id == current_user.id)))
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(404, "Task not found")
    for field, value in data.model_dump(exclude_none=True, exclude={"due_date"}).items():
        setattr(t, field, value)
    if data.due_date:
        t.due_date = datetime.strptime(data.due_date, "%Y-%m-%d").date()
    if data.status == "done" and not t.completed_at:
        t.completed_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(t)
    return _task_dict(t)

@task_router.delete("/{task_id}")
async def delete_task(task_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).where(and_(Task.id == task_id, Task.user_id == current_user.id)))
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(404, "Task not found")
    t.is_deleted = True
    await db.commit()
    return {"deleted": True}

@task_router.post("/{task_id}/subtasks", status_code=201)
async def add_subtask(task_id: str, data: SubTaskCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).where(and_(Task.id == task_id, Task.user_id == current_user.id)))
    if not result.scalar_one_or_none():
        raise HTTPException(404, "Task not found")
    s = SubTask(task_id=task_id, title=data.title)
    db.add(s)
    await db.commit()
    await db.refresh(s)
    return {"id": s.id, "title": s.title, "completed": s.completed}

@task_router.patch("/{task_id}/subtasks/{subtask_id}")
async def toggle_subtask(task_id: str, subtask_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SubTask).where(SubTask.id == subtask_id, SubTask.task_id == task_id))
    s = result.scalar_one_or_none()
    if not s:
        raise HTTPException(404, "SubTask not found")
    s.completed = not s.completed
    await db.commit()
    return {"id": s.id, "completed": s.completed}


# Combined router
router.include_router(project_router)
router.include_router(task_router)
