import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FundraisingMeetings } from "@/components/fundraising/fundraising-meetings"

export default function Page() {
  return (
    <ModuleGuard moduleId="fundraising" subModuleId="fr-meetings">
      <FundraisingMeetings />
    </ModuleGuard>
  )
}
