import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FundraisingComingSoon } from "@/components/fundraising/fundraising-coming-soon"

export default function Page() {
  return (
    <ModuleGuard moduleId="fundraising" subModuleId="fr-commitments">
      <FundraisingComingSoon
        title="Commitments & Closings"
        description="Signed commitments, admissions and fund closing events."
      />
    </ModuleGuard>
  )
}
