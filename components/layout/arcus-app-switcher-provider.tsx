"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { AppSwitcherDropdown } from "./arcus-app-switcher-dropdown"
import { AppLoadingSpinner } from "./app-loading-spinner"
import { MODULE_CONFIG } from "@/lib/config/modules"

declare global {
  interface Window {
    __openArcusAppSwitcher?: () => void
  }
}

type ArcusAppSwitcherContextValue = {
  openSwitcher: () => void
}

const ArcusAppSwitcherContext = createContext<ArcusAppSwitcherContextValue | null>(null)

export function useArcusAppSwitcher() {
  return useContext(ArcusAppSwitcherContext)
}

/** Single app-switcher host per layout — Investments-style modal everywhere. */
export function ArcusAppSwitcherProvider({
  currentModule,
  children,
}: {
  currentModule: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [isModuleLoading, setIsModuleLoading] = useState(false)

  const openSwitcher = useCallback(() => setOpen(true), [])

  useEffect(() => {
    window.__openArcusAppSwitcher = openSwitcher
    return () => {
      if (window.__openArcusAppSwitcher === openSwitcher) {
        delete window.__openArcusAppSwitcher
      }
    }
  }, [openSwitcher])

  const handleModuleSelect = (module: string) => {
    const moduleConfig = MODULE_CONFIG.find((m) => m.id === module)
    if (!moduleConfig) return
    setOpen(false)
    setIsModuleLoading(true)
    window.setTimeout(() => {
      window.location.href = moduleConfig.path
    }, 60)
  }

  return (
    <ArcusAppSwitcherContext.Provider value={{ openSwitcher }}>
      {children}
      <AppSwitcherDropdown
        isOpen={open}
        onClose={() => setOpen(false)}
        onModuleSelect={handleModuleSelect}
        currentModule={currentModule}
      />
      {isModuleLoading && (
        <div className="fixed inset-0 z-[100] bg-[#F4F7FC]/85 backdrop-blur-[1px]">
          <AppLoadingSpinner className="h-full min-h-0 w-full" label="Loading module" />
        </div>
      )}
    </ArcusAppSwitcherContext.Provider>
  )
}
