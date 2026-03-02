import { PortfolioLayout } from "@/components/layout/portfolio-layout"
import { BoardReview } from "@/components/applications/board-review"
import { ModuleGuard } from "@/components/permissions/PermissionGuards"

export default function BoardReviewPage() {
  return (
    <ModuleGuard moduleId="portfolio-management" subModuleId="applications">
      <PortfolioLayout>
        <BoardReview />
      </PortfolioLayout>
    </ModuleGuard>
  )
}
