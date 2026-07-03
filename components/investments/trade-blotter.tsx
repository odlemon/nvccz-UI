"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { isSameDay } from "date-fns"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchTrades, setTradeFilter } from "@/lib/store/slices/investmentsSlice"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/investments/page-header"
import { TradeStatusBadge, SideBadge } from "@/components/investments/status-pills"
import { RoutingPipeline } from "@/components/investments/routing-pipeline"
import {
  Search, RefreshCw,
  ChevronLeft, ChevronRight,
} from "lucide-react"
import { isSkippedInternal } from "@/lib/api/investments-api"

// ─── Constants ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 15
const FILTER_TABS = ["ALL", "DRAFT", "ROUTING", "SETTLED", "SETTLEMENT_FAILED"] as const
type Filter = typeof FILTER_TABS[number]
type SideToggle = "ALL" | "BUY" | "SELL"

// ─── Main component ───────────────────────────────────────────────────────────
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

  // Reset page when filter or search changes
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

  // ── KPI stats ─────────────────────────────────────────────────────────────
  const totalTrades = trades.length
  const pendingRouting = trades.filter((t) => t.status === "ROUTING" || t.status === "DRAFT").length
  const settledToday = trades.filter(
    (t) => t.status === "SETTLED" && t.settledAt && isSameDay(new Date(t.settledAt), new Date())
  ).length
  const settlementFailures = trades.filter((t) => t.status === "SETTLEMENT_FAILED").length

  return (
    <div className="space-y-4">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <PageHeader
        title="Trade Blotter"
        subtitle={`${trades.length} total · ${filtered.length} shown`}
        actions={
          <Button
            variant="outline" size="sm" className="rounded-full h-9 bg-white"
            onClick={() => dispatch(fetchTrades())}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        }
      />

      {/* ── KPI grid ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-gray-200 shadow-sm p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Trades</p>
          <p className="text-2xl font-bold font-mono text-gray-900 mt-1">{totalTrades.toLocaleString()}</p>
        </Card>
        <Card className="bg-white border-gray-200 shadow-sm p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pending / Routing</p>
          <p className="text-2xl font-bold font-mono text-amber-600 mt-1">{pendingRouting.toLocaleString()}</p>
        </Card>
        <Card className="bg-white border-gray-200 shadow-sm p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Settled Today</p>
          <p className="text-2xl font-bold font-mono text-emerald-600 mt-1">{settledToday.toLocaleString()}</p>
        </Card>
        <Card className={`bg-white shadow-sm p-4 ${settlementFailures > 0 ? "border-red-200 bg-red-50/40" : "border-gray-200"}`}>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Settlement Failures</p>
          <p className={`text-2xl font-bold font-mono mt-1 ${settlementFailures > 0 ? "text-red-600" : "text-gray-900"}`}>
            {settlementFailures.toLocaleString()}
          </p>
        </Card>
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <Card className="bg-white border border-gray-200 shadow-sm p-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by ref or security…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-xs rounded-full border-gray-200 bg-white"
            />
          </div>

          {/* Status pills */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-full">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => dispatch(setTradeFilter(tab))}
                className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                  tradeFilter === tab
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab === "ALL" ? "All" : tab === "SETTLEMENT_FAILED" ? "Failed" : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* BUY/SELL segmented toggle (client-side only) */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-full">
            {(["ALL", "BUY", "SELL"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSideToggle(tab)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                  sideToggle === tab
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab === "ALL" ? "All" : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      {tradesLoading ? (
        <Card className="bg-white border border-gray-200 shadow-sm p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
        </Card>
      ) : (
        <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {["Trade Ref", "Security", "Side", "Qty", "Price", "Total", "Currency", "Status", "Routing", "Executed"].map((h) => (
                    <th
                      key={h}
                      className={`text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide ${
                        ["Currency", "Executed"].includes(h) ? "hidden lg:table-cell" : ""
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map((trade) => {
                  const qty   = Number(trade.quantity)
                  const price = Number(trade.executionPrice)
                  const total = qty * price
                  return (
                    <tr
                      key={trade.id}
                      className="hover:bg-blue-50/20 cursor-pointer transition-colors group"
                      onClick={() => router.push(`/investments/trades/${trade.id}`)}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-primary font-medium">{trade.tradeRef}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-semibold text-gray-900">
                          {trade.security?.symbol ?? trade.securityId.slice(0, 8)}
                        </span>
                        {trade.security?.exchangeCode && (
                          <span className="ml-1.5 text-[10px] text-gray-400">{trade.security.exchangeCode}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <SideBadge side={trade.side} />
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-gray-700">
                        {qty.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-gray-700">
                        {price.toFixed(4)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-gray-900">
                        {total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="font-mono text-xs text-gray-500">{trade.executionCurrencyCode}</span>
                      </td>
                      <td className="px-4 py-3">
                        <TradeStatusBadge status={trade.status} />
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <RoutingPipeline
                          mode="compact"
                          hops={(trade.routingHops ?? []).map((h) => ({ ...h, skipped: isSkippedInternal(h) }))}
                        />
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground font-mono">
                        {trade.executedAt ? new Date(trade.executedAt).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={10} className="text-center py-14 text-sm text-muted-foreground">
                      No trades match your filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/40">
              <p className="text-xs text-muted-foreground">
                Page {safePage} of {totalPages} · {filtered.length} trades
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline" size="sm" className="h-7 w-7 p-0 rounded-full bg-white"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="w-3 h-3" />
                </Button>
                {pageNumbers.map((n) => (
                  <Button
                    key={n}
                    variant={safePage === n ? "default" : "outline"}
                    size="sm"
                    className={`h-7 w-7 p-0 rounded-full text-xs ${
                      safePage === n ? "gradient-primary text-white" : "bg-white"
                    }`}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </Button>
                ))}
                <Button
                  variant="outline" size="sm" className="h-7 w-7 p-0 rounded-full bg-white"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
