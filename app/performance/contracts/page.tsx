"use client"

import { PerformanceLayout } from "@/components/layout/performance-layout"
import { PerformanceContractsManagement } from "@/components/performance/performance-contracts-management"
import { ModuleGuard } from "@/lib/permissions"

export default function PerformanceContractsPage() {
  return (
    <ModuleGuard moduleId="performance-management" subModuleId="performance-contracts">
      <PerformanceLayout>
        <PerformanceContractsManagement />
      </PerformanceLayout>
    </ModuleGuard>
  )
}
