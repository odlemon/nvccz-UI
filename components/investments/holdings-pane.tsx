"use client"

import { useAppSelector } from "@/lib/store"
import { effectiveHoldingValue } from "@/lib/api/investments-api"
import { cn } from "@/lib/utils"
import { ExchangeTag, Delta } from "./status-pills"

export function HoldingsPane() {
  const { holdings, holdingsLoading } = useAppSelector((s) => s.investments)

  const totalMv = holdings.reduce((sum, h) => sum + effectiveHoldingValue(h), 0)

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Portfolio Holdings</h2>
          <p className="text-xs text-muted-foreground">{holdings.length} positions · mark-to-market</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total MV</p>
          <p className="font-mono text-sm font-semibold text-foreground">
            {totalMv.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="px-5 py-2.5 text-left font-medium">Security</th>
              <th className="px-3 py-2.5 text-right font-medium">Qty</th>
              <th className="px-3 py-2.5 text-right font-medium">WAC</th>
              <th className="px-3 py-2.5 text-right font-medium">Mkt Value</th>
              <th className="px-3 py-2.5 text-right font-medium">Unrl. P&L</th>
              <th className="px-5 py-2.5 text-right font-medium">Weight</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((h) => {
              const pnlVal = h.unrealizedPnl ?? null
              const mv = h.marketValue ?? null
              const costBasis = h.wac * h.quantity
              const pnlPct = pnlVal !== null && costBasis > 0 ? (pnlVal / costBasis) * 100 : null
              const weight = mv != null && totalMv > 0 ? (mv / totalMv) * 100 : 0
              const stale = mv === null

              return (
                <tr key={h.id} className="border-b border-border/60 last:border-0 hover:bg-muted/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-foreground">
                        {h.security?.symbol ?? h.securityId.slice(0, 8)}
                      </span>
                      {h.security?.exchangeCode && <ExchangeTag exchange={h.security.exchangeCode} />}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right font-mono tabular-nums text-foreground">
                    {h.quantity.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-3 py-3 text-right font-mono tabular-nums text-muted-foreground">
                    {h.wac != null ? h.wac.toFixed(4) : "—"}
                  </td>
                  <td className="px-3 py-3 text-right font-mono tabular-nums text-foreground">
                    {stale ? (
                      <span className="rounded bg-warn-muted px-1.5 py-0.5 text-[11px] font-medium text-warn-foreground">
                        No price
                      </span>
                    ) : (
                      mv!.toLocaleString("en-US", { minimumFractionDigits: 2 })
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {pnlVal === null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <Delta value={pnlVal} direction={pnlVal >= 0 ? "UP" : "DOWN"} suffix="" className="font-medium" />
                        {pnlPct !== null && <Delta value={pnlPct} direction={pnlVal >= 0 ? "UP" : "DOWN"} className="text-[11px]" />}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <div className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-muted sm:block">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${weight}%` }} />
                      </div>
                      <span className="w-10 text-right font-mono tabular-nums text-xs text-muted-foreground">
                        {weight.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              )
            })}
            {holdings.length === 0 && !holdingsLoading && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-sm text-muted-foreground">
                  No holdings — select a fund above
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
