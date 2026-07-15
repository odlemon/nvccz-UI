import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { InvestmentsLayout } from "@/components/layout/investments-layout"
import { SecuritiesMaster } from "@/components/investments/securities-master"

export default function InstrumentsPage() {
  return (
    <ModuleGuard moduleId="investments" subModuleId="investments-portfolios-instruments">
      <InvestmentsLayout>
        <SecuritiesMaster />
      </InvestmentsLayout>
    </ModuleGuard>
  )
}
