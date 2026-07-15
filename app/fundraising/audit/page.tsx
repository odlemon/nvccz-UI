import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FundraisingAudit } from "@/components/fundraising/fundraising-audit"

export default function Page() {
  return (
    <ModuleGuard moduleId="fundraising" subModuleId="fr-audit">
      <FundraisingAudit />
    </ModuleGuard>
  )
}
