"use client"

import { format } from "date-fns"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { setConfigViewOpen, setConfigDrawerTarget, setConfigDrawerOpen } from "@/lib/store/slices/streetRatesSlice"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { JsonPreview } from "./json-preview"
import { Pencil, ArrowLeftRight } from "lucide-react"
import { cn } from "@/lib/utils"

function InfoField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm text-gray-900 mt-0.5">{value}</p>
    </div>
  )
}

export function ConfigViewDrawer() {
  const dispatch = useAppDispatch()
  const { configViewOpen, configViewTarget } = useAppSelector((s) => s.streetRates)

  if (!configViewTarget) return null
  const c = configViewTarget

  const handleEdit = () => {
    dispatch(setConfigViewOpen(false))
    dispatch(setConfigDrawerTarget(c))
    dispatch(setConfigDrawerOpen(true))
  }

  return (
    <Sheet open={configViewOpen} onOpenChange={(open) => dispatch(setConfigViewOpen(open))}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start justify-between gap-3 pr-6">
            <SheetTitle className="flex items-center gap-2 flex-wrap">
              <span className="font-mono">{c.contextCode}</span>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full",
                  c.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                )}
              >
                <span className={cn("w-1.5 h-1.5 rounded-full", c.isActive ? "bg-emerald-500" : "bg-gray-400")} />
                {c.isActive ? "Active" : "Inactive"}
              </span>
            </SheetTitle>
            <Button size="sm" className="rounded-full gradient-primary text-white h-8 shrink-0" onClick={handleEdit}>
              <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
            </Button>
          </div>
        </SheetHeader>

        <div className="mt-4 space-y-5">
          {/* Currency pair */}
          <div className="flex items-center gap-2 bg-gray-50/60 border border-gray-100 rounded-xl px-4 py-3">
            <span className="font-mono text-lg font-semibold text-gray-900">{c.fromCurrencyCode}</span>
            <ArrowLeftRight className="w-4 h-4 text-gray-400" />
            <span className="font-mono text-lg font-semibold text-gray-900">{c.toCurrencyCode}</span>
          </div>

          <Separator />

          <div className="space-y-3">
            <p className="text-sm font-medium">Sources</p>
            <div className="grid grid-cols-2 gap-3">
              <InfoField label="Primary" value={<span className="font-mono">{c.primarySourceCode}</span>} />
              <InfoField label="Comparison" value={<span className="font-mono">{c.comparisonSourceCode}</span>} />
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <p className="text-sm font-medium">Display Format</p>
            <div className="grid grid-cols-2 gap-3">
              <InfoField label="Decimals" value={c.displayFormat.decimals} />
              <InfoField label="Label Template" value={c.displayFormat.labelTemplate} />
              <InfoField label="Show Bid / Ask" value={c.displayFormat.showBidAsk ? "Yes" : "No"} />
              <InfoField label="Show Spread" value={c.displayFormat.showSpread ? "Yes" : "No"} />
              <InfoField label="Show Change %" value={c.displayFormat.showChangePct ? "Yes" : "No"} />
              <InfoField label="Sort Order" value={c.sortOrder} />
            </div>
            <JsonPreview value={c.displayFormat} />
          </div>

          <Separator />

          <div className="space-y-3">
            <p className="text-sm font-medium">Metadata</p>
            <div className="grid grid-cols-2 gap-3">
              <InfoField label="Created" value={c.createdAt ? format(new Date(c.createdAt), "dd MMM yyyy, HH:mm") : "—"} />
              <InfoField label="Updated" value={c.updatedAt ? format(new Date(c.updatedAt), "dd MMM yyyy, HH:mm") : "—"} />
            </div>
            <InfoField label="Config ID" value={<span className="font-mono text-xs text-muted-foreground">{c.id}</span>} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
