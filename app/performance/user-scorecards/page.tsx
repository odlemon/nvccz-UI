import { PerformanceLayout } from "@/components/layout/performance-layout"
import { UserScorecardsPage } from "@/components/performance/user-scorecard-page"
// import { UserScorecardsPage } from "@/components/performance/user-scorecards-page"

export default function UserScorecardsRoute() {
  return (
    <PerformanceLayout>
      <div className="p-6">
        <UserScorecardsPage />
      </div>
    </PerformanceLayout>
  )
}
