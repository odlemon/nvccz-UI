import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FundraisingComingSoon } from "@/components/fundraising/fundraising-coming-soon"

export default function Page() {
  return (
    <ModuleGuard moduleId="fundraising" subModuleId="fr-communications">
      <FundraisingComingSoon
        title="Communications"
        description="Calls, meetings, emails and interaction logging."
      />
    </ModuleGuard>
  )
}
