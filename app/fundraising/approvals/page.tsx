import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FundraisingApprovals } from "@/components/fundraising/fundraising-approvals"

export default function Page() {
  return (
    <ModuleGuard moduleId="fundraising" subModuleId="fr-approvals">
      <FundraisingApprovals />
    </ModuleGuard>
  )
}
