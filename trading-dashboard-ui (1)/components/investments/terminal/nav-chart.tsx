"use client"

import { useState } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { cn } from "@/lib/utils"
import { money } from "@/lib/investments/format"
import { NAV_SERIES } from "@/lib/investments/mock-data"

const RANGES = ["1D", "1W", "1M", "3M", "1Y"] as const

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const nav = payload.find((p: any) => p.dataKey === "nav")?.value
  const bench = payload.find((p: any) => p.dataKey === "bench")?.value
  return (
    <div className="rounded-lg border border-panel-border bg-panel px-3 py-2 text-xs shadow-lg">
      <div className="flex items-center gap-2 text-panel-foreground">
        <span className="inline-block h-2 w-2 rounded-full bg-primary" />
        NAV <span className="ml-auto font-mono font-semibold">${money(nav)}</span>
      </div>
      <div className="mt-1 flex items-center gap-2 text-panel-muted">
        <span className="inline-block h-2 w-2 rounded-full bg-[var(--flat)]" />
        Bench <span className="ml-auto font-mono">${money(bench)}</span>
      </div>
    </div>
  )
}

export function NavChart() {
  const [range, setRange] = useState<(typeof RANGES)[number]>("1D")
  const first = NAV_SERIES[0].nav
  const last = NAV_SERIES[NAV_SERIES.length - 1].nav
  const changePct = ((last - first) / first) * 100
  const positive = changePct >= 0

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Fund NAV — Intraday</p>
          <div className="mt-1 flex items-baseline gap-3">
            <span className="font-mono text-3xl font-semibold tracking-tight text-foreground">
              ${money(last)}
            </span>
            <span
              className={cn(
                "font-mono text-sm font-semibold",
                positive ? "text-gain" : "text-loss",
              )}
            >
              {positive ? "+" : ""}
              {money(last - first)} ({positive ? "+" : ""}
              {changePct.toFixed(2)}%)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/50 p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                r === range
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={NAV_SERIES} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="navFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.22} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="t"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <YAxis
              width={48}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              domain={["dataMin - 8000", "dataMax + 8000"]}
              tickFormatter={(v) => `$${(v / 1e6).toFixed(2)}M`}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)", strokeWidth: 1 }} />
            <Line
              type="monotone"
              dataKey="bench"
              stroke="var(--flat)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="nav"
              stroke="var(--primary)"
              strokeWidth={2.25}
              fill="url(#navFill)"
              dot={false}
              activeDot={{ r: 4, fill: "var(--primary)", stroke: "var(--card)", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
