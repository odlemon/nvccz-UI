"use client"

import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { Check, X, TriangleAlert, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { toast } from "sonner"
import { money } from "@/lib/investments/format"
import { VALIDATION_QUEUE, type ValidationTick } from "@/lib/investments/mock-data"
import { PageHeader } from "@/components/investments/page-header"
import { ExchangeTag } from "@/components/investments/status-pills"

type Decision = "approved" | "rejected"

function severity(dev: number) {
  const a = Math.abs(dev)
  if (a >= 20) return { label: "Critical", cls: "bg-loss-muted text-loss-foreground ring-loss/30" }
  if (a >= 10) return { label: "High", cls: "bg-warn-muted text-warn-foreground ring-warn/30" }
  return { label: "Moderate", cls: "bg-accent text-accent-foreground ring-primary/20" }
}

export function ValidationQueue() {
  const [decisions, setDecisions] = useState<Record<string, Decision>>({})

  const pending = useMemo(
    () => VALIDATION_QUEUE.filter((t) => !decisions[t.tick_id]),
    [decisions],
  )

  const decide = (tick: ValidationTick, decision: Decision) => {
    setDecisions((d) => ({ ...d, [tick.tick_id]: decision }))
    toast[decision === "approved" ? "success" : "error"](
      `${tick.ticker} price ${decision}`,
      { description: `${money(tick.proposed_price)} · ${tick.deviation_percent.toFixed(2)}% deviation` },
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Validation Queue"
        subtitle="Manual review of price ticks flagged for exceeding deviation thresholds"
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Pending review" value={String(pending.length)} tone={pending.length ? "warn" : "gain"} />
        <Stat label="Approved" value={String(Object.values(decisions).filter((d) => d === "approved").length)} tone="gain" />
        <Stat label="Rejected" value={String(Object.values(decisions).filter((d) => d === "rejected").length)} tone="loss" />
        <Stat label="Threshold" value="±10%" />
      </div>

      {pending.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card py-16 text-center">
          <Check className="mx-auto h-8 w-8 text-gain" />
          <p className="mt-3 text-sm font-medium text-foreground">Queue is clear</p>
          <p className="text-xs text-muted-foreground">All flagged ticks have been reviewed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {pending.map((tick) => {
            const sev = severity(tick.deviation_percent)
            const up = tick.deviation_percent >= 0
            return (
              <div key={tick.tick_id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-warn-muted text-warn-foreground">
                      <TriangleAlert className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-foreground">{tick.ticker}</span>
                        <ExchangeTag code={tick.exchange} />
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(tick.price_date).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset", sev.cls)}>
                    {sev.label}
                  </span>
                </div>

                {/* Price comparison */}
                <div className="mt-4 grid grid-cols-3 items-center gap-2 rounded-lg border border-border bg-background p-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Prev close</p>
                    <p className="font-mono text-sm text-foreground">{money(tick.previous_close)}</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
                        up ? "bg-gain-muted text-gain-foreground" : "bg-loss-muted text-loss-foreground",
                      )}
                    >
                      {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {tick.deviation_percent.toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Proposed</p>
                    <p className={cn("font-mono text-sm font-semibold", up ? "text-gain" : "text-loss")}>
                      {money(tick.proposed_price)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => decide(tick, "rejected")}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-loss/30 bg-loss-muted py-2 text-sm font-semibold text-loss-foreground hover:bg-loss/15"
                  >
                    <X className="h-4 w-4" /> Reject
                  </button>
                  <button
                    onClick={() => decide(tick, "approved")}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gain py-2 text-sm font-semibold text-white hover:opacity-90"
                  >
                    <Check className="h-4 w-4" /> Approve
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "warn" | "gain" | "loss" }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 font-mono text-lg font-semibold",
          tone === "loss" ? "text-loss" : tone === "gain" ? "text-gain" : tone === "warn" ? "text-warn-foreground" : "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  )
}
