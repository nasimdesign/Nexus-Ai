"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  ChevronLeft, ChevronRight, Plus, Video, Users, MapPin, Sparkles,
  Clock, Calendar as CalIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppStore } from "@/store/app-store"

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7) // 7am to 7pm

const platformIcon = {
  zoom: "🎥",
  teams: "💼",
  meet: "📹",
  in_person: "📍",
}

const calendarEvents = [
  {
    id: "e1",
    title: "Sprint Planning — dxPOS v3",
    date: "2026-07-01",
    startHour: 10,
    startMin: 0,
    duration: 60,
    attendees: ["Nasim", "Ahmed", "Sara", "Client"],
    platform: "zoom" as const,
    color: "#9700ce",
    type: "meeting",
  },
  {
    id: "e2",
    title: "Checkout Flow Deep Work",
    date: "2026-07-01",
    startHour: 9,
    startMin: 0,
    duration: 90,
    color: "#b133ff",
    type: "focus",
  },
  {
    id: "e3",
    title: "Client Demo — dxPOS Mobile",
    date: "2026-07-01",
    startHour: 14,
    startMin: 0,
    duration: 60,
    attendees: ["Nasim", "Ahmed", "Client"],
    platform: "meet" as const,
    color: "#0EA5E9",
    type: "meeting",
  },
  {
    id: "e4",
    title: "Nexus AI Architecture Review",
    date: "2026-07-01",
    startHour: 15,
    startMin: 30,
    duration: 30,
    attendees: ["Nasim"],
    platform: "in_person" as const,
    color: "#b133ff",
    type: "meeting",
  },
  {
    id: "e5",
    title: "ERPNext Integration Spec Writing",
    date: "2026-07-02",
    startHour: 9,
    startMin: 0,
    duration: 120,
    color: "#b133ff",
    type: "focus",
  },
  {
    id: "e6",
    title: "Team Standup",
    date: "2026-07-02",
    startHour: 11,
    startMin: 0,
    duration: 30,
    attendees: ["Nasim", "Ahmed", "Sara"],
    platform: "meet" as const,
    color: "#0EA5E9",
    type: "meeting",
  },
  {
    id: "e7",
    title: "Design Review: Onboarding Flow",
    date: "2026-07-03",
    startHour: 14,
    startMin: 0,
    duration: 60,
    attendees: ["Nasim", "Ahmed"],
    platform: "zoom" as const,
    color: "#9700ce",
    type: "meeting",
  },
]

const weekDaysOfDate = (anchor: Date) => {
  const day = anchor.getDay()
  const monday = new Date(anchor)
  monday.setDate(anchor.getDate() - ((day + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

const toDateStr = (d: Date) => d.toISOString().slice(0, 10)

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }

export function CalendarView() {
  const [anchor, setAnchor] = useState(new Date("2026-07-01"))
  const [view, setView] = useState<"week" | "day">("week")
  const days = weekDaysOfDate(anchor)
  const today = new Date("2026-07-01")

  const prevWeek = () => {
    const d = new Date(anchor); d.setDate(d.getDate() - 7); setAnchor(d)
  }
  const nextWeek = () => {
    const d = new Date(anchor); d.setDate(d.getDate() + 7); setAnchor(d)
  }
  const goToday = () => setAnchor(new Date("2026-07-01"))

  const weekLabel = `${days[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${days[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`

  const getEventsForDay = (dateStr: string) =>
    calendarEvents.filter((e) => e.date === dateStr)

  const getEventStyle = (event: typeof calendarEvents[0]) => {
    const topPercent = ((event.startHour - 7) * 60 + event.startMin) / (13 * 60) * 100
    const heightPercent = event.duration / (13 * 60) * 100
    return {
      top: `${topPercent}%`,
      height: `${heightPercent}%`,
      backgroundColor: event.color,
    }
  }

  // Stats for the week
  const weekEvents = calendarEvents.filter((e) => days.some((d) => toDateStr(d) === e.date))
  const meetingsCount = weekEvents.filter((e) => e.type === "meeting").length
  const focusCount = weekEvents.filter((e) => e.type === "focus").length
  const totalMins = weekEvents.reduce((s, e) => s + e.duration, 0)

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-col h-full overflow-hidden"
    >
      {/* Toolbar */}
      <motion.div variants={item} className="flex items-center gap-3 px-6 py-4 border-b border-neutral-100 bg-white shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={prevWeek}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-neutral-500" />
          </button>
          <span className="text-sm font-semibold text-neutral-800 min-w-[200px] text-center">{weekLabel}</span>
          <button
            onClick={nextWeek}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <ChevronRight className="h-4 w-4 text-neutral-500" />
          </button>
        </div>

        <Button variant="outline" size="sm" onClick={goToday} className="text-xs">
          Today
        </Button>

        {/* View toggle */}
        <div className="flex items-center rounded-lg border border-neutral-200 bg-neutral-50 p-0.5">
          {(["week", "day"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors ${
                view === v ? "bg-white shadow-sm text-neutral-800" : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            AI Schedule
          </Button>
          <Button size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            New event
          </Button>
        </div>
      </motion.div>

      {/* Week Stats Bar */}
      <motion.div variants={item} className="flex items-center gap-6 px-6 py-2.5 bg-neutral-50/50 border-b border-neutral-100 shrink-0">
        <div className="flex items-center gap-2">
          <CalIcon className="h-3.5 w-3.5 text-neutral-400" />
          <span className="text-xs text-neutral-500">{meetingsCount} meetings</span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-violet-400" />
          <span className="text-xs text-neutral-500">{focusCount} focus blocks</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-neutral-400" />
          <span className="text-xs text-neutral-500">{Math.round(totalMins / 60 * 10) / 10}h scheduled</span>
        </div>
        <div className="ml-auto">
          <span className="text-xs text-indigo-600 font-medium">✦ Peak hours: 9 AM – 11 AM</span>
        </div>
      </motion.div>

      {/* Calendar Grid */}
      <motion.div variants={item} className="flex flex-1 overflow-hidden">
        {/* Time labels */}
        <div className="flex flex-col border-r border-neutral-100 bg-white shrink-0 w-14">
          <div className="h-10 border-b border-neutral-100" /> {/* header spacer */}
          <div className="flex-1 relative">
            {HOURS.map((h) => (
              <div
                key={h}
                className="absolute w-full border-t border-neutral-100 flex items-start justify-end pr-2 pt-0.5"
                style={{ top: `${((h - 7) / 13) * 100}%` }}
              >
                <span className="text-[10px] text-neutral-400">
                  {h === 12 ? "12pm" : h > 12 ? `${h - 12}pm` : `${h}am`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Day columns */}
        <div className="flex flex-1 overflow-x-auto">
          {days.map((day) => {
            const dateStr = toDateStr(day)
            const isToday = toDateStr(day) === toDateStr(today)
            const dayEvents = getEventsForDay(dateStr)

            return (
              <div key={dateStr} className="flex flex-col flex-1 min-w-[110px] border-r border-neutral-100 last:border-r-0">
                {/* Day header */}
                <div className={`flex flex-col items-center justify-center h-10 border-b border-neutral-100 shrink-0 ${isToday ? "bg-indigo-50" : "bg-white"}`}>
                  <span className={`text-[10px] font-medium uppercase tracking-wider ${isToday ? "text-indigo-500" : "text-neutral-400"}`}>
                    {day.toLocaleDateString("en-US", { weekday: "short" })}
                  </span>
                  <span className={`text-sm font-bold ${isToday ? "text-indigo-600" : "text-neutral-700"}`}>
                    {day.getDate()}
                  </span>
                </div>

                {/* Time grid */}
                <div className="flex-1 relative bg-white">
                  {/* Hour lines */}
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      className="absolute w-full border-t border-neutral-100"
                      style={{ top: `${((h - 7) / 13) * 100}%` }}
                    />
                  ))}

                  {/* Events */}
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className="absolute left-1 right-1 rounded-md px-1.5 py-1 cursor-pointer hover:brightness-95 transition-all overflow-hidden group"
                      style={{ ...getEventStyle(event), opacity: 0.9 }}
                    >
                      <p className="text-white text-[10px] font-semibold leading-tight truncate">
                        {event.type === "meeting" ? (platformIcon[event.platform as keyof typeof platformIcon] || "📅") + " " : "⚡ "}
                        {event.title}
                      </p>
                      {event.duration >= 45 && (
                        <p className="text-white/70 text-[9px] mt-0.5">
                          {event.startHour > 12 ? event.startHour - 12 : event.startHour}:{String(event.startMin).padStart(2, "0")}{event.startHour >= 12 ? "pm" : "am"}
                          {" · "}{event.duration}m
                        </p>
                      )}
                    </div>
                  ))}

                  {/* Today line */}
                  {isToday && (
                    <div
                      className="absolute left-0 right-0 z-10 flex items-center"
                      style={{ top: `${((12 - 7) * 60 + 40) / (13 * 60) * 100}%` }}
                    >
                      <div className="h-2 w-2 rounded-full bg-red-500 shrink-0 -ml-1" />
                      <div className="h-px flex-1 bg-red-400" />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Upcoming panel */}
      <motion.div variants={item} className="shrink-0 border-t border-neutral-100 bg-neutral-50/50 px-6 py-3">
        <div className="flex items-center gap-4 overflow-x-auto">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-widest shrink-0">Upcoming</span>
          {calendarEvents.filter((e) => e.date >= toDateStr(today)).slice(0, 4).map((event) => (
            <div
              key={event.id}
              className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 shrink-0 cursor-pointer hover:shadow-sm transition-shadow"
            >
              <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: event.color }} />
              <div>
                <p className="text-xs font-medium text-neutral-800">{event.title}</p>
                <p className="text-[10px] text-neutral-400">
                  {new Date(event.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  {" · "}
                  {event.startHour > 12 ? event.startHour - 12 : event.startHour}:
                  {String(event.startMin).padStart(2, "0")}
                  {event.startHour >= 12 ? "pm" : "am"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
