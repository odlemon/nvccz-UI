"use client"

import { useEffect, useMemo, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { setPriceDrawerOpen, fetchSecurityPriceHistory } from "@/lib/store/slices/investmentsSlice"
import { priceChange } from "@/lib/api/investments-api"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, LineChart, ShieldCheck, Radio, TrendingUp } from "lucide-react"
import { Delta, ValidationBadge, SourceBadge, ExchangeTag } from "./status-pills"

const PAGE_SIZE = 15

function Mini({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-background p-2">
      <div className="mb-1 flex items-center justify-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      {children}
    </div>
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
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-xl overflow-y-auto">
        <SheetHeader className="space-y-0 border-b border-border p-5">
          <div className="flex items-center gap-2">
            <SheetTitle className="font-mono text-base">{priceDrawerTarget.symbol}</SheetTitle>
            <ExchangeTag exchange={priceDrawerTarget.exchangeCode} />
          </div>
          <SheetDescription className="mt-1 text-xs">
            {priceDrawerTarget.name} · {priceDrawerTarget.listingCurrencyCode}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          {/* Price snapshot */}
          {priceHistoryLoading ? (
            <Skeleton className="h-24 w-full rounded-xl" />
          ) : latest ? (
            <section className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Latest price</p>
                  <p className="mt-0.5 font-mono text-2xl font-semibold text-foreground">
                    {summary.price?.toFixed(4)}
                    <span className="ml-1 text-sm text-muted-foreground">{priceDrawerTarget.listingCurrencyCode}</span>
                  </p>
                </div>
                <Delta value={summary.pct} direction={summary.direction} className="text-sm" />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <Mini icon={ShieldCheck} label="Validation">
                  <ValidationBadge status={latest.validationStatus} />
                </Mini>
                <Mini icon={Radio} label="Source">
                  <SourceBadge status={latest.sourceStatus} />
                </Mini>
                <Mini icon={TrendingUp} label="Feed">
                  <span className="text-xs font-medium text-foreground">{latest.tickFrequency?.replace("_", " ")}</span>
                </Mini>
              </div>
            </section>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center rounded-lg border border-dashed border-border">
              <LineChart className="w-8 h-8 text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">No price ticks recorded yet</p>
            </div>
          )}

          {/* Rich datatable */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {["Priced At", "Type", "Price", "Prev Close", "Dev %", "Validation", "Freq", "FX Rate", "Source"].map((h) => (
                      <th key={h} className="text-left px-3 py-2 font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {priceHistoryLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}><td colSpan={9} className="px-3 py-2"><Skeleton className="h-4 w-full" /></td></tr>
                    ))
                  ) : paginated.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-8 text-muted-foreground">No price history</td></tr>
                  ) : (
                    paginated.map((tick) => {
                      const c = priceChange(tick)
                      return (
                        <tr key={tick.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                          <td className="px-3 py-2 font-mono text-muted-foreground whitespace-nowrap">{new Date(tick.pricedAt).toLocaleString()}</td>
                          <td className="px-3 py-2 text-foreground">{tick.priceType}</td>
                          <td className="px-3 py-2 font-mono font-semibold text-foreground">{Number(tick.price).toFixed(4)}</td>
                          <td className="px-3 py-2 font-mono text-muted-foreground">{tick.previousClose != null ? Number(tick.previousClose).toFixed(4) : "—"}</td>
                          <td className="px-3 py-2 font-mono">
                            {tick.deviationPct != null ? (
                              <span className={cn(Number(tick.deviationPct) > 15 ? "text-warn-foreground font-semibold" : "text-muted-foreground")}>
                                {Number(tick.deviationPct).toFixed(2)}%
                              </span>
                            ) : "—"}
                          </td>
                          <td className="px-3 py-2"><ValidationBadge status={tick.validationStatus} /></td>
                          <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{tick.tickFrequency}</td>
                          <td className="px-3 py-2 font-mono text-muted-foreground">{Number(tick.fxRateUsed).toFixed(2)}</td>
                          <td className="px-3 py-2"><SourceBadge status={tick.sourceStatus} /></td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-muted/20">
                <p className="text-[11px] text-muted-foreground">Page {safePage} of {totalPages} · {priceHistory.length} ticks</p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="h-6 w-6 p-0 rounded-full bg-card" disabled={safePage <= 1} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft className="w-3 h-3" />
                  </Button>
                  {pageNumbers.map((n) => (
                    <Button
                      key={n} variant={safePage === n ? "default" : "outline"} size="sm"
                      className={cn("h-6 w-6 p-0 rounded-full text-[11px]", safePage === n ? "bg-primary text-primary-foreground" : "bg-card")}
                      onClick={() => setPage(n)}
                    >
                      {n}
                    </Button>
                  ))}
                  <Button variant="outline" size="sm" className="h-6 w-6 p-0 rounded-full bg-card" disabled={safePage >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
