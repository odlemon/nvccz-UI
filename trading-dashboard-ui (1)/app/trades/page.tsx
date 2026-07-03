import { InvestmentsLayout } from "@/components/investments/investments-layout"
import { TradeBlotter } from "@/components/investments/trade-blotter"

export default function TradesPage() {
  return (
    <InvestmentsLayout>
      <div className="p-4 md:p-6">
        <TradeBlotter />
      </div>
    </InvestmentsLayout>
  )
}
