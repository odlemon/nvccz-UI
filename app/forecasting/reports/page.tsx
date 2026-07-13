import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FpaReports } from "@/components/fpa/fpa-reports"

export default function FpaReportsPage() {
  return (
    <ModuleGuard moduleId="forecasting" subModuleId="fpa-reports">
      <FpaReports />
    </ModuleGuard>
  )
}
