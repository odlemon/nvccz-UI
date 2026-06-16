import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { ForecastingLayout } from "@/components/layout/forecasting-layout"
import { ScenarioWorkspace } from "@/components/forecasting/scenario-workspace"

export default function ScenarioDetailPage({ params }: { params: { id: string } }) {
  return (
    <ModuleGuard moduleId="forecasting" subModuleId="scenarios">
      <ForecastingLayout>
        <ScenarioWorkspace id={params.id} />
      </ForecastingLayout>
    </ModuleGuard>
  )
}
