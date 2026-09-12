import { PayrollLayout } from "@/components/layout/payroll-layout"
import { AllowanceTypesTable } from "@/components/payroll/allowance-types-table"
import { ModuleGuard } from "@/components/permissions/PermissionGuards"

export default function AllowanceTypesPage() {
  return (
    <ModuleGuard moduleId="payroll" subModuleId="payroll-allowance-types" requiredAccess="read">
      <PayrollLayout>
        <div className="px-6 py-6">
          <AllowanceTypesTable />
        </div>
      </PayrollLayout>
    </ModuleGuard>
  )
}