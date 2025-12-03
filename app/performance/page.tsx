import { PerformanceLayout } from "@/components/layout/performance-layout"
import { PerformanceDashboard } from "@/components/performance/performance-dashboard"

export default function PerformancePage() {
  return (
    <PerformanceLayout>
      <div className="p-6">
        <PerformanceDashboard />
      </div>
    </PerformanceLayout>
  )
}
