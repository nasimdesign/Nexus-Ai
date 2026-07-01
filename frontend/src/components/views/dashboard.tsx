"use client"

import { motion } from "framer-motion"
import {
  CheckCircle2, Clock, Zap, TrendingUp, ArrowRight,
  Calendar, AlertCircle, Sparkles, Target, Coffee,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useAppStore } from "@/store/app-store"
import { formatDate } from "@/lib/utils"

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
}

const priorityColor: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-400",
  medium: "bg-amber-400",
  low: "bg-neutral-300",
}

const priorityBadge: Record<string, "urgent" | "high" | "medium" | "low"> = {
  urgent: "urgent",
  high: "high",
  medium: "medium",
  low: "low",
}

export function Dashboard() {
  const { tasks, projects, setActiveSection } = useAppStore()
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  })

  const pendingTasks = tasks.filter((t) => t.status !== "done" && t.status !== "cancelled")
  const doneTasks = tasks.filter((t) => t.status === "done")
  const urgentTasks = pendingTasks.filter((t) => t.priority === "urgent")
  const todayTasks = pendingTasks.slice(0, 4)

  const aiSuggestions = [
    "You have a client demo tomorrow — consider finishing the checkout screens today.",
    "3 tasks are overdue. Block 1 hour after lunch to clear them.",
    "You're most productive between 9 AM and 12 PM — schedule deep work then.",
  ]

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-6 p-6 max-w-6xl"
    >
      {/* Header */}
      <motion.div variants={item} className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-1">{today}</p>
          <h2 className="text-2xl font-semibold text-neutral-900 tracking-tight">Good morning, Nasim</h2>
          <p className="text-sm text-neutral-500 mt-1">You have {urgentTasks.length} urgent tasks and 1 meeting today.</p>
        </div>
        <Button onClick={() => setActiveSection("chat")} className="gap-2">
          <Sparkles className="h-4 w-4" />
          Plan my day with AI
        </Button>
      </motion.div>

      {/* Stats row */}
      <motion.div variants={item} className="grid grid-cols-4 gap-4">
        {[
          { label: "Tasks pending", value: pendingTasks.length, icon: CheckCircle2, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Tasks done", value: doneTasks.length, icon: Target, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Hours logged", value: "5.5h", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Productivity", value: "82%", icon: TrendingUp, color: "text-violet-600", bg: "bg-violet-50" },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${stat.bg} mb-3`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{stat.label}</p>
              </CardContent>
            </Card>
          )
        })}
      </motion.div>

      {/* Main grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Today's focus */}
        <motion.div variants={item} className="col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>Today's Focus</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveSection("tasks")}
                  className="text-xs text-neutral-400 gap-1"
                >
                  All tasks <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              {todayTasks.map((task, i) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-neutral-50 transition-colors group cursor-pointer"
                >
                  <div className={`h-2 w-2 rounded-full shrink-0 ${priorityColor[task.priority]}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-800 font-medium truncate">{task.title}</p>
                    {task.project && (
                      <p className="text-xs text-neutral-400 truncate">{task.project}</p>
                    )}
                  </div>
                  <Badge variant={priorityBadge[task.priority]} className="shrink-0">
                    {task.priority}
                  </Badge>
                  {task.dueDate && (
                    <span className="text-xs text-neutral-400 shrink-0 hidden group-hover:block">
                      {formatDate(task.dueDate)}
                    </span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* AI Suggestions */}
          <motion.div variants={item}>
            <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-white">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-500" />
                  <CardTitle className="text-indigo-900">AI Insights</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {aiSuggestions.map((s, i) => (
                  <p key={i} className="text-xs text-indigo-700 leading-relaxed">
                    · {s}
                  </p>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveSection("chat")}
                  className="mt-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100 w-full justify-start text-xs gap-1.5"
                >
                  <Zap className="h-3 w-3" />
                  Ask AI for more
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Upcoming meeting */}
          <motion.div variants={item}>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-neutral-400" />
                  <CardTitle>Next Meeting</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-neutral-50 p-3">
                  <p className="text-sm font-medium text-neutral-800">Architecture Review</p>
                  <p className="text-xs text-neutral-500 mt-0.5">Today · 3:00 PM – 3:30 PM</p>
                  <div className="mt-2 flex items-center gap-1">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-200 text-[10px] font-medium">N</span>
                    <span className="text-xs text-neutral-400">Nasim (solo)</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-3 text-xs">
                  <Calendar className="h-3.5 w-3.5" />
                  View calendar
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Projects progress */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Projects</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveSection("projects")}
                className="text-xs text-neutral-400 gap-1"
              >
                All projects <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {projects.map((project) => (
                <div key={project.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
                    <span className="text-sm font-medium text-neutral-800 truncate">{project.name}</span>
                    <Badge
                      variant={project.status === "active" ? "success" : project.status === "on_hold" ? "warning" : "secondary"}
                      className="ml-auto shrink-0 text-[10px]"
                    >
                      {project.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <Progress value={project.progress} className="h-1" />
                  <div className="flex justify-between text-xs text-neutral-400">
                    <span>{project.tasksDone}/{project.tasksTotal} tasks</span>
                    <span>{project.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
