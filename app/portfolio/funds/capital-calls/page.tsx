"use client"

import { PortfolioLayout } from "@/components/layout/portfolio-layout"
import { CapitalCallsList } from "@/components/portfolio/funds/capital-calls/capital-calls-list"
import { ModuleGuard } from "@/components/permissions/PermissionGuards"

export default function CapitalCallsPage() {
  return (
    <ModuleGuard moduleId="portfolio-management" subModuleId="capital-calls">
      <PortfolioLayout>
        <CapitalCallsList />
      </PortfolioLayout>
    </ModuleGuard>
  )
}
