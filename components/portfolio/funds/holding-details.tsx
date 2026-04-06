"use client"

import { X, Building2, Users, User, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Fund } from "@/lib/api/funds-api"

function fmtCurrency(val: string | number) {
  const n = Number(val)
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtUSD(val: number) {
  return `$${val.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} USD`
}

function MetricRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1.5 font-medium text-card-foreground">
        {icon}
        {value}
      </span>
    </div>
  )
}

interface HoldingDetailsProps {
  fund: Fund
  onClose: () => void
  onCreateFund?: () => void
}

export function HoldingDetails({ fund, onClose, onCreateFund }: HoldingDetailsProps) {
  const total = Number(fund.totalAmount)
  const remaining = Number(fund.remainingAmount)
  const deployed = total - remaining
  const deployedPct = total ? ((deployed / total) * 100).toFixed(2) : "0.00"
  const remainingPct = total ? ((remaining / total) * 100).toFixed(2) : "0.00"

  const disbursements = fund.fundDisbursements || []
  const disbursedItems = disbursements.filter(d => d.status === "DISBURSED")
  const totalDisbursed = disbursedItems.reduce((sum, d) => sum + Number(d.amount), 0)

  return (
    <div className="flex h-full flex-col border-l border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
        <h2 className="text-base font-semibold text-card-foreground">Holding Details</h2>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="flex flex-col flex-1 overflow-hidden">
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-6 shrink-0">
          <TabsTrigger
            value="details"
            className="rounded-none border-b-2 border-transparent px-3 pb-3 pt-3 text-sm data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Details
          </TabsTrigger>
          <TabsTrigger
            value="disbursements"
            className="rounded-none border-b-2 border-transparent px-3 pb-3 pt-3 text-sm data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Disbursements ({disbursedItems.length})
          </TabsTrigger>
        </TabsList>

        {/* Details tab */}
        <TabsContent value="details" className="flex-1 overflow-y-auto mt-0 px-6 py-5 space-y-5">
          {/* Fund identity */}
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted shrink-0">
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-card-foreground">{fund.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{fund.description}</p>
            </div>
          </div>

          {/* Quick info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4 shrink-0" />
              <span>Status: <span className="font-medium text-card-foreground">{fund.status}</span></span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4 shrink-0" />
              <span className="truncate">Focus: {fund.focusIndustries?.join(", ") || "N/A"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4 shrink-0" />
              <span>
                Range: ${Number(fund.minInvestment).toLocaleString()} – ${Number(fund.maxInvestment).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Total Capital Committed */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Total Capital Committed (USD)</label>
            <div className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold text-card-foreground">
              {fmtCurrency(fund.totalAmount)}
            </div>
          </div>

          {/* Metrics */}
          <div className="space-y-3 pt-1">
            <MetricRow label="Capital Deployed ($)" value={fmtUSD(deployed)} />
            <MetricRow label="Capital Deployed (%)" value={`${deployedPct}%`} />
            <MetricRow label="Capital Remaining ($)" value={fmtUSD(remaining)} />
            <MetricRow label="Capital Remaining (%)" value={`${remainingPct}%`} />
            <MetricRow
              label="Disbursements Made"
              value={String(disbursedItems.length)}
              icon={<Clock className="h-3.5 w-3.5 text-muted-foreground" />}
            />
            <MetricRow label="Total Disbursed ($)" value={fmtUSD(totalDisbursed)} />
            <MetricRow
              label="Total Disbursed (%)"
              value={total ? `${((totalDisbursed / total) * 100).toFixed(2)}%` : "0%"}
            />
          </div>

          {/* Commitment checkbox */}
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <Checkbox id="commitment-complete" />
            <label htmlFor="commitment-complete" className="text-sm text-card-foreground cursor-pointer">
              Capital Commitment Completed
            </label>
          </div>

          {onCreateFund && (
            <button
              onClick={onCreateFund}
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Create New Fund
            </button>
          )}
        </TabsContent>

        {/* Disbursements tab */}
        <TabsContent value="disbursements" className="flex-1 overflow-y-auto mt-0 px-6 py-5 space-y-3">
          {disbursements.length === 0 ? (
            <p className="text-sm text-muted-foreground">No disbursements yet.</p>
          ) : (
            disbursements.map(d => (
              <div key={d.id} className="rounded-xl border border-border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-card-foreground">
                    {d.investmentImplementation?.portfolioCompany?.name || "—"}
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    d.status === "DISBURSED"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    {d.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{d.disbursementType}</span>
                  <span className="font-semibold text-card-foreground">{fmtCurrency(d.amount)}</span>
                </div>
                {d.notes && <p className="text-xs text-muted-foreground">{d.notes}</p>}
                <p className="text-[10px] text-muted-foreground">Ref: {d.transactionReference}</p>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
