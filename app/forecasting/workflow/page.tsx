import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FpaWorkflowApprovals } from "@/components/fpa/fpa-workflow-approvals"

export default function FpaWorkflowPage() {
  return (
    <ModuleGuard moduleId="forecasting" subModuleId="fpa-workflow">
      <Suspense
        fallback={
          <div className="flex min-h-[40vh] items-center justify-center gap-2 text-[#64748b]">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading workflow…
          </div>
        }
      >
        <FpaWorkflowApprovals />
      </Suspense>
    </ModuleGuard>
  )
}
