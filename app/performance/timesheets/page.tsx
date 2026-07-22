import { PerformanceLayout } from "@/components/layout/performance-layout"
import { TimesheetsMockScreen } from "@/components/performance-mock/screens/timesheets-screen"
import { ModuleGuard } from "@/lib/permissions"

export default function TimesheetsPage() {
  return (
    <ModuleGuard moduleId="performance-management" subModuleId="timesheets">
      <PerformanceLayout>
        <TimesheetsMockScreen />
      </PerformanceLayout>
    </ModuleGuard>
  )
}
