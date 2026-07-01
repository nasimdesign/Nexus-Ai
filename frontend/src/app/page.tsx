"use client"

import { useEffect } from "react"
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
  const { activeSection, setCommandPaletteOpen } = useAppStore()

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

  const isFull = fullHeightSections.has(activeSection)

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAFAFA]">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
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
