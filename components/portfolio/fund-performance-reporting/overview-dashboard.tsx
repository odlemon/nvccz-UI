"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchTemplates, fetchSchedules, fetchDistributionLists, fetchRuns } from "@/lib/store/slices/fundPerformanceReportingSlice"
import { Card } from "@/components/ui/card"
import { RunStatusBadge } from "./status-badges"
import { fmtDate } from "./format"
import { NoFundSelected } from "./no-fund-selected"
import { FileText, CalendarClock, Users, PlayCircle, Activity, ShieldCheck, type LucideIcon } from "lucide-react"

const QUICK_LINKS: { href: string; label: string; description: string; icon: LucideIcon }[] = [
  { href: "/portfolio/fund-performance-reporting/templates", label: "Templates", description: "Manage LP and Board report templates", icon: FileText },
  { href: "/portfolio/fund-performance-reporting/schedules", label: "Schedules", description: "Automate recurring report cadences", icon: CalendarClock },
  { href: "/portfolio/fund-performance-reporting/distribution-lists", label: "Distribution Lists", description: "Manage recipient cohorts and roles", icon: Users },
  { href: "/portfolio/fund-performance-reporting/runs", label: "Runs", description: "Trigger and inspect report runs", icon: PlayCircle },
  { href: "/portfolio/fund-performance-reporting/monitoring", label: "Delivery Monitoring", description: "Track delivery events across recent runs", icon: Activity },
  { href: "/portfolio/fund-performance-reporting/audit", label: "Audit Trail", description: "Review changes to reporting configuration", icon: ShieldCheck },
]

export function OverviewDashboard() {
  const dispatch = useAppDispatch()
  const { selectedFundId, templates, schedules, schedulesError, runs } = useAppSelector((s) => s.fundPerformanceReporting)

  useEffect(() => {
    if (selectedFundId) {
      dispatch(fetchTemplates({ fundId: selectedFundId }))
      dispatch(fetchSchedules(selectedFundId))
      dispatch(fetchDistributionLists(selectedFundId))
      dispatch(fetchRuns({ fundId: selectedFundId, limit: 5 }))
    }
  }, [dispatch, selectedFundId])

  if (!selectedFundId) return <NoFundSelected />

  const activeTemplates = templates.filter((t) => t.isActive).length
  const activeSchedules = schedulesError ? null : schedules.filter((s) => s.isActive).length
  const lastRun = runs[0]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border border-gray-200 shadow-none">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Active Templates</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{activeTemplates}</p>
        </Card>
        <Card className="p-4 border border-gray-200 shadow-none">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Active Schedules</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{activeSchedules === null ? "—" : activeSchedules}</p>
          {schedulesError && <p className="text-[11px] text-amber-600 mt-1">Unavailable — known backend error for this fund</p>}
        </Card>
        <Card className="p-4 border border-gray-200 shadow-none">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Last Run</p>
          {lastRun ? (
            <div className="mt-1.5 flex items-center gap-2">
              <RunStatusBadge status={lastRun.status} />
              <span className="text-xs text-gray-500">{fmtDate(lastRun.createdAt)}</span>
            </div>
          ) : (
            <p className="text-sm text-gray-400 mt-1">No runs yet</p>
          )}
        </Card>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Workspace</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon
            return (
              <Link key={link.href} href={`${link.href}?fundId=${selectedFundId}`}>
                <Card className="p-4 border border-gray-200 shadow-none hover:border-blue-300 hover:shadow-sm transition-all h-full">
                  <Icon className="w-5 h-5 text-blue-600 mb-2" />
                  <p className="text-sm font-semibold text-gray-900">{link.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{link.description}</p>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
