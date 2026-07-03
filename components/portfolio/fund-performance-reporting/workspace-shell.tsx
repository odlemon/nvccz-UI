"use client"

import type { ReactNode } from "react"
import { ModuleGuard } from "@/lib/permissions"
import { PortfolioLayout } from "@/components/layout/portfolio-layout"
import { WorkspaceNav } from "./workspace-nav"
import { FundSelector } from "./fund-selector"
import { XCircle } from "lucide-react"

interface FundPerformanceReportingShellProps {
  title: string
  description?: string
  children: ReactNode
}

/**
 * Shared page shell for every Fund Performance Reporting screen: applies the
 * ModuleGuard + PortfolioLayout wrapper (per app/portfolio/reporting-schedules/page.tsx),
 * then renders the header, fund selector, and workspace tab strip above the
 * page's own content.
 */
export function FundPerformanceReportingShell({ title, description, children }: FundPerformanceReportingShellProps) {
  return (
    <ModuleGuard
      moduleId="portfolio-management"
      subModuleId="fund-performance-reporting"
      fallback={
        <PortfolioLayout>
          <div className="flex items-center justify-center h-96">
            <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-md mx-auto">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-xl font-bold text-gray-900 mb-2">Access Denied</p>
              <p className="text-sm text-gray-500">
                You do not have the required permissions to access Fund Performance Reporting.
                Please contact your administrator if you believe this is an error.
              </p>
            </div>
          </div>
        </PortfolioLayout>
      }
    >
      <PortfolioLayout>
        <div className="p-6 space-y-4 max-w-[1600px] mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{title}</h1>
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            <FundSelector />
          </div>
          <WorkspaceNav />
          <div>{children}</div>
        </div>
      </PortfolioLayout>
    </ModuleGuard>
  )
}
