"use client"

import { useEffect, useMemo, useState } from "react"
import { useAppDispatch } from "@/lib/store"
import { fetchOrderbook, type MockOrder } from "@/lib/mock/orders-mock-data"
import { SideBadge } from "./status-pills"
import { TerminalTopbar } from "./terminal/topbar"
import { TerminalCard } from "./terminal/card"
import { TerminalStatCard } from "./terminal/stat-card"
import { TerminalTable, TerminalThead, TerminalTbody, TerminalTr, TerminalTh, TerminalTd } from "./terminal/data-table"
import { TerminalStatusBadge } from "./terminal/status-badge"
import { PillTabs } from "./terminal/tabs"
import { Skeleton } from "@/components/ui/skeleton"

const FILTER_TABS = [
  { id: "ALL", label: "All" },
  { id: "WORKING", label: "Working" },
  { id: "PARTIAL", label: "Partial" },
  { id: "FILLED", label: "Filled" },
  { id: "CANCELLED", label: "Cancelled" },
  { id: "REJECTED", label: "Rejected" },
]

export function OrderBook() {
  const dispatch = useAppDispatch()
  const [orders, setOrders] = useState<MockOrder[] | null>(null)
  const [filter, setFilter] = useState("ALL")

  useEffect(() => {
    dispatch(fetchOrderbook())
      .unwrap()
      .then(setOrders)
  }, [dispatch])

  const filtered = useMemo(() => {
    if (!orders) return []
    return filter === "ALL" ? orders : orders.filter((o) => o.status === filter)
  }, [orders, filter])

  const stats = useMemo(() => {
    const list = orders ?? []
    return {
      working: list.filter((o) => o.status === "WORKING" || o.status === "PARTIAL").length,
      filled: list.filter((o) => o.status === "FILLED").length,
      cancelled: list.filter((o) => o.status === "CANCELLED" || o.status === "REJECTED").length,
    }
  }, [orders])

  return (
    <div className="space-y-5">
      <TerminalTopbar title="Orderbook" subtitle="Open and working orders across all connected venues (mocked — no live OMS feed yet)" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <TerminalStatCard label="Total Orders" value={String(orders?.length ?? 0)} />
        <TerminalStatCard label="Working / Partial" value={String(stats.working)} highlight={stats.working > 0} />
        <TerminalStatCard label="Filled" value={String(stats.filled)} />
        <TerminalStatCard label="Cancelled / Rejected" value={String(stats.cancelled)} />
      </div>

      <PillTabs items={FILTER_TABS} activeId={filter} onChange={setFilter} />

      {!orders ? (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
        </div>
      ) : (
        <TerminalCard noPadding>
          <TerminalTable minWidth="1000px">
            <TerminalThead>
              <tr>
                <TerminalTh>Order Ref</TerminalTh>
                <TerminalTh>Security</TerminalTh>
                <TerminalTh align="center">Side</TerminalTh>
                <TerminalTh>Type</TerminalTh>
                <TerminalTh align="right">Quantity</TerminalTh>
                <TerminalTh align="right">Filled</TerminalTh>
                <TerminalTh align="right">Price</TerminalTh>
                <TerminalTh>Venue</TerminalTh>
                <TerminalTh>Status</TerminalTh>
              </tr>
            </TerminalThead>
            <TerminalTbody>
              {filtered.map((order) => (
                <TerminalTr key={order.id}>
                  <TerminalTd className="font-mono text-xs font-semibold text-foreground">{order.orderRef}</TerminalTd>
                  <TerminalTd>
                    <span className="font-mono text-xs font-semibold text-foreground">{order.securitySymbol}</span>
                    <span className="ml-2 text-[11px] text-muted-foreground">{order.securityName}</span>
                  </TerminalTd>
                  <TerminalTd align="center"><SideBadge side={order.side} /></TerminalTd>
                  <TerminalTd className="text-xs text-muted-foreground">{order.orderType}</TerminalTd>
                  <TerminalTd align="right" className="font-mono tabular-nums text-foreground">{order.quantity.toLocaleString()}</TerminalTd>
                  <TerminalTd align="right" className="font-mono tabular-nums text-foreground">
                    {order.filledQuantity.toLocaleString()}
                    <span className="ml-1 text-[10px] text-muted-foreground">
                      ({order.quantity ? Math.round((order.filledQuantity / order.quantity) * 100) : 0}%)
                    </span>
                  </TerminalTd>
                  <TerminalTd align="right" className="font-mono tabular-nums text-foreground">
                    {order.limitPrice != null ? order.limitPrice.toFixed(2) : order.avgFillPrice != null ? order.avgFillPrice.toFixed(2) : "Market"}
                  </TerminalTd>
                  <TerminalTd className="text-xs text-muted-foreground">{order.venue}</TerminalTd>
                  <TerminalTd><TerminalStatusBadge status={order.status} /></TerminalTd>
                </TerminalTr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-sm text-muted-foreground">
                    No orders match this filter
                  </td>
                </tr>
              )}
            </TerminalTbody>
          </TerminalTable>
        </TerminalCard>
      )}
    </div>
  )
}
