"use client"

import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { PanelRightOpen, Download, Plus, Search, SlidersHorizontal } from "lucide-react"
import { money, qty as fmtQty } from "@/lib/investments/format"
import { TRADES, type Trade, type TradeStatus } from "@/lib/investments/mock-data"
import { PageHeader } from "@/components/investments/page-header"
import { TradeStatusBadge, ExchangeTag } from "@/components/investments/status-pills"
import { RoutingPipeline } from "@/components/investments/routing-pipeline"
import { TradeDetailDrawer } from "@/components/investments/trade-detail-drawer"

const STATUS_FILTERS: (TradeStatus | "ALL")[] = [
  "ALL", "DRAFT", "ROUTING", "SETTLED", "SETTLEMENT_FAILED",
]

function timeAgo(iso?: string) {
  if (!iso) return "—"
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600_000)
  if (h < 1) return `${Math.max(1, Math.floor(diff / 60_000))}m ago`
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function TradeBlotter() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<TradeStatus | "ALL">("ALL")
  const [side, setSide] = useState<"ALL" | "BUY" | "SELL">("ALL")
  const [selected, setSelected] = useState<Trade | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  function openTrade(t: Trade) {
    setSelected(t)
    setDrawerOpen(true)
  }

  const filtered = useMemo(() => {
    return TRADES.filter((t) => {
      if (status !== "ALL" && t.status !== status) return false
      if (side !== "ALL" && t.side !== side) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          t.tradeRef.toLowerCase().includes(q) ||
          t.security.symbol.toLowerCase().includes(q) ||
          t.security.name.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [search, status, side])

  const counts = useMemo(() => {
    const notional = filtered.reduce((s, t) => s + t.executionPrice * t.quantity, 0)
    const failed = filtered.filter((t) => t.status === "SETTLEMENT_FAILED").length
    const routing = filtered.filter((t) => t.status === "ROUTING").length
    return { notional, failed, routing }
  }, [filtered])

  return (
    <div className="space-y-5">
      <PageHeader
        title="Trade Blotter"
        subtitle="Execution, routing, and settlement across all connected venues"
        actions={
          <>
            <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">
              <Download className="h-4 w-4" /> Export
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
              <Plus className="h-4 w-4" /> Book Trade
            </button>
          </>
        }
      />

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Trades shown" value={String(filtered.length)} />
        <Stat label="Notional" value={`$${money(counts.notional)}`} />
        <Stat label="Routing" value={String(counts.routing)} tone={counts.routing ? "warn" : undefined} />
        <Stat label="Settlement failed" value={String(counts.failed)} tone={counts.failed ? "loss" : undefined} />
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
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                status === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {s === "ALL" ? "All" : s.replace(/_/g, " ")}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border p-1">
          {(["ALL", "BUY", "SELL"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSide(s)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                side === s
                  ? s === "BUY"
                    ? "bg-gain-muted text-gain-foreground"
                    : s === "SELL"
                      ? "bg-loss-muted text-loss-foreground"
                      : "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {s === "ALL" ? "Both" : s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
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
              {filtered.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => openTrade(t)}
                  className="group cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/40"
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-semibold text-primary group-hover:underline">
                      {t.tradeRef}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-foreground">{t.security.symbol}</span>
                      <ExchangeTag code={t.security.exchangeCode} />
                    </div>
                    <span className="line-clamp-1 text-[11px] text-muted-foreground">{t.security.name}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={cn(
                        "inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold",
                        t.side === "BUY" ? "bg-gain-muted text-gain-foreground" : "bg-loss-muted text-loss-foreground",
                      )}
                    >
                      {t.side}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-foreground">{fmtQty(t.quantity)}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-foreground">{money(t.executionPrice)}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-foreground">
                    ${money(t.executionPrice * t.quantity)}
                  </td>
                  <td className="px-4 py-3">
                    <RoutingPipeline hops={t.routingHops} compact />
                  </td>
                  <td className="px-4 py-3">
                    <TradeStatusBadge status={t.status} />
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-muted-foreground">{timeAgo(t.executedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                      aria-hidden
                    >
                      <PanelRightOpen className="h-4 w-4" />
                    </span>
                  </td>
                </tr>
              ))}
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
      </div>

      <TradeDetailDrawer trade={selected} open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "warn" | "loss" }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 font-mono text-lg font-semibold",
          tone === "loss" ? "text-loss" : tone === "warn" ? "text-warn-foreground" : "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  )
}
