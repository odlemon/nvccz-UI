import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { InvestmentsLayout } from "@/components/layout/investments-layout"
import { PositionsTable } from "@/components/investments/positions-table"

export default function PositionsPage() {
  return (
    <ModuleGuard moduleId="investments" subModuleId="investments-portfolios-positions">
      <InvestmentsLayout>
        <PositionsTable />
      </InvestmentsLayout>
    </ModuleGuard>
  )
}
