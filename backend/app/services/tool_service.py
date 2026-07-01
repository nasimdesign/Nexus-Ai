"""
Tool execution service — maps AI tool calls to real database actions.
"""
import json
import logging
from datetime import date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models.task import Task, Project
from app.models.timesheet import Timesheet, Meeting

logger = logging.getLogger(__name__)


async def execute_tool(tool_name: str, arguments: str, user_id: str, db: AsyncSession) -> str:
    """Execute an AI tool call and return the result as a JSON string."""
    try:
        args = json.loads(arguments) if arguments else {}
    except json.JSONDecodeError:
        args = {}

    handlers = {
        "create_task": _create_task,
        "get_pending_tasks": _get_pending_tasks,
        "generate_timesheet": _generate_timesheet,
        "generate_standup": _generate_standup,
        "get_today_schedule": _get_today_schedule,
        "search_knowledge": _search_knowledge,
    }

    handler = handlers.get(tool_name)
    if not handler:
        return json.dumps({"error": f"Unknown tool: {tool_name}"})

    try:
        result = await handler(args, user_id, db)
        return json.dumps(result)
    except Exception as e:
        logger.error(f"Tool {tool_name} error: {e}")
        return json.dumps({"error": str(e)})


async def _create_task(args: dict, user_id: str, db: AsyncSession) -> dict:
    # Find project if specified
    project_id = None
    if args.get("project_name"):
        result = await db.execute(
            select(Project).where(
                and_(Project.user_id == user_id, Project.name.ilike(f"%{args['project_name']}%"), Project.is_deleted == False)
            )
        )
        project = result.scalar_one_or_none()
        if project:
            project_id = project.id

    task = Task(
        user_id=user_id,
        project_id=project_id,
        title=args.get("title", "Untitled Task"),
        description=args.get("description"),
        priority=args.get("priority", "medium"),
        estimated_hours=args.get("estimated_hours"),
    )

    if args.get("due_date"):
        from datetime import datetime
        try:
            task.due_date = datetime.strptime(args["due_date"], "%Y-%m-%d").date()
        except ValueError:
            pass

    db.add(task)
    await db.commit()
    await db.refresh(task)

    return {
        "success": True,
        "task_id": task.id,
        "message": f"✅ Created task: **{task.title}**",
        "task": {
            "id": task.id,
            "title": task.title,
            "priority": task.priority,
            "status": task.status,
        }
    }


async def _get_pending_tasks(args: dict, user_id: str, db: AsyncSession) -> dict:
    result = await db.execute(
        select(Task).where(
            and_(
                Task.user_id == user_id,
                Task.status.in_(["todo", "in_progress", "in_review"]),
                Task.is_deleted == False,
            )
        ).order_by(Task.priority, Task.due_date)
    )
    tasks = result.scalars().all()

    return {
        "tasks": [
            {
                "id": t.id,
                "title": t.title,
                "priority": t.priority,
                "status": t.status,
                "due_date": str(t.due_date) if t.due_date else None,
                "estimated_hours": t.estimated_hours,
            }
            for t in tasks
        ],
        "total": len(tasks),
    }


async def _generate_timesheet(args: dict, user_id: str, db: AsyncSession) -> dict:
    target_date = date.today()
    if args.get("date"):
        from datetime import datetime
        try:
            target_date = datetime.strptime(args["date"], "%Y-%m-%d").date()
        except ValueError:
            pass

    # Get completed tasks for the day
    result = await db.execute(
        select(Task).where(
            and_(
                Task.user_id == user_id,
                Task.status == "done",
                Task.completed_at >= target_date,
                Task.is_deleted == False,
            )
        )
    )
    done_tasks = result.scalars().all()

    # Get meetings for the day
    mtg_result = await db.execute(
        select(Meeting).where(
            and_(Meeting.user_id == user_id, Meeting.date == target_date, Meeting.is_deleted == False)
        )
    )
    meetings = mtg_result.scalars().all()

    entries = []

    for task in done_tasks:
        hours = task.estimated_hours or 1.5
        entries.append({
            "activity": "Execution",
            "description": task.title,
            "hours": hours,
            "billable": True,
        })

    for mtg in meetings:
        start_h = int(mtg.start_time.split(":")[0]) if mtg.start_time else 9
        end_h = int(mtg.end_time.split(":")[0]) if mtg.end_time else 10
        hours = max(0.5, end_h - start_h)
        entries.append({
            "activity": "Meeting",
            "description": mtg.title,
            "hours": hours,
            "billable": False,
        })

    if not entries:
        entries = [
            {"activity": "Execution", "description": "General work and development", "hours": 4.0, "billable": True},
            {"activity": "Planning", "description": "Stand-up, emails, task review", "hours": 0.5, "billable": False},
        ]

    total = sum(e["hours"] for e in entries)

    return {
        "date": str(target_date),
        "entries": entries,
        "total_hours": round(total, 2),
        "message": f"Generated timesheet for {target_date} with {len(entries)} entries ({round(total, 2)} hours)",
    }


async def _generate_standup(args: dict, user_id: str, db: AsyncSession) -> dict:
    today = date.today()
    yesterday = today - timedelta(days=1)

    # Yesterday's done tasks
    yesterday_result = await db.execute(
        select(Task).where(
            and_(
                Task.user_id == user_id,
                Task.status == "done",
                Task.is_deleted == False,
            )
        ).order_by(Task.updated_at.desc()).limit(5)
    )
    done = yesterday_result.scalars().all()

    # Today's in-progress tasks
    today_result = await db.execute(
        select(Task).where(
            and_(
                Task.user_id == user_id,
                Task.status.in_(["todo", "in_progress"]),
                Task.is_deleted == False,
            )
        ).order_by(Task.priority).limit(5)
    )
    wip = today_result.scalars().all()

    return {
        "yesterday": [t.title for t in done],
        "today": [t.title for t in wip],
        "blockers": [],
        "message": "Generated stand-up update from your tasks",
    }


async def _get_today_schedule(args: dict, user_id: str, db: AsyncSession) -> dict:
    today = date.today()

    task_result = await db.execute(
        select(Task).where(
            and_(
                Task.user_id == user_id,
                Task.due_date == today,
                Task.is_deleted == False,
                Task.status.in_(["todo", "in_progress"]),
            )
        )
    )
    tasks = task_result.scalars().all()

    mtg_result = await db.execute(
        select(Meeting).where(
            and_(Meeting.user_id == user_id, Meeting.date == today, Meeting.is_deleted == False)
        )
    )
    meetings = mtg_result.scalars().all()

    return {
        "date": str(today),
        "tasks": [{"title": t.title, "priority": t.priority} for t in tasks],
        "meetings": [{"title": m.title, "time": f"{m.start_time}–{m.end_time}"} for m in meetings],
    }


async def _search_knowledge(args: dict, user_id: str, db: AsyncSession) -> dict:
    from app.models.knowledge import KnowledgeDoc
    from sqlalchemy import or_

    query = args.get("query", "")
    result = await db.execute(
        select(KnowledgeDoc).where(
            and_(
                KnowledgeDoc.user_id == user_id,
                KnowledgeDoc.is_deleted == False,
                or_(
                    KnowledgeDoc.title.ilike(f"%{query}%"),
                    KnowledgeDoc.content.ilike(f"%{query}%"),
                ),
            )
        ).limit(5)
    )
    docs = result.scalars().all()

    return {
        "results": [
            {"id": d.id, "title": d.title, "excerpt": d.content[:300]}
            for d in docs
        ],
        "total": len(docs),
    }
