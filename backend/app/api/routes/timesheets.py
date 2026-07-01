"""
Timesheets & Meetings API — CRUD + AI generation.
"""
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from pydantic import BaseModel
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.timesheet import Timesheet, Meeting

router = APIRouter(tags=["timesheets"])
timesheet_router = APIRouter(prefix="/timesheets")
meeting_router = APIRouter(prefix="/meetings")


# ─── Schemas ──────────────────────────────────────────────────────────────────

class TimesheetCreate(BaseModel):
    date: str
    project_id: Optional[str] = None
    activity: str
    description: str
    hours: float
    billable: bool = True

class TimesheetUpdate(BaseModel):
    activity: Optional[str] = None
    description: Optional[str] = None
    hours: Optional[float] = None
    billable: Optional[bool] = None
    approved: Optional[bool] = None

class AIGenerateRequest(BaseModel):
    date: Optional[str] = None

class MeetingCreate(BaseModel):
    title: str
    date: str
    start_time: str
    end_time: str
    attendees: list[str] = []
    platform: Optional[str] = None
    notes: Optional[str] = None

class MeetingUpdate(BaseModel):
    title: Optional[str] = None
    notes: Optional[str] = None
    summary: Optional[str] = None
    action_items: Optional[list] = None
    attendees: Optional[list[str]] = None


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _ts_dict(t: Timesheet) -> dict:
    return {
        "id": t.id,
        "date": str(t.date),
        "project_id": t.project_id,
        "activity": t.activity,
        "description": t.description,
        "hours": t.hours,
        "billable": t.billable,
        "approved": t.approved,
        "erpnext_id": t.erpnext_id,
        "created_at": t.created_at.isoformat(),
    }

def _mtg_dict(m: Meeting) -> dict:
    return {
        "id": m.id,
        "title": m.title,
        "date": str(m.date),
        "start_time": m.start_time,
        "end_time": m.end_time,
        "attendees": m.attendees or [],
        "platform": m.platform,
        "notes": m.notes,
        "summary": m.summary,
        "action_items": m.action_items or [],
        "created_at": m.created_at.isoformat(),
    }


# ─── Timesheets ───────────────────────────────────────────────────────────────

@timesheet_router.get("")
async def list_timesheets(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(Timesheet).where(
        and_(Timesheet.user_id == current_user.id, Timesheet.is_deleted == False)
    )
    if date_from:
        from datetime import datetime
        q = q.where(Timesheet.date >= datetime.strptime(date_from, "%Y-%m-%d").date())
    if date_to:
        from datetime import datetime
        q = q.where(Timesheet.date <= datetime.strptime(date_to, "%Y-%m-%d").date())

    result = await db.execute(q.order_by(Timesheet.date.desc()))
    return [_ts_dict(t) for t in result.scalars().all()]

@timesheet_router.post("", status_code=201)
async def create_timesheet(data: TimesheetCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from datetime import datetime
    t = Timesheet(
        user_id=current_user.id,
        date=datetime.strptime(data.date, "%Y-%m-%d").date(),
        project_id=data.project_id,
        activity=data.activity,
        description=data.description,
        hours=data.hours,
        billable=data.billable,
    )
    db.add(t)
    await db.commit()
    await db.refresh(t)
    return _ts_dict(t)

@timesheet_router.post("/ai-generate")
async def ai_generate_timesheet(
    data: AIGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """AI-powered timesheet generation from completed tasks and meetings."""
    from app.services.tool_service import _generate_timesheet
    result = await _generate_timesheet(
        {"date": data.date} if data.date else {},
        current_user.id,
        db,
    )
    return result

@timesheet_router.patch("/{ts_id}")
async def update_timesheet(ts_id: str, data: TimesheetUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Timesheet).where(and_(Timesheet.id == ts_id, Timesheet.user_id == current_user.id)))
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(404, "Not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(t, field, value)
    await db.commit()
    return _ts_dict(t)

@timesheet_router.delete("/{ts_id}")
async def delete_timesheet(ts_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Timesheet).where(and_(Timesheet.id == ts_id, Timesheet.user_id == current_user.id)))
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(404, "Not found")
    t.is_deleted = True
    await db.commit()
    return {"deleted": True}


# ─── Meetings ─────────────────────────────────────────────────────────────────

@meeting_router.get("")
async def list_meetings(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Meeting)
        .where(and_(Meeting.user_id == current_user.id, Meeting.is_deleted == False))
        .order_by(Meeting.date.desc())
    )
    return [_mtg_dict(m) for m in result.scalars().all()]

@meeting_router.post("", status_code=201)
async def create_meeting(data: MeetingCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from datetime import datetime
    m = Meeting(
        user_id=current_user.id,
        title=data.title,
        date=datetime.strptime(data.date, "%Y-%m-%d").date(),
        start_time=data.start_time,
        end_time=data.end_time,
        attendees=data.attendees,
        platform=data.platform,
        notes=data.notes,
    )
    db.add(m)
    await db.commit()
    await db.refresh(m)
    return _mtg_dict(m)

@meeting_router.patch("/{mtg_id}")
async def update_meeting(mtg_id: str, data: MeetingUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Meeting).where(and_(Meeting.id == mtg_id, Meeting.user_id == current_user.id)))
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(404, "Not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(m, field, value)
    await db.commit()
    return _mtg_dict(m)

@meeting_router.post("/{mtg_id}/ai-summarize")
async def ai_summarize_meeting(
    mtg_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Ask AI to generate a summary and action items from meeting notes."""
    from app.services.ai_service import stream_chat
    result = await db.execute(select(Meeting).where(and_(Meeting.id == mtg_id, Meeting.user_id == current_user.id)))
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(404, "Not found")
    if not m.notes:
        raise HTTPException(400, "No meeting notes to summarize")

    prompt = f"Summarize these meeting notes and extract action items:\n\n{m.notes}"
    # For non-streaming summarize we collect the full response
    response_parts = []
    async for chunk in stream_chat([{"role": "user", "content": prompt}], user=current_user, tools=False):
        if chunk.startswith("data: ") and "[DONE]" not in chunk:
            import json
            try:
                payload = json.loads(chunk[6:].strip())
                if payload.get("type") == "text":
                    response_parts.append(payload["text"])
            except Exception:
                pass

    summary = "".join(response_parts)
    m.summary = summary
    await db.commit()
    return {"summary": summary}

@meeting_router.delete("/{mtg_id}")
async def delete_meeting(mtg_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Meeting).where(and_(Meeting.id == mtg_id, Meeting.user_id == current_user.id)))
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(404, "Not found")
    m.is_deleted = True
    await db.commit()
    return {"deleted": True}


router.include_router(timesheet_router)
router.include_router(meeting_router)
