"use client"

import { ArrowUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SortPillOption {
  value: string
  label: string
}

interface SortPillProps {
  label?: string
  options: SortPillOption[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function SortPill({ label = "Sort", options, value, onChange, className }: SortPillProps) {
  return (
    <label
      className={cn(
        "relative inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground",
        className,
      )}
    >
      <ArrowUpDown className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer appearance-none bg-transparent pr-1 text-xs font-medium text-foreground outline-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-card text-foreground">
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  )
}
