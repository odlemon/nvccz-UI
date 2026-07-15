import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FundraisingCommunications } from "@/components/fundraising/fundraising-communications"

export default function Page() {
  return (
    <ModuleGuard moduleId="fundraising" subModuleId="fr-communications">
      <FundraisingCommunications />
    </ModuleGuard>
  )
}
