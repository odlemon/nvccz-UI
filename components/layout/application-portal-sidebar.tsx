"use client"

import { useEffect, useMemo } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { getModuleById } from "@/lib/config/modules"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchDashboard } from "@/lib/store/slices/applicationPortalSlice"

// Sub-modules that are always visible regardless of investment status.
const ALWAYS_VISIBLE: ReadonlySet<string> = new Set([
  "application-dashboard",
  "application-details",
  "term-sheets",
])

// Sub-modules unlocked once the company has received investment
// (dashboard.hasReceivedInvestment === true).
const INVESTMENT_GATED: ReadonlySet<string> = new Set([
  "portfolio-company",
  "investment-details",
  "drawdown",
  "grn",
  "valuations",
  "reports",
  "application-portal-settings",
])

export function ApplicationPortalSidebar() {
  const pathname = usePathname()
  const dispatch = useAppDispatch()
  const { dashboard, dashboardLoading } = useAppSelector(
    (state) => state.applicationPortal,
  )

  const module = getModuleById("application-portal")

  // Lazy-fetch the dashboard once so the sidebar can gate links even when
  // the user deep-links to a sub-page without first visiting the dashboard.
  useEffect(() => {
    if (!dashboard && !dashboardLoading) {
      dispatch(fetchDashboard())
    }
  }, [dashboard, dashboardLoading, dispatch])

  const isPathActive = (path: string) => pathname === path

  const hasReceivedInvestment = useMemo(() => {
    return Boolean(
      (dashboard as any)?.hasReceivedInvestment ||
      (dashboard as any)?.summary?.hasReceivedInvestment
    )
  }, [dashboard])

  const visibleSubModules = useMemo(() => {
    if (!module) return []
    return module.subModules.filter((sub) => {
      if (ALWAYS_VISIBLE.has(sub.id)) return true
      if (INVESTMENT_GATED.has(sub.id)) return hasReceivedInvestment
      return true
    })
  }, [module, hasReceivedInvestment])

  if (!module) {
    return null
  }

  return (
    <aside className="w-64 bg-white border-r border-border h-[calc(100vh-5rem)] overflow-y-auto sticky top-20 z-10">
      <div className="p-4 space-y-4">
        {/* Module Header */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-purple-100">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: module.color }}
          >
            <module.icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">{module.name}</h2>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="space-y-1">
          {visibleSubModules.map((subModule) => {
            const Icon = subModule.icon
            const active = isPathActive(subModule.path)
            return (
              <Link
                key={subModule.id}
                href={subModule.path}
                className={cn(
                  "flex items-center gap-3 h-9 cursor-pointer rounded-full transition-all duration-200 text-gray-800 px-3",
                  !active && "hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 hover:rounded-full",
                  active && "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg rounded-full hover:from-purple-600 hover:to-purple-700",
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-normal">{subModule.name}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
