import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { InvestmentsLayout } from "@/components/layout/investments-layout"
import { UnifiedTerminal } from "@/components/investments/unified-terminal"

export default function TerminalPage() {
  return (
    <ModuleGuard moduleId="investments" subModuleId="investments-terminal">
      <InvestmentsLayout>
        <UnifiedTerminal />
      </InvestmentsLayout>
    </ModuleGuard>
  )
}
