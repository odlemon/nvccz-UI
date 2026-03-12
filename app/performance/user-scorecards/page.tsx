import { PerformanceLayout } from "@/components/layout/performance-layout"
import { UserScorecardsPage } from "@/components/performance/user-scorecard-page"
import { ModuleGuard } from "@/lib/permissions"
// import { UserScorecardsPage } from "@/components/performance/user-scorecards-page"

export default function UserScorecardsRoute() {
  return (
    <ModuleGuard moduleId="performance-management" subModuleId="user-scorecards">
      <PerformanceLayout>
        <div className="p-6">
          <UserScorecardsPage />
        </div>
      </PerformanceLayout>
    </ModuleGuard>
  )
}
