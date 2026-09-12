import { PerformanceLayout } from "@/components/layout/performance-layout"
import { ReviewsMockScreen } from "@/components/performance-mock/screens/reviews-screen"
import { ModuleGuard } from "@/lib/permissions"

export default function CyclesPage() {
  return (
    <ModuleGuard moduleId="performance-management" subModuleId="performance-reviews">
      <PerformanceLayout>
        <ReviewsMockScreen />
      </PerformanceLayout>
    </ModuleGuard>
  )
}
