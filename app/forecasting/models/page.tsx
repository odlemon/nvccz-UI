import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FpaPlanningCyclesList } from "@/components/fpa/fpa-planning-cycles-list"

export default function FpaModelsPage() {
  return (
    <ModuleGuard moduleId="forecasting" subModuleId="fpa-models">
      <FpaPlanningCyclesList />
    </ModuleGuard>
  )
}
