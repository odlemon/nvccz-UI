import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { InvestmentsLayout } from "@/components/layout/investments-layout"
import { ValidationQueue } from "@/components/investments/validation-queue"

export default function ValidationQueuePage() {
  return (
    <ModuleGuard moduleId="investments" subModuleId="investments-market-data">
      <InvestmentsLayout>
        <div className="p-6">
          <ValidationQueue />
        </div>
      </InvestmentsLayout>
    </ModuleGuard>
  )
}
