import { PayrollLayout } from "@/components/layout/payroll-layout"
import { BankTemplatesTable } from "@/components/payroll/bank-templates-table"
import { ModuleGuard } from "@/components/permissions/PermissionGuards"

export default function BankTemplatesPage() {
  return (
    <ModuleGuard moduleId="payroll" subModuleId="payroll-bank-templates" requiredAccess="read">
      <PayrollLayout>
        <div className="px-6 py-6">
          <BankTemplatesTable />
        </div>
      </PayrollLayout>
    </ModuleGuard>
  )
}