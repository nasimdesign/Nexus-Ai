"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Send, Sparkles, Plus, Pin, Search, Zap, Clock, CheckSquare, FileText, Calendar, Square, MoreHorizontal, Copy, Check, MessageSquare, Mic, MicOff, ChevronDown, Bot, Pencil, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAppStore } from "@/store/app-store"
import { formatRelativeTime } from "@/lib/utils"
import type { Message } from "@/types"

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
    <div className="flex items-center gap-1 px-1 py-2 h-6">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-neutral-400"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }}
        />
      ))}
    </div>
  )
}

function CodeBlock({ node, inline, className, children, ...props }: any) {
  const [copied, setCopied] = useState(false)
  const match = /language-(\w+)/.exec(className || '')
  
  const handleCopy = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ''))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (inline) {
    return <code className="bg-neutral-100 text-neutral-800 px-1 py-0.5 rounded text-[0.85em] font-mono" {...props}>{children}</code>
  }

  return (
    <div className="relative group rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 my-4">
      <div className="flex items-center justify-between px-4 py-1.5 bg-neutral-800/50 border-b border-neutral-800">
        <span className="text-[10px] text-neutral-400 font-mono">{match?.[1] || 'text'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[10px] text-neutral-400 hover:text-white transition-colors"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm text-neutral-100 font-mono leading-relaxed bg-transparent m-0 border-0">
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
    addMessage, createConversation, isAIStreaming, setIsAIStreaming, updateLastMessage
  } = useAppStore()

  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const [attachments, setAttachments] = useState<File[]>([])
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false)
  const [isAutoMenuOpen, setIsAutoMenuOpen] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [taskTitle, setTaskTitle] = useState("")
  const [taskPriority, setTaskPriority] = useState("medium")
  const [taskProject, setTaskProject] = useState("Inbox")
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const autoMenuRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsAttachmentMenuOpen(false)
      }
      if (autoMenuRef.current && !autoMenuRef.current.contains(event.target as Node)) {
        setIsAutoMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const { addTask } = useAppStore()

  // ── Mic / Speech-to-text ──────────────────────────────────────────────────
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

  // ── Auto task: ask AI to generate a task based on current context ─────────
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
      addTask({
        id: `T-${Date.now()}`,
        title,
        status: "todo",
        priority,
        project,
        assignee: "Nasim",
        createdAt: now,
        updatedAt: now,
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        estimatedHours: 1,
      })
    } catch {
      // fallback silent
    }
  }, [addTask])

  // ── Manual task modal submit ───────────────────────────────────────────────
  const handleManualTask = () => {
    if (!taskTitle.trim()) return
    const now = new Date().toISOString()
    addTask({
      id: `T-${Date.now()}`,
      title: taskTitle.trim(),
      status: "todo",
      priority: taskPriority as any,
      project: taskProject || "Inbox",
      assignee: "Nasim",
      createdAt: now,
      updatedAt: now,
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      estimatedHours: 1,
    })
    setShowTaskModal(false)
    setTaskTitle("")
    setTaskPriority("medium")
    setTaskProject("Inbox")
  }



  const activeConversation = conversations.find((c) => c.id === activeConversationId)

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [activeConversation?.messages, isTyping])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files || [])])
    }
    if (fileInputRef.current) fileInputRef.current.value = ""
  }
  
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

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
    if (!text.trim() || isAIStreaming) return
    const t = text.trim()
    setInput("")

    let convId = activeConversationId
    if (!convId) {
      convId = createConversation(t.slice(0, 40))
    }

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: t,
      timestamp: new Date().toISOString(),
    }
    addMessage(convId, userMsg)

    setIsTyping(true)
    setIsAIStreaming(true)
    
    const controller = new AbortController()
    setAbortController(controller)

    try {
      const messagesForApi = activeConversation 
        ? [...activeConversation.messages, userMsg].map(m => ({ role: m.role, content: m.content }))
        : [{ role: "user", content: t }]

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: messagesForApi, 
          modelId: useAppStore.getState().aiModel,
          apiKey: useAppStore.getState().apiKey 
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
      // Flush any remaining bytes in the decoder buffer
      const remaining = decoder.decode()
      if (remaining) {
        fullResponse += remaining
      }
      updateLastMessage(convId, fullResponse) // finalize without isStreaming flag
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error("Chat error:", err)
      }
    } finally {
      setIsAIStreaming(false)
      setIsTyping(false)
      setAbortController(null)
    }
  }, [activeConversationId, isAIStreaming, addMessage, createConversation, setIsAIStreaming, updateLastMessage, activeConversation])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="flex h-full bg-white">
      {/* Sidebar: Conversation list */}
      <aside className="flex w-[260px] shrink-0 flex-col border-r border-neutral-100 bg-neutral-50/50">
        <div className="flex items-center justify-between p-4 border-b border-neutral-100">
          <span className="text-xs font-semibold text-neutral-900 tracking-tight">Chat History</span>
          <button
            onClick={() => {
              const id = createConversation("New conversation")
              setActiveConversation(id)
              setTimeout(() => inputRef.current?.focus(), 50)
            }}
            className="flex items-center gap-1.5 rounded-full bg-white border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" /> New
          </button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-1">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveConversation(conv.id)}
                className={`group flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all ${
                  activeConversationId === conv.id
                    ? "bg-white shadow-sm border border-neutral-200"
                    : "hover:bg-neutral-100 border border-transparent"
                }`}
              >
                {conv.pinned ? (
                  <Pin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                ) : (
                  <MessageSquare className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${activeConversationId === conv.id ? "text-primary" : "text-neutral-400 group-hover:text-neutral-500"}`} />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate ${activeConversationId === conv.id ? "text-primary" : "text-neutral-700"}`}>
                    {conv.title}
                  </p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    {formatRelativeTime(conv.updatedAt)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </aside>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col relative">
        {activeConversation ? (
          <>
            <ScrollArea className="flex-1 px-8 py-6">
              <div className="max-w-[760px] mx-auto space-y-8 pb-32">
                {activeConversation.messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
                        <Sparkles className="h-4 w-4" />
                      </div>
                    )}
                    
                    <div
                      className={`group relative max-w-[85%] rounded-2xl px-5 py-3.5 ${
                        msg.role === "user"
                          ? "bg-neutral-100 text-neutral-900 rounded-tr-sm"
                          : "bg-white border border-neutral-100 text-neutral-800 rounded-tl-sm shadow-sm"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm prose-neutral max-w-none text-neutral-800 
                          [&_table]:w-full [&_table]:text-sm [&_th]:py-2 [&_th]:px-3 [&_th]:bg-neutral-50 
                          [&_td]:py-2 [&_td]:px-3 [&_table]:border-collapse [&_td]:border [&_td]:border-neutral-100 
                          [&_th]:border [&_th]:border-neutral-100 [&_a]:text-primary [&_a]:no-underline hover:[&_a]:underline"
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
                            className="flex items-center gap-1 text-[10px] font-medium text-neutral-400 hover:text-neutral-700 transition-colors"
                          >
                            <Copy className="h-3 w-3" /> Copy
                          </button>
                        </div>
                      )}
                    </div>

                    {msg.role === "user" && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-neutral-200 text-neutral-700 text-xs font-semibold shadow-sm">
                        N
                      </div>
                    )}
                  </motion.div>
                ))}

                {isTyping && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary shadow-sm">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm border border-neutral-100 bg-white px-5 py-3 shadow-sm">
                      <TypingIndicator />
                    </div>
                  </motion.div>
                )}
                <div ref={bottomRef} className="h-4" />
              </div>
            </ScrollArea>

            {/* Input area & Stop Generating */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-10 pb-6 px-8">
              <div className="max-w-[760px] mx-auto relative">
                
                {/* Stop generating button */}
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
                        className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-medium text-neutral-600 shadow-sm hover:bg-neutral-50 hover:text-neutral-700 transition-colors"
                      >
                        <Square className="h-3.5 w-3.5 fill-neutral-600" />
                        Stop generating
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Suggested prompts - only if empty */}
                {activeConversation.messages.length === 0 && (
                  <div className="mb-4 grid grid-cols-2 md:grid-cols-3 gap-2">
                    {suggestedPrompts.map((p) => {
                      const Icon = p.icon
                      return (
                        <button
                          key={p.label}
                          onClick={() => sendMessage(p.label)}
                          className="flex items-center gap-2.5 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-left text-xs font-medium text-neutral-600 hover:border-primary hover:text-neutral-800 transition-colors"
                        >
                          <Icon className="h-4 w-4 text-neutral-400 group-hover:text-primary transition-colors shrink-0" />
                          <span className="truncate">{p.label}</span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Main Input box */}
                <div className="relative flex flex-col gap-1 rounded-2xl border border-neutral-300 bg-white p-2 shadow-sm transition-all focus-within:border-neutral-400">
                  
                  {/* Attachments Area */}
                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 px-1 mb-1">
                      {attachments.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-1 text-xs text-neutral-600">
                          <FileText className="h-3 w-3 text-neutral-400" />
                          <span className="truncate max-w-[120px]">{file.name}</span>
                          <button onClick={() => removeAttachment(idx)} className="ml-1 text-neutral-400 hover:text-neutral-700">
                            <Plus className="h-3 w-3 rotate-45" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-end gap-2">
                    <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                    
                    <div className="relative" ref={menuRef}>
                      <button 
                        onClick={() => setIsAttachmentMenuOpen(!isAttachmentMenuOpen)}
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors mb-0.5 ${isAttachmentMenuOpen ? 'bg-neutral-100 text-neutral-800' : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50'}`}
                      >
                        <Plus className={`h-5 w-5 transition-transform duration-200 ${isAttachmentMenuOpen ? 'rotate-45' : ''}`} />
                      </button>
                      
                      <AnimatePresence>
                        {isAttachmentMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="absolute bottom-full left-0 mb-3 w-56 rounded-xl border border-neutral-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] overflow-hidden flex flex-col p-1.5 z-50"
                          >
                            <button
                              onClick={() => {
                                fileInputRef.current?.click()
                                setIsAttachmentMenuOpen(false)
                              }}
                              className="flex items-center gap-3 rounded-md px-2.5 py-2 text-sm text-neutral-600 hover:bg-neutral-100 transition-colors text-left font-medium"
                            >
                              <FileText className="h-4 w-4" />
                              Add files or photos
                            </button>
                            <button
                              onClick={() => setIsAttachmentMenuOpen(false)}
                              className="flex items-center gap-3 rounded-md px-2.5 py-2 text-sm text-neutral-600 hover:bg-neutral-100 transition-colors text-left font-medium"
                            >
                              <CheckSquare className="h-4 w-4" />
                              Add to project
                            </button>
                            
                            <div className="my-1 h-[1px] bg-neutral-100 mx-2" />
                            
                            <button
                              onClick={() => setIsAttachmentMenuOpen(false)}
                              className="flex items-center justify-between rounded-md px-2.5 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 transition-colors text-left font-medium"
                            >
                              <div className="flex items-center gap-3">
                                <Sparkles className="h-4 w-4" />
                                Skills
                              </div>
                              <span className="text-neutral-400 text-xs text-right">&gt;</span>
                            </button>
                            <button
                              onClick={() => setIsAttachmentMenuOpen(false)}
                              className="flex items-center justify-between rounded-md px-2.5 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 transition-colors text-left font-medium"
                            >
                              <div className="flex items-center gap-3">
                                <FileText className="h-4 w-4" />
                                Connectors
                              </div>
                              <span className="text-neutral-400 text-xs text-right">&gt;</span>
                            </button>
                            <button
                              onClick={() => setIsAttachmentMenuOpen(false)}
                              className="flex items-center justify-between rounded-md px-2.5 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 transition-colors text-left font-medium"
                            >
                              <div className="flex items-center gap-3">
                                <Zap className="h-4 w-4" />
                                Plugins
                              </div>
                              <span className="text-neutral-400 text-xs text-right">&gt;</span>
                            </button>
                            
                            <div className="my-1 h-[1px] bg-neutral-100 mx-2" />
                            
                            <button
                              onClick={() => setIsAttachmentMenuOpen(false)}
                              className="flex items-center gap-3 rounded-md px-2.5 py-2 text-sm text-neutral-600 hover:bg-neutral-100 transition-colors text-left font-medium"
                            >
                              <Search className="h-4 w-4" />
                              Research
                            </button>
                            <button
                              onClick={() => setIsAttachmentMenuOpen(false)}
                              className="flex items-center justify-between rounded-md px-2.5 py-2 text-sm text-neutral-600 hover:bg-neutral-100 transition-colors text-left font-medium"
                            >
                              <div className="flex items-center gap-3">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-globe">
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <path d="M12 2a14.5 14.5 0 0 1 10 4.3M12 2a14.5 14.5 0 0 0-10 4.2M12 2v20M2 12a10 10 0 0 1 18.8-4M22 12a10 10 0 0 1-18.8 4"></path>
                                </svg>
                                Web search
                              </div>
                              <Check className="h-4 w-4 text-primary" />
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
                      placeholder="Ask Nexus anything..."
                      rows={1}
                      className="flex-1 resize-none bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-0 leading-relaxed py-1.5"
                      style={{ maxHeight: 200 }}
                    />
                    
                    <button
                      onClick={() => sendMessage(input)}
                      disabled={(!input.trim() && attachments.length === 0) || isAIStreaming}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="h-4 w-4 ml-0.5" />
                    </button>
                  </div>

                  {/* Slim Footer */}
                  <div className="flex items-center justify-between px-1 pt-0.5">
                    {/* Left: Auto button with popover + Mic */}
                    <div className="flex items-center gap-2">
                      {/* Auto / Manual dropdown */}
                      <div className="relative" ref={autoMenuRef}>
                        <button
                          onClick={() => setIsAutoMenuOpen(!isAutoMenuOpen)}
                          className="flex items-center gap-1 text-[10px] font-semibold text-[#C9A84C] hover:text-[#B8933B] px-1.5 py-0.5 rounded-md hover:bg-amber-50 transition-colors"
                        >
                          Auto
                          <ChevronDown className={`h-2.5 w-2.5 transition-transform ${isAutoMenuOpen ? "rotate-180" : ""}`} />
                        </button>
                        <AnimatePresence>
                          {isAutoMenuOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 8, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 8, scale: 0.95 }}
                              transition={{ duration: 0.12 }}
                              className="absolute bottom-full left-0 mb-2 w-52 rounded-xl border border-neutral-200 bg-white shadow-lg overflow-hidden z-50"
                            >
                              <div className="p-1">
                                <button
                                  onClick={handleAutoTask}
                                  className="w-full flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-neutral-50 transition-colors text-left"
                                >
                                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10">
                                    <Bot className="h-3.5 w-3.5 text-primary" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold text-neutral-800">Auto</p>
                                    <p className="text-[10px] text-neutral-500 leading-tight">AI generates a task from your context</p>
                                  </div>
                                </button>
                                <button
                                  onClick={() => { setIsAutoMenuOpen(false); setShowTaskModal(true) }}
                                  className="w-full flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-neutral-50 transition-colors text-left"
                                >
                                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-neutral-100">
                                    <Pencil className="h-3.5 w-3.5 text-neutral-600" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold text-neutral-800">Manual</p>
                                    <p className="text-[10px] text-neutral-500 leading-tight">Fill in task details yourself</p>
                                  </div>
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Mic button */}
                      <button
                        onClick={toggleMic}
                        className={`flex items-center justify-center h-5 w-5 rounded transition-colors ${
                          isListening
                            ? "text-red-500 hover:text-red-600 animate-pulse"
                            : "text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
                        }`}
                        title={isListening ? "Stop recording" : "Speak to type"}
                      >
                        {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                      </button>
                    </div>

                    {/* Right: Model Selector */}
                    <div className="group relative">
                      <select
                        value={useAppStore.getState().aiModel}
                        onChange={(e) => useAppStore.getState().setAiModel(e.target.value)}
                        className="h-5 cursor-pointer appearance-none rounded bg-transparent pl-2 pr-5 text-[10px] font-medium text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 focus:outline-none"
                      >
                        <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                        <option value="openai/gpt-4o">GPT-4o</option>
                        <option value="openai/gpt-4o-mini">GPT-4o Mini</option>
                        <option value="google/gemini-1.5-pro">Gemini 1.5 Pro</option>
                        <option value="google/gemini-1.5-flash">Gemini Flash</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-1 flex items-center text-neutral-400">
                        <ChevronDown className="h-2.5 w-2.5" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 p-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center max-w-md">
              <h3 className="text-xl font-semibold text-neutral-900 tracking-tight">How can I help you today?</h3>
              <p className="text-sm text-neutral-500 mt-2 leading-relaxed">Ask Nexus to plan your day, draft a timesheet, search the knowledge base, or update tasks in ERPNext.</p>
            </div>
            <Button size="lg" className="rounded-full gap-2 px-6 shadow-sm" onClick={() => { const id = createConversation("New conversation"); setActiveConversation(id); setTimeout(() => inputRef.current?.focus(), 50) }}>
              <Plus className="h-4 w-4" /> Start a conversation
            </Button>
          </div>
        )}
      </div>

      {/* ── Manual Task Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showTaskModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTaskModal(false)}
              className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div
                className="pointer-events-auto w-full max-w-md rounded-2xl bg-white border border-neutral-200 shadow-2xl p-6"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-base font-semibold text-neutral-900">New Task</h3>
                    <p className="text-xs text-neutral-400 mt-0.5">Add a task manually to your board</p>
                  </div>
                  <button
                    onClick={() => setShowTaskModal(false)}
                    className="flex items-center justify-center h-7 w-7 rounded-full hover:bg-neutral-100 text-neutral-400 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Form */}
                <div className="space-y-4">
                  {/* Task title */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1.5">Task title</label>
                    <input
                      autoFocus
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleManualTask() }}
                      placeholder="e.g. Prepare client presentation"
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>

                  {/* Priority + Project row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1.5">Priority</label>
                      <select
                        value={taskPriority}
                        onChange={(e) => setTaskPriority(e.target.value)}
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      >
                        <option value="urgent">🔴 Urgent</option>
                        <option value="high">🟠 High</option>
                        <option value="medium">🟡 Medium</option>
                        <option value="low">🔵 Low</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1.5">Project</label>
                      <input
                        value={taskProject}
                        onChange={(e) => setTaskProject(e.target.value)}
                        placeholder="Inbox"
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-6">
                  <Button
                    onClick={handleManualTask}
                    disabled={!taskTitle.trim()}
                    className="flex-1 gap-2"
                  >
                    <CheckSquare className="h-4 w-4" /> Add Task
                  </Button>
                  <Button variant="outline" onClick={() => setShowTaskModal(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
