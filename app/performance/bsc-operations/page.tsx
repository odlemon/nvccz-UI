"use client"

import { PerformanceLayout } from "@/components/layout/performance-layout"
import { PerformanceBscOperations } from "@/components/performance/performance-bsc-operations"
import { ModuleGuard } from "@/lib/permissions"

export default function BscOperationsPage() {
  return (
    <ModuleGuard moduleId="performance-management" subModuleId="bsc-operations">
      <PerformanceLayout>
        <div className="p-6">
          <PerformanceBscOperations />
        </div>
      </PerformanceLayout>
    </ModuleGuard>
  )
}
