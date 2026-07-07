"use client"

import { cn } from "@/lib/utils"

export interface PillTabItem {
  id: string
  label: string
  count?: number
}

interface PillTabsProps {
  items: PillTabItem[]
  activeId: string
  onChange: (id: string) => void
  className?: string
}

export function PillTabs({ items, activeId, onChange, className }: PillTabsProps) {
  return (
    <div className={cn("flex items-center gap-1 overflow-x-auto", className)}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={cn(
            "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
            activeId === item.id
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground",
          )}
        >
          {item.label}
          {item.count != null && <span className="ml-1.5 opacity-70">{item.count}</span>}
        </button>
      ))}
    </div>
  )
}
