"use client"

import { useParams } from "next/navigation"
import { PerformanceLayout } from "@/components/layout/performance-layout"
import { ModuleGuard } from "@/lib/permissions"
import { ManagerReviewMockScreen } from "@/components/performance-mock/screens/manager-review-screen"

export default function ReviewDetailPage() {
  const params = useParams()
  const id = params.id as string

  return (
    <ModuleGuard moduleId="performance-management" subModuleId="performance-reviews">
      <PerformanceLayout>
        <ManagerReviewMockScreen reviewId={id} />
      </PerformanceLayout>
    </ModuleGuard>
  )
}
