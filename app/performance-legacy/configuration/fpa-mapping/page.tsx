import { PerformanceLayout } from "@/components/layout/performance-layout"
import { FpaMappingScreen } from "@/components/performance/fpa-integration/fpa-mapping-screen"
import { ModuleGuard } from "@/lib/permissions"

export default function FpaMappingPage() {
  return (
    <ModuleGuard moduleId="performance-management" subModuleId="fpa-mapping">
      <PerformanceLayout>
        <FpaMappingScreen />
      </PerformanceLayout>
    </ModuleGuard>
  )
}
