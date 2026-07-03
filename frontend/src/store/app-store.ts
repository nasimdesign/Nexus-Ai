import { create } from "zustand"
import type { Task, Project, Conversation, Message, Notification, User } from "@/types"
import { mockTasks, mockProjects, mockConversations, mockNotifications } from "@/lib/mock-data"
import { signIn, signOut, getSession } from "next-auth/react"

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
  initAuth: async () => {
    // Sync Zustand store with next-auth session
    try {
      const session = await getSession()
      if (session && (session as any).user) {
        set({ isAuthenticated: true, user: (session as any).user })
      } else {
        set({ isAuthenticated: false, user: null })
      }
    } catch (err) {
      set({ isAuthenticated: false, user: null })
    }
  },
  login: async (email: string, password: string) => {
    // This project uses NextAuth Email provider (magic links) and Google provider.
    // We will attempt an email sign-in (magic link). If you prefer password credentials,
    // add CredentialsProvider to NextAuth config.
    const res = await signIn("email", { email, redirect: false })
    // signIn returns a Promise that resolves to an object when redirect:false
    // We can't reliably detect success other than checking for an error property
    if (res && (res as any).error) {
      throw new Error((res as any).error || "Sign-in failed; check email for magic link")
    }
    // After the user clicks the magic link they will be signed in; initAuth can sync the state
  },
  loginWithGoogle: async () => {
    // Redirects to Google sign-in page
    await signIn("google")
  },
  signup: async (name: string, email: string, password: string) => {
    // For now we use magic link signup via Email provider. NextAuth will create the user via adapter on first sign-in.
    // Keep the password parameter for compatibility but we do not use it here.
    const res = await signIn("email", { email, redirect: false })
    if (res && (res as any).error) {
      throw new Error((res as any).error || "Signup failed; check email for magic link")
    }
  },
  logout: async () => {
    await signOut({ callbackUrl: '/' })
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
