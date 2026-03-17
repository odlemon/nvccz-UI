"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { SharedTopbar } from "./shared-topbar"
import { AccountingSidebar } from "./accounting-sidebar"
import { MODULE_CONFIG, getModuleByPath } from "@/lib/config/modules"
import { useDispatch } from "react-redux"
import { fetchCurrencies } from "@/lib/store/slices/accountingSlice"
import type { AppDispatch } from "@/lib/store/store"
import { CurrencyFilter } from "../accounting/CurrencyFilter"

interface AccountingLayoutProps {
  children: React.ReactNode
}

export function AccountingLayout({ children }: AccountingLayoutProps) {
  const [currentModule, setCurrentModule] = useState("accounting")
  const pathname = usePathname()
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    const module = getModuleByPath(pathname)
    if (module) {
      setCurrentModule(module.id)
    }
  }, [pathname])

  useEffect(() => {
    dispatch(fetchCurrencies())
  }, [dispatch])

  const handleModuleSelect = (module: string) => {
    console.log('AccountingLayout handleModuleSelect called with:', module)
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
        <AccountingSidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
