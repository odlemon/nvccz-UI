"use client"

import { PortfolioLayout } from "@/components/layout/portfolio-layout"
import { ModuleGuard } from "@/lib/permissions"
import { WorkspaceNav } from "@/components/portfolio/lp-management/workspace-nav"
import { PublishDocumentForm } from "@/components/portfolio/lp-management/publish-document-form"
import { XCircle } from "lucide-react"

export default function LpManagementDocumentsPage() {
  return (
    <ModuleGuard
      moduleId="portfolio-management"
      subModuleId="lp-management"
      fallback={
        <PortfolioLayout>
          <div className="flex items-center justify-center h-96">
            <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-md mx-auto">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-xl font-bold text-gray-900 mb-2">Access Denied</p>
              <p className="text-sm text-gray-500">
                You do not have the required permissions to access LP Management. Please contact your
                administrator if you believe this is an error.
              </p>
            </div>
          </div>
        </PortfolioLayout>
      }
    >
      <PortfolioLayout>
        <div className="max-w-7xl mx-auto">
          <WorkspaceNav />
          <PublishDocumentForm />
        </div>
      </PortfolioLayout>
    </ModuleGuard>
  )
}
