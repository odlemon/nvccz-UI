import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { InvestmentsLayout } from "@/components/layout/investments-layout"
import { TradeBlotter } from "@/components/investments/trade-blotter"

export default function OrdersBlotterPage() {
  return (
    <ModuleGuard moduleId="investments" subModuleId="investments-orders-blotter">
      <InvestmentsLayout>
        <div className="p-6">
          <TradeBlotter />
        </div>
      </InvestmentsLayout>
    </ModuleGuard>
  )
}
