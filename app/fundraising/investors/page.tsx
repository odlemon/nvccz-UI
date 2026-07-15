import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FundraisingInvestors } from "@/components/fundraising/fundraising-investors"

export default function Page() {
  return (
    <ModuleGuard moduleId="fundraising" subModuleId="fr-investors">
      <FundraisingInvestors />
    </ModuleGuard>
  )
}
