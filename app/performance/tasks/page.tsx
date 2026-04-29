"use client"

import { PerformanceLayout } from "@/components/layout/performance-layout"
import { TaskManagement } from "@/components/performance/task-management"
import { ModuleGuard } from "@/lib/permissions"

export default function TasksPage() {
  return (
    <ModuleGuard moduleId="performance-management" subModuleId="tasks-management">
      <PerformanceLayout>
        <div className="p-6">
          <TaskManagement />
        </div>
      </PerformanceLayout>
    </ModuleGuard>
  )
}
