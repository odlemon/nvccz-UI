import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { InvestmentsLayout } from "@/components/layout/investments-layout"
import { TradingPageContent } from "@/components/investments/trading-page-content"

export default function OrdersTradingPage() {
  return (
    <ModuleGuard moduleId="investments" subModuleId="investments-orders-trading">
      <InvestmentsLayout>
        <div className="p-6">
          <TradingPageContent />
        </div>
      </InvestmentsLayout>
    </ModuleGuard>
  )
}
