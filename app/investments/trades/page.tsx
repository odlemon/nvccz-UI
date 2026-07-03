import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { InvestmentsLayout } from "@/components/layout/investments-layout"
import { TradeBlotter } from "@/components/investments/trade-blotter"

export default function TradesPage() {
  return (
    <ModuleGuard moduleId="investments" subModuleId="investments-trades">
      <InvestmentsLayout>
        <div className="p-6">
          <TradeBlotter />
        </div>
      </InvestmentsLayout>
    </ModuleGuard>
  )
}
