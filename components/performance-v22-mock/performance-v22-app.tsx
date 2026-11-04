"use client"

import { createElement, useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
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
  submitObjectiveCheckIn,
  fetchObjectiveCheckIns,
  uploadObjectiveEvidence,
  submitGovernedKpi,
  fetchKpiRegistryAnalytics,
  transitionGovernedKpi,
  savePerformanceTimesheet,
  fetchPerformanceContractDetail,
  savePerformanceContractObjectives,
  convertPerformanceGoalToTask,
  updatePerformanceTaskStage,
  fetchPerformanceTaskWorkspace,
  fetchArchivedPerformanceTasks,
  sharePerformanceTask,
  sendPerformanceTimesheetMessage,
  fetchPerformanceTimesheetPolicy,
  fetchPerformanceTimesheetWeek,
  fetchPerformanceTimesheetAudit,
  updatePerformanceTask,
  changePerformanceTaskStage,
  addPerformanceTaskSubtask,
  updatePerformanceTaskSubtask,
  deletePerformanceTaskSubtask,
  addPerformanceTaskDependency,
  removePerformanceTaskDependency,
  uploadPerformanceTaskAttachments,
  postPerformanceTaskComment,
  duplicatePerformanceTask,
  archivePerformanceTask,
  fetchPerformanceTaskPriorities,
  createPerformanceProject,
  updatePerformanceProjectStatus,
  assignPerformanceProjectTasks,
  unassignPerformanceProjectTasks,
  amendPerformanceContract,
  requestPerformanceContractSignatures,
  signPerformanceContract,
  closePerformanceContract,
  reopenPerformanceContract,
  saveCompanyStrategy,
  createCompanyStrategyTheme,
  updateCompanyStrategyTheme,
  archiveCompanyStrategy,
  createCompanyStrategyObjective,
  deleteCompanyStrategyObjective,
  type BeforeActionDetail,
} from "@/lib/performance-v22-mock/actions"
import {
  fetchEmployeeScorecard,
  fetchScorecardEntriesForCache,
  publishPerformanceLiveData,
} from "@/lib/performance-v22-mock/bridge"
import { resolvePerfAccess } from "@/lib/performance-v22-mock/access"
import { downloadAc52Export, type Ac52ExportKind, type Ac52ExportSpec } from "@/lib/accounting-v52/export"
import { getUserProfile, getAuthUser } from "@/lib/utils/cookies"
import { toast } from "sonner"
import {
  createPerformanceReview,
  createPerformanceReviewCycle,
  savePerformanceReview,
  savePerformanceSelfAssessment,
  completePerformanceReviewStage,
  finalizePerformanceReview,
  initiatePerformanceReviewCycle,
  populatePerformanceReviewSnapshot,
  downloadPerformanceReviewDocument,
  submitPerformanceReviewFeedback,
  nominatePerformanceReviewPeers,
  decidePerformanceReviewPeerNomination,
  recordPerformanceReviewMeeting,
  signOffPerformanceReview,
} from "@/lib/performance-v22-mock/review-actions"
import { useActiveAddress } from "@/lib/hooks/useActiveAddress"
import "@/components/performance-v22-mock/performance-v22.css"
import "@/components/performance-v22-mock/performance-v22-overrides.css"

type RuntimeApi = {
  setPage: (page: string) => void
  destroy: () => void
}

export function PerformanceV22App() {
  const rootRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<RuntimeApi | null>(null)
  const [bootReady, setBootReady] = useState(false)
  const pathname = usePathname()
  const pathnameRef = useRef(pathname)
  pathnameRef.current = pathname
  const activeAddress = useActiveAddress()

  useEffect(() => {
    let cancelled = false
    const profile = getUserProfile() ?? getAuthUser()
    const access = resolvePerfAccess(profile)
    const bridge = ((window as any).__PERF_LIVE__ ||= {
      ready: false,
      data: {},
      errors: {},
    })
    bridge.access = access
    ;(window as any).__PERF_REVIEW_ACTIONS__ = {
      create: createPerformanceReview,
      createCycle: createPerformanceReviewCycle,
      save: savePerformanceReview,
      saveSelf: savePerformanceSelfAssessment,
      completeStage: completePerformanceReviewStage,
      finalize: finalizePerformanceReview,
      initiateCycle: initiatePerformanceReviewCycle,
      populateSnapshot: populatePerformanceReviewSnapshot,
      downloadDocument: downloadPerformanceReviewDocument,
      submitFeedback: submitPerformanceReviewFeedback,
      nominatePeers: nominatePerformanceReviewPeers,
      decidePeerNomination: decidePerformanceReviewPeerNomination,
      recordMeeting: recordPerformanceReviewMeeting,
      signOff: signOffPerformanceReview,
    }

    // Hydrate real data before the imperative runtime's first paint, avoiding a
    // placeholder page followed by a whole-view replacement when the fetch completes.
    const currentEnding = (() => { const now = new Date(); const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())); end.setUTCDate(end.getUTCDate() + (7 - end.getUTCDay()) % 7); return end.toISOString().slice(0, 10) })()
    void Promise.all([
      publishPerformanceLiveData(),
      fetchPerformanceTaskPriorities(),
      fetchPerformanceTimesheetPolicy().then((data) => ({ data, error: null as string | null })).catch((error) => ({ data: null, error: error instanceof Error ? error.message : "Timesheet policy could not be loaded." })),
      fetchPerformanceTimesheetWeek(currentEnding).then((data) => ({ data, error: null as string | null })).catch((error) => ({ data: null, error: error instanceof Error ? error.message : "The selected timesheet week could not be loaded." })),
    ])
      .then(([, priorities, timesheetPolicyResult, currentTimesheetWeekResult]) => {
        (window as any).__PERF_TASK_PRIORITIES__ = priorities
        ;(window as any).__PERF_TIMESHEET_POLICY__ = timesheetPolicyResult.data
        ;(window as any).__PERF_TIMESHEET_POLICY_ERROR__ = timesheetPolicyResult.error
        ;(window as any).__PERF_TIMESHEET_WEEK__ = currentTimesheetWeekResult.data
        ;(window as any).__PERF_TIMESHEET_WEEK_ERROR__ = currentTimesheetWeekResult.error
      })
      .catch((error) => console.error("[performance-v22] initial live load failed:", error))
      .finally(() => {
        if (!cancelled) setBootReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!bootReady) return
    const el = rootRef.current
    if (!el) return

    const initialPage = pathToPm22Page(pathnameRef.current)
    apiRef.current = startPerformanceV22Runtime(el, {
      shellHtml: PERFORMANCE_V22_SHELL_HTML,
      initialPage,
      initialAccess: (window as any).__PERF_LIVE__?.access,
      onNavigate: (page: string) => {
        // Unknown page ids must not fall back to /performance — that snaps the UI back to
        // Command Centre and reads as "click takes you back" (see pathToPm22Page / Access bounce).
        const path = PM22_PAGE_TO_PATH[page]
        if (!path) return
        if (pathnameRef.current !== path) {
          // Keep the shared Performance runtime mounted while committing the deep link.
          // The runtime has already rendered the selected page; the pathname effect below
          // will see the same page id and skip a duplicate render.
          // This is one legacy surface mounted inside the shared Performance layout.
          // Next's native history integration updates usePathname without replacing the
          // layout or fetching a new route segment, so the runtime remains mounted.
          window.history.pushState(window.history.state, "", path)
        }
      },
    })

    const onDashboardExport = (event: Event) => {
      const detail = (event as CustomEvent).detail as {
        kind?: Ac52ExportKind
        title?: string
        subtitle?: string
        filename?: string
        columns?: string[]
        rows?: (string | number)[][]
        meta?: [string, string][]
        note?: string
        spec?: {
          columns?: string[]
          rows?: (string | number)[][]
          meta?: [string, string][]
          subtitle?: string
          filename?: string
          note?: string
        }
      } | undefined
      const spec = detail?.spec ?? detail
      if (!detail?.kind || !spec?.columns || !Array.isArray(spec.rows)) return
      void downloadAc52Export(detail.kind, {
        title: detail.title || "Performance report",
        subtitle: spec.subtitle || "Performance management report",
        filename: spec.filename || "performance-report",
        columns: spec.columns,
        rows: spec.rows,
        meta: spec.meta,
        note: spec.note,
        landscape: true,
      }).then((name) => {
        toast.success("Performance page exported", { description: `Saved ${name}.`, position: "bottom-right" })
      }).catch((error) => {
        toast.error(error instanceof Error ? error.message : "Performance export failed")
      })
    }
    window.addEventListener("matanho:performance-page-export", onDashboardExport)

    // The imperative contract screen asks this host to render the same official
    // PDF component used by the React contract manager. The saved API detail is
    // passed through unchanged so preview and download always reflect the
    // current contract version and its objectives.
    const onContractDocument = async (event: Event) => {
      const detail = (event as CustomEvent).detail as {
        kind?: "preview" | "download"
        contract?: Record<string, any>
      } | undefined
      if (!detail?.kind || !detail.contract) return
      try {
        const [{ pdf }, { default: ContractPdf }] = await Promise.all([
          import("@react-pdf/renderer"),
          import("@/components/performance/performance-contract-pdf-document"),
        ])
        const contract = detail.contract
        const blob = await pdf(createElement(ContractPdf, { contract, activeAddress }) as any).toBlob()
        if (detail.kind === "download") {
          const url = URL.createObjectURL(blob)
          const anchor = document.createElement("a")
          const contractType = String(contract.contractType || "employee").trim().toLowerCase()
          const contractSubject = String(contract.subjectName || contract.departmentName || (contractType === "board" ? "board" : contractType === "ceo" ? "ceo" : "employee")).trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase()
          anchor.href = url
          anchor.download = `performance-contract-${contractType}-${contractSubject}-${contract.periodLabel || "period"}.pdf`
          anchor.click()
          window.setTimeout(() => URL.revokeObjectURL(url), 30000)
          window.dispatchEvent(new CustomEvent("matanho:performance-contract-document-downloaded", { detail: { filename: anchor.download } }))
        } else {
          window.dispatchEvent(new CustomEvent("matanho:performance-contract-document-ready", { detail: { blob } }))
        }
      } catch (error) {
        window.dispatchEvent(new CustomEvent("matanho:performance-contract-document-error", {
          detail: { message: error instanceof Error ? error.message : "The contract document could not be generated." },
        }))
      }
    }
    window.addEventListener("matanho:performance-contract-document", onContractDocument)

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
    // Load real data once and publish it on the global the render layers read. The layers
    // are scope-isolated IIFEs that cannot see each other or this module, so a window
    // global is the only channel available (performance-module-map.md §5, §13.6).
    //
    // The same publisher runs again after every successful write (see actions.ts), so the
    // initial paint and a post-write refresh are byte-for-byte the same code path — there is
    // no second, optimistic way for state to reach the UI.
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
    ;(window as any).__PERF_GET_CONTRACT_DETAIL__ = fetchPerformanceContractDetail
    ;(window as any).__PERF_SAVE_CONTRACT_OBJECTIVES__ = savePerformanceContractObjectives
    ;(window as any).__PERF_CONVERT_GOAL_TO_TASK__ = convertPerformanceGoalToTask
    ;(window as any).__PERF_UPDATE_TASK_STAGE__ = updatePerformanceTaskStage
    ;(window as any).__PERF_CREATE_PROJECT__ = createPerformanceProject
    ;(window as any).__PERF_UPDATE_PROJECT_STATUS__ = updatePerformanceProjectStatus
    ;(window as any).__PERF_ASSIGN_PROJECT_TASKS__ = assignPerformanceProjectTasks
    ;(window as any).__PERF_UNASSIGN_PROJECT_TASKS__ = unassignPerformanceProjectTasks
    ;(window as any).__PERF_AMEND_CONTRACT__ = amendPerformanceContract
    ;(window as any).__PERF_REQUEST_CONTRACT_SIGNATURES__ = requestPerformanceContractSignatures
    ;(window as any).__PERF_SIGN_CONTRACT__ = signPerformanceContract
    ;(window as any).__PERF_CLOSE_CONTRACT__ = closePerformanceContract
    ;(window as any).__PERF_REOPEN_CONTRACT__ = reopenPerformanceContract
    ;(window as any).__PERF_SUBMIT_SCORECARD_NOTE__ = submitScorecardNote
    ;(window as any).__PERF_SUBMIT_SCORECARD_EVIDENCE__ = submitScorecardEvidence
    ;(window as any).__PERF_SUBMIT_SCORECARD_PUBLISH__ = submitScorecardPublish
    ;(window as any).__PERF_SUBMIT_GOAL_PROGRESS__ = submitGoalProgress
    ;(window as any).__PERF_SUBMIT_OBJECTIVE_CHECKIN__ = submitObjectiveCheckIn
    ;(window as any).__PERF_SUBMIT_GOVERNED_KPI__ = submitGovernedKpi
    ;(window as any).__PERF_UPLOAD_OBJECTIVE_EVIDENCE__ = uploadObjectiveEvidence
    ;(window as any).__PERF_TRANSITION_GOVERNED_KPI__ = transitionGovernedKpi
    ;(window as any).__PERF_FETCH_KPI_ANALYTICS__ = async (filters: Record<string, string> = {}) => {
      const data = await fetchKpiRegistryAnalytics(filters)
      const live = (window as any).__PERF_LIVE__
      if (live) {
        live.data = live.data || {}
        live.data.kpiRegistryAnalytics = { data, error: null, empty: !data }
        window.dispatchEvent(new CustomEvent("matanho:live-data", { detail: { scopes: ["kpiRegistryAnalytics"] } }))
      }
      return data
    }
    ;(window as any).__PERF_FETCH_OBJECTIVE_CHECKINS__ = async (goalId: string) => {
      const data = await fetchObjectiveCheckIns(goalId)
      const live = (window as any).__PERF_LIVE__
      if (live) {
        live.data = live.data || {}
        live.data.objectiveCheckIns = live.data.objectiveCheckIns || {}
        live.data.objectiveCheckIns[goalId] = { data, error: null, empty: data.length === 0 }
        window.dispatchEvent(new CustomEvent("matanho:live-data", { detail: { scopes: ["objectiveCheckIns"] } }))
      }
      return data
    }
    ;(window as any).__PERF_SAVE_TIMESHEET__ = savePerformanceTimesheet
    ;(window as any).__PERF_SEND_TIMESHEET_MESSAGE__ = sendPerformanceTimesheetMessage
    ;(window as any).__PERF_LOAD_TIMESHEET_WEEK__ = fetchPerformanceTimesheetWeek
    ;(window as any).__PERF_FETCH_TIMESHEET_AUDIT__ = fetchPerformanceTimesheetAudit
    ;(window as any).__PERF_FETCH_TASK_WORKSPACE__ = fetchPerformanceTaskWorkspace
    ;(window as any).__PERF_FETCH_ARCHIVED_TASKS__ = fetchArchivedPerformanceTasks
    ;(window as any).__PERF_TASK_DETAIL_API__ = {
      update: updatePerformanceTask, changeStage: changePerformanceTaskStage,
      addSubtask: addPerformanceTaskSubtask, updateSubtask: updatePerformanceTaskSubtask,
      deleteSubtask: deletePerformanceTaskSubtask, addDependency: addPerformanceTaskDependency,
      removeDependency: removePerformanceTaskDependency, upload: uploadPerformanceTaskAttachments,
      comment: postPerformanceTaskComment, duplicate: duplicatePerformanceTask, archive: archivePerformanceTask,
      share: sharePerformanceTask,
    }
    ;(window as any).__PERF_SAVE_STRATEGY__ = saveCompanyStrategy
    ;(window as any).__PERF_CREATE_STRATEGY_THEME__ = createCompanyStrategyTheme
    ;(window as any).__PERF_UPDATE_STRATEGY_THEME__ = updateCompanyStrategyTheme
    ;(window as any).__PERF_ARCHIVE_STRATEGY__ = archiveCompanyStrategy
    ;(window as any).__PERF_CREATE_STRATEGY_OBJECTIVE__ = createCompanyStrategyObjective
    ;(window as any).__PERF_DELETE_STRATEGY_OBJECTIVE__ = deleteCompanyStrategyObjective

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
      delete (window as any).__PERF_GET_CONTRACT_DETAIL__
      delete (window as any).__PERF_SAVE_CONTRACT_OBJECTIVES__
      delete (window as any).__PERF_CONVERT_GOAL_TO_TASK__
      delete (window as any).__PERF_UPDATE_TASK_STAGE__
      delete (window as any).__PERF_CREATE_PROJECT__
      delete (window as any).__PERF_UPDATE_PROJECT_STATUS__
      delete (window as any).__PERF_ASSIGN_PROJECT_TASKS__
      delete (window as any).__PERF_UNASSIGN_PROJECT_TASKS__
      delete (window as any).__PERF_AMEND_CONTRACT__
      delete (window as any).__PERF_REQUEST_CONTRACT_SIGNATURES__
      delete (window as any).__PERF_SIGN_CONTRACT__
      delete (window as any).__PERF_CLOSE_CONTRACT__
      delete (window as any).__PERF_REOPEN_CONTRACT__
      delete (window as any).__PERF_SUBMIT_SCORECARD_NOTE__
      delete (window as any).__PERF_SUBMIT_SCORECARD_EVIDENCE__
      delete (window as any).__PERF_SUBMIT_SCORECARD_PUBLISH__
      delete (window as any).__PERF_SUBMIT_GOAL_PROGRESS__
      delete (window as any).__PERF_SUBMIT_OBJECTIVE_CHECKIN__
      delete (window as any).__PERF_SUBMIT_GOVERNED_KPI__
      delete (window as any).__PERF_UPLOAD_OBJECTIVE_EVIDENCE__
      delete (window as any).__PERF_TRANSITION_GOVERNED_KPI__
      delete (window as any).__PERF_FETCH_KPI_ANALYTICS__
      delete (window as any).__PERF_FETCH_OBJECTIVE_CHECKINS__
      delete (window as any).__PERF_SAVE_TIMESHEET__
      delete (window as any).__PERF_SEND_TIMESHEET_MESSAGE__
      delete (window as any).__PERF_LOAD_TIMESHEET_WEEK__
      delete (window as any).__PERF_TIMESHEET_WEEK_ERROR__
      delete (window as any).__PERF_TIMESHEET_POLICY_ERROR__
      delete (window as any).__PERF_FETCH_TIMESHEET_AUDIT__
      delete (window as any).__PERF_FETCH_TASK_WORKSPACE__
      delete (window as any).__PERF_FETCH_ARCHIVED_TASKS__
      delete (window as any).__PERF_TASK_DETAIL_API__
      delete (window as any).__PERF_SAVE_STRATEGY__
      delete (window as any).__PERF_CREATE_STRATEGY_THEME__
      delete (window as any).__PERF_UPDATE_STRATEGY_THEME__
      delete (window as any).__PERF_ARCHIVE_STRATEGY__
      delete (window as any).__PERF_CREATE_STRATEGY_OBJECTIVE__
      delete (window as any).__PERF_DELETE_STRATEGY_OBJECTIVE__
      delete (window as any).__PERFORMANCE_V22_EXPORT__
      window.removeEventListener("click", onPerformanceExport, true)
      window.removeEventListener("matanho:after-render", onPerformanceAfterRender)
      exportToolbarObserver?.disconnect()
      delete (window as any).__PERF_FETCH_SCORECARD_ENTRIES__
      delete (window as any).__PERF_REVIEW_ACTIONS__
      delete (window as any).__PERF_FETCH_EMPLOYEE_SCORECARD__
      window.removeEventListener("matanho:before-action", onBeforeAction)
      window.removeEventListener("matanho:performance-page-export", onDashboardExport)
      window.removeEventListener("matanho:performance-contract-document", onContractDocument)
      apiRef.current?.destroy()
      apiRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootReady])

  useEffect(() => {
    apiRef.current?.setPage(pathToPm22Page(pathname))
    const match = pathname.match(/^\/performance\/tasks\/([^/]+)\/?$/)
    if (match) (window as any).MatanhoPerformanceV6?.openTask?.(decodeURIComponent(match[1]))
  }, [pathname])

  return (
    <div className="relative h-full w-full">
      <div ref={rootRef} className="performance-v22-root h-full w-full" />
      {!bootReady && (
        <div
          className="absolute inset-0 z-10 grid place-items-center bg-[#f4f6fa] text-sm text-slate-600"
          role="status"
          aria-live="polite"
        >
          <span className="inline-flex items-center gap-3">
            <span className="size-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
            Loading Performance workspace...
          </span>
        </div>
      )}
    </div>
  )
}
