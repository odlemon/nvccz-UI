"use client"

import { FundPerformanceReportingShell } from "@/components/portfolio/fund-performance-reporting/workspace-shell"
import { DistributionListsTable } from "@/components/portfolio/fund-performance-reporting/distribution-lists-table"

export default function FundReportDistributionListsPage() {
  return (
    <FundPerformanceReportingShell
      title="Distribution Lists"
      description="Manage recipient cohorts and role-bound distribution groups"
    >
      <DistributionListsTable />
    </FundPerformanceReportingShell>
  )
}
