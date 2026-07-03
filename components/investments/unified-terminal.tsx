"use client"

import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import {
  fetchFunds, fetchFundHoldings, fetchFundPnL, fetchSecurities, fetchLatestPrices,
  fetchTrades, fetchValidationQueue, setSelectedFundId, setExecuteTradeModalOpen,
} from "@/lib/store/slices/investmentsSlice"
import { WatchlistPane } from "./watchlist-pane"
import { HoldingsPane } from "./holdings-pane"
import { RoutingBar } from "./routing-bar"
import { ExecuteTradeModal } from "./execute-trade-modal"
import { SecurityPriceDrawer } from "./security-price-drawer"
import { TerminalKpiCards } from "./terminal-kpi-cards"
import { TerminalPriceChart } from "./terminal-price-chart"
import { HoldingsAllocationChart } from "./holdings-allocation-chart"
import { TerminalAlertsFeed } from "./terminal-alerts-feed"
import { TerminalQuickActions } from "./terminal-quick-actions"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dot, RefreshCw, Zap } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export function UnifiedTerminal() {
  const dispatch = useAppDispatch()
  const { funds, fundsLoading, selectedFundId, pnl, executeTradeModalOpen, priceDrawerOpen } = useAppSelector((s) => s.investments)

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
    <div className="p-6 space-y-6 bg-gray-50/30 min-h-screen">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Market Terminal</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Real-time watchlist, holdings, and trade routing</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {fundsLoading ? (
            <Skeleton className="h-9 w-48" />
          ) : (
            <Select value={selectedFundId ?? ""} onValueChange={(v) => dispatch(setSelectedFundId(v))}>
              <SelectTrigger className="w-48 h-9 text-sm bg-white">
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
              <Badge variant="outline" className="font-mono text-xs h-9 px-3">
                {selectedFund.base_currency}
              </Badge>
              <span className="font-mono text-sm font-semibold whitespace-nowrap">
                NAV {selectedFund.base_currency} {selectedFund.nav?.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
              {pnl?.unrealized && (
                <Badge variant="secondary" className="font-mono text-xs gap-1">
                  <Dot className="w-2 h-2 text-amber-500" />
                  ZiG {pnl.unrealized.fxRateUsed.toFixed(4)}
                </Badge>
              )}
            </>
          )}

          <Button variant="outline" size="sm" className="rounded-full h-9 bg-white" onClick={refreshAll}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm" className="rounded-full h-9 gradient-primary text-white shadow"
            onClick={() => dispatch(setExecuteTradeModalOpen(true))}
          >
            <Zap className="w-3.5 h-3.5 mr-1.5" /> Execute Trade
          </Button>
        </div>
      </div>

      {/* ── KPI cards ───────────────────────────────────────────────────────── */}
      <TerminalKpiCards />

      {/* ── Charts row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <TerminalPriceChart />
        <HoldingsAllocationChart />
      </div>

      {/* ── Alerts + Quick Actions row ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <TerminalAlertsFeed />
        <TerminalQuickActions />
      </div>

      {/* ── Operational panels: Watchlist / Holdings ───────────────────────── */}
      <div className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex h-[460px]">
          <div className="flex-1 min-w-0 border-r border-slate-800">
            <WatchlistPane />
          </div>
          <div className="flex-1 min-w-0">
            <HoldingsPane />
          </div>
        </div>
        <RoutingBar />
      </div>

      {executeTradeModalOpen && <ExecuteTradeModal />}
      {priceDrawerOpen && <SecurityPriceDrawer />}
    </div>
  )
}
