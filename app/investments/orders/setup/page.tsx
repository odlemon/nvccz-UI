import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { InvestmentsLayout } from "@/components/layout/investments-layout"
import { RoutingConfig } from "@/components/investments/routing-config"

export default function OrdersSetupPage() {
  return (
    <ModuleGuard moduleId="investments" subModuleId="investments-orders-setup">
      <InvestmentsLayout>
        <div className="p-6">
          <RoutingConfig />
        </div>
      </InvestmentsLayout>
    </ModuleGuard>
  )
}
