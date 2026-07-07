import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { InvestmentsLayout } from "@/components/layout/investments-layout"
import { ComingSoonPanel } from "@/components/investments/terminal/coming-soon-panel"

export default function InvestmentsSetupPage() {
  return (
    <ModuleGuard moduleId="investments" subModuleId="investments-setup">
      <InvestmentsLayout>
        <ComingSoonPanel
          module="Setup"
          description="Module-wide Investments configuration"
          plannedItems={[
            "Users & Roles",
            "Notification Rules",
            "Module Preferences",
          ]}
        />
      </InvestmentsLayout>
    </ModuleGuard>
  )
}
