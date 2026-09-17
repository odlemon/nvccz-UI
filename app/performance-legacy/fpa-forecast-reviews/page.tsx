import { PerformanceLayout } from "@/components/layout/performance-layout"
import { FpaForecastReviewQueueScreen } from "@/components/performance/fpa-integration/fpa-forecast-review-queue-screen"
import { ModuleGuard } from "@/lib/permissions"

export default function FpaForecastReviewsPage() {
  return (
    <ModuleGuard moduleId="performance-management" subModuleId="fpa-forecast-reviews">
      <PerformanceLayout>
        <FpaForecastReviewQueueScreen />
      </PerformanceLayout>
    </ModuleGuard>
  )
}
