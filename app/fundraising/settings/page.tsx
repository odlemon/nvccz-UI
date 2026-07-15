import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FundraisingSettings } from "@/components/fundraising/fundraising-settings"

export default function Page() {
  return (
    <ModuleGuard moduleId="fundraising" subModuleId="fr-settings">
      <FundraisingSettings />
    </ModuleGuard>
  )
}
