"use client"

import { AccountingLayout } from "@/components/layout/accounting-layout"
import { AccountingSettings } from "@/components/accounting/accounting-settings"
import { ModuleGuard } from "@/components/permissions/PermissionGuards"

export default function AccountingSettingsPage() {
  return (
    <ModuleGuard moduleId="accounting" subModuleId="accounting-settings">
      <AccountingLayout>
        <div className="p-6">
          <AccountingSettings />
        </div>
      </AccountingLayout>
    </ModuleGuard>
  )
}