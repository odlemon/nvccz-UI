"use client"

import { Suspense } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FpaWorksheet } from "@/components/fpa/fpa-worksheet"
import { PlanningWorkspaceBoard } from "@/components/fpa/planning/planning-workspace-board"

function WorksheetRoute() {
  const params = useParams()
  const searchParams = useSearchParams()
  const modelId = params.id as string
  const inBudgetContext = Boolean(searchParams.get("cycleId"))

  // Model Planning workspace — hardcoded SRD board until planning APIs are ready.
  if (!inBudgetContext) {
    return <PlanningWorkspaceBoard modelId={modelId} />
  }

  return <FpaWorksheet modelId={modelId} />
}

export default function FpaWorksheetPage() {
  return (
    <ModuleGuard moduleId="forecasting" subModuleId="fpa-models">
      <Suspense
        fallback={
          <div className="flex min-h-[40vh] items-center justify-center gap-2 text-[#64748b]">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading worksheet…
          </div>
        }
      >
        <WorksheetRoute />
      </Suspense>
    </ModuleGuard>
  )
}
