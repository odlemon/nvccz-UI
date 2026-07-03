"use client"

import { useMemo } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { setSecurityConfigModalOpen, setSecurityConfigTarget, setPriceDrawerOpen, setPriceDrawerTarget, runIngest } from "@/lib/store/slices/investmentsSlice"
import { SecurityConfigModal } from "./security-config-modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { TrendingUp, TrendingDown, Minus, RefreshCw, AlertCircle, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { priceChange, type Security } from "@/lib/api/investments-api"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"

function DirectionIcon({ direction }: { direction?: "UP" | "DOWN" | "FLAT" }) {
  if (direction === "UP") return <TrendingUp className="w-3.5 h-3.5 text-[#10B981]" />
  if (direction === "DOWN") return <TrendingDown className="w-3.5 h-3.5 text-[#EF4444]" />
  return <Minus className="w-3.5 h-3.5 text-[#6B7280]" />
}

function ExchangeBadge({ exchange }: { exchange: string }) {
  const intl = ["NYSE", "NASDAQ", "LSE", "VFEX"].includes(exchange)
  return (
    <Badge
      variant="outline"
      className={cn("text-[10px] px-1 py-0 font-mono", intl ? "border-blue-400 text-blue-400" : "border-slate-500 text-slate-400")}
    >
      {exchange}
    </Badge>
  )
}

export function WatchlistPane() {
  const dispatch = useAppDispatch()
  const { securities, latestPrices, ingestRunning, securityConfigModalOpen } = useAppSelector((s) => s.investments)
  const { hasSubModuleAccess } = useRolePermissions()
  const isAdmin = hasSubModuleAccess("investments", "investments-market-data")

  const watchlist = useMemo(() => securities.filter((s) => s.isActive), [securities])

  const handleRowClick = (security: Security) => {
    dispatch(setPriceDrawerTarget(security))
    dispatch(setPriceDrawerOpen(true))
  }

  const handleConfigClick = (e: React.MouseEvent, security: Security) => {
    e.stopPropagation()
    dispatch(setSecurityConfigTarget(security))
    dispatch(setSecurityConfigModalOpen(true))
  }

  const handleForceIngest = () => {
    dispatch(runIngest("ALL"))
  }

  return (
    <div className="bg-[#0E1626] text-slate-100 h-full flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700/50">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Watchlist</span>
        {isAdmin && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-slate-400 hover:text-slate-100"
                  onClick={handleForceIngest}
                  disabled={ingestRunning}
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", ingestRunning && "animate-spin")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Force Aggregation Run</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-[#070A13]">
            <tr className="text-slate-500">
              <th className="text-left px-3 py-1.5 font-medium">Symbol</th>
              <th className="text-left px-1 py-1.5 font-medium">Exch</th>
              <th className="text-right px-3 py-1.5 font-medium">Price</th>
              <th className="text-right px-3 py-1.5 font-medium">Chg%</th>
              <th className="px-2 py-1.5" />
              <th className="px-2 py-1.5" />
            </tr>
          </thead>
          <tbody>
            {watchlist.map((security) => {
              const tick = latestPrices[security.symbol] ?? latestPrices[security.id]
              const isPending = tick?.validationStatus === "PENDING_REVIEW"
              const isFallback = tick?.sourceStatus === "FALLBACK"
              const change = priceChange(tick)
              const isIntl = ["NYSE", "NASDAQ", "LSE", "VFEX"].includes(security.exchangeCode)

              return (
                <tr
                  key={security.id}
                  onClick={() => handleRowClick(security)}
                  className={cn(
                    "h-8 cursor-pointer transition-colors hover:bg-slate-700/30 group",
                    isPending && "border-l-2 border-amber-400"
                  )}
                >
                  <td className="px-3 py-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-medium text-slate-100">{security.symbol}</span>
                      {isPending && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <AlertCircle className="w-3 h-3 text-amber-400" />
                            </TooltipTrigger>
                            <TooltipContent>Pending review — price outlier</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </td>
                  <td className="px-1 py-0">
                    <ExchangeBadge exchange={security.exchangeCode} />
                  </td>
                  <td className="px-3 py-0 text-right">
                    {tick ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="font-mono text-slate-100">
                            {isFallback ? (
                              <span className="border-b border-dashed border-slate-500 text-slate-400">
                                {change.price?.toFixed(4)}
                              </span>
                            ) : (
                              change.price?.toFixed(4)
                            )}
                          </TooltipTrigger>
                          {isFallback && <TooltipContent>Fallback to prior close</TooltipContent>}
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                    {isIntl && tick && (
                      <span className={cn("ml-1 text-[9px] px-1 rounded", tick.tickFrequency === "LIVE" ? "bg-emerald-900/60 text-emerald-400" : "bg-slate-700 text-slate-400")}>
                        {tick.tickFrequency ?? "EOD"}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-0 text-right font-mono">
                    {change.pct !== null ? (
                      <span className={cn(change.direction === "UP" ? "text-[#10B981]" : change.direction === "DOWN" ? "text-[#EF4444]" : "text-[#6B7280]")}>
                        {change.pct >= 0 ? "+" : ""}{change.pct.toFixed(2)}%
                      </span>
                    ) : (
                      <span className="text-[#6B7280]">—</span>
                    )}
                  </td>
                  <td className="px-2 py-0">
                    <DirectionIcon direction={change.direction} />
                  </td>
                  <td className="px-2 py-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5 text-slate-500 hover:text-slate-100 opacity-0 group-hover:opacity-100"
                      onClick={(e) => handleConfigClick(e, security)}
                    >
                      <Settings className="w-3 h-3" />
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {watchlist.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-slate-600 text-xs">
            No securities in watchlist
          </div>
        )}
      </div>

      {securityConfigModalOpen && <SecurityConfigModal />}
    </div>
  )
}
