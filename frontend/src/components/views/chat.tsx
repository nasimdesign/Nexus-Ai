"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  Send, Sparkles, Plus, Pin, Search, Zap, Clock, CheckSquare, FileText,
  Calendar, Square, Copy, Check, MessageSquare, Mic, MicOff, ChevronDown,
  Bot, Pencil, X, PanelLeftClose, PanelLeftOpen, File
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAppStore } from "@/store/app-store"
import { formatRelativeTime } from "@/lib/utils"
import type { Message, Task, Attachment } from "@/types"

const suggestedPrompts = [
  { icon: Zap, label: "What should I focus on today?", category: "planning" },
  { icon: CheckSquare, label: "List my pending tasks", category: "tasks" },
  { icon: Clock, label: "Generate today's timesheet", category: "timesheet" },
  { icon: FileText, label: "Write my stand-up update", category: "standup" },
  { icon: Calendar, label: "What's my schedule today?", category: "calendar" },
  { icon: Sparkles, label: "Summarize yesterday's work", category: "summary" },
]

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-2 h-6">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="h-2 w-2 rounded-full bg-primary/60"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
          transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }}
        />
      ))}
    </div>
  )
}

function CodeBlock({ node, inline, className, children, ...props }: any) {
  const [copied, setCopied] = useState(false)
  const match = /language-(\w+)/.exec(className || "")

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ""))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (inline) {
    return (
      <code
        className="bg-neutral-100 dark:bg-neutral-800 text-primary dark:text-primary px-1.5 py-0.5 rounded-md text-[0.85em] font-mono"
        {...props}
      >
        {children}
      </code>
    )
  }

  return (
    <div className="relative group rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 my-4 shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 bg-neutral-800/80 border-b border-neutral-800">
        <span className="text-[11px] font-medium text-neutral-400 font-mono uppercase tracking-wider">{match?.[1] || "text"}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-400 hover:text-white transition-colors"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm text-neutral-200 font-mono leading-relaxed bg-transparent m-0 border-0">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  )
}

export function Chat() {
  const {
    conversations, activeConversationId, setActiveConversation,
    addMessage, createConversation, isAIStreaming, setIsAIStreaming, updateLastMessage,
    addTask, aiModel, setAiModel
  } = useAppStore()

  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  
  // File attachments state
  const [attachments, setAttachments] = useState<File[]>([])
  const [parsedAttachments, setParsedAttachments] = useState<Attachment[]>([])
  
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false)
  const [isAutoMenuOpen, setIsAutoMenuOpen] = useState(false)
  const [isListening, setIsListening] = useState(false)
  
  // Modals & UI state
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [taskTitle, setTaskTitle] = useState("")
  const [taskPriority, setTaskPriority] = useState("medium")
  const [taskProject, setTaskProject] = useState("Inbox")
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)

  const activeConversation = conversations.find((c) => c.id === activeConversationId)

  // Scroll to bottom on new messages
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [activeConversation?.messages, isTyping])

  // Mic / Speech-to-text
  const toggleMic = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert("Your browser does not support speech recognition. Try Chrome.")
      return
    }
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }
    const rec = new SpeechRecognition()
    rec.lang = "en-US"
    rec.interimResults = true
    rec.continuous = false
    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join("")
      setInput(transcript)
    }
    rec.onend = () => setIsListening(false)
    rec.onerror = () => setIsListening(false)
    recognitionRef.current = rec
    rec.start()
    setIsListening(true)
  }, [isListening])

  // Process file upload (extract text if possible)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    setAttachments(prev => [...prev, ...files])
    
    // Process text files immediately for context
    const parsed: Attachment[] = []
    for (const file of files) {
      let content = ""
      if (file.type.startsWith("text/") || file.name.match(/\.(ts|tsx|js|jsx|json|md|csv|py|css|html)$/i)) {
        try {
          content = await file.text()
        } catch (e) {
          console.error("Failed to read file", e)
        }
      }
      parsed.push({
        id: `att-${Date.now()}-${Math.random()}`,
        name: file.name,
        type: file.type || "unknown",
        size: file.size,
        content
      })
    }
    setParsedAttachments(prev => [...prev, ...parsed])

    if (fileInputRef.current) fileInputRef.current.value = ""
    setIsAttachmentMenuOpen(false)
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
    setParsedAttachments(prev => prev.filter((_, i) => i !== index))
  }

  // Handle tasks
  const handleAutoTask = useCallback(async () => {
    setIsAutoMenuOpen(false)
    const prompt = "Based on my recent work context, suggest ONE specific actionable task I should do next. Reply with ONLY the task title (max 10 words), priority (urgent/high/medium/low), and project name, separated by pipes. Example: Review API docs|high|Backend"
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
      })
      const text = await res.text()
      const parts = text.split("|").map(s => s.trim())
      const title = parts[0] || "New AI Task"
      const priority = (["urgent", "high", "medium", "low"].includes(parts[1]?.toLowerCase()) ? parts[1].toLowerCase() : "medium") as any
      const project = parts[2] || "Inbox"
      const now = new Date().toISOString()
      const task: Task = {
        id: `T-${Date.now()}`,
        title,
        status: "todo",
        priority,
        project,
        assignee: "Nexus AI",
        createdAt: now,
        updatedAt: now,
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        estimatedHours: 1,
      }
      addTask(task)
    } catch {
      // fallback silent
    }
  }, [addTask])

  const handleManualTask = () => {
    if (!taskTitle.trim()) return
    const now = new Date().toISOString()
    const task: Task = {
      id: `T-${Date.now()}`,
      title: taskTitle.trim(),
      status: "todo",
      priority: taskPriority as any,
      project: taskProject || "Inbox",
      assignee: "Me",
      createdAt: now,
      updatedAt: now,
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      estimatedHours: 1,
    }
    addTask(task)
    setShowTaskModal(false)
    setTaskTitle("")
    setTaskPriority("medium")
    setTaskProject("Inbox")
  }

  // Chat messaging
  const stopGenerating = useCallback(() => {
    if (abortController) {
      abortController.abort()
      setAbortController(null)
      setIsAIStreaming(false)
      setIsTyping(false)
      if (activeConversationId && activeConversation?.messages.length) {
        const lastMessage = activeConversation.messages[activeConversation.messages.length - 1]
        updateLastMessage(activeConversationId, lastMessage.content + " 🛑 *(Stopped)*")
      }
    }
  }, [abortController, setIsAIStreaming, activeConversationId, updateLastMessage, activeConversation])

  const sendMessage = useCallback(async (text: string) => {
    if ((!text.trim() && parsedAttachments.length === 0) || isAIStreaming) return
    const t = text.trim()
    setInput("")
    
    // Clear attachments for next message
    const currentAttachments = [...parsedAttachments]
    setAttachments([])
    setParsedAttachments([])

    let convId = activeConversationId
    if (!convId) {
      convId = createConversation(t ? t.slice(0, 40) : "Files uploaded")
    }

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: t,
      timestamp: new Date().toISOString(),
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined
    }
    addMessage(convId, userMsg)

    setIsTyping(true)
    setIsAIStreaming(true)

    const controller = new AbortController()
    setAbortController(controller)

    try {
      const messagesForApi = activeConversation
        ? [...activeConversation.messages, userMsg]
        : [userMsg]

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messagesForApi,
          model: aiModel,
        }),
        signal: controller.signal
      })

      if (!res.ok) throw new Error("Failed to fetch")
      if (!res.body) throw new Error("No body")

      setIsTyping(false)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let done = false
      let fullResponse = ""

      const aiMsg: Message = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
        isStreaming: true
      }
      addMessage(convId, aiMsg)

      while (!done) {
        const { value, done: doneReading } = await reader.read()
        done = doneReading
        if (value) {
          const chunkValue = decoder.decode(value, { stream: true })
          if (chunkValue) {
            fullResponse += chunkValue
            updateLastMessage(convId, fullResponse)
          }
        }
      }
      const remaining = decoder.decode()
      if (remaining) {
        fullResponse += remaining
      }
      updateLastMessage(convId, fullResponse)
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error("Chat error:", err)
      }
    } finally {
      setIsAIStreaming(false)
      setIsTyping(false)
      setAbortController(null)
    }
  }, [activeConversationId, isAIStreaming, addMessage, createConversation, setIsAIStreaming, updateLastMessage, activeConversation, parsedAttachments, aiModel])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  // Only show active conversation's messages or start new
  return (
    <div className="flex h-full bg-background relative overflow-hidden">
      
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="absolute inset-0 z-20 bg-black/40 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      {/* History Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 0, opacity: sidebarOpen ? 1 : 0 }}
        className="absolute md:relative z-30 h-full flex shrink-0 flex-col border-r border-border bg-surface overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-border w-[260px]">
          <span className="text-xs font-semibold text-foreground tracking-tight uppercase">Chat History</span>
          <button
            onClick={() => {
              const id = createConversation("New conversation")
              setActiveConversation(id)
              if (window.innerWidth < 768) setSidebarOpen(false)
              setTimeout(() => inputRef.current?.focus(), 50)
            }}
            className="flex items-center gap-1.5 rounded-full bg-background border border-border px-3 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" /> New
          </button>
        </div>
        <ScrollArea className="flex-1 w-[260px]">
          <div className="p-3 space-y-1">
            {conversations.length === 0 && (
              <div className="text-center p-4 text-sm text-muted-foreground">
                No conversations yet
              </div>
            )}
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => {
                  setActiveConversation(conv.id)
                  if (window.innerWidth < 768) setSidebarOpen(false)
                }}
                className={`group flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all ${
                  activeConversationId === conv.id
                    ? "bg-muted shadow-sm border border-border"
                    : "hover:bg-muted/50 border border-transparent"
                }`}
              >
                {conv.pinned ? (
                  <Pin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                ) : (
                  <MessageSquare className={`h-4 w-4 shrink-0 mt-0.5 ${activeConversationId === conv.id ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${activeConversationId === conv.id ? "text-primary" : "text-foreground"}`}>
                    {conv.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {formatRelativeTime(conv.updatedAt)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </motion.aside>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col relative min-w-0">
        
        {/* Top Header (mobile mainly) */}
        <div className="h-12 border-b border-border flex items-center px-4 gap-3 md:hidden">
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 rounded-lg hover:bg-muted text-muted-foreground">
            <PanelLeftOpen className="h-5 w-5" />
          </button>
          <span className="font-medium text-sm truncate">
            {activeConversation?.title || "New Chat"}
          </span>
        </div>

        {/* Desktop Sidebar Toggle */}
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)} 
          className="hidden md:flex absolute top-4 left-4 z-10 p-2 rounded-lg bg-background/50 backdrop-blur-sm border border-border text-muted-foreground hover:text-foreground hover:bg-muted shadow-sm transition-all"
        >
          {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
        </button>

        {activeConversation ? (
          <>
            <ScrollArea className="flex-1 px-4 sm:px-8 py-6">
              <div className="max-w-3xl mx-auto space-y-8 pb-40">
                {activeConversation.messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex gap-3 sm:gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-indigo-600 text-white shadow-sm shadow-primary/20">
                        <Sparkles className="h-4 w-4" />
                      </div>
                    )}

                    <div
                      className={`group relative max-w-[85%] rounded-2xl px-5 py-3.5 ${
                        msg.role === "user"
                          ? "bg-muted/80 text-foreground rounded-tr-sm"
                          : "bg-surface border border-border text-foreground rounded-tl-sm shadow-sm"
                      }`}
                    >
                      {/* Attachments Display */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {msg.attachments.map((att, i) => (
                            <div key={i} className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2">
                              <File className="h-4 w-4 text-primary" />
                              <div className="flex flex-col">
                                <span className="text-xs font-medium truncate max-w-[150px]">{att.name}</span>
                                <span className="text-[10px] text-muted-foreground">{(att.size / 1024).toFixed(1)} KB</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none 
                          [&_table]:w-full [&_table]:text-sm [&_th]:py-2 [&_th]:px-3 [&_th]:bg-muted
                          [&_td]:py-2 [&_td]:px-3 [&_table]:border-collapse [&_td]:border [&_td]:border-border
                          [&_th]:border [&_th]:border-border [&_a]:text-primary [&_a]:no-underline hover:[&_a]:underline"
                        >
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{ code: CodeBlock }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                          {msg.isStreaming && <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse align-middle" />}
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      )}

                      {msg.role === "assistant" && !msg.isStreaming && (
                        <div className="absolute -bottom-6 left-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                          <button
                            onClick={() => navigator.clipboard.writeText(msg.content)}
                            className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Copy className="h-3 w-3" /> Copy
                          </button>
                        </div>
                      )}
                    </div>

                    {msg.role === "user" && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary text-xs font-bold shadow-sm">
                        U
                      </div>
                    )}
                  </motion.div>
                ))}

                {isTyping && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-indigo-600 shadow-sm">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm border border-border bg-surface px-5 py-3 shadow-sm">
                      <TypingIndicator />
                    </div>
                  </motion.div>
                )}
                <div ref={bottomRef} className="h-4" />
              </div>
            </ScrollArea>

            {/* Input area */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-transparent pt-10 pb-4 px-4 sm:px-8">
              <div className="max-w-3xl mx-auto relative">
                
                {/* Stop generating */}
                <AnimatePresence>
                  {isAIStreaming && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, x: "-50%" }}
                      animate={{ opacity: 1, y: 0, x: "-50%" }}
                      exit={{ opacity: 0, y: 10, x: "-50%" }}
                      className="absolute -top-14 left-1/2"
                    >
                      <button
                        onClick={stopGenerating}
                        className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-xs font-medium text-foreground shadow-sm hover:bg-muted transition-colors"
                      >
                        <Square className="h-3.5 w-3.5 fill-foreground" />
                        Stop generating
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Suggestions */}
                {activeConversation.messages.length === 0 && (
                  <div className="mb-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {suggestedPrompts.map((p) => {
                      const Icon = p.icon
                      return (
                        <button
                          key={p.label}
                          onClick={() => sendMessage(p.label)}
                          className="flex items-center gap-2.5 rounded-xl border border-border bg-surface px-3 py-3 text-left text-xs font-medium text-muted-foreground hover:border-primary hover:text-foreground transition-all shadow-sm hover:shadow-md"
                        >
                          <Icon className="h-4 w-4 text-primary shrink-0" />
                          <span className="truncate">{p.label}</span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Main Input box */}
                <div className="relative flex flex-col gap-1 rounded-2xl border border-border bg-surface p-2 shadow-lg shadow-black/5 dark:shadow-black/20 transition-all focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10">
                  
                  {/* Attachments preview */}
                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 px-2 pt-2 mb-1">
                      {attachments.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground shadow-sm">
                          <FileText className="h-3.5 w-3.5 text-primary" />
                          <span className="truncate max-w-[120px] font-medium">{file.name}</span>
                          <button onClick={() => removeAttachment(idx)} className="ml-1 text-muted-foreground hover:text-destructive transition-colors">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-end gap-2">
                    <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                    
                    {/* Attachment menu */}
                    <div className="relative">
                      <button
                        onClick={() => setIsAttachmentMenuOpen(!isAttachmentMenuOpen)}
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors mb-0.5 ${
                          isAttachmentMenuOpen 
                            ? 'bg-primary/10 text-primary' 
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                      >
                        <Plus className={`h-5 w-5 transition-transform duration-200 ${isAttachmentMenuOpen ? 'rotate-45' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {isAttachmentMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute bottom-full left-0 mb-3 w-56 rounded-xl border border-border bg-popover shadow-xl overflow-hidden flex flex-col p-1.5 z-50"
                          >
                            <button onClick={() => { fileInputRef.current?.click(); setIsAttachmentMenuOpen(false); }} className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-popover-foreground hover:bg-muted font-medium transition-colors">
                              <FileText className="h-4 w-4 text-primary" /> Add file
                            </button>
                            <div className="my-1 h-[1px] bg-border mx-2" />
                            <button onClick={() => setIsAttachmentMenuOpen(false)} className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-popover-foreground hover:bg-muted font-medium transition-colors">
                              <div className="flex items-center gap-3"><Search className="h-4 w-4 text-emerald-500" /> Web Search</div>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value)
                        e.target.style.height = "auto"
                        e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px"
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask Nexus anything... (Press Enter to send)"
                      rows={1}
                      className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 leading-relaxed py-2.5 min-h-[44px]"
                      style={{ maxHeight: 200 }}
                    />

                    <button
                      onClick={() => sendMessage(input)}
                      disabled={(!input.trim() && attachments.length === 0) || isAIStreaming}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm mb-0.5"
                    >
                      <Send className="h-4 w-4 ml-0.5" />
                    </button>
                  </div>

                  {/* Toolbar */}
                  <div className="flex items-center justify-between px-2 pt-2 border-t border-border mt-1 pb-1">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <button
                          onClick={() => setIsAutoMenuOpen(!isAutoMenuOpen)}
                          className="flex items-center gap-1.5 text-[11px] font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded-md transition-colors"
                        >
                          <Bot className="h-3 w-3" /> Actions
                          <ChevronDown className={`h-3 w-3 transition-transform ${isAutoMenuOpen ? "rotate-180" : ""}`} />
                        </button>
                        <AnimatePresence>
                          {isAutoMenuOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 8, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 8, scale: 0.95 }}
                              className="absolute bottom-full left-0 mb-2 w-52 rounded-xl border border-border bg-popover shadow-xl overflow-hidden z-50 p-1"
                            >
                              <button onClick={handleAutoTask} className="w-full flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-muted transition-colors text-left">
                                <Bot className="h-4 w-4 text-primary mt-0.5" />
                                <div><p className="text-sm font-medium">Auto Task</p><p className="text-[10px] text-muted-foreground">AI generates task from context</p></div>
                              </button>
                              <button onClick={() => { setIsAutoMenuOpen(false); setShowTaskModal(true) }} className="w-full flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-muted transition-colors text-left">
                                <Pencil className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div><p className="text-sm font-medium">Manual Task</p><p className="text-[10px] text-muted-foreground">Create a task manually</p></div>
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <button
                        onClick={toggleMic}
                        className={`flex items-center justify-center h-6 w-6 rounded-md transition-colors ${
                          isListening ? "bg-red-500/10 text-red-500 animate-pulse" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                      </button>
                    </div>

                    <div className="relative">
                      <select
                        value={aiModel}
                        onChange={(e) => setAiModel(e.target.value)}
                        className="h-6 cursor-pointer appearance-none rounded-md bg-transparent pl-2 pr-6 text-[10px] font-medium text-muted-foreground border border-transparent hover:border-border hover:bg-muted focus:outline-none transition-all"
                      >
                        <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                        <option value="openai/gpt-4o">GPT-4o</option>
                        <option value="openai/gpt-4o-mini">GPT-4o Mini</option>
                        <option value="google/gemini-1.5-pro">Gemini 1.5 Pro</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center text-muted-foreground">
                        <ChevronDown className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-indigo-500/20 shadow-inner">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
            <div className="text-center max-w-md">
              <h3 className="text-2xl font-semibold text-foreground tracking-tight">How can I help you today?</h3>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">Ask Nexus to plan your day, analyze data, draft emails, or search the knowledge base for answers.</p>
            </div>
            <Button size="lg" className="rounded-full gap-2 px-8 shadow-md hover:shadow-lg transition-all" onClick={() => { const id = createConversation("New conversation"); setActiveConversation(id); setTimeout(() => inputRef.current?.focus(), 50) }}>
              <Plus className="h-4 w-4" /> Start a conversation
            </Button>
          </div>
        )}
      </div>

      {/* Manual Task Modal */}
      <AnimatePresence>
        {showTaskModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowTaskModal(false)} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="pointer-events-auto w-full max-w-md rounded-2xl bg-background border border-border shadow-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">New Task</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Add a task manually to your board</p>
                  </div>
                  <button onClick={() => setShowTaskModal(false)} className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted text-muted-foreground transition-colors"><X className="h-4 w-4" /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">Task title</label>
                    <input autoFocus value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleManualTask() }} placeholder="e.g. Prepare presentation" className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1.5">Priority</label>
                      <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                        <option value="urgent">🔴 Urgent</option>
                        <option value="high">🟠 High</option>
                        <option value="medium">🟡 Medium</option>
                        <option value="low">🔵 Low</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1.5">Project</label>
                      <select value={taskProject} onChange={(e) => setTaskProject(e.target.value)} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                        <option value="Inbox">📥 Inbox</option>
                        <option value="Frontend">🎨 Frontend</option>
                        <option value="Backend">⚙️ Backend</option>
                        <option value="Marketing">📈 Marketing</option>
                      </select>
                    </div>
                  </div>
                  <div className="pt-2 flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setShowTaskModal(false)}>Cancel</Button>
                    <Button onClick={handleManualTask} disabled={!taskTitle.trim()}>Create Task</Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}