'use client'

import { ProcurementLayout } from "@/components/layout/procurement-layout"
import { ApprovalConfigurations } from "@/components/procurement/approval-configurations"
import { ModuleGuard } from "@/lib/permissions"
import { useProcurementPermissions } from "@/lib/permissions"

export default function ApprovalConfigsPage() {
  const { isLoading, permissions } = useProcurementPermissions()

  if (isLoading) {
    return (
      <ProcurementLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        </div>
      </ProcurementLayout>
    )
  }

  return (
    <ModuleGuard moduleId="procurement" subModule="approval-configurations" fallback={
      <ProcurementLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900 mb-2">Access Denied</p>
            <p className="text-sm text-gray-500">Only the CEO can manage approval configurations.</p>
          </div>
        </div>
      </ProcurementLayout>
    }>
      <ProcurementLayout>
        <div className="p-6">
          <ApprovalConfigurations />
        </div>
      </ProcurementLayout>
    </ModuleGuard>
  )
}
