"use client"

import { useEffect, useMemo } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { setDashboardFocusSecurityId, fetchSecurityPriceHistory } from "@/lib/store/slices/investmentsSlice"
import { priceChange } from "@/lib/api/investments-api"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { LineChart as LineChartIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { TerminalCard } from "@/components/investments/terminal/card"
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
} from "recharts"

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const price = payload[0]?.value
  return (
    <div className="rounded-lg border border-panel-border bg-panel px-3 py-2 text-xs shadow-lg">
      <div className="flex items-center gap-2 text-panel-foreground">
        <span className="inline-block h-2 w-2 rounded-full bg-primary" />
        Price <span className="ml-auto font-mono font-semibold">{Number(price).toFixed(4)}</span>
      </div>
    </div>
  )
}

export function TerminalPriceChart() {
  const dispatch = useAppDispatch()
  const { securities, dashboardFocusSecurityId, priceHistoryCache, priceHistoryLoadingIds } = useAppSelector((s) => s.investments)
  const watchlist = useMemo(() => securities.filter((s) => s.isActive), [securities])

  useEffect(() => {
    if (!dashboardFocusSecurityId && watchlist.length > 0) {
      dispatch(setDashboardFocusSecurityId(watchlist[0].id))
    }
  }, [dispatch, dashboardFocusSecurityId, watchlist])

  useEffect(() => {
    if (dashboardFocusSecurityId) dispatch(fetchSecurityPriceHistory(dashboardFocusSecurityId))
  }, [dispatch, dashboardFocusSecurityId])

  const focusSecurity = watchlist.find((s) => s.id === dashboardFocusSecurityId)
  const ticks = dashboardFocusSecurityId ? priceHistoryCache[dashboardFocusSecurityId] ?? [] : []
  const priceHistoryLoading = dashboardFocusSecurityId ? !!priceHistoryLoadingIds[dashboardFocusSecurityId] : false

  const chartData = useMemo(() => {
    return [...ticks]
      .reverse()
      .map((t) => ({
        date: new Date(t.pricedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        price: Number(t.price),
      }))
  }, [ticks])

  const latest = ticks[0]
  const change = priceChange(latest)

  return (
    <TerminalCard
      header={{
        title: focusSecurity ? `${focusSecurity.symbol} — Price History` : "Market Chart",
        subtitle: latest ? (
          <span className="flex items-baseline gap-2">
            <span className="font-mono text-lg font-semibold tracking-tight text-foreground">
              {change.price?.toFixed(4)}
            </span>
            <span className={cn("font-mono text-xs font-semibold", change.direction === "UP" ? "text-gain" : change.direction === "DOWN" ? "text-loss" : "text-muted-foreground")}>
              {change.pct != null ? `${change.pct >= 0 ? "+" : ""}${change.pct.toFixed(2)}%` : "—"}
            </span>
          </span>
        ) : undefined,
        actions: (
          <Select value={dashboardFocusSecurityId ?? ""} onValueChange={(v) => dispatch(setDashboardFocusSecurityId(v))}>
            <SelectTrigger className="h-8 w-32 text-xs bg-muted/50 border-border">
              <SelectValue placeholder="Select security…" />
            </SelectTrigger>
            <SelectContent>
              {watchlist.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.symbol}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
      }}
      bodyClassName="p-4"
    >
      <div className="h-64 w-full">
        {priceHistoryLoading ? (
          <Skeleton className="h-full w-full rounded-lg" />
        ) : chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <LineChartIcon className="w-8 h-8 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">
              {focusSecurity ? `No price history for ${focusSecurity.symbol}` : "Select a security to view its price history"}
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
              <YAxis width={48} tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} domain={["auto", "auto"]} />
              <ReTooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)", strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="price"
                stroke="var(--primary)"
                strokeWidth={2.25}
                fill="url(#priceFill)"
                dot={false}
                activeDot={{ r: 4, fill: "var(--primary)", stroke: "var(--card)", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </TerminalCard>
  )
}
