import { PayrollRunsTable } from "@/components/payroll/payroll-runs-table"
import { PayrollLayout } from "@/components/layout/payroll-layout"
import { ModuleGuard } from "@/components/permissions/PermissionGuards"

export default function PayrollRunsPage() {
  return (
    <ModuleGuard moduleId="payroll" subModuleId="payroll-runs" requiredAccess="read">
      <PayrollLayout>
         <div className="container mx-auto py-6 px-6">
         <PayrollRunsTable />
        </div>
        
      </PayrollLayout>
    </ModuleGuard>
  )
}