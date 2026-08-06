"use client"

import { useState } from "react"
import { CiGrid41 } from "react-icons/ci"
import { AppSwitcherDropdown } from "./app-switcher-dropdown"
import { MODULE_CONFIG } from "@/lib/config/modules"

/**
 * Floating App Switcher for client-design modules that render their own header
 * (SharedTopbar removed to avoid duplicate chrome).
 */
export function ClientDesignAppSwitcher({ currentModule }: { currentModule: string }) {
  const [open, setOpen] = useState(false)

  const handleModuleSelect = (module: string) => {
    const moduleConfig = MODULE_CONFIG.find((m) => m.id === module)
    if (moduleConfig) window.location.href = moduleConfig.path
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-[90] flex h-12 w-12 items-center justify-center rounded-full bg-[#0B1739] text-white shadow-lg shadow-black/20 transition hover:scale-105 hover:bg-[#152a55]"
        aria-label="Open app switcher"
        title="Switch module"
      >
        <CiGrid41 size={24} />
      </button>
      <AppSwitcherDropdown
        isOpen={open}
        onClose={() => setOpen(false)}
        onModuleSelect={handleModuleSelect}
        currentModule={currentModule}
      />
    </>
  )
}
