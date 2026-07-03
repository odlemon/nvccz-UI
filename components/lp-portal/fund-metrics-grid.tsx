"use client"

import { cn } from "@/lib/utils"

// Shared KPI tile grid used by both the Dashboard's per-fund summary cards
// (LpFundSummary — no unfundedCommitment field) and the Reports cards
// (LpReportMetrics — uses totalCommitment/totalPaidIn/totalDistributions
// naming). Callers normalize their source object into this shape.
export interface FundMetricsData {
  commitment?: number | null
  paidIn?: number | null
  distributions?: number | null
  unfundedCommitment?: number | null
  nav?: number | null
  dpi?: number | null
  tvpi?: number | null
  rvpi?: number | null
  netIrr?: number | null
  currencyCode?: string | null
}

function formatMoney(value: number | null | undefined, currencyCode?: string | null): string {
  if (value == null || !Number.isFinite(value)) return "—"
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode || "USD",
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `${currencyCode ?? ""} ${value.toLocaleString()}`.trim()
  }
}

function formatMultiple(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—"
  return `${value.toFixed(2)}x`
}

function formatPercent(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—"
  // Assumes netIrr is already expressed as a percentage number (e.g. 12.4, not 0.124) —
  // no confirmed real sample of this field, correct if the backend returns a fraction.
  return `${value.toFixed(1)}%`
}

interface MetricTile {
  label: string
  value: string
  accent?: string
}

export function FundMetricsGrid({
  metrics,
  className,
}: {
  metrics: FundMetricsData
  className?: string
}) {
  const tiles: MetricTile[] = [
    { label: "Commitment", value: formatMoney(metrics.commitment, metrics.currencyCode) },
    { label: "Paid In", value: formatMoney(metrics.paidIn, metrics.currencyCode) },
    { label: "Distributions", value: formatMoney(metrics.distributions, metrics.currencyCode) },
    ...(metrics.unfundedCommitment != null
      ? [{ label: "Unfunded Commitment", value: formatMoney(metrics.unfundedCommitment, metrics.currencyCode) }]
      : []),
    { label: "NAV", value: formatMoney(metrics.nav, metrics.currencyCode) },
    { label: "DPI", value: formatMultiple(metrics.dpi) },
    { label: "TVPI", value: formatMultiple(metrics.tvpi) },
    { label: "RVPI", value: formatMultiple(metrics.rvpi) },
    { label: "Net IRR", value: formatPercent(metrics.netIrr), accent: "text-emerald-600" },
  ]

  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3", className)}>
      {tiles.map((tile) => (
        <div key={tile.label} className="rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-2.5">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{tile.label}</p>
          <p className={cn("text-lg font-semibold tabular-nums text-gray-900 mt-0.5", tile.accent)}>
            {tile.value}
          </p>
        </div>
      ))}
    </div>
  )
}
