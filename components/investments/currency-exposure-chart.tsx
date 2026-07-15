"use client"

import { useMemo } from "react"
import { useAppSelector } from "@/lib/store"
import { effectiveHoldingValue } from "@/lib/api/investments-api"
import { Skeleton } from "@/components/ui/skeleton"
import { Coins } from "lucide-react"
import { TerminalCard } from "@/components/investments/terminal/card"

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--flat)"]

// Real currency exposure — aggregates each holding's effective market value
// (marketValue if a valuation has run, else cost-basis estimate — see
// effectiveHoldingValue) grouped by the underlying security's listing
// currency. Intentionally NOT mocked: this is derived straight from
// lib/store/slices/investmentsSlice holdings state, so it always sums to
// the same Total Market Value shown in the KPI row / allocation chart.
export function CurrencyExposureChart() {
  const { holdings, holdingsLoading } = useAppSelector((s) => s.investments)

  const data = useMemo(() => {
    const byCurrency = new Map<string, number>()
    for (const h of holdings) {
      const currency = h.security?.listingCurrencyCode ?? "—"
      const value = Math.max(0, effectiveHoldingValue(h))
      byCurrency.set(currency, (byCurrency.get(currency) ?? 0) + value)
    }
    return Array.from(byCurrency.entries())
      .map(([currency, value]) => ({ currency, value }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [holdings])

  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <TerminalCard header={{ title: "Currency Exposure", subtitle: "Market value by listing currency" }} bodyClassName="p-4">
      {holdingsLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-6 w-full rounded" />)}
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-32 flex-col items-center justify-center text-center">
          <Coins className="w-8 h-8 text-muted-foreground/30 mb-2" />
          <p className="text-xs text-muted-foreground">No holdings to break down yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((d, i) => {
            const pct = total > 0 ? (d.value / total) * 100 : 0
            return (
              <div key={d.currency} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1.5 font-mono font-semibold text-foreground">
                    <span className="size-2 rounded-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    {d.currency}
                  </span>
                  <span className="font-mono tabular-nums text-muted-foreground">
                    {d.value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    <span className="ml-2 text-foreground">{pct.toFixed(1)}%</span>
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                  />
                </div>
              </div>
            )
          })}
          <div className="flex items-center justify-between border-t border-border pt-2 text-xs">
            <span className="font-medium text-muted-foreground">Total</span>
            <span className="font-mono font-semibold text-foreground">
              {total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}
    </TerminalCard>
  )
}
