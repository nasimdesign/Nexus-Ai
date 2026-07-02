"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Plus, Users, Clock, CheckSquare, TrendingUp, ArrowRight } from "lucide-react"
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

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Projects</h2>
          <p className="text-sm text-neutral-500">{projects.filter((p) => p.status === "active").length} active · {projects.length} total</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => {
          const name = window.prompt("Project name:")
          if (!name) return
          const client = window.prompt("Client name (optional):")
          const newProject: Project = {
            id: `P-${Date.now()}`,
            name,
            client: client || undefined,
            description: "",
            status: "active",
            progress: 0,
            color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 55%)`,
            tasksTotal: 0,
            tasksDone: 0,
            hoursLogged: 0,
            members: ["Nasim"],
            createdAt: new Date().toISOString(),
          }
          addProject(newProject)
        }}>
          <Plus className="h-3.5 w-3.5" /> New project
        </Button>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 gap-5">
        {projects.map((project) => {
          const projectTasks = tasks.filter((t) => t.projectId === project.id)
          const doneTasks = projectTasks.filter((t) => t.status === "done")
          const inProgressTasks = projectTasks.filter((t) => t.status === "in_progress")

          return (
            <motion.div key={project.id} variants={item}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Color bar */}
                    <div
                      className="mt-1 h-10 w-1 rounded-full shrink-0"
                      style={{ backgroundColor: project.color }}
                    />

                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base font-semibold text-neutral-900">{project.name}</h3>
                            <Badge variant={statusBadge[project.status]} className="capitalize">
                              {project.status.replace("_", " ")}
                            </Badge>
                          </div>
                          {project.client && (
                            <p className="text-xs text-neutral-500">{project.client}</p>
                          )}
                          {project.description && (
                            <p className="text-sm text-neutral-500 mt-1">{project.description}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Progress */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-neutral-500 mb-1.5">
                          <span>Progress</span>
                          <span className="font-medium text-neutral-800">{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className="h-2" />
                      </div>

                      {/* Stats grid */}
                      <div className="grid grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                          <CheckSquare className="h-3.5 w-3.5 text-neutral-400" />
                          <div>
                            <p className="text-xs font-semibold text-neutral-800">{project.tasksDone}/{project.tasksTotal}</p>
                            <p className="text-[10px] text-neutral-400">Tasks</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-neutral-400" />
                          <div>
                            <p className="text-xs font-semibold text-neutral-800">
                              {project.hoursLogged}h{project.hoursBudget ? `/${project.hoursBudget}h` : ""}
                            </p>
                            <p className="text-[10px] text-neutral-400">Hours</p>
                          </div>
                        </div>
                        {project.dueDate && (
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-3.5 w-3.5 text-neutral-400" />
                            <div>
                              <p className="text-xs font-semibold text-neutral-800">{formatDate(project.dueDate)}</p>
                              <p className="text-[10px] text-neutral-400">Due date</p>
                            </div>
                          </div>
                        )}
                        {project.members && (
                          <div className="flex items-center gap-2">
                            <Users className="h-3.5 w-3.5 text-neutral-400" />
                            <div>
                              <div className="flex -space-x-1">
                                {project.members.slice(0, 3).map((m, i) => (
                                  <div
                                    key={m}
                                    className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-indigo-100 text-[9px] font-semibold text-indigo-700"
                                    style={{ zIndex: 10 - i }}
                                  >
                                    {m[0]}
                                  </div>
                                ))}
                              </div>
                              <p className="text-[10px] text-neutral-400 mt-0.5">{project.members.length} members</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Hour budget bar */}
                      {project.hoursBudget && (
                        <div className="mt-3 pt-3 border-t border-neutral-100">
                          <div className="flex justify-between text-[10px] text-neutral-400 mb-1">
                            <span>Budget utilization</span>
                            <span>{Math.round((project.hoursLogged / project.hoursBudget) * 100)}%</span>
                          </div>
                          <div className="h-1 rounded-full bg-neutral-100 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${Math.min((project.hoursLogged / project.hoursBudget) * 100, 100)}%`,
                                backgroundColor: project.color,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
