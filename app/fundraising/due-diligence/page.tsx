import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FundraisingDueDiligence } from "@/components/fundraising/fundraising-due-diligence"

export default function Page() {
  return (
    <ModuleGuard moduleId="fundraising" subModuleId="fr-due-diligence">
      <FundraisingDueDiligence />
    </ModuleGuard>
  )
}
