import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { InvestmentsLayout } from "@/components/layout/investments-layout"
import { SecuritiesMaster } from "@/components/investments/securities-master"

export default function SecuritiesPage() {
  return (
    <ModuleGuard moduleId="investments" subModuleId="investments-securities">
      <InvestmentsLayout>
        <div className="p-6">
          <SecuritiesMaster />
        </div>
      </InvestmentsLayout>
    </ModuleGuard>
  )
}
