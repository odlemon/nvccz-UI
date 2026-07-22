"use client"

import { useParams } from "next/navigation"
import { PerformanceLayout } from "@/components/layout/performance-layout"
import { CheckInMockScreen } from "@/components/performance-mock/screens/check-in-screen"
import { ModuleGuard } from "@/lib/permissions"

export default function CheckInDetailPage() {
  const params = useParams()
  const id = params.id as string

  return (
    <ModuleGuard moduleId="performance-management" subModuleId="check-ins">
      <PerformanceLayout>
        <CheckInMockScreen id={id} />
      </PerformanceLayout>
    </ModuleGuard>
  )
}
