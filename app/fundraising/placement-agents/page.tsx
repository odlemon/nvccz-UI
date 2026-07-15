import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FundraisingPlacementAgents } from "@/components/fundraising/fundraising-placement-agents"

export default function Page() {
  return (
    <ModuleGuard moduleId="fundraising" subModuleId="fr-placement-agents">
      <FundraisingPlacementAgents />
    </ModuleGuard>
  )
}
