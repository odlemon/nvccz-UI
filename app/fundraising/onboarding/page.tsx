import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FundraisingOnboarding } from "@/components/fundraising/fundraising-onboarding"

export default function Page() {
  return (
    <ModuleGuard moduleId="fundraising" subModuleId="fr-onboarding">
      <FundraisingOnboarding />
    </ModuleGuard>
  )
}
