"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard, MessageSquare, CheckSquare, FolderKanban,
  Calendar, Clock, Users, BarChart3, BookOpen, Settings,
  Zap, ChevronRight, ChevronLeft, PanelLeftClose, PanelLeftOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/store/app-store"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const navItems = [
  { id: "dashboard",  label: "Dashboard",      icon: LayoutDashboard },
  { id: "chat",       label: "AI Chat",         icon: MessageSquare },
  { id: "tasks",      label: "Tasks",           icon: CheckSquare },
  { id: "projects",   label: "Projects",        icon: FolderKanban },
  { id: "calendar",   label: "Calendar",        icon: Calendar },
  { id: "timesheets", label: "Timesheets",      icon: Clock },
  { id: "meetings",   label: "Meetings",        icon: Users },
  { id: "analytics",  label: "Analytics",       icon: BarChart3 },
  { id: "knowledge",  label: "Knowledge Base",  icon: BookOpen },
]

const bottomItems = [
  { id: "settings", label: "Settings", icon: Settings },
]

export function Sidebar() {
  const { activeSection, setActiveSection } = useAppStore()
  const [collapsed, setCollapsed] = useState(false)

  const renderNavItem = (item: typeof navItems[0]) => {
    const Icon = item.icon
    const isActive = activeSection === item.id
    return (
      <button
        key={item.id}
        onClick={() => setActiveSection(item.id)}
        title={collapsed ? item.label : undefined}
        className={cn(
          "group relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-100",
          collapsed ? "justify-center px-2" : "",
          isActive
            ? "bg-indigo-50 text-indigo-700 font-medium"
            : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800"
        )}
      >
        {isActive && (
          <motion.div
            layoutId="nav-indicator"
            className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-indigo-600"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
        <Icon
          className={cn(
            "h-4 w-4 shrink-0 transition-colors",
            isActive ? "text-indigo-600" : "text-neutral-400 group-hover:text-neutral-600"
          )}
        />
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
              className="truncate overflow-hidden whitespace-nowrap"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
        {item.id === "chat" && !collapsed && (
          <span className="ml-auto flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white shrink-0">
            2
          </span>
        )}
      </button>
    )
  }

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-neutral-100 bg-white transition-all duration-200",
        collapsed ? "w-14" : "w-56"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex h-14 items-center border-b border-neutral-100",
        collapsed ? "justify-center px-2" : "gap-2.5 px-4"
      )}>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600">
          <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2 overflow-hidden"
            >
              <span className="text-sm font-semibold text-neutral-900 tracking-tight whitespace-nowrap">Nexus AI</span>
              <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600 shrink-0">BETA</span>
            </motion.div>
          )}
        </AnimatePresence>
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="ml-auto rounded-md p-1 hover:bg-neutral-100 transition-colors"
          >
            <PanelLeftClose className="h-3.5 w-3.5 text-neutral-400" />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="mx-auto mt-2 mb-1 rounded-md p-1.5 hover:bg-neutral-100 transition-colors"
        >
          <PanelLeftOpen className="h-3.5 w-3.5 text-neutral-400" />
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {navItems.map(renderNavItem)}
      </nav>

      {/* AI Status indicator */}
      <div className="border-t border-neutral-100 p-2">
        {collapsed ? (
          <div className="flex justify-center py-1.5">
            <div className="relative h-2 w-2">
              <div className="absolute inset-0 rounded-full bg-emerald-500" />
              <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-60" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2">
            <div className="relative h-2 w-2 shrink-0">
              <div className="absolute inset-0 rounded-full bg-emerald-500" />
              <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-60" />
            </div>
            <span className="text-xs text-neutral-500 flex-1">AI Online</span>
            <ChevronRight className="h-3 w-3 text-neutral-400" />
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="border-t border-neutral-100 p-2 space-y-0.5">
        {bottomItems.map(renderNavItem)}
      </div>

      {/* User */}
      <div className="border-t border-neutral-100 p-2">
        <div className={cn(
          "flex items-center gap-2.5 rounded-lg hover:bg-neutral-50 cursor-pointer transition-colors",
          collapsed ? "justify-center p-1.5" : "px-2 py-1.5"
        )}>
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarFallback className="text-[11px] bg-indigo-100 text-indigo-700 font-bold">N</AvatarFallback>
          </Avatar>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="flex-1 min-w-0 overflow-hidden"
              >
                <p className="text-xs font-medium text-neutral-800 truncate whitespace-nowrap">Nasim</p>
                <p className="text-[10px] text-neutral-400 truncate whitespace-nowrap">nasim@dxbitz.com</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </aside>
  )
}
