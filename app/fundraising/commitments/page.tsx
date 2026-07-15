import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FundraisingCommitments } from "@/components/fundraising/fundraising-commitments"

export default function Page() {
  return (
    <ModuleGuard moduleId="fundraising" subModuleId="fr-commitments">
      <FundraisingCommitments />
    </ModuleGuard>
  )
}
