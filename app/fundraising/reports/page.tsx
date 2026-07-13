import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FundraisingComingSoon } from "@/components/fundraising/fundraising-coming-soon"

export default function Page() {
  return (
    <ModuleGuard moduleId="fundraising" subModuleId="fr-reports">
      <FundraisingComingSoon
        title="Reports"
        description="Fundraising progress, conversion and concentration reports."
      />
    </ModuleGuard>
  )
}
