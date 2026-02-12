import { PerformanceLayout } from "@/components/layout/performance-layout"
import { PerformanceDashboardV2 } from "@/components/performance/perfomance-dashboard-v2"
import { PerformanceDashboard } from "@/components/performance/performance-dashboard"

export default function PerformancePage() {
  return (
    <PerformanceLayout>
      <div className="p-6">
        <PerformanceDashboardV2 />
      </div>
    </PerformanceLayout>
  )
}
