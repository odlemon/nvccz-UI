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
  refusedOpener,
  NOT_YET_LIVE_ACTIONS,
} from "@/lib/procurement-v23/actions"
import { getAuthToken } from "@/lib/utils/cookies"
import "@/components/procurement-v23-mock/procurement-v23.css"
import "@/components/procurement-v23-mock/procurement-v23-live.css"

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

/**
 * The last live payload, kept across remounts of this host for the same sign-in.
 *
 * RouteTransition in the root layout keys the page on its pathname, so every sidebar navigation
 * unmounts this host and starts a new runtime. Without this, each page opened with no records and
 * no grants for as long as the loaders took (4-5 s on dev): pages were not gated, and a Procurement
 * Manager's "Upload invoice" opened AI Invoice Capture instead of being refused. The copy is shown
 * at once and replaced by a fresh load straight away, and it is only ever shown to the same token.
 */
let lastLive: { token: string; payload: ProcurementV23LivePayload } | null = null

/**
 * A load failure worth telling the user about, without the server's internals. A database or ORM
 * message ("Invalid `prisma.x.count()` invocation: Can't reach database server…") means nothing to
 * them and names the infrastructure; say what they can do instead.
 */
function readableLoadError(message: string | undefined): string {
  const text = String(message ?? "").trim()
  if (!text || /prisma|invocation|database server|ECONNREFUSED|ETIMEDOUT|P\d{4}|stack|at \w+ \(/i.test(text)) {
    return "the server could not read it just now; try again shortly"
  }
  return text.length > 160 ? `${text.slice(0, 157)}…` : text
}

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
    let hydrated = false
    let appliedKey = ""

    const applyLive = (payload: ProcurementV23LivePayload) => {
      const firstForRuntime = !hydrated
      // The runtime redraws the whole page on hydrate. A new host shows the last payload at once and the fresh
      // load lands a few seconds later; when nothing changed, redrawing then only wiped what the person had
      // started typing (bid scores) and pulled buttons out from under the pointer.
      const key = JSON.stringify([payload.hydrate, payload.kpis, payload.navCounts, payload.access])
      if (!firstForRuntime && key === appliedKey) {
        liveRef.current = payload
        return
      }
      appliedKey = key
      hydrated = true
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
      // requisitions. The runtime decided it from its demo user's role; after the first hydrate of
      // this runtime the user's own tab choice is kept.
      const approvesRequisitions =
        payload.access?.departmentRole === "HEAD" || payload.access?.departmentRole === "DEPUTY"
      runtimeUi()?.hydrate?.(
        firstForRuntime
          ? { ...payload.hydrate, prViewV11: approvesRequisitions ? "approver" : "requester" }
          : payload.hydrate,
      )
    }

    const loadLive = () => {
      void loadProcurementV23LiveData()
        .then((payload) => {
          if (disposed) return
          applyLive(payload)
          const token = getAuthToken()
          lastLive = token ? { token, payload } : null

          // A 403 is expected on a register the role cannot see; anything else is a failure
          // worth saying out loud rather than rendering a quietly empty page.
          const hard = payload.errors.filter((e) => e.status !== 403)
          if (hard.length) {
            toast.error(
              hard.length === 1 ? `Could not load ${hard[0].source}` : `Could not load ${hard.length} procurement data sources`,
              { description: hard.map((e) => `${e.source}: ${readableLoadError(e.message)}`).slice(0, 4).join(" · ") },
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
      const refusal = refusedOpener(action, liveRef.current)
      if (refusal) {
        event.preventDefault()
        event.stopImmediatePropagation()
        toast.error(refusal)
        return
      }
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
    // A role without the Command Centre is sent on to the first page it can open (the bridge picks it). Replaced,
    // not pushed, so Back does not land on the Command Centre only to be sent on again.
    ;(window as unknown as { __PR23_REPLACE__?: (page: string) => void }).__PR23_REPLACE__ = (page: string) => {
      const path = PR23_PAGE_TO_PATH[page]
      if (path && pathnameRef.current !== path) router.replace(path)
    }

    // The runtime rendered its vendored demo dataset synchronously. Replace it before the
    // browser paints, so no demo record is ever shown as if it were the organisation's.
    runtimeUi()?.hydrate?.(EMPTY_PROCUREMENT_HYDRATE)
    // Arriving from another procurement page: show what that page last loaded, grants included,
    // while the fresh load below runs.
    const token = getAuthToken()
    if (lastLive && token && lastLive.token === token) applyLive(lastLive.payload)
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
