import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FpaRollingForecast } from "@/components/fpa/fpa-rolling-forecast"

export default function FpaRollingPage() {
  return (
    <ModuleGuard moduleId="forecasting" subModuleId="fpa-rolling">
      <FpaRollingForecast />
    </ModuleGuard>
  )
}
