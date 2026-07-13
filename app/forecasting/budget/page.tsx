import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FpaBudgetCycles } from "@/components/fpa/fpa-budget-cycles"

export default function FpaBudgetPage() {
  return (
    <ModuleGuard moduleId="forecasting" subModuleId="fpa-budget">
      <FpaBudgetCycles />
    </ModuleGuard>
  )
}
