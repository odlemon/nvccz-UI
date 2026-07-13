import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FundraisingComingSoon } from "@/components/fundraising/fundraising-coming-soon"

export default function Page() {
  return (
    <ModuleGuard moduleId="fundraising" subModuleId="fr-data-rooms">
      <FundraisingComingSoon
        title="Data Rooms"
        description="Secure investor data rooms with invitations, watermarks and activity logs."
      />
    </ModuleGuard>
  )
}
