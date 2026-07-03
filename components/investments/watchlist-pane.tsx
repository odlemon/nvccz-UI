"use client"

import { useMemo } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { setSecurityConfigModalOpen, setSecurityConfigTarget, setPriceDrawerOpen, setPriceDrawerTarget, runIngest } from "@/lib/store/slices/investmentsSlice"
import { SecurityConfigModal } from "./security-config-modal"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { RefreshCw, AlertCircle, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { priceChange, type Security } from "@/lib/api/investments-api"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"
import { ExchangeTag, DirectionDot, Delta } from "./status-pills"

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
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Watchlist</h2>
          <p className="text-xs text-muted-foreground">{watchlist.length} instruments</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gain-muted px-2 py-1 text-[11px] font-medium text-gain-foreground">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gain" />
            Live
          </span>
          {isAdmin && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
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
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card">
            <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-2 text-left font-medium">Symbol</th>
              <th className="px-2 py-2 text-right font-medium">Last</th>
              <th className="px-4 py-2 text-right font-medium">Chg%</th>
              <th className="px-2 py-2" />
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
                  className="cursor-pointer border-t border-border/60 transition-colors hover:bg-muted/60 group"
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <DirectionDot direction={change.direction} />
                      <div className="leading-tight">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-semibold text-foreground">{security.symbol}</span>
                          <ExchangeTag exchange={security.exchangeCode} />
                          {isPending && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <AlertCircle className="w-3 h-3 text-warn-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>Pending review — price outlier</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                        <span className="line-clamp-1 text-[11px] text-muted-foreground">{security.name}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-2.5 text-right font-mono tabular-nums text-foreground">
                    {tick ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className={cn(isFallback && "border-b border-dashed border-muted-foreground text-muted-foreground")}>
                            {change.price?.toFixed(4)}
                          </TooltipTrigger>
                          {isFallback && <TooltipContent>Fallback to prior close</TooltipContent>}
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                    {isIntl && tick && (
                      <span className={cn("ml-1 text-[9px] px-1 rounded", tick.tickFrequency === "LIVE" ? "bg-gain-muted text-gain-foreground" : "bg-muted text-muted-foreground")}>
                        {tick.tickFrequency ?? "EOD"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Delta value={change.pct} direction={change.direction} className="text-xs" />
                  </td>
                  <td className="px-2 py-2.5">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100"
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
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-xs">
            No securities in watchlist
          </div>
        )}
      </div>

      {securityConfigModalOpen && <SecurityConfigModal />}
    </div>
  )
}
