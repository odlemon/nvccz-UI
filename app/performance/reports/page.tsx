"use client"

import { Suspense } from "react"
import { PerformanceLayout } from "@/components/layout/performance-layout"
import { ReportsMockScreen } from "@/components/performance-mock/screens/reports-screen"
import { ModuleGuard } from "@/lib/permissions"

export default function ReportsPage() {
  return (
    <ModuleGuard moduleId="performance-management" subModuleId="reports">
      <PerformanceLayout>
        <Suspense fallback={<div className="p-6 text-sm text-[#64748B]">Loading reports…</div>}>
          <ReportsMockScreen />
        </Suspense>
      </PerformanceLayout>
    </ModuleGuard>
  )
}
