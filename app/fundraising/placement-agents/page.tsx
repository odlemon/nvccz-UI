import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FundraisingComingSoon } from "@/components/fundraising/fundraising-coming-soon"

export default function Page() {
  return (
    <ModuleGuard moduleId="fundraising" subModuleId="fr-placement-agents">
      <FundraisingComingSoon
        title="Placement Agents"
        description="Agent appointments, geography and commission-eligible opportunities."
      />
    </ModuleGuard>
  )
}
