import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FundraisingComingSoon } from "@/components/fundraising/fundraising-coming-soon"

export default function Page() {
  return (
    <ModuleGuard moduleId="fundraising" subModuleId="fr-due-diligence">
      <FundraisingComingSoon
        title="Due Diligence"
        description="DDQ templates, responses, evidence and investor follow-ups."
      />
    </ModuleGuard>
  )
}
