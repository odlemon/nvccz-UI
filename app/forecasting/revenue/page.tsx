import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FpaRevenue } from "@/components/fpa/fpa-revenue"

export default function FpaRevenuePage() {
  return (
    <ModuleGuard moduleId="forecasting" subModuleId="fpa-revenue">
      <FpaRevenue />
    </ModuleGuard>
  )
}
