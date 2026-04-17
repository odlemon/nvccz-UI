import { PerformanceLayout } from "@/components/layout/performance-layout"
import { PerformanceDashboardV2 } from "@/components/performance/perfomance-dashboard-v2"
import { ModuleGuard } from "@/lib/permissions"

export default function PerformancePage() {
  return (
    <ModuleGuard moduleId="performance-management" subModuleId="performance-dashboard">
      <PerformanceLayout>
        <div className="p-6 space-y-6">
          <PerformanceDashboardV2 />
        </div>
      </PerformanceLayout>
    </ModuleGuard>
  )
}
