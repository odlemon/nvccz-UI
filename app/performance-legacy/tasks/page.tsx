import { Suspense } from "react"
import { PerformanceLayout } from "@/components/layout/performance-layout"
import { TasksMockScreen } from "@/components/performance-mock/screens/tasks-screen"
import { ModuleGuard } from "@/lib/permissions"

export default function TasksPage() {
  return (
    <ModuleGuard moduleId="performance-management" subModuleId="tasks-management">
      <PerformanceLayout>
        <Suspense fallback={<div className="p-6 text-sm text-[#6B7280]">Loading tasks…</div>}>
          <TasksMockScreen />
        </Suspense>
      </PerformanceLayout>
    </ModuleGuard>
  )
}
