"use client"

import { useParams } from "next/navigation"
import { PerformanceLayout } from "@/components/layout/performance-layout"
import { TaskDetailMockScreen } from "@/components/performance-mock/screens/task-detail-screen"
import { ModuleGuard } from "@/lib/permissions"

export default function TaskDetailPage() {
  const params = useParams()
  const taskId = params.id as string

  return (
    <ModuleGuard moduleId="performance-management" subModuleId="tasks-management">
      <PerformanceLayout>
        <TaskDetailMockScreen taskId={taskId} />
      </PerformanceLayout>
    </ModuleGuard>
  )
}
