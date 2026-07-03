"use client"

import { cn } from "@/lib/utils"
import type { Trade, RoutingHop } from "@/lib/api/investments-api"

// ─── Delta — colored +/- percentage, gain/loss toned ───────────────────────
interface DeltaProps {
  value: number | null | undefined
  direction?: "UP" | "DOWN" | "FLAT"
  suffix?: string
  showIcon?: boolean
  className?: string
}

export function Delta({ value, direction, suffix = "%", className }: DeltaProps) {
  if (value == null) {
    return <span className={cn("font-mono tabular-nums text-muted-foreground", className)}>—</span>
  }
  const dir = direction ?? (value > 0 ? "UP" : value < 0 ? "DOWN" : "FLAT")
  const tone = dir === "UP" ? "text-gain" : dir === "DOWN" ? "text-loss" : "text-muted-foreground"
  return (
    <span className={cn("font-mono tabular-nums", tone, className)}>
      {value > 0 ? "+" : ""}{value.toFixed(2)}{suffix}
    </span>
  )
}

// ─── DirectionDot — small up/down/flat dot ─────────────────────────────────
export function DirectionDot({ direction, className }: { direction?: "UP" | "DOWN" | "FLAT"; className?: string }) {
  const map: Record<string, string> = { UP: "bg-gain", DOWN: "bg-loss", FLAT: "bg-muted-foreground" }
  return <span className={cn("inline-block size-1.5 rounded-full", map[direction ?? "FLAT"], className)} aria-hidden />
}

// ─── TradeStatusBadge ───────────────────────────────────────────────────────
const TRADE_TONES: Record<Trade["status"], string> = {
  DRAFT: "bg-muted text-muted-foreground ring-border",
  EXECUTED: "bg-accent text-accent-foreground ring-primary/20",
  ROUTING: "bg-warn-muted text-warn-foreground ring-warn/30",
  SETTLED: "bg-gain-muted text-gain-foreground ring-gain/30",
  SETTLEMENT_FAILED: "bg-loss-muted text-loss-foreground ring-loss/30",
  CANCELLED: "bg-muted text-muted-foreground ring-border",
}

export function TradeStatusBadge({ status, className }: { status: Trade["status"]; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset", TRADE_TONES[status] ?? TRADE_TONES.DRAFT, className)}>
      <span className="size-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {status.replace(/_/g, " ")}
    </span>
  )
}

// ─── RoutingStatusBadge ─────────────────────────────────────────────────────
const ROUTING_TONES: Record<RoutingHop["status"], string> = {
  STAGED: "bg-muted text-muted-foreground ring-border",
  DISPATCHED: "bg-accent text-accent-foreground ring-primary/20",
  CONFIRMED: "bg-gain-muted text-gain-foreground ring-gain/30",
  RETRYING: "bg-warn-muted text-warn-foreground ring-warn/30",
  FAILED: "bg-loss-muted text-loss-foreground ring-loss/30",
}
const SKIPPED_TONE = "bg-transparent text-muted-foreground ring-border ring-dashed"

interface RoutingStatusBadgeProps {
  status: RoutingHop["status"]
  skipped?: boolean
  attemptCount?: number
  className?: string
}

export function RoutingStatusBadge({ status, skipped, attemptCount, className }: RoutingStatusBadgeProps) {
  const label = skipped
    ? "SKIPPED"
    : `${status.replace(/_/g, " ")}${status === "RETRYING" && attemptCount != null ? ` (${attemptCount}/5)` : ""}`
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset", skipped ? SKIPPED_TONE : (ROUTING_TONES[status] ?? ROUTING_TONES.STAGED), className)}>
      {label}
    </span>
  )
}

// ─── ValidationBadge — PriceTick.validationStatus / ValidationQueueItem ────
const VALIDATION_TONES: Record<string, string> = {
  APPROVED: "bg-gain-muted text-gain-foreground ring-gain/30",
  PENDING_REVIEW: "bg-warn-muted text-warn-foreground ring-warn/30",
  REJECTED: "bg-loss-muted text-loss-foreground ring-loss/30",
}

export function ValidationBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset", VALIDATION_TONES[status] ?? "bg-muted text-muted-foreground ring-border", className)}>
      {status.replace(/_/g, " ")}
    </span>
  )
}

// ─── SourceBadge — PriceTick.sourceStatus / IngestBatch.source_status (OK|FALLBACK) ──
export function SourceBadge({ status, className }: { status: "OK" | "FALLBACK" | string; className?: string }) {
  return status === "FALLBACK" ? (
    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset bg-warn-muted text-warn-foreground ring-warn/30", className)}>
      FALLBACK
    </span>
  ) : (
    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset bg-accent text-accent-foreground ring-primary/20", className)}>
      OK
    </span>
  )
}

// ─── ExchangeTag ────────────────────────────────────────────────────────────
export function ExchangeTag({ exchange, className }: { exchange: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide text-muted-foreground", className)}>
      {exchange}
    </span>
  )
}

// ─── SideBadge — BUY/SELL ───────────────────────────────────────────────────
export function SideBadge({ side, className }: { side: "BUY" | "SELL"; className?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
      side === "BUY" ? "bg-gain-muted text-gain-foreground ring-gain/30" : "bg-loss-muted text-loss-foreground ring-loss/30",
      className
    )}>
      <span className="size-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {side}
    </span>
  )
}
