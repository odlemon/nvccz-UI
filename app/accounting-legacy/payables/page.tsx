"use client"

import { PayablesLegacyContent } from "@/components/accounting/payables-legacy-content"
import { ModuleGuard } from "@/lib/permissions"
import { AccountingLayout } from "@/components/layout/accounting-layout"

export default function PayablesPage() {
  return (


    <ModuleGuard moduleId="accounting" subModuleId="payables">
      <AccountingLayout>
        <PayablesLegacyContent />
      </AccountingLayout>
    </ModuleGuard>
  )
}
