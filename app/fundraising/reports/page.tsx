import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FundraisingReports } from "@/components/fundraising/fundraising-reports"

export default function Page() {
  return (
    <ModuleGuard moduleId="fundraising" subModuleId="fr-reports">
      <FundraisingReports />
    </ModuleGuard>
  )
}
