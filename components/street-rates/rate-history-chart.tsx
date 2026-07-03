"use client"

import { useEffect, useMemo } from "react"
import { format } from "date-fns"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchHistory, setHistoryRange, setHistorySeries, setCustomDateRange, type HistoryRange, type HistorySeries } from "@/lib/store/slices/streetRatesSlice"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Calendar as CalendarIcon, LineChart as LineChartIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, Legend,
} from "recharts"

const RANGE_OPTIONS: { label: string; value: HistoryRange }[] = [
  { label: "All", value: "ALL" },
  { label: "7D", value: "7D" },
  { label: "30D", value: "30D" },
  { label: "90D", value: "90D" },
  { label: "1Y", value: "1Y" },
  { label: "Custom", value: "CUSTOM" },
]

const SERIES_OPTIONS: { label: string; value: HistorySeries }[] = [
  { label: "Street", value: "STREET" },
  { label: "Official", value: "OFFICIAL" },
  { label: "Both", value: "BOTH" },
]

// "All" (the default) omits date bounds entirely so the chart/sparklines always
// show whatever history exists, regardless of how the backend's asOfDate seed
// data lines up with "today" — narrower presets are an explicit user choice.
function computeDateBounds(range: HistoryRange, customFrom: string | null, customTo: string | null): { dateFrom?: string; dateTo?: string } {
  if (range === "ALL") return {}
  const today = new Date()
  const toStr = today.toISOString().slice(0, 10)
  if (range === "CUSTOM") {
    return { dateFrom: customFrom ?? undefined, dateTo: customTo ?? undefined }
  }
  const days = range === "7D" ? 7 : range === "30D" ? 30 : range === "90D" ? 90 : 365
  const from = new Date(today)
  from.setDate(from.getDate() - days)
  return { dateFrom: from.toISOString().slice(0, 10), dateTo: toStr }
}

export function RateHistoryChart() {
  const dispatch = useAppDispatch()
  const {
    historyBySource, historyLoading, historyRange, historySeries,
    customDateFrom, customDateTo, fromCurrency, toCurrency,
  } = useAppSelector((s) => s.streetRates)

  const { dateFrom, dateTo } = computeDateBounds(historyRange, customDateFrom, customDateTo)

  useEffect(() => {
    if (historyRange === "CUSTOM" && (!customDateFrom || !customDateTo)) return
    if (historySeries === "STREET" || historySeries === "BOTH") {
      dispatch(fetchHistory({ source: "ZIMRATE_STREET", from: fromCurrency, to: toCurrency, dateFrom, dateTo }))
    }
    if (historySeries === "OFFICIAL" || historySeries === "BOTH") {
      dispatch(fetchHistory({ source: "ZIMRATE_OFFICIAL", from: fromCurrency, to: toCurrency, dateFrom, dateTo }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, historyRange, historySeries, dateFrom, dateTo, fromCurrency, toCurrency])

  const streetHistory = historyBySource["ZIMRATE_STREET"] ?? []
  const officialHistory = historyBySource["ZIMRATE_OFFICIAL"] ?? []

  const chartData = useMemo(() => {
    const street = [...streetHistory].reverse()
    const official = [...officialHistory].reverse()
    const n = Math.max(street.length, official.length)
    return Array.from({ length: n }, (_, i) => ({
      date: street[i]?.asOfDate ?? official[i]?.asOfDate ?? "",
      street: street[i] ? Number(street[i].avg) : undefined,
      official: official[i] ? Number(official[i].avg) : undefined,
    }))
  }, [streetHistory, officialHistory])

  const showStreet = historySeries === "STREET" || historySeries === "BOTH"
  const showOfficial = historySeries === "OFFICIAL" || historySeries === "BOTH"

  return (
    <Card className="bg-white border border-gray-200 shadow-none">
      <CardHeader className="pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-sm font-semibold text-gray-800">Historical Rates</CardTitle>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Series toggle */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-full">
              {SERIES_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => dispatch(setHistorySeries(opt.value))}
                  className={cn(
                    "text-xs font-medium px-3 py-1.5 rounded-full transition-all",
                    historySeries === opt.value ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Range toggle */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-full">
              {RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => dispatch(setHistoryRange(opt.value))}
                  className={cn(
                    "text-xs font-medium px-3 py-1.5 rounded-full transition-all",
                    historyRange === opt.value ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Custom range pickers */}
        {historyRange === "CUSTOM" && (
          <div className="flex items-center gap-2 pt-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 rounded-full gap-1.5 text-xs bg-white">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  {customDateFrom ? format(new Date(customDateFrom), "dd MMM yyyy") : "From date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-2xl border-none shadow-2xl" align="start">
                <CalendarComponent
                  mode="single"
                  selected={customDateFrom ? new Date(customDateFrom) : undefined}
                  onSelect={(d) => d && dispatch(setCustomDateRange({ from: d.toISOString().slice(0, 10), to: customDateTo }))}
                />
              </PopoverContent>
            </Popover>
            <span className="text-xs text-muted-foreground">to</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 rounded-full gap-1.5 text-xs bg-white">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  {customDateTo ? format(new Date(customDateTo), "dd MMM yyyy") : "To date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-2xl border-none shadow-2xl" align="start">
                <CalendarComponent
                  mode="single"
                  selected={customDateTo ? new Date(customDateTo) : undefined}
                  onSelect={(d) => d && dispatch(setCustomDateRange({ from: customDateFrom, to: d.toISOString().slice(0, 10) }))}
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-5">
        {historyLoading ? (
          <Skeleton className="h-72 w-full rounded-lg" />
        ) : chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-72 text-center">
            <LineChartIcon className="w-8 h-8 text-gray-200 mb-2" />
            <p className="text-xs text-muted-foreground">No historical quotes for this range</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={288}>
            <AreaChart data={chartData} margin={{ top: 4, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <ReTooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <defs>
                <linearGradient id="streetGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="officialGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              {showStreet && (
                <Area type="monotone" dataKey="street" name="Street" stroke="#F59E0B" strokeWidth={2} fill="url(#streetGradient)" connectNulls />
              )}
              {showOfficial && (
                <Area type="monotone" dataKey="official" name="Official" stroke="#3B82F6" strokeWidth={2} fill="url(#officialGradient)" connectNulls />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
