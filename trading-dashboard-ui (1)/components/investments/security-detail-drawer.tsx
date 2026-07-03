"use client"

import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Pencil, Power, Copy, TrendingUp, ShieldCheck, Radio } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { money } from "@/lib/investments/format"
import { LATEST_PRICES, type Security } from "@/lib/investments/mock-data"
import { Delta, ExchangeTag, ValidationBadge } from "@/components/investments/status-pills"

export function SecurityDetailDrawer({
  security,
  open,
  onOpenChange,
  onEdit,
}: {
  security: Security | null
  open: boolean
  onOpenChange: (v: boolean) => void
  onEdit: (s: Security) => void
}) {
  if (!security) return null
  const tick = LATEST_PRICES[security.symbol]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="space-y-0 border-b border-border p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <SheetTitle className="font-mono text-base">{security.symbol}</SheetTitle>
                <ExchangeTag code={security.exchangeCode} />
              </div>
              <SheetDescription className="mt-1 text-xs">{security.name}</SheetDescription>
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
                security.isActive ? "bg-gain-muted text-gain-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", security.isActive ? "bg-gain" : "bg-muted-foreground")} />
              {security.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          {/* Price snapshot */}
          {tick ? (
            <section className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Last price</p>
                  <p className="mt-0.5 font-mono text-2xl font-semibold text-foreground">
                    {money(tick.price)}
                    <span className="ml-1 text-sm text-muted-foreground">{security.listingCurrencyCode}</span>
                  </p>
                </div>
                <Delta value={tick.changePct} className="text-sm" />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <Mini icon={ShieldCheck} label="Validation">
                  <ValidationBadge status={tick.validationStatus} />
                </Mini>
                <Mini icon={Radio} label="Source">
                  <span className={cn("text-xs font-medium", tick.sourceStatus === "OK" ? "text-gain-foreground" : "text-warn-foreground")}>
                    {tick.sourceStatus}
                  </span>
                </Mini>
                <Mini icon={TrendingUp} label="Feed">
                  <span className="text-xs font-medium text-foreground">{tick.tickFrequency.replace("_", " ")}</span>
                </Mini>
              </div>
            </section>
          ) : (
            <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              No price feed available for this instrument.
            </p>
          )}

          {/* Reference data */}
          <section>
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Reference data</h3>
            <dl className="divide-y divide-border rounded-xl border border-border bg-card">
              <Row label="Internal ID" value={security.id} mono />
              <Row label="ISIN" value={security.isin ?? "—"} mono copy />
              <Row label="Exchange" value={security.exchangeCode} />
              <Row label="Listing currency" value={security.listingCurrencyCode} />
              {tick && <Row label="Previous close" value={money(tick.previousClose)} mono />}
            </dl>
          </section>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 border-t border-border bg-card p-4">
          <button
            onClick={() => {
              onOpenChange(false)
              onEdit(security)
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Pencil className="h-4 w-4" /> Edit
          </button>
          <button
            onClick={() =>
              security.isActive
                ? toast.error(`${security.symbol} deactivated`)
                : toast.success(`${security.symbol} activated`)
            }
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium",
              security.isActive
                ? "border-loss/30 bg-loss-muted text-loss-foreground hover:bg-loss/20"
                : "border-gain/30 bg-gain-muted text-gain-foreground hover:bg-gain/20",
            )}
          >
            <Power className="h-4 w-4" /> {security.isActive ? "Deactivate" : "Activate"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function Mini({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-2">
      <div className="mb-1 flex items-center justify-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      {children}
    </div>
  )
}

function Row({ label, value, mono, copy }: { label: string; value: string; mono?: boolean; copy?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="flex items-center gap-1.5">
        <span className={cn("text-sm text-foreground", mono && "font-mono")}>{value}</span>
        {copy && value !== "—" && (
          <button
            onClick={() => {
              navigator.clipboard?.writeText(value)
              toast.success("Copied")
            }}
            className="inline-flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={`Copy ${label}`}
          >
            <Copy className="h-3 w-3" />
          </button>
        )}
      </dd>
    </div>
  )
}
