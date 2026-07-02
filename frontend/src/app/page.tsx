"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sidebar } from "@/components/layout/sidebar"
import { TopNav } from "@/components/layout/topnav"
import { CommandPalette } from "@/components/command-palette"
import { Dashboard } from "@/components/views/dashboard"
import { Chat } from "@/components/views/chat"
import { Tasks } from "@/components/views/tasks"
import { Projects } from "@/components/views/projects"
import { CalendarView } from "@/components/views/calendar"
import { Timesheets } from "@/components/views/timesheets"
import { Meetings } from "@/components/views/meetings"
import { Analytics } from "@/components/views/analytics"
import { KnowledgeBase } from "@/components/views/knowledge-base"
import { Settings } from "@/components/views/settings"
import Login from "@/components/views/login"
import { useAppStore } from "@/store/app-store"

function ActiveView({ section }: { section: string }) {
  switch (section) {
    case "dashboard":   return <Dashboard />
    case "chat":        return <Chat />
    case "tasks":       return <Tasks />
    case "projects":    return <Projects />
    case "calendar":    return <CalendarView />
    case "timesheets":  return <Timesheets />
    case "meetings":    return <Meetings />
    case "analytics":   return <Analytics />
    case "knowledge":   return <KnowledgeBase />
    case "settings":    return <Settings />
    default:            return <Dashboard />
  }
}

// Sections that need full-height flex layout
const fullHeightSections = new Set(["chat", "calendar", "tasks", "meetings", "knowledge", "settings"])

export default function App() {
  const { activeSection, setCommandPaletteOpen, isAuthenticated, login, signup, loginWithGoogle, initAuth, sidebarOpen, setSidebarOpen } = useAppStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    initAuth()
    setMounted(true)
  }, [initAuth])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [setCommandPaletteOpen])

  // Don't render until mounted to avoid hydration mismatch with localStorage
  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          <span className="text-neutral-400 text-sm">Loading Nexus AI…</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Login onLogin={login} onSignup={signup} onGoogleLogin={loginWithGoogle} />
  }

  const isFull = fullHeightSections.has(activeSection)

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 lg:relative lg:z-auto
        transform transition-transform duration-200 ease-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <Sidebar />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <TopNav />

        <main className={`flex-1 overflow-auto ${isFull ? "flex flex-col" : ""}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className={isFull ? "flex flex-col h-full" : ""}
            >
              <ActiveView section={activeSection} />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <CommandPalette />
    </div>
  )
}
