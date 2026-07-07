import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { InvestmentsLayout } from "@/components/layout/investments-layout"
import { PortfoliosOverview } from "@/components/investments/portfolios-overview"

export default function PortfoliosOverviewPage() {
  return (
    <ModuleGuard moduleId="investments" subModuleId="investments-portfolios-overview">
      <InvestmentsLayout>
        <PortfoliosOverview />
      </InvestmentsLayout>
    </ModuleGuard>
  )
}
