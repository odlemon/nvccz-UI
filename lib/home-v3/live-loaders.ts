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
import { apiClient } from "@/lib/api/api-client"

export type ScopeResult<T> = { data: T; error: string | null; empty: boolean }

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

export async function loadHomeLiveData() {
  const [priorities, schedule, aum] = await Promise.all([
    loadMyPriorities(),
    loadUpcomingSchedule(),
    loadAumSnapshot(),
  ])
  return { priorities, schedule, aum }
}
