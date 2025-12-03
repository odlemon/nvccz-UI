import { PerformanceLayout } from "@/components/layout/performance-layout"
import { KPIManagement } from "@/components/performance/kpi-management"

export default function KPIsPage() {
  return (
    <PerformanceLayout>
      <div className="p-6">
        <KPIManagement />
      </div>
    </PerformanceLayout>
  )
}
