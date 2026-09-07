"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { SharedTopbar } from "./shared-topbar"
import { AdminSidebar } from "./admin-sidebar"
import { MODULE_CONFIG, getModuleByPath } from "@/lib/config/modules"

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [currentModule, setCurrentModule] = useState("admin-management")
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const module = getModuleByPath(pathname)
    if (module) {
      setCurrentModule(module.id)
    }
  }, [pathname])

  // Close the mobile drawer on navigation.
  useEffect(() => {
    setMobileSidebarOpen(false)
  }, [pathname])

  const handleModuleSelect = (module: string) => {
    setCurrentModule(module)
    const moduleConfig = MODULE_CONFIG.find(m => m.id === module)
    if (moduleConfig) {
      window.location.href = moduleConfig.path
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SharedTopbar onModuleSelect={handleModuleSelect} currentModule={currentModule} />

      <div className="flex">
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          className="md:hidden fixed top-24 left-3 z-10 flex items-center gap-2 rounded-full bg-white border border-border shadow-sm px-3 py-2 text-sm font-medium text-gray-800"
          aria-label="Open Admin Management menu"
        >
          <Menu className="w-4 h-4" />
          Menu
        </button>
        <AdminSidebar mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)} />
        <main className="flex-1 overflow-auto pt-12 md:pt-0">
          {children}
        </main>
      </div>
    </div>
  )
}
