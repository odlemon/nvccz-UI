import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FundraisingForecasts } from "@/components/fundraising/fundraising-forecasts"

export default function Page() {
  return (
    <ModuleGuard moduleId="fundraising" subModuleId="fr-forecasts">
      <FundraisingForecasts />
    </ModuleGuard>
  )
}
