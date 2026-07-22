import { PerformanceLayout } from "@/components/layout/performance-layout"
import { ReportsMockScreen } from "@/components/performance-mock/screens/reports-screen"
import { ModuleGuard } from "@/lib/permissions"

export default function ReportsPage() {
  return (
    <ModuleGuard moduleId="performance-management" subModuleId="reports">
      <PerformanceLayout>
        <ReportsMockScreen />
      </PerformanceLayout>
    </ModuleGuard>
  )
}
