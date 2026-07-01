"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Clock, Sparkles, Download, Check, Plus, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/store/app-store"

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const weekDates = ["Jun 23", "Jun 24", "Jun 25", "Jun 26", "Jun 27", "Jun 28", "Jun 29"]

export function Timesheets() {
  const { } = useAppStore()
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)

  const entries = [
    { date: "Jun 29", project: "dxPOS v3", activity: "Design", description: "Checkout flow mobile wireframes → hi-fi", hours: 3.5, billable: true, color: "#9700ce" },
    { date: "Jun 29", project: "Nexus AI", activity: "Development", description: "Project scaffold, type system, components", hours: 2.0, billable: false, color: "#b133ff" },
    { date: "Jun 28", project: "dxPOS v3", activity: "Review", description: "WCAG 2.1 accessibility audit review", hours: 2.0, billable: true, color: "#9700ce" },
    { date: "Jun 28", project: "HR Module UI", activity: "Design", description: "Leave management calendar component", hours: 4.0, billable: true, color: "#0EA5E9" },
    { date: "Jun 27", project: "dxPOS v3", activity: "Meeting", description: "Sprint planning + client requirements review", hours: 1.5, billable: true, color: "#9700ce" },
    { date: "Jun 26", project: "dxPOS v3", activity: "Design", description: "Mobile wireframes round 2", hours: 4.0, billable: true, color: "#9700ce" },
    { date: "Jun 25", project: "HR Module UI", activity: "Research", description: "ERPNext HR module UX audit", hours: 3.0, billable: true, color: "#0EA5E9" },
  ]

  const totalHours = entries.reduce((s, e) => s + e.hours, 0)
  const billableHours = entries.filter((e) => e.billable).reduce((s, e) => s + e.hours, 0)

  const weekGrid: Record<string, { hours: number; color: string }[]> = {}
  days.forEach((d, i) => { weekGrid[d] = [] })
  entries.forEach((e) => {
    const dayIdx = weekDates.indexOf(e.date)
    if (dayIdx >= 0) {
      weekGrid[days[dayIdx]].push({ hours: e.hours, color: e.color })
    }
  })

  const handleGenerate = async () => {
    setGenerating(true)
    await new Promise((r) => setTimeout(r, 1800))
    setGenerating(false)
    setGenerated(true)
  }

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Timesheets</h2>
          <p className="text-sm text-neutral-500">Week of June 23 – 29, 2026</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-neutral-200 bg-white">
            <button className="p-2 hover:bg-neutral-50 rounded-l-lg transition-colors">
              <ChevronLeft className="h-4 w-4 text-neutral-500" />
            </button>
            <span className="px-3 text-sm text-neutral-700 font-medium">This week</span>
            <button className="p-2 hover:bg-neutral-50 rounded-r-lg transition-colors">
              <ChevronRight className="h-4 w-4 text-neutral-500" />
            </button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={generating}
            className="gap-1.5"
          >
            {generating ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-300 border-t-indigo-600" />
                Generating…
              </>
            ) : generated ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                Generated
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                AI Generate
              </>
            )}
          </Button>
          <Button size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Add entry
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total hours", value: `${totalHours}h`, color: "text-neutral-900" },
          { label: "Billable", value: `${billableHours}h`, color: "text-emerald-600" },
          { label: "Non-billable", value: `${totalHours - billableHours}h`, color: "text-neutral-500" },
          { label: "Utilization", value: `${Math.round((billableHours / totalHours) * 100)}%`, color: "text-indigo-600" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Week calendar visual */}
      <Card className="mb-5">
        <CardHeader>
          <CardTitle>Week Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, i) => {
              const dayEntries = weekGrid[day]
              const dayHours = dayEntries.reduce((s, e) => s + e.hours, 0)
              const isToday = day === "Sun"

              return (
                <div key={day} className="flex flex-col items-center gap-1.5">
                  <span className={`text-xs font-medium ${isToday ? "text-indigo-600" : "text-neutral-500"}`}>
                    {day}
                  </span>
                  <span className={`text-[10px] ${isToday ? "text-indigo-400" : "text-neutral-400"}`}>
                    {weekDates[i]}
                  </span>
                  {/* Bar */}
                  <div className="h-28 w-full rounded-lg bg-neutral-50 flex flex-col-reverse overflow-hidden gap-px">
                    {dayEntries.map((e, j) => (
                      <div
                        key={j}
                        className="w-full rounded-sm transition-all"
                        style={{
                          height: `${(e.hours / 8) * 100}%`,
                          backgroundColor: e.color,
                          opacity: 0.8,
                        }}
                      />
                    ))}
                  </div>
                  <span className={`text-xs font-semibold ${dayHours > 0 ? "text-neutral-700" : "text-neutral-300"}`}>
                    {dayHours > 0 ? `${dayHours}h` : "—"}
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Entries table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Entries</CardTitle>
            <span className="text-xs text-neutral-400">{entries.length} entries</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-neutral-50">
            {entries.map((entry, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-neutral-50 transition-colors group"
              >
                <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                <div className="w-16 shrink-0">
                  <span className="text-xs text-neutral-500">{entry.date}</span>
                </div>
                <div className="w-28 shrink-0">
                  <span className="text-xs font-medium text-neutral-700">{entry.project}</span>
                </div>
                <div className="w-20 shrink-0">
                  <Badge variant="secondary" className="text-[10px]">{entry.activity}</Badge>
                </div>
                <p className="flex-1 text-sm text-neutral-700 truncate">{entry.description}</p>
                <Badge variant={entry.billable ? "success" : "secondary"} className="text-[10px] shrink-0">
                  {entry.billable ? "Billable" : "Internal"}
                </Badge>
                <div className="flex items-center gap-1 shrink-0">
                  <Clock className="h-3 w-3 text-neutral-400" />
                  <span className="text-sm font-semibold text-neutral-800 w-8 text-right">{entry.hours}h</span>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-neutral-100 px-5 py-3">
            <span className="text-xs text-neutral-500">Total this week</span>
            <span className="text-sm font-bold text-neutral-900">{totalHours}h</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
