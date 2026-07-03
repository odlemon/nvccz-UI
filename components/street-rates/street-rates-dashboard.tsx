"use client"

import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { format, formatDistanceToNow } from "date-fns"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchWidget, fetchCompare, fetchConfigs, setContext, setFromToCurrency, setGlobalAsOfDate } from "@/lib/store/slices/streetRatesSlice"
import { HeroRateCard } from "./hero-rate-card"
import { RateKpiCards } from "./rate-kpi-cards"
import { RateHistoryChart } from "./rate-history-chart"
import { RateComparisonPanel } from "./rate-comparison-panel"
import { StreetRatesDashboardSkeleton } from "./street-rates-dashboard-skeleton"
import { EmptyState } from "./empty-state"
import { CURRENCIES } from "./format"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { RefreshCw, Settings, ArrowLeftRight, Calendar as CalendarIcon, X } from "lucide-react"

const FALLBACK_CONTEXTS = [
  "GENERIC", "DASHBOARD_ACCOUNTING", "DASHBOARD_PORTFOLIO", "DASHBOARD_CEO", "PRICING_LISTED_EQUITY", "LP_PORTAL",
]

const CONTEXT_LABELS: Record<string, string> = {
  GENERIC: "Generic",
  DASHBOARD_ACCOUNTING: "Accounting Dashboard",
  DASHBOARD_PORTFOLIO: "Portfolio Dashboard",
  DASHBOARD_CEO: "CEO Dashboard",
  PRICING_LISTED_EQUITY: "Listed Equity Pricing",
  LP_PORTAL: "LP Portal",
}

export function StreetRatesDashboard() {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const {
    widget, widgetLoading, widgetError, compare, context, configs,
    fromCurrency, toCurrency, globalAsOfDate,
  } = useAppSelector((s) => s.streetRates)

  const contextOptions = useMemo(() => {
    const fromConfigs = configs.map((c) => c.contextCode)
    return Array.from(new Set([...FALLBACK_CONTEXTS, ...fromConfigs]))
  }, [configs])

  const refresh = () => {
    dispatch(fetchWidget({ context, from: fromCurrency, to: toCurrency, asOfDate: globalAsOfDate ?? undefined }))
    dispatch(fetchCompare({ from: fromCurrency, to: toCurrency, asOfDate: globalAsOfDate ?? undefined }))
  }

  useEffect(() => {
    dispatch(fetchConfigs())
  }, [dispatch])

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, context, fromCurrency, toCurrency, globalAsOfDate])

  useEffect(() => {
    const interval = setInterval(refresh, 30_000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context, fromCurrency, toCurrency, globalAsOfDate])

  const isInitialLoading = widgetLoading && !widget

  if (isInitialLoading) {
    return <StreetRatesDashboardSkeleton />
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50/30 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Street Exchange Rates</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {widget ? `Updated ${formatDistanceToNow(new Date(widget.meta.fetchedAt), { addSuffix: true })}` : "Live street vs official USD/ZWG rate intelligence"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-full h-9 bg-white" onClick={refresh}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="outline" size="sm" className="rounded-full h-9 bg-white"
            onClick={() => router.push("/street-rates/config")}
          >
            <Settings className="w-3.5 h-3.5 mr-1.5" /> Configure
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={context} onValueChange={(v) => dispatch(setContext(v))}>
          <SelectTrigger className="w-52 h-9 text-sm bg-white">
            <SelectValue placeholder="Context…" />
          </SelectTrigger>
          <SelectContent>
            {contextOptions.map((c) => (
              <SelectItem key={c} value={c}>{CONTEXT_LABELS[c] ?? c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1.5">
          <Select value={fromCurrency} onValueChange={(v) => dispatch(setFromToCurrency({ from: v, to: toCurrency }))}>
            <SelectTrigger className="w-24 h-9 text-sm bg-white font-mono">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <ArrowLeftRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <Select value={toCurrency} onValueChange={(v) => dispatch(setFromToCurrency({ from: fromCurrency, to: v }))}>
            <SelectTrigger className="w-24 h-9 text-sm bg-white font-mono">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Global as-of-date filter — applies to the hero widget and comparison panel */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 rounded-full gap-1.5 text-xs bg-white">
              <CalendarIcon className="w-3.5 h-3.5" />
              {globalAsOfDate ? format(new Date(globalAsOfDate), "dd MMM yyyy") : "As of: Latest"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 rounded-2xl border-none shadow-2xl" align="start">
            <CalendarComponent
              mode="single"
              selected={globalAsOfDate ? new Date(globalAsOfDate) : undefined}
              onSelect={(d) => d && dispatch(setGlobalAsOfDate(d.toISOString().slice(0, 10)))}
            />
          </PopoverContent>
        </Popover>
        {globalAsOfDate && (
          <Button
            variant="ghost" size="icon" className="h-9 w-9 rounded-full text-gray-400 hover:text-gray-700"
            onClick={() => dispatch(setGlobalAsOfDate(null))}
            title="Reset to latest"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {!widget || !widget.primary ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="No Rate Data Available"
          description={
            widgetError
              ? "We couldn't load the street exchange rate for this context. Try refreshing, or check the configuration."
              : `No display configuration found for "${CONTEXT_LABELS[context] ?? context}" (${fromCurrency}/${toCurrency}). Create one to start displaying rates here.`
          }
          actionLabel="Go to Configuration"
          onAction={() => router.push("/street-rates/config")}
        />
      ) : (
        <>
          <HeroRateCard />
          <RateKpiCards />
          <RateHistoryChart />
          {compare && <RateComparisonPanel />}
        </>
      )}
    </div>
  )
}
