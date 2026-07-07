"use client"

import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import {
  fetchFunds, fetchFundHoldings, fetchFundPnL, fetchSecurities, fetchLatestPrices,
  fetchTrades, fetchValidationQueue, setSelectedFundId, setPnlPeriod,
} from "@/lib/store/slices/investmentsSlice"
import { WatchlistPane } from "./watchlist-pane"
import { HoldingsPane } from "./holdings-pane"
import { RoutingBar } from "./routing-bar"
import { SecurityPriceDrawer } from "./security-price-drawer"
import { TerminalKpiCards } from "./terminal-kpi-cards"
import { TerminalPriceChart } from "./terminal-price-chart"
import { HoldingsAllocationChart } from "./holdings-allocation-chart"
import { CurrencyExposureChart } from "./currency-exposure-chart"
import { TerminalAlertsFeed } from "./terminal-alerts-feed"
import { TerminalTopbar } from "@/components/investments/terminal/topbar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dot, RefreshCw } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

export function UnifiedTerminal() {
  const dispatch = useAppDispatch()
  const { funds, fundsLoading, selectedFundId, pnl, pnlPeriod, priceDrawerOpen } = useAppSelector((s) => s.investments)

  const selectedFund = funds.find((f) => f.id === selectedFundId)

  const refreshAll = () => {
    dispatch(fetchFunds())
    dispatch(fetchSecurities())
    dispatch(fetchLatestPrices())
    dispatch(fetchTrades())
    dispatch(fetchValidationQueue())
    if (selectedFundId) {
      dispatch(fetchFundHoldings(selectedFundId))
      dispatch(fetchFundPnL({ fundId: selectedFundId }))
    }
  }

  const handlePeriodChange = (p: string) => {
    const period = p as "MTD" | "QTD" | "YTD"
    dispatch(setPnlPeriod(period))
    if (selectedFundId) dispatch(fetchFundPnL({ fundId: selectedFundId, period }))
  }

  useEffect(() => {
    dispatch(fetchFunds())
    dispatch(fetchSecurities())
    dispatch(fetchLatestPrices())
    dispatch(fetchTrades())
    dispatch(fetchValidationQueue())
  }, [dispatch])

  useEffect(() => {
    if (!selectedFundId) return
    dispatch(fetchFundHoldings(selectedFundId))
    dispatch(fetchFundPnL({ fundId: selectedFundId }))
  }, [dispatch, selectedFundId])

  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(fetchLatestPrices())
      if (selectedFundId) dispatch(fetchFundHoldings(selectedFundId))
    }, 30_000)
    return () => clearInterval(interval)
  }, [dispatch, selectedFundId])

  return (
    <div className="space-y-5">
      <TerminalTopbar
        title="Dashboard"
        subtitle="Investment operations overview"
        showPeriod
        period={pnlPeriod}
        onPeriodChange={handlePeriodChange}
        actions={
          <>
            {fundsLoading ? (
              <Skeleton className="h-8 w-40" />
            ) : (
              <Select value={selectedFundId ?? ""} onValueChange={(v) => dispatch(setSelectedFundId(v))}>
                <SelectTrigger className="h-8 w-40 text-xs bg-muted/50 border-border">
                  <SelectValue placeholder="Select fund…" />
                </SelectTrigger>
                <SelectContent>
                  {funds.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {selectedFund && (
              <>
                <span className="inline-flex items-center rounded-full border border-border bg-muted/50 px-2.5 py-1 font-mono text-[11px] font-medium text-foreground">
                  {selectedFund.base_currency}
                </span>
                <span className="hidden font-mono text-xs font-semibold whitespace-nowrap text-foreground sm:inline">
                  NAV {selectedFund.base_currency} {selectedFund.nav?.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
                {pnl?.unrealized && (
                  <span className="hidden items-center gap-1 rounded-full bg-muted/50 px-2.5 py-1 font-mono text-[11px] font-medium text-muted-foreground sm:inline-flex">
                    <Dot className="w-2 h-2 text-warn" />
                    ZiG {pnl.unrealized.fxRateUsed.toFixed(4)}
                  </span>
                )}
              </>
            )}

            <Button variant="ghost" size="icon" className="size-8 rounded-full text-muted-foreground" onClick={refreshAll}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </>
        }
      />

      <TerminalKpiCards />

      {/* Chart + allocation */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <TerminalPriceChart />
        </div>
        <HoldingsAllocationChart />
      </div>

      {/* Currency exposure — real data, derived from holdings */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-1">
          <CurrencyExposureChart />
        </div>
        <div className="xl:col-span-2">
          <div className="h-[280px]">
            <TerminalAlertsFeed />
          </div>
        </div>
      </div>

      {/* Watchlist */}
      <div className="h-[520px]">
        <WatchlistPane />
      </div>

      <HoldingsPane />
      <RoutingBar />

      {priceDrawerOpen && <SecurityPriceDrawer />}
    </div>
  )
}
