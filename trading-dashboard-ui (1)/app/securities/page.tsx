import { InvestmentsLayout } from "@/components/investments/investments-layout"
import { SecuritiesMaster } from "@/components/investments/securities-master"

export default function SecuritiesPage() {
  return (
    <InvestmentsLayout>
      <div className="p-4 md:p-6">
        <SecuritiesMaster />
      </div>
    </InvestmentsLayout>
  )
}
