"use client"

import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FpaModelsList } from "@/components/fpa/fpa-models-list"

export default function FpaModelsPage() {
  return (
    <ModuleGuard moduleId="forecasting" subModuleId="fpa-models">
      <Suspense
        fallback={
          <div className="flex min-h-[40vh] items-center justify-center gap-2 text-[#64748b]">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading Model Planning…
          </div>
        }
      >
        <FpaModelsList />
      </Suspense>
    </ModuleGuard>
  )
}
