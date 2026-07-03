import { cn } from "@/lib/utils"
import { ArrowDownRight, ArrowUpRight, type LucideIcon, TrendingUp, Wallet, Coins, Activity } from "lucide-react"
import { money, compact } from "@/lib/investments/format"
import { FUNDS, HOLDINGS, PNL, TRADES } from "@/lib/investments/mock-data"

interface Kpi {
  label: string
  value: string
  sub: string
  delta?: number
  icon: LucideIcon
  spark?: number[]
}

function Sparkline({ points, tone }: { points: number[]; tone: "gain" | "loss" }) {
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const w = 72
  const h = 28
  const step = w / (points.length - 1)
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${(i * step).toFixed(1)} ${(h - ((p - min) / range) * h).toFixed(1)}`)
    .join(" ")
  const stroke = tone === "gain" ? "var(--gain)" : "var(--loss)"
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible" aria-hidden>
      <path d={d} fill="none" stroke={stroke} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function KpiRow() {
  const totalNav = FUNDS.reduce((s, f) => s + f.nav, 0)
  const totalMv = HOLDINGS.reduce((s, h) => s + (h.marketValue ?? 0), 0)
  const openTrades = TRADES.filter((t) => ["ROUTING", "EXECUTED", "SETTLEMENT_FAILED"].includes(t.status)).length

  const kpis: Kpi[] = [
    {
      label: "Total NAV (USD)",
      value: `$${money(totalNav)}`,
      sub: `${FUNDS.length} funds under management`,
      delta: 1.32,
      icon: Wallet,
      spark: [2789, 2802, 2796, 2815, 2829, 2822, 2838, 2841],
    },
    {
      label: "Unrealized P&L",
      value: `$${money(PNL.unrealized.usd)}`,
      sub: `ZiG ${compact(PNL.unrealized.zig)} @ ${PNL.unrealized.fxRateUsed}`,
      delta: 2.14,
      icon: TrendingUp,
      spark: [12, 18, 15, 22, 28, 25, 33, 39],
    },
    {
      label: "Market Value",
      value: `$${compact(totalMv)}`,
      sub: `${HOLDINGS.length} live positions`,
      delta: -0.42,
      icon: Coins,
      spark: [40, 39, 41, 38, 42, 41, 40, 39],
    },
    {
      label: "Open Trades",
      value: `${openTrades}`,
      sub: `${TRADES.length} total in blotter`,
      icon: Activity,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((k) => {
        const positive = (k.delta ?? 0) >= 0
        return (
          <div
            key={k.label}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <k.icon className="h-5 w-5" />
              </div>
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
            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">{k.label}</p>
            <div className="mt-1 flex items-end justify-between gap-2">
              <p className="font-mono text-2xl font-semibold tracking-tight text-foreground">{k.value}</p>
              {k.spark && <Sparkline points={k.spark} tone={positive ? "gain" : "loss"} />}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{k.sub}</p>
          </div>
        )
      })}
    </div>
  )
}
