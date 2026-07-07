"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAppSelector } from "@/lib/store"
import { AlertTriangle, CheckCircle2, Info, XCircle, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { TerminalCard } from "@/components/investments/terminal/card"

const TARGET_LABELS: Record<string, string> = {
  BROKER: "Broker Gateway",
  CUSTODIAN: "Custodian Network",
  CORE_BANKING: "Core Banking",
  ACCOUNTING_GL: "Acct Register",
}

type Severity = "info" | "warn" | "error" | "success"

const CONFIG: Record<Severity, { icon: LucideIcon; wrap: string; icon_c: string }> = {
  info: { icon: Info, wrap: "bg-accent", icon_c: "text-primary" },
  warn: { icon: AlertTriangle, wrap: "bg-warn-muted", icon_c: "text-warn-foreground" },
  error: { icon: XCircle, wrap: "bg-loss-muted", icon_c: "text-loss-foreground" },
  success: { icon: CheckCircle2, wrap: "bg-gain-muted", icon_c: "text-gain-foreground" },
}

interface AlertRow {
  id: string
  type: string
  message: string
  time: string | null
  severity: Severity
}

export function TerminalAlertsFeed() {
  const router = useRouter()
  const { trades, validationQueue } = useAppSelector((s) => s.investments)

  const rows = useMemo(() => {
    const hopRows: AlertRow[] = []
    for (const trade of trades) {
      for (const hop of trade.routingHops ?? []) {
        if (hop.status === "FAILED" || hop.status === "RETRYING") {
          hopRows.push({
            id: hop.id,
            type: hop.status === "FAILED" ? "Routing" : "Retrying",
            message: `${TARGET_LABELS[hop.target] ?? hop.target} — Trade ${trade.tradeRef}${trade.security?.symbol ? ` · ${trade.security.symbol}` : ""}`,
            time: hop.dispatchedAt ?? trade.executedAt ?? null,
            severity: hop.status === "FAILED" ? "error" : "warn",
          })
        }
      }
    }
    hopRows.sort((a, b) => (b.time ?? "").localeCompare(a.time ?? ""))

    const rows: AlertRow[] = []
    if (validationQueue.length > 0) {
      rows.push({
        id: "pending-review",
        type: "Validation",
        message: `${validationQueue.length} price${validationQueue.length !== 1 ? "s" : ""} pending review — outlier ticks awaiting approval`,
        time: null,
        severity: "warn",
      })
    }
    return [...rows, ...hopRows].slice(0, 8)
  }, [trades, validationQueue])

  const actionCount = rows.filter((r) => r.severity === "error" || r.severity === "warn").length

  return (
    <TerminalCard
      className="h-full"
      bodyClassName="flex min-h-0 flex-1 flex-col"
      header={{
        title: "Operations Feed",
        actions: rows.length > 0 ? (
          <span className="rounded-full bg-loss-muted px-2 py-0.5 text-[11px] font-medium text-loss-foreground">
            {actionCount} action
          </span>
        ) : undefined,
      }}
    >
      {rows.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <CheckCircle2 className="w-8 h-8 text-gain/40 mb-2" />
          <p className="text-xs text-muted-foreground">No routing issues — all trades clear</p>
        </div>
      ) : (
        <ul className="min-h-0 flex-1 divide-y divide-border/60 overflow-y-auto">
          {rows.map((a) => {
            const c = CONFIG[a.severity]
            return (
              <li key={a.id} className="flex gap-3 px-5 py-3 hover:bg-muted/40 cursor-pointer" onClick={() => router.push("/investments/orders/blotter")}>
                <span className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", c.wrap)}>
                  <c.icon className={cn("h-4 w-4", c.icon_c)} />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{a.type}</span>
                    {a.time && (
                      <span className="text-[11px] text-muted-foreground">
                        · {new Date(a.time).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm leading-snug text-foreground">{a.message}</p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </TerminalCard>
  )
}
