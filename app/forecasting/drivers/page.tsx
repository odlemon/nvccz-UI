import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FpaDriversLibrary } from "@/components/fpa/fpa-drivers-library"

export default function FpaDriversPage() {
  return (
    <ModuleGuard moduleId="forecasting" subModuleId="fpa-drivers">
      <FpaDriversLibrary />
    </ModuleGuard>
  )
}
