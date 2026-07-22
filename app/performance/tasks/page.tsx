import { PerformanceLayout } from "@/components/layout/performance-layout"
import { TasksMockScreen } from "@/components/performance-mock/screens/tasks-screen"
import { ModuleGuard } from "@/lib/permissions"

export default function TasksPage() {
  return (
    <ModuleGuard moduleId="performance-management" subModuleId="tasks-management">
      <PerformanceLayout>
        <TasksMockScreen />
      </PerformanceLayout>
    </ModuleGuard>
  )
}
