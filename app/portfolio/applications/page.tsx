"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { PortfolioLayout } from "@/components/layout/portfolio-layout"
import { UserApplications } from "@/components/applications/user-applications"
import { ModuleGuard } from "@/components/permissions/PermissionGuards"

export default function ApplicationsPage() {
  return (
    <ModuleGuard moduleId="portfolio-management" subModuleId="applications">
      <PortfolioLayout>
        <UserApplications />
      </PortfolioLayout>
    </ModuleGuard>
  )
}