import { cn } from "@/lib/utils"
import type {
  Direction,
  RoutingStatus,
  TradeStatus,
  ValidationStatus,
} from "@/lib/investments/mock-data"

export function Delta({
  value,
  className,
  showSign = true,
}: {
  value: number
  className?: string
  showSign?: boolean
}) {
  const tone =
    value > 0 ? "text-gain" : value < 0 ? "text-loss" : "text-muted-foreground"
  return (
    <span className={cn("font-mono tabular-nums", tone, className)}>
      {showSign && value > 0 ? "+" : ""}
      {value.toFixed(2)}%
    </span>
  )
}

export function DirectionDot({ direction }: { direction: Direction }) {
  const map: Record<Direction, string> = {
    UP: "bg-gain",
    DOWN: "bg-loss",
    FLAT: "bg-muted-foreground",
  }
  return <span className={cn("inline-block size-1.5 rounded-full", map[direction])} aria-hidden />
}

const TRADE_TONES: Record<TradeStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground ring-border",
  EXECUTED: "bg-accent text-accent-foreground ring-primary/20",
  ROUTING: "bg-warn-muted text-warn-foreground ring-warn/30",
  SETTLED: "bg-gain-muted text-gain-foreground ring-gain/30",
  SETTLEMENT_FAILED: "bg-loss-muted text-loss-foreground ring-loss/30",
  CANCELLED: "bg-muted text-muted-foreground ring-border",
}

export function TradeStatusBadge({ status }: { status: TradeStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        TRADE_TONES[status],
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {status.replace(/_/g, " ")}
    </span>
  )
}

const ROUTING_TONES: Record<RoutingStatus, string> = {
  STAGED: "bg-muted text-muted-foreground ring-border",
  DISPATCHED: "bg-accent text-accent-foreground ring-primary/20",
  CONFIRMED: "bg-gain-muted text-gain-foreground ring-gain/30",
  RETRYING: "bg-warn-muted text-warn-foreground ring-warn/30",
  FAILED: "bg-loss-muted text-loss-foreground ring-loss/30",
}

export function RoutingStatusBadge({ status }: { status: RoutingStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        ROUTING_TONES[status],
      )}
    >
      {status}
    </span>
  )
}

const VALIDATION_TONES: Record<ValidationStatus, string> = {
  APPROVED: "bg-gain-muted text-gain-foreground ring-gain/30",
  PENDING_REVIEW: "bg-warn-muted text-warn-foreground ring-warn/30",
  REJECTED: "bg-loss-muted text-loss-foreground ring-loss/30",
}

export function ValidationBadge({ status }: { status: ValidationStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        VALIDATION_TONES[status],
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  )
}

export function ExchangeTag({ code }: { code: string }) {
  return (
    <span className="inline-flex items-center rounded border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
      {code}
    </span>
  )
}
