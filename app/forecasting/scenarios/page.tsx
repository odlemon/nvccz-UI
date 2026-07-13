import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FpaScenarioComparison } from "@/components/fpa/fpa-scenario-comparison"

export default function FpaScenariosPage() {
  return (
    <ModuleGuard moduleId="forecasting" subModuleId="fpa-scenarios">
      <FpaScenarioComparison />
    </ModuleGuard>
  )
}
