import { PerformanceLayout } from "@/components/layout/performance-layout"
import { ThemesMockScreen } from "@/components/performance-mock/screens/themes-screen"
import { ModuleGuard } from "@/lib/permissions"

export default function ConfigThemesPage() {
  return (
    <ModuleGuard moduleId="performance-management" subModuleId="config-themes">
      <PerformanceLayout>
        <ThemesMockScreen />
      </PerformanceLayout>
    </ModuleGuard>
  )
}
