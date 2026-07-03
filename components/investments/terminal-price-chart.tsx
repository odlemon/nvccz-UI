"use client"

import { useEffect, useMemo } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { setDashboardFocusSecurityId, fetchSecurityPriceHistory } from "@/lib/store/slices/investmentsSlice"
import { priceChange } from "@/lib/api/investments-api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, TrendingDown, Minus, LineChart as LineChartIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
} from "recharts"

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
    <Card className="lg:col-span-3 bg-white border border-gray-200 shadow-sm">
      <CardHeader className="pb-2 border-b border-gray-100">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <CardTitle className="text-sm font-semibold text-gray-800">Market Chart</CardTitle>
            {latest && (
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-sm font-semibold text-gray-900">{change.price?.toFixed(4)}</span>
                {change.direction === "UP" && <TrendingUp className="w-3.5 h-3.5 text-[#10B981]" />}
                {change.direction === "DOWN" && <TrendingDown className="w-3.5 h-3.5 text-[#EF4444]" />}
                {change.direction === "FLAT" && <Minus className="w-3.5 h-3.5 text-[#6B7280]" />}
                {change.pct != null && (
                  <span className={cn("font-mono text-xs", change.direction === "UP" ? "text-[#10B981]" : change.direction === "DOWN" ? "text-[#EF4444]" : "text-[#6B7280]")}>
                    {change.pct >= 0 ? "+" : ""}{change.pct.toFixed(2)}%
                  </span>
                )}
              </div>
            )}
          </div>
          <Select value={dashboardFocusSecurityId ?? ""} onValueChange={(v) => dispatch(setDashboardFocusSecurityId(v))}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue placeholder="Select security…" />
            </SelectTrigger>
            <SelectContent>
              {watchlist.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.symbol}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pt-4 pb-2">
        {priceHistoryLoading ? (
          <Skeleton className="h-56 w-full rounded-lg" />
        ) : chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-56 text-center">
            <LineChartIcon className="w-8 h-8 text-gray-200 mb-2" />
            <p className="text-xs text-muted-foreground">
              {focusSecurity ? `No price history for ${focusSecurity.symbol}` : "Select a security to view its price history"}
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={224}>
            <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <ReTooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
                formatter={(val: any) => [Number(val).toFixed(4), "Price"]}
              />
              <Area type="monotone" dataKey="price" stroke="#3B82F6" strokeWidth={2} fill="url(#priceGradient)" />
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
