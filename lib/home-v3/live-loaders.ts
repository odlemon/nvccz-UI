/**
 * Home V3 — live read paths for the Home dashboard (Phase 1 of design-refs/home-page/execution-plan.md).
 *
 * Convention (matches lib/performance-v22-mock/live-loaders.ts and lib/portfolio-v11/live-loaders.ts):
 * one Promise.all with a safe() wrapper capturing per-call errors, so a single failing endpoint
 * yields one honest empty/error section rather than failing the whole dashboard.
 *
 * Endpoints consumed (all verified to already exist server-side, see design-refs/home-page/execution-plan.md
 * Phase 0 results):
 * - GET /tasks/my            -> { success, tasks } — "Today's Priorities"
 * - GET /homepage            -> { success, data: { events: { upcoming } } } — "Upcoming Schedule"
 * - GET /portfolio/dashboard?scope=aum -> { success, data: { aumKpis } } — Workday Snapshot AUM chart
 */
import { apiClient, ApiError } from "@/lib/api/api-client"

export type ScopeResult<T> = { data: T; error: string | null; empty: boolean }

function formatUsd(value: number): string {
  return `US$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

async function safe<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<ScopeResult<T>> {
  try {
    const data = await fn()
    const empty = Array.isArray(data) ? data.length === 0 : data == null
    return { data, error: null, empty }
  } catch (err: any) {
    const message = err?.message ? String(err.message) : `Failed to load ${label}`
    console.error(`[home-v3] ${label} failed:`, message)
    return { data: fallback, error: message, empty: false }
  }
}

export type Hv3Priority = { id: string; title: string; meta: string; priority: string; done: boolean }
export type Hv3ScheduleEvent = {
  id: string
  day: string
  month: string
  title: string
  time: string
  location: string
  people: string[]
  color: string
}
export type Hv3AumSnapshot = {
  values: number[]
  xLabels: string[]
  yoyLabel: string
  rangeLabel: string
  target: number | null
  /** Set when there's a real current figure but no history to trend (e.g. this dev dataset). */
  totalLabel: string
}

function formatUsdCompact(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1e9) return `US$${(value / 1e9).toFixed(2)}B`
  if (abs >= 1e6) return `US$${(value / 1e6).toFixed(2)}M`
  if (abs >= 1e3) return `US$${(value / 1e3).toFixed(1)}K`
  return `US$${value.toFixed(0)}`
}

function formatTaskMeta(dateStr: string | null | undefined): string {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return ""
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  const isTomorrow = date.toDateString() === tomorrow.toDateString()
  const time = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  if (isToday) return `Due today · ${time}`
  if (isTomorrow) return `Tomorrow · ${time}`
  return `${date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} · ${time}`
}

function titleCasePriority(raw: string | null | undefined): string {
  const value = (raw || "medium").toLowerCase()
  if (value === "high" || value === "urgent" || value === "critical") return "High"
  if (value === "low") return "Low"
  return "Medium"
}

/** `/api/tasks/my` — the signed-in user's own tasks, not admin/org-wide. */
export async function loadMyPriorities(): Promise<ScopeResult<Hv3Priority[]>> {
  return safe<Hv3Priority[]>(
    "priorities",
    async () => {
      const res: any = await apiClient.get("/tasks/my")
      const tasks: any[] = Array.isArray(res?.tasks) ? res.tasks : []
      return tasks
        .slice()
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 6)
        .map((t) => ({
          id: String(t.id),
          title: String(t.title || "Untitled task"),
          meta: formatTaskMeta(t.date),
          priority: titleCasePriority(t.priority),
          done: t.stage === "completed",
        }))
    },
    [],
  )
}

/** `/api/homepage` — reuses the existing aggregate endpoint's `events.upcoming`. */
export async function loadUpcomingSchedule(): Promise<ScopeResult<Hv3ScheduleEvent[]>> {
  return safe<Hv3ScheduleEvent[]>(
    "schedule",
    async () => {
      const res: any = await apiClient.get("/homepage?eventsLimit=3")
      const events: any[] = Array.isArray(res?.data?.events?.upcoming) ? res.data.events.upcoming : []
      return events.slice(0, 3).map((e) => {
        const start = new Date(e.startDate)
        const end = e.endDate ? new Date(e.endDate) : null
        const time = Number.isNaN(start.getTime())
          ? ""
          : `${start.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}${
              end && !Number.isNaN(end.getTime())
                ? ` – ${end.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`
                : ""
            }`
        return {
          id: String(e.id),
          day: Number.isNaN(start.getTime()) ? "" : start.toLocaleDateString("en-GB", { day: "2-digit" }),
          month: Number.isNaN(start.getTime())
            ? ""
            : start.toLocaleDateString("en-GB", { month: "short" }).toUpperCase(),
          title: String(e.title || "Untitled event"),
          time,
          location: String(e.location || e.venue || "TBC"),
          people: [],
          color: "blue",
        }
      })
    },
    [],
  )
}

function formatPeriodLabel(periodKey: string): string {
  // periodKeys are typically "YYYY-MM"; fall back to the raw key if it isn't.
  const match = /^(\d{4})-(\d{2})$/.exec(periodKey)
  if (!match) return periodKey
  const date = new Date(Number(match[1]), Number(match[2]) - 1, 1)
  return date.toLocaleDateString("en-GB", { month: "short" })
}

/** `/api/portfolio/dashboard?scope=aum` — real, computed AUM KPIs (lighter payload than `scope=full`). */
export async function loadAumSnapshot(): Promise<ScopeResult<Hv3AumSnapshot | null>> {
  return safe<Hv3AumSnapshot | null>(
    "aum",
    async () => {
      const res: any = await apiClient.get("/portfolio/dashboard?scope=aum")
      const kpis = res?.data?.aumKpis
      if (!kpis) return null
      const series: Array<{ periodKey: string; totalAum: number }> = kpis?.growth?.historySeries || []
      const yoy = kpis?.growth?.yoyChangeRate
      const yoyPct = typeof yoy === "number" ? (Math.abs(yoy) <= 1 ? yoy * 100 : yoy) : null
      const yoyLabel = yoyPct == null ? "" : `${yoyPct >= 0 ? "+" : ""}${yoyPct.toFixed(1)}% YoY`
      const totalValue = typeof kpis.totalPortfolioValue === "number" ? kpis.totalPortfolioValue : null
      const totalLabel = totalValue == null ? "" : formatUsdCompact(totalValue)

      if (!series.length) {
        // No trend to chart yet (this dataset has no historical AUM snapshots) — still show the
        // real current total rather than nothing, as long as we have one.
        if (!totalLabel) return null
        return { values: [], xLabels: [], yoyLabel, rangeLabel: "", target: null, totalLabel }
      }

      const values = series.map((p) => Number(p.totalAum) / 1e9)
      const xLabels = series.map((p) => formatPeriodLabel(p.periodKey))
      const min = Math.min(...values)
      const max = Math.max(...values)
      return {
        values,
        xLabels,
        yoyLabel,
        rangeLabel: `US$${min.toFixed(2)}B–US$${max.toFixed(2)}B`,
        target: null,
        totalLabel,
      }
    },
    null,
  )
}

export type Hv3CoverPreference = {
  coverTheme: string
  coverWallpaper: string
  rotationIntervalMinutes: number
  settings?: Record<string, unknown> | null
}

/** `/api/homepage/preferences` — the signed-in user's Daily Cover choice (Phase 2/2b). */
export async function loadCoverPreference(): Promise<ScopeResult<Hv3CoverPreference | null>> {
  return safe<Hv3CoverPreference | null>(
    "coverPreference",
    async () => {
      const res: any = await apiClient.get("/homepage/preferences")
      return res?.data ?? null
    },
    null,
  )
}

export type Hv3CustomWallpaper = { id: string; url: string; label: string | null; sortOrder: number }

/** `/api/homepage/wallpapers` — the signed-in user's own uploaded Daily Cover images (Phase 2b). */
export async function loadCustomWallpapers(): Promise<ScopeResult<Hv3CustomWallpaper[]>> {
  return safe<Hv3CustomWallpaper[]>(
    "customWallpapers",
    async () => {
      const res: any = await apiClient.get("/homepage/wallpapers")
      return Array.isArray(res?.data) ? res.data : []
    },
    [],
  )
}

export type Hv3PayslipSummary = {
  id: string
  periodLabel: string
  grossLabel: string
  deductionsLabel: string
  netLabel: string
}
export type Hv3ServicesSummary = {
  leaveBalanceLabel: string
  leaveBalanceMeta: string
  leaveBalanceDays: number | null
  payslipLabel: string
  payslipMeta: string
  latestPayslip: Hv3PayslipSummary | null
}
const PAYROLL_NOT_SET_UP: Hv3ServicesSummary = {
  leaveBalanceLabel: "Not set up",
  leaveBalanceMeta: "",
  leaveBalanceDays: null,
  payslipLabel: "Not set up",
  payslipMeta: "",
  latestPayslip: null,
}

/**
 * `/api/payroll/employee/leave-balances` + `/api/payroll/employee/payslips` — both 404 with
 * "Employee record not found" when the signed-in User has no linked Employee row (true for
 * every seeded test persona tried so far). That's an honest, expected state — self-service
 * genuinely isn't set up for this account — not a load failure, so it's handled here rather
 * than through safe()'s error/toast path.
 */
export async function loadServicesSummary(): Promise<ScopeResult<Hv3ServicesSummary>> {
  try {
    const [balances, payslips]: [any[], any[]] = await Promise.all([
      apiClient.get<any>("/payroll/employee/leave-balances").then((r: any) => r?.data ?? []),
      apiClient.get<any>("/payroll/employee/payslips?limit=1").then((r: any) => r?.data ?? []),
    ])
    const annual = balances.find((b) => /annual/i.test(b.leaveType)) ?? balances[0] ?? null
    const payslip = payslips[0] ?? null
    const latestPayslip: Hv3PayslipSummary | null = payslip
      ? {
          id: payslip.id,
          periodLabel: payslip.payrollRun?.payPeriod || "Latest",
          grossLabel: formatUsd(Number(payslip.grossPay || 0)),
          deductionsLabel: formatUsd(Number(payslip.totalDeductions || 0)),
          netLabel: formatUsd(Number(payslip.netPay || 0)),
        }
      : null
    return {
      data: {
        leaveBalanceLabel: annual ? `${Number(annual.balance).toFixed(1)} days` : "No balance recorded",
        leaveBalanceMeta: annual ? `${annual.leaveType} leave` : "",
        leaveBalanceDays: annual ? Number(annual.balance) : null,
        payslipLabel: latestPayslip?.netLabel ?? "No payslips yet",
        payslipMeta: latestPayslip?.periodLabel ?? "",
        latestPayslip,
      },
      error: null,
      empty: !annual && !payslip,
    }
  } catch (err: any) {
    if (err instanceof ApiError && err.status === 404) {
      return { data: PAYROLL_NOT_SET_UP, error: null, empty: true }
    }
    const message = err?.message ? String(err.message) : "Failed to load payroll summary"
    console.error("[home-v3] servicesSummary failed:", message)
    return { data: PAYROLL_NOT_SET_UP, error: message, empty: false }
  }
}

export type Hv3ServiceRequestRow = {
  id: string
  service: string
  submitted: string
  owner: string
  status: string
  next: string
  type: string
  amount: number | null
  rawStatus: string
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  in_progress: "In progress",
  completed: "Completed",
  rejected: "Rejected",
}

/** `/api/service-requests` — the signed-in user's own requests (new this phase, see execution-plan.md Phase 3). */
export async function loadServiceRequests(): Promise<ScopeResult<Hv3ServiceRequestRow[]>> {
  return safe<Hv3ServiceRequestRow[]>(
    "serviceRequests",
    async () => {
      const res: any = await apiClient.get("/service-requests")
      const rows: any[] = Array.isArray(res?.data) ? res.data : []
      return rows.map((r) => ({
        id: r.id,
        service: r.summary,
        submitted: new Date(r.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        owner: "You",
        status: STATUS_LABELS[r.status] || r.status,
        next: r.nextAction || "",
        type: r.type,
        amount: r.amount == null ? null : Number(r.amount),
        rawStatus: r.status,
      }))
    },
    [],
  )
}

/** Sum of pending expense-type requests, for the Services stat tile. */
export function summarizePendingExpenses(requests: Hv3ServiceRequestRow[]): { label: string; meta: string } {
  // "expenses" (plural) matches the Home hub's service-catalog id (lib/home-v3-mock/matanho-data.ts),
  // not the singular the backend originally (wrongly) validated against — see
  // ServiceRequestController.ts's MAX_TYPE_LENGTH comment for the same fix on that side.
  const pendingExpenses = requests.filter((r) => r.type === "expenses" && r.rawStatus === "pending")
  const total = pendingExpenses.reduce((sum, r) => sum + (r.amount || 0), 0)
  return {
    label: formatUsd(total),
    meta: `${pendingExpenses.length} item${pendingExpenses.length === 1 ? "" : "s"}`,
  }
}

export type Hv3CalendarEntry = {
  id: string
  title: string
  description: string | null
  startDate: string
  endDate: string
  location: string | null
  entryType: string
}

/**
 * `/api/calendar-entries` — the signed-in user's own entries for the current calendar week
 * (Monday through the following Monday, matching how the runtime's own calendarWeekStart()
 * computes "this week" — see scripts/_patch-fragments/calendar-view.js.fragment).
 */
export async function loadMyCalendarEntries(): Promise<ScopeResult<Hv3CalendarEntry[]>> {
  return safe<Hv3CalendarEntry[]>(
    "myCalendarEntries",
    async () => {
      const now = new Date()
      const day = now.getDay()
      const diff = day === 0 ? -6 : 1 - day
      const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff)
      const nextMonday = new Date(monday)
      nextMonday.setDate(monday.getDate() + 7)
      const res: any = await apiClient.get(
        `/calendar-entries?start=${monday.toISOString()}&end=${nextMonday.toISOString()}`,
      )
      return Array.isArray(res?.data) ? res.data : []
    },
    [],
  )
}

export type Hv3CompanyEvent = {
  id: string
  title: string
  description: string | null
  startDate: string
  endDate: string
  location: string | null
  googleCalendarLink?: string | null
  author?: { firstName?: string; lastName?: string } | null
}

/**
 * `/api/events` — the real, company-wide Event model, read-only. No date-range filtering exists
 * server-side (see execution-plan.md Phase 4), so this fetches everything active and the
 * runtime's own combinedWeekEvents() narrows it to the visible week.
 */
export async function loadCompanyEvents(): Promise<ScopeResult<Hv3CompanyEvent[]>> {
  return safe<Hv3CompanyEvent[]>(
    "companyEvents",
    async () => {
      const res: any = await apiClient.get("/events")
      return Array.isArray(res?.data) ? res.data : []
    },
    [],
  )
}

export type Hv3Task = {
  id: string
  title: string
  project: string
  owner: string
  ownerIds: string[]
  due: string
  dueIso: string | null
  progress: number
  status: string
  done: boolean
  goalTitle: string | null
}

export type Hv3Person = { id: string; name: string; email: string; department: string | null; role: string | null }

export type Hv3TeamRow = { id: string; name: string; role: string | null; openCount: number; progress: number }

export type Hv3PerformanceGoalRow = {
  id: string
  title: string
  weight: number | null
  score: number | null
  status: string | null
}

export type Hv3PerformanceOverview = {
  available: boolean
  blockedReason: string | null
  overallScore: number | null
  statusLabel: string | null
  goalCount: number
  contractTitle: string | null
  periodLabel: string | null
  goals: Hv3PerformanceGoalRow[]
}

function personName(p: any): string {
  const name = `${p?.firstName || ""} ${p?.lastName || ""}`.trim()
  return name || p?.email || "Unknown"
}

/**
 * `/api/users` — org directory (id -> display name/department/role). Gated to "internal staff",
 * not admin-only, so this is safe to call for any signed-in employee. Reused by the Teams tab
 * below and, per Phase 0 §7, this is also the endpoint Phase 7's People directory will read.
 */
export async function loadDirectory(): Promise<ScopeResult<Hv3Person[]>> {
  return safe<Hv3Person[]>(
    "directory",
    async () => {
      const res: any = await apiClient.get("/users")
      const rows: any[] = Array.isArray(res?.data) ? res.data : []
      return rows.map((u) => ({
        id: String(u.id),
        name: personName(u),
        email: String(u.email || ""),
        department: u.userDepartment ?? null,
        role: u.role?.name ?? u.departmentRole ?? null,
      }))
    },
    [],
  )
}

function formatWorkDue(dateStr: string | null | undefined): { label: string; iso: string | null } {
  if (!dateStr) return { label: "No date", iso: null }
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return { label: "No date", iso: null }
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  return {
    // "Today" is load-bearing text, not just display: the runtime's own grouping logic keys off
    // this exact word (`String(t.due).toLowerCase().includes('today')`) to bucket "Due now".
    label: isToday ? "Today" : date.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    iso: date.toISOString(),
  }
}

/**
 * `/api/tasks/my` shaped for My Work — fuller than loadMyPriorities's 6-item Home-page slice.
 * `project` is Task.department (the backend's own existing bucketing field — also used by
 * `/tasks/statistics`' tasksByDepartment breakdown), not a separate Project entity: none exists
 * server-side, so "projects" here are real groupings of real tasks, not an independently
 * persisted, potentially-empty record. `owner` resolves `team` (user id array) to display names.
 */
export async function loadMyTasks(selfId?: string | null): Promise<ScopeResult<Hv3Task[]>> {
  return safe<Hv3Task[]>(
    "myTasks",
    async () => {
      const [tasksRes, dirRes] = await Promise.all([apiClient.get("/tasks/my"), loadDirectory()])
      const byId = new Map(dirRes.data.map((p) => [p.id, p.name] as const))
      const tasks: any[] = Array.isArray((tasksRes as any)?.tasks) ? (tasksRes as any).tasks : []
      return tasks.map((t) => {
        const teamIds: string[] = Array.isArray(t.team) ? t.team.map(String) : []
        const owner = teamIds.length
          ? teamIds.map((id) => (id === selfId ? "You" : byId.get(id) || "Former team member")).join(", ")
          : "Unassigned"
        const due = formatWorkDue(t.date)
        const stage = String(t.stage || "todo")
        const done = stage === "completed"
        return {
          id: String(t.id),
          title: String(t.title || "Untitled task"),
          project: String(t.department || "").trim() || "Unassigned",
          owner,
          ownerIds: teamIds,
          due: due.label,
          dueIso: due.iso,
          progress: done ? 100 : Math.max(0, Math.min(100, Number(t.percentValueAchieved) || 0)),
          status: titleCasePriority(t.priority),
          done,
          goalTitle: typeof t.goalId === "string" ? t.goalId : (t.goal?.title ?? null),
        }
      })
    },
    [],
  )
}

/**
 * `/api/tasks` — org-wide (verified live: open to any authenticated user server-side, not
 * gated to admins the way `/tasks/my`'s all-tasks branch is — see execution-plan.md Phase 5
 * notes). Used only to build the Teams tab's per-person workload breakdown; `/tasks/my` is
 * deliberately self-scoped and can't answer "how is my team doing."
 */
export async function loadTeamRows(): Promise<ScopeResult<Hv3TeamRow[]>> {
  return safe<Hv3TeamRow[]>(
    "teamRows",
    async () => {
      const [tasksRes, dirRes] = await Promise.all([apiClient.get("/tasks"), loadDirectory()])
      const tasks: any[] = Array.isArray((tasksRes as any)?.tasks) ? (tasksRes as any).tasks : []
      const byPerson = new Map<string, { open: number; progressSum: number; count: number }>()
      for (const t of tasks) {
        const teamIds: string[] = Array.isArray(t.team) ? t.team.map(String) : []
        const done = String(t.stage || "todo") === "completed"
        const progress = done ? 100 : Math.max(0, Math.min(100, Number(t.percentValueAchieved) || 0))
        for (const id of teamIds) {
          const row = byPerson.get(id) || { open: 0, progressSum: 0, count: 0 }
          if (!done) row.open += 1
          row.progressSum += progress
          row.count += 1
          byPerson.set(id, row)
        }
      }
      return dirRes.data
        .filter((p) => byPerson.has(p.id))
        .map((p) => {
          const row = byPerson.get(p.id)!
          return {
            id: p.id,
            name: p.name,
            role: p.role,
            openCount: row.open,
            progress: row.count ? Math.round(row.progressSum / row.count) : 0,
          }
        })
        .sort((a, b) => b.openCount - a.openCount)
        .slice(0, 8)
    },
    [],
  )
}

function adaptGoalRow(raw: any): Hv3PerformanceGoalRow {
  return {
    id: String(raw?.id ?? ""),
    title: String(raw?.goalName ?? raw?.title ?? "Untitled goal"),
    weight: raw?.weight != null ? Number(raw.weight) : raw?.effectiveWeight != null ? Number(raw.effectiveWeight) : null,
    score: raw?.weightedScore != null ? Number(raw.weightedScore) : null,
    status: raw?.rawRatingLabel ?? raw?.status ?? null,
  }
}

/**
 * `/api/performance/scorecards/user` — same endpoint and field paths already verified live by
 * lib/performance-v22-mock/live-loaders.ts's loadMyScorecard/adaptMyScorecard (PerfMyScorecard /
 * goalToScoreRow), kept as home-v3's own copy per this module's no-shared-abstraction convention.
 * Deliberately NOT routed through safe(): a 404 here means "no active performance contract for
 * this period," the backend's own honest answer, not a load failure.
 */
export async function loadMyPerformanceOverview(): Promise<ScopeResult<Hv3PerformanceOverview>> {
  try {
    const res: any = await apiClient.get("/performance/scorecards/user")
    const raw = res?.data
    const goals: any[] = Array.isArray(raw?.goals) ? raw.goals : []
    return {
      data: {
        available: true,
        blockedReason: null,
        overallScore: raw?.scores?.finalScore != null ? Number(raw.scores.finalScore) : null,
        statusLabel: raw?.scores?.performanceLabel ?? raw?.lifecycle?.phase ?? null,
        goalCount: goals.length,
        contractTitle: raw?.contract?.title ?? null,
        periodLabel: raw?.contract?.periodLabel ?? null,
        goals: goals.map(adaptGoalRow),
      },
      error: null,
      empty: false,
    }
  } catch (err: any) {
    const reason = err?.message ? String(err.message) : "No active performance contract for this period."
    return {
      data: {
        available: false,
        blockedReason: reason,
        overallScore: null,
        statusLabel: null,
        goalCount: 0,
        contractTitle: null,
        periodLabel: null,
        goals: [],
      },
      error: null,
      empty: false,
    }
  }
}

export type Hv3PerformanceFeedbackEntry = {
  id: string
  providerName: string
  providerType: string | null
  content: string
  submittedAt: string
}
export type Hv3PerformanceFeedback = {
  available: boolean
  blockedReason: string | null
  reviewTitle: string | null
  reviewPeriod: string | null
  status: string | null
  rating: string | null
  overallScore: number | null
  strengths: string | null
  areasForImprovement: string | null
  managerFeedback: string | null
  selfFeedback: string | null
  peerFeedback: string | null
  stakeholderFeedback: string | null
  entries: Hv3PerformanceFeedbackEntry[]
}

/**
 * `/api/performance-reviews?revieweeId=<self>` — a DIFFERENT backend subsystem from
 * loadMyPerformanceOverview's `/api/performance/scorecards/user` (continuous KPI tracking vs.
 * periodic formal review-with-reviewer-feedback; both real, genuinely separate). The list
 * endpoint's own `include` already embeds up to 3 `reviewFeedback` entries with their provider
 * per review (verified against the backend service's Prisma query), so no second per-review
 * fetch is needed — same 404-is-honest-empty-state shape as loadMyPerformanceOverview.
 */
export async function loadMyPerformanceFeedback(selfId?: string | null): Promise<ScopeResult<Hv3PerformanceFeedback>> {
  const empty: Hv3PerformanceFeedback = {
    available: false,
    blockedReason: null,
    reviewTitle: null,
    reviewPeriod: null,
    status: null,
    rating: null,
    overallScore: null,
    strengths: null,
    areasForImprovement: null,
    managerFeedback: null,
    selfFeedback: null,
    peerFeedback: null,
    stakeholderFeedback: null,
    entries: [],
  }
  if (!selfId) return { data: empty, error: null, empty: true }
  try {
    const res: any = await apiClient.get(`/performance-reviews?revieweeId=${selfId}&limit=1`)
    const review = res?.data?.reviews?.[0]
    if (!review) {
      return { data: { ...empty, blockedReason: "No performance review has been opened for you yet." }, error: null, empty: true }
    }
    const entries: Hv3PerformanceFeedbackEntry[] = Array.isArray(review.reviewFeedback)
      ? review.reviewFeedback.map((f: any) => ({
          id: String(f.id),
          providerName: f.feedbackProvider ? personName(f.feedbackProvider) : (f.feedbackProviderType || "Reviewer"),
          providerType: f.feedbackProviderType ?? null,
          content: String(f.content || ""),
          submittedAt: f.submittedAt
            ? new Date(f.submittedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
            : "",
        }))
      : []
    return {
      data: {
        available: true,
        blockedReason: null,
        reviewTitle: review.title || review.reviewPeriod || "Performance review",
        reviewPeriod: review.reviewPeriod ?? null,
        status: review.status ?? null,
        rating: review.rating ?? null,
        overallScore: review.overallScore != null ? Number(review.overallScore) : null,
        strengths: review.strengths ?? null,
        areasForImprovement: review.areasForImprovement ?? null,
        managerFeedback: review.managerFeedback ?? null,
        selfFeedback: review.selfFeedback ?? null,
        peerFeedback: review.peerFeedback ?? null,
        stakeholderFeedback: review.stakeholderFeedback ?? null,
        entries,
      },
      error: null,
      empty: false,
    }
  } catch (err: any) {
    const reason = err?.message ? String(err.message) : "No performance review has been opened for you yet."
    return { data: { ...empty, blockedReason: reason }, error: null, empty: true }
  }
}

export type Hv3PostReply = {
  id: string
  content: string
  authorName: string
  authorId: string
  createdAt: string
  parentReplyId: string | null
}

/**
 * `/api/posts` shape, shared by News and Forums (see the doc comment on Post in schema.prisma):
 * `category` null = a News/company post, a real category = a Forum discussion. Split into the
 * two feeds client-side from one fetch rather than two overlapping list calls.
 */
export type Hv3Post = {
  id: string
  title: string
  content: string
  category: string | null
  isSolved: boolean
  authorName: string
  authorId: string
  createdAt: string
  replies: Hv3PostReply[]
}

export type Hv3Newsletter = {
  id: string
  title: string
  content: string
  imageUrl: string | null
  authorName: string
  createdAt: string
}

function personDisplayName(p: any): string {
  if (!p) return "Unknown"
  const name = `${p.firstName || ""} ${p.lastName || ""}`.trim()
  return name || p.email || "Unknown"
}

function mapPostReply(r: any): Hv3PostReply {
  return {
    id: String(r.id),
    content: String(r.content || ""),
    authorName: personDisplayName(r.author),
    authorId: String(r.authorId || r.author?.id || ""),
    createdAt: String(r.createdAt || ""),
    parentReplyId: r.parentReplyId ? String(r.parentReplyId) : null,
  }
}

function mapPost(p: any): Hv3Post {
  return {
    id: String(p.id),
    title: String(p.title || "Untitled"),
    content: String(p.content || ""),
    category: p.category ?? null,
    isSolved: Boolean(p.isSolved),
    authorName: personDisplayName(p.author),
    authorId: String(p.authorId || p.author?.id || ""),
    createdAt: String(p.createdAt || ""),
    replies: Array.isArray(p.replies) ? p.replies.map(mapPostReply) : [],
  }
}

/** `/api/posts` — feeds both News (`category == null`) and Forums (`category` set). */
export async function loadPosts(): Promise<ScopeResult<Hv3Post[]>> {
  return safe<Hv3Post[]>(
    "posts",
    async () => {
      const res: any = await apiClient.get("/posts")
      const rows: any[] = Array.isArray(res?.data) ? res.data : []
      return rows.map(mapPost)
    },
    [],
  )
}

const APP_ACCESS_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
}

/** `/api/app-access-requests` — the signed-in user's own requests to access another module. */
export async function loadAppAccessRequests(): Promise<ScopeResult<Hv3AppAccessRequestRow[]>> {
  return safe<Hv3AppAccessRequestRow[]>(
    "appAccessRequests",
    async () => {
      const res: any = await apiClient.get("/app-access-requests")
      const rows: any[] = Array.isArray(res?.data) ? res.data : []
      return rows.map((r) => ({
        appId: r.appId,
        reason: r.reason || "",
        status: APP_ACCESS_STATUS_LABELS[r.status] || r.status,
        submitted: new Date(r.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      }))
    },
    [],
  )
}
export type Hv3AppAccessRequestRow = { appId: string; reason: string; status: string; submitted: string }

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return ""
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const PROFILE_DOCUMENT_ICONS: Record<string, string> = {
  Certification: "learning",
  Education: "learning",
  "Profile media": "profile",
}

/** `/api/homepage/documents` — the signed-in user's own profile documents. */
export async function loadProfileDocuments(): Promise<ScopeResult<Hv3ProfileDocumentRow[]>> {
  return safe<Hv3ProfileDocumentRow[]>(
    "profileDocuments",
    async () => {
      const res: any = await apiClient.get("/homepage/documents")
      const rows: any[] = Array.isArray(res?.data) ? res.data : []
      return rows.map((d) => ({
        name: d.name,
        category: d.category,
        size: formatFileSize(d.sizeBytes),
        status: "Uploaded",
        updated: new Date(d.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        icon: PROFILE_DOCUMENT_ICONS[d.category] || "newsletter",
      }))
    },
    [],
  )
}
export type Hv3ProfileDocumentRow = { name: string; category: string; size: string; status: string; updated: string; icon: string }

/** `/api/newsletters` — active newsletters, newest first. */
export async function loadNewsletters(): Promise<ScopeResult<Hv3Newsletter[]>> {
  return safe<Hv3Newsletter[]>(
    "newsletters",
    async () => {
      const res: any = await apiClient.get("/newsletters")
      const rows: any[] = Array.isArray(res?.data) ? res.data : []
      return rows.map((n: any) => ({
        id: String(n.id),
        title: String(n.title || "Untitled"),
        content: String(n.content || ""),
        imageUrl: n.imageUrl ?? null,
        authorName: personDisplayName(n.author),
        createdAt: String(n.createdAt || ""),
      }))
    },
    [],
  )
}

export async function loadHomeLiveData(selfId?: string | null) {
  const [
    priorities,
    schedule,
    aum,
    cover,
    servicesSummary,
    serviceRequests,
    appAccessRequests,
    profileDocuments,
    customWallpapers,
    myCalendarEntries,
    companyEvents,
    myTasks,
    teamRows,
    performanceOverview,
    performanceFeedback,
    posts,
    newsletters,
    directory,
  ] = await Promise.all([
    loadMyPriorities(),
    loadUpcomingSchedule(),
    loadAumSnapshot(),
    loadCoverPreference(),
    loadServicesSummary(),
    loadServiceRequests(),
    loadAppAccessRequests(),
    loadProfileDocuments(),
    loadCustomWallpapers(),
    loadMyCalendarEntries(),
    loadCompanyEvents(),
    loadMyTasks(selfId),
    loadTeamRows(),
    loadMyPerformanceOverview(),
    loadMyPerformanceFeedback(selfId),
    loadPosts(),
    loadNewsletters(),
    loadDirectory(),
  ])
  return {
    priorities,
    schedule,
    aum,
    cover,
    servicesSummary,
    serviceRequests,
    appAccessRequests,
    profileDocuments,
    customWallpapers,
    myCalendarEntries,
    companyEvents,
    myTasks,
    teamRows,
    performanceOverview,
    performanceFeedback,
    posts,
    newsletters,
    directory,
    pendingExpenses: summarizePendingExpenses(serviceRequests.data),
  }
}
