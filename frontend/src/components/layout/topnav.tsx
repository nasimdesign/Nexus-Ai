"use client"

import { useState, useRef, useEffect } from "react"
import { Search, Bell, Plus, Sparkles, CheckSquare, Clock, FileText, Users, Menu } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/store/app-store"
import { formatRelativeTime } from "@/lib/utils"

const sectionTitles: Record<string, string> = {
  dashboard:  "Dashboard",
  chat:       "AI Chat",
  tasks:      "Tasks",
  projects:   "Projects",
  calendar:   "Calendar",
  timesheets: "Timesheets",
  meetings:   "Meetings",
  analytics:  "Analytics",
  knowledge:  "Knowledge Base",
  settings:   "Settings",
}

const quickCreateItems = [
  { label: "New task",        icon: CheckSquare, section: "tasks" },
  { label: "AI conversation", icon: Sparkles,    section: "chat" },
  { label: "Log time",        icon: Clock,       section: "timesheets" },
  { label: "Meeting note",    icon: Users,       section: "meetings" },
  { label: "Document",        icon: FileText,    section: "knowledge" },
]

export function TopNav() {
  const { activeSection, setCommandPaletteOpen, setActiveSection, notifications, markAllNotificationsRead, setSidebarOpen } = useAppStore()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const createRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.read).length

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false)
      if (createRef.current && !createRef.current.contains(e.target as Node)) setShowCreate(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <header className="flex h-14 items-center gap-3 border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-[#0f0f0f] px-4 sm:px-6 shrink-0">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
      >
        <Menu className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
      </button>

      <h1 className="text-sm font-semibold text-neutral-900 dark:text-white">
        {sectionTitles[activeSection] || "Nexus AI"}
      </h1>

      <div className="flex-1" />

      {/* Search trigger */}
      <button
        onClick={() => setCommandPaletteOpen(true)}
        className="hidden sm:flex h-8 items-center gap-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 px-3 text-xs text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden md:inline">Search anything…</span>
        <div className="ml-2 hidden md:flex items-center gap-0.5 opacity-50">
          <kbd className="rounded bg-neutral-200 dark:bg-neutral-700 px-1 py-0.5 text-[10px] font-medium">⌘</kbd>
          <kbd className="rounded bg-neutral-200 dark:bg-neutral-700 px-1 py-0.5 text-[10px] font-medium">K</kbd>
        </div>
      </button>

      {/* Mobile search */}
      <button
        onClick={() => setCommandPaletteOpen(true)}
        className="sm:hidden flex h-8 w-8 items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
      >
        <Search className="h-4 w-4 text-neutral-500" />
      </button>

      {/* Quick Create */}
      <div className="relative" ref={createRef}>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => setShowCreate(!showCreate)}
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">New</span>
        </Button>
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.97 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-10 z-50 w-52 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-lg shadow-neutral-900/5 dark:shadow-black/30 p-1.5"
            >
              {quickCreateItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.label}
                    onClick={() => { setActiveSection(item.section); setShowCreate(false) }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors group"
                  >
                    <Icon className="h-3.5 w-3.5 text-neutral-400 group-hover:text-indigo-500" />
                    {item.label}
                  </button>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* AI Status pill */}
      <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-neutral-200 dark:border-neutral-700 px-2.5 py-1">
        <div className="relative h-1.5 w-1.5">
          <div className="absolute inset-0 rounded-full bg-emerald-500" />
          <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-50" />
        </div>
        <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400">AI</span>
      </div>

      {/* Notifications */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative flex h-8 w-8 items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <Bell className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-indigo-600">
              <span className="sr-only">{unreadCount} unread</span>
            </span>
          )}
        </button>

        <AnimatePresence>
          {showNotifications && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-10 z-50 w-80 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-lg shadow-neutral-900/5 dark:shadow-black/30"
            >
              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 px-4 py-3">
                <span className="text-sm font-semibold text-neutral-900 dark:text-white">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-neutral-50 dark:divide-neutral-800/50">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex gap-3 px-4 py-3 ${!n.read ? "bg-indigo-50/40 dark:bg-indigo-950/20" : ""}`}
                  >
                    <div
                      className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                        n.type === "reminder" ? "bg-amber-400"
                        : n.type === "ai" ? "bg-indigo-400"
                        : n.type === "task" ? "bg-red-400"
                        : "bg-neutral-300"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-neutral-900 dark:text-neutral-100">{n.title}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1">{formatRelativeTime(n.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
              {notifications.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <Bell className="h-7 w-7 text-neutral-200 dark:text-neutral-700" />
                  <p className="text-xs text-neutral-400">All caught up!</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
