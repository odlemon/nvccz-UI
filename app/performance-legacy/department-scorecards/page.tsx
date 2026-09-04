import { PerformanceLayout } from "@/components/layout/performance-layout"
import { DepartmentScorecardMockScreen } from "@/components/performance-mock/screens/department-scorecard-screen"
import { ModuleGuard } from "@/lib/permissions"

export default function DepartmentScorecardsRoute() {
  return (
    <ModuleGuard moduleId="performance-management" subModuleId="department-scorecards">
      <PerformanceLayout>
        <DepartmentScorecardMockScreen />
      </PerformanceLayout>
    </ModuleGuard>
  )
}
