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
import { adaptTimesheet } from "./adapters"

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

/** Persist the same week/entry records read by the Accounting approval queue. */
export async function savePerformanceTimesheet(payload: any, submit = false): Promise<ActionResult> {
  try {
    const ending = String(payload?.weekEnding || "").slice(0, 10)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ending)) return { ok: false, error: "Choose a valid week ending date." }
    const entries = Array.isArray(payload?.entries) ? payload.entries : []
    if (submit && !entries.some((entry: any) => Number(entry.hours) > 0)) return { ok: false, error: "Add at least one time entry before submitting." }
    const initial: any = await apiClient.get("/accounting/timesheets/mine")
    const norm = (v: any) => String(v || "").slice(0, 10)
    const existing = (initial?.data || []).find((t: any) => norm(t.weekEnding) === ending)
    const keep = new Set<string>(), deleted = new Set<string>()
    for (const e of entries) {
      const hours = Number(e.hours) || 0
      if (hours <= 0) {
        if (e.entryId) { await apiClient.delete(`/accounting/timesheets/entries/${encodeURIComponent(e.entryId)}`); deleted.add(String(e.entryId)) }
        continue
      }
      if (!e.projectId || !e.date) throw new Error("Each time entry needs a project and date.")
      const body = {
        projectId: e.projectId, taskId: e.taskId || null, date: e.date, hours,
        billable: !!e.billable, notes: e.notes || null, source: e.source === "TIMER" ? "TIMER" : "MANUAL",
      }
      const res: any = e.entryId
        ? await apiClient.put(`/accounting/timesheets/entries/${encodeURIComponent(e.entryId)}`, body)
        : await apiClient.post(`/accounting/timesheets/${ending}/entries`, body)
      const savedId = res?.data?.entry?.id ?? res?.data?.id
      if (savedId) keep.add(String(savedId))
    }
    if (payload?.replaceAll && existing?.entries?.length) {
      for (const e of existing.entries) if (!keep.has(String(e.id)) && !deleted.has(String(e.id))) {
        await apiClient.delete(`/accounting/timesheets/entries/${encodeURIComponent(e.id)}`)
      }
    }
    if (!submit && !entries.some((entry: any) => Number(entry.hours) > 0)) {
      await apiClient.post(`/accounting/timesheets/${ending}/draft`, {})
    }
    if (submit) {
      const refreshed: any = await apiClient.get("/accounting/timesheets/mine")
      const saved = (refreshed?.data || []).find((t: any) => norm(t.weekEnding) === ending)
      if (!saved?.id) throw new Error("The saved timesheet could not be found for submission.")
      await apiClient.post(`/accounting/timesheets/${encodeURIComponent(saved.id)}/submit`, {})
    }
    await publishPerformanceLiveData()
    if (typeof window !== "undefined") {
      try { (window as any).__PERF_TIMESHEET_WEEK__ = await fetchPerformanceTimesheetWeek(ending) } catch { /* page renders its explicit unavailable state */ }
    }
    toast(submit ? "Timesheet submitted" : "Timesheet saved", submit ? "Your week is now waiting for manager approval." : "Your changes were saved to your timesheet.")
    return { ok: true }
  } catch (err: any) {
    const message = errorText(err, "Could not save the timesheet")
    toast("Could not save", message)
    return { ok: false, error: message }
  }
}

export async function fetchPerformanceTimesheetPolicy(): Promise<any> {
  const response: any = await apiClient.get("/accounting/timesheets/policy")
  return response?.data ?? null
}

export async function fetchPerformanceTimesheetWeek(weekEnding: string): Promise<any> {
  const response: any = await apiClient.get(`/accounting/timesheets/week/${encodeURIComponent(weekEnding)}`)
  return response?.data ? adaptTimesheet(response.data) : null
}

export async function fetchPerformanceTimesheetAudit(timesheetId: string): Promise<any[]> {
  const response: any = await apiClient.get(`/accounting/timesheets/${encodeURIComponent(timesheetId)}/audit`)
  return Array.isArray(response?.data) ? response.data : []
}

export interface BeforeActionDetail {
  action: string
  id?: string
  dataset?: Record<string, string>
  page?: string
  role?: string
}

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string }

export interface CompanyStrategyPayload {
  title: string
  periodStart: string
  periodEnd: string
  visionStatement: string
  pillarWeights: Record<string, number>
  metadata: Record<string, unknown>
}

/** Persist strategy cycles through the governed config API, then re-read the live registers. */
export async function saveCompanyStrategy(payload: CompanyStrategyPayload, strategyId?: string): Promise<ActionResult> {
  try {
    const path = strategyId
      ? `/performance/config/strategies/${encodeURIComponent(strategyId)}`
      : "/performance/config/strategies"
    const res: any = strategyId ? await apiClient.put(path, payload) : await apiClient.post(path, payload)
    await publishPerformanceLiveData()
    return { ok: true, message: String(res?.data?.id || strategyId || "") }
  } catch (err: any) {
    const message = errorText(err, "Could not save the company strategy")
    toast("Could not save strategy", message)
    return { ok: false, error: message }
  }
}

export async function createCompanyStrategyTheme(payload: { name: string; description?: string; perspective?: string }): Promise<ActionResult> {
  try {
    await apiClient.post("/performance/config/themes", payload)
    await publishPerformanceLiveData()
    return { ok: true }
  } catch (err: any) {
    const message = errorText(err, "Could not create the strategic theme")
    toast("Could not create theme", message)
    return { ok: false, error: message }
  }
}

export async function updateCompanyStrategyTheme(themeId: string, payload: { name?: string; description?: string; perspective?: string; status?: string }): Promise<ActionResult> {
  try {
    await apiClient.put(`/performance/config/themes/${encodeURIComponent(themeId)}`, payload)
    await publishPerformanceLiveData()
    return { ok: true }
  } catch (err: any) {
    const message = errorText(err, "Could not update the strategic theme")
    toast("Could not update theme", message)
    return { ok: false, error: message }
  }
}

export async function archiveCompanyStrategy(strategyId: string): Promise<ActionResult> {
  try {
    await apiClient.post(`/performance/config/strategies/${encodeURIComponent(strategyId)}/archive`, {})
    await publishPerformanceLiveData()
    return { ok: true }
  } catch (err: any) {
    const message = errorText(err, "Could not archive the company strategy")
    toast("Could not archive strategy", message)
    return { ok: false, error: message }
  }
}

export async function createCompanyStrategyObjective(payload: Record<string, unknown>): Promise<ActionResult> {
  let createdGoalId = ""
  try {
    const pillarIds: Record<string, string> = {
      Financial: "bsc_financial",
      "Customer & Market": "bsc_customer_market",
      "Internal Operations": "bsc_internal_operations",
      "Learning, Growth & HR": "bsc_learning_growth_hr",
    }
    const pillarId = pillarIds[String(payload.scorecardPillar || "")]
    const requestedWeights = { ...((payload.goalWeights as Record<string, number>) || {}) }
    if (!pillarId || Object.values(requestedWeights).reduce((sum, weight) => sum + Number(weight || 0), 0) + Number(payload.scorecardWeight || 0) !== 100) {
      throw new Error("Set all objective weights in this pillar so they total exactly 100%.")
    }
    const createPayload = { ...payload }
    delete createPayload.scorecardWeight
    delete createPayload.strategicThemeId
    const res: any = await apiClient.post("/performance/goals", createPayload)
    const goalId = String(res?.goal?.id || res?.data?.goal?.id || "")
    if (!goalId) throw new Error("The API did not return the saved objective.")
    createdGoalId = goalId
    const themeId = String(payload.strategicThemeId || "")
    await apiClient.put(`/performance/config/goals/${encodeURIComponent(goalId)}`, {
      strategyId: payload.strategyId,
      scorecardPillar: payload.scorecardPillar,
      ...(themeId ? { strategicThemeId: themeId } : {}),
    })
    const goalWeights = { ...requestedWeights, [goalId]: Number(payload.scorecardWeight) }
    await apiClient.put(`/performance/scorecard-pillars/${pillarId}/company-goal-weights`, { goalWeights })
    await publishPerformanceLiveData()
    return { ok: true, message: goalId }
  } catch (err: any) {
    if (createdGoalId) await apiClient.delete(`/performance/goals/${encodeURIComponent(createdGoalId)}`).catch(() => undefined)
    const message = errorText(err, "Could not create the strategic objective")
    toast("Could not create objective", message)
    return { ok: false, error: message }
  }
}

export async function deleteCompanyStrategyObjective(goalId: string): Promise<ActionResult> {
  try {
    await apiClient.delete(`/performance/goals/${encodeURIComponent(goalId)}`)
    await publishPerformanceLiveData()
    return { ok: true }
  } catch (err: any) {
    const message = errorText(err, "Could not remove the strategic objective")
    toast("Could not remove objective", message)
    return { ok: false, error: message }
  }
}

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
  pillarId?: string
  targetValue?: number
  amberThreshold?: number
  redThreshold?: number
  sourceSystem?: string
  updateMethod?: "manual" | "workflow" | "integrated"
  frequency?: "daily" | "weekly" | "monthly" | "quarterly" | "annually"
  evidenceRule?: string
  ownerId?: string
  department?: string
  performanceMetadata?: Record<string, unknown>
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

/** Save the complete set of fields supported by the governed KPI registry, optionally submitting for approval. */
export async function submitGovernedKpi(payload: KpiPayload, submitForApproval: boolean, existingId?: string | null): Promise<ActionResult> {
  try {
    let pillarId = payload.pillarId
    if (!pillarId && payload.perspective) {
      const pillarRes: any = await apiClient.get("/performance/scorecard-pillars")
      const pillars = Array.isArray(pillarRes?.data) ? pillarRes.data : Array.isArray(pillarRes?.pillars) ? pillarRes.pillars : []
      pillarId = pillars.find((p: any) => [p?.name, p?.displayName, p?.canonicalName].some((v) => String(v || "").toLowerCase() === String(payload.perspective).toLowerCase()))?.id
    }
    if (!pillarId) throw new Error("Choose a configured BSC perspective before saving this KPI.")
    const body = {
      name: payload.name, description: payload.description, code: payload.code, pillarId,
      unitKind: payload.unit || "number", isReverseKpi: !!payload.isReverseKpi,
      targetValue: payload.targetValue, amberThreshold: payload.amberThreshold, redThreshold: payload.redThreshold,
      sourceSystem: payload.sourceSystem, updateMethod: payload.updateMethod, frequency: payload.frequency,
      evidenceRule: payload.evidenceRule, ownerId: payload.ownerId, catalogDepartmentName: payload.department,
      performanceMetadata: payload.performanceMetadata,
    }
    const created: any = existingId
      ? await apiClient.put(`/performance/kpi-registry/${encodeURIComponent(existingId)}`, body)
      : await apiClient.post("/performance/kpi-registry", body)
    const id = created?.data?.id || created?.id
    if (!id) throw new Error("The KPI was saved without an identifier; it cannot enter the approval workflow.")
    if (submitForApproval) await apiClient.post(`/performance/kpi-registry/${encodeURIComponent(id)}/submit`, {})
    await publishPerformanceLiveData()
    toast(submitForApproval ? "KPI submitted" : "KPI draft saved", submitForApproval ? `${payload.code} is waiting for an authorized approver.` : `${payload.code} was saved to the governed KPI registry.`)
    return { ok: true, message: id }
  } catch (err: any) {
    const message = errorText(err, "Could not save the KPI")
    toast("Could not save", message)
    return { ok: false, error: message }
  }
}

export async function submitObjectiveCheckIn(goalId: string, payload: { value: number; confidence?: "high" | "medium" | "low"; note?: string }): Promise<ActionResult> {
  try {
    await apiClient.post(`/performance/goals/${encodeURIComponent(goalId)}/check-in`, payload)
    await publishPerformanceLiveData()
    toast("Check-in recorded", "The objective progress and check-in history were saved.")
    return { ok: true }
  } catch (err: any) {
    const message = errorText(err, "Could not record the objective check-in")
    toast("Check-in failed", message)
    return { ok: false, error: message }
  }
}

export async function fetchObjectiveCheckIns(goalId: string): Promise<any[]> {
  const res: any = await apiClient.get(`/performance/goals/${encodeURIComponent(goalId)}/check-ins`)
  return Array.isArray(res?.data) ? res.data : []
}

export async function uploadObjectiveEvidence(goalId: string, fileName: string, contentBase64: string, mimeType?: string): Promise<ActionResult> {
  try {
    await apiClient.post(`/performance/goals/${encodeURIComponent(goalId)}/attachments/base64`, { fileName, contentBase64, mimeType })
    await publishPerformanceLiveData()
    toast("Evidence uploaded", `${fileName} was attached to the objective.`)
    return { ok: true }
  } catch (err: any) {
    const message = errorText(err, "Could not upload objective evidence")
    toast("Evidence upload failed", message)
    return { ok: false, error: message }
  }
}

export async function fetchKpiRegistryAnalytics(filters: { period?: string; department?: string; pillar?: string } = {}): Promise<any> {
  const query = new URLSearchParams()
  if (filters.period) query.set("period", filters.period)
  if (filters.department) query.set("department", filters.department)
  if (filters.pillar) query.set("pillar", filters.pillar)
  const res: any = await apiClient.get(`/performance/kpi-registry/analytics${query.size ? `?${query.toString()}` : ""}`)
  return res?.data ?? null
}

export async function transitionGovernedKpi(id: string, action: "submit" | "approve" | "reject" | "retire" | "reinstate", note?: string): Promise<ActionResult> {
  try {
    await apiClient.post(`/performance/kpi-registry/${encodeURIComponent(id)}/${action}`, note ? { note } : {})
    await publishPerformanceLiveData()
    toast("KPI workflow updated", `The KPI was ${action === "submit" ? "submitted for approval" : action === "reinstate" ? "reinstated" : `${action}d`}.`)
    return { ok: true }
  } catch (err: any) {
    const message = errorText(err, "Could not update the KPI workflow")
    toast("KPI workflow failed", message)
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
  parentGoalId?: string
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
  title?: string
  reviewerUserId?: string
  approverUserId?: string
  metadata?: Record<string, unknown>
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
      title: payload.title,
      reviewerUserId: payload.reviewerUserId,
      approverUserId: payload.approverUserId,
      metadata: payload.metadata,
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

export interface ContractObjectivePayload {
  id?: string
  title: string
  description?: string
  scorecardPillar: string
  scorecardSection?: string
  scorecardWeight: number
  targetValue: number
  targetUnit: string
  measureName?: string
  evidenceRequirement?: string
  kpiId?: string
  formulaType?: "TASK_COMPLETION" | null
}

export async function fetchPerformanceContractDetail(contractId: string): Promise<any> {
  const res: any = await apiClient.get(`/performance/contracts/${encodeURIComponent(contractId)}/detail`)
  return res?.data ?? null
}

export async function savePerformanceContractObjectives(contractId: string, objectives: ContractObjectivePayload[]): Promise<ActionResult> {
  try {
    await apiClient.put(`/performance/contracts/${encodeURIComponent(contractId)}/objectives`, { objectives })
    await publishPerformanceLiveData()
    toast("Objectives saved", "Contract objectives and their 100% weight allocation were saved.")
    return { ok: true }
  } catch (err: any) {
    const message = errorText(err, "Could not save contract objectives")
    toast("Could not save objectives", message)
    return { ok: false, error: message }
  }
}

export async function convertPerformanceGoalToTask(goalId: string): Promise<ActionResult> {
  try {
    await apiClient.post(`/performance/individual-goals/${encodeURIComponent(goalId)}/convert-to-tasks`, {})
    await publishPerformanceLiveData()
    return { ok: true }
  } catch (err: any) {
    const message = errorText(err, "Could not create the linked task")
    toast("Task was not created", message)
    return { ok: false, error: message }
  }
}

export async function updatePerformanceTaskStage(taskId: string, stage: string, options: { silent?: boolean } = {}): Promise<ActionResult> {
  try {
    await apiClient.put(`/tasks/${encodeURIComponent(taskId)}/stage`, { stage })
    await publishPerformanceLiveData()
    return { ok: true }
  } catch (err: any) {
    const message = errorText(err, "Could not update the task")
    if (!options.silent) toast("Task was not updated", message)
    return { ok: false, error: message }
  }
}

export async function fetchPerformanceTaskWorkspace(taskId: string): Promise<any> {
  const [taskRes, commentsRes, subtasksRes, dependenciesRes] = await Promise.all([
    apiClient.get(`/tasks/${encodeURIComponent(taskId)}`),
    apiClient.get(`/tasks/${encodeURIComponent(taskId)}/comments`),
    apiClient.get(`/tasks/${encodeURIComponent(taskId)}/subtasks`),
    apiClient.get(`/tasks/${encodeURIComponent(taskId)}/dependencies`),
  ])
  return {
    task: (taskRes as any)?.task ?? (taskRes as any)?.data ?? null,
    comments: Array.isArray((commentsRes as any)?.comments) ? (commentsRes as any).comments : [],
    subtasks: Array.isArray((subtasksRes as any)?.data) ? (subtasksRes as any).data : [],
    dependencies: Array.isArray((dependenciesRes as any)?.data) ? (dependenciesRes as any).data : [],
  }
}

export async function updatePerformanceTask(taskId: string, payload: Record<string, unknown>): Promise<any> {
  const res: any = await apiClient.put(`/tasks/${encodeURIComponent(taskId)}`, payload)
  await publishPerformanceLiveData()
  return res?.task ?? res?.data ?? null
}

export async function changePerformanceTaskStage(taskId: string, stage: string): Promise<any> {
  const res: any = await apiClient.put(`/tasks/${encodeURIComponent(taskId)}/stage`, { stage })
  await publishPerformanceLiveData()
  return res?.task ?? res?.data ?? null
}

export async function addPerformanceTaskSubtask(taskId: string, title: string): Promise<any> {
  const res: any = await apiClient.post(`/tasks/${encodeURIComponent(taskId)}/subtasks`, { title })
  return res?.data
}

export async function updatePerformanceTaskSubtask(taskId: string, subtaskId: string, completed: boolean): Promise<any> {
  const res: any = await apiClient.put(`/tasks/${encodeURIComponent(taskId)}/subtasks/${encodeURIComponent(subtaskId)}`, { completed })
  return res?.data
}

export async function deletePerformanceTaskSubtask(taskId: string, subtaskId: string): Promise<any> {
  const res: any = await apiClient.delete(`/tasks/${encodeURIComponent(taskId)}/subtasks/${encodeURIComponent(subtaskId)}`)
  return res?.data
}

export async function addPerformanceTaskDependency(taskId: string, dependencyId: string): Promise<any[]> {
  const res: any = await apiClient.post(`/tasks/${encodeURIComponent(taskId)}/dependencies`, { dependencyId })
  return Array.isArray(res?.data) ? res.data : []
}

export async function removePerformanceTaskDependency(taskId: string, dependencyId: string): Promise<any[]> {
  const res: any = await apiClient.delete(`/tasks/${encodeURIComponent(taskId)}/dependencies/${encodeURIComponent(dependencyId)}`)
  return Array.isArray(res?.data) ? res.data : []
}

export async function uploadPerformanceTaskAttachments(taskId: string, files: File[]): Promise<any[]> {
  const form = new FormData()
  files.forEach((file) => form.append("attachments", file))
  const res: any = await apiClient.postFormData(`/tasks/${encodeURIComponent(taskId)}/attachments`, form)
  return Array.isArray(res?.result?.attachments) ? res.result.attachments : []
}

export async function postPerformanceTaskComment(taskId: string, content: string): Promise<any> {
  const form = new FormData()
  form.append("content", content)
  const res: any = await apiClient.postFormData(`/tasks/${encodeURIComponent(taskId)}/comments`, form)
  return res?.comment ?? res?.data ?? res
}

export async function duplicatePerformanceTask(taskId: string): Promise<any> {
  const res: any = await apiClient.post(`/tasks/${encodeURIComponent(taskId)}/duplicate`, {})
  await publishPerformanceLiveData()
  return res?.data ?? null
}

export async function archivePerformanceTask(taskId: string): Promise<void> {
  await apiClient.post(`/tasks/${encodeURIComponent(taskId)}/archive`, {})
  await publishPerformanceLiveData()
}

export async function sharePerformanceTask(taskId: string, userIds: string[]): Promise<any> {
  const res: any = await apiClient.put(`/tasks/${encodeURIComponent(taskId)}/share`, { userIds })
  await publishPerformanceLiveData()
  return res?.data ?? null
}

export async function sendPerformanceTimesheetMessage(timesheetId: string, recipientId: string, message: string): Promise<ActionResult> {
  try {
    await apiClient.post(`/accounting/timesheets/${encodeURIComponent(timesheetId)}/message`, { recipientId, message })
    toast("Message sent", "Your message was added to the approver's notifications.")
    return { ok: true }
  } catch (err: any) {
    const messageText = errorText(err, "Could not send the message")
    toast("Could not send message", messageText)
    return { ok: false, error: messageText }
  }
}

export async function fetchPerformanceTaskPriorities(): Promise<string[]> {
  const res: any = await apiClient.get("/tasks/filter-options/priorities")
  return Array.isArray(res?.data) ? res.data.map((value: unknown) => String(value)) : []
}

export async function fetchArchivedPerformanceTasks(): Promise<any[]> {
  const res: any = await apiClient.get("/tasks?stage=archived&includeArchived=true")
  return Array.isArray(res?.tasks) ? res.tasks : Array.isArray(res?.data) ? res.data : []
}

export async function createPerformanceProject(payload: Record<string, unknown>): Promise<ActionResult> {
  try {
    await apiClient.post("/performance/projects", payload)
    await publishPerformanceLiveData()
    return { ok: true }
  } catch (err: any) { return { ok: false, error: errorText(err, "Could not create the project") } }
}

export async function updatePerformanceProjectStatus(id: string, status: string, note?: string): Promise<ActionResult> {
  try {
    await apiClient.post(`/performance/projects/${encodeURIComponent(id)}/status`, { status, note })
    await publishPerformanceLiveData()
    return { ok: true }
  } catch (err: any) { return { ok: false, error: errorText(err, "Could not update the project status") } }
}

export async function assignPerformanceProjectTasks(id: string, taskIds: string[]): Promise<ActionResult> {
  try {
    const response: any = await apiClient.post(`/performance/projects/${encodeURIComponent(id)}/tasks`, { taskIds })
    if (Number(response?.data?.assigned) !== taskIds.length) throw new Error("One or more tasks were not added to this project.")
    await publishPerformanceLiveData()
    return { ok: true }
  } catch (err: any) { return { ok: false, error: errorText(err, "Could not add tasks to the project") } }
}

export async function unassignPerformanceProjectTasks(id: string, taskIds: string[]): Promise<ActionResult> {
  try {
    const response: any = await apiClient.delete(`/performance/projects/${encodeURIComponent(id)}/tasks`, { body: JSON.stringify({ taskIds }) })
    if (Number(response?.data?.removed) !== taskIds.length) throw new Error("One or more tasks were not removed from this project.")
    await publishPerformanceLiveData()
    return { ok: true }
  } catch (err: any) { return { ok: false, error: errorText(err, "Could not remove tasks from the project") } }
}

export async function amendPerformanceContract(contractId: string, payload: Record<string, unknown>): Promise<ActionResult> {
  try {
    await apiClient.put(`/performance/contracts/${encodeURIComponent(contractId)}/amend`, payload)
    await publishPerformanceLiveData()
    toast("Contract amended", "A new contract version was created and sign-offs were reset.")
    return { ok: true }
  } catch (err: any) {
    const message = errorText(err, "Could not amend the contract")
    toast("Could not amend contract", message)
    return { ok: false, error: message }
  }
}

async function contractLifecycleAction(contractId: string, action: "request-signatures" | "sign" | "close" | "reopen", body: Record<string, unknown> = {}): Promise<ActionResult> {
  try {
    await apiClient.post(`/performance/contracts/${encodeURIComponent(contractId)}/${action}`, body)
    await publishPerformanceLiveData()
    const labels = { "request-signatures": "Contract sent for signatures", sign: "Contract signed", close: "Contract closed", reopen: "Contract reopened" }
    toast(labels[action], "The updated contract state has been saved.")
    return { ok: true }
  } catch (err: any) {
    const message = errorText(err, `Could not ${action.replaceAll("-", " ")}`)
    toast("Contract action failed", message)
    return { ok: false, error: message }
  }
}

export const requestPerformanceContractSignatures = (id: string) => contractLifecycleAction(id, "request-signatures")
export const signPerformanceContract = (id: string, note?: string) => contractLifecycleAction(id, "sign", { note })
export const closePerformanceContract = (id: string, note: string) => contractLifecycleAction(id, "close", { note })
export const reopenPerformanceContract = (id: string, note: string) => contractLifecycleAction(id, "reopen", { note })

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
