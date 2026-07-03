"use client"

import { formatDistanceToNow } from "date-fns"
import { TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { FxWidget } from "@/lib/api/exchange-rate-display-api"
import { cn } from "@/lib/utils"

// No cleanly-reusable presentational FxWidget component exists in
// components/street-rates/ — HeroRateCard reads straight from the
// street-rates Redux slice and StreetRateHomeWidget fetches its own data,
// neither accepts a plain `widget` prop. This is a small local card built to
// the same visual language instead. Hides itself entirely when there's no
// widget or no primary rate, per the "handle null gracefully" requirement.
export function LpFxWidgetCard({ widget }: { widget: FxWidget | null | undefined }) {
  if (!widget || !widget.primary) return null

  const { primary, comparison, pair, asOfDate, meta } = widget
  const spreadUp = (comparison?.spreadPct ?? 0) >= 0

  return (
    <Card className="bg-white border border-gray-200 shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-gray-800">
          Exchange Rate · {pair?.replace("/", " / ")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-3xl font-semibold tabular-nums text-gray-900">{primary.avg}</span>
          <span className="text-xs text-muted-foreground">{primary.label}</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Bid {primary.bid}</span>
          <span>Ask {primary.ask}</span>
        </div>
        {comparison && (
          <div
            className={cn(
              "inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full",
              spreadUp ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
            )}
          >
            {spreadUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {spreadUp ? "+" : ""}
            {comparison.spreadPct.toFixed(2)}% vs {comparison.source}
          </div>
        )}
        <p className="text-[11px] text-muted-foreground pt-2 border-t border-gray-100">
          As of {asOfDate} · updated {formatDistanceToNow(new Date(meta.fetchedAt), { addSuffix: true })}
        </p>
      </CardContent>
    </Card>
  )
}
