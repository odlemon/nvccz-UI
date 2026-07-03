"use client"

import { formatDistanceToNow } from "date-fns"
import { useAppSelector } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LiveStatusDot, staleToStatus } from "./live-status-dot"
import { decimalsOf, fmtRate, fmtPct } from "./format"
import type { RateQuote } from "@/lib/api/exchange-rate-display-api"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

function QuoteCard({ title, quote, stale, accent }: { title: string; quote: RateQuote | null; stale: boolean; accent: string }) {
  return (
    <Card className="flex-1 bg-white border border-gray-200 shadow-none">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-gray-800">{title}</CardTitle>
          {quote && <LiveStatusDot status={staleToStatus(stale, false)} />}
        </div>
      </CardHeader>
      <CardContent>
        {!quote ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No {title.toLowerCase()} quote available</p>
        ) : (
          <>
            <div className="text-3xl font-bold tabular-nums" style={{ color: accent }}>
              {fmtRate(Number(quote.avg), decimalsOf(quote.avg))}
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-gray-400">Bid</p>
                <p className="text-sm font-semibold text-gray-800 tabular-nums">{fmtRate(Number(quote.bid), decimalsOf(quote.avg))}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-gray-400">Ask</p>
                <p className="text-sm font-semibold text-gray-800 tabular-nums">{fmtRate(Number(quote.ask), decimalsOf(quote.avg))}</p>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-4">
              Updated {formatDistanceToNow(new Date(quote.fetchedAt), { addSuffix: true })}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export function RateComparisonPanel() {
  const { compare } = useAppSelector((s) => s.streetRates)

  if (!compare) return null

  const spreadUp = (compare.spread?.pct ?? 0) >= 0

  return (
    <div className="flex flex-col md:flex-row items-stretch gap-4">
      <QuoteCard title="Street" quote={compare.street} stale={compare.meta.streetStale} accent="#F59E0B" />

      <div className="flex md:flex-col items-center justify-center gap-2 shrink-0 px-2">
        {compare.spread ? (
          <div
            className={cn(
              "inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap",
              spreadUp ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
            )}
          >
            {spreadUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {fmtPct(compare.spread.pct)}
          </div>
        ) : (
          <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap bg-gray-50 text-gray-400">
            —
          </div>
        )}
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Spread</span>
      </div>

      <QuoteCard title="Official" quote={compare.official} stale={compare.meta.officialStale} accent="#3B82F6" />
    </div>
  )
}
