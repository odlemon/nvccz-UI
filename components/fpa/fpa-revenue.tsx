"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  RevenueAnalysisView,
  type RevKpi,
  type RevMonthlyPoint,
  type RevStreamRow,
  type RevWaterfallPoint,
} from "@/components/fpa/revenue/revenue-analysis-view"
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

function mapDomain(data: FpaDomainView) {
  const raw = data as unknown as Record<string, unknown>
  const source = raw.kpis && typeof raw.kpis === "object" ? raw.kpis as Record<string, unknown> : undefined
  const revenue = optionalNumber(source?.revenue)
  const budget = optionalNumber(source?.budget)
  const forecast = optionalNumber(source?.forecast)
  const yoyPct = optionalNumber(source?.yoyPct)
  return {
    kpis: source ? [
      { label: "Revenue", value: fmtMillions(revenue) },
      { label: "Budget", value: fmtMillions(budget) },
      { label: "Forecast", value: fmtMillions(forecast) },
      { label: "YoY Growth", value: yoyPct == null ? "—" : `${yoyPct.toFixed(1)}%`, up: yoyPct == null ? undefined : yoyPct >= 0 },
    ] satisfies RevKpi[] : [],
    streams: records(raw.streams).map((row, index) => ({
      id: text(row.id ?? row.code, `stream-${index}`), name: text(row.name ?? row.label, "Unnamed stream"),
      region: text(row.region) || null, method: text(row.method) || null,
      actual: toMillions(row.actual), budget: toMillions(row.budget), forecast: toMillions(row.forecast),
      yoy: optionalNumber(row.yoyPct ?? row.yoy), share: optionalNumber(row.sharePct ?? row.share),
    })) satisfies RevStreamRow[],
    waterfall: records(raw.waterfall).map((point, index) => ({
      key: text(point.key ?? point.code, `waterfall-${index}`), label: text(point.label ?? point.name, "Unlabelled"),
      value: toMillions(point.value) ?? undefined, delta: toMillions(point.delta) ?? undefined,
    })) satisfies RevWaterfallPoint[],
    monthly: records(raw.monthly).map((point) => ({
      period: text(point.period), actual: toMillions(point.actual) ?? undefined,
      budget: toMillions(point.budget) ?? undefined, forecast: toMillions(point.forecast) ?? undefined,
    })).filter((point) => point.period) satisfies RevMonthlyPoint[],
  }
}

export function FpaRevenue() {
  const { selectedModelId, selectedVersionId, selectedScenarioId } = useAppSelector((s) => s.fpa)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [streams, setStreams] = useState<RevStreamRow[]>([])
  const [kpis, setKpis] = useState<RevKpi[]>([])
  const [waterfall, setWaterfall] = useState<RevWaterfallPoint[]>([])
  const [monthly, setMonthly] = useState<RevMonthlyPoint[]>([])
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
    setStreams([]); setKpis([]); setWaterfall([]); setMonthly([])
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
      const res = await fpaApi.getDomainView("revenue", {
        modelId: selectedModelId,
        versionId: selectedVersionId || undefined,
        scenarioId: selectedScenarioId || undefined,
        entityId: requestEntityId || undefined,
        periodFrom: requestPeriodFrom || undefined,
        periodTo: requestPeriodTo || undefined,
      })
      if (!res.success || !res.data) throw new Error(res.message || "Domain view failed")
      if (currentRequest !== requestId.current) return
      if (!scopeMatches(res.data.scope, requestedScope)) throw new Error("Response scope did not match the requested revenue filters.")
      const mapped = mapDomain(res.data)
      setKpis(mapped.kpis); setStreams(mapped.streams); setWaterfall(mapped.waterfall); setMonthly(mapped.monthly)
      const availableFilters = normalizeFilters(res.data.availableFilters)
      setFilters(availableFilters); periodsRef.current = availableFilters.periods ?? []
      setScope(res.data.scope); setDrivers(Array.isArray(res.data.drivers) ? res.data.drivers : [])
      loadedScopeRef.current = requestScopeKey
    } catch (err) {
      if (currentRequest !== requestId.current) return
      setError(err instanceof Error ? err.message : "Unable to load revenue analysis.")
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
      const res = await fpaApi.previewDomainSensitivity("revenue", {
        modelId: selectedModelId, versionId: selectedVersionId, scenarioId: selectedScenarioId,
        entityId: entityId || undefined, periodFrom: periodFrom || undefined, periodTo: periodTo || undefined,
        overrides: [{ driverCode, value }],
      })
      if (!res.success || !res.data) throw new Error(res.message || "Sensitivity preview failed")
      if (currentRequest !== previewRequestId.current) return
      if (!scopeMatches(res.data.scope, {
        modelId: selectedModelId, versionId: selectedVersionId, scenarioId: selectedScenarioId,
        entityId, periodFrom, periodTo,
      })) throw new Error("Sensitivity scope did not match the requested revenue filters.")
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
        <p className="text-sm text-[#64748b]">Select a model to load revenue analysis.</p>
      </div>
    )
  }

  return (
    <RevenueAnalysisView
      loading={loading}
      error={error}
      kpis={kpis}
      streams={streams}
      waterfall={waterfall}
      monthly={monthly}
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
