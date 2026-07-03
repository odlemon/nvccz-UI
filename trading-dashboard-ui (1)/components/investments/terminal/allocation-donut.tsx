"use client"

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"
import { compact } from "@/lib/investments/format"
import { HOLDINGS, SECURITIES } from "@/lib/investments/mock-data"

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-4)", "var(--chart-5)", "var(--flat)"]

export function AllocationDonut() {
  const byExchange = new Map<string, number>()
  for (const h of HOLDINGS) {
    const ex = h.security.exchangeCode
    byExchange.set(ex, (byExchange.get(ex) ?? 0) + (h.marketValue ?? 0))
  }
  const data = [...byExchange.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-foreground">Allocation by Exchange</h2>
      <p className="text-xs text-muted-foreground">Market value distribution</p>

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
            <span className="font-mono text-sm font-semibold text-foreground">${compact(total)}</span>
          </div>
        </div>

        <ul className="flex-1 space-y-2">
          {data.map((d, i) => (
            <li key={d.name} className="flex items-center gap-2 text-sm">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="font-medium text-foreground">{d.name}</span>
              <span className="ml-auto font-mono tabular-nums text-muted-foreground">
                {((d.value / total) * 100).toFixed(1)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
