"use client"

import { useEffect, useState } from "react"
import { CiGrid41 } from "react-icons/ci"
import { ChevronDown } from "lucide-react"
import { AppSwitcherDropdown } from "./app-switcher-dropdown"
import { MODULE_CONFIG, getModuleById } from "@/lib/config/modules"

declare global {
  interface Window {
    __openArcusAppSwitcher?: () => void
  }
}

const HEADER_SWITCHER_SELECTOR = [
  "[data-action='module-switcher']",
  "[data-arcus-modules]",
  "#appLauncher",
  ".app-launcher",
  ".app-launcher-top",
].join(", ")

/**
 * App Switcher host for client-design modules (SharedTopbar removed).
 * Opens from in-header controls via click delegation / window.__openArcusAppSwitcher.
 */
export function ClientDesignAppSwitcher({
  currentModule,
  showHeaderButton = true,
}: {
  currentModule: string
  /** When false, only wire existing header buttons (no floating fallback). */
  showHeaderButton?: boolean
}) {
  const [open, setOpen] = useState(false)
  const moduleName = getModuleById(currentModule)?.name ?? "Modules"

  const handleModuleSelect = (module: string) => {
    const moduleConfig = MODULE_CONFIG.find((m) => m.id === module)
    if (moduleConfig) window.location.href = moduleConfig.path
  }

  useEffect(() => {
    const openSwitcher = () => setOpen(true)
    window.__openArcusAppSwitcher = openSwitcher

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target?.closest) return
      const hit = target.closest(HEADER_SWITCHER_SELECTOR)
      if (!hit) return
      event.preventDefault()
      event.stopPropagation()
      openSwitcher()
    }

    document.addEventListener("click", onClick, true)
    return () => {
      document.removeEventListener("click", onClick, true)
      if (window.__openArcusAppSwitcher === openSwitcher) {
        delete window.__openArcusAppSwitcher
      }
    }
  }, [])

  return (
    <>
      {showHeaderButton && (
        <button
          type="button"
          data-arcus-modules
          onClick={() => setOpen(true)}
          className="fixed top-3 right-3 z-[90] inline-flex h-10 items-center gap-2 rounded-full border border-black/10 bg-white/95 px-3.5 text-sm font-medium text-[#0F172A] shadow-md backdrop-blur-md transition hover:bg-white"
          aria-label="Open module switcher"
          title="Switch module"
        >
          <CiGrid41 size={18} className="text-[#2563eb]" />
          <span className="max-w-[140px] truncate hidden sm:inline">{moduleName}</span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        </button>
      )}
      <AppSwitcherDropdown
        isOpen={open}
        onClose={() => setOpen(false)}
        onModuleSelect={handleModuleSelect}
        currentModule={currentModule}
      />
    </>
  )
}
