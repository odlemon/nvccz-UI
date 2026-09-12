import { PerformanceLayout } from "@/components/layout/performance-layout"
import { CalibrationMockScreen } from "@/components/performance-mock/screens/calibration-screen"
import { ModuleGuard } from "@/lib/permissions"

export default function CalibrationPage() {
  return (
    <ModuleGuard moduleId="performance-management" subModuleId="calibration">
      <PerformanceLayout>
        <CalibrationMockScreen />
      </PerformanceLayout>
    </ModuleGuard>
  )
}
