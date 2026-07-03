"use client"

import { FundPerformanceReportingShell } from "@/components/portfolio/fund-performance-reporting/workspace-shell"
import { RunsTable } from "@/components/portfolio/fund-performance-reporting/runs-table"

export default function FundReportRunsPage() {
  return (
    <FundPerformanceReportingShell
      title="Report Runs"
      description="Trigger manual runs and inspect run history"
    >
      <RunsTable />
    </FundPerformanceReportingShell>
  )
}
