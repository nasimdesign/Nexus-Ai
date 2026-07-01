"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search, Plus, BookOpen, FileText, Folder, Star, Clock,
  Tag, ChevronRight, ExternalLink, Sparkles, Hash,
  MoreHorizontal, Pin,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

type KBCategory = "all" | "projects" | "meetings" | "docs" | "references" | "personal"

interface KBItem {
  id: string
  title: string
  category: KBCategory
  tags: string[]
  preview: string
  content: string
  pinned?: boolean
  lastViewed: string
  createdAt: string
  aiGenerated?: boolean
}

const mockKBItems: KBItem[] = [
  {
    id: "k1",
    title: "ERPNext Integration Architecture",
    category: "projects",
    tags: ["ERPNext", "API", "architecture"],
    preview: "Overview of the Nexus AI ↔ ERPNext integration layer, API endpoints, and data flows.",
    content: `# ERPNext Integration Architecture\n\n## Overview\nNexus AI connects to ERPNext via the REST API using token-based authentication.\n\n## Key Endpoints\n- /api/method/frappe.client.get — fetch single document\n- /api/method/frappe.client.get_list — list documents\n- /api/method/frappe.client.insert — create document\n\n## Data Flows\n1. Timesheet: AI generates → user reviews → submits to ERPNext\n2. Tasks: Synced bidirectionally every 5 minutes\n3. Projects: Read-only sync from ERPNext`,
    pinned: true,
    lastViewed: "2026-06-29",
    createdAt: "2026-06-20",
    aiGenerated: false,
  },
  {
    id: "k2",
    title: "dxPOS v3 — Design System Notes",
    category: "projects",
    tags: ["design", "dxPOS", "components"],
    preview: "Component library decisions, color tokens, and typography scale for the dxPOS redesign.",
    content: `# dxPOS v3 Design System\n\n## Color Palette\n- Primary: #9700ce (Indigo)\n- Success: #10B981\n- Warning: #F59E0B\n- Error: #EF4444\n\n## Typography\n- Headings: SF Pro Display / Inter\n- Body: Inter Regular 14px/1.6\n\n## Components\n- Button: 4 variants (primary, outline, ghost, destructive)\n- Input: floating label style\n- Card: subtle shadow, 12px radius`,
    pinned: false,
    lastViewed: "2026-06-28",
    createdAt: "2026-06-15",
    aiGenerated: false,
  },
  {
    id: "k3",
    title: "Sprint 7 Meeting Notes",
    category: "meetings",
    tags: ["sprint", "dxPOS", "planning"],
    preview: "Notes from the June 27 sprint planning session. Defined scope for the checkout flow redesign.",
    content: `# Sprint 7 Planning Notes\n\n**Date:** June 27, 2026\n**Attendees:** Nasim, Ahmed, Sara, Client\n\n## Sprint Goals\n1. Complete checkout flow hi-fi screens\n2. Fix all Level A accessibility issues\n3. Deliver client demo for mobile features\n\n## Decisions\n- Mobile-first approach for checkout\n- Skip dark mode for v3 scope\n- Client review scheduled for July 1`,
    pinned: false,
    lastViewed: "2026-06-27",
    createdAt: "2026-06-27",
    aiGenerated: true,
  },
  {
    id: "k4",
    title: "WCAG 2.1 Compliance Checklist",
    category: "references",
    tags: ["accessibility", "WCAG", "checklist"],
    preview: "Complete WCAG 2.1 AA compliance checklist customized for dxPOS UI components.",
    content: `# WCAG 2.1 Compliance Checklist\n\n## Level A\n- [ ] 1.1.1 Non-text Content\n- [x] 1.3.1 Info and Relationships\n- [x] 2.1.1 Keyboard navigation\n- [ ] 4.1.2 Name, Role, Value\n\n## Level AA\n- [ ] 1.4.3 Contrast (minimum 4.5:1)\n- [ ] 1.4.4 Resize text\n- [ ] 2.4.7 Focus visible`,
    pinned: false,
    lastViewed: "2026-06-30",
    createdAt: "2026-06-10",
    aiGenerated: false,
  },
  {
    id: "k5",
    title: "AI Agent Architecture — Nexus AI",
    category: "projects",
    tags: ["AI", "agents", "architecture"],
    preview: "Multi-agent system design: Planner, Task, Timesheet, ERP, Memory, and Coordinator agents.",
    content: `# Nexus AI Agent Architecture\n\n## Agents\n\n### Coordinator Agent\nOrchestrates all agents, routes requests, manages context\n\n### Planner Agent\nGenerates daily plans, prioritizes tasks, estimates effort\n\n### Task Agent\nCRUD operations on tasks, detects duplicates, suggests priorities\n\n### Timesheet Agent\nGenerates timesheets from conversations, calendar, commits\n\n### Memory Agent\nLong-term context: projects, clients, preferences, style\n\n### ERP Agent\nERPNext API integration, CRUD on all ERPNext doctypes`,
    pinned: true,
    lastViewed: "2026-06-29",
    createdAt: "2026-06-22",
    aiGenerated: false,
  },
  {
    id: "k6",
    title: "Client — DXBitz Profile",
    category: "personal",
    tags: ["client", "DXBitz"],
    preview: "Key contacts, preferences, communication style, and project history for DXBitz.",
    content: `# DXBitz Client Profile\n\n## Key Contacts\n- Ahmed Al-Rashid — CTO\n- Sara Khalil — Product Manager\n\n## Communication Style\n- Prefers Slack for quick updates\n- Weekly status emails every Monday\n- Demo calls every 2 weeks\n\n## Preferences\n- Figma for design reviews\n- Detailed spec docs before development\n- Mobile-first designs`,
    pinned: false,
    lastViewed: "2026-06-25",
    createdAt: "2026-05-01",
    aiGenerated: false,
  },
  {
    id: "k7",
    title: "My Work Style & Preferences",
    category: "personal",
    tags: ["personal", "productivity", "preferences"],
    preview: "AI-generated profile of my working patterns, peak hours, preferred tools, and communication style.",
    content: `# Work Style Profile\n**AI-generated from 30 days of usage**\n\n## Peak Hours\n- Most productive: 9 AM – 12 PM\n- Creative work: Morning\n- Meetings: 2 PM – 4 PM\n\n## Tool Preferences\n- Design: Figma\n- Notes: Notion\n- Communication: Slack\n- Code: VS Code\n\n## Work Patterns\n- Average 6.5h/day logged\n- 78% task completion rate\n- Prefers solo deep work over meetings`,
    pinned: false,
    lastViewed: "2026-06-28",
    createdAt: "2026-06-01",
    aiGenerated: true,
  },
]

const categoryConfig: Record<KBCategory, { label: string; color: string; bg: string }> = {
  all: { label: "All", color: "text-neutral-600", bg: "bg-neutral-100" },
  projects: { label: "Projects", color: "text-indigo-600", bg: "bg-indigo-50" },
  meetings: { label: "Meetings", color: "text-blue-600", bg: "bg-blue-50" },
  docs: { label: "Documents", color: "text-emerald-600", bg: "bg-emerald-50" },
  references: { label: "References", color: "text-amber-600", bg: "bg-amber-50" },
  personal: { label: "Personal", color: "text-violet-600", bg: "bg-violet-50" },
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }

export function KnowledgeBase() {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<KBCategory>("all")
  const [selectedId, setSelectedId] = useState<string | null>("k1")
  const [aiQuery, setAiQuery] = useState("")
  const [aiAnswer, setAiAnswer] = useState("")
  const [aiLoading, setAiLoading] = useState(false)

  const filtered = mockKBItems.filter((k) => {
    const matchCat = category === "all" || k.category === category
    const matchSearch =
      k.title.toLowerCase().includes(search.toLowerCase()) ||
      k.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())) ||
      k.preview.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const pinned = filtered.filter((k) => k.pinned)
  const rest = filtered.filter((k) => !k.pinned)
  const selected = mockKBItems.find((k) => k.id === selectedId)

  const handleAISearch = async () => {
    if (!aiQuery.trim()) return
    setAiLoading(true)
    setAiAnswer("")
    await new Promise((r) => setTimeout(r, 1200))
    setAiLoading(false)
    setAiAnswer(
      `Based on your knowledge base, here's what I found about "${aiQuery}":\n\n` +
      `The ERPNext integration uses token-based authentication and communicates via the REST API. ` +
      `The main endpoints for your Nexus AI integration are /api/method/frappe.client.get, ` +
      `/api/method/frappe.client.get_list, and /api/method/frappe.client.insert.\n\n` +
      `Relevant documents: **ERPNext Integration Architecture**, **AI Agent Architecture — Nexus AI**`
    )
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="flex w-72 shrink-0 flex-col border-r border-neutral-100 bg-white overflow-hidden"
      >
        {/* Search */}
        <motion.div variants={item} className="p-4 border-b border-neutral-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-neutral-900">Knowledge Base</h2>
            <Button size="sm" className="gap-1 h-7 text-xs">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search knowledge…"
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 pl-8 pr-3 py-2 text-xs placeholder:text-neutral-400 focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100"
            />
          </div>
        </motion.div>

        {/* AI Search */}
        <motion.div variants={item} className="px-4 py-3 border-b border-neutral-100 bg-indigo-50/50">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            <span className="text-xs font-medium text-indigo-700">Ask AI about your docs</span>
          </div>
          <div className="flex gap-2">
            <input
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAISearch()}
              placeholder="What is the ERPNext API structure?"
              className="flex-1 rounded-lg border border-indigo-200 bg-white px-2.5 py-1.5 text-xs placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-indigo-300"
            />
            <button
              onClick={handleAISearch}
              disabled={aiLoading}
              className="rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {aiLoading ? "…" : "Ask"}
            </button>
          </div>
          <AnimatePresence>
            {aiAnswer && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-2 rounded-lg bg-white border border-indigo-100 p-2.5"
              >
                <p className="text-[10px] text-indigo-700 leading-relaxed">{aiAnswer}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Categories */}
        <motion.div variants={item} className="px-4 py-3 border-b border-neutral-100">
          <p className="text-[10px] text-neutral-400 uppercase tracking-widest mb-2">Categories</p>
          <div className="space-y-0.5">
            {(Object.entries(categoryConfig) as [KBCategory, typeof categoryConfig[KBCategory]][]).map(([key, cfg]) => {
              const count = key === "all" ? mockKBItems.length : mockKBItems.filter((k) => k.category === key).length
              return (
                <button
                  key={key}
                  onClick={() => setCategory(key)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                    category === key ? "bg-neutral-100 text-neutral-800 font-medium" : "text-neutral-500 hover:bg-neutral-50"
                  }`}
                >
                  <Folder className="h-3.5 w-3.5 shrink-0" />
                  <span className="flex-1 text-left">{cfg.label}</span>
                  <span className="text-[10px] text-neutral-400">{count}</span>
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto p-2">
          {pinned.length > 0 && (
            <div className="mb-2">
              <p className="px-2 py-1 text-[10px] text-neutral-400 uppercase tracking-widest">Pinned</p>
              {pinned.map((k) => (
                <KBListItem key={k.id} item={k} isSelected={selectedId === k.id} onSelect={() => setSelectedId(k.id)} />
              ))}
            </div>
          )}
          {rest.length > 0 && (
            <div>
              {pinned.length > 0 && <p className="px-2 py-1 text-[10px] text-neutral-400 uppercase tracking-widest">All</p>}
              {rest.map((k) => (
                <KBListItem key={k.id} item={k} isSelected={selectedId === k.id} onSelect={() => setSelectedId(k.id)} />
              ))}
            </div>
          )}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <BookOpen className="h-8 w-8 text-neutral-300" />
              <p className="text-xs text-neutral-400">No items found</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Content Panel */}
      <div className="flex-1 overflow-y-auto">
        {selected ? (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-8 max-w-3xl"
          >
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${categoryConfig[selected.category].bg} ${categoryConfig[selected.category].color}`}>
                  {categoryConfig[selected.category].label}
                </span>
                {selected.aiGenerated && (
                  <span className="flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600">
                    <Sparkles className="h-2.5 w-2.5" /> AI Generated
                  </span>
                )}
                {selected.pinned && <Pin className="h-3.5 w-3.5 text-amber-500" />}
              </div>
              <h1 className="text-2xl font-semibold text-neutral-900 mb-2">{selected.title}</h1>
              <div className="flex items-center gap-4 text-xs text-neutral-400">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last viewed {selected.lastViewed}
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Created {selected.createdAt}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {selected.tags.map((tag) => (
                  <span key={tag} className="flex items-center gap-1 rounded-full border border-neutral-200 px-2 py-0.5 text-[10px] text-neutral-500">
                    <Hash className="h-2.5 w-2.5" /> {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="prose prose-sm max-w-none">
              {selected.content.split("\n").map((line, i) => {
                if (line.startsWith("# ")) return <h1 key={i} className="text-xl font-bold text-neutral-900 mt-6 mb-3">{line.slice(2)}</h1>
                if (line.startsWith("## ")) return <h2 key={i} className="text-base font-semibold text-neutral-800 mt-5 mb-2">{line.slice(3)}</h2>
                if (line.startsWith("### ")) return <h3 key={i} className="text-sm font-semibold text-neutral-700 mt-4 mb-1.5">{line.slice(4)}</h3>
                if (line.startsWith("- [x] ")) return (
                  <div key={i} className="flex items-center gap-2 py-0.5">
                    <span className="text-emerald-500 text-xs">✓</span>
                    <span className="text-sm text-neutral-600 line-through">{line.slice(6)}</span>
                  </div>
                )
                if (line.startsWith("- [ ] ")) return (
                  <div key={i} className="flex items-center gap-2 py-0.5">
                    <span className="text-neutral-300 text-xs">○</span>
                    <span className="text-sm text-neutral-800">{line.slice(6)}</span>
                  </div>
                )
                if (line.startsWith("- ")) return <p key={i} className="text-sm text-neutral-700 py-0.5 pl-3 before:content-['·'] before:mr-2 before:text-neutral-400">{line.slice(2)}</p>
                if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="text-sm font-semibold text-neutral-800 mt-2">{line.slice(2, -2)}</p>
                if (line === "") return <div key={i} className="h-2" />
                return <p key={i} className="text-sm text-neutral-700 leading-relaxed">{line}</p>
              })}
            </div>
          </motion.div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <BookOpen className="h-10 w-10 text-neutral-200 mx-auto mb-3" />
              <p className="text-sm text-neutral-400">Select an item to read</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function KBListItem({ item, isSelected, onSelect }: { item: KBItem; isSelected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={`flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all mb-0.5 ${
        isSelected ? "bg-indigo-50 border border-indigo-100" : "hover:bg-neutral-50 border border-transparent"
      }`}
    >
      <FileText className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${isSelected ? "text-indigo-500" : "text-neutral-400"}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium truncate ${isSelected ? "text-indigo-700" : "text-neutral-800"}`}>
          {item.title}
        </p>
        <p className="text-[10px] text-neutral-400 mt-0.5 line-clamp-1">{item.preview}</p>
      </div>
    </button>
  )
}
