import { PerformanceLayout } from "@/components/layout/performance-layout"
import { DepartmentScorecardsPage } from "@/components/performance/department-scorecard-page"
import { ModuleGuard } from "@/lib/permissions"
// import { DepartmentScorecardsPage } from "@/components/performance/department-scorecards-page"

export default function DepartmentScorecardsRoute() {
  return (
    <ModuleGuard moduleId="performance-management" subModuleId="department-scorecards">
      <PerformanceLayout>
        <div className="p-6">
          <DepartmentScorecardsPage />
        </div>
      </PerformanceLayout>
    </ModuleGuard>
  )
}
