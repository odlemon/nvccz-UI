"use client"

import { useState } from "react"
import { Download, Plus, RefreshCw } from "lucide-react"
import { KpiRow } from "@/components/investments/terminal/kpi-row"
import { NavChart } from "@/components/investments/terminal/nav-chart"
import { AllocationDonut } from "@/components/investments/terminal/allocation-donut"
import { Watchlist } from "@/components/investments/terminal/watchlist"
import { OrderTicket } from "@/components/investments/terminal/order-ticket"
import { HoldingsTable } from "@/components/investments/terminal/holdings-table"
import { AlertsFeed } from "@/components/investments/terminal/alerts-feed"
import { PageHeader } from "@/components/investments/page-header"

export function UnifiedTerminal() {
  const [symbol, setSymbol] = useState("NVDA.US")

  return (
    <div className="space-y-5 p-4 md:p-6">
      <PageHeader
        title="Market Terminal"
        subtitle="Imara Absolute Return · Global multi-exchange desk"
        actions={
          <>
            <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">
              <Download className="h-4 w-4" /> Export
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
              <Plus className="h-4 w-4" /> New Trade
            </button>
          </>
        }
      />

      <KpiRow />

      {/* Chart + allocation */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <NavChart />
        </div>
        <AllocationDonut />
      </div>

      {/* Watchlist + order ticket + feed */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-5 xl:col-span-5">
          <div className="h-[520px]">
            <Watchlist activeSymbol={symbol} onSelect={setSymbol} />
          </div>
        </div>
        <div className="lg:col-span-4 xl:col-span-4">
          <OrderTicket symbol={symbol} />
        </div>
        <div className="lg:col-span-3 xl:col-span-3">
          <div className="h-[520px]">
            <AlertsFeed />
          </div>
        </div>
      </div>

      <HoldingsTable />
    </div>
  )
}
