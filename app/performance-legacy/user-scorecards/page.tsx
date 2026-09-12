import { PerformanceLayout } from "@/components/layout/performance-layout"
import { EmployeeScorecardMockScreen } from "@/components/performance-mock/screens/employee-scorecard-screen"
import { ModuleGuard } from "@/lib/permissions"

export default function UserScorecardsRoute() {
  return (
    <ModuleGuard moduleId="performance-management" subModuleId="user-scorecards">
      <PerformanceLayout>
        <EmployeeScorecardMockScreen />
      </PerformanceLayout>
    </ModuleGuard>
  )
}
