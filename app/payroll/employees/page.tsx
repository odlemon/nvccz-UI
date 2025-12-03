import { PayrollLayout } from "@/components/layout/payroll-layout"
import { EmployeesTable } from "@/components/payroll/employees-table"
import { ModuleGuard } from "@/components/permissions/PermissionGuards"

export default function EmployeesPage() {
  return (
    <ModuleGuard moduleId="payroll" subModuleId="payroll-employees" requiredAccess="read">
      <PayrollLayout>
        <div className="container mx-auto py-6 px-6">
          <EmployeesTable />
        </div>
      </PayrollLayout>
    </ModuleGuard>
  )
}