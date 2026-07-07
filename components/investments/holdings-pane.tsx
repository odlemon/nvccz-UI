"use client"

import { useAppSelector } from "@/lib/store"
import { effectiveHoldingValue } from "@/lib/api/investments-api"
import { ExchangeTag, Delta } from "./status-pills"
import { TerminalCard } from "@/components/investments/terminal/card"
import { TerminalTable, TerminalThead, TerminalTr, TerminalTh, TerminalTd, TerminalEmptyRow } from "@/components/investments/terminal/data-table"

export function HoldingsPane() {
  const { holdings, holdingsLoading } = useAppSelector((s) => s.investments)

  const totalMv = holdings.reduce((sum, h) => sum + effectiveHoldingValue(h), 0)

  return (
    <TerminalCard
      header={{
        title: "Portfolio Holdings",
        subtitle: `${holdings.length} positions · mark-to-market`,
        actions: (
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total MV</p>
            <p className="font-mono text-sm font-semibold text-foreground">
              {totalMv.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>
        ),
      }}
      bodyClassName="overflow-x-auto"
      noPadding
    >
      <TerminalTable>
        <TerminalThead>
          <TerminalTr>
            <TerminalTh>Security</TerminalTh>
            <TerminalTh align="right">Qty</TerminalTh>
            <TerminalTh align="right">WAC</TerminalTh>
            <TerminalTh align="right">Mkt Value</TerminalTh>
            <TerminalTh align="right">Unrl. P&L</TerminalTh>
            <TerminalTh align="right">Weight</TerminalTh>
          </TerminalTr>
        </TerminalThead>
        <tbody>
          {holdings.map((h) => {
            const pnlVal = h.unrealizedPnl ?? null
            const mv = h.marketValue ?? null
            const costBasis = h.wac * h.quantity
            const pnlPct = pnlVal !== null && costBasis > 0 ? (pnlVal / costBasis) * 100 : null
            const weight = mv != null && totalMv > 0 ? (mv / totalMv) * 100 : 0
            const stale = mv === null

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
                <TerminalTd align="right" mono>
                  {h.quantity.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </TerminalTd>
                <TerminalTd align="right" mono className="text-muted-foreground">
                  {h.wac != null ? h.wac.toFixed(4) : "—"}
                </TerminalTd>
                <TerminalTd align="right" mono>
                  {stale ? (
                    <span className="rounded bg-warn-muted px-1.5 py-0.5 text-[11px] font-medium text-warn-foreground">
                      No price
                    </span>
                  ) : (
                    mv!.toLocaleString("en-US", { minimumFractionDigits: 2 })
                  )}
                </TerminalTd>
                <TerminalTd align="right">
                  {pnlVal === null ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <div className="flex items-center justify-end gap-1">
                      <Delta value={pnlVal} direction={pnlVal >= 0 ? "UP" : "DOWN"} suffix="" className="font-medium" />
                      {pnlPct !== null && <Delta value={pnlPct} direction={pnlVal >= 0 ? "UP" : "DOWN"} className="text-[11px]" />}
                    </div>
                  )}
                </TerminalTd>
                <TerminalTd>
                  <div className="flex items-center justify-end gap-2">
                    <div className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-muted sm:block">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${weight}%` }} />
                    </div>
                    <span className="w-10 text-right font-mono tabular-nums text-xs text-muted-foreground">
                      {weight.toFixed(1)}%
                    </span>
                  </div>
                </TerminalTd>
              </TerminalTr>
            )
          })}
          {holdings.length === 0 && !holdingsLoading && (
            <TerminalEmptyRow colSpan={6}>No holdings — select a fund above</TerminalEmptyRow>
          )}
        </tbody>
      </TerminalTable>
    </TerminalCard>
  )
}
