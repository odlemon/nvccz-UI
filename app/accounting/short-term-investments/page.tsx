"use client"

import { AccountingLayout } from "@/components/layout/accounting-layout"
import { ShortTermInvestmentsManagement } from "@/components/accounting/short-term-investments/short-term-investments-management"
import { ModuleGuard } from "@/components/permissions/PermissionGuards"

export default function ShortTermInvestmentsPage() {
  return (
    <ModuleGuard moduleId="accounting" subModuleId="short-term-investments">
      <AccountingLayout>
        <ShortTermInvestmentsManagement />
      </AccountingLayout>
    </ModuleGuard>
  )
}
