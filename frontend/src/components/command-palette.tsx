"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  LayoutDashboard, MessageSquare, CheckSquare, FolderKanban,
  Calendar, Clock, BarChart3, BookOpen, Settings, Plus,
  Zap, ArrowRight, Users, FileText, Sparkles, Search,
} from "lucide-react"
import { useAppStore } from "@/store/app-store"
import { AnimatePresence, motion } from "framer-motion"

interface Command {
  id: string
  label: string
  description?: string
  icon: React.ElementType
  group: string
  section?: string
  action?: () => void
  shortcut?: string
}

const navCommands: Command[] = [
  { id: "nav-dashboard", label: "Dashboard", description: "Overview, stats & AI insights", icon: LayoutDashboard, group: "Navigate", section: "dashboard", shortcut: "⌘1" },
  { id: "nav-chat", label: "AI Chat", description: "Chat with your AI assistant", icon: MessageSquare, group: "Navigate", section: "chat", shortcut: "⌘3" },
  { id: "nav-tasks", label: "Tasks", description: "Kanban board & task list", icon: CheckSquare, group: "Navigate", section: "tasks", shortcut: "⌘2" },
  { id: "nav-projects", label: "Projects", description: "All projects & progress", icon: FolderKanban, group: "Navigate", section: "projects" },
  { id: "nav-calendar", label: "Calendar", description: "Weekly schedule & meetings", icon: Calendar, group: "Navigate", section: "calendar" },
  { id: "nav-timesheets", label: "Timesheets", description: "Log & track your hours", icon: Clock, group: "Navigate", section: "timesheets", shortcut: "⌘4" },
  { id: "nav-meetings", label: "Meetings", description: "Meeting notes & action items", icon: Users, group: "Navigate", section: "meetings" },
  { id: "nav-analytics", label: "Analytics", description: "Productivity reports & charts", icon: BarChart3, group: "Navigate", section: "analytics" },
  { id: "nav-knowledge", label: "Knowledge Base", description: "Search your docs & notes", icon: BookOpen, group: "Navigate", section: "knowledge" },
  { id: "nav-settings", label: "Settings", description: "Configure AI, integrations & more", icon: Settings, group: "Navigate", section: "settings" },
]

const actionCommands: Command[] = [
  { id: "ai-plan", label: "Plan my day with AI", description: "Generate today's priority stack", icon: Sparkles, group: "AI Actions", section: "chat" },
  { id: "ai-standup", label: "Generate stand-up update", description: "AI-written daily stand-up", icon: FileText, group: "AI Actions", section: "chat" },
  { id: "ai-timesheet", label: "Generate today's timesheet", description: "Auto-fill timesheet from your work", icon: Clock, group: "AI Actions", section: "timesheets" },
  { id: "new-task", label: "Create new task", description: "Add a task to your board", icon: Plus, group: "Quick Actions", section: "tasks" },
  { id: "new-chat", label: "Start AI conversation", description: "Open a new AI chat", icon: Zap, group: "Quick Actions", section: "chat" },
  { id: "new-meeting", label: "New meeting note", description: "Create a meeting record", icon: Users, group: "Quick Actions", section: "meetings" },
]

const allCommands = [...navCommands, ...actionCommands]

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen, setActiveSection } = useAppStore()
  const [query, setQuery] = useState("")
  const [highlighted, setHighlighted] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClose = useCallback(() => {
    setCommandPaletteOpen(false)
    setQuery("")
    setHighlighted(0)
  }, [setCommandPaletteOpen])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setCommandPaletteOpen(!commandPaletteOpen)
      }
      if (e.key === "Escape") handleClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [commandPaletteOpen, setCommandPaletteOpen, handleClose])

  const filtered = query.trim()
    ? allCommands.filter(
        (c) =>
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          c.description?.toLowerCase().includes(query.toLowerCase())
      )
    : allCommands

  // Group filtered
  const groups = Array.from(new Set(filtered.map((c) => c.group)))

  const handleSelect = (cmd: Command) => {
    if (cmd.section) setActiveSection(cmd.section)
    if (cmd.action) cmd.action()
    handleClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlighted((h) => Math.max(h - 1, 0))
    } else if (e.key === "Enter") {
      const cmd = filtered[highlighted]
      if (cmd) handleSelect(cmd)
    }
  }

  useEffect(() => {
    if (commandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [commandPaletteOpen])

  useEffect(() => {
    setHighlighted(0)
  }, [query])

  if (!commandPaletteOpen) return null

  let globalIdx = -1

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[18vh]">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-neutral-900/25 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Panel */}
        <motion.div
          initial={{ opacity: 0, y: -14, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -14, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 500, damping: 36 }}
          className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-2xl shadow-neutral-900/12"
        >
          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3.5">
            <Search className="h-4 w-4 text-neutral-400 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search or type a command…"
              className="flex-1 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none bg-transparent"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                Clear
              </button>
            )}
            <kbd className="rounded border border-neutral-200 px-1.5 py-0.5 text-[10px] font-medium text-neutral-400">ESC</kbd>
          </div>

          {/* Results */}
          <div className="max-h-[360px] overflow-y-auto p-2">
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <Search className="h-8 w-8 text-neutral-200" />
                <p className="text-sm text-neutral-400">No results for "{query}"</p>
              </div>
            )}
            {groups.map((group) => {
              const groupItems = filtered.filter((c) => c.group === group)
              return (
                <div key={group} className="mb-1">
                  <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
                    {group}
                  </p>
                  {groupItems.map((cmd) => {
                    globalIdx++
                    const idx = globalIdx
                    const Icon = cmd.icon
                    const isHighlighted = highlighted === idx
                    return (
                      <button
                        key={cmd.id}
                        onClick={() => handleSelect(cmd)}
                        onMouseEnter={() => setHighlighted(idx)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors group ${
                          isHighlighted ? "bg-indigo-50" : "hover:bg-neutral-50"
                        }`}
                      >
                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                          isHighlighted ? "bg-indigo-100" : "bg-neutral-100"
                        }`}>
                          <Icon className={`h-3.5 w-3.5 transition-colors ${isHighlighted ? "text-indigo-600" : "text-neutral-500"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${isHighlighted ? "text-indigo-700" : "text-neutral-800"}`}>
                            {cmd.label}
                          </p>
                          {cmd.description && (
                            <p className="text-xs text-neutral-400 truncate">{cmd.description}</p>
                          )}
                        </div>
                        {cmd.shortcut && (
                          <kbd className="shrink-0 rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-[10px] font-medium text-neutral-400">
                            {cmd.shortcut}
                          </kbd>
                        )}
                        <ArrowRight className={`shrink-0 h-3.5 w-3.5 transition-opacity ${isHighlighted ? "text-indigo-400 opacity-100" : "text-neutral-300 opacity-0"}`} />
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>

          {/* Footer hints */}
          <div className="border-t border-neutral-100 px-4 py-2.5 flex items-center gap-5">
            <span className="flex items-center gap-1.5 text-[10px] text-neutral-400">
              <kbd className="rounded bg-neutral-100 px-1.5 py-0.5">↑↓</kbd> Navigate
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-neutral-400">
              <kbd className="rounded bg-neutral-100 px-1.5 py-0.5">↵</kbd> Select
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-neutral-400">
              <kbd className="rounded bg-neutral-100 px-1.5 py-0.5">ESC</kbd> Close
            </span>
            <span className="ml-auto text-[10px] text-neutral-300">{filtered.length} results</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
