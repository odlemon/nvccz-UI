import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FundraisingComingSoon } from "@/components/fundraising/fundraising-coming-soon"

export default function Page() {
  return (
    <ModuleGuard moduleId="fundraising" subModuleId="fr-approvals">
      <FundraisingComingSoon
        title="Approvals"
        description="Commercial concessions, side letters and stage override approvals."
      />
    </ModuleGuard>
  )
}
