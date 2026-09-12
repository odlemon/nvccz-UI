/**
 * Performance V22 — live read paths.
 *
 * Every endpoint and envelope below was verified by calling the running API (8 Sep 2026),
 * not inferred from types. The full verified list lives in the header of `types.ts`; the
 * per-loader comments here record only what is surprising about each one.
 *
 * All of these require `authenticate`. Most carry no permission guard yet, so scope
 * filtering is NOT enforced server-side today — see `design-refs/performance-role-matrix.md`
 * §4. This loader therefore does not pretend to scope results either; the access tier from
 * `access.ts` gates the UI, and server-side scoping is tracked as outstanding work.
 *
 * Convention (matches `lib/portfolio-v11/live-loaders.ts`): one `Promise.all` with a `safe()`
 * wrapper capturing per-call errors, so a single failing endpoint yields one empty section
 * rather than an empty page.
 *
 * DELIBERATELY NOT USED: `GET /api/performance/kpis`. That path is served by
 * `hardcodedKPIRoutes` before `performanceKpiCatalogRoutes` on the same mount, while
 * POST/PATCH write to the `kpis` table that only `GET /api/kpis` reads. Reading it would show
 * fixtures and hide anything a user creates. See `performance-module-map.md` §13.1.
 */
import { apiClient } from "@/lib/api/api-client"
import {
  adaptAlert,
  adaptAlertSummary,
  adaptAnalyticsDashboard,
  adaptAnalyticsKpi,
  adaptAnalyticsReports,
  adaptCorrectiveAction,
  adaptCorrectiveSummary,
  adaptDepartment,
  adaptDeptComparison,
  adaptDocument,
  adaptContract,
  adaptDocumentFolders,
  adaptKpi,
  adaptDeptScorecard,
  adaptEmployeeScorecard,
  adaptGovScorecard,
  adaptMyScorecard,
  adaptNamed,
  adaptOrgBsc,
  adaptPillar,
  adaptReview,
  adaptRisk,
  adaptTask,
  adaptTeamTimesheet,
  adaptTimesheet,
  adaptUser,
  adaptVision,
  pickArray,
} from "./adapters"
import type {
  PerfAlert,
  PerfAlertSummary,
  PerfAnalyticsDashboard,
  PerfAnalyticsKpi,
  PerfAnalyticsReports,
  PerfCorrectiveAction,
  PerfCorrectiveSummary,
  PerfDepartment,
  PerfDeptComparison,
  PerfDocument,
  PerfContract,
  PerfDocumentFolders,
  PerfKpi,
  PerfDeptScorecard,
  PerfGovScorecard,
  PerfMyScorecard,
  PerfLivePayload,
  PerfNamed,
  PerfOrgBsc,
  PerfPillar,
  PerfReview,
  PerfRisk,
  PerfTask,
  PerfTeamTimesheet,
  PerfTimesheet,
  PerfUser,
  PerfVision,
  ScopeResult,
} from "./types"

async function safe<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<ScopeResult<T>> {
  try {
    const data = await fn()
    const empty = Array.isArray(data) ? data.length === 0 : data == null
    return { data, error: null, empty }
  } catch (err: any) {
    // A failed call is reported, never silently rendered as zero rows — an error state and
    // an honest empty state are different things and must not look the same.
    const message = err?.message ? String(err.message) : `Failed to load ${label}`
    console.error(`[performance-v22] ${label} failed:`, message)
    return { data: fallback, error: message, empty: false }
  }
}

/**
 * Departments, with a real member count joined on from `/api/users`.
 *
 * `GET /api/departments` does not return `_count` (despite `lib/api/department-api.ts`
 * declaring it), so the count has to come from the user list: `{ success, data: User[] }`,
 * each carrying `userDepartment`. Measured 8 Sep: 24 users returned, 10 of them assigned to
 * a department. Departments with nobody assigned correctly resolve to 0, not to a
 * placeholder — a real zero is information.
 *
 * If the user call fails, counts fall back to `null` (rendered "—") rather than 0, so a
 * failed lookup is never mistaken for an empty department.
 */
export async function loadDepartments(): Promise<ScopeResult<PerfDepartment[]>> {
  return safe<PerfDepartment[]>(
    "departments",
    async () => {
      const [deptRes, userRes] = await Promise.all([
        apiClient.get("/departments"),
        apiClient.get("/users").catch(() => null),
      ])

      const departments = pickArray(deptRes, "data", "departments").map(adaptDepartment)

      if (!userRes) return departments // counts stay null -> "—"

      const counts = new Map<string, number>()
      for (const u of pickArray(userRes, "data", "users")) {
        const name = typeof u?.userDepartment === "string" ? u.userDepartment : u?.department?.name
        if (typeof name === "string" && name.trim()) {
          counts.set(name.trim(), (counts.get(name.trim()) ?? 0) + 1)
        }
      }
      return departments.map((d) => ({ ...d, userCount: counts.get(d.name) ?? 0 }))
    },
    [],
  )
}

export async function loadTasks(): Promise<ScopeResult<PerfTask[]>> {
  return safe<PerfTask[]>(
    "tasks",
    async () => {
      const res: any = await apiClient.get("/tasks")
      return pickArray(res, "tasks", "data").map(adaptTask)
    },
    [],
  )
}

/** `/api/kpis` -> { success, count, kpis }. See the header note on `/performance/kpis`. */
export async function loadKpis(): Promise<ScopeResult<PerfKpi[]>> {
  return safe<PerfKpi[]>(
    "kpis",
    async () => {
      const res: any = await apiClient.get("/kpis")
      return pickArray(res, "kpis", "data").map(adaptKpi)
    },
    [],
  )
}

export async function loadUsers(): Promise<ScopeResult<PerfUser[]>> {
  return safe<PerfUser[]>(
    "users",
    async () => {
      const res: any = await apiClient.get("/users")
      return pickArray(res, "data", "users").map(adaptUser)
    },
    [],
  )
}

/** Verified envelopes, 8 Sep: pillars `{success,data}`; strategies/themes `{success,message,data,timestamp}`; goals `{success,count,goals}`. */
function namedLoader(label: string, path: string, ...keys: string[]) {
  return () =>
    safe<PerfNamed[]>(
      label,
      async () => {
        const res: any = await apiClient.get(path)
        return pickArray(res, ...keys).map(adaptNamed)
      },
      [],
    )
}

export const loadPillars = namedLoader("pillars", "/performance/scorecard-pillars", "data")
export const loadThemes = namedLoader("themes", "/performance/config/themes", "data")
export const loadStrategies = namedLoader("strategies", "/performance/config/strategies", "data")
export const loadGoals = namedLoader("goals", "/performance/goals", "goals", "data")
export const loadArchivedStrategies = namedLoader(
  "archivedStrategies",
  "/performance/config/strategies/archives",
  "data",
)
export const loadSyncJobs = namedLoader("syncJobs", "/performance/integration/jobs", "data")

/**
 * `/api/performance/scorecards/org-bsc` — real, computed org-wide BSC score. Always callable
 * (no contract required); a genuine failure here is a real error, so this goes through
 * ordinary `safe()`.
 */
export async function loadOrgBsc(): Promise<ScopeResult<PerfOrgBsc | null>> {
  return safe<PerfOrgBsc | null>(
    "orgBsc",
    async () => {
      const res: any = await apiClient.get("/performance/scorecards/org-bsc")
      return adaptOrgBsc(res?.data)
    },
    null,
  )
}

/**
 * `/api/performance/scorecards/user` — the signed-in user's own scorecard.
 *
 * Deliberately NOT routed through the ordinary `safe()` catch: a 404/500 here almost always
 * means "no active performance contract" or "no goals linked to it", which is the backend
 * correctly explaining an honest state, not failing. Treating it as a scope error would show
 * a generic "Unavailable" instead of the real reason, and would mark `error` on a scope that
 * loaded successfully in every sense that matters.
 */
export async function loadMyScorecard(): Promise<ScopeResult<PerfMyScorecard | null>> {
  try {
    const res: any = await apiClient.get("/performance/scorecards/user")
    return { data: adaptMyScorecard(res?.data), error: null, empty: false }
  } catch (err: any) {
    const reason = err?.message ? String(err.message) : "No performance contract is active for this period."
    return {
      data: {
        available: false,
        blockedReason: reason,
        overallScore: null,
        status: null,
        goalCount: 0,
        contractTitle: null,
        periodLabel: null,
        rows: [],
      },
      error: null,
      empty: false,
    }
  }
}

/**
 * `/api/performance/scorecards/department/:department`, one call per real department.
 *
 * ~9 departments today, so preloading all of them is cheap — unlike the employee case
 * (~24 users, most without a contract), a full preload here is proportionate. A department
 * with no active contract gets `available:false` with the backend's own reason, same
 * treatment as `loadMyScorecard`.
 */
export async function loadDeptScorecards(): Promise<ScopeResult<PerfDeptScorecard[]>> {
  return safe<PerfDeptScorecard[]>(
    "deptScorecards",
    async () => {
      const deptRes: any = await apiClient.get("/departments")
      const names: string[] = pickArray(deptRes, "data", "departments")
        .map((d: any) => (typeof d?.name === "string" ? d.name : null))
        .filter((n: string | null): n is string => !!n)

      const results = await Promise.all(
        names.map(async (name): Promise<PerfDeptScorecard> => {
          try {
            const res: any = await apiClient.get(`/performance/scorecards/department/${encodeURIComponent(name)}`)
            return (
              adaptDeptScorecard(name, res?.data) ?? {
                available: false,
                blockedReason: "Unexpected response shape",
                department: name,
                overallScore: null,
                status: null,
                manager: null,
                rows: [],
              }
            )
          } catch (err: any) {
            const reason = err?.message ? String(err.message) : "No active performance contract for this department."
            return {
              available: false,
              blockedReason: reason,
              department: name,
              overallScore: null,
              status: null,
              manager: null,
              rows: [],
            }
          }
        }),
      )
      return results
    },
    [],
  )
}

/** `/api/performance/scorecards/board` — always one call, org-wide, no per-entity selection. */
export async function loadBoardScorecard(): Promise<ScopeResult<PerfGovScorecard | null>> {
  try {
    const res: any = await apiClient.get("/performance/scorecards/board")
    return { data: adaptGovScorecard(res?.data, "board"), error: null, empty: false }
  } catch (err: any) {
    const reason = err?.message ? String(err.message) : "No active Board performance contract for this period."
    return {
      data: { available: false, blockedReason: reason, overallScore: null, status: null, chairOrCeo: null, rows: [] },
      error: null,
      empty: false,
    }
  }
}

/** `/api/performance/scorecards/ceo` — always one call, org-wide, no per-entity selection. */
export async function loadCeoScorecard(): Promise<ScopeResult<PerfGovScorecard | null>> {
  try {
    const res: any = await apiClient.get("/performance/scorecards/ceo")
    return { data: adaptGovScorecard(res?.data, "ceo"), error: null, empty: false }
  } catch (err: any) {
    const reason = err?.message ? String(err.message) : "No active CEO performance contract for this period."
    return {
      data: { available: false, blockedReason: reason, overallScore: null, status: null, chairOrCeo: null, rows: [] },
      error: null,
      empty: false,
    }
  }
}

/**
 * `/api/performance/contracts` -> { success, count, total, skip, take, data } (verified 8 Sep).
 *
 * Not `namedLoader`: that reduces every row to {id,name,description,status} and the contract
 * endpoint returns period, subject, department, reviewer, approver and budget as well. The
 * Contracts page had to dash columns the backend could actually fill.
 */
export async function loadContracts(): Promise<ScopeResult<PerfContract[]>> {
  return safe<PerfContract[]>(
    "contracts",
    async () => {
      const res: any = await apiClient.get("/performance/contracts")
      return pickArray(res, "data").map(adaptContract)
    },
    [],
  )
}

/**
 * `/api/risk-assessments` -> { success, assessments } (verified 8 Sep).
 *
 * Same reason as contracts: `riskLevel` and `overallRiskScore` exist on the model and were
 * being discarded. See the note on `PerfRisk` in `types.ts` about whether a deal
 * due-diligence record belongs on the Enterprise Risk Register at all — wiring it does not
 * settle that question.
 */
export async function loadRisks(): Promise<ScopeResult<PerfRisk[]>> {
  return safe<PerfRisk[]>(
    "risks",
    async () => {
      const res: any = await apiClient.get("/risk-assessments")
      return pickArray(res, "assessments", "data").map(adaptRisk)
    },
    [],
  )
}

/* ---------------------------------------------------------------------------------------
 * Registers backed by the tables added for this module: corrective actions, alerts and the
 * document vault. All three ship their own migration script under `nvccz/scripts/` and were
 * round-tripped (create -> read -> update -> list -> delete -> 404) against the live API
 * before being wired here.
 * ------------------------------------------------------------------------------------- */

export async function loadCorrectiveActions(): Promise<ScopeResult<PerfCorrectiveAction[]>> {
  return safe<PerfCorrectiveAction[]>(
    "correctiveActions",
    async () => {
      const res: any = await apiClient.get("/performance/corrective-actions")
      return pickArray(res, "data").map(adaptCorrectiveAction)
    },
    [],
  )
}

export async function loadCorrectiveSummary(): Promise<ScopeResult<PerfCorrectiveSummary | null>> {
  return safe<PerfCorrectiveSummary | null>(
    "correctiveSummary",
    async () => {
      const res: any = await apiClient.get("/performance/corrective-actions/summary")
      return adaptCorrectiveSummary(res?.data)
    },
    null,
  )
}

export async function loadAlerts(): Promise<ScopeResult<PerfAlert[]>> {
  return safe<PerfAlert[]>(
    "alerts",
    async () => {
      const res: any = await apiClient.get("/performance/alerts")
      return pickArray(res, "data").map(adaptAlert)
    },
    [],
  )
}

export async function loadAlertSummary(): Promise<ScopeResult<PerfAlertSummary | null>> {
  return safe<PerfAlertSummary | null>(
    "alertSummary",
    async () => {
      const res: any = await apiClient.get("/performance/alerts/summary")
      return adaptAlertSummary(res?.data)
    },
    null,
  )
}

export async function loadDocuments(): Promise<ScopeResult<PerfDocument[]>> {
  return safe<PerfDocument[]>(
    "documents",
    async () => {
      const res: any = await apiClient.get("/performance/documents")
      return pickArray(res, "data").map(adaptDocument)
    },
    [],
  )
}

export async function loadDocumentFolders(): Promise<ScopeResult<PerfDocumentFolders | null>> {
  return safe<PerfDocumentFolders | null>(
    "documentFolders",
    async () => {
      const res: any = await apiClient.get("/performance/documents/folders")
      return adaptDocumentFolders(res?.data)
    },
    null,
  )
}

/** `/api/performance-reviews` -> `{ success, message, data: { reviews, pagination } }`. */
export async function loadReviews(): Promise<ScopeResult<PerfReview[]>> {
  return safe<PerfReview[]>(
    "reviews",
    async () => {
      const res: any = await apiClient.get("/performance-reviews")
      return pickArray(res?.data, "reviews").map(adaptReview)
    },
    [],
  )
}

/** `/api/performance/review-cycles` -> `{ success, message, data: { cycles, total, ... } }`. */
export async function loadReviewCycles(): Promise<ScopeResult<PerfNamed[]>> {
  return safe<PerfNamed[]>(
    "reviewCycles",
    async () => {
      const res: any = await apiClient.get("/performance/review-cycles")
      return pickArray(res?.data, "cycles").map(adaptNamed)
    },
    [],
  )
}

/**
 * Timesheets.
 *
 * `/api/accounting/timesheets/mine` is guarded by `requireAnyPermission('accounting.
 * timesheets.view')`. Until `scripts/run-performance-role-permissions-migration.ts` was run,
 * this 403'd for all 57 non-admin roles because `hardcodedRoles.ts` carries no permissions
 * field at all — the self-service page had never worked for anyone but `admin`.
 *
 * There is no collection endpoint: `/api/accounting/timesheets` is 404. Only "mine" exists,
 * so the Timesheets page is genuinely self-scoped, not scoped by choice.
 */
export async function loadTimesheets(): Promise<ScopeResult<PerfTimesheet[]>> {
  return safe<PerfTimesheet[]>(
    "timesheets",
    async () => {
      const res: any = await apiClient.get("/accounting/timesheets/mine")
      return pickArray(res, "data").map(adaptTimesheet)
    },
    [],
  )
}

/**
 * `/api/accounting/timesheets/team` — a manager's own department, every status. Requires
 * `accounting.timesheets.manage`; anyone without it gets a 403, which `safe()` turns into an
 * error state for this one scope rather than failing the whole page. Deliberately not
 * requested with `Promise.allSettled` special-casing — a 403 here is exactly as informative
 * as any other scope error and the page already knows how to render one.
 */
export async function loadTeamTimesheets(): Promise<ScopeResult<PerfTeamTimesheet[]>> {
  return safe<PerfTeamTimesheet[]>(
    "teamTimesheets",
    async () => {
      const res: any = await apiClient.get("/accounting/timesheets/team")
      return pickArray(res, "data").map(adaptTeamTimesheet)
    },
    [],
  )
}

/**
 * `/api/performance/config/pillars` -> `data.pillars`.
 *
 * The four BSC perspectives with their configured weights. `strategyId` is null until a
 * strategy exists, and the pillars still come back with their default weights — so the page
 * must show these as *configuration*, never as scores.
 */
export async function loadPillarConfig(): Promise<ScopeResult<PerfPillar[]>> {
  return safe<PerfPillar[]>(
    "pillarConfig",
    async () => {
      const res: any = await apiClient.get("/performance/config/pillars")
      return pickArray(res?.data, "pillars").map(adaptPillar)
    },
    [],
  )
}

export async function loadVision(): Promise<ScopeResult<PerfVision | null>> {
  return safe<PerfVision | null>(
    "vision",
    async () => {
      const res: any = await apiClient.get("/performance/config/vision-statement")
      return adaptVision(res?.data)
    },
    null,
  )
}

/* ---------------------------------------------------------------------------------------
 * Analytics. These are the only endpoints that compute anything across the module, and they
 * are the source for the dashboard's few genuinely knowable numbers (user counts, task
 * counts, department breakdown). Everything the dashboard used to assert beyond this — the
 * weighted scores, the 12-month trends, the heat grid — has no source and reads as an em
 * dash rather than an invented figure.
 * ------------------------------------------------------------------------------------- */

export async function loadAnalyticsKpi(): Promise<ScopeResult<PerfAnalyticsKpi | null>> {
  return safe<PerfAnalyticsKpi | null>(
    "analyticsKpi",
    async () => {
      const res: any = await apiClient.get("/performance/analytics/kpi")
      return adaptAnalyticsKpi(res?.data)
    },
    null,
  )
}

export async function loadAnalyticsDashboard(): Promise<ScopeResult<PerfAnalyticsDashboard | null>> {
  return safe<PerfAnalyticsDashboard | null>(
    "analyticsDashboard",
    async () => {
      const res: any = await apiClient.get("/performance/analytics/dashboard")
      return adaptAnalyticsDashboard(res?.data)
    },
    null,
  )
}

export async function loadAnalyticsReports(): Promise<ScopeResult<PerfAnalyticsReports | null>> {
  return safe<PerfAnalyticsReports | null>(
    "analyticsReports",
    async () => {
      const res: any = await apiClient.get("/performance/analytics/reports")
      return adaptAnalyticsReports(res?.data)
    },
    null,
  )
}

export async function loadDeptComparison(): Promise<ScopeResult<PerfDeptComparison[]>> {
  return safe<PerfDeptComparison[]>(
    "deptComparison",
    async () => {
      const res: any = await apiClient.get("/performance/analytics/departments/comparison")
      return pickArray(res?.data, "departments").map(adaptDeptComparison)
    },
    [],
  )
}

/**
 * Load every scope the bridge supports, in one `Promise.all`.
 *
 * 27 requests. They are independent and the API is local to the browser session, so the wall
 * clock is one round trip rather than 27; `safe()` means a single 4xx/5xx costs one section,
 * not the page.
 *
 * Endpoints that return 200 with zero rows are wired anyway, on purpose: an honest empty
 * state backed by a real request is strictly better than a fabricated number, and these are
 * exactly the surfaces users populate through CRUD.
 */
export async function loadPerformanceLiveData(): Promise<PerfLivePayload> {
  const [
    departments,
    tasks,
    kpis,
    pillars,
    themes,
    strategies,
    goals,
    contracts,
    risks,
    users,
    correctiveActions,
    correctiveSummary,
    alerts,
    alertSummary,
    documents,
    documentFolders,
    reviews,
    reviewCycles,
    timesheets,
    teamTimesheets,
    pillarConfig,
    vision,
    archivedStrategies,
    analyticsKpi,
    analyticsDashboard,
    analyticsReports,
    deptComparison,
    syncJobs,
    orgBsc,
    myScorecard,
    deptScorecards,
    boardScorecard,
    ceoScorecard,
  ] = await Promise.all([
    loadDepartments(),
    loadTasks(),
    loadKpis(),
    loadPillars(),
    loadThemes(),
    loadStrategies(),
    loadGoals(),
    loadContracts(),
    loadRisks(),
    loadUsers(),
    loadCorrectiveActions(),
    loadCorrectiveSummary(),
    loadAlerts(),
    loadAlertSummary(),
    loadDocuments(),
    loadDocumentFolders(),
    loadReviews(),
    loadReviewCycles(),
    loadTimesheets(),
    loadTeamTimesheets(),
    loadPillarConfig(),
    loadVision(),
    loadArchivedStrategies(),
    loadAnalyticsKpi(),
    loadAnalyticsDashboard(),
    loadAnalyticsReports(),
    loadDeptComparison(),
    loadSyncJobs(),
    loadOrgBsc(),
    loadMyScorecard(),
    loadDeptScorecards(),
    loadBoardScorecard(),
    loadCeoScorecard(),
  ])

  return {
    departments,
    tasks,
    kpis,
    pillars,
    themes,
    strategies,
    goals,
    contracts,
    risks,
    users,
    correctiveActions,
    correctiveSummary,
    alerts,
    alertSummary,
    documents,
    documentFolders,
    reviews,
    reviewCycles,
    timesheets,
    teamTimesheets,
    pillarConfig,
    vision,
    archivedStrategies,
    analyticsKpi,
    analyticsDashboard,
    analyticsReports,
    deptComparison,
    syncJobs,
    orgBsc,
    myScorecard,
    deptScorecards,
    boardScorecard,
    ceoScorecard,
  }
}
