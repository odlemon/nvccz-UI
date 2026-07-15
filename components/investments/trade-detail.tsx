"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchTrade, retryHop } from "@/lib/store/slices/investmentsSlice"
import { isSkippedInternal } from "@/lib/api/investments-api"
import { settlementStatus, accountingStatus, confirmationStatus } from "@/lib/utils/order-status"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, RefreshCw, Copy } from "lucide-react"
import { toast } from "sonner"
import { TradeStatusBadge } from "./status-pills"
import { RoutingPipeline } from "./routing-pipeline"
import { TerminalCard } from "./terminal/card"
import { TerminalStatusBadge } from "./terminal/status-badge"

const HOP_LABEL: Record<string, string> = {
  BROKER: "Broker Execution",
  CUSTODIAN: "Custodian Settlement",
  CORE_BANKING: "Core Banking Posting",
  ACCOUNTING_GL: "Accounting GL Journal",
}

function fmtTime(iso?: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

interface TradeDetailProps {
  tradeId: string
}

export function TradeDetail({ tradeId }: TradeDetailProps) {
  const dispatch = useAppDispatch()
  const router   = useRouter()
  const { selectedTrade, selectedTradeLoading } = useAppSelector((s) => s.investments)

  useEffect(() => {
    dispatch(fetchTrade(tradeId))
  }, [dispatch, tradeId])

  if (selectedTradeLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!selectedTrade || selectedTrade.id !== tradeId) {
    return <div className="text-muted-foreground text-sm">Trade not found.</div>
  }

  const t = selectedTrade
  const qty = Number(t.quantity)
  const price = Number(t.executionPrice)
  const notional = qty * price
  const fees = Number(t.fees) || 0
  const hops = t.routingHops ?? []
  const glHop = hops.find((h) => h.target === "ACCOUNTING_GL")

  const copyRef = () => {
    navigator.clipboard?.writeText(t.tradeRef)
    toast.success("Trade ref copied")
  }

  return (
    <div className="space-y-5">
      <button onClick={() => router.push("/investments/orders/blotter")} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to blotter
      </button>

      {/* Header card */}
      <TerminalCard>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <button onClick={copyRef} className="inline-flex items-center gap-1.5 font-mono text-lg font-semibold text-foreground hover:text-primary">
                {t.tradeRef} <Copy className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              <TradeStatusBadge status={t.status} />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className={cn("rounded-md px-2 py-0.5 text-xs font-semibold", t.side === "BUY" ? "bg-gain-muted text-gain-foreground" : "bg-loss-muted text-loss-foreground")}>
                {t.side}
              </span>
              <span className="font-mono text-sm font-semibold text-foreground">{t.security?.symbol ?? t.securityId}</span>
              {t.security?.exchangeCode && <span className="text-xs text-muted-foreground">{t.security.exchangeCode}</span>}
              {t.security?.name && <span className="text-sm text-muted-foreground">{t.security.name}</span>}
            </div>
          </div>
          {(t.status === "SETTLEMENT_FAILED" || hops.some((h) => h.status === "FAILED" || h.status === "RETRYING")) && (
            <div className="flex gap-2">
              {hops.filter((h) => h.status === "FAILED").map((h) => (
                <button
                  key={h.id}
                  onClick={() => dispatch(retryHop({ tradeId: t.id, hopId: h.id }))}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  <RefreshCw className="h-4 w-4" /> Retry {HOP_LABEL[h.target]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Economics grid */}
        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-5 sm:grid-cols-3 lg:grid-cols-5">
          <Field label="Quantity" value={qty.toLocaleString()} />
          <Field label="Execution price" value={`${price.toFixed(4)} ${t.executionCurrencyCode}`} />
          <Field label="Notional" value={notional.toLocaleString("en-US", { minimumFractionDigits: 2 })} />
          <Field label="Fees" value={fees.toLocaleString("en-US", { minimumFractionDigits: 2 })} />
          <Field
            label="Net"
            value={(t.side === "BUY" ? notional + fees : notional - fees).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            strong
          />
        </div>

        {/* Derived lifecycle status strip */}
        <div className="mt-5 grid grid-cols-3 gap-4 border-t border-border pt-5 sm:max-w-md">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Confirmation</p>
            <div className="mt-1"><TerminalStatusBadge status={confirmationStatus(hops)} /></div>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Settlement</p>
            <div className="mt-1"><TerminalStatusBadge status={settlementStatus(hops)} /></div>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Accounting</p>
            <div className="mt-1"><TerminalStatusBadge status={accountingStatus(hops)} /></div>
          </div>
        </div>
      </TerminalCard>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Routing timeline */}
        <TerminalCard
          className="lg:col-span-2"
          header={{ title: "Routing & Settlement Pipeline", subtitle: "Sequential dispatch across downstream systems" }}
        >
          {hops.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
              This trade is a draft and has not been routed yet.
            </div>
          ) : (
            <RoutingPipeline
              mode="expanded"
              hops={hops.map((h) => ({ ...h, skipped: isSkippedInternal(h) }))}
              onRetry={(hopId) => dispatch(retryHop({ tradeId: t.id, hopId }))}
            />
          )}
        </TerminalCard>

        {/* Lifecycle */}
        <TerminalCard header={{ title: "Lifecycle" }}>
          <ul className="space-y-4 text-sm">
            <TimelineItem label="Executed" time={fmtTime(t.executedAt)} done={!!t.executedAt} />
            <TimelineItem label="Routing dispatched" time={hops.length ? fmtTime(hops[0].dispatchedAt) : "—"} done={hops.length > 0} />
            <TimelineItem
              label="GL posted"
              time={fmtTime(glHop?.confirmedAt)}
              done={glHop?.status === "CONFIRMED"}
              failed={glHop?.status === "FAILED"}
            />
            <TimelineItem label="Settled" time={fmtTime(t.settledAt)} done={!!t.settledAt} last />
          </ul>
          <p className="mt-4 border-t border-border pt-3 text-[11px] leading-relaxed text-muted-foreground">
            Note: the SRD&apos;s full Draft → Submitted → Compliance Review → Approved → Sent to Broker →
            Partially Executed → Executed → Pending Settlement → Settled lifecycle does not map 1:1 onto the
            real trade status enum yet — &quot;Compliance Review&quot; and &quot;Partially Executed&quot; are
            reserved stages with no backing data this phase.
          </p>
        </TerminalCard>
      </div>
    </div>
  )
}

function Field({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("mt-1 font-mono tabular-nums", strong ? "text-base font-semibold text-foreground" : "text-sm text-foreground")}>{value}</p>
    </div>
  )
}

function TimelineItem({ label, time, done, failed, last }: { label: string; time: string; done?: boolean; failed?: boolean; last?: boolean }) {
  return (
    <li className="relative flex gap-3">
      {!last && <span className="absolute left-[7px] top-5 h-full w-px bg-border" aria-hidden />}
      <span className={cn("z-10 mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full ring-2 ring-inset", failed ? "bg-loss ring-loss/30" : done ? "bg-gain ring-gain/30" : "bg-muted ring-border")} />
      <div className="flex-1 leading-tight">
        <p className={cn("font-medium", failed ? "text-loss" : done ? "text-foreground" : "text-muted-foreground")}>{label}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </li>
  )
}
