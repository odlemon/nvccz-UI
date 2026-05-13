"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { SharedTopbar } from "./shared-topbar"
import { AdminSidebar } from "./admin-sidebar"
import { MODULE_CONFIG, getModuleByPath } from "@/lib/config/modules"
import { ApplicationPortalSidebar } from "./application-portal-sidebar"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { logoutUser } from "@/lib/store/slices/authSlice"
import { toast } from "sonner"

interface AdminLayoutProps {
  children: React.ReactNode
}

export function ApplicationPortalLayout({ children }: AdminLayoutProps) {
  const [currentModule, setCurrentModule] = useState("application-portal")
  const pathname = usePathname()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { user, userDetails, isFetchingDetails, isAuthenticated } = useAppSelector(state => state.auth)

  // Enforce: only "applicant" role can access the application portal.
  // Any other authenticated user landing here is logged out and redirected to /login.
  useEffect(() => {
    if (!isAuthenticated) return
    if (isFetchingDetails) return
    if (!user && !userDetails) return

    const role = (userDetails?.roleCode || user?.role || "").toString().toLowerCase()
    const isApplicant = role === "applicant"
    if (!isApplicant) {
      toast.error("Application portal is restricted to applicants. Logging out.")
      dispatch(logoutUser()).finally(() => {
        router.replace("/login")
      })
    }
  }, [isAuthenticated, isFetchingDetails, user, userDetails, dispatch, router])

  useEffect(() => {
    const module = getModuleByPath(pathname)
    if (module) {
      setCurrentModule(module.id)
    }
  }, [pathname])

  const handleModuleSelect = (module: string) => {
    console.log('ApplicationPortalLayout handleModuleSelect called with:', module)
    setCurrentModule(module)
    
    const moduleConfig = MODULE_CONFIG.find(m => m.id === module)
    if (moduleConfig) {
      console.log('Navigating to:', moduleConfig.path)
      window.location.href = moduleConfig.path
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SharedTopbar onModuleSelect={handleModuleSelect} currentModule={currentModule} />

      <div className="flex">
        <ApplicationPortalSidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
