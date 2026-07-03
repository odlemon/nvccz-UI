import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { InvestmentsLayout } from "@/components/layout/investments-layout"
import { IngestBatches } from "@/components/investments/ingest-batches"

export default function IngestBatchesPage() {
  return (
    <ModuleGuard moduleId="investments" subModuleId="investments-market-data">
      <InvestmentsLayout>
        <div className="p-6">
          <IngestBatches />
        </div>
      </InvestmentsLayout>
    </ModuleGuard>
  )
}
