import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FundraisingComingSoon } from "@/components/fundraising/fundraising-coming-soon"

export default function Page() {
  return (
    <ModuleGuard moduleId="fundraising" subModuleId="fr-documents">
      <FundraisingComingSoon
        title="Documents"
        description="Fundraising document library with version control."
      />
    </ModuleGuard>
  )
}
