"use client"

import { FundPerformanceReportingShell } from "@/components/portfolio/fund-performance-reporting/workspace-shell"
import { OverviewDashboard } from "@/components/portfolio/fund-performance-reporting/overview-dashboard"

export default function FundPerformanceReportingOverviewPage() {
  return (
    <FundPerformanceReportingShell
      title="Fund Performance Reporting"
      description="GP operations console for LP report templates, schedules, distribution runs and delivery monitoring"
    >
      <OverviewDashboard />
    </FundPerformanceReportingShell>
  )
}
