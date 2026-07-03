"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Landmark } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchLpDashboard } from "@/lib/store/slices/lpPortalSlice"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { FundMetricsGrid } from "./fund-metrics-grid"
import { LpFxWidgetCard } from "./fx-widget-card"
import { cn } from "@/lib/utils"

const CURRENCIES: Array<"USD" | "ZIG"> = ["USD", "ZIG"]

export function LpDashboard() {
  const dispatch = useAppDispatch()
  const { dashboard, dashboardLoading, dashboardError } = useAppSelector((s) => s.lpPortal)
  const [currency, setCurrency] = useState<"USD" | "ZIG">("USD")

  useEffect(() => {
    dispatch(fetchLpDashboard({ presentationCurrency: currency }))
  }, [dispatch, currency])

  if (dashboardLoading && !dashboard) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (dashboardError && !dashboard) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-10 text-center space-y-3">
            <p className="text-sm text-muted-foreground">{dashboardError}</p>
            <Button variant="outline" onClick={() => dispatch(fetchLpDashboard({ presentationCurrency: currency }))}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!dashboard) return null

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center shrink-0">
            <Landmark className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{dashboard.client?.legalName ?? "Your Account"}</h1>
            <p className="text-sm text-muted-foreground">
              Investor ID: <span className="font-mono">{dashboard.client?.investorId ?? "—"}</span>
              {dashboard.client?.email ? ` · ${dashboard.client.email}` : ""}
            </p>
          </div>
        </div>

        {/* Presentation currency toggle */}
        <div className="inline-flex items-center rounded-full border border-gray-200 bg-white p-1">
          {CURRENCIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCurrency(c)}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-full transition-colors",
                currency === c ? "bg-teal-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Fund summaries */}
        <div className="lg:col-span-2 space-y-4">
          {dashboard.funds && dashboard.funds.length > 0 ? (
            dashboard.funds.map((fund) => (
              <Card key={fund.fundId} className="border-gray-200 shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-gray-900">{fund.fundName}</CardTitle>
                </CardHeader>
                <CardContent>
                  <FundMetricsGrid
                    metrics={{
                      commitment: fund.commitment,
                      paidIn: fund.paidIn,
                      distributions: fund.distributions,
                      nav: fund.nav,
                      dpi: fund.dpi,
                      tvpi: fund.tvpi,
                      rvpi: fund.rvpi,
                      netIrr: fund.netIrr,
                      currencyCode: fund.currencyCode,
                    }}
                  />
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-gray-200 shadow-none">
              <CardContent className="py-12 text-center">
                <p className="text-sm text-muted-foreground">No fund commitments yet.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar: FX widget + latest reports */}
        <div className="space-y-4">
          <LpFxWidgetCard widget={dashboard.exchangeRateWidget} />

          <Card className="border-gray-200 shadow-none">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-semibold text-gray-800">Latest Reports</CardTitle>
              <Link href="/lp-portal/reports" className="text-xs text-teal-700 hover:underline flex items-center gap-0.5">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {dashboard.latestReports && dashboard.latestReports.length > 0 ? (
                dashboard.latestReports.map((report) => (
                  <div key={report.jobId} className="flex items-center justify-between gap-2 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{report.fundName}</p>
                      <p className="text-xs text-muted-foreground">Period ended {report.periodEnd}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0">{report.reportLevel}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">No reports delivered yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
