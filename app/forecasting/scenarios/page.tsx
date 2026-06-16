import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { ForecastingLayout } from "@/components/layout/forecasting-layout"
import { ScenariosList } from "@/components/forecasting/scenarios-list"

export default function ScenariosPage() {
  return (
    <ModuleGuard moduleId="forecasting" subModuleId="scenarios">
      <ForecastingLayout>
        <div className="p-6">
          <ScenariosList />
        </div>
      </ForecastingLayout>
    </ModuleGuard>
  )
}
