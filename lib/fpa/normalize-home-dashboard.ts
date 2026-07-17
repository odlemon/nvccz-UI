import type { FpaHomeActivity, FpaHomeDashboard } from "@/lib/api/fpa-api"

type UnknownRecord = Record<string, unknown>

function record(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as UnknownRecord
    : {}
}

function array(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function stringValue(...values: unknown[]): string | undefined {
  const value = values.find((item) => typeof item === "string" && item.length > 0)
  return typeof value === "string" ? value : undefined
}

function normalizeActivity(value: unknown): FpaHomeActivity {
  const item = record(value)
  const title = stringValue(item.title, item.summary, item.action)
  const actorName = stringValue(item.actorName, item.userName, item.byName)
  const createdAt = stringValue(item.createdAt, item.at, item.timestamp)
  const body = stringValue(item.body, item.details, item.comment)

  return {
    ...(item as FpaHomeActivity),
    id: stringValue(item.id),
    title,
    actorName,
    createdAt,
    body,
  }
}

/** Accept both the currently delivered and documented Home dashboard contracts. */
export function normalizeFpaHomeDashboard(value: FpaHomeDashboard | null): FpaHomeDashboard | null {
  if (!value) return null

  const root = record(value)
  const rawKpis = record(root.kpis)
  const deltas = record(rawKpis.deltas)
  const rawWorkflow = root.workflowProgress
  const workflowObject = record(rawWorkflow)
  const workflowSlices = array(root.workflowStatusSlices).length
    ? array(root.workflowStatusSlices)
    : array(workflowObject.slices)
  const rawRunway = record(root.cashRunway)
  const runwayBars = array(rawRunway.byMonth).length
    ? array(rawRunway.byMonth)
    : array(rawRunway.bars)
  const rawCompare = record(root.scenarioCompare)

  const metrics = array(rawCompare.metrics).map((rawMetric) => {
    const metric = record(rawMetric)
    const rawValues = metric.values ?? metric.byScenario
    const values = Array.isArray(rawValues)
      ? rawValues.map((rawValue) => {
          const item = record(rawValue)
          return {
            ...item,
            scenarioId: stringValue(item.scenarioId, item.id, item.code) || "",
            scenarioName: stringValue(item.scenarioName, item.name) || "",
          }
        })
      : Object.entries(record(rawValues)).map(([scenarioId, rawValue]) => {
          const item = record(rawValue)
          const scalar = typeof rawValue === "number" ? rawValue : item.value
          return {
            ...item,
            scenarioId,
            scenarioName: stringValue(item.scenarioName, item.name) || scenarioId,
            value: scalar == null ? null : Number(scalar),
          }
        })

    return {
      ...metric,
      key: stringValue(metric.key, metric.code) || "",
      label: stringValue(metric.label, metric.name, metric.key, metric.code) || "",
      values,
    }
  })

  const recentActivity = array(root.recentActivity).length
    ? array(root.recentActivity).map(normalizeActivity)
    : array(root.activity).map(normalizeActivity)

  return {
    ...value,
    kpis: {
      ...rawKpis,
      forecastAccuracy: rawKpis.forecastAccuracy ?? rawKpis.forecastAccuracyPct,
      revenueDeltaPct: rawKpis.revenueDeltaPct ?? deltas.revenue ?? deltas.revenuePct,
      ebitdaDeltaPct: rawKpis.ebitdaDeltaPct ?? deltas.ebitda ?? deltas.ebitdaPct,
      closingCashDeltaPct:
        rawKpis.closingCashDeltaPct ?? deltas.closingCash ?? deltas.cash ?? deltas.closingCashPct,
    } as NonNullable<FpaHomeDashboard["kpis"]>,
    workflowStatusSlices: workflowSlices as NonNullable<FpaHomeDashboard["workflowStatusSlices"]>,
    scenarioCompare: {
      ...(rawCompare as NonNullable<FpaHomeDashboard["scenarioCompare"]>),
      metrics: metrics as NonNullable<NonNullable<FpaHomeDashboard["scenarioCompare"]>["metrics"]>,
    },
    cashRunway: {
      ...rawRunway,
      runwayMonths: rawRunway.runwayMonths ?? rawRunway.months,
      byMonth: runwayBars.map((rawBar) => {
        const bar = record(rawBar)
        return {
          ...bar,
          period: stringValue(bar.period, bar.month, bar.label) || "",
          closingCash: bar.closingCash ?? bar.balance ?? bar.value,
        }
      }),
    } as NonNullable<FpaHomeDashboard["cashRunway"]>,
    recentActivity,
    activity: recentActivity,
  }
}
