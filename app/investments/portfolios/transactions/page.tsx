import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { InvestmentsLayout } from "@/components/layout/investments-layout"
import { PortfolioTransactions } from "@/components/investments/portfolio-transactions"

export default function PortfolioTransactionsPage() {
  return (
    <ModuleGuard moduleId="investments" subModuleId="investments-portfolios-transactions">
      <InvestmentsLayout>
        <PortfolioTransactions />
      </InvestmentsLayout>
    </ModuleGuard>
  )
}
