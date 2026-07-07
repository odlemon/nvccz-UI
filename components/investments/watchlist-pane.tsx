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
import { TerminalCard } from "@/components/investments/terminal/card"
import { TerminalTable, TerminalThead, TerminalTr, TerminalTh, TerminalTd, TerminalEmptyRow } from "@/components/investments/terminal/data-table"

export function WatchlistPane() {
  const dispatch = useAppDispatch()
  const { securities, latestPrices, ingestRunning, securityConfigModalOpen } = useAppSelector((s) => s.investments)
  const { hasSubModuleAccess } = useRolePermissions()
  const isAdmin = hasSubModuleAccess("investments", "investments-portfolios-prices")

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
    <TerminalCard
      className="h-full"
      bodyClassName="min-h-0 flex-1 overflow-y-auto"
      noPadding
      header={{
        title: "Watchlist",
        subtitle: `${watchlist.length} instruments`,
        actions: (
          <>
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
          </>
        ),
      }}
    >
      <TerminalTable>
        <TerminalThead className="sticky top-0 bg-card">
          <TerminalTr>
            <TerminalTh>Symbol</TerminalTh>
            <TerminalTh align="right">Last</TerminalTh>
            <TerminalTh align="right">Chg%</TerminalTh>
            <TerminalTh />
          </TerminalTr>
        </TerminalThead>
        <tbody>
          {watchlist.map((security) => {
            const tick = latestPrices[security.symbol] ?? latestPrices[security.id]
            const isPending = tick?.validationStatus === "PENDING_REVIEW"
            const isFallback = tick?.sourceStatus === "FALLBACK"
            const change = priceChange(tick)
            const isIntl = ["NYSE", "NASDAQ", "LSE", "VFEX"].includes(security.exchangeCode)

            return (
              <TerminalTr key={security.id} clickable onClick={() => handleRowClick(security)} className="group">
                <TerminalTd>
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
                </TerminalTd>
                <TerminalTd align="right" mono>
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
                </TerminalTd>
                <TerminalTd align="right">
                  <Delta value={change.pct} direction={change.direction} className="text-xs" />
                </TerminalTd>
                <TerminalTd>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-5 w-5 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100"
                    onClick={(e) => handleConfigClick(e, security)}
                  >
                    <Settings className="w-3 h-3" />
                  </Button>
                </TerminalTd>
              </TerminalTr>
            )
          })}
          {watchlist.length === 0 && <TerminalEmptyRow colSpan={4}>No securities in watchlist</TerminalEmptyRow>}
        </tbody>
      </TerminalTable>

      {securityConfigModalOpen && <SecurityConfigModal />}
    </TerminalCard>
  )
}
