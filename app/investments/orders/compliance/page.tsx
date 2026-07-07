import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { InvestmentsLayout } from "@/components/layout/investments-layout"
import { ComplianceChecks } from "@/components/investments/compliance-checks"

export default function OrdersCompliancePage() {
  return (
    <ModuleGuard moduleId="investments" subModuleId="investments-orders-compliance">
      <InvestmentsLayout>
        <div className="p-6">
          <ComplianceChecks />
        </div>
      </InvestmentsLayout>
    </ModuleGuard>
  )
}
