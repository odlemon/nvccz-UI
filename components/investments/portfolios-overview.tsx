"use client"

import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchFunds, fetchFundHoldings, fetchFundPnL, setSelectedFundId } from "@/lib/store/slices/investmentsSlice"
import { effectiveHoldingValue } from "@/lib/api/investments-api"
import { TerminalTopbar } from "@/components/investments/terminal/topbar"
import { FolderTabs } from "@/components/investments/terminal/folder-tabs"
import { TerminalStatCard } from "@/components/investments/terminal/stat-card"
import { HoldingsPane } from "@/components/investments/holdings-pane"
import { Skeleton } from "@/components/ui/skeleton"

export function PortfoliosOverview() {
  const dispatch = useAppDispatch()
  const { funds, fundsLoading, selectedFundId, holdings, holdingsLoading, pnl, pnlLoading } = useAppSelector((s) => s.investments)

  const selectedFund = funds.find((f) => f.id === selectedFundId)

  useEffect(() => {
    dispatch(fetchFunds())
  }, [dispatch])

  useEffect(() => {
    if (!selectedFundId) return
    dispatch(fetchFundHoldings(selectedFundId))
    dispatch(fetchFundPnL({ fundId: selectedFundId }))
  }, [dispatch, selectedFundId])

  const totalMarketValue = holdings.reduce((sum, h) => sum + effectiveHoldingValue(h), 0)

  return (
    <div className="space-y-5">
      <TerminalTopbar title="Portfolios" subtitle="Fund overview — NAV, holdings, and P&L" />

      {fundsLoading ? (
        <Skeleton className="h-9 w-full max-w-md" />
      ) : (
        <FolderTabs
          items={funds.map((f) => ({ id: f.id, label: f.name }))}
          activeId={selectedFundId}
          onChange={(id) => dispatch(setSelectedFundId(id))}
        />
      )}

      {!fundsLoading && funds.length === 0 && (
        <p className="text-sm text-muted-foreground">No funds available.</p>
      )}

      {selectedFund && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <TerminalStatCard
              label="NAV"
              value={
                holdingsLoading
                  ? "…"
                  : `${selectedFund.base_currency} ${selectedFund.nav?.toLocaleString("en-US", { minimumFractionDigits: 2 }) ?? "—"}`
              }
              subValue={selectedFund.nav_updated_at ? `Updated ${new Date(selectedFund.nav_updated_at).toLocaleString()}` : "Not yet valued"}
            />
            <TerminalStatCard
              label="Market Value"
              value={holdingsLoading ? "…" : totalMarketValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              subValue={`${holdings.length} position${holdings.length === 1 ? "" : "s"}`}
            />
            <TerminalStatCard
              label="Unrealized P&L"
              value={pnlLoading ? "…" : (pnl?.unrealized?.usd ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              subValue={pnl?.unrealized ? `FX ${pnl.unrealized.fxRateUsed.toFixed(4)} (${pnl.unrealized.fxRateSource})` : "No valuation yet"}
            />
            <TerminalStatCard
              label="Realized P&L"
              value={pnlLoading ? "…" : (pnl?.realized?.usd ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              subValue="All-time"
            />
          </div>

          <HoldingsPane />
        </>
      )}
    </div>
  )
}
