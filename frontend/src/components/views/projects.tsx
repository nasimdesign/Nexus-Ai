"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Users, Clock, CheckSquare, TrendingUp, ArrowRight, X, FolderKanban } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useAppStore } from "@/store/app-store"
import { formatDate } from "@/lib/utils"
import type { Project } from "@/types"

const statusBadge: Record<string, "success" | "warning" | "secondary" | "outline"> = {
  active: "success",
  on_hold: "warning",
  completed: "secondary",
  archived: "outline",
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

export function Projects() {
  const { projects, tasks, addProject } = useAppStore()
  
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectClient, setNewProjectClient] = useState("")
  const [newProjectDescription, setNewProjectDescription] = useState("")

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return
    
    const newProject: Project = {
      id: `P-${Date.now()}`,
      name: newProjectName.trim(),
      client: newProjectClient.trim() || undefined,
      description: newProjectDescription.trim() || undefined,
      status: "active",
      progress: 0,
      color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 55%)`,
      tasksTotal: 0,
      tasksDone: 0,
      hoursLogged: 0,
      members: ["User"],
    }
    
    addProject(newProject)
    setShowNewProjectModal(false)
    setNewProjectName("")
    setNewProjectClient("")
    setNewProjectDescription("")
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl font-semibold text-foreground tracking-tight">Projects</h2>
          <p className="text-sm text-muted-foreground mt-1">{projects.filter((p) => p.status === "active").length} active · {projects.length} total</p>
        </div>
        <Button className="gap-2" onClick={() => setShowNewProjectModal(true)}>
          <Plus className="h-4 w-4" /> New project
        </Button>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {projects.map((project) => {
          const projectTasks = tasks.filter((t) => t.projectId === project.id)
          const doneTasks = projectTasks.filter((t) => t.status === "done")
          
          return (
            <motion.div key={project.id} variants={item}>
              <Card className="h-full hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group bg-card">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Color bar */}
                    <div
                      className="mt-1 h-12 w-1.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: project.color }}
                    />

                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="text-base font-semibold text-foreground truncate">{project.name}</h3>
                            <Badge variant={statusBadge[project.status]} className="capitalize shrink-0">
                              {project.status.replace("_", " ")}
                            </Badge>
                          </div>
                          {project.client && (
                            <p className="text-xs text-muted-foreground truncate">{project.client}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Description */}
                      {project.description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{project.description}</p>
                      )}

                      {/* Progress */}
                      <div className="mb-5">
                        <div className="flex justify-between text-xs text-muted-foreground mb-2">
                          <span className="font-medium">Progress</span>
                          <span className="font-medium text-foreground">{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className="h-1.5 bg-muted" />
                      </div>

                      {/* Stats grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <CheckSquare className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-medium uppercase tracking-wider">Tasks</span>
                          </div>
                          <p className="text-sm font-semibold text-foreground">{project.tasksDone}/{project.tasksTotal}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-medium uppercase tracking-wider">Hours</span>
                          </div>
                          <p className="text-sm font-semibold text-foreground">
                            {project.hoursLogged}h
                          </p>
                        </div>
                        {project.dueDate && (
                          <div className="flex flex-col gap-1 hidden sm:flex">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <TrendingUp className="h-3.5 w-3.5" />
                              <span className="text-[10px] font-medium uppercase tracking-wider">Due</span>
                            </div>
                            <p className="text-sm font-semibold text-foreground truncate">{formatDate(project.dueDate)}</p>
                          </div>
                        )}
                        {project.members && (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Users className="h-3.5 w-3.5" />
                              <span className="text-[10px] font-medium uppercase tracking-wider">Team</span>
                            </div>
                            <div className="flex -space-x-1.5 mt-0.5">
                              {project.members.slice(0, 3).map((m, i) => (
                                <div
                                  key={m}
                                  className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-card bg-primary/10 text-[9px] font-bold text-primary"
                                  style={{ zIndex: 10 - i }}
                                >
                                  {m[0]}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      {/* New Project Modal */}
      <AnimatePresence>
        {showNewProjectModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNewProjectModal(false)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="pointer-events-auto w-full max-w-md rounded-2xl bg-background border border-border shadow-2xl overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <FolderKanban className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">New Project</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Create a workspace for a new initiative</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowNewProjectModal(false)}
                      className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted text-muted-foreground transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Project Name <span className="text-red-500">*</span></label>
                      <input
                        autoFocus
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        placeholder="e.g. Website Redesign"
                        className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Client <span className="text-muted-foreground font-normal">(Optional)</span></label>
                      <input
                        value={newProjectClient}
                        onChange={(e) => setNewProjectClient(e.target.value)}
                        placeholder="e.g. Acme Corp"
                        className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Description <span className="text-muted-foreground font-normal">(Optional)</span></label>
                      <textarea
                        value={newProjectDescription}
                        onChange={(e) => setNewProjectDescription(e.target.value)}
                        placeholder="Briefly describe the project goals..."
                        rows={3}
                        className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-border bg-muted/30 p-4 flex justify-end gap-3">
                  <Button variant="ghost" onClick={() => setShowNewProjectModal(false)}>Cancel</Button>
                  <Button onClick={handleCreateProject} disabled={!newProjectName.trim()}>Create Project</Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
