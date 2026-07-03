"use client"

import { FundPerformanceReportingShell } from "@/components/portfolio/fund-performance-reporting/workspace-shell"
import { SchedulesTable } from "@/components/portfolio/fund-performance-reporting/schedules-table"

export default function FundReportSchedulesPage() {
  return (
    <FundPerformanceReportingShell
      title="Report Schedules"
      description="Automate recurring report generation and delivery cadences"
    >
      <SchedulesTable />
    </FundPerformanceReportingShell>
  )
}
