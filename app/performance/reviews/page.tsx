"use client"

import { Suspense } from "react"
import { PerformanceLayout } from "@/components/layout/performance-layout"
import { ModuleGuard } from "@/lib/permissions"
import { ReviewsManagement } from "@/components/performance/reviews/reviews-management"
import { ClipboardList, Loader2 } from "lucide-react"

export default function ReviewsPage() {
  return (
    <ModuleGuard moduleId="performance-management">
      <PerformanceLayout>
        <div className="p-8 max-w-7xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                  <ClipboardList className="w-7 h-7 text-white" />
                </div>
                Performance Reviews
              </h1>
              <p className="text-gray-500 mt-2 max-w-2xl">
                Manage your self-assessments, evaluate team performance, and oversee the organization's review cycles and analytics.
              </p>
            </div>
          </div>

          <Suspense fallback={
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          }>
            <ReviewsManagement />
          </Suspense>
        </div>
      </PerformanceLayout>
    </ModuleGuard>
  )
}
