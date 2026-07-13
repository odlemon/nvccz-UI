import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FundraisingComingSoon } from "@/components/fundraising/fundraising-coming-soon"

export default function Page() {
  return (
    <ModuleGuard moduleId="fundraising" subModuleId="fr-dashboard">
      <FundraisingComingSoon
        title="Dashboard"
        description="Executive fundraising overview with target, pipeline, capital raised and activity."
      />
    </ModuleGuard>
  )
}
