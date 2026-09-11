"use client"

import { useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  pathToPr23Page,
  PR23_PAGE_TO_PATH,
} from "@/lib/procurement-v23-mock/nav"
import { startProcurementV23Runtime } from "@/components/procurement-v23-mock/matanho-procurement-runtime"
import { PROCUREMENT_V23_SHELL_HTML } from "@/components/procurement-v23-mock/shell"
import {
  EMPTY_PROCUREMENT_HYDRATE,
  loadProcurementV23LiveData,
  type ProcurementV23LivePayload,
} from "@/lib/procurement-v23/live-loaders"
import {
  handleProcurementV23Action,
  isUnconnectedWrite,
  LIVE_ACTIONS,
  NOT_YET_LIVE_ACTIONS,
} from "@/lib/procurement-v23/actions"
import "@/components/procurement-v23-mock/procurement-v23.css"

type RuntimeApi = {
  setPage: (page: string) => void
  destroy: () => void
}

/**
 * Action ids claimed before the runtime sees them: those wired to the API, and the write
 * actions that are refused until they are (lib/procurement-v23/actions.ts). Everything else
 * keeps the runtime's own behaviour.
 */
const API_ACTIONS = new Set<string>([...LIVE_ACTIONS, ...NOT_YET_LIVE_ACTIONS])

type ProcurementUi = {
  hydrate?: (payload: Record<string, unknown>) => unknown
}

const runtimeUi = () => (window as unknown as { MatanhoProcurementUI?: ProcurementUi }).MatanhoProcurementUI

export function ProcurementV23App() {
  const rootRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<RuntimeApi | null>(null)
  const liveRef = useRef<ProcurementV23LivePayload | null>(null)
  const busyRef = useRef(false)
  const pathname = usePathname()
  const router = useRouter()
  const pathnameRef = useRef(pathname)
  pathnameRef.current = pathname

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    let disposed = false

    const loadLive = () => {
      void loadProcurementV23LiveData()
        .then((payload) => {
          if (disposed) return
          const firstLoad = liveRef.current === null
          liveRef.current = payload
          // Read by the runtime bridge (__pr23Kpi, __pr23NavCount) on the render hydrate triggers.
          ;(window as unknown as { __pr23Live?: unknown }).__pr23Live = {
            kpis: payload.kpis,
            navCounts: payload.navCounts,
            access: payload.access,
            // The accounts a payment can be made from, for the bridge's Record payment form.
            banks: payload.banks ?? [],
          }
          // The requisitions page opens on the approver queue only for someone who approves
          // requisitions. The runtime decided it from its demo user's role; after the first load
          // the user's own tab choice is kept.
          const approvesRequisitions =
            payload.access?.departmentRole === "HEAD" || payload.access?.departmentRole === "DEPUTY"
          runtimeUi()?.hydrate?.(
            firstLoad
              ? { ...payload.hydrate, prViewV11: approvesRequisitions ? "approver" : "requester" }
              : payload.hydrate,
          )

          // A 403 is expected on a register the role cannot see; anything else is a failure
          // worth saying out loud rather than rendering a quietly empty page.
          const hard = payload.errors.filter((e) => e.status !== 403)
          if (hard.length) {
            toast.error(
              hard.length === 1 ? `Could not load ${hard[0].source}` : `Could not load ${hard.length} procurement data sources`,
              { description: hard.map((e) => `${e.source}: ${e.message}`).slice(0, 4).join(" · ") },
            )
          }
        })
        .catch((err) => {
          if (disposed) return
          toast.error("Procurement data could not be loaded", { description: err?.message ?? "Unknown error" })
        })
    }

    // Registered BEFORE the runtime starts. Window capture listeners run before any document
    // listener and in registration order, so this sees every [data-action] click ahead of the
    // runtime's own dispatchers and can keep their demo handlers from running.
    const onClick = (event: MouseEvent) => {
      const control = (event.target as Element | null)?.closest?.("[data-action]") as HTMLElement | null
      if (!control) return
      const action = control.dataset.action || ""
      if (!API_ACTIONS.has(action) && !isUnconnectedWrite(action)) return
      event.preventDefault()
      event.stopImmediatePropagation()
      if (busyRef.current) return
      busyRef.current = true

      void handleProcurementV23Action({ action, dataset: { ...control.dataset } }, { live: liveRef.current })
        .then((result) => {
          if (!result.handled) return
          if (result.error) toast.error(result.error)
          if (result.message) toast.success(result.message)
          if (result.reload) loadLive()
        })
        .catch((err) => toast.error(err?.message ?? "Procurement action failed"))
        .finally(() => {
          busyRef.current = false
        })
    }
    window.addEventListener("click", onClick, true)

    // Live mode from the first paint: literal KPI figures render as dashes and fixture badge
    // counts are hidden until the loaders supply real ones.
    ;(window as unknown as { __pr23Live?: unknown }).__pr23Live = { kpis: {}, navCounts: {}, access: null }

    const initialPage = pathToPr23Page(pathnameRef.current)
    apiRef.current = startProcurementV23Runtime(el, {
      shellHtml: PROCUREMENT_V23_SHELL_HTML,
      initialPage,
      onNavigate: (page: string) => {
        const path = PR23_PAGE_TO_PATH[page] || "/procurement-v23"
        if (pathnameRef.current !== path) router.push(path)
      },
    })

    // The runtime rendered its vendored demo dataset synchronously. Replace it before the
    // browser paints, so no demo record is ever shown as if it were the organisation's.
    runtimeUi()?.hydrate?.(EMPTY_PROCUREMENT_HYDRATE)
    loadLive()

    const onReload = () => loadLive()
    window.addEventListener("procurement-v23:reload-request", onReload)

    return () => {
      disposed = true
      window.removeEventListener("click", onClick, true)
      window.removeEventListener("procurement-v23:reload-request", onReload)
      delete (window as unknown as { __pr23Live?: unknown }).__pr23Live
      apiRef.current?.destroy()
      apiRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    apiRef.current?.setPage(pathToPr23Page(pathname))
  }, [pathname])

  return (
    <div
      ref={rootRef}
      className="procurement-v23-root h-full"
    />
  )
}
