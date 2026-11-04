"use client"

import { AccountingLayout } from "@/components/layout/accounting-layout"
import { BankReconciliationLegacyContent } from "@/components/accounting/bank-reconciliation-legacy-content"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"

export default function Page() {
  const { isLoading, hasSpecificAction } = useRolePermissions()

  if (isLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center p-8" role="status" aria-label="Loading permissions">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#e2e8f0] border-t-[#2563eb]" />
    </div>
  }

  if (!hasSpecificAction("accounting", "bank_reconciliation")) {
    return <div className="flex min-h-[40vh] items-center justify-center p-8">
      <div className="max-w-md space-y-2 text-center">
        <p className="text-lg font-semibold text-[#0f172a]">Access denied</p>
        <p className="text-sm text-[#64748b]">You do not have permission to view bank reconciliation. Ask an admin if you need access.</p>
      </div>
    </div>
  }

  return <AccountingLayout><BankReconciliationLegacyContent /></AccountingLayout>
}
