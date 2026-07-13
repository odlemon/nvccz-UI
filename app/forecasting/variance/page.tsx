import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FpaVarianceAnalysis } from "@/components/fpa/fpa-variance-analysis"

export default function FpaVariancePage() {
  return (
    <ModuleGuard moduleId="forecasting" subModuleId="fpa-variance">
      <FpaVarianceAnalysis />
    </ModuleGuard>
  )
}
