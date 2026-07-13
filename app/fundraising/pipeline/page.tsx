import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FundraisingPipeline } from "@/components/fundraising/fundraising-pipeline"

export default function Page() {
  return (
    <ModuleGuard moduleId="fundraising" subModuleId="fr-pipeline">
      <FundraisingPipeline />
    </ModuleGuard>
  )
}
