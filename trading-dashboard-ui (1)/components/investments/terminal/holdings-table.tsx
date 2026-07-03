import { cn } from "@/lib/utils"
import { money, qty as fmtQty } from "@/lib/investments/format"
import { HOLDINGS } from "@/lib/investments/mock-data"
import { ExchangeTag } from "@/components/investments/status-pills"

export function HoldingsTable() {
  const totalMv = HOLDINGS.reduce((s, h) => s + (h.marketValue ?? 0), 0)

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Portfolio Holdings</h2>
          <p className="text-xs text-muted-foreground">{HOLDINGS.length} positions · mark-to-market</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total MV</p>
          <p className="font-mono text-sm font-semibold text-foreground">${money(totalMv)}</p>
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
            {HOLDINGS.map((h) => {
              const pnl = h.unrealizedPnl
              const weight = h.marketValue ? (h.marketValue / totalMv) * 100 : 0
              const stale = h.marketValue === null
              return (
                <tr key={h.id} className="border-b border-border/60 last:border-0 hover:bg-muted/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-foreground">
                        {h.security.symbol}
                      </span>
                      <ExchangeTag code={h.security.exchangeCode} />
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right font-mono tabular-nums text-foreground">
                    {fmtQty(h.quantity)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono tabular-nums text-muted-foreground">
                    {money(h.wac)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono tabular-nums text-foreground">
                    {stale ? (
                      <span className="rounded bg-warn-muted px-1.5 py-0.5 text-[11px] font-medium text-warn-foreground">
                        No price
                      </span>
                    ) : (
                      `$${money(h.marketValue!)}`
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {pnl === null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <span
                        className={cn(
                          "font-mono tabular-nums font-medium",
                          pnl > 0 ? "text-gain" : pnl < 0 ? "text-loss" : "text-muted-foreground",
                        )}
                      >
                        {pnl > 0 ? "+" : ""}
                        {money(pnl)}
                      </span>
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
          </tbody>
        </table>
      </div>
    </div>
  )
}
