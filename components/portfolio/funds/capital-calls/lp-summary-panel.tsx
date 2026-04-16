"use client"

import { X, Building2, Users, DollarSign, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Fund } from "@/lib/api/funds-api"
import type { LpSummaryRow } from "@/lib/api/capital-calls-api"

function fmtCurrency(val: number, decimals = 0) {
  return `$${val.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
}

function MetricRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-card-foreground">{value}</span>
    </div>
  )
}

interface LpSummaryPanelProps {
  fund: Fund
  lpSummary: LpSummaryRow[]
  onClose: () => void
}

export function LpSummaryPanel({
  fund,
  lpSummary,
  onClose,
}: LpSummaryPanelProps) {
  const totalCommitted = lpSummary.reduce((s, lp) => s + lp.totalCommitment, 0)
  const totalCalled = lpSummary.reduce((s, lp) => s + lp.cumulativeCalled, 0)
  const totalReceived = lpSummary.reduce((s, lp) => s + lp.amountReceivedTowardCalls, 0)
  const totalOutstanding = lpSummary.reduce((s, lp) => s + lp.outstandingCallBalance, 0)
  const totalUncalled = lpSummary.reduce((s, lp) => s + lp.uncalledCommitmentBalance, 0)
  const calledPct = totalCommitted ? ((totalCalled / totalCommitted) * 100).toFixed(2) : "0.00"

  return (
    <div className="flex h-full flex-col border-l border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
        <h2 className="text-base font-semibold text-card-foreground">
          LP Dashboard
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="summary" className="flex flex-col flex-1 overflow-hidden">
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-6 shrink-0">
          <TabsTrigger
            value="summary"
            className="rounded-none border-b-2 border-transparent px-3 pb-3 pt-3 text-sm data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Summary
          </TabsTrigger>
          <TabsTrigger
            value="lps"
            className="rounded-none border-b-2 border-transparent px-3 pb-3 pt-3 text-sm data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            LPs ({lpSummary.length})
          </TabsTrigger>
        </TabsList>

        {/* Summary tab */}
        <TabsContent value="summary" className="flex-1 overflow-y-auto mt-0 px-6 py-5 space-y-5">
          {/* Fund identity */}
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted shrink-0">
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-card-foreground">{fund.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Capital Calls Overview</p>
            </div>
          </div>

          {/* Total Capital Committed */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Total Capital Committed (USD)
            </label>
            <div className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold text-card-foreground">
              {fmtCurrency(totalCommitted, 2)}
            </div>
          </div>

          {/* Metrics */}
          <div className="space-y-3 pt-1">
            <MetricRow label="Capital Called to Date ($)" value={`${fmtCurrency(totalCalled)} USD`} />
            <MetricRow label="Capital Called to Date (%)" value={`${calledPct}%`} />
            <MetricRow
              label="Capital Remaining to be Called ($)"
              value={`${fmtCurrency(totalUncalled)} USD`}
            />
            <MetricRow
              label="Capital Remaining to be Called (%)"
              value={`${totalCommitted ? ((totalUncalled / totalCommitted) * 100).toFixed(2) : "0.00"}%`}
            />
          </div>

          <div className="border-t border-border pt-3 space-y-3">
            <MetricRow label="Calls Scheduled" value={`${lpSummary.length}`} />
            <MetricRow label="Total Received ($)" value={`${fmtCurrency(totalReceived)} USD`} />
            <MetricRow label="Outstanding ($)" value={`${fmtCurrency(totalOutstanding)} USD`} />
            <MetricRow
              label="Outstanding (%)"
              value={`${totalCalled ? ((totalOutstanding / totalCalled) * 100).toFixed(2) : "0.00"}%`}
            />
          </div>
        </TabsContent>

        {/* LPs tab */}
        <TabsContent value="lps" className="flex-1 overflow-y-auto mt-0 px-6 py-5 space-y-3">
          {lpSummary.length === 0 ? (
            <p className="text-sm text-muted-foreground">No LP commitments found.</p>
          ) : (
            lpSummary.map((lp) => {
              const pctCalled = lp.totalCommitment
                ? ((lp.cumulativeCalled / lp.totalCommitment) * 100).toFixed(1)
                : "0"

              return (
                <div
                  key={lp.clientId}
                  className="rounded-xl border border-border p-4 space-y-3"
                >
                  {/* LP header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center">
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-card-foreground">
                          {lp.legalName}
                        </span>
                        <p className="text-[10px] text-muted-foreground">{lp.email}</p>
                      </div>
                    </div>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      {lp.currency}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Called</span>
                      <span>{pctCalled}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, Number(pctCalled))}%` }}
                      />
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Commitment</span>
                      <span className="font-medium">{fmtCurrency(lp.totalCommitment)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Called</span>
                      <span className="font-medium">{fmtCurrency(lp.cumulativeCalled)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Received</span>
                      <span className="font-medium text-emerald-600">
                        {fmtCurrency(lp.amountReceivedTowardCalls)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Outstanding</span>
                      <span className="font-medium text-amber-600">
                        {fmtCurrency(lp.outstandingCallBalance)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Uncalled</span>
                      <span className="font-medium">{fmtCurrency(lp.uncalledCommitmentBalance)}</span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
