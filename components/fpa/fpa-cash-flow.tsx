"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  CashFlowAnalysisView,
  type CashKpi,
  type CashStatementRow,
} from "@/components/fpa/cash-flow/cash-flow-analysis-view"
import {
  fpaApi,
  asNumber,
  type FpaDomainAvailableFilters,
  type FpaDomainScope,
  type FpaDomainView,
  type FpaDriver,
} from "@/lib/api/fpa-api"
import { useAppSelector } from "@/lib/store"

const optionalNumber = (value: unknown): number | null => {
  if (value == null || value === "") return null
  const parsed = asNumber(value, Number.NaN)
  return Number.isFinite(parsed) ? parsed : null
}
const toMillions = (value: unknown) => {
  const parsed = optionalNumber(value)
  return parsed == null ? null : parsed / 1_000_000
}
const records = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object") : []
const text = (value: unknown, fallback = "") => typeof value === "string" ? value : fallback
const invalidPeriodRange = (periods: string[], from: string, to: string) =>
  Boolean(from && to && periods.includes(from) && periods.includes(to) && periods.indexOf(from) > periods.indexOf(to))
const normalizeFilters = (value: unknown): FpaDomainAvailableFilters => {
  const raw = value && typeof value === "object" ? value as Record<string, unknown> : {}
  return {
    entities: records(raw.entities).map((entity) => ({ id: text(entity.id), name: text(entity.name) })).filter((entity) => entity.id && entity.name),
    periods: Array.isArray(raw.periods) ? [...new Set(raw.periods.filter((period): period is string => typeof period === "string" && Boolean(period)))] : [],
  }
}
const scopeMatches = (scope: FpaDomainScope | undefined, expected: Required<FpaDomainScope>) => Boolean(scope
  && (scope.modelId ?? "") === expected.modelId && (scope.versionId ?? "") === expected.versionId
  && (scope.scenarioId ?? "") === expected.scenarioId && (scope.entityId ?? "") === expected.entityId
  && (scope.periodFrom ?? "") === expected.periodFrom && (scope.periodTo ?? "") === expected.periodTo)
const fmtMillions = (value: number | null | undefined) => {
  const millions = toMillions(value)
  return millions == null ? "—" : `$${millions.toFixed(1)}M`
}

function rowType(value: unknown): CashStatementRow["type"] | null {
  const normalized = text(value).toUpperCase().replace(/[\s-]+/g, "_")
  if (normalized === "INFLOW" || normalized === "CASH_INFLOW") return "inflow"
  if (normalized === "OUTFLOW" || normalized === "CASH_OUTFLOW") return "outflow"
  if (normalized === "TOTAL" || normalized === "BALANCE") return "total"
  return null
}

function mapDomain(data: FpaDomainView) {
  const raw = data as unknown as Record<string, unknown>
  const source = raw.kpis && typeof raw.kpis === "object" ? raw.kpis as Record<string, unknown> : undefined
  const periods = Array.isArray(raw.periods)
    ? [...new Set(raw.periods.filter((period): period is string => typeof period === "string" && Boolean(period)))]
    : []
  const closingCash = optionalNumber(source?.closingCash ?? source?.closingBalance)
  const netCashFlow = optionalNumber(source?.netCashFlow ?? source?.netFlow)
  const runwayMonths = optionalNumber(source?.runwayMonths ?? source?.runway)
  const statementRows: CashStatementRow[] = records(raw.rows).flatMap((row, index) => {
    const type = rowType(row.rowType ?? row.type)
    if (!type) return []
    const valuesSource = row.values && typeof row.values === "object" ? row.values as Record<string, unknown> : {}
    const values = Object.fromEntries(periods.map((period) => {
      const parsed = toMillions(valuesSource[period])
      if (parsed == null || type === "total") return [period, parsed]
      return [period, type === "outflow" ? -Math.abs(parsed) : Math.abs(parsed)]
    }))
    return [{
      id: text(row.id ?? row.code, `cash-row-${index}`),
      line: text(row.label ?? row.name, "Unlabelled cash row"),
      type,
      values,
    }]
  })
  return {
    kpis: source ? [
      { label: "Closing Cash", value: fmtMillions(closingCash) },
      { label: "Net Cash Flow", value: netCashFlow == null ? "—" : `${netCashFlow < 0 ? "-" : "+"}$${Math.abs(netCashFlow / 1_000_000).toFixed(1)}M`, up: netCashFlow == null ? undefined : netCashFlow >= 0 },
      { label: "Runway", value: runwayMonths == null ? "—" : `${runwayMonths.toFixed(1)} mo` },
    ] satisfies CashKpi[] : [],
    periods,
    statementRows,
  }
}

export function FpaCashFlow() {
  const { selectedModelId, selectedVersionId, selectedScenarioId } = useAppSelector((s) => s.fpa)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [periods, setPeriods] = useState<string[]>([])
  const [statementRows, setStatementRows] = useState<CashStatementRow[]>([])
  const [kpis, setKpis] = useState<CashKpi[]>([])
  const [filters, setFilters] = useState<FpaDomainAvailableFilters>({})
  const [scope, setScope] = useState<FpaDomainScope>()
  const [entityId, setEntityId] = useState("")
  const [periodFrom, setPeriodFrom] = useState("")
  const [periodTo, setPeriodTo] = useState("")
  const [drivers, setDrivers] = useState<FpaDriver[]>([])
  const [preview, setPreview] = useState<ReturnType<typeof mapDomain>>()
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string>()
  const requestId = useRef(0)
  const previewRequestId = useRef(0)
  const periodsRef = useRef<string[]>([])
  const scopeContextRef = useRef("")
  const loadedScopeRef = useRef("")

  const clearData = useCallback(() => {
    previewRequestId.current += 1
    setPeriods([]); setStatementRows([]); setKpis([])
    setPreview(undefined); setPreviewError(undefined); setPreviewLoading(false)
  }, [])

  const load = useCallback(async () => {
    const currentRequest = ++requestId.current
    const contextKey = `${selectedModelId}|${selectedVersionId}|${selectedScenarioId}`
    const contextChanged = scopeContextRef.current !== contextKey
    if (contextChanged) {
      scopeContextRef.current = contextKey
      setEntityId(""); setPeriodFrom(""); setPeriodTo(""); setFilters({}); setDrivers([])
      periodsRef.current = []
    }
    const requestEntityId = contextChanged ? "" : entityId
    const requestPeriodFrom = contextChanged ? "" : periodFrom
    const requestPeriodTo = contextChanged ? "" : periodTo
    const requestedScope = {
      modelId: selectedModelId || "", versionId: selectedVersionId || "", scenarioId: selectedScenarioId || "",
      entityId: requestEntityId, periodFrom: requestPeriodFrom, periodTo: requestPeriodTo,
    }
    const requestScopeKey = JSON.stringify(requestedScope)
    const scopeChanged = loadedScopeRef.current !== requestScopeKey
    if (!selectedModelId) {
      setLoading(false)
      setError(undefined)
      clearData(); setFilters({}); setScope(undefined); setDrivers([])
      return
    }
    if (invalidPeriodRange(periodsRef.current, requestPeriodFrom, requestPeriodTo)) {
      setLoading(false); setError("INVALID_PERIOD_RANGE: The start period must not be after the end period."); clearData(); return
    }
    setLoading(true)
    setError(undefined)
    if (scopeChanged) clearData()
    else {
      previewRequestId.current += 1
      setPreview(undefined); setPreviewError(undefined); setPreviewLoading(false)
    }
    try {
      const res = await fpaApi.getDomainView("cash", {
        modelId: selectedModelId,
        versionId: selectedVersionId || undefined,
        scenarioId: selectedScenarioId || undefined,
        entityId: requestEntityId || undefined,
        periodFrom: requestPeriodFrom || undefined,
        periodTo: requestPeriodTo || undefined,
      })
      if (!res.success || !res.data) throw new Error(res.message || "Domain view failed")
      if (currentRequest !== requestId.current) return
      if (!scopeMatches(res.data.scope, requestedScope)) throw new Error("Response scope did not match the requested cash-flow filters.")
      const mapped = mapDomain(res.data)
      setKpis(mapped.kpis); setPeriods(mapped.periods); setStatementRows(mapped.statementRows)
      const availableFilters = normalizeFilters(res.data.availableFilters)
      setFilters(availableFilters); periodsRef.current = availableFilters.periods ?? []
      setScope(res.data.scope); setDrivers(Array.isArray(res.data.drivers) ? res.data.drivers : [])
      loadedScopeRef.current = requestScopeKey
    } catch (err) {
      if (currentRequest !== requestId.current) return
      setError(err instanceof Error ? err.message : "Unable to load cash flow analysis.")
      if (scopeChanged) clearData()
    } finally {
      if (currentRequest === requestId.current) setLoading(false)
    }
  }, [selectedModelId, selectedVersionId, selectedScenarioId, entityId, periodFrom, periodTo, clearData])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (entityId && !(filters.entities ?? []).some((option) => option.id === entityId)) setEntityId("")
    if (periodFrom && !(filters.periods ?? []).includes(periodFrom)) setPeriodFrom("")
    if (periodTo && !(filters.periods ?? []).includes(periodTo)) setPeriodTo("")
  }, [filters, entityId, periodFrom, periodTo])

  const runSensitivity = useCallback(async (driverCode: string, value: number) => {
    if (!selectedModelId || !selectedVersionId || !selectedScenarioId) {
      setPreviewError("Select a model, version, and scenario before previewing sensitivity."); return
    }
    if (invalidPeriodRange(periodsRef.current, periodFrom, periodTo)) {
      setPreviewError("INVALID_PERIOD_RANGE: The start period must not be after the end period."); return
    }
    const currentRequest = ++previewRequestId.current
    setPreviewLoading(true); setPreviewError(undefined); setPreview(undefined)
    try {
      const res = await fpaApi.previewDomainSensitivity("cash", {
        modelId: selectedModelId, versionId: selectedVersionId, scenarioId: selectedScenarioId,
        entityId: entityId || undefined, periodFrom: periodFrom || undefined, periodTo: periodTo || undefined,
        overrides: [{ driverCode, value }],
      })
      if (!res.success || !res.data) throw new Error(res.message || "Sensitivity preview failed")
      if (currentRequest !== previewRequestId.current) return
      if (!scopeMatches(res.data.scope, {
        modelId: selectedModelId, versionId: selectedVersionId, scenarioId: selectedScenarioId,
        entityId, periodFrom, periodTo,
      })) throw new Error("Sensitivity scope did not match the requested cash-flow filters.")
      setPreview(mapDomain(res.data.preview))
    } catch (err) {
      if (currentRequest !== previewRequestId.current) return
      setPreviewError(err instanceof Error ? err.message : "Unable to preview sensitivity.")
    } finally {
      if (currentRequest === previewRequestId.current) setPreviewLoading(false)
    }
  }, [selectedModelId, selectedVersionId, selectedScenarioId, entityId, periodFrom, periodTo])

  if (!selectedModelId) {
    return (
      <div className="min-h-full bg-[#f1f5f9] flex items-center justify-center p-8">
        <p className="text-sm text-[#64748b]">Select a model to load cash flow analysis.</p>
      </div>
    )
  }

  return (
    <CashFlowAnalysisView
      loading={loading}
      error={error}
      kpis={kpis}
      periods={periods}
      statementRows={statementRows}
      entities={filters.entities ?? []}
      availablePeriods={filters.periods ?? []}
      selectedEntityId={entityId}
      periodFrom={periodFrom}
      periodTo={periodTo}
      appliedScope={scope}
      onEntityChange={setEntityId}
      onPeriodFromChange={setPeriodFrom}
      onPeriodToChange={setPeriodTo}
      drivers={drivers}
      preview={preview}
      previewLoading={previewLoading}
      previewError={previewError}
      onPreview={runSensitivity}
      onResetPreview={() => { setPreview(undefined); setPreviewError(undefined) }}
      onRefresh={() => void load()}
    />
  )
}
