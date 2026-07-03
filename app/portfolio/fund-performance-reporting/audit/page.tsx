"use client"

import { FundPerformanceReportingShell } from "@/components/portfolio/fund-performance-reporting/workspace-shell"
import { AuditTrailTable } from "@/components/portfolio/fund-performance-reporting/audit-trail-table"

export default function FundReportAuditTrailPage() {
  return (
    <FundPerformanceReportingShell
      title="Audit Trail"
      description="Review changes made to reporting configuration entities"
    >
      <AuditTrailTable />
    </FundPerformanceReportingShell>
  )
}
