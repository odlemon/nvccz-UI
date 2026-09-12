import { PerformanceLayout } from "@/components/layout/performance-layout"
import { IntegrationsMockScreen } from "@/components/performance-mock/screens/integrations-screen"
import { ModuleGuard } from "@/lib/permissions"

export default function IntegrationsPage() {
  return (
    <ModuleGuard moduleId="performance-management" subModuleId="integrations">
      <PerformanceLayout>
        <IntegrationsMockScreen />
      </PerformanceLayout>
    </ModuleGuard>
  )
}
