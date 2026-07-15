"use client"

import { cn } from "@/lib/utils"

interface CategoryPillProps {
  label: string
  active?: boolean
  onClick?: () => void
  className?: string
}

export function CategoryPill({ label, active, onClick, className }: CategoryPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
        active
          ? "border-primary/40 bg-accent text-accent-foreground"
          : "border-border bg-transparent text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {label}
    </button>
  )
}
