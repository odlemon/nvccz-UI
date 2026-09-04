"use client"

import { useParams } from "next/navigation"
import { PerformanceLayout } from "@/components/layout/performance-layout"
import { ObjectiveDetailMockScreen } from "@/components/performance-mock/screens/objective-detail-screen"
import { ModuleGuard } from "@/lib/permissions"

export default function ObjectiveDetailPage() {
  const params = useParams()
  const objectiveId = params.id as string

  return (
    <ModuleGuard moduleId="performance-management" subModuleId="goals-management">
      <PerformanceLayout>
        <ObjectiveDetailMockScreen objectiveId={objectiveId} />
      </PerformanceLayout>
    </ModuleGuard>
  )
}
