"use client"

import { useEffect } from "react"
import { useDispatch } from "react-redux"
import { PortfolioLayout } from "@/components/layout/portfolio-layout"
import { ApplicationsDashboard } from "@/components/applications/applications-dashboard"
import { fetchApplications } from "@/lib/store/slices/applicationSlice"
import { AppDispatch } from "@/lib/store/store"
import { ModuleGuard } from "@/components/permissions/PermissionGuards"

export default function ApplicationsDashboardPage() {
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    dispatch(fetchApplications())
  }, [dispatch])

  return (
    <ModuleGuard moduleId="portfolio-management" subModuleId="applications-dashboard">
      <PortfolioLayout>
        <ApplicationsDashboard />
      </PortfolioLayout>
    </ModuleGuard>
  )
}
