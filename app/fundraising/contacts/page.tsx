import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FundraisingComingSoon } from "@/components/fundraising/fundraising-coming-soon"

export default function Page() {
  return (
    <ModuleGuard moduleId="fundraising" subModuleId="fr-contacts">
      <FundraisingComingSoon
        title="Contacts"
        description="Reusable contacts across campaigns and opportunities."
      />
    </ModuleGuard>
  )
}
