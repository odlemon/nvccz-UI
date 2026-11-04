"use client"

import type React from "react"
import { useEffect } from "react"
import { ClientDesignModuleShell } from "@/components/layout/client-design-module-shell"
import { AccountingV52App } from "@/components/accounting-v52-mock/accounting-v52-app"

export function AccountingV52Layout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const sidebarKey = "matanho-v25-sidebar"
    let observedApp: HTMLElement | null = null
    let appObserver: MutationObserver | null = null
    const syncSidebar = () => {
      const app = document.querySelector<HTMLElement>("#app")
      if (!app || app.dataset.v25Init !== "1") return
      let expanded = true
      try {
        const saved = localStorage.getItem(sidebarKey)
        if (saved === null) localStorage.setItem(sidebarKey, "1")
        else expanded = saved === "1"
      } catch {
        /* Keep the expanded default if storage is unavailable. */
      }
      app.classList.toggle("v25-expanded", expanded)
      document.body.classList.toggle("v25-sidebar-open", expanded)
      const toggle = document.querySelector<HTMLButtonElement>("#v25SidebarToggle")
      const icon = toggle?.querySelector<HTMLElement>(".v25-sidebar-icon")
      const iconText = expanded ? "‹" : "›"
      if (icon && icon.textContent !== iconText) icon.innerHTML = expanded ? "&#8249;" : "&#8250;"
      const label = toggle?.querySelector<HTMLElement>(".v25-sidebar-label")
      const labelText = expanded ? "Collapse menu" : "Expand menu"
      if (label && label.textContent !== labelText) label.textContent = labelText
    }
    const observeApp = () => {
      const app = document.querySelector<HTMLElement>("#app")
      if (app !== observedApp) {
        appObserver?.disconnect()
        observedApp = app
        if (app) {
          appObserver = new MutationObserver(syncSidebar)
          appObserver.observe(app, { attributes: true, attributeFilter: ["class", "data-v25-init"] })
        }
      }
      syncSidebar()
    }
    // The embedded runtime can reset the rail during hot reload without
    // remounting this React layout. Restore the saved choice when that happens.
    const bodyObserver = new MutationObserver(observeApp)
    bodyObserver.observe(document.body, { childList: true, subtree: true })
    observeApp()
    let attempts = 0
    const id = setInterval(() => {
      attempts += 1
      observeApp()
      if (observedApp?.dataset.v25Init === "1" || attempts >= 30) clearInterval(id)
    }, 100)
    return () => { clearInterval(id); bodyObserver.disconnect(); appObserver?.disconnect() }
  }, [])

  return (
    <ClientDesignModuleShell
      defaultModuleId="accounting-v52"
      backgroundClassName="bg-transparent"
      loadingFallback={<div className="p-8 text-sm text-[#64748B]">Loading Accounting…</div>}
      mockApp={<AccountingV52App />}
      hideThemeToggle
      hideHomeButton
    >
      {children}
    </ClientDesignModuleShell>
  )
}
