/**
 * Performance V22 — the one place that publishes live data onto `window.__PERF_LIVE__`.
 *
 * The vendored runtime's render layers are scope-isolated IIFEs: they cannot import from
 * this module and cannot see each other, so a window global is the only channel available
 * (see `design-refs/performance-module-map.md` §5, §13.6). Both the initial load and every
 * post-write refresh go through `publishPerformanceLiveData()` so there is exactly one
 * definition of "what the bridge looks like when data lands".
 *
 * Why a refresh matters: after a successful POST the UI must show what the SERVER now holds,
 * not an optimistic local guess. Re-loading every scope and re-rendering is the only way to
 * be certain the record was actually persisted — which is the whole point of this exercise.
 */
import { apiClient } from "@/lib/api/api-client"
import { adaptEmployeeScorecard } from "./adapters"
import { loadPerformanceLiveData } from "./live-loaders"
import type { PerfEmployeeScorecard, PerfLivePayload, ScopeResult } from "./types"

export const LIVE_DATA_EVENT = "matanho:live-data"

/**
 * Reload every scope and publish the result.
 *
 * Returns the payload so a caller can inspect it (tests, or a handler that wants to confirm
 * its own record came back). Resolves to `null` when the runtime bridge is not mounted —
 * which happens if a write completes after the user navigated away from the module.
 */
export async function publishPerformanceLiveData(): Promise<PerfLivePayload | null> {
  const payload = await loadPerformanceLiveData()
  const bridge = typeof window === "undefined" ? null : (window as any).__PERF_LIVE__
  if (!bridge) return null

  bridge.data = payload
  bridge.errors = Object.fromEntries(
    Object.entries(payload)
      .filter(([, v]) => (v as any)?.error)
      .map(([k, v]) => [k, (v as any).error as string]),
  )
  bridge.ready = true

  // The layers re-read the global on the next paint; this is what tells them to.
  window.dispatchEvent(new CustomEvent(LIVE_DATA_EVENT, { detail: { scopes: Object.keys(payload) } }))
  return payload
}

/**
 * On-demand drill: a specific colleague's scorecard, fetched only when the Employee
 * Scorecards context picker selects someone other than the signed-in user.
 *
 * Not part of the static `Promise.all` payload — with ~24 staff and most holding no active
 * contract, preloading everyone would mean two dozen requests (most 404) on every page load
 * regardless of whether this tab is ever opened. Cached per employee id in
 * `bridge.data.employeeScorecards`, a keyed map the ordinary scopes don't have, so a second
 * look at the same person is instant and a first look at someone else is one more call.
 */
export async function fetchEmployeeScorecard(employeeId: string): Promise<ScopeResult<PerfEmployeeScorecard | null>> {
  const bridge = typeof window === "undefined" ? null : (window as any).__PERF_LIVE__
  let result: ScopeResult<PerfEmployeeScorecard | null>
  try {
    const res: any = await apiClient.get(`/performance/scorecards/employee/${encodeURIComponent(employeeId)}`)
    result = { data: adaptEmployeeScorecard(employeeId, res?.data), error: null, empty: false }
  } catch (err: any) {
    const reason = err?.message ? String(err.message) : "No active performance contract for this employee."
    result = {
      data: { available: false, blockedReason: reason, employeeId, employeeName: null, overallScore: null, status: null, rows: [] },
      error: null,
      empty: false,
    }
  }

  if (bridge) {
    bridge.data = bridge.data || {}
    bridge.data.employeeScorecards = bridge.data.employeeScorecards || {}
    bridge.data.employeeScorecards[employeeId] = result
    window.dispatchEvent(new CustomEvent(LIVE_DATA_EVENT, { detail: { scopes: ["employeeScorecards"] } }))
  }
  return result
}

/**
 * On-demand drill: the employee scorecard's supporting apparatus (notes / evidence /
 * history / publish state) for one employee+period. Same on-demand-cache shape as
 * `fetchEmployeeScorecard` above, keyed by `employeeId|period` since the same employee's
 * apparatus differs per reporting period.
 */
export async function fetchScorecardEntriesForCache(employeeId: string, period: string): Promise<void> {
  const bridge = typeof window === "undefined" ? null : (window as any).__PERF_LIVE__
  const key = `${employeeId}|${period}`
  let data: any = null
  try {
    const res: any = await apiClient.get(
      `/performance/scorecard-entries?employeeId=${encodeURIComponent(employeeId)}&period=${encodeURIComponent(period)}`
    )
    data = res?.data ?? null
  } catch {
    data = null
  }
  if (bridge) {
    bridge.data = bridge.data || {}
    bridge.data.scorecardEntries = bridge.data.scorecardEntries || {}
    bridge.data.scorecardEntries[key] = data
    window.dispatchEvent(new CustomEvent(LIVE_DATA_EVENT, { detail: { scopes: ["scorecardEntries"] } }))
  }
}
