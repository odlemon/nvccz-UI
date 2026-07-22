import { PerformanceLayout } from "@/components/layout/performance-layout"
import { SettingsMockScreen } from "@/components/performance-mock/screens/settings-screen"
import { ModuleGuard } from "@/lib/permissions"

export default function SettingsPage() {
  return (
    <ModuleGuard moduleId="performance-management" subModuleId="settings">
      <PerformanceLayout>
        <SettingsMockScreen />
      </PerformanceLayout>
    </ModuleGuard>
  )
}
