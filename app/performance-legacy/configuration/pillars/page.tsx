import { PerformanceLayout } from "@/components/layout/performance-layout"
import { PillarsMockScreen } from "@/components/performance-mock/screens/pillars-screen"
import { ModuleGuard } from "@/lib/permissions"

export default function ConfigPillarsPage() {
  return (
    <ModuleGuard moduleId="performance-management" subModuleId="config-pillars">
      <PerformanceLayout>
        <PillarsMockScreen />
      </PerformanceLayout>
    </ModuleGuard>
  )
}
