import { PerformanceLayout } from "@/components/layout/performance-layout"
import { DashboardMockScreen } from "@/components/performance-mock/screens/dashboard-screen"
import { ModuleGuard } from "@/lib/permissions"

export default function PerformancePage() {
  return (
    <ModuleGuard moduleId="performance-management" subModuleId="performance-dashboard">
      <PerformanceLayout>
        <DashboardMockScreen />
      </PerformanceLayout>
    </ModuleGuard>
  )
}
