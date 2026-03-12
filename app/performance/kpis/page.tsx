import { PerformanceLayout } from "@/components/layout/performance-layout"
import { KPIManagement } from "@/components/performance/kpi-management"
import { ModuleGuard } from "@/lib/permissions"

export default function KPIsPage() {
  return (
    <ModuleGuard moduleId="performance-management" subModuleId="kpi-management">
      <PerformanceLayout>
        <div className="p-6">
          <KPIManagement />
        </div>
      </PerformanceLayout>
    </ModuleGuard>
  )
}
