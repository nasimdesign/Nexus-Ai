"use client"

import { motion } from "framer-motion"
import {
  CheckCircle2, Clock, Zap, TrendingUp, ArrowRight,
  Calendar, AlertCircle, Sparkles, Target, Coffee, CheckSquare, Users
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
  high: "bg-orange-500",
  medium: "bg-amber-500",
  low: "bg-neutral-400",
}

const priorityBadge: Record<string, "urgent" | "high" | "medium" | "low"> = {
  urgent: "urgent",
  high: "high",
  medium: "medium",
  low: "low",
}

export function Dashboard() {
  const { tasks, projects, setActiveSection, user } = useAppStore()
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
      className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full"
    >
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">{today}</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Good morning, {user?.name || "User"}</h2>
          <p className="text-sm text-muted-foreground mt-1">You have {urgentTasks.length} urgent tasks and 1 meeting today.</p>
        </div>
        <Button onClick={() => setActiveSection("chat")} className="gap-2 shrink-0">
          <Sparkles className="h-4 w-4" />
          Plan my day with AI
        </Button>
      </motion.div>

      {/* Stats row */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Tasks pending", value: pendingTasks.length, icon: CheckSquare, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/10" },
          { label: "Tasks done", value: doneTasks.length, icon: Target, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
          { label: "Hours logged", value: "5.5h", icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10" },
          { label: "Productivity", value: "82%", icon: TrendingUp, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-500/10" },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="bg-card">
              <CardContent className="p-4 sm:p-5">
                <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${stat.bg} mb-3`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs font-medium text-muted-foreground mt-0.5">{stat.label}</p>
              </CardContent>
            </Card>
          )
        })}
      </motion.div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's focus */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="h-full bg-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>Today's Focus</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveSection("tasks")}
                  className="text-xs text-muted-foreground gap-1 hover:text-foreground"
                >
                  All tasks <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              {todayTasks.length > 0 ? todayTasks.map((task, i) => (
                <div
                  key={task.id}
                  onClick={() => setActiveSection("tasks")}
                  className="flex items-center gap-3 rounded-xl border border-transparent px-3 py-3 hover:bg-muted hover:border-border transition-all cursor-pointer group"
                >
                  <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${priorityColor[task.priority]}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground font-medium truncate">{task.title}</p>
                    {task.project && (
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">{task.project}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {task.dueDate && (
                      <span className="text-[10px] text-muted-foreground shrink-0 hidden sm:block">
                        {formatDate(task.dueDate)}
                      </span>
                    )}
                    <Badge variant={priorityBadge[task.priority]} className="shrink-0">
                      {task.priority}
                    </Badge>
                  </div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500/50 mb-2" />
                  <p className="text-sm font-medium text-foreground">All caught up!</p>
                  <p className="text-xs text-muted-foreground mt-1">Enjoy the rest of your day.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          {/* AI Suggestions */}
          <motion.div variants={item}>
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[40px] -mr-16 -mt-16 pointer-events-none" />
              <CardHeader className="pb-2 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/20 text-primary">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <CardTitle className="text-primary">AI Insights</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 relative z-10">
                {aiSuggestions.map((s, i) => (
                  <div key={i} className="flex gap-2">
                    <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
                    <p className="text-xs text-foreground/80 leading-relaxed">
                      {s}
                    </p>
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveSection("chat")}
                  className="mt-2 text-primary hover:text-primary hover:bg-primary/10 w-full justify-start text-xs gap-1.5 font-medium"
                >
                  <Zap className="h-3.5 w-3.5" />
                  Ask AI for more
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Upcoming meeting */}
          <motion.div variants={item}>
            <Card className="bg-card">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <CardTitle>Next Meeting</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border border-border bg-surface p-3 shadow-sm">
                  <p className="text-sm font-semibold text-foreground">Architecture Review</p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    Today · 3:00 PM – 3:30 PM
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                      {user?.name?.charAt(0) || "U"}
                    </div>
                    <span className="text-xs font-medium text-foreground">{user?.name || "User"} <span className="text-muted-foreground font-normal">(solo)</span></span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-3 text-xs bg-background">
                  <Calendar className="h-3.5 w-3.5 mr-1.5" />
                  View calendar
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Projects progress */}
      <motion.div variants={item}>
        <Card className="bg-card">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <CardTitle>Active Projects</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveSection("projects")}
                className="text-xs text-muted-foreground gap-1 hover:text-foreground w-fit -ml-3 sm:ml-0"
              >
                All projects <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.filter(p => p.status === 'active').slice(0, 3).map((project) => (
                <div key={project.id} className="space-y-3 rounded-xl border border-border p-4 bg-surface shadow-sm cursor-pointer hover:border-primary/30 transition-all" onClick={() => setActiveSection("projects")}>
                  <div className="flex flex-wrap items-center gap-2 justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-3 w-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: project.color }} />
                      <span className="text-sm font-bold text-foreground truncate">{project.name}</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      <span>{project.tasksDone}/{project.tasksTotal} tasks</span>
                      <span className="text-foreground">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-1.5 bg-muted" />
                  </div>
                </div>
              ))}
            </div>
            {projects.filter(p => p.status === 'active').length === 0 && (
               <div className="text-center py-6 text-sm text-muted-foreground">
                 No active projects found.
               </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
