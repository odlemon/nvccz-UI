import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FundraisingComingSoon } from "@/components/fundraising/fundraising-coming-soon"

export default function Page() {
  return (
    <ModuleGuard moduleId="fundraising" subModuleId="fr-onboarding">
      <FundraisingComingSoon
        title="Client Onboarding"
        description="KYC, compliance and mandate activation readiness."
      />
    </ModuleGuard>
  )
}
