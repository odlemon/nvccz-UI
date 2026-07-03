"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  TrendingUp, TrendingDown, Minus,
  CheckCircle2, Clock, XCircle, RotateCcw,
} from "lucide-react"
import type { Trade, RoutingHop } from "@/lib/api/investments-api"

// ─── Delta — colored +/- value/percentage pill ─────────────────────────────
interface DeltaProps {
  value: number | null | undefined
  direction?: "UP" | "DOWN" | "FLAT"
  suffix?: string
  showIcon?: boolean
  className?: string
}

export function Delta({ value, direction, suffix = "%", showIcon = false, className }: DeltaProps) {
  if (value == null) {
    return <span className={cn("font-mono text-[#6B7280]", className)}>—</span>
  }
  const dir = direction ?? (value > 0 ? "UP" : value < 0 ? "DOWN" : "FLAT")
  const color = dir === "UP" ? "text-[#10B981]" : dir === "DOWN" ? "text-[#EF4444]" : "text-[#6B7280]"
  return (
    <span className={cn("inline-flex items-center gap-1 font-mono", color, className)}>
      {showIcon && <DirectionDot direction={dir} />}
      {value >= 0 ? "+" : ""}{value.toFixed(2)}{suffix}
    </span>
  )
}

// ─── DirectionDot — small up/down/flat icon ────────────────────────────────
export function DirectionDot({ direction, className }: { direction?: "UP" | "DOWN" | "FLAT"; className?: string }) {
  if (direction === "UP") return <TrendingUp className={cn("w-3.5 h-3.5 text-[#10B981]", className)} />
  if (direction === "DOWN") return <TrendingDown className={cn("w-3.5 h-3.5 text-[#EF4444]", className)} />
  return <Minus className={cn("w-3.5 h-3.5 text-[#6B7280]", className)} />
}

// ─── TradeStatusBadge ───────────────────────────────────────────────────────
const TRADE_STATUS_MAP: Record<Trade["status"], { label: string; className: string; icon: React.ReactNode }> = {
  DRAFT:             { label: "Draft",     className: "bg-slate-100 text-slate-600",     icon: <Clock className="w-3 h-3" /> },
  EXECUTED:          { label: "Executed",  className: "bg-blue-100 text-blue-700",       icon: <CheckCircle2 className="w-3 h-3" /> },
  ROUTING:           { label: "Routing",   className: "bg-amber-100 text-amber-700",     icon: <RotateCcw className="w-3 h-3" /> },
  SETTLED:           { label: "Settled",   className: "bg-emerald-100 text-emerald-700", icon: <CheckCircle2 className="w-3 h-3" /> },
  SETTLEMENT_FAILED: { label: "Failed",    className: "bg-red-100 text-red-700",         icon: <XCircle className="w-3 h-3" /> },
  CANCELLED:         { label: "Cancelled", className: "bg-slate-100 text-slate-500",     icon: <XCircle className="w-3 h-3" /> },
}

export function TradeStatusBadge({ status, className }: { status: Trade["status"]; className?: string }) {
  const s = TRADE_STATUS_MAP[status] ?? TRADE_STATUS_MAP.DRAFT
  return (
    <Badge className={cn("gap-1 text-xs font-medium border-0", s.className, className)}>
      {s.icon}{s.label}
    </Badge>
  )
}

// ─── RoutingStatusBadge ─────────────────────────────────────────────────────
const ROUTING_STATUS_MAP: Record<RoutingHop["status"], string> = {
  STAGED:     "bg-slate-100 text-slate-600 border-slate-300",
  DISPATCHED: "bg-blue-100 text-blue-700 border-blue-300",
  CONFIRMED:  "bg-emerald-100 text-emerald-700 border-emerald-300",
  RETRYING:   "bg-amber-100 text-amber-700 border-amber-300",
  FAILED:     "bg-red-100 text-red-700 border-red-300",
}
const SKIPPED_CLASS = "border-dashed border-slate-300 text-slate-400 bg-transparent"

interface RoutingStatusBadgeProps {
  status: RoutingHop["status"]
  skipped?: boolean
  attemptCount?: number
  className?: string
}

export function RoutingStatusBadge({ status, skipped, attemptCount, className }: RoutingStatusBadgeProps) {
  const badgeCls = skipped ? SKIPPED_CLASS : (ROUTING_STATUS_MAP[status] ?? ROUTING_STATUS_MAP.STAGED)
  const label = skipped
    ? "SKIPPED (INTERNAL)"
    : `${status.replace("_", " ")}${status === "RETRYING" && attemptCount != null ? ` (${attemptCount}/5)` : ""}`
  return (
    <Badge className={cn("text-[10px] font-mono border", badgeCls, className)}>
      {label}
    </Badge>
  )
}

// ─── ValidationBadge — PriceTick.validationStatus / ValidationQueueItem ────
const VALIDATION_MAP: Record<string, string> = {
  APPROVED: "bg-emerald-100 text-emerald-700",
  PENDING_REVIEW: "bg-amber-100 text-amber-700",
  REJECTED: "bg-red-100 text-red-700",
}

export function ValidationBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span className={cn("inline-flex text-[10px] font-medium px-1.5 py-0.5 rounded-full", VALIDATION_MAP[status] ?? "bg-gray-100 text-gray-600", className)}>
      {status.replace(/_/g, " ")}
    </span>
  )
}

// ─── SourceBadge — PriceTick.sourceStatus / IngestBatch.source_status (OK|FALLBACK) ──
export function SourceBadge({ status, className }: { status: "OK" | "FALLBACK" | string; className?: string }) {
  return status === "FALLBACK" ? (
    <span className={cn("inline-flex text-[10px] font-medium px-1.5 py-0.5 rounded-full border border-dashed border-slate-300 text-slate-500", className)}>
      FALLBACK
    </span>
  ) : (
    <span className={cn("inline-flex text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700", className)}>
      OK
    </span>
  )
}

// ─── ExchangeTag ────────────────────────────────────────────────────────────
const INTL_EXCHANGES = ["NYSE", "NASDAQ", "LSE", "VFEX"]

export function ExchangeTag({ exchange, className }: { exchange: string; className?: string }) {
  const intl = INTL_EXCHANGES.includes(exchange)
  return (
    <Badge
      variant="outline"
      className={cn("text-[10px] px-1 py-0 font-mono", intl ? "border-blue-400 text-blue-500" : "border-slate-400 text-slate-500", className)}
    >
      {exchange}
    </Badge>
  )
}

// ─── SideBadge — BUY/SELL ───────────────────────────────────────────────────
export function SideBadge({ side, className }: { side: "BUY" | "SELL"; className?: string }) {
  return (
    <Badge className={cn("gap-1 text-xs border-0", side === "BUY" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700", className)}>
      {side === "BUY" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {side}
    </Badge>
  )
}
