import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { InvestmentsLayout } from "@/components/layout/investments-layout"
import { OrderSimulation } from "@/components/investments/order-simulation"

export default function OrdersSimulationPage() {
  return (
    <ModuleGuard moduleId="investments" subModuleId="investments-orders-simulation">
      <InvestmentsLayout>
        <div className="p-6">
          <OrderSimulation />
        </div>
      </InvestmentsLayout>
    </ModuleGuard>
  )
}
