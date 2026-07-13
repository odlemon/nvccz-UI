"use client"

import { AlertCircle, Calculator, Lock, Pencil } from "lucide-react"
import type { FpaCellStatus } from "@/lib/api/fpa-api"
import { cn } from "@/lib/utils"

export type GridMode = "builder" | "planning"

export function normalizeCellStatus(
  status?: FpaCellStatus | null,
  opts?: { isEditable?: boolean | null; isLocked?: boolean | null; hasFormula?: boolean },
): FpaCellStatus {
  if (status) return String(status).toUpperCase()
  if (opts?.isLocked) return "LOCKED"
  if (opts?.hasFormula || opts?.isEditable === false) return "CALCULATED"
  return "INPUT"
}

export function cellStateMeta(status: FpaCellStatus) {
  const s = String(status).toUpperCase()
  if (s === "ACTUAL" || s === "IMPORTED") {
    return { label: "Actual", Icon: Lock, hint: "Actual / imported — read-only" }
  }
  if (s === "LOCKED") {
    return { label: "Locked", Icon: Lock, hint: "Locked — read-only" }
  }
  if (s === "CALCULATED" || s === "PENDING_CALCULATION") {
    return { label: s === "PENDING_CALCULATION" ? "Pending" : "Calculated", Icon: Calculator, hint: "Formula-driven — not editable" }
  }
  if (s === "ERROR") {
    return { label: "Error", Icon: AlertCircle, hint: "Validation error" }
  }
  return { label: "Input", Icon: Pencil, hint: "Editable input" }
}

export function CellStateBadge({
  status,
  className,
}: {
  status: FpaCellStatus
  className?: string
}) {
  const { label, Icon } = cellStateMeta(status)
  const s = String(status).toUpperCase()
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium",
        (s === "INPUT" || s === "OVERRIDE") && "bg-[#eff6ff] text-[#1d4ed8]",
        (s === "CALCULATED" || s === "PENDING_CALCULATION") && "bg-[#f1f5f9] text-[#475569]",
        (s === "ACTUAL" || s === "IMPORTED" || s === "LOCKED") && "bg-[#f8fafc] text-[#64748b]",
        s === "ERROR" && "bg-[#fef2f2] text-[#b91c1c]",
        className,
      )}
      title={cellStateMeta(status).hint}
    >
      <Icon className="w-3 h-3" aria-hidden />
      {label}
    </span>
  )
}

export function isCellEditableInPlanning(status: FpaCellStatus, permitted: boolean) {
  if (!permitted) return false
  const s = String(status).toUpperCase()
  return s === "INPUT" || s === "OVERRIDE"
}

/** Line-item type for builder: INPUT/Driver vs CALCULATED. */
export function lineItemKind(li: {
  lineItemType?: string
  dataType?: string
  isEditable?: boolean
  formulas?: unknown[]
}): "INPUT" | "CALCULATED" {
  const t = String(li.lineItemType || li.dataType || "").toUpperCase()
  if (t.includes("CALC") || t === "FORMULA") return "CALCULATED"
  if (li.formulas && li.formulas.length > 0 && li.isEditable === false) return "CALCULATED"
  if (t.includes("DRIVER") || t === "INPUT" || li.isEditable !== false) return "INPUT"
  if (li.formulas?.length) return "CALCULATED"
  return "INPUT"
}
