"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { LpPortalTopbar } from "./lp-portal-topbar"
import { LpPortalSidebar } from "./lp-portal-sidebar"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"
import { PORTAL_ID } from "@/lib/portal/config"

interface LpPortalLayoutProps {
  children: React.ReactNode
}

export function LpPortalLayout({ children }: LpPortalLayoutProps) {
  const router = useRouter()
  const { hasModuleAccess, isLoading, isAuthenticated } = useRolePermissions()

  // Dedicated LP deployment: backend already validated portal access at login.
  const canAccessPortal =
    PORTAL_ID === "lp"
      ? isAuthenticated
      : isAuthenticated && hasModuleAccess("lp-portal")

  useEffect(() => {
    const html = document.documentElement
    const { overflow: prevHtml } = html.style
    const { overflow: prevBody } = document.body.style
    html.style.overflow = "hidden"
    document.body.style.overflow = "hidden"
    return () => {
      html.style.overflow = prevHtml
      document.body.style.overflow = prevBody
    }
  }, [])

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.replace("/login")
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading || !canAccessPortal) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb]">
        <div className="size-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
      </div>
    )
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <LpPortalTopbar />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="hidden h-full shrink-0 lg:flex">
          <LpPortalSidebar />
        </div>
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-[#f5f7fb]">
          <div className="mx-auto w-full max-w-[1500px] p-3 lg:p-4">{children}</div>
        </main>
      </div>
    </div>
  )
}
