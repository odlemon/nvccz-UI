"use client"

import { useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { retryHop } from "@/lib/store/slices/investmentsSlice"
import { ChevronDown, ChevronUp } from "lucide-react"
import { isSkippedInternal } from "@/lib/api/investments-api"
import { RoutingPipeline } from "./routing-pipeline"

export function RoutingBar() {
  const [collapsed, setCollapsed] = useState(false)
  const dispatch = useAppDispatch()
  const { selectedTrade } = useAppSelector((s) => s.investments)

  const hops = (selectedTrade?.routingHops ?? []).map((h) => ({ ...h, skipped: isSkippedInternal(h) }))

  const tradeLabel = selectedTrade ? `— ${selectedTrade.tradeRef}` : "— No trade selected"

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div
        className="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-muted/40 rounded-2xl"
        onClick={() => setCollapsed(!collapsed)}
      >
        <span className="text-sm font-semibold text-foreground">
          Routing Status <span className="text-muted-foreground font-normal">{tradeLabel}</span>
        </span>
        {collapsed ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
      </div>

      {!collapsed && (
        <div className="px-5 pb-4 border-t border-border pt-3">
          {hops.length > 0 && selectedTrade ? (
            <RoutingPipeline
              mode="compact"
              hops={hops}
              tradeId={selectedTrade.id}
              onRetry={(hopId) => dispatch(retryHop({ tradeId: selectedTrade.id, hopId }))}
            />
          ) : (
            <p className="text-xs text-muted-foreground py-2">
              {selectedTrade ? "No routing hops yet." : "Execute a trade to see routing status here."}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
