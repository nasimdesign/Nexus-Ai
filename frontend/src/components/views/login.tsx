"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Zap, Mail, Lock, User, ArrowRight, Eye, EyeOff, Sparkles, Globe, Code } from "lucide-react"

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<void>
  onSignup: (name: string, email: string, password: string) => Promise<void>
  onGoogleLogin: () => Promise<void>
}

export default function Login({ onLogin, onSignup, onGoogleLogin }: LoginProps) {
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      if (mode === "login") {
        await onLogin(email, password)
      } else {
        if (!name.trim()) { setError("Name is required"); setLoading(false); return }
        await onSignup(name, email, password)
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError("")
    try {
      await onGoogleLogin()
    } catch (err: any) {
      setError(err.message || "Google login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#0a0a0a] via-[#110a1a] to-[#0d0520] relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/8 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/8 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/5 rounded-full blur-[150px]" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }} />
      </div>

      {/* Left side - Branding (hidden on mobile) */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center relative p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-lg text-center"
        >
          <motion.div
            className="flex items-center justify-center mb-8"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, type: "spring" }}
          >
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-2xl shadow-purple-600/30">
                <Zap className="h-10 w-10 text-white" strokeWidth={2} />
              </div>
              <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-400 border-2 border-[#0a0a0a] animate-pulse" />
            </div>
          </motion.div>

          <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
            Welcome to <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">Nexus AI</span>
          </h1>
          <p className="text-lg text-neutral-400 leading-relaxed mb-8">
            Your AI-powered work operating system. Plan, code, analyze, and create — all in one intelligent workspace.
          </p>

          <div className="flex flex-col gap-4 text-left max-w-sm mx-auto">
            {[
              { icon: Sparkles, text: "Powered by Claude, GPT-4o & Gemini" },
              { icon: Zap, text: "Intelligent task & project management" },
              { icon: ArrowRight, text: "Beautiful, production-grade workspace" },
            ].map((feature, i) => (
              <motion.div
                key={feature.text}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.15 }}
                className="flex items-center gap-3 text-neutral-300"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/10">
                  <feature.icon className="h-4 w-4 text-purple-400" />
                </div>
                <span className="text-sm">{feature.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[420px]"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600">
              <Zap className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold text-white">Nexus AI</span>
          </div>

          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-white tracking-tight">
                {mode === "login" ? "Sign in" : "Create account"}
              </h2>
              <p className="text-sm text-neutral-400 mt-1">
                {mode === "login" ? "Welcome back! Enter your credentials." : "Get started with Nexus AI for free."}
              </p>
            </div>

            {/* Social Logins */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2.5 rounded-xl bg-white/[0.06] border border-white/[0.1] px-4 py-2.5 text-sm font-medium text-neutral-300 hover:bg-white/[0.1] hover:border-white/[0.15] transition-all disabled:opacity-50"
              >
                <Globe className="h-4 w-4" />
                Google
              </button>
              <button
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2.5 rounded-xl bg-white/[0.06] border border-white/[0.1] px-4 py-2.5 text-sm font-medium text-neutral-300 hover:bg-white/[0.1] hover:border-white/[0.15] transition-all disabled:opacity-50"
              >
                <Code className="h-4 w-4" />
                GitHub
              </button>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-neutral-500 font-medium">or continue with email</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {mode === "signup" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className="block text-xs font-medium text-neutral-400 mb-1.5">Full name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full rounded-xl bg-white/[0.05] border border-white/[0.1] pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full rounded-xl bg-white/[0.05] border border-white/[0.1] pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={4}
                    className="w-full rounded-xl bg-white/[0.05] border border-white/[0.1] pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:from-purple-500 hover:to-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-600/20 hover:shadow-purple-600/30"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {mode === "login" ? "Sign In" : "Create Account"}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <p className="text-sm text-neutral-500 text-center mt-6">
              {mode === "login" ? "Don't have an account?" : "Already have an account?"}
              <button
                type="button"
                onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError("") }}
                className="ml-1.5 text-purple-400 hover:text-purple-300 font-medium transition-colors"
              >
                {mode === "login" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>

          <p className="text-xs text-neutral-600 text-center mt-6">
            By continuing, you agree to the Terms of Service and Privacy Policy
          </p>
        </motion.div>
      </div>
    </div>
  )
}