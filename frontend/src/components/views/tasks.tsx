"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus, Filter, LayoutGrid, List, Search, ChevronRight,
  CheckCircle2, Circle, Clock, AlertCircle, Sparkles, X, Edit2, CheckSquare
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { useAppStore } from "@/store/app-store"
import { formatDate } from "@/lib/utils"
import type { Task, TaskStatus } from "@/types"

const statusColumns: { id: TaskStatus; label: string; color: string }[] = [
  { id: "todo", label: "To Do", color: "bg-muted-foreground" },
  { id: "in_progress", label: "In Progress", color: "bg-blue-500" },
  { id: "in_review", label: "In Review", color: "bg-amber-500" },
  { id: "done", label: "Done", color: "bg-emerald-500" },
]

const priorityBadge: Record<string, "urgent" | "high" | "medium" | "low"> = {
  urgent: "urgent", high: "high", medium: "medium", low: "low",
}

const statusIcon = {
  todo: Circle,
  in_progress: Clock,
  in_review: AlertCircle,
  done: CheckCircle2,
  cancelled: Circle,
}

function TaskCard({ task, onToggle, onSelect }: { task: Task; onToggle: () => void; onSelect: () => void }) {
  const Icon = statusIcon[task.status]
  const subtasksDone = task.subtasks?.filter((s) => s.completed).length ?? 0
  const subtasksTotal = task.subtasks?.length ?? 0

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      onClick={() => onSelect()}
      className="group rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md hover:border-primary/20 transition-all cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <button
          onClick={(e) => { e.stopPropagation(); onToggle() }}
          className="mt-0.5 shrink-0"
        >
          <Icon
            className={`h-4 w-4 transition-colors ${
              task.status === "done"
                ? "text-emerald-500"
                : task.status === "in_progress"
                ? "text-blue-500"
                : task.status === "in_review"
                ? "text-amber-500"
                : "text-muted-foreground group-hover:text-foreground"
            }`}
          />
        </button>
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium leading-tight ${
              task.status === "done" ? "line-through text-muted-foreground" : "text-foreground"
            }`}
          >
            {task.title}
          </p>
          {task.project && (
            <p className="text-xs text-muted-foreground mt-0.5">{task.project}</p>
          )}
          {subtasksTotal > 0 && (
            <div className="mt-2 space-y-1">
              <Progress value={(subtasksDone / subtasksTotal) * 100} className="h-1 bg-muted" />
              <p className="text-[10px] text-muted-foreground">{subtasksDone}/{subtasksTotal} subtasks</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <Badge variant={priorityBadge[task.priority]}>{task.priority}</Badge>
        {task.dueDate && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" />
            {formatDate(task.dueDate)}
          </span>
        )}
        {task.estimatedHours && (
          <span className="text-[10px] text-muted-foreground ml-auto">
            ~{task.estimatedHours}h
          </span>
        )}
        {task.tags?.map((tag) => (
          <span key={tag} className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {tag}
          </span>
        ))}
      </div>
    </motion.div>
  )
}

export function Tasks() {
  const { tasks, updateTask, addTask, user } = useAppStore()
  const [view, setView] = useState<"kanban" | "list">("kanban")
  const [search, setSearch] = useState("")
  const [filterPriority, setFilterPriority] = useState<string>("all")
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  
  // New Task Modal State
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [taskTitle, setTaskTitle] = useState("")
  const [taskPriority, setTaskPriority] = useState("medium")
  const [taskProject, setTaskProject] = useState("Inbox")
  const [isAiSuggesting, setIsAiSuggesting] = useState(false)

  const filtered = tasks.filter((t) => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase())
    const matchPriority = filterPriority === "all" || t.priority === filterPriority
    return matchSearch && matchPriority
  })

  const toggleTaskDone = (task: Task) => {
    updateTask(task.id, {
      status: task.status === "done" ? "todo" : "done",
    })
  }

  const handleManualTask = () => {
    if (!taskTitle.trim()) return
    const now = new Date().toISOString()
    const task: Task = {
      id: `T-${Date.now()}`,
      title: taskTitle.trim(),
      status: "todo",
      priority: taskPriority as any,
      project: taskProject || "Inbox",
      assignee: user?.name || "User",
      createdAt: now,
      updatedAt: now,
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      estimatedHours: 1,
    }
    addTask(task)
    setShowTaskModal(false)
    setTaskTitle("")
    setTaskPriority("medium")
    setTaskProject("Inbox")
  }

  const handleAiSuggestTask = async () => {
    setIsAiSuggesting(true)
    try {
      const prompt = "Based on general web development, suggest ONE specific actionable task I should do next. Reply with ONLY the task title (max 10 words), priority (urgent/high/medium/low), and project name (Frontend, Backend, etc), separated by pipes. Example: Review API docs|high|Backend"
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
      })
      const text = await res.text()
      const parts = text.split("|").map(s => s.trim())
      const title = parts[0] || "Review latest codebase changes"
      const priority = (["urgent", "high", "medium", "low"].includes(parts[1]?.toLowerCase()) ? parts[1].toLowerCase() : "medium") as any
      const project = parts[2] || "Nexus AI"
      const now = new Date().toISOString()
      
      const newTask: Task = {
        id: `T-${Date.now()}`,
        title,
        status: "todo",
        priority,
        project,
        assignee: user?.name || "AI Assistant",
        createdAt: now,
        updatedAt: now,
        dueDate: new Date(Date.now() + 172800000).toISOString(),
        estimatedHours: 2,
      }
      addTask(newTask)
    } catch (e) {
      console.error(e)
    } finally {
      setIsAiSuggesting(false)
    }
  }

  const totalDone = tasks.filter((t) => t.status === "done").length
  const totalTasks = tasks.length

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 border-b border-border px-4 md:px-6 py-4 shrink-0">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="shrink-0">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Progress</p>
            <p className="text-sm font-semibold text-foreground">{totalDone}/{totalTasks} completed</p>
          </div>
          <Progress value={(totalDone / totalTasks) * 100} className="w-full md:w-24 h-1.5 bg-muted" />
        </div>

        <div className="flex-1 w-full max-w-full md:max-w-xs">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search tasks…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs bg-surface border-border"
            />
          </div>
        </div>

        <div className="w-full md:w-auto flex flex-wrap items-center justify-between gap-3 md:ml-auto">
          {/* Priority filter */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
            {["all", "urgent", "high", "medium", "low"].map((p) => (
              <button
                key={p}
                onClick={() => setFilterPriority(p)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize transition-colors shrink-0 ${
                  filterPriority === p
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* View toggle */}
            <div className="flex items-center rounded-lg border border-border bg-surface p-0.5 hidden sm:flex">
              <button
                onClick={() => setView("kanban")}
                className={`rounded-md p-1.5 transition-colors ${view === "kanban" ? "bg-background shadow-sm" : "hover:bg-muted"}`}
              >
                <LayoutGrid className="h-3.5 w-3.5 text-foreground" />
              </button>
              <button
                onClick={() => setView("list")}
                className={`rounded-md p-1.5 transition-colors ${view === "list" ? "bg-background shadow-sm" : "hover:bg-muted"}`}
              >
                <List className="h-3.5 w-3.5 text-foreground" />
              </button>
            </div>

            <Button size="sm" className="gap-1.5" onClick={() => setShowTaskModal(true)}>
              <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Add task</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 border-border bg-surface" onClick={handleAiSuggestTask} disabled={isAiSuggesting}>
              {isAiSuggesting ? (
                <div className="h-3.5 w-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              )}
              <span className="hidden sm:inline">{isAiSuggesting ? "Thinking..." : "AI Suggest"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        {view === "kanban" ? (
          <div className="flex md:grid md:grid-cols-4 gap-4 h-full overflow-x-auto pb-4 md:pb-0 snap-x">
            {statusColumns.map((col) => {
              const colTasks = filtered.filter((t) => t.status === col.id)
              return (
                <div key={col.id} className="flex flex-col gap-3 min-w-[280px] md:min-w-0 snap-start">
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <div className={`h-2 w-2 rounded-full ${col.color}`} />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{col.label}</span>
                    <span className="ml-auto text-[10px] font-bold text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                      {colTasks.length}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-4">
                    <AnimatePresence>
                      {colTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onToggle={() => toggleTaskDone(task)}
                          onSelect={() => setSelectedTaskId(task.id)}
                        />
                      ))}
                    </AnimatePresence>
                    {colTasks.length === 0 && (
                      <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-border text-xs text-muted-foreground bg-surface/50">
                        No tasks
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-2">
            {filtered.map((task) => {
              const Icon = statusIcon[task.status]
              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  className="flex flex-wrap sm:flex-nowrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 hover:shadow-sm hover:border-primary/30 transition-all group cursor-pointer"
                >
                  <button onClick={(e) => { e.stopPropagation(); toggleTaskDone(task); }} className="shrink-0">
                    <Icon
                      className={`h-5 w-5 ${
                        task.status === "done" ? "text-emerald-500"
                        : task.status === "in_progress" ? "text-blue-500"
                        : "text-muted-foreground group-hover:text-foreground"
                      }`}
                    />
                  </button>
                  <div className="flex-1 min-w-0 pr-4">
                    <p className={`text-sm font-medium truncate ${task.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {task.project && (
                        <span className="text-[11px] text-muted-foreground">{task.project}</span>
                      )}
                      {task.dueDate && (
                        <span className="text-[11px] text-muted-foreground">• {formatDate(task.dueDate)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0 ml-8 sm:ml-0">
                    <Badge variant={priorityBadge[task.priority]} className="shrink-0 shadow-sm">
                      {task.priority}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-sm text-muted-foreground border border-dashed border-border rounded-xl">
                No tasks found. Try adjusting your filters.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Task Detail Slide-over */}
      <AnimatePresence>
        {selectedTaskId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTaskId(null)}
              className="absolute inset-0 z-40 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 z-50 w-full sm:w-[480px] border-l border-border bg-background shadow-2xl flex flex-col"
            >
              {(() => {
                const task = tasks.find((t) => t.id === selectedTaskId)
                if (!task) return null
                const Icon = statusIcon[task.status]
                
                return (
                  <>
                    <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-surface">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <span>{task.project || "Inbox"}</span>
                        <span>/</span>
                        <span>{task.id.slice(0, 8)}</span>
                      </div>
                      <button
                        onClick={() => setSelectedTaskId(null)}
                        className="rounded-full p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Plus className="h-5 w-5 rotate-45" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8">
                      {/* Title & Status */}
                      <div className="space-y-4">
                        <h2 className="text-2xl font-semibold text-foreground leading-tight">
                          {task.title}
                        </h2>
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            onClick={() => toggleTaskDone(task)}
                            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors shadow-sm ${
                              task.status === "done" 
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                                : "border-border bg-surface text-foreground hover:bg-muted"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            <span className="capitalize">{task.status.replace("_", " ")}</span>
                          </button>
                          
                          <Badge variant={priorityBadge[task.priority]} className="h-8 px-3 rounded-lg text-xs shadow-sm">
                            {task.priority} Priority
                          </Badge>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-y-6 gap-x-8 text-sm">
                        <div>
                          <p className="text-muted-foreground mb-1.5 text-xs font-medium uppercase tracking-wider">Assignee</p>
                          <div className="flex items-center gap-2 text-foreground font-medium">
                            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                              {task.assignee ? task.assignee.charAt(0).toUpperCase() : "U"}
                            </div>
                            {task.assignee || "Unassigned"}
                          </div>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1.5 text-xs font-medium uppercase tracking-wider">Due Date</p>
                          <div className="flex items-center gap-2 text-foreground font-medium">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {task.dueDate ? formatDate(task.dueDate) : "No date"}
                          </div>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1.5 text-xs font-medium uppercase tracking-wider">Estimate</p>
                          <p className="text-foreground font-medium">
                            {task.estimatedHours ? `${task.estimatedHours} hours` : "None"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1.5 text-xs font-medium uppercase tracking-wider">Logged Time</p>
                          <p className="text-foreground font-medium">
                            {task.loggedHours ? `${task.loggedHours} hours` : "0 hours"}
                          </p>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Description</h3>
                        <div className="rounded-xl border border-border bg-surface p-4 text-sm text-foreground whitespace-pre-wrap leading-relaxed min-h-[100px] shadow-inner">
                          {task.description || "No description provided."}
                        </div>
                      </div>

                      {/* Subtasks */}
                      {task.subtasks && task.subtasks.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Subtasks</h3>
                            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                              {task.subtasks.filter(s => s.completed).length} / {task.subtasks.length}
                            </span>
                          </div>
                          <div className="space-y-2 border border-border rounded-xl p-2 bg-surface">
                            {task.subtasks.map((sub) => (
                              <div key={sub.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
                                <button className="shrink-0 text-muted-foreground hover:text-primary transition-colors">
                                  {sub.completed ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Circle className="h-5 w-5" />}
                                </button>
                                <span className={`text-sm ${sub.completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                                  {sub.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="border-t border-border p-4 bg-surface flex items-center justify-between">
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                        Created {formatDate(task.createdAt)}
                      </p>
                      <Button variant="outline" size="sm" className="bg-background border-border gap-2">
                        <Edit2 className="h-3 w-3" /> Edit Task
                      </Button>
                    </div>
                  </>
                )
              })()}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* New Task Modal */}
      <AnimatePresence>
        {showTaskModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowTaskModal(false)} className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="absolute inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="pointer-events-auto w-full max-w-md rounded-2xl bg-background border border-border shadow-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <CheckSquare className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">New Task</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Add a task manually to your board</p>
                    </div>
                  </div>
                  <button onClick={() => setShowTaskModal(false)} className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted text-muted-foreground transition-colors"><X className="h-4 w-4" /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Task title</label>
                    <input autoFocus value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleManualTask() }} placeholder="e.g. Prepare presentation" className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Priority</label>
                      <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                        <option value="urgent">🔴 Urgent</option>
                        <option value="high">🟠 High</option>
                        <option value="medium">🟡 Medium</option>
                        <option value="low">🔵 Low</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Project</label>
                      <select value={taskProject} onChange={(e) => setTaskProject(e.target.value)} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                        <option value="Inbox">📥 Inbox</option>
                        <option value="Nexus AI">🤖 Nexus AI</option>
                        <option value="Frontend">🎨 Frontend</option>
                        <option value="Backend">⚙️ Backend</option>
                      </select>
                    </div>
                  </div>
                  <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
                    <Button variant="ghost" onClick={() => setShowTaskModal(false)}>Cancel</Button>
                    <Button onClick={handleManualTask} disabled={!taskTitle.trim()}>Create Task</Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
