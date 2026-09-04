import { PerformanceLayout } from "@/components/layout/performance-layout"
import { ContractScorecardMockScreen } from "@/components/performance-mock/screens/contract-scorecard-screen"
import { ModuleGuard } from "@/lib/permissions"

export default function BoardScorecardsRoute() {
  return (
    <ModuleGuard moduleId="performance-management" subModuleId="board-scorecards">
      <PerformanceLayout>
        <ContractScorecardMockScreen type="BOARD" />
      </PerformanceLayout>
    </ModuleGuard>
  )
}
