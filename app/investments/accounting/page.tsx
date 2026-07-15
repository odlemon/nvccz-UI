import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { InvestmentsLayout } from "@/components/layout/investments-layout"
import { ComingSoonPanel } from "@/components/investments/terminal/coming-soon-panel"

export default function AccountingPage() {
  return (
    <ModuleGuard moduleId="investments" subModuleId="investments-accounting">
      <InvestmentsLayout>
        <ComingSoonPanel
          module="Accounting"
          description="Accounting events and GL journal integration"
          plannedItems={[
            "Events",
            "Journals",
          ]}
        />
      </InvestmentsLayout>
    </ModuleGuard>
  )
}
