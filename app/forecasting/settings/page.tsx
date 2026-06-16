import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { ForecastingLayout } from "@/components/layout/forecasting-layout"
import { EntitySettings } from "@/components/forecasting/entity-settings"

export default function ForecastingSettingsPage() {
  return (
    <ModuleGuard moduleId="forecasting" subModuleId="forecasting-settings">
      <ForecastingLayout>
        <div className="p-6">
          <EntitySettings />
        </div>
      </ForecastingLayout>
    </ModuleGuard>
  )
}
