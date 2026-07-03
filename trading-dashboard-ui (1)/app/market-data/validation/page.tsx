import { InvestmentsLayout } from "@/components/investments/investments-layout"
import { ValidationQueue } from "@/components/investments/validation-queue"

export default function ValidationQueuePage() {
  return (
    <InvestmentsLayout>
      <div className="p-4 md:p-6">
        <ValidationQueue />
      </div>
    </InvestmentsLayout>
  )
}
