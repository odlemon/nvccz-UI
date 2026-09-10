import { PayrollLayout } from "@/components/layout/payroll-layout"
import { PayrollDashboardV2 } from "@/components/payroll/payroll-dashboard-v2"
import { PayrollDashboard } from "@/components/payroll/PayrollDashboard"
import { ModuleGuard } from "@/components/permissions/PermissionGuards"

export default function PayrollPage() {
  return (
    <ModuleGuard moduleId="payroll" requiredAccess="read">
      <PayrollLayout>
        <div className="px-6 py-6">
          <PayrollDashboardV2 />
        </div>
      </PayrollLayout>
    </ModuleGuard>
  )
}


