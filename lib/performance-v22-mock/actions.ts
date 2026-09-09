/**
 * Performance V22 — live write paths.
 *
 * Contract with the runtime: `matanho-performance-runtime.js` dispatches a **cancelable**
 * `matanho:before-action` from its single central `handle(action, el)` dispatcher (applied by
 * `scripts/patch-performance-runtime.mjs`). The host calls `preventDefault()` for any action
 * listed in `API_ACTIONS`, which suppresses the runtime's mock handler so the two cannot both
 * run — otherwise the UI would optimistically mutate local state the backend never received.
 *
 * WHAT IS WIRED, AND WHY ONLY THIS MUCH
 * -------------------------------------
 * An action is added here only when all three of these are true:
 *
 *   1. Its endpoint exists and has been round-tripped against the running API
 *      (create -> read back -> update -> delete -> 404), not merely mounted.
 *   2. Its route carries a real permission guard, not just `authenticate`. Before the guards
 *      were added, every one of these registers was writable by ANY logged-in user of ANY
 *      portal — an LP or an applicant could have created and deleted performance records.
 *      Verified per role over HTTP: employee POST -> 403, manager POST -> 201, no token -> 401.
 *   3. Its read path already shows real records, so a successful write is visible.
 *
 * Everything else in the module stays inert. 220 of 242 performance endpoints are still
 * `authenticate`-only; enabling a write against one of those would hand an unprivileged user
 * a mutation, which is worse than a button that does nothing. That guard work is tracked in
 * `design-refs/performance-role-matrix.md` §4.
 *
 * After every successful write the module RE-READS from the server rather than patching local
 * state. A card that updates without a round trip is exactly the defect this work removes.
 */
import { apiClient } from "@/lib/api/api-client"
import { publishPerformanceLiveData } from "./bridge"
import type { PerfLiveGlobal } from "./types"

/**
 * Actions the host intercepts and routes to the real API.
 *
 * Adding an id here without a matching `case` below would make the action a silent no-op,
 * which is worse than the mock — so the switch and this set are edited together.
 */
export const API_ACTIONS = new Set<string>([
  "submit-corrective",
  "team-timesheet-approve",
  "team-timesheet-return",
  "alert-acknowledge",
  "alert-escalate",
  "alert-resolve",
  "submit-document-upload",
  "submit-goal-quick",
])

export interface BeforeActionDetail {
  action: string
  id?: string
  dataset?: Record<string, string>
  page?: string
  role?: string
}

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string }

/* --------------------------------------------------------------------------------------
 * Helpers shared by handlers
 * ------------------------------------------------------------------------------------ */

/** Read a form the runtime rendered, by id. Returns null when it is not on screen. */
function readForm(formId: string): Record<string, string> | null {
  if (typeof document === "undefined") return null
  const form = document.getElementById(formId) as HTMLFormElement | null
  if (!form) return null
  if (typeof form.reportValidity === "function" && !form.reportValidity()) return null
  const out: Record<string, string> = {}
  new FormData(form).forEach((value, key) => {
    out[key] = typeof value === "string" ? value.trim() : ""
  })
  return out
}

/** The runtime's own toast, when it is available. Never invents a success message. */
function toast(title: string, body: string): void {
  const fn = (window as any).__PERF_TOAST__ ?? (window as any).toast
  if (typeof fn === "function") {
    try {
      fn(title, body)
      return
    } catch {
      /* fall through to the console */
    }
  }
  console.info(`[performance-v22] ${title}: ${body}`)
}

function closeOverlays(): void {
  const fn = (window as any).__PERF_CLOSE_OVERLAYS__
  if (typeof fn === "function") {
    try {
      fn()
    } catch {
      /* the modal staying open is not worth throwing over */
    }
  }
}

/** Turn an ApiError (or anything else) into one line a user can act on. */
function errorText(err: any, fallback: string): string {
  const msg = err?.data?.message ?? err?.message
  return typeof msg === "string" && msg.trim() ? msg.trim() : fallback
}

/* --------------------------------------------------------------------------------------
 * Handlers
 * ------------------------------------------------------------------------------------ */

/**
 * Log Corrective Action.
 *
 * POST /api/performance/corrective-actions, guarded by `performance.corrective.manage`.
 * The form is rendered by the runtime's `newCorrective()` modal, which the
 * `corrective-modal` patch gives an id, real field names, and owner and department options sourced
 * from the live `users` and `departments` scopes rather than from two hardcoded job titles.
 *
 * `reference` is deliberately not sent: CorrectiveActionService allocates CA-001, CA-002 …
 * server-side, so two people creating at once cannot collide on a client-generated code.
 */
async function submitCorrective(): Promise<ActionResult> {
  const values = readForm("newCorrectiveForm")
  if (!values) return { ok: false, error: "Form is incomplete" }
  if (!values.title) return { ok: false, error: "An action title is required" }

  const body: Record<string, unknown> = {
    title: values.title,
    description: values.description || null,
    trigger: values.trigger || null,
    severity: (values.severity || "medium").toLowerCase(),
  }
  if (values.ownerId) body.ownerId = values.ownerId
  if (values.departmentId) body.departmentId = values.departmentId
  if (values.targetDate) body.targetDate = values.targetDate

  try {
    const res: any = await apiClient.post("/performance/corrective-actions", body)
    const created = res?.data
    closeOverlays()
    // Re-read from the server. The reference the user sees is the one the DB assigned.
    await publishPerformanceLiveData()
    toast(
      "Corrective action logged",
      created?.reference ? `${created.reference} · ${created.title}` : String(body.title),
    )
    return { ok: true, message: created?.reference }
  } catch (err: any) {
    const message = errorText(err, "Could not log the corrective action")
    toast("Could not save", message)
    return { ok: false, error: message }
  }
}

/**
 * Create a goal from the Objectives page's "New goal" modal.
 *
 * The one form on this page that goes through the ordinary central `handle()` dispatcher
 * (`submit-corrective`'s pattern) rather than a direct `window.__PERF_SUBMIT_...__` hook —
 * see `objectives-new-goal.mjs` for why: it's a brand-new control with no page-local
 * dispatcher of its own to fit into, so it was built straight onto the standard path.
 */
async function submitGoalQuick(): Promise<ActionResult> {
  const values = readForm("newGoalQuickForm")
  if (!values) return { ok: false, error: "Form is incomplete" }
  if (!values.title) return { ok: false, error: "A title is required" }
  if (!values.scorecardPillar) return { ok: false, error: "A perspective is required" }
  const type = (values.type as GoalPayload["type"]) || "individual"
  if (type === "company" && !values.kpiId) {
    toast("Could not save", "Company goals must be linked to a KPI. Choose one, or create one first from KPI Management.")
    return { ok: false, error: "Company goals require a KPI" }
  }

  const payload: GoalPayload = {
    title: values.title,
    description: values.description || undefined,
    type,
    scorecardPillar: values.scorecardPillar,
    targetValue: Number(values.targetValue) || 100,
    currentValue: 0,
    targetUnit: values.targetUnit || "%",
    priority: values.priority || "medium",
    startDate: values.startDate || "2026-01-01",
    endDate: values.endDate || "2026-12-31",
  }
  if (values.performanceContractId) payload.performanceContractId = values.performanceContractId
  if (type === "individual" && values.assignedToId) payload.assignedToId = values.assignedToId
  if (type === "department" && values.departmentName) payload.departmentName = values.departmentName
  if (type === "company" && values.kpiId) payload.kpiId = values.kpiId

  const result = await submitGoal(payload)
  if (result.ok) closeOverlays()
  return result
}

/**
 * Approve / return a report's timesheet.
 *
 * `POST /accounting/timesheets/:id/{approve,return}`, guarded by `accounting.timesheets.
 * manage` — already granted to the same 16 manager/exec roles as every other write in this
 * module. The row only renders the button when `status === 'SUBMITTED'` (see the
 * `timesheets-team-panel` patch), so a stale click on an already-decided row is rejected by
 * the backend's own state-machine check, not silently accepted here.
 */
function teamTimesheetAction(kind: "approve" | "return") {
  return async (detail: BeforeActionDetail): Promise<ActionResult> => {
    const id = detail.id
    if (!id) return { ok: false, error: "No timesheet id on this row" }
    try {
      await apiClient.post(`/accounting/timesheets/${id}/${kind}`, {})
      await publishPerformanceLiveData()
      toast(
        kind === "approve" ? "Timesheet approved" : "Timesheet returned",
        kind === "approve" ? "The week is now available to reporting." : "Sent back to the employee for correction.",
      )
      return { ok: true }
    } catch (err: any) {
      const message = errorText(err, `Could not ${kind} the timesheet`)
      toast("Could not save", message)
      return { ok: false, error: message }
    }
  }
}

const approveTeamTimesheet = teamTimesheetAction("approve")
const returnTeamTimesheet = teamTimesheetAction("return")

/**
 * Acknowledge / escalate / resolve an alert.
 *
 * `POST /performance/alerts/:id/{acknowledge,escalate,resolve}`, guarded by
 * `performance.alerts.manage`. The drawer only renders the button for a status the
 * transition is actually valid from (see `alerts-drawer`), so a stale click on an
 * already-resolved alert is rejected by the backend, not silently accepted here.
 */
function alertLifecycleAction(kind: "acknowledge" | "escalate" | "resolve") {
  return async (detail: BeforeActionDetail): Promise<ActionResult> => {
    const id = detail.id
    if (!id) return { ok: false, error: "No alert id on this row" }
    try {
      const res: any = await apiClient.post(`/performance/alerts/${id}/${kind}`, {})
      await publishPerformanceLiveData()
      const label = kind === "acknowledge" ? "Alert acknowledged" : kind === "escalate" ? "Alert escalated" : "Alert resolved"
      toast(label, res?.data?.reference ? String(res.data.reference) : "")
      return { ok: true }
    } catch (err: any) {
      const message = errorText(err, `Could not ${kind} the alert`)
      toast("Could not save", message)
      return { ok: false, error: message }
    }
  }
}

const acknowledgeAlert = alertLifecycleAction("acknowledge")
const escalateAlert = alertLifecycleAction("escalate")
const resolveAlert = alertLifecycleAction("resolve")

/**
 * Upload a Document Vault file.
 *
 * `POST /api/performance/documents` (multipart), guarded by `performance.documents.manage`.
 * Replaced the old "blank page or template" text-document modal, which had no file input at
 * all and could never have produced a record the file-backed API model accepts — see the
 * `vault-upload-modal` patch.
 */
async function submitDocumentUpload(): Promise<ActionResult> {
  if (typeof document === "undefined") return { ok: false, error: "No document context" }
  const form = document.getElementById("newDocForm") as HTMLFormElement | null
  if (!form) return { ok: false, error: "Form is incomplete" }
  if (typeof form.reportValidity === "function" && !form.reportValidity()) return { ok: false, error: "Form is incomplete" }

  const fd = new FormData(form)
  const file = fd.get("file")
  if (!(file instanceof File) || file.size === 0) {
    toast("Could not save", "Choose a file to upload")
    return { ok: false, error: "No file selected" }
  }
  const name = String(fd.get("name") || "").trim() || file.name
  fd.set("name", name)

  try {
    const res: any = await apiClient.postFormData("/performance/documents", fd)
    closeOverlays()
    await publishPerformanceLiveData()
    toast("Document uploaded", res?.data?.name ? String(res.data.name) : name)
    return { ok: true }
  } catch (err: any) {
    const message = errorText(err, "Could not upload the document")
    toast("Could not save", message)
    return { ok: false, error: message }
  }
}

/* --------------------------------------------------------------------------------------
 * Direct host hooks
 *
 * Everything above goes through the runtime's central `handle(action, el)` dispatcher via
 * `data-action` + `matanho:before-action`. Several forms in this module (KPI Management,
 * the goal/objective creation flow, Performance Contracts) are wired through OLDER,
 * page-local dispatch mechanisms instead (`data-v20-action`, `data-v6-*`, etc.) that never
 * route through `handle()` at all. Rather than rewrite those dispatchers to match the
 * central one — a much bigger, riskier change to code this module doesn't own the design
 * of — each such form's local save function is patched to call one of these directly,
 * exposed on `window` by the React host exactly like `fetchEmployeeScorecard`.
 * ------------------------------------------------------------------------------------ */

/** Canonical BSC pillar name -> the seeded `scorecard_pillars.id` the backend expects. */
const PILLAR_NAME_TO_ID: Record<string, string> = {
  Financial: "bsc_financial",
  "Customer & Market": "bsc_customer_market",
  "Internal Operations": "bsc_internal_operations",
  "Learning, Growth & HR": "bsc_learning_growth_hr",
}

export interface KpiPayload {
  code: string
  name: string
  description: string
  unit?: string
  isReverseKpi?: boolean
  perspective?: string
}

/**
 * Create or update a governed KPI.
 *
 * `POST /api/kpis` needs a fuller shape than the KPI Management form collects (target,
 * thresholds, source system, formula and evidence policy have no home on the real KPI
 * record — that detail lives on a goal, not a KPI, in this schema). Only the fields the
 * backend model actually has are sent; the rest of the form stays local-only, same as
 * before, and the save toast says so honestly rather than claiming a full save.
 */
export async function submitKpi(payload: KpiPayload, existingId?: string | null): Promise<ActionResult> {
  const pillarId = payload.perspective ? PILLAR_NAME_TO_ID[payload.perspective] : undefined
  try {
    let res: any
    if (existingId) {
      res = await apiClient.put(`/kpis/${existingId}`, {
        name: payload.name,
        description: payload.description,
        code: payload.code,
        unit: payload.unit || undefined,
        hasUnit: !!payload.unit,
        isReverseKpi: !!payload.isReverseKpi,
        scorecardPillar: payload.perspective || undefined,
      })
    } else {
      res = await apiClient.post("/kpis", {
        name: payload.name,
        description: payload.description,
        code: payload.code,
        isReverseKpi: !!payload.isReverseKpi,
        hasUnit: !!payload.unit,
        unitCategory: payload.unit || "count",
        unit: payload.unit || "count",
        unitSymbol: payload.unit || "",
        unitPosition: "suffix",
        isFinancial: false,
        pillarId: pillarId || "bsc_financial",
      })
    }
    await publishPerformanceLiveData()
    const id = res?.data?.id || res?.kpi?.id || existingId
    toast(
      existingId ? "KPI updated" : "KPI created",
      `${payload.code} · target, thresholds, source system and evidence policy are not stored by the KPI catalogue yet and stay local to this browser.`,
    )
    return { ok: true, message: id }
  } catch (err: any) {
    const message = errorText(err, "Could not save the KPI")
    toast("Could not save", message)
    return { ok: false, error: message }
  }
}

export interface GoalPayload {
  title: string
  description?: string
  type: "individual" | "department" | "company"
  scorecardPillar: string
  targetValue: number
  currentValue?: number
  targetUnit?: string
  priority?: string
  startDate: string
  endDate: string
  assignedToId?: string
  departmentName?: string
  performanceContractId?: string
  kpiId?: string
}

/**
 * Create a performance goal, linked to a contract and a BSC pillar.
 *
 * Guarded by `performance.goals.manage`. A `company`-type goal additionally requires a
 * `kpiId` (the backend rejects an unmeasurable organisational goal) — the form must collect
 * one from the real KPI catalogue for that type; individual/department goals do not need it.
 */
export async function submitGoal(payload: GoalPayload): Promise<ActionResult> {
  try {
    const res: any = await apiClient.post("/performance/goals", payload)
    await publishPerformanceLiveData()
    const created = res?.goal
    toast("Goal created", created?.title ? String(created.title) : payload.title)
    return { ok: true, message: created?.id }
  } catch (err: any) {
    const message = errorText(err, "Could not create the goal")
    toast("Could not save", message)
    return { ok: false, error: message }
  }
}

export type ContractKind = "employee" | "department" | "board" | "ceo"

export interface ContractPayload {
  kind: ContractKind
  subjectUserId?: string
  departmentName?: string
  periodYear?: number
}

/**
 * Create a Performance Contract — the precondition every scorecard on this module needs
 * before it can compute anything. `POST /performance/contracts/{employee,department,board,
 * ceo}`, guarded by `performance.contracts.manage`. There was no "New Contract" control
 * anywhere in the shipped design; one was added (see the `contracts-new` runtime patch)
 * because without it no real scorecard data could ever be entered — the exception the
 * project's own ground rules carve out for a control a real write path needs.
 */
export async function submitContract(payload: ContractPayload): Promise<ActionResult> {
  try {
    const res: any = await apiClient.post(`/performance/contracts/${payload.kind}`, {
      subjectUserId: payload.subjectUserId,
      departmentName: payload.departmentName,
      periodYear: payload.periodYear,
    })
    await publishPerformanceLiveData()
    const created = res?.contract
    toast("Contract created", created?.title ? String(created.title) : `${payload.kind} contract`)
    return { ok: true, message: created?.id }
  } catch (err: any) {
    const message = errorText(err, "Could not create the contract")
    toast("Could not save", message)
    return { ok: false, error: message }
  }
}

/**
 * Update a goal's current/actual value from the Employee Scorecard's "Record update" /
 * per-row "update KPI" modals. `PATCH /api/performance/goals/:id` (not the `/progress`
 * increment endpoint — that adds to the achieved amount, whereas this form collects a new
 * absolute actual value), guarded by `performance.goals.manage`. Only `currentValue` is real
 * on `PerformanceGoal`; the form's free-text "update note" has no home on the goal record and
 * is not sent (the note stays visible locally for the session, same as before, since this is
 * about the actual value reaching the server, not fabricating a notes field that doesn't exist).
 */
export async function submitGoalProgress(goalId: string, currentValue: number): Promise<ActionResult> {
  try {
    await apiClient.patch(`/performance/goals/${encodeURIComponent(goalId)}`, { currentValue })
    await publishPerformanceLiveData()
    toast("Update recorded", "The goal's actual value was updated.")
    return { ok: true }
  } catch (err: any) {
    const message = errorText(err, "Could not record the update")
    toast("Could not save", message)
    return { ok: false, error: message }
  }
}

/**
 * Employee Scorecard workspace apparatus — notes, evidence uploads, update history and the
 * publish workflow. `POST /api/performance/scorecard-entries/{notes,evidence,history,publish}`,
 * `GET /api/performance/scorecard-entries`, all guarded by `performance.scorecards.manage`
 * (read: `.view` or `.manage`). This replaced a purely `localStorage`-backed apparatus
 * (`V.notes`/`V.evidence`/`V.history`/`V.products` in the vendored runtime) that never touched
 * a real API even though the scorecard's own KPI/goal rows are already real.
 */
export interface ScorecardEntriesResult {
  notes: Array<{ id: string; noteType: string | null; text: string; createdAt: string; actor?: { firstName: string; lastName: string } }>
  evidence: Array<{ id: string; text: string | null; fileUrl: string | null; fileSizeBytes: number | null; createdAt: string }>
  history: Array<{ id: string; text: string; createdAt: string; actor?: { firstName: string; lastName: string } }>
  publication: { published: boolean; publishedAt: string | null; publishedBy: { firstName: string; lastName: string } | null }
}

export async function submitScorecardNote(payload: { employeeId: string; period: string; noteType?: string; text: string }): Promise<ActionResult> {
  try {
    await apiClient.post("/performance/scorecard-entries/notes", payload)
    toast("Review note saved", "The note was recorded against the employee scorecard and review period.")
    return { ok: true }
  } catch (err: any) {
    const message = errorText(err, "Could not save the note")
    toast("Could not save", message)
    return { ok: false, error: message }
  }
}

export async function submitScorecardEvidence(file: File, employeeId: string, period: string): Promise<ActionResult> {
  try {
    const fd = new FormData()
    fd.set("file", file)
    fd.set("employeeId", employeeId)
    fd.set("period", period)
    await apiClient.postFormData("/performance/scorecard-entries/evidence", fd)
    toast("Evidence recorded", `${file.name} is now linked to this scorecard.`)
    return { ok: true }
  } catch (err: any) {
    const message = errorText(err, "Could not upload the evidence")
    toast("Could not save", message)
    return { ok: false, error: message }
  }
}

export async function submitScorecardPublish(employeeId: string, period: string): Promise<ActionResult> {
  try {
    await apiClient.post("/performance/scorecard-entries/publish", { employeeId, period })
    toast("Scorecard published", "The scorecard was published from the governed performance review.")
    return { ok: true }
  } catch (err: any) {
    const message = errorText(err, "Could not publish the scorecard")
    toast("Could not save", message)
    return { ok: false, error: message }
  }
}

/**
 * Route one intercepted action to the backend.
 *
 * The single seam: adding a write is an id in `API_ACTIONS` plus a case here.
 */
export async function runPerformanceAction(detail: BeforeActionDetail): Promise<ActionResult> {
  switch (detail.action) {
    case "submit-corrective":
      return submitCorrective()
    case "team-timesheet-approve":
      return approveTeamTimesheet(detail)
    case "team-timesheet-return":
      return returnTeamTimesheet(detail)
    case "alert-acknowledge":
      return acknowledgeAlert(detail)
    case "alert-escalate":
      return escalateAlert(detail)
    case "alert-resolve":
      return resolveAlert(detail)
    case "submit-document-upload":
      return submitDocumentUpload()
    case "submit-goal-quick":
      return submitGoalQuick()
    default:
      return { ok: false, error: `No live handler for action "${detail.action}"` }
  }
}

/** Read the bridge global the runtime publishes, defensively — layers may load out of order. */
export function readLiveGlobal(): PerfLiveGlobal | null {
  if (typeof window === "undefined") return null
  return (window as any).__PERF_LIVE__ ?? null
}
