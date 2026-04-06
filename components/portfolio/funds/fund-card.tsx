"use client"

import { DollarSign, TrendingUp, Briefcase } from "lucide-react"
import type { Fund } from "@/lib/api/funds-api"

const ICON_STYLES = [
  { bg: "bg-teal-50", border: "border-teal-200", color: "text-teal-600" },
  { bg: "bg-emerald-50", border: "border-emerald-200", color: "text-emerald-600" },
  { bg: "bg-sky-50", border: "border-sky-200", color: "text-sky-600" },
  { bg: "bg-amber-50", border: "border-amber-200", color: "text-amber-600" },
]

const ICONS = [Briefcase, TrendingUp, DollarSign]

function fmtCurrency(val: string | number) {
  const n = Number(val)
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function deployedPct(total: string, remaining: string) {
  const t = Number(total), r = Number(remaining)
  if (!t) return 0
  return Math.max(0, Math.min(100, ((t - r) / t) * 100))
}

interface FundCardProps {
  fund: Fund
  index: number
  isSelected: boolean
  onClick: () => void
}

export function FundCard({ fund, index, isSelected, onClick }: FundCardProps) {
  const style = ICON_STYLES[index % ICON_STYLES.length]
  const Icon = ICONS[index % ICONS.length]
  const pct = deployedPct(fund.totalAmount, fund.remainingAmount)

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-3 rounded-2xl border bg-card p-6 text-center transition-all hover:shadow-lg cursor-pointer w-full ${
        isSelected
          ? "border-primary ring-2 ring-primary/20 shadow-lg"
          : "border-border hover:border-muted-foreground/30"
      }`}
    >
      {/* Icon */}
      <div className={`flex h-16 w-16 items-center justify-center rounded-full border-2 ${style.bg} ${style.border}`}>
        <Icon className={`h-7 w-7 ${style.color}`} />
      </div>

      {/* Name */}
      <p className="font-semibold text-card-foreground text-sm leading-tight">{fund.name}</p>

      {/* Capital Deployed */}
      <div className="w-full">
        <p className="text-[11px] text-muted-foreground mb-0.5">Capital Deployed</p>
        <p className="text-2xl font-bold text-card-foreground">{pct.toFixed(2)}%</p>
      </div>

      {/* Total Capital */}
      <div className="w-full">
        <p className="text-[11px] text-muted-foreground mb-0.5">Total Capital</p>
        <p className="text-xl font-bold text-card-foreground">{fmtCurrency(fund.totalAmount)}</p>
      </div>

      {/* Status pill */}
      <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
        fund.status === "OPEN"
          ? "bg-emerald-100 text-emerald-700"
          : fund.status === "PAUSED"
          ? "bg-amber-100 text-amber-700"
          : "bg-slate-100 text-slate-600"
      }`}>
        {fund.status}
      </span>
    </button>
  )
}
