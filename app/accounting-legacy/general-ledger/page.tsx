"use client"

import { AccountingLayout } from "@/components/layout/accounting-layout"
import { GeneralLedger } from "@/components/accounting/general-ledger"
import { ModuleGuard } from "@/components/permissions/PermissionGuards"

export default function GeneralLedgerPage() {
  return (
    <ModuleGuard moduleId="accounting" subModuleId="general-ledger">
      <AccountingLayout>
        <div className="p-6">
          <GeneralLedger />
        </div>
      </AccountingLayout>
    </ModuleGuard>
  )
}