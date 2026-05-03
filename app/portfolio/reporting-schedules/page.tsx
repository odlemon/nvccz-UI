"use client"

import { PortfolioLayout } from "@/components/layout/portfolio-layout"
import { ScheduleConfigurations } from "@/components/portfolio/schedule-configurations"
import { ModuleGuard } from "@/lib/permissions"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"

export default function ReportingSchedulesPage() {
  const { isLoading, hasSubModuleAccess } = useRolePermissions()

  if (isLoading) {
    return (
      <PortfolioLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-500">Loading configurations...</p>
          </div>
        </div>
      </PortfolioLayout>
    )
  }

  return (
    <ModuleGuard 
      moduleId="portfolio-management" 
      subModule="reporting-schedule-configs" 
      fallback={
        <PortfolioLayout>
          <div className="flex items-center justify-center h-96">
            <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-md mx-auto">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-xl font-bold text-gray-900 mb-2">Access Denied</p>
              <p className="text-sm text-gray-500">
                You do not have the required permissions to manage reporting schedules. 
                Please contact your administrator if you believe this is an error.
              </p>
            </div>
          </div>
        </PortfolioLayout>
      }
    >
      <PortfolioLayout>
        <div className="p-8 max-w-7xl mx-auto">
          <ScheduleConfigurations />
        </div>
      </PortfolioLayout>
    </ModuleGuard>
  )
}

import { XCircle } from "lucide-react"
