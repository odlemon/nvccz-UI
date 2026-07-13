import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FundraisingMandates } from "@/components/fundraising/fundraising-mandates"

export default function Page() {
  return (
    <ModuleGuard moduleId="fundraising" subModuleId="fr-mandates">
      <FundraisingMandates />
    </ModuleGuard>
  )
}
