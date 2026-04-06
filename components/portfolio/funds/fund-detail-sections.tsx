"use client"

import { Calendar, ChevronRight } from "lucide-react"
import type { Fund } from "@/lib/api/funds-api"

function fmtCurrency(val: string | number) {
  const n = Number(val)
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function InfoRow({
  label,
  value,
  hasArrow = false,
}: {
  label: string
  value: React.ReactNode
  hasArrow?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-2.5 text-sm border-b border-border last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1 font-medium text-card-foreground">
        {value}
        {hasArrow && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
      </span>
    </div>
  )
}

export function FundDetailSections({ fund }: { fund: Fund }) {
  const total = Number(fund.totalAmount)
  const remaining = Number(fund.remainingAmount)
  const deployed = total - remaining
  const disbursements = fund.fundDisbursements || []
  const totalDisbursed = disbursements
    .filter(d => d.status === "DISBURSED")
    .reduce((sum, d) => sum + Number(d.amount), 0)

  const appStart = new Date(fund.applicationStart).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  const appEnd = new Date(fund.applicationEnd).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* Capital Overview */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="bg-primary px-5 py-3">
          <h3 className="text-sm font-semibold text-primary-foreground">Capital Overview</h3>
        </div>
        <div className="px-5 py-1">
          <InfoRow label="Total Capital" value={fmtCurrency(fund.totalAmount)} hasArrow />
          <InfoRow label="Remaining Capital" value={fmtCurrency(remaining)} hasArrow />
          <InfoRow label="Capital Deployed" value={fmtCurrency(deployed)} hasArrow />
          <InfoRow label="Total Disbursed" value={fmtCurrency(totalDisbursed)} hasArrow />
        </div>
      </div>

      {/* Fund Details */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="bg-primary px-5 py-3">
          <h3 className="text-sm font-semibold text-primary-foreground">Fund Details</h3>
        </div>
        <div className="px-5 py-1">
          <InfoRow label="Status" value={
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              fund.status === "OPEN" ? "bg-emerald-100 text-emerald-700"
                : fund.status === "PAUSED" ? "bg-amber-100 text-amber-700"
                : "bg-muted text-muted-foreground"
            }`}>
              {fund.status}
            </span>
          } />
          <InfoRow label="Min Investment" value={fmtCurrency(fund.minInvestment)} />
          <InfoRow label="Max Investment" value={fmtCurrency(fund.maxInvestment)} />
          <InfoRow label="Disbursements" value={String(disbursements.length)} hasArrow />
        </div>
      </div>

      {/* Timeline & Focus */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="bg-primary px-5 py-3">
          <h3 className="text-sm font-semibold text-primary-foreground">Timeline &amp; Focus</h3>
        </div>
        <div className="px-5 py-1">
          <InfoRow label="Application Start" value={
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              {appStart}
            </span>
          } />
          <InfoRow label="Application End" value={
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              {appEnd}
            </span>
          } />
          <InfoRow label="Focus Industries" value={
            <span className="text-xs">{(fund.focusIndustries || []).length} sectors</span>
          } hasArrow />
          <InfoRow label="Description" value={
            <span className="text-xs text-right max-w-[160px] line-clamp-1">{fund.description}</span>
          } />
        </div>
      </div>
    </div>
  )
}
