"use client"

import { cn } from "@/lib/utils"
import { money } from "@/lib/investments/format"
import { LATEST_PRICES, SECURITIES } from "@/lib/investments/mock-data"
import { Delta, DirectionDot, ExchangeTag } from "@/components/investments/status-pills"

export function Watchlist({
  activeSymbol,
  onSelect,
}: {
  activeSymbol: string
  onSelect: (symbol: string) => void
}) {
  const rows = SECURITIES.filter((s) => LATEST_PRICES[s.symbol]).map((s) => ({
    security: s,
    tick: LATEST_PRICES[s.symbol],
  }))

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Watchlist</h2>
          <p className="text-xs text-muted-foreground">{rows.length} instruments</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gain-muted px-2 py-1 text-[11px] font-medium text-gain-foreground">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gain" />
          Live
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card">
            <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-2 text-left font-medium">Symbol</th>
              <th className="px-2 py-2 text-right font-medium">Last</th>
              <th className="px-4 py-2 text-right font-medium">Chg%</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ security, tick }) => {
              const active = security.symbol === activeSymbol
              return (
                <tr
                  key={security.id}
                  onClick={() => onSelect(security.symbol)}
                  className={cn(
                    "cursor-pointer border-t border-border/60 transition-colors",
                    active ? "bg-accent" : "hover:bg-muted/60",
                  )}
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <DirectionDot direction={tick.direction} />
                      <div className="leading-tight">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-semibold text-foreground">
                            {security.symbol}
                          </span>
                          <ExchangeTag code={security.exchangeCode} />
                        </div>
                        <span className="line-clamp-1 text-[11px] text-muted-foreground">
                          {security.name}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-2.5 text-right font-mono tabular-nums text-foreground">
                    {money(tick.price)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Delta value={tick.changePct} className="text-xs" />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
