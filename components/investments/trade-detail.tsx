"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchTrade, retryHop } from "@/lib/store/slices/investmentsSlice"
import { investmentsApi } from "@/lib/api/investments-api"
import { isSkippedInternal } from "@/lib/api/investments-api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  ArrowLeft, TrendingUp, TrendingDown, RotateCcw,
  CheckCircle2, Clock, XCircle,
} from "lucide-react"
import type { RoutingHop } from "@/lib/api/investments-api"
import { toast } from "sonner"

// ─── Hop status style ─────────────────────────────────────────────────────────
const HOP_STATUS_STYLE: Record<string, string> = {
  STAGED:     "bg-slate-100 text-slate-600 border-slate-200",
  DISPATCHED: "bg-blue-100 text-blue-700 border-blue-200",
  CONFIRMED:  "bg-emerald-100 text-emerald-700 border-emerald-200",
  RETRYING:   "bg-amber-100 text-amber-700 border-amber-200",
  FAILED:     "bg-red-100 text-red-700 border-red-200",
}

const SKIPPED_STYLE = "border-dashed border-slate-300 text-slate-400 bg-transparent"

const TARGET_LABELS: Record<string, string> = {
  BROKER:        "Broker Gateway",
  CUSTODIAN:     "Custodian Network",
  CORE_BANKING:  "Core Banking",
  ACCOUNTING_GL: "Accounting Register",
}

// ─── Hop row ──────────────────────────────────────────────────────────────────
function HopRow({ hop, tradeId }: { hop: RoutingHop; tradeId: string }) {
  const dispatch  = useAppDispatch()
  const skipped   = isSkippedInternal(hop)
  const styleKey  = skipped ? "SKIPPED" : hop.status
  const borderCls = skipped ? SKIPPED_STYLE : (HOP_STATUS_STYLE[hop.status] ?? HOP_STATUS_STYLE.STAGED)

  return (
    <div className={cn("flex gap-3 p-3 rounded-lg border", borderCls)}>
      <div className="flex flex-col items-center gap-1 pt-0.5">
        {hop.status === "CONFIRMED" && !skipped ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        ) : hop.status === "FAILED" ? (
          <XCircle className="w-4 h-4 text-red-600" />
        ) : hop.status === "RETRYING" ? (
          <RotateCcw className="w-4 h-4 text-amber-600" />
        ) : (
          <Clock className="w-4 h-4 text-slate-400" />
        )}
        <div className="w-px flex-1 bg-current opacity-20" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{TARGET_LABELS[hop.target]}</span>
          <Badge variant="outline" className={cn("text-xs border", borderCls)}>
            {skipped ? "SKIPPED (INTERNAL)" : hop.status.replace("_", " ")}
            {hop.status === "RETRYING" && ` (${hop.attemptCount}/5)`}
          </Badge>
        </div>
        <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
          {hop.dispatchedAt && <p>Dispatched: {new Date(hop.dispatchedAt).toLocaleString()}</p>}
          {hop.confirmedAt  && <p>Confirmed: {new Date(hop.confirmedAt).toLocaleString()}</p>}
          {hop.externalRef && !skipped && <p>Ref: <span className="font-mono">{hop.externalRef}</span></p>}
          {skipped && <p className="text-slate-400 italic">Custodian dispatch disabled — internal settlement mode</p>}
          {hop.lastError && <p className="text-red-500">{hop.lastError}</p>}
          <p>Attempts: {hop.attemptCount}</p>
        </div>
        {hop.payloadRef && !skipped && (
          <details className="mt-2">
            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">View payload ref</summary>
            <pre className="mt-1 text-[10px] bg-muted rounded p-2 overflow-x-auto max-h-32 break-all whitespace-pre-wrap">
              {hop.payloadRef}
            </pre>
          </details>
        )}
        {hop.status === "FAILED" && (
          <Button
            size="sm" variant="destructive" className="mt-2 h-6 text-xs"
            onClick={() => dispatch(retryHop({ tradeId, hopId: hop.id }))}
          >
            <RotateCcw className="w-3 h-3 mr-1" /> Retry
          </Button>
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
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

  const t      = selectedTrade
  const qty    = Number(t.quantity)
  const price  = Number(t.executionPrice)
  const total  = qty * price
  const hops   = t.routingHops ?? []

  const glHop  = hops.find((h) => h.target === "ACCOUNTING_GL" && h.status === "CONFIRMED")

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Back + title */}
      <div className="flex items-center gap-3">
        <Button size="icon" variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold font-mono leading-none">{t.tradeRef}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{t.id}</p>
        </div>
        <Badge className={cn("border-0 ml-1", t.side === "BUY" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700")}>
          {t.side === "BUY" ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
          {t.side}
        </Badge>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Trade Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Security</span>
              <span className="font-mono font-semibold">
                {t.security?.symbol ?? t.securityId}
                {t.security?.exchangeCode && (
                  <span className="ml-1 text-xs text-muted-foreground">{t.security.exchangeCode}</span>
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quantity</span>
              <span className="font-mono">{qty.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Execution Price</span>
              <span className="font-mono">{price.toFixed(4)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gross Total</span>
              <span className="font-mono font-semibold">
                {t.executionCurrencyCode} {total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fees</span>
              <span className="font-mono">{Number(t.fees).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge className={cn("text-xs border-0",
                t.status === "SETTLED" ? "bg-emerald-100 text-emerald-700" :
                t.status === "ROUTING" ? "bg-amber-100 text-amber-700" :
                t.status === "SETTLEMENT_FAILED" ? "bg-red-100 text-red-700" :
                "bg-slate-100 text-slate-600"
              )}>
                {t.status}
              </Badge>
            </div>
            {t.executedAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Executed</span>
                <span className="font-mono text-xs">{new Date(t.executedAt).toLocaleString()}</span>
              </div>
            )}
            {t.settledAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Settled</span>
                <span className="font-mono text-xs">{new Date(t.settledAt).toLocaleString()}</span>
              </div>
            )}
            {glHop && (
              <div className="flex justify-between col-span-2">
                <span className="text-muted-foreground">GL Posted</span>
                <span className="font-mono text-xs text-emerald-600">
                  {glHop.confirmedAt ? new Date(glHop.confirmedAt).toLocaleString() : "Yes"}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Routing hop timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Routing Hops</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {hops.length > 0 ? (
            hops.map((hop) => <HopRow key={hop.id} hop={hop} tradeId={t.id} />)
          ) : (
            <p className="text-sm text-muted-foreground">No routing hops recorded.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
