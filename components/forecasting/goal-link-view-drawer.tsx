"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Link2, Target, DollarSign, Calendar, Hash, TrendingUp,
  TrendingDown, Minus, Layers, Database,
} from "lucide-react"
import type { GoalLink, ForecastChartOfAccount } from "@/lib/api/forecasting-api"

interface GoalLinkViewDrawerProps {
  isOpen: boolean
  onClose: () => void
  link: GoalLink | null
  coa?: ForecastChartOfAccount[]
}

function fmtVal(v: string | number | null | undefined): string {
  if (v == null || v === "") return "—"
  const n = typeof v === "string" ? parseFloat(v) : v
  if (isNaN(n)) return String(v)
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M"
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + "K"
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

function ProgressBar({ current, target }: { current: string | number | null | undefined; target: string | number | null | undefined }) {
  const c = parseFloat(String(current ?? 0)) || 0
  const t = parseFloat(String(target ?? 0)) || 0
  if (t === 0) return null
  const pct = Math.min(100, Math.max(0, (c / t) * 100))
  const isOver = c > t
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Progress</span>
        <span className={`font-semibold ${isOver ? "text-green-600" : pct >= 80 ? "text-amber-600" : "text-blue-600"}`}>
          {pct.toFixed(1)}%
        </span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isOver ? "bg-green-500" : pct >= 80 ? "bg-amber-500" : "bg-blue-500"}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  )
}

export function GoalLinkViewDrawer({ isOpen, onClose, link, coa = [] }: GoalLinkViewDrawerProps) {
  if (!link) return null

  const goal = link.performanceGoal
  const accountName = coa.find(a => a.id === link.accountId)
  const current = parseFloat(String(goal?.currentValue ?? 0)) || 0
  const target  = parseFloat(String(goal?.targetValue  ?? 0)) || 0
  const variance = target > 0 ? current - target : null
  const isAhead = variance != null && variance >= 0

  const linkedDate = link.createdAt ? new Date(link.createdAt) : null

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="p-0 overflow-y-auto"
        style={{ width: "48vw", maxWidth: "560px" }}
      >
        {/* Header */}
        <SheetHeader className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-100">
          <SheetTitle className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center shrink-0">
              <Link2 className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <span className="text-lg font-bold text-gray-900 leading-snug block truncate">
                {goal?.title ?? "Performance Goal Link"}
              </span>
              <p className="text-xs text-gray-500 font-normal mt-0.5 font-mono truncate">
                {link.id}
              </p>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="p-6 space-y-5">

          {/* Goal Performance */}
          {goal && (
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Target className="w-4 h-4 text-blue-600" />
                  Goal Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Goal Title</p>
                  <p className="font-semibold text-gray-900">{goal.title}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Target Value</p>
                    <p className="text-xl font-bold text-gray-800">{fmtVal(goal.targetValue)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Current Value</p>
                    <p className={`text-xl font-bold ${isAhead ? "text-green-600" : "text-amber-600"}`}>
                      {fmtVal(goal.currentValue)}
                    </p>
                  </div>
                </div>

                <ProgressBar current={goal.currentValue} target={goal.targetValue} />

                {variance != null && (
                  <div className="flex items-center gap-2 pt-1">
                    <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      isAhead ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {isAhead
                        ? <TrendingUp className="w-3 h-3" />
                        : <TrendingDown className="w-3 h-3" />}
                      {isAhead ? "+" : ""}{fmtVal(variance)} vs target
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Link Configuration */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-green-600" />
                Link Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {link.thresholdValue != null && link.thresholdValue !== "" && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Threshold Value</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-amber-600">{fmtVal(link.thresholdValue)}</span>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">Trigger threshold</Badge>
                  </div>
                  {goal?.currentValue != null && (
                    <p className={`text-xs mt-1 ${
                      parseFloat(String(goal.currentValue)) >= parseFloat(String(link.thresholdValue))
                        ? "text-green-600"
                        : "text-muted-foreground"
                    }`}>
                      Current ({fmtVal(goal.currentValue)}) is{" "}
                      {parseFloat(String(goal.currentValue)) >= parseFloat(String(link.thresholdValue))
                        ? "above threshold"
                        : "below threshold"}
                    </p>
                  )}
                </div>
              )}

              {link.accountId && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Linked Account</p>
                  {accountName ? (
                    <div className="flex items-start gap-2">
                      <Database className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-sm">{accountName.account_name}</p>
                        <p className="text-xs font-mono text-muted-foreground">{accountName.account_no}</p>
                        <Badge variant="outline" className="mt-1 text-[10px]">{accountName.account_type}</Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-gray-400" />
                      <p className="text-sm font-mono text-gray-700">{link.accountId}</p>
                    </div>
                  )}
                </div>
              )}

              {!link.thresholdValue && !link.accountId && (
                <div className="flex items-center gap-2 py-2">
                  <Minus className="w-4 h-4 text-gray-300" />
                  <p className="text-sm text-muted-foreground">No threshold or account constraints configured</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reference IDs */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Hash className="w-4 h-4 text-gray-500" />
                Reference IDs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: "Link ID",              value: link.id },
                  { label: "Performance Goal ID",  value: link.performanceGoalId },
                  { label: "Scenario ID",          value: link.scenarioId },
                  ...(link.accountId ? [{ label: "Account ID", value: link.accountId }] : []),
                ].map(row => (
                  <div key={row.label} className="flex items-start justify-between gap-3">
                    <p className="text-xs text-muted-foreground shrink-0 pt-0.5">{row.label}</p>
                    <p className="text-xs font-mono text-gray-700 text-right break-all">{row.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-500" />
                Metadata
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Linked At</p>
                <p className="text-sm font-medium text-gray-800">
                  {linkedDate ? linkedDate.toLocaleString() : "—"}
                </p>
              </div>
            </CardContent>
          </Card>

        </div>
      </SheetContent>
    </Sheet>
  )
}
