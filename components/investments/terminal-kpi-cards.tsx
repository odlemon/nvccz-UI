"use client"

import { format } from "date-fns"
import { useMemo } from "react"
import { useAppSelector } from "@/lib/store"
import { effectiveHoldingValue, holdingCostBasis } from "@/lib/api/investments-api"
import { Wallet, TrendingUp, Coins, Layers, type LucideIcon } from "lucide-react"
import { TerminalStatCard } from "@/components/investments/terminal/stat-card"

interface Kpi {
  label: string
  value: string
  sub: string
  delta?: number
  icon: LucideIcon
  loading: boolean
}

function fmtMoney(n: number | null | undefined, currency = "USD"): string {
  if (n == null) return "—"
  return `${currency} ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function TerminalKpiCards() {
  const {
    funds, selectedFundId, pnl, pnlLoading, pnlPeriod,
    holdings, holdingsLoading,
  } = useAppSelector((s) => s.investments)

  const fund = funds.find((f) => f.id === selectedFundId)
  const baseCurrency = fund?.base_currency ?? "USD"

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
      {kpis.map((k) => (
        <TerminalStatCard
          key={k.label}
          label={
            <span className="inline-flex items-center gap-1.5">
              <k.icon className="size-3.5" />
              {k.label}
            </span>
          }
          value={k.loading ? "…" : k.value}
          subValue={k.sub}
          change={k.delta}
        />
      ))}
    </div>
  )
}
