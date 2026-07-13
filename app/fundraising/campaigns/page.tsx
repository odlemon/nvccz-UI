import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FundraisingCampaigns } from "@/components/fundraising/fundraising-campaigns"

export default function Page() {
  return (
    <ModuleGuard moduleId="fundraising" subModuleId="fr-campaigns">
      <FundraisingCampaigns />
    </ModuleGuard>
  )
}
