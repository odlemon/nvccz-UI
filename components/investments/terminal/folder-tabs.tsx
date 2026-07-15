"use client"

import { cn } from "@/lib/utils"

export interface FolderTabItem {
  id: string
  label: string
  count?: number
}

interface FolderTabsProps {
  items: FolderTabItem[]
  activeId: string
  onChange: (id: string) => void
  className?: string
}

export function FolderTabs({ items, activeId, onChange, className }: FolderTabsProps) {
  return (
    <div className={cn("flex items-center gap-1 overflow-x-auto border-b border-border", className)}>
      {items.map((item) => {
        const active = activeId === item.id
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={cn(
              "relative -mb-px whitespace-nowrap rounded-t-lg border border-transparent border-b-0 px-3.5 py-2 text-xs font-medium transition-colors",
              active
                ? "border-border bg-card text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
            {item.count != null && <span className="ml-1.5 opacity-70">{item.count}</span>}
            {active && <span className="absolute inset-x-0 -bottom-px h-px bg-card" aria-hidden />}
          </button>
        )
      })}
    </div>
  )
}
