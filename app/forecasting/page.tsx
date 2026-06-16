import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { ForecastingLayout } from "@/components/layout/forecasting-layout"
import { ForecastingDashboard } from "@/components/forecasting/forecasting-dashboard"

export default function ForecastingPage() {
  return (
    <ModuleGuard moduleId="forecasting" subModuleId="forecasting-dashboard">
      <ForecastingLayout>
        <ForecastingDashboard />
      </ForecastingLayout>
    </ModuleGuard>
  )
}
