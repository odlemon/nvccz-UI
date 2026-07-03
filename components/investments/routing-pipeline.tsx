"use client"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { RoutingStatusBadge } from "./status-pills"
import { ArrowRight, RotateCcw, CheckCircle2, XCircle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

export type PipelineHopTarget = "BROKER" | "CUSTODIAN" | "CORE_BANKING" | "ACCOUNTING_GL"
export type PipelineHopStatus = "STAGED" | "DISPATCHED" | "CONFIRMED" | "RETRYING" | "FAILED"

export interface PipelineHop {
  id?: string
  target: PipelineHopTarget
  status: PipelineHopStatus
  skipped?: boolean
  attemptCount?: number
  dispatchedAt?: string | null
  confirmedAt?: string | null
  externalRef?: string | null
  lastError?: string | null
  payloadRef?: string | null
}

interface RoutingPipelineProps {
  mode: "compact" | "expanded"
  hops: PipelineHop[]
  tradeId?: string
  onRetry?: (hopId: string) => void
  className?: string
}

const TARGET_LABELS: Record<PipelineHopTarget, string> = {
  BROKER: "Broker Gateway",
  CUSTODIAN: "Custodian Network",
  CORE_BANKING: "Core Banking",
  ACCOUNTING_GL: "Accounting Register",
}

const TARGET_ORDER: PipelineHopTarget[] = ["BROKER", "CUSTODIAN", "CORE_BANKING", "ACCOUNTING_GL"]

function orderHops(hops: PipelineHop[]): PipelineHop[] {
  return TARGET_ORDER.map((target) => hops.find((h) => h.target === target)).filter(Boolean) as PipelineHop[]
}

function CompactNode({ hop, onRetry }: { hop: PipelineHop; onRetry?: (hopId: string) => void }) {
  const tooltipContent = (
    <div className="text-xs space-y-1 max-w-xs">
      {hop.skipped ? (
        <p>Custodian dispatch disabled — internal settlement mode.</p>
      ) : (
        <>
          {hop.dispatchedAt && <p>Dispatched: {new Date(hop.dispatchedAt).toLocaleString()}</p>}
          {hop.confirmedAt && <p>Confirmed: {new Date(hop.confirmedAt).toLocaleString()}</p>}
          {hop.attemptCount != null && <p>Attempts: {hop.attemptCount}</p>}
          {hop.externalRef && <p>Ref: {hop.externalRef}</p>}
          {hop.lastError && <p className="text-red-400">{hop.lastError}</p>}
          {hop.payloadRef && (
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
          <div className={cn("cursor-default p-2 rounded-lg border", hop.skipped ? "border-dashed border-slate-300" : "border-slate-200 hover:border-slate-300")}>
            <div className={cn("flex flex-col items-center gap-1 min-w-[100px]", hop.skipped && "opacity-60")}>
              <span className="text-[10px] text-slate-500 font-medium">{TARGET_LABELS[hop.target]}</span>
              <RoutingStatusBadge status={hop.status} skipped={hop.skipped} attemptCount={hop.attemptCount} />
              {hop.status === "FAILED" && hop.id && onRetry && (
                <Button size="sm" variant="destructive" className="h-5 text-[10px] px-2" onClick={() => onRetry(hop.id!)}>
                  <RotateCcw className="w-2.5 h-2.5 mr-1" /> Retry
                </Button>
              )}
              {hop.confirmedAt && (
                <span className="text-[9px] text-slate-400 font-mono">{new Date(hop.confirmedAt).toLocaleTimeString()}</span>
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs bg-slate-900 text-slate-100">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function ExpandedRow({ hop, onRetry }: { hop: PipelineHop; onRetry?: (hopId: string) => void }) {
  const borderCls = hop.skipped
    ? "border-dashed border-slate-300 text-slate-400 bg-transparent"
    : ({
        STAGED: "bg-slate-100 text-slate-600 border-slate-200",
        DISPATCHED: "bg-blue-100 text-blue-700 border-blue-200",
        CONFIRMED: "bg-emerald-100 text-emerald-700 border-emerald-200",
        RETRYING: "bg-amber-100 text-amber-700 border-amber-200",
        FAILED: "bg-red-100 text-red-700 border-red-200",
      }[hop.status] ?? "bg-slate-100 text-slate-600 border-slate-200")

  return (
    <div className={cn("flex gap-3 p-3 rounded-lg border", borderCls)}>
      <div className="flex flex-col items-center gap-1 pt-0.5">
        {hop.status === "CONFIRMED" && !hop.skipped ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        ) : hop.status === "FAILED" ? (
          <XCircle className="w-4 h-4 text-red-600" />
        ) : hop.status === "RETRYING" ? (
          <RotateCcw className="w-4 h-4 text-amber-600" />
        ) : (
          <Clock className="w-4 h-4 text-slate-400" />
        )}
        <div className="w-px flex-1 bg-current opacity-20" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{TARGET_LABELS[hop.target]}</span>
          <RoutingStatusBadge status={hop.status} skipped={hop.skipped} attemptCount={hop.attemptCount} />
        </div>
        <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
          {hop.dispatchedAt && <p>Dispatched: {new Date(hop.dispatchedAt).toLocaleString()}</p>}
          {hop.confirmedAt && <p>Confirmed: {new Date(hop.confirmedAt).toLocaleString()}</p>}
          {hop.externalRef && !hop.skipped && <p>Ref: <span className="font-mono">{hop.externalRef}</span></p>}
          {hop.skipped && <p className="text-slate-400 italic">Custodian dispatch disabled — internal settlement mode</p>}
          {hop.lastError && <p className="text-red-500">{hop.lastError}</p>}
          {hop.attemptCount != null && <p>Attempts: {hop.attemptCount}</p>}
        </div>
        {hop.payloadRef && !hop.skipped && (
          <details className="mt-2">
            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">View payload ref</summary>
            <pre className="mt-1 text-[10px] bg-muted rounded p-2 overflow-x-auto max-h-32 break-all whitespace-pre-wrap">
              {hop.payloadRef}
            </pre>
          </details>
        )}
        {hop.status === "FAILED" && hop.id && onRetry && (
          <Button size="sm" variant="destructive" className="mt-2 h-6 text-xs" onClick={() => onRetry(hop.id!)}>
            <RotateCcw className="w-3 h-3 mr-1" /> Retry
          </Button>
        )}
      </div>
    </div>
  )
}

export function RoutingPipeline({ mode, hops, onRetry, className }: RoutingPipelineProps) {
  const ordered = orderHops(hops)

  if (ordered.length === 0) {
    return <p className="text-xs text-slate-400">No routing hops recorded.</p>
  }

  if (mode === "expanded") {
    return (
      <div className={cn("space-y-2", className)}>
        {ordered.map((hop) => <ExpandedRow key={hop.id ?? hop.target} hop={hop} onRetry={onRetry} />)}
      </div>
    )
  }

  return (
    <div className={cn("flex items-start gap-2", className)}>
      {ordered.map((hop, i) => (
        <div key={hop.id ?? hop.target} className="flex items-start gap-2">
          <CompactNode hop={hop} onRetry={onRetry} />
          {i < ordered.length - 1 && <ArrowRight className="w-4 h-4 text-slate-300 mt-6 shrink-0" />}
        </div>
      ))}
    </div>
  )
}
