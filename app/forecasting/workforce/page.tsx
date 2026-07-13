import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FpaWorkforce } from "@/components/fpa/fpa-workforce"

export default function FpaWorkforcePage() {
  return (
    <ModuleGuard moduleId="forecasting" subModuleId="fpa-workforce">
      <FpaWorkforce />
    </ModuleGuard>
  )
}
