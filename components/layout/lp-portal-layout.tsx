"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { LpPortalTopbar } from "./lp-portal-topbar"
import { LpPortalSidebar } from "./lp-portal-sidebar"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"
import { toast } from "sonner"

interface LpPortalLayoutProps {
  children: React.ReactNode
}

export function LpPortalLayout({ children }: LpPortalLayoutProps) {
  const router = useRouter()
  const { hasModuleAccess, isLoading, isAuthenticated } = useRolePermissions()
  const canAccessPortal = isAuthenticated && hasModuleAccess("lp-portal")

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.replace("/login")
      return
    }
    if (!hasModuleAccess("lp-portal")) {
      toast.error("You do not have access to the LP Portal.")
      router.replace("/")
    }
  }, [isLoading, isAuthenticated, hasModuleAccess, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="size-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
      </div>
    )
  }

  if (!canAccessPortal) return null

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <LpPortalTopbar />
      <div className="flex h-[calc(100vh-3.5rem)] min-h-0 sm:h-[calc(100vh-4rem)]">
        <div className="hidden h-full lg:block">
          <LpPortalSidebar />
        </div>
        <main className="min-w-0 flex-1 overflow-y-auto bg-[#f5f7fb]">
          <div className="mx-auto min-h-full w-full max-w-[1500px] p-3 lg:p-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
