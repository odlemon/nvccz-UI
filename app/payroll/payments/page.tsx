import { PayrollLayout } from "@/components/layout/payroll-layout"
import { PaymentsTable } from "@/components/payroll/PaymentsTable"
import { ModuleGuard } from "@/components/permissions/PermissionGuards"

export default function PaymentsPage() {
  return (
    <ModuleGuard moduleId="payroll" requiredAccess="read">
      <PayrollLayout>
        <div className="px-6 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-normal">Payments</h1>
            <p className="text-gray-500 text-sm">Manage payment batches and transactions</p>
          </div>
          <PaymentsTable />
        </div>
      </PayrollLayout>
    </ModuleGuard>
  )
}