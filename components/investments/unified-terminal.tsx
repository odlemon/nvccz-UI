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
import { OrderTicketPanel } from "./order-ticket-panel"
import { PageHeader } from "./page-header"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dot, RefreshCw, Plus } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Delta } from "./status-pills"

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
    <div className="min-h-screen space-y-5 p-4 md:p-6">
      <PageHeader
        title="Market Terminal"
        subtitle="Real-time watchlist, holdings, and trade routing"
        actions={
          <>
            {fundsLoading ? (
              <Skeleton className="h-9 w-48" />
            ) : (
              <Select value={selectedFundId ?? ""} onValueChange={(v) => dispatch(setSelectedFundId(v))}>
                <SelectTrigger className="w-48 h-9 text-sm bg-card border-border">
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
                <span className="inline-flex items-center rounded-lg border border-border bg-card px-3 py-2 font-mono text-xs font-medium text-foreground">
                  {selectedFund.base_currency}
                </span>
                <span className="font-mono text-sm font-semibold whitespace-nowrap text-foreground">
                  NAV {selectedFund.base_currency} {selectedFund.nav?.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
                {pnl?.unrealized && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-3 py-2 font-mono text-xs font-medium text-muted-foreground">
                    <Dot className="w-2 h-2 text-warn" />
                    ZiG {pnl.unrealized.fxRateUsed.toFixed(4)}
                  </span>
                )}
              </>
            )}

            <button
              onClick={refreshAll}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={() => dispatch(setExecuteTradeModalOpen(true))}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> New Trade
            </button>
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

      {/* Watchlist + order ticket + feed */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="h-[520px]">
            <WatchlistPane />
          </div>
        </div>
        <div className="lg:col-span-4">
          <OrderTicketPanel />
        </div>
        <div className="lg:col-span-3">
          <div className="h-[520px]">
            <TerminalAlertsFeed />
          </div>
        </div>
      </div>

      <HoldingsPane />
      <RoutingBar />

      {executeTradeModalOpen && <ExecuteTradeModal />}
      {priceDrawerOpen && <SecurityPriceDrawer />}
    </div>
  )
}
