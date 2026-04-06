import { PerformanceLayout } from "@/components/layout/performance-layout"
import { ContractScorecardPage } from "@/components/performance/contract-scorecard-page"
import { ModuleGuard } from "@/lib/permissions"

export default function BoardScorecardsRoute() {
  return (
    <ModuleGuard moduleId="performance-management" subModuleId="performance-dashboard">
      <PerformanceLayout>
        <ContractScorecardPage type="BOARD" />
      </PerformanceLayout>
    </ModuleGuard>
  )
}
