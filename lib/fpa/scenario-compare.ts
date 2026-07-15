import { asNumber, type FpaScenario, type FpaScenarioCompareResult } from "@/lib/api/fpa-api"

export const CANONICAL_COMPARE_METRICS = [
  { code: "REVENUE", label: "Revenue", match: /revenue/i },
  { code: "COGS", label: "COGS", match: /cogs|cost\s*of\s*(goods|sales)|cos\b/i },
  { code: "GROSS_PROFIT", label: "Gross Profit", match: /gross\s*profit/i },
  { code: "GROSS_MARGIN", label: "Gross Margin", match: /gross\s*margin/i, pct: true },
  { code: "OPEX", label: "Opex", match: /opex|operating\s*exp/i },
  { code: "EBITDA", label: "EBITDA", match: /ebitda/i },
  { code: "EBITDA_MARGIN", label: "EBITDA Margin", match: /ebitda\s*margin/i, pct: true },
  { code: "CAPEX", label: "Capex", match: /capex|capital\s*exp/i },
  { code: "HEADCOUNT", label: "Headcount (FTE)", match: /headcount|fte/i, count: true },
] as const

export type ScenarioValues = Record<string, number | null>

export type CompareMetricRow = {
  code: string
  label: string
  isPct?: boolean
  isCount?: boolean
  byScenario: ScenarioValues
  varianceAbs: number | null
  variancePct: number | null
  higherIsFavourable: boolean
}

export function higherIsFavourable(code: string): boolean {
  const c = code.toUpperCase()
  if (
    c.includes("COGS") ||
    c.includes("OPEX") ||
    c.includes("EXPENSE") ||
    c.includes("COST") ||
    c.includes("CAPEX") ||
    c.includes("TAX")
  ) {
    return false
  }
  return true
}

function emptyByScenario(ids: string[]): ScenarioValues {
  return Object.fromEntries(ids.map((id) => [id, null]))
}

function resolveCanon(codeOrLabel: string) {
  const code = String(codeOrLabel || "").toUpperCase()
  return (
    CANONICAL_COMPARE_METRICS.find((m) => m.code === code || m.match.test(codeOrLabel)) || null
  )
}

/** Map enriched or legacy compare payload into UI metric rows. */
export function mapCompareResultToRows(
  data: FpaScenarioCompareResult,
  selectedIds: string[],
  anchorId: string,
  primaryOtherId?: string | null,
): CompareMetricRow[] {
  const byCode = new Map<
    string,
    { label: string; byScenario: ScenarioValues; isPct?: boolean; isCount?: boolean }
  >()

  for (const m of CANONICAL_COMPARE_METRICS) {
    byCode.set(m.code, {
      label: m.label,
      byScenario: emptyByScenario(selectedIds),
      isPct: "pct" in m && m.pct,
      isCount: "count" in m && m.count,
    })
  }

  if (Array.isArray(data.metrics) && data.metrics.length) {
    for (const metric of data.metrics) {
      const canon = resolveCanon(metric.code) || resolveCanon(metric.label)
      const key = canon?.code || String(metric.code || "").toUpperCase() || metric.label
      const label = canon?.label || metric.label || key
      if (!byCode.has(key)) {
        byCode.set(key, {
          label,
          byScenario: emptyByScenario(selectedIds),
          isPct: metric.unit === "PERCENT" || (canon && "pct" in canon && canon.pct),
          isCount: metric.unit === "COUNT" || (canon && "count" in canon && canon.count),
        })
      }
      const entry = byCode.get(key)!
      for (const [sid, raw] of Object.entries(metric.values || {})) {
        if (!selectedIds.includes(sid)) continue
        entry.byScenario[sid] = raw == null ? null : asNumber(raw)
      }
    }
  } else if (Array.isArray(data.rows) && data.rows.length) {
    const leftId = data.left?.id || anchorId
    const rightId = data.right?.id || primaryOtherId || ""
    for (const r of data.rows) {
      const canon = resolveCanon(r.code)
      const key = canon?.code || String(r.code || "").toUpperCase()
      const label = canon?.label || r.code
      if (!byCode.has(key)) {
        byCode.set(key, {
          label,
          byScenario: emptyByScenario(selectedIds),
          isPct: canon && "pct" in canon && canon.pct,
          isCount: canon && "count" in canon && canon.count,
        })
      }
      const entry = byCode.get(key)!
      if (leftId) entry.byScenario[leftId] = asNumber(r.left)
      if (rightId) entry.byScenario[rightId] = asNumber(r.right)
    }
  }

  const otherId = primaryOtherId || selectedIds.find((id) => id !== anchorId) || null

  const rows: CompareMetricRow[] = Array.from(byCode.entries()).map(([code, entry]) => {
    const budgetVal = entry.byScenario[anchorId]
    const otherVal = otherId != null ? entry.byScenario[otherId] : null
    let varianceAbs: number | null = null
    let variancePct: number | null = null

    // Prefer server variance for primary other when present
    const enriched = data.metrics?.find(
      (m) =>
        m.code === code ||
        resolveCanon(m.code)?.code === code ||
        resolveCanon(m.label)?.code === code,
    )
    if (otherId && enriched?.varianceAbs?.[otherId] != null) {
      varianceAbs = asNumber(enriched.varianceAbs[otherId])
      variancePct =
        enriched.variancePct?.[otherId] != null
          ? asNumber(enriched.variancePct[otherId])
          : budgetVal != null && budgetVal !== 0 && varianceAbs != null
            ? (varianceAbs / Math.abs(budgetVal)) * 100
            : null
    } else if (
      budgetVal != null &&
      otherVal != null &&
      Number.isFinite(budgetVal) &&
      Number.isFinite(otherVal)
    ) {
      varianceAbs = otherVal - budgetVal
      variancePct = budgetVal !== 0 ? (varianceAbs / Math.abs(budgetVal)) * 100 : null
    }

    return {
      code,
      label: entry.label,
      isPct: entry.isPct,
      isCount: entry.isCount,
      byScenario: entry.byScenario,
      varianceAbs,
      variancePct,
      higherIsFavourable: enriched?.higherIsFavourable ?? higherIsFavourable(code),
    }
  })

  rows.sort((a, b) => {
    const ai = CANONICAL_COMPARE_METRICS.findIndex((m) => m.code === a.code)
    const bi = CANONICAL_COMPARE_METRICS.findIndex((m) => m.code === b.code)
    if (ai === -1 && bi === -1) return a.label.localeCompare(b.label)
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })

  return rows
}

export function emptyCompareSkeleton(
  scenarios: Array<Pick<FpaScenario, "id">>,
): CompareMetricRow[] {
  const ids = scenarios.map((s) => s.id)
  return CANONICAL_COMPARE_METRICS.map((m) => ({
    code: m.code,
    label: m.label,
    isPct: "pct" in m && m.pct,
    isCount: "count" in m && m.count,
    byScenario: emptyByScenario(ids),
    varianceAbs: null,
    variancePct: null,
    higherIsFavourable: higherIsFavourable(m.code),
  }))
}

export function assumptionCellValue(
  cell: { driverId?: string | null; value: number | null } | number | null | undefined,
): number | null {
  if (cell == null) return null
  if (typeof cell === "number") return cell
  return cell.value == null ? null : asNumber(cell.value)
}

export function assumptionCellDriverId(
  cell: { driverId?: string | null; value: number | null } | number | null | undefined,
): string | null {
  if (cell == null || typeof cell === "number") return null
  return cell.driverId || null
}
