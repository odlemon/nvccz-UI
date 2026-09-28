import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FpaAuditLogs } from "@/components/fpa/fpa-audit-logs"

export default function FpaAuditPage() {
  return (
    <ModuleGuard moduleId="forecasting" subModuleId="fpa-audit-logs">
      <FpaAuditLogs />
    </ModuleGuard>
  )
}
