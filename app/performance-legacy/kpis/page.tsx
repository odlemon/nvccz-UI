import { PerformanceLayout } from "@/components/layout/performance-layout"
import { KpiManagementMockScreen } from "@/components/performance-mock/screens/kpi-management-screen"
import { ModuleGuard } from "@/lib/permissions"

export default function KPIsPage() {
  return (
    <ModuleGuard moduleId="performance-management" subModuleId="kpi-management">
      <PerformanceLayout>
        <KpiManagementMockScreen />
      </PerformanceLayout>
    </ModuleGuard>
  )
}
