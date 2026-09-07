"use client"

import { AccountingLayout } from "@/components/layout/accounting-layout"
import { InvoicesManagement } from "@/components/accounting/invoices-management"
import { ModuleGuard } from "@/components/permissions/PermissionGuards"

export default function InvoicesPage() {
  return (
    <ModuleGuard moduleId="accounting" subModuleId="invoices">
      <AccountingLayout>
        <div className="p-6">
          <InvoicesManagement />
        </div>
      </AccountingLayout>
    </ModuleGuard>
  )
}