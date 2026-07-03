"use client"

import { useMemo } from "react"
import { useAppSelector } from "@/lib/store"
import { effectiveHoldingValue } from "@/lib/api/investments-api"
import { Skeleton } from "@/components/ui/skeleton"
import { PieChart as PieChartIcon } from "lucide-react"
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--flat)"]

export function HoldingsAllocationChart() {
  const { holdings, holdingsLoading } = useAppSelector((s) => s.investments)

  const data = useMemo(() => {
    return holdings
      .map((h) => ({
        name: h.security?.symbol ?? h.securityId.slice(0, 8),
        value: Math.max(0, effectiveHoldingValue(h)),
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [holdings])

  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-foreground">Allocation by Security</h2>
      <p className="text-xs text-muted-foreground">Market value distribution</p>

      {holdingsLoading ? (
        <div className="mt-3 flex items-center gap-4">
          <Skeleton className="h-32 w-32 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-4 w-full rounded" />)}
          </div>
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-center">
          <PieChartIcon className="w-8 h-8 text-muted-foreground/30 mb-2" />
          <p className="text-xs text-muted-foreground">No holdings to allocate yet</p>
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-4">
          <div className="relative h-32 w-32 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={44}
                  outerRadius={62}
                  paddingAngle={2}
                  stroke="none"
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Total</span>
              <span className="font-mono text-sm font-semibold text-foreground">
                {total.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          <ul className="flex-1 space-y-2">
            {data.slice(0, 5).map((d, i) => (
              <li key={d.name} className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="font-mono text-xs font-medium text-foreground truncate">{d.name}</span>
                <span className="ml-auto font-mono tabular-nums text-xs text-muted-foreground">
                  {((d.value / total) * 100).toFixed(1)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
