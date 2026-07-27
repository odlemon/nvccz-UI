"use client"

import { PerformanceLayout } from "@/components/layout/performance-layout"
import { CreateTaskMockScreen } from "@/components/performance-mock/screens/create-task-screen"
import { ModuleGuard } from "@/lib/permissions"

export default function CreateTaskPage() {
  return (
    <ModuleGuard moduleId="performance-management" subModuleId="tasks-management">
      <PerformanceLayout>
        <CreateTaskMockScreen />
      </PerformanceLayout>
    </ModuleGuard>
  )
}
