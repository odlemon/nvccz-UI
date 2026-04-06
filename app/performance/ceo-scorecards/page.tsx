import { PerformanceLayout } from "@/components/layout/performance-layout"
import { ContractScorecardPage } from "@/components/performance/contract-scorecard-page"
import { ModuleGuard } from "@/lib/permissions"

export default function CeoScorecardsRoute() {
  return (
    <ModuleGuard moduleId="performance-management" subModuleId="performance-dashboard">
      <PerformanceLayout>
        <ContractScorecardPage type="CEO" />
      </PerformanceLayout>
    </ModuleGuard>
  )
}
