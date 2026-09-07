"use client"

import { AccountingLayout } from "@/components/layout/accounting-layout"
import { AccountingDashboard } from "@/components/accounting/accounting-dashboard"
import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { AccountingDashboardV2 } from "@/components/accounting/accounting-dashboard-v2"

export default function AccountingPage() {
  return (
    <ModuleGuard moduleId="accounting" subModuleId="accounting-dashboard">
      <AccountingLayout>

        <AccountingDashboardV2 />

      </AccountingLayout>
    </ModuleGuard>
  )
}