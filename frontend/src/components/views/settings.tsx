"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  User, Zap, Link2, Bell, Shield, Palette, Keyboard,
  ChevronRight, Check, ToggleLeft, ToggleRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useAppStore } from "@/store/app-store"

type SettingsTab = "profile" | "ai" | "integrations" | "notifications" | "appearance" | "shortcuts"

const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "ai", label: "AI & Models", icon: Zap },
  { id: "integrations", label: "Integrations", icon: Link2 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "shortcuts", label: "Shortcuts", icon: Keyboard },
]

const Toggle = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
  <button
    onClick={onToggle}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
      enabled ? "bg-primary" : "bg-neutral-200"
    }`}
  >
    <span
      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
        enabled ? "translate-x-5" : "translate-x-0.5"
      }`}
    />
  </button>
)

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }

export function Settings() {
  const { aiModel, setAiModel } = useAppStore()
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile")
  const [saved, setSaved] = useState(false)
  const [prefs, setPrefs] = useState({
    aiStreaming: true,
    aiAutoSuggest: true,
    timesheetReminder: true,
    standupReminder: true,
    taskDeadlineAlert: true,
    meetingAlert: true,
    focusMode: false,
    compactView: false,
    language: "en",
    timezone: "Asia/Dubai",
  })

  const toggle = (key: keyof typeof prefs) =>
    setPrefs((p) => ({ ...p, [key]: !p[key] }))

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <aside className="w-52 shrink-0 border-r border-neutral-100 bg-white p-4">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">Settings</p>
        <nav className="space-y-0.5">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SettingsTab)}
                className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                }`}
              >
                <Icon className={`h-4 w-4 ${activeTab === tab.id ? "text-indigo-500" : "text-neutral-400"}`} />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <motion.div key={activeTab} variants={container} initial="hidden" animate="show" className="max-w-2xl space-y-6">

          {activeTab === "profile" && (
            <>
              <motion.div variants={item}>
                <h2 className="text-lg font-semibold text-neutral-900">Profile</h2>
                <p className="text-sm text-neutral-500">Your personal information and work identity</p>
              </motion.div>
              <motion.div variants={item}>
                <Card>
                  <CardContent className="p-6 space-y-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-2xl font-bold text-white">N</div>
                      <div>
                        <p className="text-sm font-semibold text-neutral-800">Nasim</p>
                        <p className="text-xs text-neutral-500">nasim@dxbitz.com</p>
                        <button className="mt-1.5 text-xs text-indigo-600 hover:text-indigo-700">Change avatar</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: "Full name", value: "Nasim" },
                        { label: "Role", value: "Product Designer" },
                        { label: "Company", value: "DXBitz" },
                        { label: "Email", value: "nasim@dxbitz.com" },
                      ].map((f) => (
                        <div key={f.label}>
                          <label className="block text-xs font-medium text-neutral-500 mb-1">{f.label}</label>
                          <input
                            defaultValue={f.value}
                            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-800 focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100"
                          />
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-500 mb-1">Timezone</label>
                      <select
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-800 focus:outline-none"
                        defaultValue="Asia/Dubai"
                      >
                        <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">America/New_York</option>
                      </select>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}

          {activeTab === "ai" && (
            <>
              <motion.div variants={item}>
                <h2 className="text-lg font-semibold text-neutral-900">AI & Models</h2>
                <p className="text-sm text-neutral-500">Configure AI behaviour, model selection, and memory</p>
              </motion.div>
              <motion.div variants={item}>
                <Card>
                  <CardHeader><CardTitle>Model Selection</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { id: "nousresearch/hermes-3-llama-3.1-405b", name: "Hermes 3 (Llama 3.1)", badge: "Default", desc: "Best open-source reasoning model by NousResearch" },
                      { id: "claude-3-5-sonnet-20240620", name: "Claude 3.5 Sonnet", badge: "", desc: "Excellent for coding and long context" },
                      { id: "gpt-4o", name: "GPT-4o", badge: "", desc: "Fast and intelligent multimodal model" },
                    ].map((m) => (
                      <div
                        key={m.id}
                        onClick={() => setAiModel(m.id)}
                        className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-all ${
                          aiModel === m.id ? "border-primary bg-primary/5" : "border-neutral-100 hover:border-neutral-200"
                        }`}
                      >
                        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${aiModel === m.id ? "bg-primary" : "bg-neutral-100"}`}>
                          <Zap className={`h-4 w-4 ${aiModel === m.id ? "text-white" : "text-neutral-400"}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-neutral-800">{m.name}</p>
                            {m.badge && <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-0">{m.badge}</Badge>}
                          </div>
                          <p className="text-xs text-neutral-500">{m.desc}</p>
                        </div>
                        {aiModel === m.id && <Check className="h-4 w-4 text-primary" />}
                      </div>
                    ))}
                    
                    <div className="pt-4 border-t border-neutral-100 mt-2">
                      <div className="flex flex-col gap-2">
                        <p className="text-xs text-neutral-500 mb-1">
                          API Key is securely managed in the server configuration.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div variants={item}>
                <Card>
                  <CardHeader><CardTitle>AI Behaviour</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { key: "aiStreaming" as const, label: "Streaming responses", desc: "Show AI responses as they're generated" },
                      { key: "aiAutoSuggest" as const, label: "Auto-suggestions", desc: "Show contextual prompts based on current work" },
                    ].map((opt) => (
                      <div key={opt.key} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-neutral-800">{opt.label}</p>
                          <p className="text-xs text-neutral-500">{opt.desc}</p>
                        </div>
                        <Toggle enabled={prefs[opt.key] as boolean} onToggle={() => toggle(opt.key)} />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}

          {activeTab === "integrations" && (
            <>
              <motion.div variants={item}>
                <h2 className="text-lg font-semibold text-neutral-900">Integrations</h2>
                <p className="text-sm text-neutral-500">Connect Nexus AI to your tools and services</p>
              </motion.div>
              <motion.div variants={item} className="space-y-3">
                {[
                  { name: "ERPNext", desc: "Connect to your ERPNext instance for tasks, timesheets, and projects", connected: false, color: "bg-blue-600", badge: "Coming Soon" },
                  { name: "Slack", desc: "Send stand-up updates and notifications to Slack channels", connected: false, color: "bg-purple-600", badge: "" },
                  { name: "Google Calendar", desc: "Sync meetings and schedule time blocks automatically", connected: false, color: "bg-green-600", badge: "" },
                  { name: "GitHub", desc: "Import commits and PRs as timesheet context", connected: false, color: "bg-neutral-900", badge: "" },
                  { name: "Figma", desc: "Track design work and link to design files", connected: false, color: "bg-rose-500", badge: "" },
                ].map((int) => (
                  <Card key={int.name}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${int.color}`}>
                        <Link2 className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-neutral-800">{int.name}</p>
                          {int.badge && <Badge className="text-[10px] bg-amber-100 text-amber-700 border-0">{int.badge}</Badge>}
                        </div>
                        <p className="text-xs text-neutral-500">{int.desc}</p>
                      </div>
                      <Button
                        variant={int.connected ? "outline" : "default"}
                        size="sm"
                        className="text-xs shrink-0"
                        disabled={!!int.badge}
                      >
                        {int.connected ? "Disconnect" : "Connect"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </motion.div>
            </>
          )}

          {activeTab === "notifications" && (
            <>
              <motion.div variants={item}>
                <h2 className="text-lg font-semibold text-neutral-900">Notifications</h2>
                <p className="text-sm text-neutral-500">Control when and how Nexus AI notifies you</p>
              </motion.div>
              <motion.div variants={item}>
                <Card>
                  <CardContent className="p-6 space-y-5">
                    {[
                      { key: "timesheetReminder" as const, label: "Timesheet reminder", desc: "Daily reminder to log your hours at 6:00 PM" },
                      { key: "standupReminder" as const, label: "Stand-up reminder", desc: "Morning reminder to generate your stand-up at 9:00 AM" },
                      { key: "taskDeadlineAlert" as const, label: "Task deadline alerts", desc: "Get notified 24h before task deadlines" },
                      { key: "meetingAlert" as const, label: "Meeting alerts", desc: "15-minute reminder before scheduled meetings" },
                    ].map((n) => (
                      <div key={n.key} className="flex items-center justify-between py-1">
                        <div>
                          <p className="text-sm font-medium text-neutral-800">{n.label}</p>
                          <p className="text-xs text-neutral-500">{n.desc}</p>
                        </div>
                        <Toggle enabled={prefs[n.key] as boolean} onToggle={() => toggle(n.key)} />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}

          {activeTab === "appearance" && (
            <>
              <motion.div variants={item}>
                <h2 className="text-lg font-semibold text-neutral-900">Appearance</h2>
                <p className="text-sm text-neutral-500">Customize how Nexus AI looks and feels</p>
              </motion.div>
              <motion.div variants={item}>
                <Card>
                  <CardContent className="p-6 space-y-5">
                    <div>
                      <p className="text-sm font-medium text-neutral-800 mb-3">Theme</p>
                      <div className="flex gap-3">
                        {[
                          { id: "light", label: "Light", bg: "bg-white border-neutral-200" },
                          { id: "dark", label: "Dark", bg: "bg-neutral-900 border-neutral-700" },
                          { id: "system", label: "System", bg: "bg-gradient-to-r from-white to-neutral-900 border-neutral-200" },
                        ].map((t) => (
                          <button
                            key={t.id}
                            className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all ${
                              t.id === "light" ? "border-indigo-400" : "border-transparent hover:border-neutral-200"
                            }`}
                          >
                            <div className={`h-12 w-20 rounded-lg border ${t.bg}`} />
                            <span className="text-xs text-neutral-600">{t.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-neutral-800">Compact view</p>
                        <p className="text-xs text-neutral-500">Reduce spacing for more information density</p>
                      </div>
                      <Toggle enabled={prefs.compactView} onToggle={() => toggle("compactView")} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-neutral-800">Focus mode</p>
                        <p className="text-xs text-neutral-500">Hide sidebar and distracting UI during deep work</p>
                      </div>
                      <Toggle enabled={prefs.focusMode} onToggle={() => toggle("focusMode")} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}

          {activeTab === "shortcuts" && (
            <>
              <motion.div variants={item}>
                <h2 className="text-lg font-semibold text-neutral-900">Keyboard Shortcuts</h2>
                <p className="text-sm text-neutral-500">Speed up your workflow with keyboard commands</p>
              </motion.div>
              <motion.div variants={item}>
                <Card>
                  <CardContent className="p-0 divide-y divide-neutral-100">
                    {[
                      { action: "Open command palette", shortcut: "⌘ K" },
                      { action: "New task", shortcut: "⌘ T" },
                      { action: "New AI chat", shortcut: "⌘ J" },
                      { action: "Go to dashboard", shortcut: "⌘ 1" },
                      { action: "Go to tasks", shortcut: "⌘ 2" },
                      { action: "Go to chat", shortcut: "⌘ 3" },
                      { action: "Go to timesheets", shortcut: "⌘ 4" },
                      { action: "Search", shortcut: "⌘ /" },
                      { action: "Toggle sidebar", shortcut: "⌘ \\" },
                    ].map((s) => (
                      <div key={s.action} className="flex items-center justify-between px-5 py-3">
                        <span className="text-sm text-neutral-700">{s.action}</span>
                        <div className="flex gap-1">
                          {s.shortcut.split(" ").map((k, i) => (
                            <kbd key={i} className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs font-medium text-neutral-600">
                              {k}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}

          {/* Save button */}
          {activeTab !== "shortcuts" && (
            <motion.div variants={item} className="flex justify-end pt-2">
              <Button onClick={handleSave} className="gap-2 min-w-[100px]">
                {saved ? <><Check className="h-4 w-4" /> Saved!</> : "Save changes"}
              </Button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
