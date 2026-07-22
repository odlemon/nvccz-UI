import { PerformanceLayout } from "@/components/layout/performance-layout"
import { OrgBscMockScreen } from "@/components/performance-mock/screens/org-bsc-screen"
import { ModuleGuard } from "@/lib/permissions"

export default function OrgBscRoute() {
  return (
    <ModuleGuard moduleId="performance-management" subModuleId="org-bsc">
      <PerformanceLayout>
        <OrgBscMockScreen />
      </PerformanceLayout>
    </ModuleGuard>
  )
}
