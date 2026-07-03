"use client"

import { useAppDispatch, useAppSelector } from "@/lib/store"
import { setExecuteTradeModalOpen } from "@/lib/store/slices/investmentsSlice"
import { effectiveHoldingValue } from "@/lib/api/investments-api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Zap, Minus } from "lucide-react"

export function HoldingsPane() {
  const dispatch = useAppDispatch()
  const { holdings, holdingsLoading, pnl } = useAppSelector((s) => s.investments)

  const totalUnrealized = pnl?.unrealized?.usd ?? 0
  const totalMV         = holdings.reduce((sum, h) => sum + effectiveHoldingValue(h), 0)
  const zigAmount        = pnl?.unrealized?.zig
  const isPositive      = totalUnrealized >= 0

  return (
    <div className="bg-[#0E1626] text-slate-100 h-full flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700/50">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Holdings</span>
        <Button
          size="sm"
          className="h-6 text-xs px-2 rounded-full gradient-primary text-white"
          onClick={() => dispatch(setExecuteTradeModalOpen(true))}
        >
          <Zap className="w-3 h-3 mr-1" /> Execute Trade
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-[#070A13]">
            <tr className="text-slate-500">
              <th className="text-left px-3 py-1.5 font-medium">Asset</th>
              <th className="text-right px-3 py-1.5 font-medium">Qty</th>
              <th className="text-right px-3 py-1.5 font-medium">WAC</th>
              <th className="text-right px-3 py-1.5 font-medium">Value</th>
              <th className="text-right px-3 py-1.5 font-medium">Unreal P&L</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((h) => {
              const pnlVal  = h.unrealizedPnl ?? null
              const mv      = h.marketValue ?? null
              const costBasis = h.wac * h.quantity
              const pnlPct  = pnlVal !== null && costBasis > 0
                ? (pnlVal / costBasis) * 100
                : null
              const pos = pnlVal !== null ? pnlVal >= 0 : null

              return (
                <tr key={h.id} className="h-8 border-b border-slate-800/50">
                  <td className="px-3 py-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-medium text-slate-100">
                        {h.security?.symbol ?? h.securityId.slice(0, 8)}
                      </span>
                      {h.security?.exchangeCode && (
                        <span className="text-slate-600 text-[10px]">{h.security.exchangeCode}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-0 text-right font-mono text-slate-300">
                    {h.quantity.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-3 py-0 text-right font-mono text-slate-300">
                    {h.wac != null ? h.wac.toFixed(4) : "—"}
                  </td>
                  <td className="px-3 py-0 text-right font-mono text-slate-100">
                    {mv != null
                      ? mv.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : <span className="text-slate-600">—</span>
                    }
                  </td>
                  <td className="px-3 py-0 text-right font-mono">
                    {pnlVal !== null && pos !== null ? (
                      <div className="flex items-center justify-end gap-1">
                        {pos ? (
                          <TrendingUp className="w-3 h-3 text-[#10B981]" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-[#EF4444]" />
                        )}
                        <span className={cn(pos ? "text-[#10B981]" : "text-[#EF4444]")}>
                          {pos ? "+" : ""}
                          {pnlVal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        {pnlPct !== null && (
                          <span className={cn("text-[10px]", pos ? "text-[#10B981]" : "text-[#EF4444]")}>
                            ({pos ? "+" : ""}{pnlPct.toFixed(2)}%)
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <Minus className="w-3 h-3 text-slate-600" />
                        <span className="text-slate-600">—</span>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {holdings.length === 0 && !holdingsLoading && (
          <div className="flex flex-col items-center justify-center h-32 text-slate-600 text-xs">
            No holdings — select a fund above
          </div>
        )}
      </div>

      {/* Footer summary */}
      <div className="border-t border-slate-700/50 px-3 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-[10px] text-slate-500 mb-0.5">Unrealized P&L</div>
            <span className={cn("font-mono text-sm font-semibold", isPositive ? "text-[#10B981]" : "text-[#EF4444]")}>
              {isPositive ? "+" : ""}
              {totalUnrealized.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            {zigAmount != null && (
              <span className="ml-2 font-mono text-xs text-amber-400">
                / ZiG {zigAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 font-mono">
            MV: {totalMV.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
          <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400 font-mono">
            {holdings.length} positions
          </Badge>
        </div>
      </div>
    </div>
  )
}
