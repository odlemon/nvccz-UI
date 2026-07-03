"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { SharedTopbar } from "./shared-topbar"
import { MODULE_CONFIG, getModuleByPath } from "@/lib/config/modules"
import { LpPortalSidebar } from "./lp-portal-sidebar"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"
import { toast } from "sonner"

interface LpPortalLayoutProps {
  children: React.ReactNode
}

export function LpPortalLayout({ children }: LpPortalLayoutProps) {
  const [currentModule, setCurrentModule] = useState("lp-portal")
  const pathname = usePathname()
  const router = useRouter()
  const { hasModuleAccess, isLoading, isAuthenticated } = useRolePermissions()

  // Real RBAC gating (LIMITED_PARTNER role) rather than Application Portal's
  // hardcoded string-role + force-logout — see plan §B.3 for the rationale.
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

  useEffect(() => {
    const module = getModuleByPath(pathname)
    if (module) {
      setCurrentModule(module.id)
    }
  }, [pathname])

  const handleModuleSelect = (module: string) => {
    setCurrentModule(module)
    const moduleConfig = MODULE_CONFIG.find((m) => m.id === module)
    if (moduleConfig) {
      window.location.href = moduleConfig.path
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SharedTopbar onModuleSelect={handleModuleSelect} currentModule={currentModule} />

      <div className="flex">
        <LpPortalSidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
