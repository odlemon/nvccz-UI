"use client"

import { cn } from "@/lib/utils"

export type TerminalStatusVariant = "green" | "red" | "yellow" | "blue" | "gray"

const VARIANT_CLASSES: Record<TerminalStatusVariant, string> = {
  green: "bg-gain-muted text-gain-foreground ring-gain/30",
  red: "bg-loss-muted text-loss-foreground ring-loss/30",
  yellow: "bg-warn-muted text-warn-foreground ring-warn/30",
  blue: "bg-accent text-accent-foreground ring-primary/20",
  gray: "bg-muted text-muted-foreground ring-border",
}

/**
 * Built-in status vocabulary → tone mapping.
 *
 * Covers:
 *  - Trade.status            (DRAFT / EXECUTED / ROUTING / SETTLED / SETTLEMENT_FAILED / CANCELLED)
 *  - RoutingHop.status       (STAGED / DISPATCHED / CONFIRMED / RETRYING / FAILED / SKIPPED)
 *  - Side                    (BUY / SELL)
 *  - order-status.ts derived (PENDING / SETTLED / POSTED / CONFIRMED / RETRYING / FAILED / N/A)
 *  - SRD lifecycle terms     (SUBMITTED / COMPLIANCE_REVIEW / PARTIALLY_EXECUTED / SENT_TO_BROKER /
 *                             PENDING_SETTLEMENT / ARCHIVED / PASS / BREACH / WARNING)
 *
 * NOTE: the SRD's richer lifecycle (Draft → Submitted → Compliance Review → Approved →
 * Sent to Broker → Partially Executed → Executed → Pending Settlement → Settled, alt.
 * Cancelled/Rejected/Failed/Archived) does not fully map onto the real Trade.status enum today.
 * "COMPLIANCE_REVIEW" and "PARTIALLY_EXECUTED" are unreachable with real data this phase —
 * they're included here only so a future lifecycle-stepper can render them as reserved states,
 * not to imply the backend currently produces them.
 */
const STATUS_VOCABULARY: Record<string, TerminalStatusVariant> = {
  // Trade.status
  DRAFT: "gray",
  EXECUTED: "blue",
  ROUTING: "yellow",
  SETTLED: "green",
  SETTLEMENT_FAILED: "red",
  CANCELLED: "gray",

  // RoutingHop.status
  STAGED: "gray",
  DISPATCHED: "blue",
  CONFIRMED: "green",
  RETRYING: "yellow",
  FAILED: "red",
  SKIPPED: "gray",

  // Side
  BUY: "green",
  SELL: "red",

  // order-status.ts derived labels
  PENDING: "yellow",
  POSTED: "green",
  "N/A": "gray",

  // SRD lifecycle terms
  SUBMITTED: "blue",
  COMPLIANCE_REVIEW: "yellow",
  APPROVED: "green",
  PARTIALLY_EXECUTED: "yellow",
  SENT_TO_BROKER: "blue",
  PENDING_SETTLEMENT: "yellow",
  ARCHIVED: "gray",
  PASS: "green",
  BREACH: "red",
  WARNING: "yellow",
  REJECTED: "red",

  // Orderbook / mock lifecycle terms
  WORKING: "blue",
  PARTIAL: "yellow",
  FILLED: "green",
  ACTIVE: "green",
  BACKTESTING: "yellow",
  DISABLED: "gray",
}

interface TerminalStatusBadgeProps {
  status: string
  variant?: TerminalStatusVariant
  label?: string
  className?: string
}

export function TerminalStatusBadge({ status, variant, label, className }: TerminalStatusBadgeProps) {
  const tone = variant ?? STATUS_VOCABULARY[status] ?? "gray"
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        VARIANT_CLASSES[tone],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {label ?? status.replace(/_/g, " ")}
    </span>
  )
}
