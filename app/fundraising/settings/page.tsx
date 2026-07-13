import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FundraisingComingSoon } from "@/components/fundraising/fundraising-coming-soon"

export default function Page() {
  return (
    <ModuleGuard moduleId="fundraising" subModuleId="fr-settings">
      <FundraisingComingSoon
        title="Settings"
        description="Pipeline stages, probabilities, templates and module configuration."
      />
    </ModuleGuard>
  )
}
