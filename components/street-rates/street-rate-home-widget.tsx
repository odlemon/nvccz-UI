"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { exchangeRateDisplayApi, type FxWidget } from "@/lib/api/exchange-rate-display-api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { LiveStatusDot, staleToStatus } from "./live-status-dot"
import { decimalsOf, fmtRate, fmtPct, CURRENCIES } from "./format"
import { TrendingUp, TrendingDown, ArrowLeftRight, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

// Self-contained: fetches its own widget snapshot directly (no Redux), so the
// quick currency switch here never affects the full /street-rates dashboard's
// own selected context/pair.
export function StreetRateHomeWidget() {
  const [from, setFrom] = useState("USD")
  const [to, setTo] = useState("ZWG")
  const [widget, setWidget] = useState<FxWidget | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    exchangeRateDisplayApi
      .getWidget({ context: "GENERIC", from, to })
      .then((res) => {
        if (cancelled) return
        if (!res.success) throw new Error(res.error || "Failed to load rate")
        setWidget(res.data ?? null)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [from, to])

  const decimals = widget?.primary ? decimalsOf(widget.primary.avg) : 2
  const spreadUp = (widget?.comparison?.spreadPct ?? 0) >= 0

  return (
    <Card className="bg-white border border-gray-200 shadow-none h-full">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold text-gray-800">Street Exchange Rate</CardTitle>
        <Link href="/street-rates" className="text-xs text-blue-600 hover:underline flex items-center gap-0.5 shrink-0">
          View details <ArrowRight className="w-3 h-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {/* Quick currency switch */}
        <div className="flex items-center gap-1.5 mb-4">
          <Select value={from} onValueChange={setFrom}>
            <SelectTrigger className="w-20 h-8 text-xs font-mono"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <ArrowLeftRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <Select value={to} onValueChange={setTo}>
            <SelectTrigger className="w-20 h-8 text-xs font-mono"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-4 w-40" />
          </div>
        ) : error || !widget || !widget.primary ? (
          <p className="text-sm text-muted-foreground py-4">
            {error ? "Couldn't load this rate." : `No display configuration for ${from}/${to}.`}
          </p>
        ) : (
          <>
            <div className="flex items-end gap-3 flex-wrap">
              <span className="text-5xl font-normal text-gray-900 tabular-nums tracking-tight">
                {fmtRate(Number(widget.primary.avg), decimals)}
              </span>
              {widget.comparison && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full mb-1",
                    spreadUp ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                  )}
                >
                  {spreadUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {fmtPct(widget.comparison.spreadPct)}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{widget.primary.label} · {widget.primary.format}</p>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <LiveStatusDot status={staleToStatus(widget.meta.stale, false)} />
              <span className="text-[11px] text-muted-foreground">
                Updated {formatDistanceToNow(new Date(widget.meta.fetchedAt), { addSuffix: true })}
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
