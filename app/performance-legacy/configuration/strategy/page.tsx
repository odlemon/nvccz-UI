"use client"

import { PerformanceLayout } from "@/components/layout/performance-layout"
import { StrategyMockScreen } from "@/components/performance-mock/screens/strategy-screen"
import { ModuleGuard } from "@/lib/permissions"

export default function ConfigStrategyPage() {
  return (
    <ModuleGuard moduleId="performance-management">
      <PerformanceLayout>
        <StrategyMockScreen />
      </PerformanceLayout>
    </ModuleGuard>
  )
}
