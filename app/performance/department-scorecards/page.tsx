import { PerformanceLayout } from "@/components/layout/performance-layout"
import { DepartmentScorecardsPage } from "@/components/performance/department-scorecard-page"
// import { DepartmentScorecardsPage } from "@/components/performance/department-scorecards-page"

export default function DepartmentScorecardsRoute() {
  return (
    <PerformanceLayout>
      <div className="p-6">
        <DepartmentScorecardsPage />
      </div>
    </PerformanceLayout>
  )
}
