"use client"
import { CFODashboard } from "@/components/procurement/cfo-dashboard"
import { ProcurementLayout } from "@/components/layout/procurement-layout"
import { ModuleGuard } from "@/lib/permissions"

export default function CFODashboardPage() {
  return (
    <ModuleGuard moduleId="procurement" subModule="cfo-dashboard">
      <ProcurementLayout>
        <div className="p-6">
          <CFODashboard />
        </div>
      </ProcurementLayout>
    </ModuleGuard>
  )
}
