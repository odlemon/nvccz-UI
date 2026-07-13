import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FpaComingSoon } from "@/components/fpa/fpa-coming-soon"

export default function FpaAuditPage() {
  return (
    <ModuleGuard moduleId="forecasting" subModuleId="fpa-home">
      <FpaComingSoon
          title="Audit Logs"
          description="Material edits, approvals and lock attempts will appear here once the API is connected."
        />
    </ModuleGuard>
  )
}
