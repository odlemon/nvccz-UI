"use client"

import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchFunds, fetchFundHoldings } from "@/lib/store/slices/investmentsSlice"
import { effectiveHoldingValue } from "@/lib/api/investments-api"
import { TerminalTopbar } from "@/components/investments/terminal/topbar"
import { TerminalCard } from "@/components/investments/terminal/card"
import { TerminalTable, TerminalThead, TerminalTr, TerminalTh, TerminalTd, TerminalEmptyRow } from "@/components/investments/terminal/data-table"
import { ExchangeTag, Delta } from "./status-pills"
import { Skeleton } from "@/components/ui/skeleton"

// The API's Holding shape (lib/api/investments-api.ts) does not carry
// country, sector, realized P&L, open-date, or a pre-computed portfolio
// weight. Rather than fabricate those figures on a page that also shows
// real P&L, every one of those columns renders a muted "—" until the
// backend actually exposes them.
const NOT_AVAILABLE = <span className="text-muted-foreground">—</span>

export function PositionsTable() {
  const dispatch = useAppDispatch()
  const { funds, selectedFundId, holdings, holdingsLoading } = useAppSelector((s) => s.investments)
  const selectedFund = funds.find((f) => f.id === selectedFundId)

  useEffect(() => {
    dispatch(fetchFunds())
  }, [dispatch])

  useEffect(() => {
    if (!selectedFundId) return
    dispatch(fetchFundHoldings(selectedFundId))
  }, [dispatch, selectedFundId])

  return (
    <div className="space-y-5">
      <TerminalTopbar
        title="Positions"
        subtitle={selectedFund ? `Open positions — ${selectedFund.name}` : "Open positions"}
      />

      {holdingsLoading ? (
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
        </div>
      ) : (
        <TerminalCard noPadding bodyClassName="overflow-x-auto">
          <TerminalTable className="min-w-[1100px]">
            <TerminalThead>
              <TerminalTr>
                <TerminalTh>Security</TerminalTh>
                <TerminalTh>Country</TerminalTh>
                <TerminalTh>Sector</TerminalTh>
                <TerminalTh align="right">Quantity</TerminalTh>
                <TerminalTh align="right">WAC</TerminalTh>
                <TerminalTh align="right">Market Value</TerminalTh>
                <TerminalTh align="right">Unrealized P&L</TerminalTh>
                <TerminalTh align="right">Realized P&L</TerminalTh>
                <TerminalTh>Open Date</TerminalTh>
                <TerminalTh align="right">Weight %</TerminalTh>
              </TerminalTr>
            </TerminalThead>
            <tbody>
              {holdings.map((h) => {
                const pnlVal = h.unrealizedPnl ?? null
                const mv = effectiveHoldingValue(h)
                return (
                  <TerminalTr key={h.id}>
                    <TerminalTd>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-foreground">
                          {h.security?.symbol ?? h.securityId.slice(0, 8)}
                        </span>
                        {h.security?.exchangeCode && <ExchangeTag exchange={h.security.exchangeCode} />}
                      </div>
                    </TerminalTd>
                    <TerminalTd>{NOT_AVAILABLE}</TerminalTd>
                    <TerminalTd>{NOT_AVAILABLE}</TerminalTd>
                    <TerminalTd align="right" mono>
                      {h.quantity.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                    </TerminalTd>
                    <TerminalTd align="right" mono className="text-muted-foreground">
                      {h.wac != null ? h.wac.toFixed(4) : "—"}
                    </TerminalTd>
                    <TerminalTd align="right" mono>
                      {mv.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </TerminalTd>
                    <TerminalTd align="right">
                      {pnlVal === null ? <span className="text-muted-foreground">—</span> : (
                        <Delta value={pnlVal} direction={pnlVal >= 0 ? "UP" : "DOWN"} suffix="" className="font-medium" />
                      )}
                    </TerminalTd>
                    <TerminalTd align="right">{NOT_AVAILABLE}</TerminalTd>
                    <TerminalTd>{NOT_AVAILABLE}</TerminalTd>
                    <TerminalTd align="right">{NOT_AVAILABLE}</TerminalTd>
                  </TerminalTr>
                )
              })}
              {holdings.length === 0 && (
                <TerminalEmptyRow colSpan={10}>No open positions for this fund</TerminalEmptyRow>
              )}
            </tbody>
          </TerminalTable>
        </TerminalCard>
      )}
    </div>
  )
}
