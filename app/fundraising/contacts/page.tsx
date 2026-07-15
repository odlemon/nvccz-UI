import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FundraisingContacts } from "@/components/fundraising/fundraising-contacts"

export default function Page() {
  return (
    <ModuleGuard moduleId="fundraising" subModuleId="fr-contacts">
      <FundraisingContacts />
    </ModuleGuard>
  )
}
