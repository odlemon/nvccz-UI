"use client"

import { AccountingLayout } from "@/components/layout/accounting-layout"
import { ExpensesManagement } from "@/components/accounting/expenses-management"
import { ModuleGuard } from "@/components/permissions/PermissionGuards"

export default function ExpensesPage() {
  return (
    <ModuleGuard moduleId="accounting" subModuleId="expenses">
      <AccountingLayout>
        <div className="p-6">
          <ExpensesManagement />
        </div>
      </AccountingLayout>
    </ModuleGuard>
  )
}