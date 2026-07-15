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
          {hop.lastError && <p className="text-loss">{hop.lastError}</p>}
          {hop.payloadRef && (
            <details>
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">View payload</summary>
              <pre className="mt-1 text-[10px] bg-muted p-1 rounded overflow-x-auto max-h-32 break-all whitespace-pre-wrap">
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
          <div className={cn("cursor-default p-2 rounded-lg border", hop.skipped ? "border-dashed border-border" : "border-border hover:border-primary/40")}>
            <div className={cn("flex flex-col items-center gap-1 min-w-[100px]", hop.skipped && "opacity-60")}>
              <span className="text-[10px] text-muted-foreground font-medium">{TARGET_LABELS[hop.target]}</span>
              <RoutingStatusBadge status={hop.status} skipped={hop.skipped} attemptCount={hop.attemptCount} />
              {hop.status === "FAILED" && hop.id && onRetry && (
                <Button size="sm" variant="destructive" className="h-5 text-[10px] px-2" onClick={() => onRetry(hop.id!)}>
                  <RotateCcw className="w-2.5 h-2.5 mr-1" /> Retry
                </Button>
              )}
              {hop.confirmedAt && (
                <span className="text-[9px] text-muted-foreground font-mono">{new Date(hop.confirmedAt).toLocaleTimeString()}</span>
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs bg-popover text-popover-foreground">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function ExpandedRow({ hop, onRetry }: { hop: PipelineHop; onRetry?: (hopId: string) => void }) {
  const borderCls = hop.skipped
    ? "border-dashed border-border text-muted-foreground bg-transparent"
    : ({
        STAGED: "bg-muted text-muted-foreground border-border",
        DISPATCHED: "bg-accent text-accent-foreground border-primary/20",
        CONFIRMED: "bg-gain-muted text-gain-foreground border-gain/30",
        RETRYING: "bg-warn-muted text-warn-foreground border-warn/30",
        FAILED: "bg-loss-muted text-loss-foreground border-loss/30",
      }[hop.status] ?? "bg-muted text-muted-foreground border-border")

  return (
    <div className={cn("flex gap-3 p-3 rounded-lg border", borderCls)}>
      <div className="flex flex-col items-center gap-1 pt-0.5">
        {hop.status === "CONFIRMED" && !hop.skipped ? (
          <CheckCircle2 className="w-4 h-4 text-gain" />
        ) : hop.status === "FAILED" ? (
          <XCircle className="w-4 h-4 text-loss" />
        ) : hop.status === "RETRYING" ? (
          <RotateCcw className="w-4 h-4 text-warn-foreground" />
        ) : (
          <Clock className="w-4 h-4 text-muted-foreground" />
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
          {hop.skipped && <p className="italic">Custodian dispatch disabled — internal settlement mode</p>}
          {hop.lastError && <p className="text-loss">{hop.lastError}</p>}
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
    return <p className="text-xs text-muted-foreground">No routing hops recorded.</p>
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
          {i < ordered.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground/40 mt-6 shrink-0" />}
        </div>
      ))}
    </div>
  )
}
