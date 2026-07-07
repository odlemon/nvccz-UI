"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface TerminalCardHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  className?: string
}

export function TerminalCardHeader({ title, subtitle, actions, className }: TerminalCardHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4", className)}>
      <div className="min-w-0">
        <h2 className="truncate text-sm font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}

interface TerminalCardProps {
  header?: TerminalCardHeaderProps
  className?: string
  bodyClassName?: string
  noPadding?: boolean
  children?: ReactNode
}

export function TerminalCard({ header, className, bodyClassName, noPadding, children }: TerminalCardProps) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-border bg-card", className)}>
      {header && <TerminalCardHeader {...header} />}
      {children != null && (
        <div className={cn(noPadding ? undefined : "p-5", bodyClassName)}>{children}</div>
      )}
    </div>
  )
}
