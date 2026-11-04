"use client"

import { AccountingLayout } from "@/components/layout/accounting-layout"
import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { CashbookLegacyContent } from "@/components/accounting/cashbook-legacy-content"

export default function CashbookPageWrapper() {
  return (
    <ModuleGuard moduleId="accounting" subModuleId="cash-book">
      <AccountingLayout><CashbookLegacyContent /></AccountingLayout>
    </ModuleGuard>
  )
}
