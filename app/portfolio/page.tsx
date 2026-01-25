import { PortfolioLayout } from "@/components/layout/portfolio-layout"
import { PortfolioDashboardV2 } from "@/components/portfolio/portfolio-dashbord-v2"
import { ModuleGuard } from "@/components/permissions/PermissionGuards"

export default function PortfolioPage() {
  return (
    <ModuleGuard moduleId="portfolio-management" subModuleId="Dashboard">
      <PortfolioLayout>
        <PortfolioDashboardV2 />
      </PortfolioLayout>
    </ModuleGuard>
  )
}
