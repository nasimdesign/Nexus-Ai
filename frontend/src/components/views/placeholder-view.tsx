"use client"

import { motion } from "framer-motion"
import { Construction } from "lucide-react"

interface PlaceholderViewProps {
  title: string
  description: string
}

export function PlaceholderView({ title, description }: PlaceholderViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-1 flex-col items-center justify-center gap-4 p-12 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100">
        <Construction className="h-7 w-7 text-neutral-400" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
        <p className="text-sm text-neutral-500 mt-1 max-w-sm">{description}</p>
      </div>
      <div className="flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5">
        <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
        <span className="text-xs text-indigo-600 font-medium">Coming soon</span>
      </div>
    </motion.div>
  )
}
