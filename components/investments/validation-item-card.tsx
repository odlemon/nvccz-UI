"use client"

import { cn } from "@/lib/utils"
import { ArrowDownRight, ArrowUpRight, TriangleAlert, Check, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { ValidationQueueItem } from "@/lib/api/investments-api"
import { ExchangeTag } from "./status-pills"

interface ValidationItemCardProps {
  item: ValidationQueueItem
  isRejecting: boolean
  rejectReason: string
  onApprove: () => void
  onRejectToggle: () => void
  onRejectReasonChange: (v: string) => void
  onRejectSubmit: () => void
}

function severity(dev: number) {
  const a = Math.abs(dev)
  if (a >= 20) return { label: "Critical", cls: "bg-loss-muted text-loss-foreground ring-loss/30" }
  if (a >= 10) return { label: "High", cls: "bg-warn-muted text-warn-foreground ring-warn/30" }
  return { label: "Moderate", cls: "bg-accent text-accent-foreground ring-primary/20" }
}

export function ValidationItemCard({
  item, isRejecting, rejectReason, onApprove, onRejectToggle, onRejectReasonChange, onRejectSubmit,
}: ValidationItemCardProps) {
  const sev = severity(item.deviation_percent)
  const up = item.deviation_percent >= 0

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-warn-muted text-warn-foreground">
            <TriangleAlert className="h-4 w-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-semibold text-foreground">{item.ticker}</span>
              {item.exchange && <ExchangeTag exchange={item.exchange} />}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {new Date(item.price_date).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
            </p>
          </div>
        </div>
        <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset", sev.cls)}>{sev.label}</span>
      </div>

      {/* Price comparison */}
      <div className="mt-4 grid grid-cols-3 items-center gap-2 rounded-lg border border-border bg-background p-3">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Prev close</p>
          <p className="font-mono text-sm text-foreground">{item.previous_close.toFixed(4)}</p>
        </div>
        <div className="flex flex-col items-center">
          <span className={cn("inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold", up ? "bg-gain-muted text-gain-foreground" : "bg-loss-muted text-loss-foreground")}>
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {item.deviation_percent.toFixed(2)}%
          </span>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Proposed</p>
          <p className={cn("font-mono text-sm font-semibold", up ? "text-gain" : "text-loss")}>{item.proposed_price.toFixed(4)}</p>
        </div>
      </div>

      {isRejecting ? (
        <div className="mt-4 flex items-center gap-2">
          <Input
            placeholder="Rejection reason (required)…"
            value={rejectReason}
            onChange={(e) => onRejectReasonChange(e.target.value)}
            className="h-9 text-xs"
            autoFocus
          />
          <Button size="sm" variant="destructive" className="h-9 text-xs shrink-0" disabled={!rejectReason.trim()} onClick={onRejectSubmit}>
            Confirm
          </Button>
          <Button size="sm" variant="ghost" className="h-9 text-xs shrink-0" onClick={onRejectToggle}>
            Cancel
          </Button>
        </div>
      ) : (
        <div className="mt-4 flex gap-2">
          <button
            onClick={onRejectToggle}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-loss/30 bg-loss-muted py-2 text-sm font-semibold text-loss-foreground hover:bg-loss/15"
          >
            <X className="h-4 w-4" /> Reject
          </button>
          <button
            onClick={onApprove}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gain py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            <Check className="h-4 w-4" /> Approve
          </button>
        </div>
      )}
    </div>
  )
}
