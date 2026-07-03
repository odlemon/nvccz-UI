import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { InvestmentsLayout } from "@/components/layout/investments-layout"
import { RoutingConfig } from "@/components/investments/routing-config"

export default function RoutingConfigPage() {
  return (
    <ModuleGuard moduleId="investments" subModuleId="investments-routing">
      <InvestmentsLayout>
        <div className="p-6">
          <RoutingConfig />
        </div>
      </InvestmentsLayout>
    </ModuleGuard>
  )
}
