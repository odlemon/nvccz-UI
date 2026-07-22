import { PerformanceLayout } from "@/components/layout/performance-layout"
import { CheckInsListMockScreen } from "@/components/performance-mock/screens/check-ins-list-screen"
import { ModuleGuard } from "@/lib/permissions"

export default function CheckInsPage() {
  return (
    <ModuleGuard moduleId="performance-management" subModuleId="check-ins">
      <PerformanceLayout>
        <CheckInsListMockScreen />
      </PerformanceLayout>
    </ModuleGuard>
  )
}
