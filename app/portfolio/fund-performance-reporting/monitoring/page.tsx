"use client"

import { FundPerformanceReportingShell } from "@/components/portfolio/fund-performance-reporting/workspace-shell"
import { DeliveryMonitoringTable } from "@/components/portfolio/fund-performance-reporting/delivery-monitoring-table"

export default function FundReportDeliveryMonitoringPage() {
  return (
    <FundPerformanceReportingShell
      title="Delivery Monitoring"
      description="Track report delivery events across recent runs"
    >
      <DeliveryMonitoringTable />
    </FundPerformanceReportingShell>
  )
}
