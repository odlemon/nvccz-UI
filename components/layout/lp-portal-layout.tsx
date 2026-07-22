"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { SharedTopbar } from "./shared-topbar"
import { LpPortalTopbar } from "./lp-portal-topbar"
import { LpPortalSidebar } from "./lp-portal-sidebar"
import { MODULE_CONFIG, getModuleByPath } from "@/lib/config/modules"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"
import { toast } from "sonner"

interface LpPortalLayoutProps {
  children: React.ReactNode
}

export function LpPortalLayout({ children }: LpPortalLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [currentModule, setCurrentModule] = useState("lp-portal")
  const { hasModuleAccess, isLoading, isAuthenticated } = useRolePermissions()
  const canAccessPortal = isAuthenticated && hasModuleAccess("lp-portal")

  useEffect(() => {
    const module = getModuleByPath(pathname)
    if (module) setCurrentModule(module.id)
  }, [pathname])

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

  const handleModuleSelect = (module: string) => {
    setCurrentModule(module)
    const moduleConfig = MODULE_CONFIG.find((m) => m.id === module)
    if (moduleConfig) window.location.href = moduleConfig.path
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
      </div>
    )
  }

  if (!canAccessPortal) return null

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SharedTopbar onModuleSelect={handleModuleSelect} currentModule={currentModule} />
      <LpPortalTopbar />
      <div className="flex min-h-0 flex-1">
        <div className="hidden h-full shrink-0 lg:block">
          <LpPortalSidebar />
        </div>
        <main className="min-w-0 flex-1 overflow-y-auto bg-[#f5f7fb]">
          <div className="mx-auto min-h-full w-full max-w-[1500px] p-3 lg:p-4">{children}</div>
        </main>
      </div>
    </div>
  )
}
