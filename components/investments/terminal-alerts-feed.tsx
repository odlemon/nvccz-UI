"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAppSelector } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ChevronRight, RotateCcw, XCircle, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

const TARGET_LABELS: Record<string, string> = {
  BROKER: "Broker Gateway",
  CUSTODIAN: "Custodian Network",
  CORE_BANKING: "Core Banking",
  ACCOUNTING_GL: "Acct Register",
}

interface AlertRow {
  id: string
  title: string
  subtitle: string
  timestamp: string | null
  isHigh: boolean
  icon: "failed" | "retrying" | "pending"
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
            title: `${TARGET_LABELS[hop.target] ?? hop.target} — ${hop.status}`,
            subtitle: `Trade ${trade.tradeRef}${trade.security?.symbol ? ` · ${trade.security.symbol}` : ""}`,
            timestamp: hop.dispatchedAt ?? trade.executedAt ?? null,
            isHigh: hop.status === "FAILED",
            icon: hop.status === "FAILED" ? "failed" : "retrying",
          })
        }
      }
    }
    hopRows.sort((a, b) => (b.timestamp ?? "").localeCompare(a.timestamp ?? ""))

    const rows: AlertRow[] = []
    if (validationQueue.length > 0) {
      rows.push({
        id: "pending-review",
        title: `${validationQueue.length} price${validationQueue.length !== 1 ? "s" : ""} pending review`,
        subtitle: "Outlier ticks awaiting approval",
        timestamp: null,
        isHigh: true,
        icon: "pending",
      })
    }
    return [...rows, ...hopRows].slice(0, 8)
  }, [trades, validationQueue])

  return (
    <Card className="lg:col-span-2 bg-white border border-gray-200 shadow-sm">
      <CardHeader className="pb-2 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-semibold text-gray-800">Routing Alerts</CardTitle>
            {rows.some((r) => r.isHigh) && (
              <span className="text-[10px] bg-red-500 text-white rounded-full px-1.5 py-0.5 font-medium">
                {rows.filter((r) => r.isHigh).length} high priority
              </span>
            )}
          </div>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600 rounded-full"
            onClick={() => router.push("/investments/trades")}>
            View all <ChevronRight className="w-3 h-3 ml-0.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-200 mb-2" />
            <p className="text-xs text-muted-foreground">No routing issues — all trades clear</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {rows.map((row) => (
              <div key={row.id}
                className={cn("flex items-start gap-3 px-4 py-3 hover:bg-gray-50/60 transition-colors", row.isHigh && "bg-red-50/30")}>
                <div className={cn(
                  "w-7 h-7 rounded-full border flex items-center justify-center shrink-0 mt-0.5",
                  row.icon === "failed" ? "bg-red-50 border-red-100" : row.icon === "retrying" ? "bg-amber-50 border-amber-100" : "bg-amber-50 border-amber-100"
                )}>
                  {row.icon === "failed" && <XCircle className="w-3.5 h-3.5 text-red-600" />}
                  {row.icon === "retrying" && <RotateCcw className="w-3.5 h-3.5 text-amber-600" />}
                  {row.icon === "pending" && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-gray-800">{row.title}</span>
                    {row.isHigh && (
                      <span className="text-[9px] bg-red-100 text-red-700 rounded px-1 py-0.5 font-medium">HIGH</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{row.subtitle}</p>
                </div>
                {row.timestamp && (
                  <span className="text-[11px] text-muted-foreground shrink-0 mt-0.5">
                    {new Date(row.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
