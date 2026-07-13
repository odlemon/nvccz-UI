import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FpaCashFlow } from "@/components/fpa/fpa-cash-flow"

export default function FpaCashFlowPage() {
  return (
    <ModuleGuard moduleId="forecasting" subModuleId="fpa-cashflow">
      <FpaCashFlow />
    </ModuleGuard>
  )
}
