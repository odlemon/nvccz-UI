"use client"

import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface FpaDrawerProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
  /** Extra badge next to title */
  badge?: React.ReactNode
}

export function FpaDrawer({ open, onClose, title, children, footer, className, badge }: FpaDrawerProps) {
  if (!open) return null

  return (
    <aside
      className={cn(
        "w-full xl:w-80 shrink-0 border-t xl:border-t-0 xl:border-l border-[#e2e8f0] bg-white flex flex-col max-h-[50vh] xl:max-h-none xl:h-auto xl:min-h-0",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2 px-4 py-3 border-b border-[#e2e8f0] shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-semibold text-[#0f172a]">{title}</h2>
            {badge}
          </div>
        </div>
        <button type="button" onClick={onClose} className="text-[#94a3b8] hover:text-[#64748b] p-1" aria-label="Close">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">{children}</div>
      {footer && <div className="border-t border-[#e2e8f0] p-4 shrink-0">{footer}</div>}
    </aside>
  )
}
