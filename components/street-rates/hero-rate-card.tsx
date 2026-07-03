"use client"

import { formatDistanceToNow } from "date-fns"
import { useAppSelector } from "@/lib/store"
import { useCountUp } from "@/lib/hooks/use-count-up"
import { LiveStatusDot, staleToStatus } from "./live-status-dot"
import { decimalsOf, fmtRate, fmtPct } from "./format"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

export function HeroRateCard() {
  const { widget, widgetLoading, widgetError } = useAppSelector((s) => s.streetRates)
  const streetValue = useCountUp(widget?.primary ? Number(widget.primary.avg) : 0)

  if (!widget || !widget.primary) return null

  const { primary, comparison, pair, asOfDate, meta } = widget
  const decimals = decimalsOf(primary.avg)
  const officialValue = comparison ? Number(comparison.avg) : null
  const spreadAbs = comparison ? Number(comparison.spreadAbsolute) : null
  const spreadUp = (comparison?.spreadPct ?? 0) >= 0

  return (
    <div className="relative overflow-hidden rounded-3xl border-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Ambient glow accents */}
      <div className="pointer-events-none absolute -top-24 -right-16 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />

      <div className="relative p-6 md:p-10">
        {/* Top row */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              {pair.replace("/", " / ")}
            </span>
            <p className="text-[11px] text-slate-500 mt-1">As of {asOfDate}</p>
          </div>
          <LiveStatusDot status={staleToStatus(meta.stale, !!widgetError)} />
        </div>

        {/* Hero number */}
        <div className="mt-4 md:mt-6">
          <div className="text-6xl md:text-7xl font-bold tracking-tight tabular-nums">
            {fmtRate(streetValue, decimals)}
          </div>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">
              {primary.label}
            </span>
            <span className="text-xs text-slate-500">{primary.format}</span>
          </div>
        </div>

        {/* Spread vs official badge */}
        {comparison && (
          <div className="mt-6 flex items-center gap-3 flex-wrap">
            <div
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold",
                spreadUp ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
              )}
            >
              {spreadUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {fmtPct(comparison.spreadPct)}
            </div>
            <span className="text-xs text-slate-500">Compared to Official</span>
          </div>
        )}

        {/* Inline official / spread stats */}
        {comparison && (
          <div className="mt-8 grid grid-cols-2 gap-4 max-w-xs">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500">Official Rate</p>
              <p className="text-xl font-semibold tabular-nums mt-0.5">{fmtRate(officialValue, decimals)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500">Spread</p>
              <p className="text-xl font-semibold tabular-nums mt-0.5">{fmtRate(spreadAbs, decimals)}</p>
            </div>
          </div>
        )}

        {/* Bottom metadata */}
        <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs text-slate-500">
            Updated {formatDistanceToNow(new Date(meta.fetchedAt), { addSuffix: true })}
          </span>
          {widgetLoading && <span className="text-[10px] text-slate-600">Refreshing…</span>}
        </div>
      </div>
    </div>
  )
}
