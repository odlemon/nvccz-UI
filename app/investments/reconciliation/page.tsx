import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { InvestmentsLayout } from "@/components/layout/investments-layout"
import { ComingSoonPanel } from "@/components/investments/terminal/coming-soon-panel"

export default function ReconciliationPage() {
  return (
    <ModuleGuard moduleId="investments" subModuleId="investments-reconciliation">
      <InvestmentsLayout>
        <ComingSoonPanel
          module="Reconciliation"
          description="Cash, holdings, and trade reconciliation workflows"
          plannedItems={[
            "Cash Reconciliation",
            "Holdings Reconciliation",
            "Trade Reconciliation",
            "Exceptions",
          ]}
        />
      </InvestmentsLayout>
    </ModuleGuard>
  )
}
