"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus, Filter, LayoutGrid, List, Search, ChevronRight,
  CheckCircle2, Circle, Clock, AlertCircle, Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { useAppStore } from "@/store/app-store"
import { formatDate } from "@/lib/utils"
import type { Task, TaskStatus } from "@/types"

const statusColumns: { id: TaskStatus; label: string; color: string }[] = [
  { id: "todo", label: "To Do", color: "bg-neutral-400" },
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
      className="group rounded-xl border border-neutral-100 bg-white p-4 shadow-sm hover:shadow-md hover:border-neutral-200 transition-all cursor-pointer"
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
                : "text-neutral-300 group-hover:text-neutral-400"
            }`}
          />
        </button>
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium leading-tight ${
              task.status === "done" ? "line-through text-neutral-400" : "text-neutral-800"
            }`}
          >
            {task.title}
          </p>
          {task.project && (
            <p className="text-xs text-neutral-400 mt-0.5">{task.project}</p>
          )}
          {subtasksTotal > 0 && (
            <div className="mt-2 space-y-1">
              <Progress value={(subtasksDone / subtasksTotal) * 100} className="h-1" />
              <p className="text-[10px] text-neutral-400">{subtasksDone}/{subtasksTotal} subtasks</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <Badge variant={priorityBadge[task.priority]}>{task.priority}</Badge>
        {task.dueDate && (
          <span className="text-[10px] text-neutral-400 flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" />
            {formatDate(task.dueDate)}
          </span>
        )}
        {task.estimatedHours && (
          <span className="text-[10px] text-neutral-400 ml-auto">
            ~{task.estimatedHours}h
          </span>
        )}
        {task.tags?.map((tag) => (
          <span key={tag} className="text-[10px] text-neutral-400 bg-neutral-50 px-1.5 py-0.5 rounded">
            {tag}
          </span>
        ))}
      </div>
    </motion.div>
  )
}

export function Tasks() {
  const { tasks, updateTask, addTask } = useAppStore()
  const [view, setView] = useState<"kanban" | "list">("kanban")
  const [search, setSearch] = useState("")
  const [filterPriority, setFilterPriority] = useState<string>("all")
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

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

  const totalDone = tasks.filter((t) => t.status === "done").length
  const totalTasks = tasks.length

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-neutral-100 px-6 py-4">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-[10px] text-neutral-400 uppercase tracking-widest">Progress</p>
            <p className="text-sm font-semibold text-neutral-800">{totalDone}/{totalTasks} completed</p>
          </div>
          <Progress value={(totalDone / totalTasks) * 100} className="w-24" />
        </div>

        <div className="flex-1 max-w-xs">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
            <Input
              placeholder="Search tasks…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
        </div>

        {/* Priority filter */}
        <div className="flex items-center gap-1">
          {["all", "urgent", "high", "medium", "low"].map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                filterPriority === p
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-neutral-500 hover:bg-neutral-100"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-neutral-200 bg-neutral-50 p-0.5">
            <button
              onClick={() => setView("kanban")}
              className={`rounded-md p-1.5 transition-colors ${view === "kanban" ? "bg-white shadow-sm" : "hover:bg-neutral-100"}`}
            >
              <LayoutGrid className="h-3.5 w-3.5 text-neutral-600" />
            </button>
            <button
              onClick={() => setView("list")}
              className={`rounded-md p-1.5 transition-colors ${view === "list" ? "bg-white shadow-sm" : "hover:bg-neutral-100"}`}
            >
              <List className="h-3.5 w-3.5 text-neutral-600" />
            </button>
          </div>

          <Button size="sm" className="gap-1.5" onClick={() => {
            const title = window.prompt("Enter new task title:")
            if (title) {
              const newTask = {
                id: `T-${Math.floor(Math.random() * 10000)}`,
                title,
                status: "todo" as const,
                priority: "medium" as const,
                project: "Inbox",
                assignee: "Nasim",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                dueDate: new Date(Date.now() + 86400000).toISOString(),
                estimatedHours: 1,
              }
              addTask(newTask)
            }
          }}>
            <Plus className="h-3.5 w-3.5" /> Add task
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
            const title = "Review quarterly OKRs"
            const newTask = {
              id: `T-${Math.floor(Math.random() * 10000)}`,
              title,
              status: "todo" as const,
              priority: "high" as const,
              project: "Nexus AI",
              assignee: "Nasim",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              dueDate: new Date(Date.now() + 172800000).toISOString(),
              estimatedHours: 2,
            }
            addTask(newTask)
          }}>
            <Sparkles className="h-3.5 w-3.5" /> AI suggest
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {view === "kanban" ? (
          <div className="grid grid-cols-4 gap-4 h-full">
            {statusColumns.map((col) => {
              const colTasks = filtered.filter((t) => t.status === col.id)
              return (
                <div key={col.id} className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`h-2 w-2 rounded-full ${col.color}`} />
                    <span className="text-xs font-semibold text-neutral-600">{col.label}</span>
                    <span className="ml-auto text-xs text-neutral-400 bg-neutral-100 rounded-full px-2 py-0.5">
                      {colTasks.length}
                    </span>
                  </div>
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
                    <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-neutral-200 text-xs text-neutral-400">
                      No tasks
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="max-w-3xl space-y-1.5">
            {filtered.map((task) => {
              const Icon = statusIcon[task.status]
              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-white px-4 py-3 hover:shadow-sm hover:border-neutral-200 transition-all group cursor-pointer"
                >
                  <button onClick={(e) => { e.stopPropagation(); toggleTaskDone(task); }}>
                    <Icon
                      className={`h-4 w-4 ${
                        task.status === "done" ? "text-emerald-500"
                        : task.status === "in_progress" ? "text-blue-500"
                        : "text-neutral-300 group-hover:text-neutral-400"
                      }`}
                    />
                  </button>
                  <p className={`flex-1 text-sm font-medium ${task.status === "done" ? "line-through text-neutral-400" : "text-neutral-800"}`}>
                    {task.title}
                  </p>
                  {task.project && (
                    <span className="text-xs text-neutral-400">{task.project}</span>
                  )}
                  <Badge variant={priorityBadge[task.priority]} className="shrink-0">
                    {task.priority}
                  </Badge>
                  {task.dueDate && (
                    <span className="text-xs text-neutral-400 shrink-0">{formatDate(task.dueDate)}</span>
                  )}
                  <ChevronRight className="h-3.5 w-3.5 text-neutral-300 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )
            })}
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
              className="absolute inset-0 z-40 bg-neutral-900/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 z-50 w-full max-w-md border-l border-neutral-200 bg-white shadow-2xl flex flex-col"
            >
              {(() => {
                const task = tasks.find((t) => t.id === selectedTaskId)
                if (!task) return null
                const Icon = statusIcon[task.status]
                
                return (
                  <>
                    <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-neutral-500">
                        <span>{task.project || "Inbox"}</span>
                        <span>/</span>
                        <span>{task.id.slice(0, 8)}</span>
                      </div>
                      <button
                        onClick={() => setSelectedTaskId(null)}
                        className="rounded-full p-1.5 hover:bg-neutral-100 text-neutral-500 transition-colors"
                      >
                        <Plus className="h-5 w-5 rotate-45" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
                      {/* Title & Status */}
                      <div className="space-y-4">
                        <h2 className="text-2xl font-semibold text-neutral-900 leading-tight">
                          {task.title}
                        </h2>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleTaskDone(task)}
                            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                              task.status === "done" 
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700" 
                                : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            <span className="capitalize">{task.status.replace("_", " ")}</span>
                          </button>
                          
                          <Badge variant={priorityBadge[task.priority]} className="h-8 px-3 rounded-lg">
                            {task.priority} Priority
                          </Badge>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                        <div>
                          <p className="text-neutral-500 mb-1">Assignee</p>
                          <div className="flex items-center gap-2 text-neutral-900 font-medium">
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] text-primary">
                              {task.assignee ? task.assignee.charAt(0) : "U"}
                            </div>
                            {task.assignee || "Unassigned"}
                          </div>
                        </div>
                        <div>
                          <p className="text-neutral-500 mb-1">Due Date</p>
                          <div className="flex items-center gap-2 text-neutral-900 font-medium">
                            <Clock className="h-4 w-4 text-neutral-400" />
                            {task.dueDate ? formatDate(task.dueDate) : "No date"}
                          </div>
                        </div>
                        <div>
                          <p className="text-neutral-500 mb-1">Estimate</p>
                          <p className="text-neutral-900 font-medium">
                            {task.estimatedHours ? `${task.estimatedHours} hours` : "None"}
                          </p>
                        </div>
                        <div>
                          <p className="text-neutral-500 mb-1">Logged Time</p>
                          <p className="text-neutral-900 font-medium">
                            {task.loggedHours ? `${task.loggedHours} hours` : "0 hours"}
                          </p>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="space-y-3">
                        <h3 className="font-semibold text-neutral-900">Description</h3>
                        <div className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-4 text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed min-h-[100px]">
                          {task.description || "No description provided."}
                        </div>
                      </div>

                      {/* Subtasks */}
                      {task.subtasks && task.subtasks.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-neutral-900">Subtasks</h3>
                            <span className="text-xs font-medium text-neutral-500">
                              {task.subtasks.filter(s => s.completed).length} / {task.subtasks.length}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {task.subtasks.map((sub) => (
                              <div key={sub.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 transition-colors">
                                <button className="shrink-0 text-neutral-300 hover:text-primary">
                                  {sub.completed ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5" />}
                                </button>
                                <span className={`text-sm ${sub.completed ? "text-neutral-400 line-through" : "text-neutral-700"}`}>
                                  {sub.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="border-t border-neutral-100 p-4 bg-neutral-50 flex items-center justify-between">
                      <p className="text-xs text-neutral-400">
                        Created {formatDate(task.createdAt)}
                      </p>
                      <Button variant="outline" size="sm" className="bg-white">
                        Edit Task
                      </Button>
                    </div>
                  </>
                )
              })()}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
