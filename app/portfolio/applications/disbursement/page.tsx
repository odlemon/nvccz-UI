import { PortfolioLayout } from "@/components/layout/portfolio-layout"
import { FundDisbursement } from "@/components/applications/fund-disbursement"
import { ModuleGuard } from "@/components/permissions/PermissionGuards"

export default function DisbursementPage() {
  return (
    <ModuleGuard moduleId="portfolio-management" subModuleId="applications">
      <PortfolioLayout>
        <FundDisbursement />
      </PortfolioLayout>
    </ModuleGuard>
  )
}
