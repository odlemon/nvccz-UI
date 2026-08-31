"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { ApplicationPortalSidebar } from "./application-portal-sidebar"
import { SharedTopbar } from "./shared-topbar"
import { MODULE_CONFIG, getModuleByPath } from "@/lib/config/modules"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { logoutUser } from "@/lib/store/slices/authSlice"
import { toast } from "sonner"

interface ApplicationPortalLayoutProps {
  children: React.ReactNode
}

export function ApplicationPortalLayout({ children }: ApplicationPortalLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { user, userDetails, isFetchingDetails, isAuthenticated } = useAppSelector((state) => state.auth)

  const [currentModule, setCurrentModule] = useState("application-portal")

  useEffect(() => {
    const module = getModuleByPath(pathname)
    if (module) setCurrentModule(module.id)
  }, [pathname])

  const handleModuleSelect = (module: string) => {
    setCurrentModule(module)
    const moduleConfig = MODULE_CONFIG.find((m) => m.id === module)
    if (moduleConfig) window.location.href = moduleConfig.path
  }

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login")
      return
    }
    if (isFetchingDetails) return
    if (!user && !userDetails) return

    const role = (userDetails?.roleCode || user?.role || "").toString().toLowerCase()
    if (role !== "applicant") {
      toast.error("This portal is for investee applicants only.")
      dispatch(logoutUser()).finally(() => router.replace("/login"))
    }
  }, [isAuthenticated, isFetchingDetails, user, userDetails, dispatch, router, pathname])

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SharedTopbar onModuleSelect={handleModuleSelect} currentModule={currentModule} />
      <div className="flex flex-1 min-h-0">
        <ApplicationPortalSidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
