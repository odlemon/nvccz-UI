"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Topbar } from "./topbar"
import { ModuleSidebar } from "./module-sidebar"
import { MODULE_CONFIG, getModuleByPath } from "@/lib/config/modules"

interface ModuleLayoutProps {
  children: React.ReactNode
}

export function ModuleLayout({ children }: ModuleLayoutProps) {
  const [currentModule, setCurrentModule] = useState("homepage")
  const [activeItem, setActiveItem] = useState("")
  const pathname = usePathname()

  useEffect(() => {
    const module = getModuleByPath(pathname)
    if (module) {
      setCurrentModule(module.id)
    } else {
      setCurrentModule("homepage")
    }
  }, [pathname])

  const handleModuleSelect = (module: string) => {
    console.log('handleModuleSelect called with:', module)
    setCurrentModule(module)
    setActiveItem("")
    
    const moduleConfig = MODULE_CONFIG.find(m => m.id === module)
    if (moduleConfig) {
      console.log('Navigating to:', moduleConfig.path)
      // Use window.location.href for reliable navigation without React Router issues
      window.location.href = moduleConfig.path
    }
  }

  const isHomePage = pathname === "/"

  return (
    <div className="min-h-screen bg-background">
      <Topbar onModuleSelect={handleModuleSelect} currentModule={currentModule} />

      <div className="flex">
        {!isHomePage && (
          <ModuleSidebar 
            currentModule={currentModule} 
            activeItem={activeItem} 
            onItemSelect={setActiveItem} 
          />
        )}

        <main className={`${isHomePage ? 'w-full' : 'flex-1'} overflow-auto`}>
          {children}
        </main>
      </div>
    </div>
  )
}
