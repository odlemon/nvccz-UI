"use client"

import { useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { retryHop } from "@/lib/store/slices/investmentsSlice"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ChevronDown, ChevronUp, RotateCcw, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { RoutingHop } from "@/lib/api/investments-api"
import { isSkippedInternal } from "@/lib/api/investments-api"

const TARGET_LABELS: Record<string, string> = {
  BROKER:        "Broker Gateway",
  CUSTODIAN:     "Custodian Network",
  CORE_BANKING:  "Core Banking",
  ACCOUNTING_GL: "Acct Register",
}

const TARGET_ORDER = ["BROKER", "CUSTODIAN", "CORE_BANKING", "ACCOUNTING_GL"]

const BADGE_STYLE: Record<string, string> = {
  STAGED:     "bg-slate-100 text-slate-600 border-slate-300",
  DISPATCHED: "bg-blue-100 text-blue-700 border-blue-300",
  CONFIRMED:  "bg-emerald-100 text-emerald-700 border-emerald-300",
  RETRYING:   "bg-amber-100 text-amber-700 border-amber-300",
  FAILED:     "bg-red-100 text-red-700 border-red-300",
}

function HopBadge({ hop, tradeId }: { hop: RoutingHop; tradeId: string }) {
  const dispatch = useAppDispatch()
  const skipped  = isSkippedInternal(hop)
  const badgeCls = skipped
    ? "border-dashed border-slate-300 text-slate-400 bg-transparent"
    : (BADGE_STYLE[hop.status] ?? BADGE_STYLE.STAGED)

  const label = skipped ? "SKIPPED" : hop.status
  const labelText = skipped ? "SKIPPED" : `${hop.status.replace("_", " ")}${hop.status === "RETRYING" ? ` (${hop.attemptCount}/5)` : ""}`

  const node = (
    <div className={cn("flex flex-col items-center gap-1 min-w-[100px]", skipped && "opacity-60")}>
      <span className="text-[10px] text-slate-500 font-medium">{TARGET_LABELS[hop.target]}</span>
      <Badge className={cn("text-[10px] font-mono border", badgeCls)}>
        {labelText}
      </Badge>
      {hop.status === "FAILED" && (
        <Button
          size="sm" variant="destructive" className="h-5 text-[10px] px-2"
          onClick={() => dispatch(retryHop({ tradeId, hopId: hop.id }))}
        >
          <RotateCcw className="w-2.5 h-2.5 mr-1" /> Retry
        </Button>
      )}
      {hop.confirmedAt && (
        <span className="text-[9px] text-slate-400 font-mono">
          {new Date(hop.confirmedAt).toLocaleTimeString()}
        </span>
      )}
    </div>
  )

  const tooltipContent = (
    <div className="text-xs space-y-1 max-w-xs">
      {skipped ? (
        <p>Custodian dispatch disabled — internal settlement mode.</p>
      ) : (
        <>
          {hop.dispatchedAt && <p>Dispatched: {new Date(hop.dispatchedAt).toLocaleString()}</p>}
          {hop.confirmedAt  && <p>Confirmed: {new Date(hop.confirmedAt).toLocaleString()}</p>}
          <p>Attempts: {hop.attemptCount}</p>
          {hop.externalRef && <p>Ref: {hop.externalRef}</p>}
          {hop.lastError    && <p className="text-red-400">{hop.lastError}</p>}
          {hop.payloadRef   && (
            <details>
              <summary className="cursor-pointer text-slate-400 hover:text-slate-200">View payload</summary>
              <pre className="mt-1 text-[10px] bg-slate-800 p-1 rounded overflow-x-auto max-h-32 break-all whitespace-pre-wrap">
                {hop.payloadRef}
              </pre>
            </details>
          )}
        </>
      )}
    </div>
  )

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "cursor-default p-2 rounded-lg border",
            skipped ? "border-dashed border-slate-300" : "border-slate-200 hover:border-slate-300"
          )}>
            {node}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs bg-slate-900 text-slate-100">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function RoutingBar() {
  const [collapsed, setCollapsed] = useState(false)
  const { selectedTrade } = useAppSelector((s) => s.investments)

  const hops = selectedTrade?.routingHops ?? []

  const orderedHops = TARGET_ORDER.map((target) =>
    hops.find((h) => h.target === target)
  ).filter(Boolean) as RoutingHop[]

  const tradeLabel = selectedTrade
    ? `— ${selectedTrade.tradeRef}`
    : "— No trade selected"

  return (
    <div className="border-t bg-white shrink-0">
      <div
        className="flex items-center justify-between px-4 py-1.5 cursor-pointer hover:bg-slate-50"
        onClick={() => setCollapsed(!collapsed)}
      >
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Routing Status {tradeLabel}
        </span>
        {collapsed ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
      </div>

      {!collapsed && (
        <div className="px-4 pb-3">
          {orderedHops.length > 0 ? (
            <div className="flex items-start gap-2">
              {orderedHops.map((hop, i) => (
                <div key={hop.id} className="flex items-start gap-2">
                  <HopBadge hop={hop} tradeId={selectedTrade!.id} />
                  {i < orderedHops.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-slate-300 mt-6 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-2">
              {selectedTrade
                ? "No routing hops yet."
                : "Execute a trade to see routing status here."}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
