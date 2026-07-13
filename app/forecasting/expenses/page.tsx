import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { FpaExpenses } from "@/components/fpa/fpa-expenses"

export default function FpaExpensesPage() {
  return (
    <ModuleGuard moduleId="forecasting" subModuleId="fpa-expenses">
      <FpaExpenses />
    </ModuleGuard>
  )
}
