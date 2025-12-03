import { DepartmentManagement } from "@/components/performance/department-management"
import { PerformanceLayout } from "@/components/layout/performance-layout"

export default function DepartmentsPage() {
  return (
    <PerformanceLayout>
      <div className="p-6">
        <DepartmentManagement />
      </div>
    </PerformanceLayout>
  )
}
