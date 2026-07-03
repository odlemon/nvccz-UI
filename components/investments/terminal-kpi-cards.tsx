"use client"

import { format } from "date-fns"
import { useMemo } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { setPnlPeriod, fetchFundPnL } from "@/lib/store/slices/investmentsSlice"
import { effectiveHoldingValue, holdingCostBasis } from "@/lib/api/investments-api"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowDownRight, ArrowUpRight, Wallet, TrendingUp, Coins, Layers, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface Kpi {
  label: string
  value: string
  sub: string
  delta?: number
  icon: LucideIcon
  loading: boolean
  action?: React.ReactNode
}

function KpiCard({ k }: { k: Kpi }) {
  const positive = (k.delta ?? 0) >= 0
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <k.icon className="h-5 w-5" />
        </div>
        <div className="flex items-center gap-1.5">
          {k.action}
          {k.delta !== undefined && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
                positive ? "bg-gain-muted text-gain-foreground" : "bg-loss-muted text-loss-foreground",
              )}
            >
              {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(k.delta).toFixed(2)}%
            </span>
          )}
        </div>
      </div>
      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">{k.label}</p>
      <div className="mt-1 flex items-end justify-between gap-2">
        {k.loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <p className="font-mono text-2xl font-semibold tracking-tight text-foreground">{k.value}</p>
        )}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{k.sub}</p>
    </div>
  )
}

function fmtMoney(n: number | null | undefined, currency = "USD"): string {
  if (n == null) return "—"
  return `${currency} ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function TerminalKpiCards() {
  const dispatch = useAppDispatch()
  const {
    funds, selectedFundId, pnl, pnlLoading, pnlPeriod,
    holdings, holdingsLoading,
  } = useAppSelector((s) => s.investments)

  const fund = funds.find((f) => f.id === selectedFundId)
  const baseCurrency = fund?.base_currency ?? "USD"

  const handlePeriodChange = (p: "MTD" | "QTD" | "YTD") => {
    dispatch(setPnlPeriod(p))
    if (selectedFundId) dispatch(fetchFundPnL({ fundId: selectedFundId, period: p }))
  }

  const totalMarketValue = useMemo(() => holdings.reduce((sum, h) => sum + effectiveHoldingValue(h), 0), [holdings])
  const totalCostBasis = useMemo(() => holdings.reduce((sum, h) => sum + holdingCostBasis(h), 0), [holdings])

  const unrealizedUsd = pnl?.unrealized?.usd ?? 0
  const realizedUsd = pnl?.realized?.usd ?? 0
  const unrealizedPct = totalCostBasis > 0 ? (unrealizedUsd / totalCostBasis) * 100 : undefined

  const lastValuationAt = holdings.reduce<string | null>((latest, h) => {
    if (!h.lastValuationAt) return latest
    if (!latest || h.lastValuationAt > latest) return h.lastValuationAt
    return latest
  }, null) ?? fund?.nav_updated_at ?? null

  const kpis: Kpi[] = [
    {
      label: "Total Market Value",
      value: fmtMoney(totalMarketValue, baseCurrency),
      sub: lastValuationAt ? `Last valued ${format(new Date(lastValuationAt), "MMM d, HH:mm")}` : "Current portfolio value",
      icon: Wallet,
      loading: holdingsLoading,
    },
    {
      label: "Unrealized P&L",
      value: fmtMoney(unrealizedUsd, baseCurrency),
      sub: unrealizedPct != null ? `${unrealizedPct >= 0 ? "+" : ""}${unrealizedPct.toFixed(2)}% of cost basis` : "No valuation yet",
      delta: unrealizedPct,
      icon: TrendingUp,
      loading: pnlLoading,
    },
    {
      label: "Realized P&L",
      value: fmtMoney(realizedUsd, baseCurrency),
      sub: `${pnlPeriod} performance`,
      icon: Coins,
      loading: pnlLoading,
      action: (
        <Select value={pnlPeriod} onValueChange={(v) => handlePeriodChange(v as "MTD" | "QTD" | "YTD")}>
          <SelectTrigger className="h-6 w-14 text-[10px] bg-muted border-border px-1.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MTD">MTD</SelectItem>
            <SelectItem value="QTD">QTD</SelectItem>
            <SelectItem value="YTD">YTD</SelectItem>
          </SelectContent>
        </Select>
      ),
    },
    {
      label: "Open Positions",
      value: String(holdings.length),
      sub: "Securities held",
      icon: Layers,
      loading: holdingsLoading,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((k) => <KpiCard key={k.label} k={k} />)}
    </div>
  )
}
