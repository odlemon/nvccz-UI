import { PerformanceLayout } from "@/components/layout/performance-layout"
import { ContractScorecardMockScreen } from "@/components/performance-mock/screens/contract-scorecard-screen"
import { ModuleGuard } from "@/lib/permissions"

export default function CeoScorecardsRoute() {
  return (
    <ModuleGuard moduleId="performance-management" subModuleId="ceo-scorecards">
      <PerformanceLayout>
        <ContractScorecardMockScreen type="CEO" />
      </PerformanceLayout>
    </ModuleGuard>
  )
}
