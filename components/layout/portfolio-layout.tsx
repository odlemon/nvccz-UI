"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { SharedTopbar } from "./shared-topbar"
import { PortfolioSidebar } from "./portfolio-sidebar"
import { MODULE_CONFIG, getModuleByPath } from "@/lib/config/modules"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface PortfolioLayoutProps {
  children: React.ReactNode
}

export function PortfolioLayout({ children }: PortfolioLayoutProps) {
  const [currentModule, setCurrentModule] = useState("portfolio-management")
  const pathname = usePathname()
  const router = useRouter()
  const { canAccessModule } = useRolePermissions()

  // Check if user has access to portfolio module
  const hasAccess = canAccessModule('portfolio-management')

  useEffect(() => {
    const module = getModuleByPath(pathname)
    if (module) {
      setCurrentModule(module.id)
    }
  }, [pathname])

  const handleModuleSelect = (module: string) => {
    console.log('PortfolioLayout handleModuleSelect called with:', module)
    setCurrentModule(module)
    
    const moduleConfig = MODULE_CONFIG.find(m => m.id === module)
    if (moduleConfig) {
      console.log('Navigating to:', moduleConfig.path)
      window.location.href = moduleConfig.path
    }
  }

  // Redirect unauthorized users
  useEffect(() => {
    if (!hasAccess) {
      router.push('/unauthorized')
    }
  }, [hasAccess, router])

  // Show nothing while redirecting
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access the Portfolio Management module.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <SharedTopbar onModuleSelect={handleModuleSelect} currentModule={currentModule} />

      <div className="flex">
        <PortfolioSidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
