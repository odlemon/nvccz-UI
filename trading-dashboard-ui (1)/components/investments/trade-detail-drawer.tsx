"use client"

import Link from "next/link"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  Check,
  X,
  Loader2,
  Minus,
  ExternalLink,
  RefreshCw,
  Ban,
  Zap,
  Download,
  Copy,
  FileText,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { money, qty as fmtQty } from "@/lib/investments/format"
import {
  isSkippedInternal,
  type Trade,
  type RoutingHop,
  type RoutingTarget,
} from "@/lib/investments/mock-data"
import { TradeStatusBadge, ExchangeTag, RoutingStatusBadge } from "@/components/investments/status-pills"

const HOP_LABELS: Record<RoutingTarget, string> = {
  BROKER: "Broker",
  CUSTODIAN: "Custodian",
  CORE_BANKING: "Core Banking",
  ACCOUNTING_GL: "Accounting GL",
}

function fmtTime(iso?: string) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

function hopNode(hop: RoutingHop) {
  if (isSkippedInternal(hop)) return { ring: "border-border bg-muted text-muted-foreground", icon: <Minus className="h-3.5 w-3.5" /> }
  switch (hop.status) {
    case "CONFIRMED":
      return { ring: "border-gain/40 bg-gain text-white", icon: <Check className="h-3.5 w-3.5" strokeWidth={3} /> }
    case "DISPATCHED":
      return { ring: "border-primary/40 bg-primary text-primary-foreground", icon: <Zap className="h-3.5 w-3.5" /> }
    case "RETRYING":
      return { ring: "border-warn/40 bg-warn text-white", icon: <Loader2 className="h-3.5 w-3.5 animate-spin" /> }
    case "FAILED":
      return { ring: "border-loss/40 bg-loss text-white", icon: <X className="h-3.5 w-3.5" strokeWidth={3} /> }
    default:
      return { ring: "border-border bg-muted text-muted-foreground", icon: <span className="h-1.5 w-1.5 rounded-full bg-current" /> }
  }
}

export function TradeDetailDrawer({
  trade,
  open,
  onOpenChange,
}: {
  trade: Trade | null
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  if (!trade) return null

  const notional = trade.executionPrice * trade.quantity
  const net = trade.side === "BUY" ? notional + trade.fees : notional - trade.fees
  const failedHop = trade.routingHops.find((h) => h.status === "FAILED")
  const retryingHop = trade.routingHops.find((h) => h.status === "RETRYING")
  const canRetry = Boolean(failedHop || retryingHop)
  const canCancel = trade.status === "DRAFT" || trade.status === "ROUTING"
  const canForceSettle = trade.status === "SETTLEMENT_FAILED"

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="space-y-0 border-b border-border p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold",
                    trade.side === "BUY" ? "bg-gain-muted text-gain-foreground" : "bg-loss-muted text-loss-foreground",
                  )}
                >
                  {trade.side}
                </span>
                <SheetTitle className="font-mono text-base">{trade.security.symbol}</SheetTitle>
                <ExchangeTag code={trade.security.exchangeCode} />
              </div>
              <SheetDescription className="mt-1 text-xs">{trade.security.name}</SheetDescription>
            </div>
            <TradeStatusBadge status={trade.status} />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <code className="rounded bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">{trade.tradeRef}</code>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(trade.tradeRef)
                toast.success("Trade ref copied")
              }}
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Copy trade reference"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          {/* Economics */}
          <section>
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Economics</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Quantity" value={fmtQty(trade.quantity)} mono />
              <Field label="Execution price" value={`${money(trade.executionPrice)} ${trade.executionCurrencyCode}`} mono />
              <Field label="Gross notional" value={`$${money(notional)}`} mono />
              <Field label="Fees & charges" value={`$${money(trade.fees)}`} mono />
              <div className="col-span-2 rounded-lg border border-primary/20 bg-accent/60 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {trade.side === "BUY" ? "Net settlement (payable)" : "Net proceeds (receivable)"}
                </p>
                <p className="mt-0.5 font-mono text-xl font-semibold text-foreground">${money(net)}</p>
              </div>
            </div>
          </section>

          {/* Timeline */}
          <section>
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Routing & settlement
            </h3>
            {trade.routingHops.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                Trade is still a draft — not yet routed.
              </p>
            ) : (
              <ol className="relative space-y-4 pl-1">
                {trade.routingHops.map((hop, i) => {
                  const node = hopNode(hop)
                  const skipped = isSkippedInternal(hop)
                  return (
                    <li key={hop.id} className="relative flex gap-3">
                      {i < trade.routingHops.length - 1 && (
                        <span className="absolute left-[13px] top-7 h-[calc(100%-4px)] w-px bg-border" aria-hidden />
                      )}
                      <span className={cn("z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border", node.ring)}>
                        {node.icon}
                      </span>
                      <div className="flex-1 rounded-lg border border-border bg-card p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-foreground">{HOP_LABELS[hop.target]}</span>
                          {skipped ? (
                            <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                              SKIPPED · INTERNAL
                            </span>
                          ) : (
                            <RoutingStatusBadge status={hop.status} />
                          )}
                        </div>
                        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                          <Meta label="External ref" value={skipped ? "—" : hop.externalRef ?? "—"} />
                          <Meta label="Attempts" value={String(hop.attemptCount)} />
                          <Meta label="Dispatched" value={fmtTime(hop.dispatchedAt)} />
                          <Meta label="Confirmed" value={fmtTime(hop.confirmedAt)} />
                        </dl>
                        {hop.lastError && (
                          <p className="mt-2 rounded-md bg-loss-muted px-2 py-1.5 font-mono text-[11px] text-loss-foreground">
                            {hop.lastError}
                          </p>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ol>
            )}
          </section>
        </div>

        {/* Action footer */}
        <div className="border-t border-border bg-card p-4">
          <div className="grid grid-cols-2 gap-2">
            {canRetry && (
              <ActionButton
                tone="primary"
                icon={RefreshCw}
                label="Retry routing"
                onClick={() => toast.success(`Re-dispatching ${trade.tradeRef}`, { description: "Routing hops re-queued." })}
              />
            )}
            {canForceSettle && (
              <ActionButton
                tone="primary"
                icon={Zap}
                label="Force settle"
                onClick={() => toast.success(`Force-settling ${trade.tradeRef}`, { description: "Manual GL posting queued." })}
              />
            )}
            <ActionButton
              tone="ghost"
              icon={FileText}
              label="View journal"
              onClick={() => toast("Opening journal entries", { description: trade.tradeRef })}
            />
            <ActionButton
              tone="ghost"
              icon={Download}
              label="Export confirm"
              onClick={() => toast.success("Trade confirmation exported")}
            />
            {canCancel && (
              <ActionButton
                tone="danger"
                icon={Ban}
                label="Cancel trade"
                onClick={() => {
                  toast.error(`${trade.tradeRef} cancelled`)
                  onOpenChange(false)
                }}
              />
            )}
            <Link
              href={`/trades/${trade.id}`}
              className="col-span-2 inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Open full trade page <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 text-sm font-semibold text-foreground", mono && "font-mono tabular-nums")}>{value}</p>
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-mono text-foreground">{value}</dd>
    </div>
  )
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: () => void
  tone: "primary" | "ghost" | "danger"
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        tone === "primary" && "bg-primary text-primary-foreground hover:opacity-90",
        tone === "ghost" && "border border-border bg-background text-foreground hover:bg-muted",
        tone === "danger" && "border border-loss/30 bg-loss-muted text-loss-foreground hover:bg-loss/20",
      )}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  )
}
