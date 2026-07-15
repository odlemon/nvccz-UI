"use client"

import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchFunds, fetchSecurities, fetchLatestPrices } from "@/lib/store/slices/investmentsSlice"
import { OrderTicketPanel } from "./order-ticket-panel"
import { ExecuteTradeModal } from "./execute-trade-modal"
import { TerminalTopbar } from "./terminal/topbar"
import { TerminalCard } from "./terminal/card"
import { RoutingPipeline, type PipelineHop } from "./routing-pipeline"

const INFO_HOPS: PipelineHop[] = [
  { target: "BROKER", status: "STAGED" },
  { target: "CUSTODIAN", status: "STAGED", skipped: true },
  { target: "CORE_BANKING", status: "STAGED" },
  { target: "ACCOUNTING_GL", status: "STAGED" },
]

/**
 * Permanent home for the order-entry ticket. This page owns the initial
 * data fetch (funds/securities/latest prices) that OrderTicketPanel itself
 * assumes has already happened when embedded inside the Market Terminal
 * dashboard — required so /investments/orders/trading also works as a
 * direct standalone entry point.
 */
export function TradingPageContent() {
  const dispatch = useAppDispatch()
  const { funds, selectedFundId, executeTradeModalOpen } = useAppSelector((s) => s.investments)

  useEffect(() => {
    dispatch(fetchFunds())
    dispatch(fetchSecurities())
    dispatch(fetchLatestPrices())
  }, [dispatch])

  const selectedFund = funds.find((f) => f.id === selectedFundId)

  return (
    <div className="space-y-5">
      <TerminalTopbar title="Trading" subtitle="Order entry, staging, and execution for the active fund" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        <div className="mx-auto w-full max-w-sm lg:mx-0">
          <OrderTicketPanel />
        </div>

        <div className="space-y-5">
          <TerminalCard header={{ title: "Active Fund" }}>
            <p className="text-sm font-medium text-foreground">{selectedFund?.name ?? "No fund selected"}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Base currency: {selectedFund?.base_currency ?? "—"}
            </p>
          </TerminalCard>

          <TerminalCard
            header={{ title: "Routing Path", subtitle: "Every execution dispatches through this pipeline" }}
          >
            <RoutingPipeline mode="compact" hops={INFO_HOPS} />
          </TerminalCard>
        </div>
      </div>

      {executeTradeModalOpen && <ExecuteTradeModal />}
    </div>
  )
}
