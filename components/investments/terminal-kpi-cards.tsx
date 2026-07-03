"use client"

import type { ReactNode } from "react"
import { format } from "date-fns"
import { useMemo } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { setPnlPeriod, fetchFundPnL } from "@/lib/store/slices/investmentsSlice"
import { effectiveHoldingValue, holdingCostBasis } from "@/lib/api/investments-api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Wallet, TrendingUp, TrendingDown, Layers, Clock, ShieldAlert, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

function KpiCard({
  title, value, subtitle, icon: Icon, gradient, loading, action,
}: {
  title: string; value: string | number; subtitle: string
  icon: any; gradient: boolean; loading: boolean; action?: ReactNode
}) {
  return (
    <Card className={cn("border shadow-sm hover:shadow-md transition-all duration-200", gradient ? "gradient-primary" : "bg-white border-gray-200")}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
        <CardTitle className={cn("text-xs font-medium uppercase tracking-wide", gradient ? "text-white/80" : "text-gray-500")}>
          {title}
        </CardTitle>
        <div className="flex items-center gap-1.5">
          {action}
          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", gradient ? "bg-white/20" : "gradient-primary")}>
            <Icon className="h-3.5 w-3.5 text-white" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {loading ? (
          <Skeleton className={cn("h-8 w-20 mt-1", gradient && "bg-white/20")} />
        ) : (
          <div className={cn("text-2xl font-bold", gradient ? "text-white" : "text-gray-900")}>
            {value}
          </div>
        )}
        <div className={cn("flex items-center gap-1 mt-1", gradient ? "text-white/60" : "text-gray-400")}>
          <span className="text-xs">{subtitle}</span>
        </div>
      </CardContent>
    </Card>
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
    holdings, holdingsLoading, trades, validationQueue,
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
  const unrealizedPositive = unrealizedUsd >= 0
  const realizedPositive = realizedUsd >= 0
  const unrealizedPct = totalCostBasis > 0 ? (unrealizedUsd / totalCostBasis) * 100 : null

  const lastValuationAt = holdings.reduce<string | null>((latest, h) => {
    if (!h.lastValuationAt) return latest
    if (!latest || h.lastValuationAt > latest) return h.lastValuationAt
    return latest
  }, null) ?? fund?.nav_updated_at ?? null

  const hopIssues = trades.filter((t) => (t.routingHops ?? []).some((h) => h.status === "FAILED" || h.status === "RETRYING")).length
  const pendingReview = validationQueue.length
  const totalAlerts = hopIssues + pendingReview

  return (
    <div className="space-y-3">
      {/* Primary KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Market Value"
          value={fmtMoney(totalMarketValue, baseCurrency)}
          subtitle="Current portfolio value"
          icon={Wallet}
          gradient
          loading={holdingsLoading}
        />
        <KpiCard
          title="Unrealized P&L"
          value={fmtMoney(unrealizedUsd, baseCurrency)}
          subtitle={unrealizedPct != null ? `${unrealizedPositive ? "+" : ""}${unrealizedPct.toFixed(2)}%` : "No valuation yet"}
          icon={unrealizedPositive ? TrendingUp : TrendingDown}
          gradient={false}
          loading={pnlLoading}
        />
        <KpiCard
          title="Realized P&L"
          value={fmtMoney(realizedUsd, baseCurrency)}
          subtitle={`${pnlPeriod} performance`}
          icon={realizedPositive ? TrendingUp : TrendingDown}
          gradient
          loading={pnlLoading}
          action={
            <Select value={pnlPeriod} onValueChange={(v) => handlePeriodChange(v as "MTD" | "QTD" | "YTD")}>
              <SelectTrigger className="h-6 w-16 text-[10px] bg-white/20 border-white/30 text-white px-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MTD">MTD</SelectItem>
                <SelectItem value="QTD">QTD</SelectItem>
                <SelectItem value="YTD">YTD</SelectItem>
              </SelectContent>
            </Select>
          }
        />
        <KpiCard
          title="Open Positions"
          value={holdings.length}
          subtitle="Securities held"
          icon={Layers}
          gradient={false}
          loading={holdingsLoading}
        />
      </div>

      {/* Secondary metric strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            label: "NAV",
            value: fund?.nav != null ? fmtMoney(fund.nav, baseCurrency) : "—",
            icon: Wallet, color: "text-blue-600", bg: "bg-blue-50",
          },
          {
            label: "Last Valuation",
            value: lastValuationAt ? format(new Date(lastValuationAt), "MMM d, HH:mm") : "—",
            icon: Clock, color: "text-blue-600", bg: "bg-blue-50",
          },
          {
            label: "Routing Alerts",
            value: totalAlerts > 0 ? `${totalAlerts} pending` : "All clear",
            icon: totalAlerts > 0 ? ShieldAlert : ShieldCheck,
            color: totalAlerts > 0 ? "text-red-600" : "text-emerald-600",
            bg: totalAlerts > 0 ? "bg-red-50" : "bg-emerald-50",
          },
        ].map((item) => (
          <Card key={item.label} className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", item.bg)}>
                <item.icon className={cn("w-4 h-4", item.color)} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className={cn("text-sm font-bold mt-0.5 truncate", item.color)}>{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
