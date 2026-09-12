import { PerformanceLayout } from "@/components/layout/performance-layout"
import { DepartmentsMockScreen } from "@/components/performance-mock/screens/departments-screen"
import { ModuleGuard } from "@/lib/permissions"

export default function DepartmentsPage() {
  return (
    <ModuleGuard moduleId="performance-management" subModuleId="departments-management">
      <PerformanceLayout>
        <DepartmentsMockScreen />
      </PerformanceLayout>
    </ModuleGuard>
  )
}
