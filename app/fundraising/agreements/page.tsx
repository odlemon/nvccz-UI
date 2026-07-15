import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FundraisingAgreements } from "@/components/fundraising/fundraising-agreements"

export default function Page() {
  return (
    <ModuleGuard moduleId="fundraising" subModuleId="fr-agreements">
      <FundraisingAgreements />
    </ModuleGuard>
  )
}
