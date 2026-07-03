import { InvestmentsLayout } from "@/components/investments/investments-layout"
import { IngestBatches } from "@/components/investments/ingest-batches"

export default function IngestBatchesPage() {
  return (
    <InvestmentsLayout>
      <div className="p-4 md:p-6">
        <IngestBatches />
      </div>
    </InvestmentsLayout>
  )
}
