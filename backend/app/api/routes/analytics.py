"""
Analytics API — real productivity stats from DB.
"""
from datetime import date, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.task import Task, Project
from app.models.timesheet import Timesheet, Meeting

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/overview")
async def get_overview(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    month_start = today.replace(day=1)

    # Task counts
    task_result = await db.execute(
        select(Task.status, func.count(Task.id))
        .where(and_(Task.user_id == current_user.id, Task.is_deleted == False))
        .group_by(Task.status)
    )
    task_counts = dict(task_result.all())

    # Hours this week
    week_hours_result = await db.execute(
        select(func.sum(Timesheet.hours)).where(
            and_(
                Timesheet.user_id == current_user.id,
                Timesheet.is_deleted == False,
                Timesheet.date >= week_start,
                Timesheet.date <= today,
            )
        )
    )
    week_hours = week_hours_result.scalar() or 0

    # Hours this month
    month_hours_result = await db.execute(
        select(func.sum(Timesheet.hours)).where(
            and_(
                Timesheet.user_id == current_user.id,
                Timesheet.is_deleted == False,
                Timesheet.date >= month_start,
            )
        )
    )
    month_hours = month_hours_result.scalar() or 0

    # Meetings this month
    mtg_result = await db.execute(
        select(func.count(Meeting.id)).where(
            and_(
                Meeting.user_id == current_user.id,
                Meeting.is_deleted == False,
                Meeting.date >= month_start,
            )
        )
    )
    meetings_count = mtg_result.scalar() or 0

    return {
        "tasks": {
            "total": sum(task_counts.values()),
            "todo": task_counts.get("todo", 0),
            "in_progress": task_counts.get("in_progress", 0),
            "done": task_counts.get("done", 0),
            "cancelled": task_counts.get("cancelled", 0),
        },
        "hours": {
            "this_week": round(float(week_hours), 2),
            "this_month": round(float(month_hours), 2),
        },
        "meetings_this_month": meetings_count,
    }


@router.get("/weekly")
async def get_weekly_data(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return daily hours logged for the past 7 days."""
    today = date.today()
    days = [(today - timedelta(days=i)) for i in range(6, -1, -1)]

    result = await db.execute(
        select(Timesheet.date, func.sum(Timesheet.hours)).where(
            and_(
                Timesheet.user_id == current_user.id,
                Timesheet.is_deleted == False,
                Timesheet.date.in_(days),
            )
        ).group_by(Timesheet.date)
    )
    hours_by_date = {str(d): float(h) for d, h in result.all()}

    # Task completions by day
    done_result = await db.execute(
        select(func.date(Task.completed_at), func.count(Task.id)).where(
            and_(
                Task.user_id == current_user.id,
                Task.status == "done",
                Task.is_deleted == False,
                Task.completed_at.isnot(None),
                func.date(Task.completed_at).in_([str(d) for d in days]),
            )
        ).group_by(func.date(Task.completed_at))
    )
    tasks_by_date = {str(d): int(c) for d, c in done_result.all()}

    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

    return [
        {
            "day": day_names[d.weekday()],
            "date": str(d),
            "hours": round(hours_by_date.get(str(d), 0), 2),
            "tasks": tasks_by_date.get(str(d), 0),
        }
        for d in days
    ]


@router.get("/projects")
async def get_project_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Project)
        .options(selectinload(Project.tasks), selectinload(Project.timesheets))
        .where(and_(Project.user_id == current_user.id, Project.is_deleted == False, Project.status == "active"))
    )
    projects = result.scalars().all()

    stats = []
    for p in projects:
        done = sum(1 for t in p.tasks if t.status == "done" and not t.is_deleted)
        total = sum(1 for t in p.tasks if not t.is_deleted)
        hours = sum(ts.hours for ts in p.timesheets if not ts.is_deleted) if p.timesheets else 0
        stats.append({
            "id": p.id,
            "name": p.name,
            "color": p.color,
            "tasks_done": done,
            "tasks_total": total,
            "progress": round((done / total * 100) if total else 0),
            "hours_logged": round(float(hours), 2),
            "hours_budget": p.hours_budget,
        })

    return stats
