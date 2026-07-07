import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { InvestmentsLayout } from "@/components/layout/investments-layout"
import { PricesPage } from "@/components/investments/prices-page"

export default function PortfolioPricesPage() {
  return (
    <ModuleGuard moduleId="investments" subModuleId="investments-portfolios-prices">
      <InvestmentsLayout>
        <PricesPage />
      </InvestmentsLayout>
    </ModuleGuard>
  )
}
