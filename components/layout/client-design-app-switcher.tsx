"use client"

import { useEffect, useState } from "react"
import { ModuleSwitcherButton } from "./module-switcher-button"
import {
  ArcusAppSwitcherProvider,
  useArcusAppSwitcher,
} from "./arcus-app-switcher-provider"
import "./arcus-header-overrides.css"

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

function ClientDesignAppSwitcherInner({
  showHeaderButton = true,
  currentModule,
}: {
  currentModule: string
  showHeaderButton?: boolean
}) {
  const appSwitcher = useArcusAppSwitcher()

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target?.closest) return
      const hit = target.closest(HEADER_SWITCHER_SELECTOR)
      if (!hit) return
      event.preventDefault()
      event.stopPropagation()
      appSwitcher?.openSwitcher() ?? window.__openArcusAppSwitcher?.()
    }

    document.addEventListener("click", onClick, true)
    return () => document.removeEventListener("click", onClick, true)
  }, [appSwitcher])

  if (!showHeaderButton) return null

  return (
    <ModuleSwitcherButton
      currentModule={currentModule}
      onClick={() => appSwitcher?.openSwitcher() ?? window.__openArcusAppSwitcher?.()}
      className="fixed top-3 right-3 z-[90] shadow-md backdrop-blur-md"
    />
  )
}

/**
 * Wires in-shell mock header buttons to the shared Arcus app switcher.
 * Dropdown is rendered once by ArcusAppSwitcherProvider (same design as Investments).
 */
export function ClientDesignAppSwitcher({
  currentModule,
  showHeaderButton = true,
}: {
  currentModule: string
  /** When false, only wire existing header buttons (no floating fallback). */
  showHeaderButton?: boolean
}) {
  const parent = useArcusAppSwitcher()

  if (parent) {
    return (
      <ClientDesignAppSwitcherInner
        currentModule={currentModule}
        showHeaderButton={showHeaderButton}
      />
    )
  }

  return (
    <ArcusAppSwitcherProvider currentModule={currentModule}>
      <ClientDesignAppSwitcherInner
        currentModule={currentModule}
        showHeaderButton={showHeaderButton}
      />
    </ArcusAppSwitcherProvider>
  )
}
