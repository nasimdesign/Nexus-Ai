export type Priority = "urgent" | "high" | "medium" | "low"
export type TaskStatus = "todo" | "in_progress" | "in_review" | "done" | "cancelled"
export type ProjectStatus = "active" | "on_hold" | "completed" | "archived"

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: Priority
  project?: string
  projectId?: string
  assignee?: string
  dueDate?: string
  estimatedHours?: number
  loggedHours?: number
  tags?: string[]
  subtasks?: SubTask[]
  createdAt: string
  updatedAt: string
}

export interface SubTask {
  id: string
  title: string
  completed: boolean
}

export interface Project {
  id: string
  name: string
  client?: string
  status: ProjectStatus
  progress: number
  color: string
  tasksTotal: number
  tasksDone: number
  hoursLogged: number
  hoursBudget?: number
  dueDate?: string
  members?: string[]
  description?: string
}

export interface TimesheetEntry {
  id: string
  date: string
  project: string
  projectId: string
  activity: string
  description: string
  hours: number
  billable: boolean
  approved: boolean
}

export interface Meeting {
  id: string
  title: string
  date: string
  startTime: string
  endTime: string
  attendees: string[]
  notes?: string
  actionItems?: ActionItem[]
  summary?: string
  platform?: "zoom" | "teams" | "meet" | "in_person"
}

export interface ActionItem {
  id: string
  title: string
  assignee?: string
  dueDate?: string
  completed: boolean
}

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
  isStreaming?: boolean
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: string
  updatedAt: string
  pinned?: boolean
}

export interface Notification {
  id: string
  type: "reminder" | "task" | "meeting" | "ai" | "system"
  title: string
  body: string
  timestamp: string
  read: boolean
  actionUrl?: string
}

export interface DailyPlan {
  date: string
  tasks: Task[]
  meetings: Meeting[]
  focusHours: number
  productivityScore: number
  aiSuggestions: string[]
}
