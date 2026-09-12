"use client"

import { useEffect } from "react"
import { ORG_LOGO_PATH, ORG_NAME, IS_CUSTOM_BRAND } from "@/lib/branding"

/**
 * "-mock" vendored runtimes each bake in their own Matanho logo at extraction
 * time -- a data: URI, a /<module>/assets/matanho-logo.png path, whatever the
 * original template shipped with. There's no shared id/class across them and
 * no config hook to pass a logo in (unlike portfolio-v11, which does expose
 * one), so on a custom-branded deployment (NVCCZ) this walks the DOM and
 * swaps every image whose alt text says "Matanho" for the configured org
 * logo. Re-applies on every re-render: these mocks rebuild their own markup
 * on route/state changes, which would otherwise put the Matanho image back.
 *
 * No-op entirely when IS_CUSTOM_BRAND is false, so dev (Matanho branding)
 * is untouched.
 */
export function useBrandLogoOverride() {
  useEffect(() => {
    if (!IS_CUSTOM_BRAND) return

    const orgInitial = ORG_NAME.trim().charAt(0).toUpperCase() || "M"

    const apply = () => {
      document.querySelectorAll("img").forEach((img) => {
        if (!img.alt?.toLowerCase().includes("matanho")) return
        if (img.getAttribute("src") === ORG_LOGO_PATH) return
        img.src = ORG_LOGO_PATH
        img.alt = ORG_NAME
      })

      // Compact/collapsed sidebar state: a plain-text single-letter mark
      // ("m"), not an <img>, shown instead of the full logo -- e.g.
      // <div class="brand-mark" aria-label="Matanho compact logo">m</div>.
      // Some templates drop the aria-label, so match on the class plus a
      // lowercase-single-letter shape rather than requiring it.
      document.querySelectorAll(".brand-mark, [aria-label*=\"Matanho\" i]").forEach((el) => {
        if (!(el instanceof HTMLElement)) return
        if (el.children.length > 0) return
        const text = el.textContent?.trim() ?? ""
        if (text.length > 0 && text.length <= 2 && text === text.toLowerCase()) {
          el.textContent = orgInitial
          el.setAttribute("aria-label", `${ORG_NAME} compact logo`)
        }
      })
    }

    apply()

    let scheduled = false
    const scheduleApply = () => {
      if (scheduled) return
      scheduled = true
      requestAnimationFrame(() => {
        scheduled = false
        apply()
      })
    }

    const observer = new MutationObserver(scheduleApply)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])
}
