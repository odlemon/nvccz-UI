"use client"

import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

interface TerminalTableProps {
  children: ReactNode
  className?: string
  minWidth?: string
}

export function TerminalTable({ children, className, minWidth = "900px" }: TerminalTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("terminal-table w-full text-sm", className)} style={{ minWidth }}>
        {children}
      </table>
    </div>
  )
}

export function TerminalThead({ children, className }: { children: ReactNode; className?: string }) {
  return <thead className={className}>{children}</thead>
}

export function TerminalTbody({ children, className }: { children: ReactNode; className?: string }) {
  return <tbody className={className}>{children}</tbody>
}

interface TerminalTrProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  interactive?: boolean
  /** Alias for `interactive` (some callers use this name). */
  clickable?: boolean
}

export function TerminalTr({ children, className, onClick, interactive, clickable }: TerminalTrProps) {
  const isInteractive = onClick != null || interactive || clickable
  return (
    <tr
      onClick={onClick}
      data-clickable={isInteractive ? "true" : undefined}
      className={cn(isInteractive && "group cursor-pointer", className)}
    >
      {children}
    </tr>
  )
}

interface TerminalThProps extends ThHTMLAttributes<HTMLTableCellElement> {
  align?: "left" | "center" | "right"
}

export function TerminalTh({ align = "left", className, children, ...props }: TerminalThProps) {
  return (
    <th
      className={cn(
        "px-4 py-3 font-medium",
        align === "left" && "text-left",
        align === "center" && "text-center",
        align === "right" && "text-right",
        className,
      )}
      {...props}
    >
      {children}
    </th>
  )
}

interface TerminalTdProps extends TdHTMLAttributes<HTMLTableCellElement> {
  align?: "left" | "center" | "right"
  /** Applies font-mono tabular-nums — use for numeric/currency columns. */
  mono?: boolean
}

export function TerminalTd({ align = "left", mono = false, className, children, ...props }: TerminalTdProps) {
  return (
    <td
      className={cn(
        "px-4 py-3",
        align === "left" && "text-left",
        align === "center" && "text-center",
        align === "right" && "text-right",
        mono && "font-mono tabular-nums",
        className,
      )}
      {...props}
    >
      {children}
    </td>
  )
}

export function TerminalEmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-muted-foreground">
        {children}
      </td>
    </tr>
  )
}
