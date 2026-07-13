import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FundraisingComingSoon } from "@/components/fundraising/fundraising-coming-soon"

export default function Page() {
  return (
    <ModuleGuard moduleId="fundraising" subModuleId="fr-agreements">
      <FundraisingComingSoon
        title="Agreements & Signatures"
        description="NDAs, subscriptions, IMAs and electronic signatures."
      />
    </ModuleGuard>
  )
}
