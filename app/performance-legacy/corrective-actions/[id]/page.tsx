"use client"

import { useParams } from "next/navigation"
import { PerformanceLayout } from "@/components/layout/performance-layout"
import { CorrectiveActionDetailMockScreen } from "@/components/performance-mock/screens/corrective-action-detail-screen"
import { ModuleGuard } from "@/lib/permissions"

export default function CorrectiveActionDetailPage() {
  const params = useParams()
  const actionId = params.id as string

  return (
    <ModuleGuard moduleId="performance-management" subModuleId="corrective-actions">
      <PerformanceLayout>
        <CorrectiveActionDetailMockScreen actionId={actionId} />
      </PerformanceLayout>
    </ModuleGuard>
  )
}
