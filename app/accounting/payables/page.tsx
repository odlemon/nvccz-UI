"use client"

import { PayablesManagement } from "@/components/accounting/payables-management"
import { ModuleGuard } from "@/lib/permissions"
import { AccountingLayout } from "@/components/layout/accounting-layout"

export default function PayablesPage() {
  return (


    <ModuleGuard moduleId="accounting" subModuleId="payables">
      <AccountingLayout>
        <div className="p-6">
          <PayablesManagement />

        </div>
      </AccountingLayout>
    </ModuleGuard>
  )
}
