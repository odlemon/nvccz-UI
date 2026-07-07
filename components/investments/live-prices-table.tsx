"use client"

import { useEffect, useMemo, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchSecurities, fetchLatestPrices, setPriceDrawerTarget, setPriceDrawerOpen } from "@/lib/store/slices/investmentsSlice"
import { priceChange, type Security } from "@/lib/api/investments-api"
import { Skeleton } from "@/components/ui/skeleton"
import { ExchangeTag, Delta, DirectionDot } from "./status-pills"
import { TerminalCard } from "@/components/investments/terminal/card"
import { TerminalTable, TerminalThead, TerminalTr, TerminalTh, TerminalTd, TerminalEmptyRow } from "@/components/investments/terminal/data-table"
import { TerminalStatusBadge } from "@/components/investments/terminal/status-badge"
import { SecurityPriceDrawer } from "./security-price-drawer"

// Real data — every security's most recent tick, straight from
// state.investments.securities / latestPrices. This is the flat "all
// instruments" view; the Dashboard's WatchlistPane shows the same data
// scoped to isActive securities only.
export function LivePricesTable() {
  const dispatch = useAppDispatch()
  const { securities, securitiesLoading, latestPrices, priceDrawerOpen } = useAppSelector((s) => s.investments)
  const [search, setSearch] = useState("")

  useEffect(() => {
    dispatch(fetchSecurities())
    dispatch(fetchLatestPrices())
  }, [dispatch])

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return securities
    return securities.filter((s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))
  }, [securities, search])

  const openDrawer = (security: Security) => {
    dispatch(setPriceDrawerTarget(security))
    dispatch(setPriceDrawerOpen(true))
  }

  return (
    <div className="space-y-4">
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search symbol or name…"
        className="h-9 w-full max-w-xs rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-primary"
      />

      {securitiesLoading ? (
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
        </div>
      ) : (
        <TerminalCard noPadding bodyClassName="overflow-x-auto">
          <TerminalTable>
            <TerminalThead>
              <TerminalTr>
                <TerminalTh>Symbol</TerminalTh>
                <TerminalTh>Name</TerminalTh>
                <TerminalTh align="center">Exchange</TerminalTh>
                <TerminalTh align="right">Last</TerminalTh>
                <TerminalTh align="right">Chg%</TerminalTh>
                <TerminalTh align="center">Validation</TerminalTh>
                <TerminalTh align="center">Source</TerminalTh>
              </TerminalTr>
            </TerminalThead>
            <tbody>
              {rows.map((security) => {
                const tick = latestPrices[security.symbol] ?? latestPrices[security.id]
                const change = priceChange(tick)
                return (
                  <TerminalTr key={security.id} clickable onClick={() => openDrawer(security)}>
                    <TerminalTd>
                      <div className="flex items-center gap-2">
                        <DirectionDot direction={change.direction} />
                        <span className="font-mono text-xs font-semibold text-foreground">{security.symbol}</span>
                      </div>
                    </TerminalTd>
                    <TerminalTd className="text-muted-foreground">{security.name}</TerminalTd>
                    <TerminalTd align="center"><ExchangeTag exchange={security.exchangeCode} /></TerminalTd>
                    <TerminalTd align="right" mono>
                      {tick ? change.price?.toFixed(4) : <span className="text-muted-foreground">—</span>}
                    </TerminalTd>
                    <TerminalTd align="right">
                      {tick ? <Delta value={change.pct} direction={change.direction} className="text-xs" /> : <span className="text-muted-foreground">—</span>}
                    </TerminalTd>
                    <TerminalTd align="center">
                      {tick ? <TerminalStatusBadge status={tick.validationStatus} /> : <span className="text-xs text-muted-foreground">—</span>}
                    </TerminalTd>
                    <TerminalTd align="center">
                      {tick ? <TerminalStatusBadge status={tick.sourceStatus} /> : <span className="text-xs text-muted-foreground">—</span>}
                    </TerminalTd>
                  </TerminalTr>
                )
              })}
              {rows.length === 0 && <TerminalEmptyRow colSpan={7}>No securities match your search</TerminalEmptyRow>}
            </tbody>
          </TerminalTable>
        </TerminalCard>
      )}

      {priceDrawerOpen && <SecurityPriceDrawer />}
    </div>
  )
}
