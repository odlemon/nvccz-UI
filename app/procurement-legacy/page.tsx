'use client'

import { ProcurementLayout } from "@/components/layout/procurement-layout"
import { ProcurementDashboard } from "@/components/procurement/procurement-dashboard"
import { ModuleGuard } from "@/lib/permissions"
import { useProcurementPermissions } from "@/lib/permissions"
import { useAppSelector } from "@/lib/store"

export default function ProcurementPage() {
  const { isLoading } = useProcurementPermissions()
  const { userDetails, isFetchingDetails } = useAppSelector(state => state.auth)

  // Wait for user details to load before evaluating permissions — otherwise
  // ModuleGuard transiently renders its "Access Denied" fallback during the
  // initial mount window where userDetails is still null.
  if (isLoading || isFetchingDetails || !userDetails) {
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
    <ModuleGuard moduleId="procurement" subModule="procurement-dashboard" fallback={
      <ProcurementLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900 mb-2">Access Denied</p>
            <p className="text-sm text-gray-500">You don't have permission to view the procurement dashboard.</p>
          </div>
        </div>
      </ProcurementLayout>
    }>
      <ProcurementLayout>
        <div className="p-6">
          <ProcurementDashboard />
        </div>
      </ProcurementLayout>
    </ModuleGuard>
  )
}
