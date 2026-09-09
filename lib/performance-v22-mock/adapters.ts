/**
 * Performance V22 — backend shape -> view model.
 *
 * Every field here is either present in the real response or explicitly null. Nothing is
 * defaulted to a plausible-looking number: a count the API does not return becomes `null`
 * and renders as "—", not as an invented figure. That rule is the whole point of this
 * exercise — the module's current problem is that it shows 12 departments when there are 9.
 */
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
  PerfDocumentFolders,
  PerfKpi,
  PerfContract,
  PerfDeptScorecard,
  PerfEmployeeScorecard,
  PerfGovScorecard,
  PerfMyScorecard,
  PerfNamed,
  PerfOrgBsc,
  PerfPillar,
  PerfScoreRow,
  PerfReview,
  PerfRisk,
  PerfTask,
  PerfTeamTimesheet,
  PerfTimesheet,
  PerfUser,
  PerfVision,
} from "./types"

const str = (v: unknown): string => (typeof v === "string" ? v : v == null ? "" : String(v))
const strOrNull = (v: unknown): string | null => {
  const s = str(v).trim()
  return s === "" ? null : s
}

/**
 * `GET /api/departments` returns `{ success, data, count }`. Items carry
 * id/name/description/branch/isActive. They do NOT carry the `_count` that
 * `lib/api/department-api.ts` declares, so member counts resolve to null unless the payload
 * genuinely includes one.
 */
export function adaptDepartment(raw: any): PerfDepartment {
  const count =
    typeof raw?._count?.users === "number"
      ? raw._count.users
      : Array.isArray(raw?.users)
        ? raw.users.length
        : null
  return {
    id: str(raw?.id),
    name: str(raw?.name),
    description: str(raw?.description),
    branch: strOrNull(raw?.branch),
    isActive: raw?.isActive !== false,
    userCount: count,
  }
}

/**
 * `GET /api/tasks` returns `{ success, count, tasks }` — note the array key is `tasks`, not
 * `data`, unlike departments. `team` is an array of assignees; the first is treated as the
 * owner for display, and an empty team yields null rather than a placeholder name.
 */
export function adaptTask(raw: any): PerfTask {
  const team = Array.isArray(raw?.team) ? raw.team : []
  const first = team[0]
  const owner =
    strOrNull(first?.name) ??
    strOrNull([first?.firstName, first?.lastName].filter(Boolean).join(" ")) ??
    strOrNull(first?.email)

  return {
    id: str(raw?.id),
    title: str(raw?.title),
    description: str(raw?.description),
    stage: str(raw?.stage),
    priority: str(raw?.priority),
    department: strOrNull(raw?.department),
    category: strOrNull(raw?.category ?? raw?.performanceCategory),
    owner,
    dueDate: strOrNull(raw?.date),
    isOverdue: raw?.isOverdue === true,
    isPerformanceTask: raw?.isPerformanceTask === true,
    goalId: strOrNull(raw?.goalId),
  }
}

/**
 * Pull the array out of an envelope whose key differs per endpoint. Tries the documented
 * keys in order and returns [] rather than throwing, so one endpoint changing shape degrades
 * to an empty state instead of blanking the page.
 */
export function pickArray(payload: any, ...keys: string[]): any[] {
  for (const k of keys) {
    const v = payload?.[k]
    if (Array.isArray(v)) return v
  }
  return Array.isArray(payload) ? payload : []
}

/**
 * Generic named record — pillars, themes, strategies and goals all reduce to this for the
 * read paths currently wired. Field names differ per endpoint, so each candidate is tried in
 * order and anything absent becomes null rather than an empty-string placeholder.
 */
export function adaptNamed(raw: any): PerfNamed {
  return {
    id: str(raw?.id),
    name: str(raw?.name ?? raw?.title ?? raw?.label),
    description: strOrNull(raw?.description ?? raw?.summary),
    status: strOrNull(raw?.status ?? raw?.state),
  }
}

/**
 * `GET /api/kpis` returns `{ success, count, kpis }` — note the array key is `kpis`.
 *
 * This is deliberately NOT `/api/performance/kpis`: that path serves 34 rows from
 * `src/config/hardcodedKPIs.ts` while POST/PATCH on the same path write to the `kpis` table,
 * so reading it would show fixtures and permanently hide anything a user creates.
 */
export function adaptKpi(raw: any): PerfKpi {
  return {
    ...adaptNamed(raw),
    code: strOrNull(raw?.code ?? raw?.kpiCode),
    department: strOrNull(raw?.department ?? raw?.departmentName),
    owner:
      strOrNull(raw?.owner?.name) ??
      strOrNull([raw?.owner?.firstName, raw?.owner?.lastName].filter(Boolean).join(" ")) ??
      strOrNull(raw?.ownerName),
    frequency: strOrNull(raw?.frequency ?? raw?.trackingFrequency ?? raw?.updateFrequency),
    target: strOrNull(raw?.target ?? raw?.targetValue),
  }
}

/* ---------------------------------------------------------------------------------------
 * Scopes added once the Performance backend gained its own tables (corrective actions,
 * alerts, document vault) and once the remaining read endpoints were verified over HTTP.
 *
 * The same rule applies throughout: a value the API does not supply becomes `null`, which
 * the runtime renders as an em dash. Nothing is defaulted to 0, to "N/A", or to a plausible
 * figure — a zero is a fact and must only appear when the backend actually said zero.
 * ------------------------------------------------------------------------------------- */

const num = (v: unknown): number | null => {
  if (typeof v === "number") return Number.isFinite(v) ? v : null
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  return null
}

/** Person -> display name, trying the shapes the different endpoints actually use. */
const personName = (v: any): string | null =>
  strOrNull(v?.name) ??
  strOrNull([v?.firstName, v?.lastName].filter(Boolean).join(" ")) ??
  strOrNull(v?.email)

/** `GET /api/users` -> `{ success, message, data, count }`. */
export function adaptUser(raw: any): PerfUser {
  return {
    id: str(raw?.id),
    name: personName(raw) ?? str(raw?.email),
    email: strOrNull(raw?.email),
    department: strOrNull(raw?.userDepartment ?? raw?.department?.name),
    departmentRole: strOrNull(raw?.departmentRole),
    roleCode: strOrNull(raw?.roleCode),
    role: strOrNull(raw?.role?.name ?? raw?.role),
  }
}

/**
 * `GET /api/performance/corrective-actions`.
 *
 * `isOverdue` is computed here when the payload does not carry it: a target date in the past
 * with a non-closed status is overdue. With no target date at all the action is NOT overdue —
 * an absent deadline is not a missed one.
 */
export function adaptCorrectiveAction(raw: any): PerfCorrectiveAction {
  const status = strOrNull(raw?.status)
  const targetDate = strOrNull(raw?.targetDate)
  const overdue =
    typeof raw?.isOverdue === "boolean"
      ? raw.isOverdue
      : targetDate != null && status !== "closed" && new Date(targetDate).getTime() < Date.now()
  return {
    id: str(raw?.id),
    name: str(raw?.title),
    description: strOrNull(raw?.description),
    status,
    reference: strOrNull(raw?.reference),
    trigger: strOrNull(raw?.trigger ?? raw?.triggerSource),
    severity: strOrNull(raw?.severity),
    progress: num(raw?.progress),
    owner: personName(raw?.owner),
    ownerId: strOrNull(raw?.ownerId),
    department: strOrNull(raw?.department?.name),
    departmentId: strOrNull(raw?.departmentId),
    targetDate,
    closedAt: strOrNull(raw?.closedAt),
    createdAt: strOrNull(raw?.createdAt),
    isOverdue: overdue,
  }
}

/**
 * `GET /api/performance/alerts`.
 *
 * The table has no `elapsed` column by design — PerformanceAlertService derives
 * `elapsedMinutes` from `raisedAt` on every read so it can never go stale. If a payload
 * omits it, it is recomputed here from `raisedAt` rather than shown as zero.
 */
export function adaptAlert(raw: any): PerfAlert {
  const raisedAt = strOrNull(raw?.raisedAt)
  const elapsed =
    num(raw?.elapsedMinutes) ??
    (raisedAt ? Math.max(0, Math.round((Date.now() - new Date(raisedAt).getTime()) / 60000)) : null)
  return {
    id: str(raw?.id),
    name: str(raw?.title),
    description: strOrNull(raw?.description),
    status: strOrNull(raw?.status),
    reference: strOrNull(raw?.reference),
    source: strOrNull(raw?.source),
    severity: strOrNull(raw?.severity),
    owner: personName(raw?.owner),
    ownerId: strOrNull(raw?.ownerId),
    department: strOrNull(raw?.department?.name),
    departmentId: strOrNull(raw?.departmentId),
    escalationLevel: num(raw?.escalationLevel) ?? 0,
    raisedAt,
    acknowledgedAt: strOrNull(raw?.acknowledgedAt),
    resolvedAt: strOrNull(raw?.resolvedAt),
    elapsedMinutes: elapsed,
  }
}

/** `GET /api/performance/documents` — the Document Vault. */
export function adaptDocument(raw: any): PerfDocument {
  return {
    id: str(raw?.id),
    name: str(raw?.name),
    description: null,
    status: strOrNull(raw?.status),
    folder: strOrNull(raw?.folder),
    category: strOrNull(raw?.category),
    version: strOrNull(raw?.version),
    fileUrl: strOrNull(raw?.fileUrl),
    mimeType: strOrNull(raw?.mimeType),
    fileSizeBytes: num(raw?.fileSizeBytes),
    owner: personName(raw?.owner),
    ownerId: strOrNull(raw?.ownerId),
    department: strOrNull(raw?.department?.name),
    departmentId: strOrNull(raw?.departmentId),
    uploadedBy: personName(raw?.uploadedBy),
    retentionUntil: strOrNull(raw?.retentionUntil),
    createdAt: strOrNull(raw?.createdAt),
    updatedAt: strOrNull(raw?.updatedAt),
  }
}

/** `GET /api/performance-reviews` -> `data.reviews`. */
export function adaptReview(raw: any): PerfReview {
  return {
    id: str(raw?.id),
    name: str(raw?.title ?? raw?.name ?? raw?.reviewType ?? "Review"),
    description: strOrNull(raw?.description ?? raw?.summary),
    status: strOrNull(raw?.status),
    employee: personName(raw?.employee ?? raw?.user ?? raw?.reviewee),
    employeeId: strOrNull(raw?.employeeId ?? raw?.userId ?? raw?.revieweeId),
    reviewer: personName(raw?.reviewer),
    reviewerId: strOrNull(raw?.reviewerId),
    department: strOrNull(raw?.department?.name ?? raw?.department),
    cycle: strOrNull(raw?.cycle?.name ?? raw?.cycleName ?? raw?.reviewCycle?.name),
    periodStart: strOrNull(raw?.periodStart ?? raw?.startDate),
    periodEnd: strOrNull(raw?.periodEnd ?? raw?.endDate),
    dueDate: strOrNull(raw?.dueDate),
    score: num(raw?.overallScore ?? raw?.score ?? raw?.finalScore),
    submittedAt: strOrNull(raw?.submittedAt),
    completedAt: strOrNull(raw?.completedAt),
  }
}

/** `GET /api/accounting/timesheets/mine`. */
export function adaptTimesheet(raw: any): PerfTimesheet {
  return {
    id: str(raw?.id),
    name: str(raw?.title ?? raw?.periodLabel ?? raw?.weekOf ?? "Timesheet"),
    description: strOrNull(raw?.notes ?? raw?.description),
    status: strOrNull(raw?.status),
    periodStart: strOrNull(raw?.periodStart ?? raw?.startDate ?? raw?.weekStart),
    periodEnd: strOrNull(raw?.periodEnd ?? raw?.endDate ?? raw?.weekEnd),
    totalHours: num(raw?.totalHours ?? raw?.hours),
    billableHours: num(raw?.billableHours),
    submittedAt: strOrNull(raw?.submittedAt),
    approvedAt: strOrNull(raw?.approvedAt),
    approver: personName(raw?.approver ?? raw?.approvedBy),
  }
}

/**
 * `GET /api/performance/config/pillars` -> `data.pillars`.
 *
 * These are the four configured BSC perspectives with their weights. A weight is a
 * configuration value, not a score — it must never be rendered as attainment.
 */
export function adaptPillar(raw: any): PerfPillar {
  return {
    name: str(raw?.name),
    displayName: str(raw?.uatDisplayName ?? raw?.displayName ?? raw?.name),
    weight: num(raw?.weight),
    nonDeletable: raw?.nonDeletable === true,
  }
}

/** `GET /api/performance/analytics/departments/comparison` -> `data.departments`. */
export function adaptDeptComparison(raw: any): PerfDeptComparison {
  return {
    department: str(raw?.department),
    goalsTotal: num(raw?.goals?.total),
    goalsCompleted: num(raw?.goals?.completed),
    goalsCompletionRate: num(raw?.goals?.completionRate),
    individualGoalsTotal: num(raw?.individualGoals?.total),
    individualGoalsCompleted: num(raw?.individualGoals?.completed),
    usersTotal: num(raw?.users?.total),
    usersManagers: num(raw?.users?.managers),
    progressPercentage: num(raw?.progress?.progressPercentage),
  }
}

/**
 * Tally objects from the `/summary` endpoints.
 *
 * `?? 0` is safe here and only here: both summary endpoints emit every bucket on every
 * response, so a missing key means the tally really is zero rather than unknown.
 */
export function adaptCorrectiveSummary(raw: any): PerfCorrectiveSummary | null {
  if (!raw || typeof raw !== "object") return null
  return {
    open: num(raw.open) ?? 0,
    overdue: num(raw.overdue) ?? 0,
    byStatus: (raw.byStatus && typeof raw.byStatus === "object" ? raw.byStatus : {}) as Record<string, number>,
    bySeverity: (raw.bySeverity && typeof raw.bySeverity === "object" ? raw.bySeverity : {}) as Record<string, number>,
  }
}

export function adaptAlertSummary(raw: any): PerfAlertSummary | null {
  if (!raw || typeof raw !== "object") return null
  return {
    critical: num(raw.critical) ?? 0,
    open: num(raw.open) ?? 0,
    escalated: num(raw.escalated) ?? 0,
    total: num(raw.total) ?? 0,
    byStatus: (raw.byStatus && typeof raw.byStatus === "object" ? raw.byStatus : {}) as Record<string, number>,
    bySeverity: (raw.bySeverity && typeof raw.bySeverity === "object" ? raw.bySeverity : {}) as Record<string, number>,
  }
}

export function adaptDocumentFolders(raw: any): PerfDocumentFolders | null {
  if (!raw || typeof raw !== "object") return null
  const folders = Array.isArray(raw.folders) ? raw.folders : []
  return {
    folders: folders.map((f: any) =>
      typeof f === "string"
        ? { name: f, count: null }
        : { name: str(f?.name ?? f?.folder), count: num(f?.count ?? f?.total) },
    ),
    totalDocuments: num(raw.totalDocuments),
  }
}

export function adaptAnalyticsKpi(raw: any): PerfAnalyticsKpi | null {
  const s = raw?.summary
  if (!s || typeof s !== "object") return null
  return {
    totalKPIs: num(s.totalKPIs),
    totalGoals: num(s.totalGoals),
    goalsWithoutKpi: num(s.goalsWithoutKpi),
    averageProgress: num(s.averageProgress),
  }
}

export function adaptAnalyticsDashboard(raw: any): PerfAnalyticsDashboard | null {
  const o = raw?.overview
  if (!o || typeof o !== "object") return null
  const breakdown = Array.isArray(raw?.userBreakdown) ? raw.userBreakdown : []
  return {
    totalCompanyGoals: num(o.totalCompanyGoals),
    totalDepartments: num(o.totalDepartments),
    totalUsers: num(o.totalUsers),
    totalTasks: num(o.totalTasks),
    completedTasks: num(o.completedTasks),
    overallProgress: num(o.overallProgress),
    userBreakdown: breakdown
      .map((b: any) => ({ department: str(b?.department), userCount: num(b?.userCount) ?? 0 }))
      .filter((b: { department: string }) => b.department !== ""),
  }
}

export function adaptAnalyticsReports(raw: any): PerfAnalyticsReports | null {
  const s = raw?.summary
  if (!s || typeof s !== "object") return null
  return {
    total: num(s.total),
    completed: num(s.completed),
    inProgress: num(s.inProgress),
    planning: num(s.planning),
    averageProgress: num(s.averageProgress),
  }
}

export function adaptVision(raw: any): PerfVision | null {
  if (!raw || typeof raw !== "object") return null
  return {
    strategyId: strOrNull(raw.strategyId),
    visionStatement: strOrNull(raw.visionStatement),
  }
}

/**
 * `GET /api/risk-assessments`.
 *
 * Every numeric field stays `null` when absent — a risk with no score must not read as 0,
 * which on a risk register would mean "no risk" rather than "not assessed".
 */
export function adaptRisk(raw: any): PerfRisk {
  return {
    ...adaptNamed(raw),
    assessmentType: strOrNull(raw?.assessmentType),
    companyName: strOrNull(raw?.companyName),
    sector: strOrNull(raw?.sector),
    stage: strOrNull(raw?.stage),
    overallRiskScore: num(raw?.overallRiskScore),
    riskLevel: strOrNull(raw?.riskLevel),
    recommendation: strOrNull(raw?.recommendation),
    assignedTo: personName(raw?.assignedTo),
    targetCompletionDate: strOrNull(raw?.targetCompletionDate),
    completedAt: strOrNull(raw?.completedAt),
  }
}

/**
 * `GET /api/performance/contracts`.
 *
 * `adaptNamed` takes `title` for `name`. `departmentName` is a denormalised string on the
 * contract, not a relation, so it is read directly rather than through `department.name`.
 */
export function adaptContract(raw: any): PerfContract {
  return {
    ...adaptNamed(raw),
    contractType: strOrNull(raw?.contractType),
    periodLabel: strOrNull(raw?.periodLabel),
    periodStart: strOrNull(raw?.periodStart),
    periodEnd: strOrNull(raw?.periodEnd),
    subject: personName(raw?.subjectUser),
    subjectId: strOrNull(raw?.subjectUserId),
    department: strOrNull(raw?.departmentName ?? raw?.department?.name),
    reviewer: personName(raw?.reviewer),
    approver: personName(raw?.approver),
    allocatedBudget: num(raw?.allocatedBudget),
    actualSpend: num(raw?.actualSpend),
  }
}

/** `GET /api/accounting/timesheets/team`. Same shape as `adaptTimesheet` plus who it belongs to. */
export function adaptTeamTimesheet(raw: any): PerfTeamTimesheet {
  const base = adaptTimesheet(raw)
  return {
    ...base,
    employee: personName(raw?.user),
    employeeId: strOrNull(raw?.userId ?? raw?.user?.id),
    department: strOrNull(raw?.user?.userDepartment),
  }
}

/**
 * `GET /api/performance/scorecards/org-bsc` -> `data`.
 *
 * Real, computed values from `PerformanceScorecardService` — not a stub. Verified by
 * creating a contract + a goal linked to a pillar and watching `pillarScore` change from 0
 * to a real weighted number, then deleting the probe records.
 */
export function adaptOrgBsc(raw: any): PerfOrgBsc | null {
  if (!raw || typeof raw !== "object") return null
  const pillars = Array.isArray(raw.pillars) ? raw.pillars : []
  return {
    organisationName: strOrNull(raw.organisationName),
    reviewPeriod: strOrNull(raw.reviewPeriod),
    periodStart: strOrNull(raw.periodStart),
    periodEnd: strOrNull(raw.periodEnd),
    overallScore: num(raw.orgBscScore ?? raw.overallScore),
    status: strOrNull(raw.orgBscStatus),
    visionStatement: strOrNull(raw.ceoVision?.statement),
    pillars: pillars.map((p: any) => ({
      code: str(p?.pillarCode),
      label: str(p?.pillarLabel),
      weight: num(p?.pillarWeight),
      score: num(p?.pillarScore),
      status: strOrNull(p?.pillarStatus),
      goalCount: Array.isArray(p?.goals) ? p.goals.length : 0,
    })),
  }
}

/**
 * `GET /api/performance/scorecards/user`.
 *
 * Very commonly a 404/500 with a human explanation — "no active contract" or "no goals
 * linked to the contract" — rather than a payload. `live-loaders.ts` catches that and turns
 * it into `{available:false, blockedReason: <the backend's own sentence>}` rather than
 * treating it as a scope error, because it isn't one: the endpoint is working correctly and
 * telling the truth about why there is nothing to show.
 */
/** A goal row (department/employee scorecards) -> the shared PerfScoreRow shape. */
function goalToScoreRow(raw: any): PerfScoreRow {
  return {
    id: str(raw?.id),
    name: str(raw?.goalName ?? raw?.title),
    weight: num(raw?.weight ?? raw?.effectiveWeight),
    score: num(raw?.weightedScore),
    status: strOrNull(raw?.rawRatingLabel ?? raw?.status),
  }
}

/** A governance section (board/CEO scorecards) -> the shared PerfScoreRow shape. */
function sectionToScoreRow(code: string, raw: any): PerfScoreRow {
  return {
    id: code,
    name: str(raw?.label),
    weight: num(raw?.weight) != null ? Number(raw.weight) * 100 : null,
    score: num(raw?.sectionScore),
    status: strOrNull(raw?.performanceLabel),
  }
}

/**
 * `GET /api/performance/scorecards/user` — the FULL response body was verified to carry
 * `scores.finalScore`, not a top-level `overallScore`/`finalScore` (an earlier version of
 * this adapter guessed wrong and always read null). `rows` are the linked goals.
 */
export function adaptMyScorecard(raw: any): PerfMyScorecard | null {
  if (!raw || typeof raw !== "object") return null
  const goals = Array.isArray(raw.goals) ? raw.goals : []
  return {
    available: true,
    blockedReason: null,
    overallScore: num(raw.scores?.finalScore),
    status: strOrNull(raw.scores?.performanceLabel ?? raw.lifecycle?.phase),
    goalCount: goals.length,
    contractTitle: strOrNull(raw.contract?.title),
    periodLabel: strOrNull(raw.contract?.periodLabel),
    rows: goals.map(goalToScoreRow),
  }
}

/**
 * `GET /api/performance/scorecards/department/:department`. Verified end to end: created a
 * real department contract + a scored goal and watched `scores.departmentScore` respond.
 */
export function adaptDeptScorecard(department: string, raw: any): PerfDeptScorecard | null {
  if (!raw || typeof raw !== "object") return null
  const goals = Array.isArray(raw.goals) ? raw.goals : []
  return {
    available: true,
    blockedReason: null,
    department,
    overallScore: num(raw.scores?.departmentScore),
    status: strOrNull(raw.scores?.performanceLabel),
    manager: strOrNull(raw.department?.managerName ?? raw.department?.headOfDepartmentName),
    rows: goals.map(goalToScoreRow),
  }
}

/**
 * `GET /api/performance/scorecards/{board,ceo}`. A five-section governance form (Outcomes /
 * Outputs / Governance-or-Service-Delivery / Resources / Programmes), not the four-pillar
 * BSC — read directly off the verified response shape, not assumed from the org-bsc pattern.
 */
export function adaptGovScorecard(raw: any, chairOrCeoKey: "board" | "ceo"): PerfGovScorecard | null {
  if (!raw || typeof raw !== "object") return null
  const sections = raw.sections && typeof raw.sections === "object" ? raw.sections : {}
  const rows = Object.entries(sections).map(([code, section]) => sectionToScoreRow(code, section))
  const person = chairOrCeoKey === "board" ? raw.board?.chairpersonName : raw.ceo?.name
  return {
    available: true,
    blockedReason: null,
    overallScore: num(raw.scores?.finalScore),
    status: strOrNull(raw.scores?.performanceLabel),
    chairOrCeo: strOrNull(person),
    rows,
  }
}

/** `GET /api/performance/scorecards/employee/:id` — on-demand drill for a specific colleague. */
export function adaptEmployeeScorecard(employeeId: string, raw: any): PerfEmployeeScorecard | null {
  if (!raw || typeof raw !== "object") return null
  const goals = Array.isArray(raw.goals) ? raw.goals : []
  return {
    available: true,
    blockedReason: null,
    employeeId,
    employeeName: strOrNull(raw.employee?.name),
    overallScore: num(raw.scores?.finalScore),
    status: strOrNull(raw.scores?.performanceLabel),
    rows: goals.map(goalToScoreRow),
  }
}
