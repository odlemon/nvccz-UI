import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FundraisingComingSoon } from "@/components/fundraising/fundraising-coming-soon"

export default function Page() {
  return (
    <ModuleGuard moduleId="fundraising" subModuleId="fr-audit">
      <FundraisingComingSoon
        title="Audit Logs"
        description="Immutable object-level audit trail for material actions."
      />
    </ModuleGuard>
  )
}
