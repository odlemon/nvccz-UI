import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { InvestmentsLayout } from "@/components/layout/investments-layout"
import { OrderBook } from "@/components/investments/order-book"

export default function OrdersOrderbookPage() {
  return (
    <ModuleGuard moduleId="investments" subModuleId="investments-orders-orderbook">
      <InvestmentsLayout>
        <div className="p-6">
          <OrderBook />
        </div>
      </InvestmentsLayout>
    </ModuleGuard>
  )
}
