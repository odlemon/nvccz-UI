import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FundraisingDashboard } from "@/components/fundraising/fundraising-dashboard"

export default function Page() {
  return (
    <ModuleGuard moduleId="fundraising" subModuleId="fr-dashboard">
      <FundraisingDashboard />
    </ModuleGuard>
  )
}
