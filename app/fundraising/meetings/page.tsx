import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FundraisingComingSoon } from "@/components/fundraising/fundraising-coming-soon"

export default function Page() {
  return (
    <ModuleGuard moduleId="fundraising" subModuleId="fr-meetings">
      <FundraisingComingSoon
        title="Meetings & Tasks"
        description="Schedule meetings, assign actions and track overdue follow-ups."
      />
    </ModuleGuard>
  )
}
