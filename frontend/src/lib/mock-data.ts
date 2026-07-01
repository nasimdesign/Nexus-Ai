import type { Task, Project, TimesheetEntry, Meeting, Conversation, Notification } from "@/types"

export const mockTasks: Task[] = [
  {
    id: "t1",
    title: "Redesign the checkout flow for mobile",
    description: "Review existing UX issues, create wireframes, and deliver hi-fi screens.",
    status: "in_progress",
    priority: "urgent",
    project: "dxPOS v3",
    projectId: "p1",
    estimatedHours: 8,
    loggedHours: 3.5,
    dueDate: "2026-07-02",
    tags: ["design", "mobile", "UX"],
    subtasks: [
      { id: "s1", title: "Audit current flow", completed: true },
      { id: "s2", title: "Create wireframes", completed: true },
      { id: "s3", title: "Design hi-fi screens", completed: false },
      { id: "s4", title: "Handoff to dev", completed: false },
    ],
    createdAt: "2026-06-25T09:00:00Z",
    updatedAt: "2026-06-29T08:30:00Z",
  },
  {
    id: "t2",
    title: "Write ERPNext integration specification",
    description: "Document all API endpoints and data flows for the Nexus AI ↔ ERPNext bridge.",
    status: "todo",
    priority: "high",
    project: "Nexus AI",
    projectId: "p2",
    estimatedHours: 4,
    dueDate: "2026-07-05",
    tags: ["docs", "ERPNext", "API"],
    createdAt: "2026-06-28T10:00:00Z",
    updatedAt: "2026-06-28T10:00:00Z",
  },
  {
    id: "t3",
    title: "Prepare demo for client presentation",
    description: "Assemble slides, record walkthrough, prepare Q&A.",
    status: "todo",
    priority: "urgent",
    project: "dxPOS v3",
    projectId: "p1",
    estimatedHours: 3,
    dueDate: "2026-06-30",
    tags: ["presentation", "client"],
    createdAt: "2026-06-27T14:00:00Z",
    updatedAt: "2026-06-27T14:00:00Z",
  },
  {
    id: "t4",
    title: "Review accessibility audit results",
    description: "Go through the WCAG 2.1 audit and prioritize fixes.",
    status: "in_review",
    priority: "medium",
    project: "dxPOS v3",
    projectId: "p1",
    estimatedHours: 2,
    loggedHours: 2,
    dueDate: "2026-07-01",
    tags: ["accessibility", "audit"],
    createdAt: "2026-06-24T11:00:00Z",
    updatedAt: "2026-06-29T07:00:00Z",
  },
  {
    id: "t5",
    title: "Set up Nexus AI development environment",
    description: "Docker, PostgreSQL, Redis, FastAPI, Next.js local stack.",
    status: "done",
    priority: "high",
    project: "Nexus AI",
    projectId: "p2",
    estimatedHours: 3,
    loggedHours: 3.5,
    dueDate: "2026-06-29",
    tags: ["devops", "setup"],
    createdAt: "2026-06-26T09:00:00Z",
    updatedAt: "2026-06-29T09:00:00Z",
  },
  {
    id: "t6",
    title: "Design onboarding flow for new users",
    description: "End-to-end onboarding experience including tooltips, checklists, and empty states.",
    status: "todo",
    priority: "medium",
    project: "Nexus AI",
    projectId: "p2",
    estimatedHours: 6,
    dueDate: "2026-07-10",
    tags: ["design", "onboarding", "UX"],
    createdAt: "2026-06-29T08:00:00Z",
    updatedAt: "2026-06-29T08:00:00Z",
  },
  {
    id: "t7",
    title: "Monthly team performance report",
    description: "Compile June metrics, productivity scores, and highlight wins.",
    status: "todo",
    priority: "low",
    estimatedHours: 2,
    dueDate: "2026-07-07",
    tags: ["report", "monthly"],
    createdAt: "2026-06-29T09:00:00Z",
    updatedAt: "2026-06-29T09:00:00Z",
  },
]

export const mockProjects: Project[] = [
  {
    id: "p1",
    name: "dxPOS v3",
    client: "DXBitz",
    status: "active",
    progress: 62,
    color: "#9700ce",
    tasksTotal: 24,
    tasksDone: 15,
    hoursLogged: 87,
    hoursBudget: 160,
    dueDate: "2026-08-15",
    members: ["Nasim", "Ahmed", "Sara"],
    description: "Full redesign and feature enhancement of the dxPOS point-of-sale system.",
  },
  {
    id: "p2",
    name: "Nexus AI",
    client: "Internal",
    status: "active",
    progress: 18,
    color: "#b133ff",
    tasksTotal: 32,
    tasksDone: 6,
    hoursLogged: 22,
    hoursBudget: 300,
    dueDate: "2026-10-01",
    members: ["Nasim"],
    description: "Premium AI work assistant integrated with ERPNext.",
  },
  {
    id: "p3",
    name: "HR Module UI",
    client: "DXBitz",
    status: "on_hold",
    progress: 40,
    color: "#0EA5E9",
    tasksTotal: 18,
    tasksDone: 7,
    hoursLogged: 34,
    hoursBudget: 80,
    dueDate: "2026-09-01",
    members: ["Nasim", "Ahmed"],
    description: "UI redesign for the ERPNext HR module.",
  },
]

export const mockTimesheets: TimesheetEntry[] = [
  {
    id: "ts1",
    date: "2026-06-29",
    project: "dxPOS v3",
    projectId: "p1",
    activity: "Design",
    description: "Redesigning checkout flow — mobile wireframes and hi-fi screens.",
    hours: 3.5,
    billable: true,
    approved: false,
  },
  {
    id: "ts2",
    date: "2026-06-29",
    project: "Nexus AI",
    projectId: "p2",
    activity: "Development",
    description: "Setting up project scaffold, installing dependencies, writing type definitions.",
    hours: 2,
    billable: false,
    approved: false,
  },
  {
    id: "ts3",
    date: "2026-06-28",
    project: "dxPOS v3",
    projectId: "p1",
    activity: "Review",
    description: "Accessibility audit review — WCAG 2.1 compliance checks.",
    hours: 2,
    billable: true,
    approved: true,
  },
  {
    id: "ts4",
    date: "2026-06-28",
    project: "HR Module UI",
    projectId: "p3",
    activity: "Design",
    description: "Leave management calendar component design.",
    hours: 4,
    billable: true,
    approved: true,
  },
  {
    id: "ts5",
    date: "2026-06-27",
    project: "dxPOS v3",
    projectId: "p1",
    activity: "Meeting",
    description: "Sprint planning and client requirements review.",
    hours: 1.5,
    billable: true,
    approved: true,
  },
]

export const mockMeetings: Meeting[] = [
  {
    id: "m1",
    title: "Sprint Planning — dxPOS v3",
    date: "2026-06-30",
    startTime: "10:00",
    endTime: "11:00",
    attendees: ["Nasim", "Ahmed", "Sara", "Client"],
    platform: "zoom",
  },
  {
    id: "m2",
    title: "Nexus AI Architecture Review",
    date: "2026-06-29",
    startTime: "15:00",
    endTime: "15:30",
    attendees: ["Nasim"],
    platform: "in_person",
    notes: "Review agent architecture and decide on vector DB strategy.",
  },
  {
    id: "m3",
    title: "Client Demo — dxPOS Mobile",
    date: "2026-07-01",
    startTime: "14:00",
    endTime: "15:00",
    attendees: ["Nasim", "Ahmed", "Client"],
    platform: "meet",
  },
]

export const mockConversations: Conversation[] = [
  {
    id: "c1",
    title: "Today's work plan",
    pinned: true,
    messages: [
      {
        id: "msg1",
        role: "user",
        content: "What should I focus on today?",
        timestamp: "2026-06-29T08:00:00Z",
      },
      {
        id: "msg2",
        role: "assistant",
        content: `Good morning! Based on your tasks and upcoming deadlines, here's your focus plan for today:

## Today's Priority Stack

**🔴 Urgent (do first)**
1. **Prepare demo for client presentation** — Due tomorrow. Assemble slides, record the walkthrough. (~3h)

**🟠 High priority**
2. **Checkout flow hi-fi screens** — Continue where you left off. You've done wireframes, now move to Figma. (~2.5h)

**🟡 Medium**
3. **Accessibility audit review** — This is in review, quick 30-min check to unblock the team.

**📋 If time allows**
4. Write a few notes for the ERPNext integration spec.

---

**Total estimated:** ~6h of focused work
**Meetings today:** Architecture review at 3:00 PM (30 min)

You should have comfortable capacity. Want me to block time on your calendar?`,
        timestamp: "2026-06-29T08:00:05Z",
      },
    ],
    createdAt: "2026-06-29T08:00:00Z",
    updatedAt: "2026-06-29T08:00:05Z",
  },
  {
    id: "c2",
    title: "Generate timesheet",
    pinned: false,
    messages: [
      {
        id: "msg3",
        role: "user",
        content: "Create my timesheet for yesterday",
        timestamp: "2026-06-29T09:00:00Z",
      },
      {
        id: "msg4",
        role: "assistant",
        content: `Here's your timesheet for **Saturday, June 28, 2026**:

| Project | Activity | Description | Hours | Billable |
|---------|----------|-------------|-------|----------|
| dxPOS v3 | Review | WCAG 2.1 accessibility audit review | 2.0h | ✓ |
| HR Module UI | Design | Leave management calendar component | 4.0h | ✓ |
| Admin | Planning | Week planning and email catch-up | 0.5h | — |

**Total:** 6.5h | **Billable:** 6.0h

Shall I submit this to ERPNext, or would you like to edit any entries first?`,
        timestamp: "2026-06-29T09:00:08Z",
      },
    ],
    createdAt: "2026-06-29T09:00:00Z",
    updatedAt: "2026-06-29T09:00:08Z",
  },
]

export const mockNotifications: Notification[] = [
  {
    id: "n1",
    type: "reminder",
    title: "Client demo tomorrow",
    body: "Presentation for dxPOS mobile is scheduled for July 1 at 2:00 PM.",
    timestamp: "2026-06-29T09:00:00Z",
    read: false,
  },
  {
    id: "n2",
    type: "ai",
    title: "Timesheet reminder",
    body: "You haven't logged Friday's hours yet. Want me to generate them?",
    timestamp: "2026-06-29T08:30:00Z",
    read: false,
  },
  {
    id: "n3",
    type: "task",
    title: "Task overdue",
    body: "\"Prepare demo for client presentation\" is due tomorrow and not started.",
    timestamp: "2026-06-29T08:00:00Z",
    read: true,
  },
]
