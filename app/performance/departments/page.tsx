import { DepartmentManagement } from "@/components/performance/department-management"
import { PerformanceLayout } from "@/components/layout/performance-layout"
import { ModuleGuard } from "@/lib/permissions"

export default function DepartmentsPage() {
  return (
    <ModuleGuard moduleId="performance-management" subModuleId="departments-management">
      <PerformanceLayout>
        <div className="p-6">
          <DepartmentManagement />
        </div>
      </PerformanceLayout>
    </ModuleGuard>
  )
}
