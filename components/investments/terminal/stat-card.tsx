"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface TerminalStatCardProps {
  label: ReactNode
  value: ReactNode
  subValue?: ReactNode
  change?: number | null
  changeLabel?: string
  highlight?: boolean
  className?: string
}

export function TerminalStatCard({ label, value, subValue, change, changeLabel, highlight, className }: TerminalStatCardProps) {
  const hasChange = change != null && !Number.isNaN(change)
  const changeTone = hasChange ? (change! > 0 ? "text-gain" : change! < 0 ? "text-loss" : "text-muted-foreground") : undefined

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4",
        highlight ? "border-primary/40 ring-1 ring-primary/20" : "border-border",
        className,
      )}
    >
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-foreground">{value}</p>
      {(subValue || hasChange) && (
        <div className="mt-1 flex items-center gap-1.5 text-xs">
          {hasChange && (
            <span className={cn("font-mono tabular-nums font-medium", changeTone)}>
              {change! > 0 ? "+" : ""}
              {change!.toFixed(2)}%
            </span>
          )}
          {changeLabel && hasChange && <span className="text-muted-foreground">{changeLabel}</span>}
          {subValue && <span className="text-muted-foreground">{subValue}</span>}
        </div>
      )}
    </div>
  )
}
