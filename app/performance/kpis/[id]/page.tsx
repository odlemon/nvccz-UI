"use client"

import { useParams } from "next/navigation"
import { PerformanceLayout } from "@/components/layout/performance-layout"
import { KpiDetailMockScreen } from "@/components/performance-mock/screens/kpi-detail-screen"
import { ModuleGuard } from "@/lib/permissions"

export default function KpiDetailPage() {
  const params = useParams()
  const kpiId = params.id as string

  return (
    <ModuleGuard moduleId="performance-management" subModuleId="kpi-management">
      <PerformanceLayout>
        <KpiDetailMockScreen kpiId={kpiId} />
      </PerformanceLayout>
    </ModuleGuard>
  )
}
