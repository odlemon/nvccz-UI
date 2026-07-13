"use client"

import { useParams } from "next/navigation"
import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FpaModelBuilder } from "@/components/fpa/fpa-model-builder"

export default function ModelBuilderDetailPage() {
  const params = useParams()
  const modelId = params.modelId as string

  return (
    <ModuleGuard moduleId="forecasting" subModuleId="fpa-model-builder">
      <FpaModelBuilder modelId={modelId} />
    </ModuleGuard>
  )
}
