"use client"

import { PerformanceLayout } from "@/components/layout/performance-layout"
import { KpiAnalyticsMockScreen } from "@/components/performance-mock/screens/kpi-analytics-screen"
import { ModuleGuard } from "@/lib/permissions"

export default function KpiAnalyticsPage() {
  return (
    <ModuleGuard moduleId="performance-management" subModuleId="performance-dashboard">
      <PerformanceLayout>
        <KpiAnalyticsMockScreen />
      </PerformanceLayout>
    </ModuleGuard>
  )
}
