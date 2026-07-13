import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FundraisingComingSoon } from "@/components/fundraising/fundraising-coming-soon"

export default function Page() {
  return (
    <ModuleGuard moduleId="fundraising" subModuleId="fr-forecasts">
      <FundraisingComingSoon
        title="Forecasts & Analytics"
        description="Weighted pipeline, coverage ratio and expected fee revenue."
      />
    </ModuleGuard>
  )
}
