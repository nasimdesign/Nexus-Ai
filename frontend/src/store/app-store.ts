import { create } from "zustand"
import type { Task, Project, Conversation, Message, Notification } from "@/types"
import { mockTasks, mockProjects, mockConversations, mockNotifications } from "@/lib/mock-data"

interface AppStore {
  // Navigation
  activeSection: string
  setActiveSection: (section: string) => void

  // Tasks
  tasks: Task[]
  setTasks: (tasks: Task[]) => void
  addTask: (task: Task) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void

  // Projects
  projects: Project[]

  // Chat
  conversations: Conversation[]
  activeConversationId: string | null
  setActiveConversation: (id: string | null) => void
  addMessage: (conversationId: string, message: Message) => void
  createConversation: (title: string) => string
  updateLastMessage: (conversationId: string, content: string) => void

  // Notifications
  notifications: Notification[]
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void

  // Command palette
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void

  // AI streaming
  isAIStreaming: boolean
  setIsAIStreaming: (streaming: boolean) => void

  aiModel: string
  setAiModel: (model: string) => void
  apiKey: string
  setApiKey: (key: string) => void
}

export const useAppStore = create<AppStore>((set, get) => ({
  activeSection: "dashboard",
  setActiveSection: (section) => set({ activeSection: section }),

  tasks: mockTasks,
  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((s) => ({ tasks: [task, ...s.tasks] })),
  updateTask: (id, updates) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),
  deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

  projects: mockProjects,

  conversations: mockConversations,
  activeConversationId: "c1",
  setActiveConversation: (id) => set({ activeConversationId: id }),
  addMessage: (conversationId, message) =>
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === conversationId
          ? { ...c, messages: [...c.messages, message], updatedAt: new Date().toISOString() }
          : c
      ),
    })),
  createConversation: (title) => {
    const id = `c${Date.now()}`
    const conversation: Conversation = {
      id,
      title,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    set((s) => ({ conversations: [conversation, ...s.conversations], activeConversationId: id }))
    return id
  },
  updateLastMessage: (conversationId, content) =>
    set((s) => ({
      conversations: s.conversations.map((c) => {
        if (c.id !== conversationId) return c
        const msgs = [...c.messages]
        if (msgs.length > 0) {
          msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content, isStreaming: false }
        }
        return { ...c, messages: msgs }
      }),
    })),

  notifications: mockNotifications,
  markNotificationRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),
  markAllNotificationsRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    })),

  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

  isAIStreaming: false,
  setIsAIStreaming: (streaming) => set({ isAIStreaming: streaming }),

  aiModel: "claude-3-5-sonnet-20240620",
  setAiModel: (model) => set({ aiModel: model }),
  apiKey: "",
  setApiKey: (key) => set({ apiKey: key }),
}))
