"use client"

import type React from "react"
import { useEffect } from "react"
import { ClientDesignModuleShell } from "@/components/layout/client-design-module-shell"
import { AccountingV52App } from "@/components/accounting-v52-mock/accounting-v52-app"

export function AccountingV52Layout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // The active internal build ("v25") force-collapses its sidebar on every
    // mount regardless of any saved preference -- its own init guard does
    // `app.classList.remove('v25-expanded')` unconditionally the first time
    // `#app` is seen. Put the expanded classes back once that init has run,
    // and sync the toggle button + its own localStorage key so a later
    // manual collapse (and the button's label) still behaves correctly.
    // #app appears synchronously on mount but the runtime's init (and its
    // toggle button) can lag slightly behind, so poll briefly.
    let attempts = 0
    const id = setInterval(() => {
      attempts += 1
      const app = document.querySelector("#app")
      if (app?.dataset.v25Init === "1") {
        app.classList.add("v25-expanded")
        document.body.classList.add("v25-sidebar-open")
        try {
          localStorage.setItem("matanho-v25-sidebar", "1")
        } catch {
          /* ignore */
        }
        const toggle = document.querySelector("#v25SidebarToggle")
        toggle?.querySelector(".v25-sidebar-icon")?.replaceChildren(document.createTextNode("‹"))
        const label = toggle?.querySelector(".v25-sidebar-label")
        if (label) label.textContent = "Collapse menu"
        clearInterval(id)
      } else if (attempts >= 30) {
        clearInterval(id)
      }
    }, 100)
    return () => clearInterval(id)
  }, [])

  return (
    <ClientDesignModuleShell
      defaultModuleId="accounting-v52"
      backgroundClassName="bg-transparent"
      loadingFallback={<div className="p-8 text-sm text-[#64748B]">Loading Accounting…</div>}
      mockApp={<AccountingV52App />}
      hideThemeToggle
    >
      {children}
    </ClientDesignModuleShell>
  )
}
