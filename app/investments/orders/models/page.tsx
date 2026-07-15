import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { InvestmentsLayout } from "@/components/layout/investments-layout"
import { TradingModels } from "@/components/investments/trading-models"

export default function OrdersModelsPage() {
  return (
    <ModuleGuard moduleId="investments" subModuleId="investments-orders-models">
      <InvestmentsLayout>
        <div className="p-6">
          <TradingModels />
        </div>
      </InvestmentsLayout>
    </ModuleGuard>
  )
}
