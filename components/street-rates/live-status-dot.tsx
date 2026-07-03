"use client"

import { cn } from "@/lib/utils"

export type LiveStatus = "live" | "delayed" | "offline"

const STATUS_CONFIG: Record<LiveStatus, { dot: string; text: string; label: string }> = {
  live:    { dot: "bg-emerald-500", text: "text-emerald-600", label: "Live" },
  delayed: { dot: "bg-amber-500",   text: "text-amber-600",   label: "Delayed" },
  offline: { dot: "bg-red-500",     text: "text-red-600",     label: "Offline" },
}

export function LiveStatusDot({ status, className }: { status: LiveStatus; className?: string }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span className="relative flex h-2 w-2">
        {status !== "offline" && (
          <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping", cfg.dot)} />
        )}
        <span className={cn("relative inline-flex h-2 w-2 rounded-full", cfg.dot)} />
      </span>
      <span className={cn("text-xs font-medium", cfg.text)}>{cfg.label}</span>
    </div>
  )
}

// Derives a LiveStatus from the widget/compare meta `stale` flags, or "offline" on fetch error.
export function staleToStatus(stale: boolean | undefined, hasError: boolean): LiveStatus {
  if (hasError) return "offline"
  return stale ? "delayed" : "live"
}
