import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FundraisingComingSoon } from "@/components/fundraising/fundraising-coming-soon"

export default function Page() {
  return (
    <ModuleGuard moduleId="fundraising" subModuleId="fr-investors">
      <FundraisingComingSoon
        title="Investor Organisations"
        description="Central institutional investor database with relationship ownership."
      />
    </ModuleGuard>
  )
}
