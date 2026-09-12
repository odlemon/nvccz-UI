"use client"

import { AccountingLayout } from "@/components/layout/accounting-layout"
import { AssetsManagement } from "@/components/accounting/assets-management"
import { ModuleGuard } from "@/components/permissions/PermissionGuards"

export default function AssetsPage() {
  return (
    <ModuleGuard moduleId="accounting" subModuleId="asset-management">
      <AccountingLayout>
        <AssetsManagement />
      </AccountingLayout>
    </ModuleGuard>
  )
}
