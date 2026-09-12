import { PayrollLayout } from "@/components/layout/payroll-layout"
import { DeductionTypesTable } from "@/components/payroll/deduction-types-table"
import { ModuleGuard } from "@/components/permissions/PermissionGuards"

export default function DeductionTypesPage() {
  return (
    <ModuleGuard moduleId="payroll" subModuleId="payroll-deduction-types" requiredAccess="read">
      <PayrollLayout>
        <div className="px-6 py-6">
          <DeductionTypesTable />
        </div>
      </PayrollLayout>
    </ModuleGuard>
  )
}