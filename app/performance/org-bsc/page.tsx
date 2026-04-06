import { PerformanceLayout } from "@/components/layout/performance-layout"
import { OrgBscPage } from "@/components/performance/org-bsc-page"
import { ModuleGuard } from "@/lib/permissions"

export default function OrgBscRoute() {
  return (
    <ModuleGuard moduleId="performance-management" subModuleId="performance-dashboard">
      <PerformanceLayout>
        <OrgBscPage />
      </PerformanceLayout>
    </ModuleGuard>
  )
}
