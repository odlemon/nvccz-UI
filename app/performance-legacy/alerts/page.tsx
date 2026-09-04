import { PerformanceLayout } from "@/components/layout/performance-layout"
import { AlertsMockScreen } from "@/components/performance-mock/screens/alerts-screen"
import { ModuleGuard } from "@/lib/permissions"

export default function AlertsPage() {
  return (
    <ModuleGuard moduleId="performance-management" subModuleId="alerts">
      <PerformanceLayout>
        <AlertsMockScreen />
      </PerformanceLayout>
    </ModuleGuard>
  )
}
