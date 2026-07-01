"use client"

import { motion } from "framer-motion"
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Target, Clock, Zap } from "lucide-react"

const weeklyHours = [
  { day: "Mon", hours: 6.5 },
  { day: "Tue", hours: 7.0 },
  { day: "Wed", hours: 5.5 },
  { day: "Thu", hours: 7.5 },
  { day: "Fri", hours: 6.0 },
  { day: "Sat", hours: 6.0 },
  { day: "Sun", hours: 5.5 },
]

const monthlyTrend = [
  { week: "W1", hours: 34, tasks: 8 },
  { week: "W2", hours: 38, tasks: 11 },
  { week: "W3", hours: 32, tasks: 7 },
  { week: "W4", hours: 44, tasks: 14 },
]

const projectBreakdown = [
  { name: "dxPOS v3", hours: 28, color: "#9700ce" },
  { name: "Nexus AI", hours: 12, color: "#b133ff" },
  { name: "HR Module", hours: 8, color: "#0EA5E9" },
]

const productiveHours = [
  { hour: "6am", score: 2 }, { hour: "7am", score: 3 }, { hour: "8am", score: 5 },
  { hour: "9am", score: 9 }, { hour: "10am", score: 10 }, { hour: "11am", score: 9 },
  { hour: "12pm", score: 6 }, { hour: "1pm", score: 4 }, { hour: "2pm", score: 7 },
  { hour: "3pm", score: 8 }, { hour: "4pm", score: 7 }, { hour: "5pm", score: 5 },
  { hour: "6pm", score: 3 },
]

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

export function Analytics() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="p-6 max-w-6xl space-y-5"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Analytics</h2>
          <p className="text-sm text-neutral-500">June 2026 · Personal productivity</p>
        </div>
      </div>

      {/* KPI Row */}
      <motion.div variants={item} className="grid grid-cols-4 gap-4">
        {[
          { label: "Productive hours", value: "44h", trend: "+12%", icon: Clock, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Tasks completed", value: "31", trend: "+8%", icon: Target, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Productivity score", value: "82%", trend: "+5%", icon: TrendingUp, color: "text-violet-600", bg: "bg-violet-50" },
          { label: "Focus sessions", value: "18", trend: "+22%", icon: Zap, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.label}>
              <CardContent className="p-4">
                <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${kpi.bg} mb-3`}>
                  <Icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
                <p className="text-2xl font-bold text-neutral-900">{kpi.value}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{kpi.label}</p>
                <p className="text-xs text-emerald-600 font-medium mt-1">{kpi.trend} vs last month</p>
              </CardContent>
            </Card>
          )
        })}
      </motion.div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-3 gap-4">
        <motion.div variants={item} className="col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Daily Hours This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={weeklyHours}>
                  <defs>
                    <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9700ce" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#9700ce" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                    formatter={(v) => [`${v}h`, "Hours"]}
                  />
                  <Area type="monotone" dataKey="hours" stroke="#9700ce" strokeWidth={2} fill="url(#hoursGrad)" dot={{ fill: "#9700ce", r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle>By Project</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center mb-2">
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie
                      data={projectBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={64}
                      dataKey="hours"
                      strokeWidth={2}
                      stroke="white"
                    >
                      {projectBreakdown.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {projectBreakdown.map((p) => (
                  <div key={p.name} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                    <span className="text-xs text-neutral-600 flex-1">{p.name}</span>
                    <span className="text-xs font-semibold text-neutral-800">{p.hours}h</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle>Monthly Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={monthlyTrend} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
                  <Bar dataKey="hours" name="Hours" fill="#9700ce" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="tasks" name="Tasks" fill="#a5b4fc" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle>Peak Productivity Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={productiveHours}>
                  <defs>
                    <linearGradient id="prodGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#b133ff" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#b133ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} formatter={(v) => [v, "Score"]} />
                  <Area type="monotone" dataKey="score" stroke="#b133ff" strokeWidth={2} fill="url(#prodGrad)" />
                </AreaChart>
              </ResponsiveContainer>
              <p className="text-xs text-neutral-500 mt-2 text-center">
                Your peak is <span className="font-semibold text-violet-600">9 AM – 11 AM</span> · Schedule deep work then.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
