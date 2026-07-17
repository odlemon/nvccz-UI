"use client"

import { Suspense } from "react"
import { useParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FpaBudgetWorkspace } from "@/components/fpa/fpa-budget-workspace"

function BudgetWorkspaceRoute() {
  const params = useParams()
  return <FpaBudgetWorkspace cycleId={String(params.cycleId)} />
}

export default function FpaBudgetWorkspacePage() {
  return (
    <ModuleGuard moduleId="forecasting" subModuleId="fpa-budget">
      <Suspense
        fallback={
          <div className="flex min-h-[40vh] items-center justify-center gap-2 text-[#64748b]">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading budget workspace…
          </div>
        }
      >
        <BudgetWorkspaceRoute />
      </Suspense>
    </ModuleGuard>
  )
}
