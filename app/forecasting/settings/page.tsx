import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FpaSettings } from "@/components/fpa/fpa-settings"

export default function FpaSettingsPage() {
  return (
    <ModuleGuard moduleId="forecasting" subModuleId="fpa-settings">
      <FpaSettings />
    </ModuleGuard>
  )
}
