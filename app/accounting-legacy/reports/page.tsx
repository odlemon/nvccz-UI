"use client"

import { AccountingLayout } from "@/components/layout/accounting-layout"
import { FinancialReports } from "@/components/accounting/financial-reports"
import { ModuleGuard } from "@/components/permissions/PermissionGuards"

export default function ReportsPage() {
    return (
        <ModuleGuard moduleId="accounting" subModuleId="financial-reports">
            <AccountingLayout>
                <div className="p-6">
                    <FinancialReports />

                </div>
            </AccountingLayout>
        </ModuleGuard>
    )
}
