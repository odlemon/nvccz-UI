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

export async function loadHomeLiveData() {
  const [priorities, schedule, aum, cover, servicesSummary, serviceRequests, customWallpapers] = await Promise.all([
    loadMyPriorities(),
    loadUpcomingSchedule(),
    loadAumSnapshot(),
    loadCoverPreference(),
    loadServicesSummary(),
    loadServiceRequests(),
    loadCustomWallpapers(),
  ])
  return {
    priorities,
    schedule,
    aum,
    cover,
    servicesSummary,
    serviceRequests,
    customWallpapers,
    pendingExpenses: summarizePendingExpenses(serviceRequests.data),
  }
}
