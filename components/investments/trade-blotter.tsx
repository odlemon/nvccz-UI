"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { isSameDay } from "date-fns"
import { cn } from "@/lib/utils"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchTrades, setTradeFilter, setExecuteTradeModalOpen } from "@/lib/store/slices/investmentsSlice"
import { Skeleton } from "@/components/ui/skeleton"
import { PanelRightOpen, Plus, RefreshCw, SlidersHorizontal } from "lucide-react"
import { isSkippedInternal } from "@/lib/api/investments-api"
import { settlementStatus, accountingStatus, confirmationStatus } from "@/lib/utils/order-status"

import { TradeStatusBadge, SideBadge } from "./status-pills"
import { RoutingPipeline } from "./routing-pipeline"
import { TerminalTopbar } from "./terminal/topbar"
import { TerminalStatCard } from "./terminal/stat-card"
import { TerminalCard } from "./terminal/card"
import { TerminalTable, TerminalThead, TerminalTbody, TerminalTr, TerminalTh, TerminalTd } from "./terminal/data-table"
import { TerminalStatusBadge } from "./terminal/status-badge"
import { TerminalPagination } from "./terminal/pagination"

const PAGE_SIZE = 15
const FILTER_TABS = ["ALL", "DRAFT", "ROUTING", "SETTLED", "SETTLEMENT_FAILED"] as const
type SideToggle = "ALL" | "BUY" | "SELL"

export function TradeBlotter() {
  const dispatch = useAppDispatch()
  const router   = useRouter()
  const { trades, tradesLoading, tradeFilter } = useAppSelector((s) => s.investments)

  const [search, setSearch] = useState("")
  const [page, setPage]     = useState(1)
  const [sideToggle, setSideToggle] = useState<SideToggle>("ALL")

  useEffect(() => {
    dispatch(fetchTrades())
  }, [dispatch])

  useEffect(() => { setPage(1) }, [tradeFilter, search, sideToggle])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return trades.filter((t) => {
      const matchFilter = tradeFilter === "ALL" || t.status === tradeFilter
      const matchSide = sideToggle === "ALL" || t.side === sideToggle
      const matchSearch =
        !q ||
        t.tradeRef.toLowerCase().includes(q) ||
        (t.security?.symbol ?? "").toLowerCase().includes(q) ||
        (t.security?.name ?? "").toLowerCase().includes(q)
      return matchFilter && matchSide && matchSearch
    })
  }, [trades, tradeFilter, sideToggle, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const stats = useMemo(() => {
    const total = trades.length
    const routing = trades.filter((t) => t.status === "ROUTING").length
    const failed = trades.filter((t) => t.status === "SETTLEMENT_FAILED").length
    const settledToday = trades.filter(
      (t) => t.status === "SETTLED" && t.settledAt && isSameDay(new Date(t.settledAt), new Date()),
    ).length
    return { total, routing, failed, settledToday }
  }, [trades])

  return (
    <div className="space-y-5">
      <TerminalTopbar
        title="Trade Blotter"
        subtitle="Execution, routing, and settlement across all connected venues"
        onSearch={setSearch}
        searchPlaceholder="Search ref, symbol, name…"
        actions={
          <>
            <button
              onClick={() => dispatch(fetchTrades())}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={() => dispatch(setExecuteTradeModalOpen(true))}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Book Trade
            </button>
          </>
        }
      />

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <TerminalStatCard label="Total Trades" value={String(stats.total)} />
        <TerminalStatCard
          label="Pending / Routing"
          value={String(stats.routing)}
          highlight={stats.routing > 0}
        />
        <TerminalStatCard label="Settled Today" value={String(stats.settledToday)} />
        <TerminalStatCard
          label="Settlement Failures"
          value={String(stats.failed)}
          highlight={stats.failed > 0}
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 overflow-x-auto">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => dispatch(setTradeFilter(tab))}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                tradeFilter === tab ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {tab === "ALL" ? "All" : tab.replace(/_/g, " ")}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border p-1">
          {(["ALL", "BUY", "SELL"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSideToggle(s)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                sideToggle === s
                  ? s === "BUY" ? "bg-gain-muted text-gain-foreground" : s === "SELL" ? "bg-loss-muted text-loss-foreground" : "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {s === "ALL" ? "Both" : s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {tradesLoading ? (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
        </div>
      ) : (
        <TerminalCard noPadding>
          <TerminalTable minWidth="1320px">
            <TerminalThead>
              <tr>
                <TerminalTh>Trade Ref</TerminalTh>
                <TerminalTh>Security</TerminalTh>
                <TerminalTh align="center">Side</TerminalTh>
                <TerminalTh align="right">Quantity</TerminalTh>
                <TerminalTh align="right">Price</TerminalTh>
                <TerminalTh align="right">Notional</TerminalTh>
                <TerminalTh>Routing</TerminalTh>
                <TerminalTh>Status</TerminalTh>
                <TerminalTh>Confirmation</TerminalTh>
                <TerminalTh>Settlement</TerminalTh>
                <TerminalTh>Accounting</TerminalTh>
                <TerminalTh align="right">Executed</TerminalTh>
                <TerminalTh />
              </tr>
            </TerminalThead>
            <TerminalTbody>
              {paginated.map((trade) => {
                const qty   = Number(trade.quantity)
                const price = Number(trade.executionPrice)
                const total = qty * price
                return (
                  <TerminalTr
                    key={trade.id}
                    onClick={() => router.push(`/investments/orders/blotter/${trade.id}`)}
                    className="hover:bg-muted/40"
                  >
                    <TerminalTd>
                      <span className="font-mono text-xs font-semibold text-primary group-hover:underline">{trade.tradeRef}</span>
                    </TerminalTd>
                    <TerminalTd>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-foreground">
                          {trade.security?.symbol ?? trade.securityId.slice(0, 8)}
                        </span>
                      </div>
                      {trade.security?.name && (
                        <span className="line-clamp-1 text-[11px] text-muted-foreground">{trade.security.name}</span>
                      )}
                    </TerminalTd>
                    <TerminalTd align="center">
                      <SideBadge side={trade.side} />
                    </TerminalTd>
                    <TerminalTd align="right" className="font-mono tabular-nums text-foreground">{qty.toLocaleString()}</TerminalTd>
                    <TerminalTd align="right" className="font-mono tabular-nums text-foreground">{price.toFixed(4)}</TerminalTd>
                    <TerminalTd align="right" className="font-mono tabular-nums text-foreground">
                      {total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </TerminalTd>
                    <TerminalTd onClick={(e) => e.stopPropagation()}>
                      {trade.routingHops && trade.routingHops.length > 0 ? (
                        <RoutingPipeline mode="compact" hops={trade.routingHops.map((h) => ({ ...h, skipped: isSkippedInternal(h) }))} />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TerminalTd>
                    <TerminalTd>
                      <TradeStatusBadge status={trade.status} />
                    </TerminalTd>
                    <TerminalTd>
                      <TerminalStatusBadge status={confirmationStatus(trade.routingHops)} />
                    </TerminalTd>
                    <TerminalTd>
                      <TerminalStatusBadge status={settlementStatus(trade.routingHops)} />
                    </TerminalTd>
                    <TerminalTd>
                      <TerminalStatusBadge status={accountingStatus(trade.routingHops)} />
                    </TerminalTd>
                    <TerminalTd align="right" className="text-xs text-muted-foreground">
                      {trade.executedAt ? new Date(trade.executedAt).toLocaleDateString() : "—"}
                    </TerminalTd>
                    <TerminalTd align="right">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" aria-hidden>
                        <PanelRightOpen className="h-4 w-4" />
                      </span>
                    </TerminalTd>
                  </TerminalTr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={13} className="px-4 py-16 text-center">
                    <SlidersHorizontal className="mx-auto h-6 w-6 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">No trades match your filters</p>
                  </td>
                </tr>
              )}
            </TerminalTbody>
          </TerminalTable>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
              <p className="text-xs text-muted-foreground">Page {safePage} of {totalPages} · {filtered.length} trades</p>
              <TerminalPagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </TerminalCard>
      )}
    </div>
  )
}
