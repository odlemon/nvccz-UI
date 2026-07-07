import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { InvestmentsLayout } from "@/components/layout/investments-layout"
import { TradeDetail } from "@/components/investments/trade-detail"

export default function OrdersBlotterDetailPage({ params }: { params: { id: string } }) {
  return (
    <ModuleGuard moduleId="investments" subModuleId="investments-orders-blotter">
      <InvestmentsLayout>
        <div className="p-6">
          <TradeDetail tradeId={params.id} />
        </div>
      </InvestmentsLayout>
    </ModuleGuard>
  )
}
