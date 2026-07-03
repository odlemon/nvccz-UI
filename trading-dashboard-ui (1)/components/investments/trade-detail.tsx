"use client"

import Link from "next/link"
import { notFound } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  ArrowLeft, Check, X, Loader2, Minus, RefreshCw, Copy, FileText,
} from "lucide-react"
import { toast } from "sonner"
import { money, qty as fmtQty } from "@/lib/investments/format"
import { TRADES, isSkippedInternal, type RoutingHop } from "@/lib/investments/mock-data"
import { TradeStatusBadge, ExchangeTag, RoutingStatusBadge } from "@/components/investments/status-pills"

const HOP_LABEL: Record<string, string> = {
  BROKER: "Broker Execution",
  CUSTODIAN: "Custodian Settlement",
  CORE_BANKING: "Core Banking Posting",
  ACCOUNTING_GL: "Accounting GL Journal",
}

function fmtTime(iso?: string) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  })
}

function HopIcon({ hop }: { hop: RoutingHop }) {
  if (isSkippedInternal(hop)) return <Minus className="h-4 w-4" />
  switch (hop.status) {
    case "CONFIRMED": return <Check className="h-4 w-4" strokeWidth={3} />
    case "RETRYING": return <Loader2 className="h-4 w-4 animate-spin" />
    case "FAILED": return <X className="h-4 w-4" strokeWidth={3} />
    case "DISPATCHED": return <RefreshCw className="h-4 w-4" />
    default: return <span className="h-1.5 w-1.5 rounded-full bg-current" />
  }
}

function hopRing(hop: RoutingHop) {
  if (isSkippedInternal(hop)) return "bg-muted text-muted-foreground ring-border"
  switch (hop.status) {
    case "CONFIRMED": return "bg-gain text-white ring-gain/30"
    case "DISPATCHED": return "bg-primary text-primary-foreground ring-primary/30"
    case "RETRYING": return "bg-warn text-white ring-warn/30"
    case "FAILED": return "bg-loss text-white ring-loss/30"
    default: return "bg-muted text-muted-foreground ring-border"
  }
}

export function TradeDetail({ tradeId }: { tradeId: string }) {
  const trade = TRADES.find((t) => t.id === tradeId)
  if (!trade) return notFound()

  const notional = trade.executionPrice * trade.quantity
  const copyRef = () => {
    navigator.clipboard?.writeText(trade.tradeRef)
    toast.success("Trade ref copied")
  }

  return (
    <div className="space-y-5">
      <Link href="/trades" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to blotter
      </Link>

      {/* Header card */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <button onClick={copyRef} className="inline-flex items-center gap-1.5 font-mono text-lg font-semibold text-foreground hover:text-primary">
                {trade.tradeRef} <Copy className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              <TradeStatusBadge status={trade.status} />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={cn(
                  "rounded-md px-2 py-0.5 text-xs font-semibold",
                  trade.side === "BUY" ? "bg-gain-muted text-gain-foreground" : "bg-loss-muted text-loss-foreground",
                )}
              >
                {trade.side}
              </span>
              <span className="font-mono text-sm font-semibold text-foreground">{trade.security.symbol}</span>
              <ExchangeTag code={trade.security.exchangeCode} />
              <span className="text-sm text-muted-foreground">{trade.security.name}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">
              <FileText className="h-4 w-4" /> Audit log
            </button>
            {(trade.status === "SETTLEMENT_FAILED" || trade.routingHops.some((h) => h.status === "FAILED" || h.status === "RETRYING")) && (
              <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
                <RefreshCw className="h-4 w-4" /> Retry routing
              </button>
            )}
          </div>
        </div>

        {/* Economics grid */}
        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-5 sm:grid-cols-3 lg:grid-cols-5">
          <Field label="Quantity" value={fmtQty(trade.quantity)} />
          <Field label="Execution price" value={`${money(trade.executionPrice)} ${trade.executionCurrencyCode}`} />
          <Field label="Notional" value={`$${money(notional)}`} />
          <Field label="Fees" value={`$${money(trade.fees)}`} />
          <Field label="Net" value={`$${money(trade.side === "BUY" ? notional + trade.fees : notional - trade.fees)}`} strong />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Routing timeline */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Routing & Settlement Pipeline</h2>
              <p className="text-xs text-muted-foreground">Sequential dispatch across downstream systems</p>
            </div>
          </div>

          {trade.routingHops.length === 0 ? (
            <div className="mt-6 rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
              This trade is a draft and has not been routed yet.
            </div>
          ) : (
            <ol className="mt-5 space-y-0">
              {trade.routingHops.map((hop, i) => {
                const last = i === trade.routingHops.length - 1
                const skipped = isSkippedInternal(hop)
                return (
                  <li key={hop.id} className="relative flex gap-4 pb-6 last:pb-0">
                    {!last && <span className="absolute left-4 top-9 h-full w-px bg-border" aria-hidden />}
                    <span className={cn("z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-2 ring-inset", hopRing(hop))}>
                      <HopIcon hop={hop} />
                    </span>
                    <div className="min-w-0 flex-1 rounded-lg border border-border bg-background p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-medium text-foreground">{HOP_LABEL[hop.target]}</span>
                        {skipped ? (
                          <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground ring-1 ring-inset ring-border">
                            SKIPPED · INTERNAL
                          </span>
                        ) : (
                          <RoutingStatusBadge status={hop.status} />
                        )}
                      </div>
                      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-3">
                        <Meta label="Attempts" value={String(hop.attemptCount)} />
                        <Meta label="External ref" value={skipped ? "—" : hop.externalRef ?? "—"} mono />
                        <Meta label="Confirmed" value={fmtTime(hop.confirmedAt ?? hop.dispatchedAt)} />
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
        </div>

        {/* Timeline / meta */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">Lifecycle</h2>
            <ul className="mt-4 space-y-4 text-sm">
              <TimelineItem label="Executed" time={fmtTime(trade.executedAt)} done={!!trade.executedAt} />
              <TimelineItem label="Routing dispatched" time={trade.routingHops.length ? fmtTime(trade.routingHops[0].dispatchedAt) : "—"} done={trade.routingHops.length > 0} />
              <TimelineItem
                label="GL posted"
                time={fmtTime(trade.routingHops.find((h) => h.target === "ACCOUNTING_GL")?.confirmedAt)}
                done={trade.routingHops.find((h) => h.target === "ACCOUNTING_GL")?.status === "CONFIRMED"}
                failed={trade.routingHops.find((h) => h.target === "ACCOUNTING_GL")?.status === "FAILED"}
              />
              <TimelineItem label="Settled" time={fmtTime(trade.settledAt)} done={!!trade.settledAt} last />
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("mt-1 font-mono tabular-nums", strong ? "text-base font-semibold text-foreground" : "text-sm text-foreground")}>
        {value}
      </p>
    </div>
  )
}

function Meta({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className={cn("text-foreground", mono && "font-mono")}>{value}</dd>
    </div>
  )
}

function TimelineItem({
  label, time, done, failed, last,
}: {
  label: string; time: string; done?: boolean; failed?: boolean; last?: boolean
}) {
  return (
    <li className="relative flex gap-3">
      {!last && <span className="absolute left-[7px] top-5 h-full w-px bg-border" aria-hidden />}
      <span
        className={cn(
          "z-10 mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full ring-2 ring-inset",
          failed ? "bg-loss ring-loss/30" : done ? "bg-gain ring-gain/30" : "bg-muted ring-border",
        )}
      />
      <div className="flex-1 leading-tight">
        <p className={cn("font-medium", failed ? "text-loss" : done ? "text-foreground" : "text-muted-foreground")}>{label}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </li>
  )
}
