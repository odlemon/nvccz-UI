import { PerformanceLayout } from "@/components/layout/performance-layout"
import { ConfigurationHubMockScreen } from "@/components/performance-mock/screens/configuration-hub-screen"
import { ModuleGuard } from "@/lib/permissions"

export default function PerformanceConfigurationPage() {
  return (
    <ModuleGuard moduleId="performance-management">
      <PerformanceLayout>
        <ConfigurationHubMockScreen />
      </PerformanceLayout>
    </ModuleGuard>
  )
}
