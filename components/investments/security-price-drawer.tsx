"use client"

import { useEffect, useMemo, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { setPriceDrawerOpen, fetchSecurityPriceHistory } from "@/lib/store/slices/investmentsSlice"
import { priceChange } from "@/lib/api/investments-api"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus, ChevronLeft, ChevronRight, LineChart } from "lucide-react"

const PAGE_SIZE = 15

function ValidationPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    APPROVED: "bg-emerald-100 text-emerald-700",
    PENDING_REVIEW: "bg-amber-100 text-amber-700",
    REJECTED: "bg-red-100 text-red-700",
  }
  return (
    <span className={cn("inline-flex text-[10px] font-medium px-1.5 py-0.5 rounded-full", map[status] ?? "bg-gray-100 text-gray-600")}>
      {status.replace("_", " ")}
    </span>
  )
}

function SourcePill({ status }: { status: string }) {
  return status === "FALLBACK" ? (
    <span className="inline-flex text-[10px] font-medium px-1.5 py-0.5 rounded-full border border-dashed border-slate-300 text-slate-500">
      FALLBACK
    </span>
  ) : (
    <span className="inline-flex text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
      OK
    </span>
  )
}

export function SecurityPriceDrawer() {
  const dispatch = useAppDispatch()
  const { priceDrawerTarget, priceHistoryCache, priceHistoryLoadingIds } = useAppSelector((s) => s.investments)
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (priceDrawerTarget) dispatch(fetchSecurityPriceHistory(priceDrawerTarget.id))
    setPage(1)
  }, [dispatch, priceDrawerTarget?.id])

  const priceHistory = priceDrawerTarget ? priceHistoryCache[priceDrawerTarget.id] ?? [] : []
  const priceHistoryLoading = priceDrawerTarget ? !!priceHistoryLoadingIds[priceDrawerTarget.id] : false

  const latest = priceHistory[0]
  const summary = priceChange(latest)

  const totalPages = Math.max(1, Math.ceil(priceHistory.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = priceHistory.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const pageNumbers = useMemo(() => {
    const start = Math.max(1, safePage - 2)
    const end = Math.min(totalPages, safePage + 2)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }, [safePage, totalPages])

  if (!priceDrawerTarget) return null

  return (
    <Sheet open onOpenChange={() => dispatch(setPriceDrawerOpen(false))}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span className="font-mono">{priceDrawerTarget.symbol}</span>
            <Badge variant="outline">{priceDrawerTarget.exchangeCode}</Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-1 mb-4">
          <p className="text-sm text-muted-foreground">{priceDrawerTarget.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{priceDrawerTarget.listingCurrencyCode}</p>
        </div>

        {/* Summary strip */}
        {priceHistoryLoading ? (
          <Skeleton className="h-16 w-full rounded-xl mb-4" />
        ) : latest ? (
          <div className="flex items-center justify-between bg-gray-50/60 border border-gray-100 rounded-xl px-4 py-3 mb-4">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Latest Price</p>
              <p className="font-mono text-2xl font-semibold text-gray-900">{summary.price?.toFixed(4)}</p>
            </div>
            <div className="flex items-center gap-1.5">
              {summary.direction === "UP" && <TrendingUp className="w-4 h-4 text-[#10B981]" />}
              {summary.direction === "DOWN" && <TrendingDown className="w-4 h-4 text-[#EF4444]" />}
              {summary.direction === "FLAT" && <Minus className="w-4 h-4 text-[#6B7280]" />}
              <span className={cn("font-mono text-sm", summary.direction === "UP" ? "text-[#10B981]" : summary.direction === "DOWN" ? "text-[#EF4444]" : "text-[#6B7280]")}>
                {summary.pct != null ? `${summary.pct >= 0 ? "+" : ""}${summary.pct.toFixed(2)}%` : "—"}
              </span>
            </div>
            <div className="flex flex-col items-end gap-1">
              <ValidationPill status={latest.validationStatus} />
              <SourcePill status={latest.sourceStatus} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center mb-4">
            <LineChart className="w-8 h-8 text-gray-200 mb-2" />
            <p className="text-xs text-muted-foreground">No price ticks recorded yet</p>
          </div>
        )}

        {/* Rich datatable */}
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {["Priced At", "Type", "Price", "Prev Close", "Dev %", "Validation", "Freq", "FX Rate", "Source"].map((h) => (
                    <th key={h} className="text-left px-3 py-2 font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {priceHistoryLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={9} className="px-3 py-2"><Skeleton className="h-4 w-full" /></td>
                    </tr>
                  ))
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-muted-foreground">No price history</td>
                  </tr>
                ) : (
                  paginated.map((tick) => {
                    const c = priceChange(tick)
                    return (
                      <tr key={tick.id} className="hover:bg-blue-50/20">
                        <td className="px-3 py-2 font-mono text-gray-600 whitespace-nowrap">
                          {new Date(tick.pricedAt).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-gray-700">{tick.priceType}</td>
                        <td className="px-3 py-2 font-mono font-semibold text-gray-900">{Number(tick.price).toFixed(4)}</td>
                        <td className="px-3 py-2 font-mono text-gray-600">
                          {tick.previousClose != null ? Number(tick.previousClose).toFixed(4) : "—"}
                        </td>
                        <td className="px-3 py-2 font-mono">
                          {tick.deviationPct != null ? (
                            <span className={cn(Number(tick.deviationPct) > 15 ? "text-amber-600 font-semibold" : "text-gray-600")}>
                              {Number(tick.deviationPct).toFixed(2)}%
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-3 py-2"><ValidationPill status={tick.validationStatus} /></td>
                        <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{tick.tickFrequency}</td>
                        <td className="px-3 py-2 font-mono text-gray-600">{Number(tick.fxRateUsed).toFixed(2)}</td>
                        <td className="px-3 py-2"><SourcePill status={tick.sourceStatus} /></td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 bg-gray-50/40">
              <p className="text-[11px] text-muted-foreground">
                Page {safePage} of {totalPages} · {priceHistory.length} ticks
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline" size="sm" className="h-6 w-6 p-0 rounded-full bg-white"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="w-3 h-3" />
                </Button>
                {pageNumbers.map((n) => (
                  <Button
                    key={n}
                    variant={safePage === n ? "default" : "outline"}
                    size="sm"
                    className={cn("h-6 w-6 p-0 rounded-full text-[11px]", safePage === n ? "gradient-primary text-white" : "bg-white")}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </Button>
                ))}
                <Button
                  variant="outline" size="sm" className="h-6 w-6 p-0 rounded-full bg-white"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
