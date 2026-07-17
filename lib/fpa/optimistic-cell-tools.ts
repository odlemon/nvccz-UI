/**
 * Client-side projections for expensive grid tools (spread / copy / growth).
 * Apply immediately for UX; reconcile with server `updatedCells` on success;
 * roll back the snapshot on failure.
 */

import type { FpaCell } from "@/lib/api/fpa-api"

export type SpreadMethodOptimistic =
  | "EVEN"
  | "CUSTOM_WEIGHT"
  | "PRIOR_YEAR_PATTERN"
  | "HISTORICAL_PATTERN"
  | string

export type PeriodBandCol = {
  key: string
  iso: string
  band: "ACTUAL" | "FORECAST"
}

function monthKey(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) {
    return iso.slice(0, 7)
  }
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`
}

function priorYearKey(key: string): string {
  const [y, m] = key.split("-").map(Number)
  if (!y || !m) return key
  return `${y - 1}-${String(m).padStart(2, "0")}`
}

function asNumber(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0
  if (typeof v === "string") {
    const n = Number(v.replace(/,/g, ""))
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

/** Split total across n buckets; last bucket absorbs remainder (2dp). */
export function distributeTotal(total: number, n: number): number[] {
  if (n <= 0) return []
  if (n === 1) return [round2(total)]
  const base = round2(total / n)
  const out = Array.from({ length: n }, () => base)
  const allocated = round2(base * (n - 1))
  out[n - 1] = round2(total - allocated)
  return out
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

function weightShares(weights: number[], total: number): number[] {
  const sum = weights.reduce((a, b) => a + b, 0)
  if (sum <= 0) return distributeTotal(total, weights.length)
  const raw = weights.map((w) => (total * w) / sum)
  const rounded = raw.map((v, i) => (i < raw.length - 1 ? round2(v) : 0))
  const head = rounded.slice(0, -1).reduce((a, b) => a + b, 0)
  rounded[rounded.length - 1] = round2(total - head)
  return rounded
}

function patternShares(pattern: number[], total: number): number[] {
  const abs = pattern.map((v) => Math.abs(v))
  const sum = abs.reduce((a, b) => a + b, 0)
  if (sum <= 0) return distributeTotal(total, pattern.length)
  return weightShares(abs, total)
}

export function matchToolTargetCells(args: {
  cells: FpaCell[]
  lineItemId: string
  forecastPeriods: PeriodBandCol[]
  /** When set, only that department slice; when null/undefined, company-level (no dept). */
  departmentId?: string | null
}): FpaCell[] {
  const forecastKeys = new Set(args.forecastPeriods.map((p) => p.key))
  const dept = args.departmentId || null
  return args.cells.filter((c) => {
    if (c.lineItemId !== args.lineItemId) return false
    if (!forecastKeys.has(monthKey(c.periodDate))) return false
    const cellDept = c.departmentId || null
    if (dept) return cellDept === dept
    return cellDept == null
  })
}

export function computeSpreadAmounts(args: {
  method: SpreadMethodOptimistic
  total: number
  forecastPeriods: PeriodBandCol[]
  weights?: number[]
  /** All grid cells — used for prior-year / historical shape. */
  cells: FpaCell[]
  lineItemId: string
  departmentId?: string | null
}): number[] {
  const n = args.forecastPeriods.length
  if (n <= 0) return []

  if (args.method === "CUSTOM_WEIGHT" && args.weights?.length === n) {
    return weightShares(args.weights, args.total)
  }

  if (
    args.method === "PRIOR_YEAR_PATTERN" ||
    args.method === "HISTORICAL_PATTERN"
  ) {
    const dept = args.departmentId || null
    const pattern = args.forecastPeriods.map((p) => {
      const pk = priorYearKey(p.key)
      const hit = args.cells.find((c) => {
        if (c.lineItemId !== args.lineItemId) return false
        if (monthKey(c.periodDate) !== pk) return false
        const cellDept = c.departmentId || null
        if (dept) return cellDept === dept
        return cellDept == null
      })
      return asNumber(hit?.value)
    })
    return patternShares(pattern, args.total)
  }

  // EVEN (default)
  return distributeTotal(args.total, n)
}

/** Build optimistic cell patches for a spread. */
export function projectSpreadCells(args: {
  cells: FpaCell[]
  lineItemId: string
  forecastPeriods: PeriodBandCol[]
  amounts: number[]
  departmentId?: string | null
}): { next: FpaCell[]; touchedIds: string[] } {
  const targets = matchToolTargetCells(args)
  const byPeriod = new Map(
    args.forecastPeriods.map((p, i) => [p.key, args.amounts[i] ?? 0]),
  )
  const touchedIds: string[] = []
  const patchById = new Map<string, FpaCell>()
  for (const c of targets) {
    const amount = byPeriod.get(monthKey(c.periodDate))
    if (amount == null) continue
    touchedIds.push(c.id)
    patchById.set(c.id, { ...c, value: amount })
  }
  const next = args.cells.map((c) => patchById.get(c.id) || c)
  return { next, touchedIds }
}

/** Copy selected value into later forecast months on the same line. */
export function projectCopyForward(args: {
  cells: FpaCell[]
  selected: FpaCell
  forecastPeriods: PeriodBandCol[]
}): { next: FpaCell[]; touchedIds: string[] } {
  const fromKey = monthKey(args.selected.periodDate)
  const value = asNumber(args.selected.value)
  const dept = args.selected.departmentId || null
  const laterKeys = new Set(
    args.forecastPeriods.filter((p) => p.key > fromKey).map((p) => p.key),
  )
  const touchedIds: string[] = []
  const patchById = new Map<string, FpaCell>()
  for (const c of args.cells) {
    if (c.lineItemId !== args.selected.lineItemId) continue
    if (!laterKeys.has(monthKey(c.periodDate))) continue
    const cellDept = c.departmentId || null
    if (dept ? cellDept !== dept : cellDept != null) continue
    touchedIds.push(c.id)
    patchById.set(c.id, { ...c, value })
  }
  return {
    next: args.cells.map((c) => patchById.get(c.id) || c),
    touchedIds,
  }
}

/** Compound growth from selected period along later forecast months. */
export function projectGrowth(args: {
  cells: FpaCell[]
  selected: FpaCell
  forecastPeriods: PeriodBandCol[]
  ratePct: number
}): { next: FpaCell[]; touchedIds: string[] } {
  const fromKey = monthKey(args.selected.periodDate)
  const dept = args.selected.departmentId || null
  const rate = 1 + args.ratePct / 100
  const ordered = args.forecastPeriods
    .filter((p) => p.key >= fromKey)
    .sort((a, b) => a.key.localeCompare(b.key))

  let cursor = asNumber(args.selected.value)
  const amountByKey = new Map<string, number>()
  for (let i = 0; i < ordered.length; i++) {
    if (i === 0) {
      amountByKey.set(ordered[i].key, cursor)
      continue
    }
    cursor = round2(cursor * rate)
    amountByKey.set(ordered[i].key, cursor)
  }

  const touchedIds: string[] = []
  const patchById = new Map<string, FpaCell>()
  for (const c of args.cells) {
    if (c.lineItemId !== args.selected.lineItemId) continue
    const key = monthKey(c.periodDate)
    if (!amountByKey.has(key) || key === fromKey) continue
    const cellDept = c.departmentId || null
    if (dept ? cellDept !== dept : cellDept != null) continue
    const amount = amountByKey.get(key)!
    touchedIds.push(c.id)
    patchById.set(c.id, { ...c, value: amount })
  }
  return {
    next: args.cells.map((c) => patchById.get(c.id) || c),
    touchedIds,
  }
}

/**
 * Soft reconcile: keep optimistic INPUT values; overlay server cells for
 * recordVersion / CALCULATED dependents without flashing INPUT numbers.
 */
export function softReconcileCells(
  current: FpaCell[],
  serverUpdates: FpaCell[],
  optimisticTouchedIds: string[],
): FpaCell[] {
  if (!serverUpdates.length) return current
  const touched = new Set(optimisticTouchedIds)
  const byId = new Map(serverUpdates.map((c) => [c.id, c]))
  return current.map((c) => {
    const s = byId.get(c.id)
    if (!s) return c
    if (touched.has(c.id)) {
      // Keep displayed value; take concurrency token / status from server.
      return {
        ...c,
        ...s,
        value: c.value,
      }
    }
    return { ...c, ...s }
  })
}
