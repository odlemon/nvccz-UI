"use client"

import { X, Building2, Users, User, Clock, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import type { Fund } from "@/lib/api/funds-api"

const safeNumber = (val: unknown): number => {
  const n = typeof val === "string" ? Number.parseFloat(val) : Number(val)
  return Number.isFinite(n) ? n : 0
}

function fmtCurrency(val: string | number | null | undefined): string {
  const n = safeNumber(val)
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtUSD(val: number | null | undefined): string {
  const n = safeNumber(val)
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} USD`
}

function fmtPct(val: number | null | undefined): string {
  const n = safeNumber(val)
  return `${n.toFixed(2)}%`
}

interface MetricCardProps {
  label: string
  value: string
  icon?: React.ReactNode
  emphasis?: "default" | "primary" | "success" | "muted"
}

function MetricCard({ label, value, icon, emphasis = "default" }: MetricCardProps) {
  const valueColor =
    emphasis === "primary"
      ? "text-blue-700"
      : emphasis === "success"
        ? "text-emerald-700"
        : emphasis === "muted"
          ? "text-gray-500"
          : "text-gray-900"
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2.5">
      <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide leading-tight">
        {label}
      </p>
      <div className={`mt-1 flex items-center gap-1.5 text-sm font-semibold ${valueColor}`}>
        {icon}
        <span className="truncate">{value || "—"}</span>
      </div>
    </div>
  )
}

interface HoldingDetailsProps {
  fund: Fund
  onClose: () => void
  onCreateFund?: () => void
}

export function HoldingDetails({ fund, onClose, onCreateFund }: HoldingDetailsProps) {
  const total = safeNumber(fund.totalAmount)
  const remaining = safeNumber(fund.remainingAmount)
  const deployed = Math.max(0, total - remaining)
  const deployedPct = total ? (deployed / total) * 100 : 0
  const remainingPct = total ? (remaining / total) * 100 : 0

  const disbursements = fund.fundDisbursements || []
  const disbursedItems = disbursements.filter((d) => d.status === "DISBURSED")
  const totalDisbursed = disbursedItems.reduce(
    (sum, d) => sum + safeNumber(d.amount),
    0,
  )
  const totalDisbursedPct = total ? (totalDisbursed / total) * 100 : 0

  return (
    <div className="flex h-full w-full flex-col border-l border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3 shrink-0">
        <h2 className="text-base font-semibold text-gray-900">Holding Details</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-9 w-9 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          aria-label="Close holding details"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="flex flex-col flex-1 overflow-hidden">
        <TabsList className="w-full justify-start rounded-none border-b border-gray-200 bg-transparent px-5 shrink-0 h-auto">
          <TabsTrigger
            value="details"
            className="rounded-none border-b-2 border-transparent px-3 py-3 text-sm text-gray-600 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-700 data-[state=active]:shadow-none"
          >
            Details
          </TabsTrigger>
          <TabsTrigger
            value="disbursements"
            className="rounded-none border-b-2 border-transparent px-3 py-3 text-sm text-gray-600 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-700 data-[state=active]:shadow-none"
          >
            Disbursements ({disbursedItems.length})
          </TabsTrigger>
        </TabsList>

        {/* Details tab */}
        <TabsContent
          value="details"
          className="flex-1 overflow-y-auto mt-0 px-5 py-5 space-y-5"
        >
          {/* Fund identity */}
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 shrink-0">
              <Building2 className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 truncate">{fund.name}</h3>
              {fund.description && (
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{fund.description}</p>
              )}
            </div>
          </div>

          {/* Quick info chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className="rounded-full border-gray-200 bg-gray-50 text-gray-700 text-[11px] font-medium px-2.5 py-1"
            >
              <Users className="h-3 w-3 mr-1" />
              {fund.status || "—"}
            </Badge>
            {fund.focusIndustries?.[0] && (
              <Badge
                variant="outline"
                className="rounded-full border-gray-200 bg-gray-50 text-gray-700 text-[11px] font-medium px-2.5 py-1 max-w-[180px]"
              >
                <Building2 className="h-3 w-3 mr-1 shrink-0" />
                <span className="truncate">{fund.focusIndustries.join(", ")}</span>
              </Badge>
            )}
            <Badge
              variant="outline"
              className="rounded-full border-gray-200 bg-gray-50 text-gray-700 text-[11px] font-medium px-2.5 py-1"
            >
              <User className="h-3 w-3 mr-1" />
              ${safeNumber(fund.minInvestment).toLocaleString()} – $
              {safeNumber(fund.maxInvestment).toLocaleString()}
            </Badge>
          </div>

          {/* Total Capital Committed callout */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-blue-700">
              Total Capital Committed (USD)
            </p>
            <p className="mt-1 text-xl font-bold text-blue-900">
              {fmtCurrency(fund.totalAmount)}
            </p>
          </div>

          {/* Metrics — 2-column grid that fills the sidebar width */}
          <div className="grid grid-cols-2 gap-2.5">
            <MetricCard
              label="Capital Deployed ($)"
              value={fmtUSD(deployed)}
              emphasis="primary"
            />
            <MetricCard
              label="Capital Deployed (%)"
              value={fmtPct(deployedPct)}
              emphasis="primary"
            />
            <MetricCard
              label="Capital Remaining ($)"
              value={fmtUSD(remaining)}
            />
            <MetricCard
              label="Capital Remaining (%)"
              value={fmtPct(remainingPct)}
            />
            <MetricCard
              label="Disbursements Made"
              value={String(disbursedItems.length)}
              icon={<Clock className="h-3.5 w-3.5 text-gray-400" />}
            />
            <MetricCard
              label="Total Disbursed ($)"
              value={fmtUSD(totalDisbursed)}
              emphasis="success"
            />
            <MetricCard
              label="Total Disbursed (%)"
              value={fmtPct(totalDisbursedPct)}
              emphasis="success"
            />
          </div>

          {/* Capital Commitment Completed — boxed so it's never lost in the layout */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 flex items-center gap-3">
            <Checkbox id="commitment-complete" />
            <label
              htmlFor="commitment-complete"
              className="text-sm font-medium text-gray-900 cursor-pointer flex items-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Capital Commitment Completed
            </label>
          </div>

          {onCreateFund && (
            <button
              onClick={onCreateFund}
              className="text-sm font-medium text-blue-700 hover:text-blue-800 underline-offset-4 hover:underline"
            >
              + Create New Fund
            </button>
          )}
        </TabsContent>

        {/* Disbursements tab */}
        <TabsContent
          value="disbursements"
          className="flex-1 overflow-y-auto mt-0 px-5 py-5 space-y-3"
        >
          {disbursements.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
              <Clock className="h-6 w-6 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">No disbursements yet</p>
              <p className="text-xs text-gray-500 mt-1">
                Disbursements made against this fund will appear here.
              </p>
            </div>
          ) : (
            disbursements.map((d) => (
              <div
                key={d.id}
                className="rounded-xl border border-gray-200 bg-white p-4 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-gray-900 truncate">
                    {d.investmentImplementation?.portfolioCompany?.name || "—"}
                  </span>
                  <span
                    className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                      d.status === "DISBURSED"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {d.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">{d.disbursementType || "—"}</span>
                  <span className="font-semibold text-gray-900">{fmtCurrency(d.amount)}</span>
                </div>
                {d.notes && <p className="text-xs text-gray-600">{d.notes}</p>}
                {d.transactionReference && (
                  <p className="text-[10px] text-gray-400">Ref: {d.transactionReference}</p>
                )}
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
