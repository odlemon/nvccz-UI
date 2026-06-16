import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { ForecastingLayout } from "@/components/layout/forecasting-layout"
import { AuditFeedPage } from "@/components/forecasting/audit-feed-page"

export default function ForecastingAuditPage() {
  return (
    <ModuleGuard moduleId="forecasting" subModuleId="forecasting-audit">
      <ForecastingLayout>
        <div className="p-6">
          <AuditFeedPage />
        </div>
      </ForecastingLayout>
    </ModuleGuard>
  )
}
