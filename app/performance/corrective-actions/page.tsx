import { PerformanceLayout } from "@/components/layout/performance-layout"
import { CorrectiveActionsMockScreen } from "@/components/performance-mock/screens/corrective-actions-screen"
import { ModuleGuard } from "@/lib/permissions"

export default function CorrectiveActionsPage() {
  return (
    <ModuleGuard moduleId="performance-management" subModuleId="corrective-actions">
      <PerformanceLayout>
        <CorrectiveActionsMockScreen />
      </PerformanceLayout>
    </ModuleGuard>
  )
}
