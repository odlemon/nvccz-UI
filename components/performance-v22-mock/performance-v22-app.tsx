"use client"

import { useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  pathToPm22Page,
  PM22_PAGE_TO_PATH,
} from "@/lib/performance-v22-mock/nav"
import { startPerformanceV22Runtime } from "@/components/performance-v22-mock/matanho-performance-runtime"
import { PERFORMANCE_V22_SHELL_HTML } from "@/components/performance-v22-mock/shell"
import {
  API_ACTIONS,
  runPerformanceAction,
  submitContract,
  submitGoal,
  submitKpi,
  submitScorecardNote,
  submitScorecardEvidence,
  submitScorecardPublish,
  submitGoalProgress,
  type BeforeActionDetail,
} from "@/lib/performance-v22-mock/actions"
import {
  fetchEmployeeScorecard,
  fetchScorecardEntriesForCache,
  publishPerformanceLiveData,
} from "@/lib/performance-v22-mock/bridge"
import { resolvePerfAccess } from "@/lib/performance-v22-mock/access"
import { getUserProfile, getAuthUser } from "@/lib/utils/cookies"
import "@/components/performance-v22-mock/performance-v22.css"
import "@/components/performance-v22-mock/performance-v22-overrides.css"

type RuntimeApi = {
  setPage: (page: string) => void
  destroy: () => void
}

export function PerformanceV22App() {
  const rootRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<RuntimeApi | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const pathnameRef = useRef(pathname)
  pathnameRef.current = pathname

  useEffect(() => {
    const el = rootRef.current
    if (!el) return

    const initialPage = pathToPm22Page(pathnameRef.current)
    apiRef.current = startPerformanceV22Runtime(el, {
      shellHtml: PERFORMANCE_V22_SHELL_HTML,
      initialPage,
      onNavigate: (page: string) => {
        const path = PM22_PAGE_TO_PATH[page] || "/performance"
        if (pathnameRef.current !== path) router.push(path)
      },
    })

    // ---- live-data bridge -------------------------------------------------
    // The runtime dispatches a cancelable `matanho:before-action` from its single central
    // handle() dispatcher (see scripts/patch-performance-runtime.mjs). Calling
    // preventDefault() suppresses the runtime's mock handler, so exactly one of the two
    // runs — never both. Mirrors investee-portal-v8-app.tsx / portfolio-v11-app.tsx.
    const onBeforeAction = (event: Event) => {
      const detail = (event as CustomEvent).detail as BeforeActionDetail | undefined
      const action = detail?.action
      if (!action) return
      if (!API_ACTIONS.has(action) && !action.startsWith("api-")) return

      // Taking ownership: the mock must not also mutate local state.
      event.preventDefault()
      void runPerformanceAction(detail as BeforeActionDetail).then((result) => {
        if (!result.ok) console.error("[performance-v22] action failed:", action, result.error)
      })
    }
    window.addEventListener("matanho:before-action", onBeforeAction)

    // Resolve the SIGNED-IN user's real access and publish it before any data loads, so the
    // first paint is already scoped to them rather than to a demo role. This is what
    // replaces the runtime's `#roleSelect` demo dropdown — see lib/performance-v22-mock/access.ts.
    try {
      const profile = getUserProfile() ?? getAuthUser()
      const access = resolvePerfAccess(profile)
      const bridge = (window as any).__PERF_LIVE__
      if (bridge) bridge.access = access
      window.dispatchEvent(new CustomEvent("matanho:access", { detail: access }))
    } catch (err) {
      console.error("[performance-v22] could not resolve user access:", err)
    }

    // Load real data once and publish it on the global the render layers read. The layers
    // are scope-isolated IIFEs that cannot see each other or this module, so a window
    // global is the only channel available (performance-module-map.md §5, §13.6).
    //
    // The same publisher runs again after every successful write (see actions.ts), so the
    // initial paint and a post-write refresh are byte-for-byte the same code path — there is
    // no second, optimistic way for state to reach the UI.
    void publishPerformanceLiveData().catch((err) =>
      console.error("[performance-v22] live load failed:", err),
    )

    // On-demand employee-scorecard drill (Employee Scorecards tab, a colleague other than
    // the signed-in user). One in-flight fetch per id at a time, so the runtime can call
    // this on every render without spamming the same request while the first is pending.
    const inFlight = new Set<string>()
    ;(window as any).__PERF_FETCH_EMPLOYEE_SCORECARD__ = (employeeId: string) => {
      if (!employeeId || inFlight.has(employeeId)) return
      inFlight.add(employeeId)
      void fetchEmployeeScorecard(employeeId)
        .catch((err) => console.error("[performance-v22] employee scorecard fetch failed:", err))
        .finally(() => inFlight.delete(employeeId))
    }

    // Direct host hooks for forms wired through the module's OLDER page-local dispatchers
    // (KPI Management, goal creation, Performance Contracts) rather than the central
    // `handle()`/`matanho:before-action` path — see the header comment in actions.ts.
    ;(window as any).__PERF_SUBMIT_KPI__ = submitKpi
    ;(window as any).__PERF_SUBMIT_GOAL__ = submitGoal
    ;(window as any).__PERF_SUBMIT_CONTRACT__ = submitContract
    ;(window as any).__PERF_SUBMIT_SCORECARD_NOTE__ = submitScorecardNote
    ;(window as any).__PERF_SUBMIT_SCORECARD_EVIDENCE__ = submitScorecardEvidence
    ;(window as any).__PERF_SUBMIT_SCORECARD_PUBLISH__ = submitScorecardPublish
    ;(window as any).__PERF_SUBMIT_GOAL_PROGRESS__ = submitGoalProgress

    const entriesInFlight = new Set<string>()
    ;(window as any).__PERF_FETCH_SCORECARD_ENTRIES__ = (employeeId: string, period: string) => {
      const key = `${employeeId}|${period}`
      if (!employeeId || !period || entriesInFlight.has(key)) return
      entriesInFlight.add(key)
      void fetchScorecardEntriesForCache(employeeId, period)
        .catch((err) => console.error("[performance-v22] scorecard entries fetch failed:", err))
        .finally(() => entriesInFlight.delete(key))
    }

    return () => {
      delete (window as any).__PERF_SUBMIT_KPI__
      delete (window as any).__PERF_SUBMIT_GOAL__
      delete (window as any).__PERF_SUBMIT_CONTRACT__
      delete (window as any).__PERF_SUBMIT_SCORECARD_NOTE__
      delete (window as any).__PERF_SUBMIT_SCORECARD_EVIDENCE__
      delete (window as any).__PERF_SUBMIT_SCORECARD_PUBLISH__
      delete (window as any).__PERF_SUBMIT_GOAL_PROGRESS__
      delete (window as any).__PERF_FETCH_SCORECARD_ENTRIES__
      delete (window as any).__PERF_FETCH_EMPLOYEE_SCORECARD__
      window.removeEventListener("matanho:before-action", onBeforeAction)
      apiRef.current?.destroy()
      apiRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    apiRef.current?.setPage(pathToPm22Page(pathname))
  }, [pathname])

  return (
    <div
      ref={rootRef}
      className="performance-v22-root h-full w-full"
    />
  )
}
