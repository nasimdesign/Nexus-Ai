import uuid
from datetime import datetime, timezone, date
from sqlalchemy import String, Boolean, DateTime, Text, ForeignKey, Integer, Float, Date, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base



def utcnow():
    return datetime.now(timezone.utc)



class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    client: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="active")  # active, on_hold, completed, archived
    color: Mapped[str] = mapped_column(String(20), default="#9700ce")
    hours_budget: Mapped[float | None] = mapped_column(Float, nullable=True)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    erpnext_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    user: Mapped["User"] = relationship(back_populates="projects")
    tasks: Mapped[list["Task"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    timesheets: Mapped[list["Timesheet"]] = relationship(back_populates="project")



class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    project_id: Mapped[str | None] = mapped_column(ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True)

    title: Mapped[str] = mapped_column(String(512))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="todo")  # todo, in_progress, in_review, done, cancelled
    priority: Mapped[str] = mapped_column(String(20), default="medium")  # urgent, high, medium, low
    tags: Mapped[list | None] = mapped_column(JSON, nullable=True)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    estimated_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    logged_hours: Mapped[float] = mapped_column(Float, default=0.0)
    assignee: Mapped[str | None] = mapped_column(String(255), nullable=True)
    erpnext_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship(back_populates="tasks")
    project: Mapped["Project | None"] = relationship(back_populates="tasks")
    subtasks: Mapped[list["SubTask"]] = relationship(back_populates="task", cascade="all, delete-orphan")



class SubTask(Base):
    __tablename__ = "subtasks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(512))
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    task: Mapped["Task"] = relationship(back_populates="subtasks")
