"use client"

import { useMemo } from "react"
import { useAppSelector } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkline } from "./sparkline"
import { fmtRate, fmtPct, decimalsOf } from "./format"
import { Activity, Landmark, ArrowLeftRight, ArrowDownToLine, ArrowUpFromLine, Percent } from "lucide-react"
import { cn } from "@/lib/utils"

type Direction = "up" | "down" | "flat"

function trendInfo(series: number[]): { direction: Direction; changePct: number | null } {
  if (series.length < 2) return { direction: "flat", changePct: null }
  const first = series[0]
  const last = series[series.length - 1]
  const diff = last - first
  const changePct = first !== 0 ? (diff / Math.abs(first)) * 100 : null
  return { direction: diff > 0 ? "up" : diff < 0 ? "down" : "flat", changePct }
}

export function RateKpiCards() {
  const { widget, historyBySource } = useAppSelector((s) => s.streetRates)

  const streetHistory = historyBySource["ZIMRATE_STREET"] ?? []
  const officialHistory = historyBySource["ZIMRATE_OFFICIAL"] ?? []

  const streetSeries = useMemo(() => [...streetHistory].reverse().map((q) => Number(q.avg)), [streetHistory])
  const officialSeries = useMemo(() => [...officialHistory].reverse().map((q) => Number(q.avg)), [officialHistory])
  const bidSeries = useMemo(() => [...streetHistory].reverse().map((q) => Number(q.bid)), [streetHistory])
  const askSeries = useMemo(() => [...streetHistory].reverse().map((q) => Number(q.ask)), [streetHistory])
  const spreadSeries = useMemo(() => {
    const n = Math.min(streetSeries.length, officialSeries.length)
    return Array.from({ length: n }, (_, i) => streetSeries[i] - officialSeries[i])
  }, [streetSeries, officialSeries])
  const pctSeries = useMemo(() => {
    const n = Math.min(streetSeries.length, officialSeries.length)
    return Array.from({ length: n }, (_, i) =>
      officialSeries[i] === 0 ? 0 : ((streetSeries[i] - officialSeries[i]) / officialSeries[i]) * 100
    )
  }, [streetSeries, officialSeries])

  if (!widget || !widget.primary) return null

  const decimals = decimalsOf(widget.primary.avg)

  const comparison = widget.comparison

  const cards = [
    { label: "Street Rate",   value: fmtRate(Number(widget.primary.avg), decimals),                                        series: streetSeries,   color: "#F59E0B", icon: Activity,       caption: widget.primary.format },
    { label: "Official Rate", value: comparison ? fmtRate(Number(comparison.avg), decimals) : "—",                         series: officialSeries, color: "#3B82F6", icon: Landmark,       caption: "Central bank rate" },
    { label: "Spread",        value: comparison ? fmtRate(Number(comparison.spreadAbsolute), decimals) : "—",              series: spreadSeries,   color: "#8B5CF6", icon: ArrowLeftRight, caption: "Street minus official" },
    { label: "Bid",           value: fmtRate(Number(widget.primary.bid), decimals),                                        series: bidSeries,      color: "#10B981", icon: ArrowDownToLine, caption: "Buy price" },
    { label: "Ask",           value: fmtRate(Number(widget.primary.ask), decimals),                                        series: askSeries,      color: "#EF4444", icon: ArrowUpFromLine, caption: "Sell price" },
    { label: "% Difference",  value: comparison ? fmtPct(comparison.spreadPct) : "—",                                      series: pctSeries,      color: "#14B8A6", icon: Percent,        caption: "Street vs official" },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => {
        const { direction, changePct } = trendInfo(card.series)
        return (
          <Card key={card.label} className="bg-white border border-gray-200 shadow-none hover:border-gray-300 transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 px-4">
              <CardTitle className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">{card.label}</CardTitle>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${card.color}1A` }}
              >
                <card.icon className="w-3.5 h-3.5" style={{ color: card.color }} />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xl font-bold text-gray-900 tabular-nums">{card.value}</span>
                {changePct != null && (
                  <span
                    className={cn(
                      "text-[10px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap",
                      direction === "up" ? "bg-emerald-50 text-emerald-600" : direction === "down" ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-500"
                    )}
                  >
                    {direction === "up" ? "▲" : direction === "down" ? "▼" : "—"} {Math.abs(changePct).toFixed(2)}%
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{card.caption}</p>
              <div className="mt-2 -mx-1">
                {card.series.length >= 2 ? (
                  <Sparkline data={card.series} color={card.color} />
                ) : (
                  <div className="h-10 flex items-center justify-center rounded border border-dashed border-gray-100 text-[10px] text-gray-300">
                    Awaiting more history
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
