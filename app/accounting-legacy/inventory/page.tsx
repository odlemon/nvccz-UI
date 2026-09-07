"use client"

import { AccountingLayout } from "@/components/layout/accounting-layout"
import { InventoryManagement } from "@/components/accounting/inventory-management"
import { ModuleGuard } from "@/components/permissions/PermissionGuards"

export default function InventoryPage() {
  return (
    <ModuleGuard moduleId="accounting" subModuleId="inventory-accounting">
      <AccountingLayout>
        <div className="p-6">
          <InventoryManagement />
        </div>
      </AccountingLayout>
    </ModuleGuard>
  )
}
