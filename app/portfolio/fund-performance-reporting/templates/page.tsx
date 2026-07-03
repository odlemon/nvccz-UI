"use client"

import { FundPerformanceReportingShell } from "@/components/portfolio/fund-performance-reporting/workspace-shell"
import { TemplatesTable } from "@/components/portfolio/fund-performance-reporting/templates-table"

export default function FundReportTemplatesPage() {
  return (
    <FundPerformanceReportingShell
      title="Report Templates"
      description="Define reusable Investor and Board report layouts"
    >
      <TemplatesTable />
    </FundPerformanceReportingShell>
  )
}
