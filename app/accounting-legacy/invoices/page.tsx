"use client"

import { AccountingLayout } from "@/components/layout/accounting-layout"
import { ReceivablesLegacyContent } from "@/components/accounting/receivables-legacy-content"
import { ModuleGuard } from "@/components/permissions/PermissionGuards"

export default function InvoicesPage() {
  return (
    <ModuleGuard moduleId="accounting" subModuleId="invoices">
      <AccountingLayout>
        <ReceivablesLegacyContent />
      </AccountingLayout>
    </ModuleGuard>
  )
}
