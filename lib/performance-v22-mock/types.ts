/**
 * Performance V22 — view-model types for the live-data bridge.
 *
 * These describe what the vendored runtime's render layers need, NOT what the backend
 * returns. Backend shapes are mapped in `adapters.ts`, deliberately, because the two do not
 * line up and the API envelopes are inconsistent between endpoints. Every envelope below was
 * verified by calling the endpoint against the running API (8 Sep 2026), not inferred:
 *
 *   GET /api/departments                             -> { success, data,  count }
 *   GET /api/tasks                                   -> { success, tasks, count }
 *   GET /api/kpis                                    -> { success, kpis,  count }
 *   GET /api/performance/scorecard-pillars           -> { success, data }
 *   GET /api/performance/config/themes|strategies    -> { success, message, data, timestamp }
 *   GET /api/performance/config/pillars              -> { success, message, data: { pillars, ... } }
 *   GET /api/performance/config/vision-statement     -> { success, message, data: { visionStatement } }
 *   GET /api/performance/config/strategies/archives  -> { success, message, data }
 *   GET /api/performance/goals                       -> { success, count, goals }
 *   GET /api/performance/contracts                   -> { success, count, total, skip, take, data }
 *   GET /api/risk-assessments                        -> { success, assessments }
 *   GET /api/performance/corrective-actions          -> { success, data }
 *   GET /api/performance/corrective-actions/summary  -> { success, data: { open, overdue, byStatus, bySeverity } }
 *   GET /api/performance/alerts                      -> { success, data }
 *   GET /api/performance/alerts/summary              -> { success, data: { critical, open, escalated, byStatus, bySeverity, total } }
 *   GET /api/performance/documents                   -> { success, message, data, timestamp }
 *   GET /api/performance/documents/folders           -> { success, message, data: { folders, totalDocuments } }
 *   GET /api/performance-reviews                     -> { success, message, data: { reviews, pagination } }
 *   GET /api/performance/review-cycles               -> { success, message, data: { cycles, total, page, limit, totalPages } }
 *   GET /api/accounting/timesheets/mine              -> { success, data }
 *   GET /api/users                                   -> { success, message, data, count }
 *   GET /api/performance/analytics/kpi               -> { success, message, data: { kpiAnalytics, summary } }
 *   GET /api/performance/analytics/dashboard         -> { success, message, data: { overview, companyGoals, departmentBreakdown, userBreakdown } }
 *   GET /api/performance/analytics/reports           -> { success, message, data: { reports, summary } }
 *   GET /api/performance/analytics/departments/comparison -> { success, message, data: { departments } }
 *   GET /api/performance/integration/jobs            -> { success, message, data }
 *   GET /api/performance/scorecards/org-bsc          -> { success, message, data: {...}, timestamp }
 *   GET /api/performance/scorecards/user             -> { success, message, data: {...} } | 404/500 with
 *                                                        a human message ("no active contract" / "no goals")
 *
 * Note also that `lib/api/department-api.ts` declares a `_count: { users, goals }` field on
 * Department that the endpoint does not actually return — do not rely on the declared type.
 *
 * `org-bsc` and `user` are backed by a REAL scoring engine (`PerformanceScorecardService`),
 * not a stub — verified by round-tripping a contract + a goal end to end and watching the
 * weighted score compute for real. It was blocked by one missing seed: `scorecard_pillars`
 * had 0 rows, so every goal create failed validation ("Invalid scorecardPillar") and nothing
 * could ever be scored. `npm run db:migrate:scorecard-pillars` (idempotent, already existed,
 * simply never run) seeds the four canonical BSC pillars and unblocks the whole chain.
 */

/** Every loader result carries its own error rather than failing the whole page. */
export interface ScopeResult<T> {
  data: T
  error: string | null
  /** True when the request succeeded and returned zero rows — an honest empty state. */
  empty: boolean
}

export interface PerfDepartment {
  id: string
  name: string
  description: string
  branch: string | null
  isActive: boolean
  /** Real member count, or null when the endpoint does not supply one. Never guessed. */
  userCount: number | null
}

export interface PerfTask {
  id: string
  title: string
  description: string
  stage: string
  priority: string
  department: string | null
  category: string | null
  owner: string | null
  dueDate: string | null
  isOverdue: boolean
  isPerformanceTask: boolean
  goalId: string | null
}

export interface PerfNamed {
  id: string
  name: string
  /** Free-text detail where the endpoint supplies one; never invented. */
  description: string | null
  status: string | null
}

export interface PerfKpi extends PerfNamed {
  code: string | null
  department: string | null
  owner: string | null
  frequency: string | null
  target: string | null
}

/**
 * `GET /api/risk-assessments` -> `assessments`.
 *
 * IMPORTANT: `model RiskAssessment` is a **deal / investment due-diligence** record, not an
 * enterprise risk. It carries `companyName`, `dealValue`, `sector`, `stage` and six named
 * sub-risk scores (burn rate, market viability, IP/legal, founder, financial, operational).
 * It has no likelihood/impact pair, no inherent-vs-residual split, no risk appetite, no trend
 * and no business-unit scope — none of which the Enterprise Risk Register page asks for.
 *
 * These fields are surfaced because they are real and were being discarded. Whether a deal
 * DD record belongs on the Enterprise Risk Register at all is a product question, flagged in
 * `performance-module-map.md`; it is not settled by wiring it.
 */
export interface PerfRisk extends PerfNamed {
  assessmentType: string | null
  companyName: string | null
  sector: string | null
  stage: string | null
  /** 0-100 where the API supplies one. Null renders as an em dash, never as 0. */
  overallRiskScore: number | null
  /** low | medium | high | critical, as free text from the API. */
  riskLevel: string | null
  recommendation: string | null
  assignedTo: string | null
  targetCompletionDate: string | null
  completedAt: string | null
}

/** `GET /api/performance/contracts` -> `data`. */
export interface PerfContract extends PerfNamed {
  contractType: string | null
  periodLabel: string | null
  periodStart: string | null
  periodEnd: string | null
  subject: string | null
  subjectId: string | null
  department: string | null
  reviewer: string | null
  approver: string | null
  allocatedBudget: number | null
  actualSpend: number | null
}

/** `GET /api/users` — used for owner pickers and for department headcount joins. */
export interface PerfUser {
  id: string
  name: string
  email: string | null
  department: string | null
  departmentRole: string | null
  roleCode: string | null
  role: string | null
}

/** `GET /api/performance/corrective-actions`. */
export interface PerfCorrectiveAction extends PerfNamed {
  reference: string | null
  trigger: string | null
  severity: string | null
  /** 0-100, or null when progress has never been reported. Never defaulted to 0. */
  progress: number | null
  owner: string | null
  ownerId: string | null
  department: string | null
  departmentId: string | null
  targetDate: string | null
  closedAt: string | null
  createdAt: string | null
  isOverdue: boolean
}

/** `GET /api/performance/alerts`. `elapsedMinutes` is derived server-side from `raisedAt`. */
export interface PerfAlert extends PerfNamed {
  reference: string | null
  source: string | null
  severity: string | null
  owner: string | null
  ownerId: string | null
  department: string | null
  departmentId: string | null
  escalationLevel: number
  raisedAt: string | null
  acknowledgedAt: string | null
  resolvedAt: string | null
  elapsedMinutes: number | null
}

/** `GET /api/performance/documents` — the Document Vault. */
export interface PerfDocument extends PerfNamed {
  folder: string | null
  category: string | null
  version: string | null
  fileUrl: string | null
  mimeType: string | null
  fileSizeBytes: number | null
  owner: string | null
  ownerId: string | null
  department: string | null
  departmentId: string | null
  uploadedBy: string | null
  retentionUntil: string | null
  createdAt: string | null
  updatedAt: string | null
}

/** `GET /api/performance-reviews` -> `data.reviews`. */
export interface PerfReview extends PerfNamed {
  employee: string | null
  employeeId: string | null
  reviewer: string | null
  reviewerId: string | null
  department: string | null
  cycle: string | null
  periodStart: string | null
  periodEnd: string | null
  dueDate: string | null
  /** Overall score where the API supplies one; null is rendered as an em dash, never 0. */
  score: number | null
  submittedAt: string | null
  completedAt: string | null
}

/** `GET /api/accounting/timesheets/mine`. */
export interface PerfTimesheet extends PerfNamed {
  periodStart: string | null
  periodEnd: string | null
  totalHours: number | null
  billableHours: number | null
  submittedAt: string | null
  approvedAt: string | null
  approver: string | null
}

/**
 * `GET /api/accounting/timesheets/team` — a manager's own department, every status. Added
 * alongside this scope because the only prior endpoint (`/pending-approval`) showed
 * org-wide SUBMITTED rows only: a manager could approve a stranger's timesheet from another
 * department but could not see their own report's DRAFT or APPROVED weeks. 403 for anyone
 * without `accounting.timesheets.manage`, which the loader treats like any other scope error
 * — an employee viewing the page simply gets an empty section, not a crash.
 */
export interface PerfTeamTimesheet extends PerfTimesheet {
  employee: string | null
  employeeId: string | null
  department: string | null
}

/** `GET /api/performance/config/pillars` -> `data.pillars`. Weights are configured, not scored. */
export interface PerfPillar {
  name: string
  displayName: string
  /** Configured weight (percent). Present for every pillar the backend returns. */
  weight: number | null
  nonDeletable: boolean
}

/** `GET /api/performance/analytics/departments/comparison` -> `data.departments`. */
export interface PerfDeptComparison {
  department: string
  goalsTotal: number | null
  goalsCompleted: number | null
  goalsCompletionRate: number | null
  individualGoalsTotal: number | null
  individualGoalsCompleted: number | null
  usersTotal: number | null
  usersManagers: number | null
  progressPercentage: number | null
}

/** Scope ids the host can load. Mirrors the page ids in `nav.ts` where they correspond. */
export type PerfScope =
  | "departments"
  | "tasks"
  | "kpis"
  | "pillars"
  | "themes"
  | "strategies"
  | "goals"
  | "contracts"
  | "risks"
  | "users"
  | "correctiveActions"
  | "correctiveSummary"
  | "alerts"
  | "alertSummary"
  | "documents"
  | "documentFolders"
  | "reviews"
  | "reviewCycles"
  | "timesheets"
  | "teamTimesheets"
  | "pillarConfig"
  | "vision"
  | "archivedStrategies"
  | "analyticsKpi"
  | "analyticsDashboard"
  | "analyticsReports"
  | "deptComparison"
  | "syncJobs"
  | "orgBsc"
  | "myScorecard"
  | "deptScorecards"
  | "boardScorecard"
  | "ceoScorecard"

/** Status/severity tallies from a `/summary` endpoint. Object-shaped, not an array. */
export interface PerfCorrectiveSummary {
  open: number
  overdue: number
  byStatus: Record<string, number>
  bySeverity: Record<string, number>
}

export interface PerfAlertSummary {
  critical: number
  open: number
  escalated: number
  total: number
  byStatus: Record<string, number>
  bySeverity: Record<string, number>
}

export interface PerfDocumentFolders {
  folders: Array<{ name: string; count: number | null }>
  totalDocuments: number | null
}

export interface PerfAnalyticsKpi {
  totalKPIs: number | null
  totalGoals: number | null
  goalsWithoutKpi: number | null
  averageProgress: number | null
}

export interface PerfAnalyticsDashboard {
  totalCompanyGoals: number | null
  totalDepartments: number | null
  totalUsers: number | null
  totalTasks: number | null
  completedTasks: number | null
  overallProgress: number | null
  userBreakdown: Array<{ department: string; userCount: number }>
}

export interface PerfAnalyticsReports {
  total: number | null
  completed: number | null
  inProgress: number | null
  planning: number | null
  averageProgress: number | null
}

export interface PerfVision {
  strategyId: string | null
  visionStatement: string | null
}

/** One BSC perspective's weighted result within the org-wide dashboard. */
export interface PerfBscPillarScore {
  code: string
  label: string
  /** Configured weight (%). Same source as `pillarConfig`, echoed here for convenience. */
  weight: number | null
  /** 0-100 weighted score for this perspective this period, or null if nothing scored yet. */
  score: number | null
  status: string | null
  goalCount: number
}

/** `GET /api/performance/scorecards/org-bsc` — real, computed, not a stub. */
export interface PerfOrgBsc {
  organisationName: string | null
  reviewPeriod: string | null
  periodStart: string | null
  periodEnd: string | null
  /** 0-100 weighted roll-up across all four pillars. Null only if the call itself failed. */
  overallScore: number | null
  status: string | null
  visionStatement: string | null
  pillars: PerfBscPillarScore[]
}

/**
 * `GET /api/performance/scorecards/user` — the signed-in user's own individual scorecard.
 *
 * Very commonly unavailable, and for an HONEST reason: it requires an active
 * `PerformanceContract` for the current period, with goals linked to it. `blockedReason`
 * carries the backend's own explanation (e.g. "No active performance contract found") so the
 * UI can say why, rather than showing a bare dash.
 */
export interface PerfMyScorecard {
  available: boolean
  blockedReason: string | null
  overallScore: number | null
  status: string | null
  goalCount: number
  contractTitle: string | null
  periodLabel: string | null
  /** One row per linked goal — the same shape `scorecards.mjs` renders as a matrix row. */
  rows: PerfScoreRow[]
}

/**
 * One row in a scorecard matrix — a goal (department/employee scorecards) or a governance
 * section (board/CEO scorecards). Same shape either way so the existing matrix UI renders
 * both without a design change.
 */
export interface PerfScoreRow {
  id: string
  name: string
  weight: number | null
  score: number | null
  status: string | null
}

/**
 * `GET /api/performance/scorecards/department/:department`.
 *
 * Goal-based, like `PerfMyScorecard` — real, verified by creating a contract + a scored goal
 * and watching `scores.departmentScore` respond. `rows` are the department's linked goals,
 * NOT the four BSC pillars: the read shape does not expose a goal's `scorecardPillar`, so
 * bucketing by perspective would be a guess, not a fact.
 */
export interface PerfDeptScorecard {
  available: boolean
  blockedReason: string | null
  department: string
  overallScore: number | null
  status: string | null
  manager: string | null
  rows: PerfScoreRow[]
}

/**
 * `GET /api/performance/scorecards/{board,ceo}`.
 *
 * A five-section governance form (Outcomes / Outputs / Governance-or-Service-Delivery /
 * Resources / Programmes), NOT the four-pillar BSC — confirmed by reading the actual
 * response, not assumed. `rows` are the five real sections; forcing them into the BSC
 * pillar shape would misrepresent what they are.
 */
export interface PerfGovScorecard {
  available: boolean
  blockedReason: string | null
  overallScore: number | null
  status: string | null
  chairOrCeo: string | null
  rows: PerfScoreRow[]
}

/**
 * `GET /api/performance/scorecards/employee/:id` — a specific colleague's scorecard, fetched
 * on demand when the Employee Scorecards context picker selects someone other than the
 * signed-in user (see `bridge.ts` `fetchEmployeeScorecard`). Not preloaded for all users:
 * with ~24 staff most have no active contract, and preloading would mean two dozen requests
 * — most 404 — on every single page load regardless of whether anyone opens this tab.
 */
export interface PerfEmployeeScorecard {
  available: boolean
  blockedReason: string | null
  employeeId: string
  employeeName: string | null
  overallScore: number | null
  status: string | null
  rows: PerfScoreRow[]
}

export interface PerfLivePayload {
  departments: ScopeResult<PerfDepartment[]>
  tasks: ScopeResult<PerfTask[]>
  kpis: ScopeResult<PerfKpi[]>
  pillars: ScopeResult<PerfNamed[]>
  themes: ScopeResult<PerfNamed[]>
  strategies: ScopeResult<PerfNamed[]>
  goals: ScopeResult<PerfNamed[]>
  contracts: ScopeResult<PerfContract[]>
  risks: ScopeResult<PerfRisk[]>
  users: ScopeResult<PerfUser[]>
  correctiveActions: ScopeResult<PerfCorrectiveAction[]>
  correctiveSummary: ScopeResult<PerfCorrectiveSummary | null>
  alerts: ScopeResult<PerfAlert[]>
  alertSummary: ScopeResult<PerfAlertSummary | null>
  documents: ScopeResult<PerfDocument[]>
  documentFolders: ScopeResult<PerfDocumentFolders | null>
  reviews: ScopeResult<PerfReview[]>
  reviewCycles: ScopeResult<PerfNamed[]>
  timesheets: ScopeResult<PerfTimesheet[]>
  teamTimesheets: ScopeResult<PerfTeamTimesheet[]>
  pillarConfig: ScopeResult<PerfPillar[]>
  vision: ScopeResult<PerfVision | null>
  archivedStrategies: ScopeResult<PerfNamed[]>
  analyticsKpi: ScopeResult<PerfAnalyticsKpi | null>
  analyticsDashboard: ScopeResult<PerfAnalyticsDashboard | null>
  analyticsReports: ScopeResult<PerfAnalyticsReports | null>
  deptComparison: ScopeResult<PerfDeptComparison[]>
  syncJobs: ScopeResult<PerfNamed[]>
  orgBsc: ScopeResult<PerfOrgBsc | null>
  myScorecard: ScopeResult<PerfMyScorecard | null>
  deptScorecards: ScopeResult<PerfDeptScorecard[]>
  boardScorecard: ScopeResult<PerfGovScorecard | null>
  ceoScorecard: ScopeResult<PerfGovScorecard | null>
}

/** The shape published on `window.__PERF_LIVE__` by the host and read by the runtime. */
export interface PerfLiveGlobal {
  ready: boolean
  data: Partial<PerfLivePayload>
  errors: Record<string, string>
}
