"use client"

import { PerformanceLayout } from "@/components/layout/performance-layout"
import { CreateKpiWizardMockScreen } from "@/components/performance-mock/screens/create-kpi-wizard-screen"
import { ModuleGuard } from "@/lib/permissions"

export default function CreateKpiPage() {
  return (
    <ModuleGuard moduleId="performance-management" subModuleId="kpi-management">
      <PerformanceLayout>
        <CreateKpiWizardMockScreen />
      </PerformanceLayout>
    </ModuleGuard>
  )
}
