import { InvestmentsLayout } from "@/components/investments/investments-layout"
import { TradeDetail } from "@/components/investments/trade-detail"

export default async function TradeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <InvestmentsLayout>
      <div className="p-4 md:p-6">
        <TradeDetail tradeId={id} />
      </div>
    </InvestmentsLayout>
  )
}
