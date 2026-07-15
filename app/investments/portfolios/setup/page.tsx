import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { InvestmentsLayout } from "@/components/layout/investments-layout"
import { PortfolioSetup } from "@/components/investments/portfolio-setup"

export default function PortfolioSetupPage() {
  return (
    <ModuleGuard moduleId="investments" subModuleId="investments-portfolios-setup">
      <InvestmentsLayout>
        <PortfolioSetup />
      </InvestmentsLayout>
    </ModuleGuard>
  )
}
