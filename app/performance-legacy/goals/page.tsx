import { PerformanceLayout } from "@/components/layout/performance-layout"
import { GoalsMockScreen } from "@/components/performance-mock/screens/goals-screen"
import { ModuleGuard } from "@/lib/permissions"

export default function GoalsPage() {
  return (
    <ModuleGuard moduleId="performance-management" subModuleId="goals-management">
      <PerformanceLayout>
        <GoalsMockScreen />
      </PerformanceLayout>
    </ModuleGuard>
  )
}
