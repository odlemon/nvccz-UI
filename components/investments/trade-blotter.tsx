"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { isSameDay } from "date-fns"
import { cn } from "@/lib/utils"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchTrades, setTradeFilter, setExecuteTradeModalOpen } from "@/lib/store/slices/investmentsSlice"
import { Skeleton } from "@/components/ui/skeleton"
import { PanelRightOpen, Plus, RefreshCw, Search, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react"
import { isSkippedInternal } from "@/lib/api/investments-api"
import { PageHeader } from "./page-header"
import { TradeStatusBadge, SideBadge } from "./status-pills"
import { RoutingPipeline } from "./routing-pipeline"

const PAGE_SIZE = 15
const FILTER_TABS = ["ALL", "DRAFT", "ROUTING", "SETTLED", "SETTLEMENT_FAILED"] as const
type SideToggle = "ALL" | "BUY" | "SELL"

function Stat({ label, value, tone }: { label: string; value: string; tone?: "warn" | "loss" }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("mt-1 font-mono text-lg font-semibold", tone === "loss" ? "text-loss" : tone === "warn" ? "text-warn-foreground" : "text-foreground")}>
        {value}
      </p>
    </div>
  )
}

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

  const pageNumbers = useMemo(() => {
    const start = Math.max(1, safePage - 2)
    const end   = Math.min(totalPages, safePage + 2)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }, [safePage, totalPages])

  const stats = useMemo(() => {
    const notional = filtered.reduce((s, t) => s + Number(t.executionPrice) * Number(t.quantity), 0)
    const failed = filtered.filter((t) => t.status === "SETTLEMENT_FAILED").length
    const routing = filtered.filter((t) => t.status === "ROUTING").length
    const settledToday = filtered.filter((t) => t.status === "SETTLED" && t.settledAt && isSameDay(new Date(t.settledAt), new Date())).length
    return { notional, failed, routing, settledToday }
  }, [filtered])

  return (
    <div className="space-y-5">
      <PageHeader
        title="Trade Blotter"
        subtitle="Execution, routing, and settlement across all connected venues"
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
        <Stat label="Trades shown" value={String(filtered.length)} />
        <Stat label="Notional" value={stats.notional.toLocaleString("en-US", { minimumFractionDigits: 2 })} />
        <Stat label="Routing" value={String(stats.routing)} tone={stats.routing ? "warn" : undefined} />
        <Stat label="Settlement failed" value={String(stats.failed)} tone={stats.failed ? "loss" : undefined} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ref, symbol, name…"
            className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
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
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 text-left font-medium">Trade Ref</th>
                  <th className="px-4 py-3 text-left font-medium">Security</th>
                  <th className="px-4 py-3 text-center font-medium">Side</th>
                  <th className="px-4 py-3 text-right font-medium">Quantity</th>
                  <th className="px-4 py-3 text-right font-medium">Price</th>
                  <th className="px-4 py-3 text-right font-medium">Notional</th>
                  <th className="px-4 py-3 text-left font-medium">Routing</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Executed</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {paginated.map((trade) => {
                  const qty   = Number(trade.quantity)
                  const price = Number(trade.executionPrice)
                  const total = qty * price
                  return (
                    <tr
                      key={trade.id}
                      onClick={() => router.push(`/investments/trades/${trade.id}`)}
                      className="group cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/40"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-semibold text-primary group-hover:underline">{trade.tradeRef}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-foreground">
                            {trade.security?.symbol ?? trade.securityId.slice(0, 8)}
                          </span>
                        </div>
                        {trade.security?.name && (
                          <span className="line-clamp-1 text-[11px] text-muted-foreground">{trade.security.name}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <SideBadge side={trade.side} />
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-foreground">{qty.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-foreground">{price.toFixed(4)}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-foreground">
                        {total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        {trade.routingHops && trade.routingHops.length > 0 ? (
                          <RoutingPipeline mode="compact" hops={trade.routingHops.map((h) => ({ ...h, skipped: isSkippedInternal(h) }))} />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <TradeStatusBadge status={trade.status} />
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                        {trade.executedAt ? new Date(trade.executedAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" aria-hidden>
                          <PanelRightOpen className="h-4 w-4" />
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-16 text-center">
                      <SlidersHorizontal className="mx-auto h-6 w-6 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">No trades match your filters</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
              <p className="text-xs text-muted-foreground">Page {safePage} of {totalPages} · {filtered.length} trades</p>
              <div className="flex items-center gap-1">
                <button
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card disabled:opacity-40"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                {pageNumbers.map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={cn(
                      "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs",
                      safePage === n ? "bg-primary text-primary-foreground" : "border border-border bg-card text-foreground",
                    )}
                  >
                    {n}
                  </button>
                ))}
                <button
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card disabled:opacity-40"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
