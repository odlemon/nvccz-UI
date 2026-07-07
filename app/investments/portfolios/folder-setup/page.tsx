import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { InvestmentsLayout } from "@/components/layout/investments-layout"
import { FolderSetup } from "@/components/investments/folder-setup"

export default function FolderSetupPage() {
  return (
    <ModuleGuard moduleId="investments" subModuleId="investments-portfolios-folder-setup">
      <InvestmentsLayout>
        <FolderSetup />
      </InvestmentsLayout>
    </ModuleGuard>
  )
}
