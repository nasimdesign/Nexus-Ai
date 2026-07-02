import { create } from "zustand"
import type { Task, Project, Conversation, Message, Notification, User } from "@/types"
import { mockTasks, mockProjects, mockConversations, mockNotifications } from "@/lib/mock-data"

interface AppStore {
  // Navigation
  activeSection: string
  setActiveSection: (section: string) => void

  // Authentication
  isAuthenticated: boolean
  user: User | null
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  initAuth: () => void

  // Tasks
  tasks: Task[]
  setTasks: (tasks: Task[]) => void
  addTask: (task: Task) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void

  // Projects
  projects: Project[]
  addProject: (project: Project) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void

  // Chat
  conversations: Conversation[]
  activeConversationId: string | null
  setActiveConversation: (id: string | null) => void
  addMessage: (conversationId: string, message: Message) => void
  createConversation: (title: string) => string
  updateLastMessage: (conversationId: string, content: string) => void
  deleteConversation: (id: string) => void
  renameConversation: (id: string, title: string) => void
  canCreateConversation: () => boolean

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

  // Mobile sidebar
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

// Safe localStorage access (SSR-safe)
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === "undefined") return null
    return localStorage.getItem(key)
  },
  setItem: (key: string, value: string) => {
    if (typeof window !== "undefined") localStorage.setItem(key, value)
  },
  removeItem: (key: string) => {
    if (typeof window !== "undefined") localStorage.removeItem(key)
  },
}

export const useAppStore = create<AppStore>((set, get) => ({
  // Navigation
  activeSection: "dashboard",
  setActiveSection: (section) => set({ activeSection: section, sidebarOpen: false }),

  // Authentication
  isAuthenticated: false,
  user: null,
  initAuth: () => {
    const userData = safeLocalStorage.getItem("nexus_user")
    if (userData) {
      try {
        const user = JSON.parse(userData)
        set({ isAuthenticated: true, user })
      } catch {
        safeLocalStorage.removeItem("nexus_user")
      }
    }
  },
  login: async (email: string, password: string) => {
    // Check stored accounts
    const accounts = JSON.parse(safeLocalStorage.getItem("nexus_accounts") || "[]")
    const account = accounts.find((a: any) => a.email === email)
    
    if (account) {
      if (account.password !== password) {
        throw new Error("Invalid email or password")
      }
      const user: User = { id: account.id, name: account.name, email: account.email, role: account.role, company: account.company }
      safeLocalStorage.setItem("nexus_user", JSON.stringify(user))
      set({ isAuthenticated: true, user })
    } else {
      // Demo login: auto-create account on first login
      const user: User = {
        id: `u-${Date.now()}`,
        name: email.split("@")[0],
        email,
        role: "Member",
        company: "Nexus AI",
      }
      accounts.push({ ...user, password })
      safeLocalStorage.setItem("nexus_accounts", JSON.stringify(accounts))
      safeLocalStorage.setItem("nexus_user", JSON.stringify(user))
      set({ isAuthenticated: true, user })
    }
  },
  loginWithGoogle: async () => {
    // Simulated Google login for demo
    const user: User = {
      id: `u-google-${Date.now()}`,
      name: "Nexus User",
      email: "user@gmail.com",
      role: "Member",
      company: "Nexus AI",
    }
    safeLocalStorage.setItem("nexus_user", JSON.stringify(user))
    set({ isAuthenticated: true, user })
  },
  signup: async (name: string, email: string, password: string) => {
    const accounts = JSON.parse(safeLocalStorage.getItem("nexus_accounts") || "[]")
    const existing = accounts.find((a: any) => a.email === email)
    if (existing) throw new Error("An account with this email already exists")
    
    const user: User = {
      id: `u-${Date.now()}`,
      name,
      email,
      role: "Member",
      company: "Nexus AI",
    }
    accounts.push({ ...user, password })
    safeLocalStorage.setItem("nexus_accounts", JSON.stringify(accounts))
    safeLocalStorage.setItem("nexus_user", JSON.stringify(user))
    set({ isAuthenticated: true, user })
  },
  logout: () => {
    safeLocalStorage.removeItem("nexus_user")
    set({ isAuthenticated: false, user: null, activeSection: "dashboard" })
  },

  // Tasks
  tasks: mockTasks,
  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((s) => ({ tasks: [task, ...s.tasks] })),
  updateTask: (id, updates) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),
  deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

  // Projects
  projects: mockProjects,
  addProject: (project) => set((s) => ({ projects: [...s.projects, project] })),
  updateProject: (id, updates) =>
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),
  deleteProject: (id) => set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),

  // Chat
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
  canCreateConversation: () => {
    const { conversations, isAIStreaming } = get()
    if (isAIStreaming) return false
    // Check if there's already an empty conversation (no messages)
    const hasEmptyConv = conversations.some((c) => c.messages.length === 0)
    return !hasEmptyConv
  },
  createConversation: (title) => {
    const { canCreateConversation } = get()
    if (!canCreateConversation()) {
      // Find the empty conversation and activate it
      const emptyConv = get().conversations.find((c) => c.messages.length === 0)
      if (emptyConv) {
        set({ activeConversationId: emptyConv.id })
        return emptyConv.id
      }
    }
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
        // Auto-title from first user message
        let title = c.title
        if (c.title === "New conversation" && msgs.length >= 1) {
          const firstUserMsg = msgs.find((m) => m.role === "user")
          if (firstUserMsg) {
            title = firstUserMsg.content.slice(0, 50) + (firstUserMsg.content.length > 50 ? "…" : "")
          }
        }
        return { ...c, messages: msgs, title }
      }),
    })),
  deleteConversation: (id) =>
    set((s) => {
      const filtered = s.conversations.filter((c) => c.id !== id)
      return {
        conversations: filtered,
        activeConversationId: s.activeConversationId === id
          ? (filtered[0]?.id || null)
          : s.activeConversationId,
      }
    }),
  renameConversation: (id, title) =>
    set((s) => ({
      conversations: s.conversations.map((c) => (c.id === id ? { ...c, title } : c)),
    })),

  // Notifications
  notifications: mockNotifications,
  markNotificationRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),
  markAllNotificationsRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    })),

  // Command palette
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

  // AI streaming
  isAIStreaming: false,
  setIsAIStreaming: (streaming) => set({ isAIStreaming: streaming }),

  // Model
  aiModel: "nousresearch/hermes-3-llama-3.1-405b",
  setAiModel: (model) => set({ aiModel: model }),

  // Mobile sidebar
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
