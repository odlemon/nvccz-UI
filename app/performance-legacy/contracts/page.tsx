import { PerformanceLayout } from "@/components/layout/performance-layout"
import { ContractsMockScreen } from "@/components/performance-mock/screens/contracts-screen"
import { ModuleGuard } from "@/lib/permissions"

export default function PerformanceContractsPage() {
  return (
    <ModuleGuard moduleId="performance-management" subModuleId="performance-contracts">
      <PerformanceLayout>
        <ContractsMockScreen />
      </PerformanceLayout>
    </ModuleGuard>
  )
}
