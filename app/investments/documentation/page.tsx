import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { InvestmentsLayout } from "@/components/layout/investments-layout"
import { ComingSoonPanel } from "@/components/investments/terminal/coming-soon-panel"

export default function DocumentationPage() {
  return (
    <ModuleGuard moduleId="investments" subModuleId="investments-documentation">
      <InvestmentsLayout>
        <ComingSoonPanel
          module="Documentation"
          description="Document register and upload workflows"
          plannedItems={[
            "Document Register",
            "Upload",
          ]}
        />
      </InvestmentsLayout>
    </ModuleGuard>
  )
}
