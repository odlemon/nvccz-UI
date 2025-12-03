import { PerformanceLayout } from "@/components/layout/performance-layout"
import { TaskManagement } from "@/components/performance/task-management"

export default function TasksPage() {
  return (
    <PerformanceLayout>
      <div className="p-6">
        <TaskManagement />
      </div>
    </PerformanceLayout>
  )
}