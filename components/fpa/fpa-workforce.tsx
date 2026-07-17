"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  WorkforceAnalysisView,
  type WfAttritionPoint,
  type WfDeptRow,
  type WfHirePlanPoint,
  type WfKpi,
} from "@/components/fpa/workforce/workforce-analysis-view"
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
  && (scope.modelId ?? "") === expected.modelId
  && (scope.versionId ?? "") === expected.versionId
  && (scope.scenarioId ?? "") === expected.scenarioId
  && (scope.entityId ?? "") === expected.entityId
  && (scope.periodFrom ?? "") === expected.periodFrom
  && (scope.periodTo ?? "") === expected.periodTo)

function mapStatus(status: string | null | undefined): WfDeptRow["status"] {
  const value = status?.toLowerCase().replace(/[_\s]+/g, "-")
  if (value === "hiring" || value === "on-track") return value
  if (value === "over" || value === "over-plan" || value === "over-budget") return "over"
  if (value === "under" || value === "under-plan" || value === "under-budget") return "under"
  return undefined
}

function mapDomain(data: FpaDomainView) {
  const raw = data as unknown as Record<string, unknown>
  const departments: WfDeptRow[] = records(raw.departments).map((workforce, index) => {
    return {
      id: text(workforce.departmentId ?? workforce.id, `department-${index}`),
      dept: text(workforce.departmentName ?? workforce.name ?? workforce.department, "Unnamed department"),
      entity: text(workforce.entity ?? workforce.entityName) || null,
      hc: optionalNumber(workforce.headcount ?? workforce.hc),
      budgetHc: optionalNumber(workforce.budgetHeadcount ?? workforce.budgetHc),
      salary: toMillions(workforce.salary),
      avgSalary: optionalNumber(workforce.avgSalary ?? workforce.averageSalary) == null ? null : optionalNumber(workforce.avgSalary ?? workforce.averageSalary)! / 1_000,
      hires: optionalNumber(workforce.hires ?? workforce.netHires),
      attrition: optionalNumber(workforce.attritionPct ?? workforce.attrition),
      openRoles: optionalNumber(workforce.openRoles),
      status: mapStatus(text(workforce.status) || undefined),
    }
  })
  const source = raw.kpis && typeof raw.kpis === "object" ? raw.kpis as Record<string, unknown> : undefined
  const spark = source?.sparklines && typeof source.sparklines === "object" ? source.sparklines as Record<string, unknown> : {}
  const sparkline = (value: unknown) => Array.isArray(value) ? value.map(optionalNumber).filter((item): item is number => item != null) : undefined
  const headcount = optionalNumber(source?.headcount)
  const avgSalary = optionalNumber(source?.avgSalary ?? source?.averageSalary)
  const hiresYtd = optionalNumber(source?.hiresYtd ?? source?.hires)
  const attritionPct = optionalNumber(source?.attritionPct ?? source?.attrition)
  const openRoles = optionalNumber(source?.openRoles)
  const kpis: WfKpi[] = source ? [
    { label: "Headcount", value: headcount == null ? "—" : String(headcount), spark: sparkline(spark.headcount) },
    { label: "Average Salary", value: avgSalary == null ? "—" : `$${(avgSalary / 1_000).toFixed(0)}K`, spark: sparkline(spark.avgSalary) },
    { label: "Hires YTD", value: hiresYtd == null ? "—" : String(hiresYtd), spark: sparkline(spark.hiresYtd) },
    { label: "Attrition", value: attritionPct == null ? "—" : `${attritionPct.toFixed(1)}%`, spark: sparkline(spark.attritionPct) },
    { label: "Open Roles", value: openRoles == null ? "—" : String(openRoles), spark: sparkline(spark.openRoles) },
  ] : []
  const hirePlan: WfHirePlanPoint[] = records(raw.hirePlan).map((point) => {
    const planned = optionalNumber(point.planned ?? point.plannedHires)
    const actual = optionalNumber(point.actual ?? point.actualHires)
    return { period: text(point.period), planned, actual }
  }).filter((point) => point.period && (point.planned != null || point.actual != null))
    .map((point) => ({ period: point.period, planned: point.planned ?? 0, actual: point.actual ?? 0 }))
  const attritionTrend: WfAttritionPoint[] = records(raw.attritionTrend).map((point) => ({
    period: text(point.period), pct: optionalNumber(point.pct ?? point.attritionPct) ?? Number.NaN,
  })).filter((point) => point.period && Number.isFinite(point.pct))
  return { departments, kpis, hirePlan, attritionTrend }
}

export function FpaWorkforce() {
  const { selectedModelId, selectedVersionId, selectedScenarioId } = useAppSelector((s) => s.fpa)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [deptRows, setDeptRows] = useState<WfDeptRow[]>([])
  const [kpis, setKpis] = useState<WfKpi[]>([])
  const [hirePlan, setHirePlan] = useState<WfHirePlanPoint[]>([])
  const [attritionTrend, setAttritionTrend] = useState<WfAttritionPoint[]>([])
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
    setDeptRows([])
    setKpis([])
    setHirePlan([])
    setAttritionTrend([])
    setPreview(undefined)
    setPreviewError(undefined)
    setPreviewLoading(false)
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
      clearData()
      setFilters({})
      setScope(undefined)
      setDrivers([])
      return
    }
    if (invalidPeriodRange(periodsRef.current, requestPeriodFrom, requestPeriodTo)) {
      setLoading(false)
      setError("INVALID_PERIOD_RANGE: The start period must not be after the end period.")
      clearData()
      return
    }
    setLoading(true)
    setError(undefined)
    if (scopeChanged) clearData()
    else {
      previewRequestId.current += 1
      setPreview(undefined); setPreviewError(undefined); setPreviewLoading(false)
    }
    try {
      const res = await fpaApi.getDomainView("workforce", {
        modelId: selectedModelId,
        versionId: selectedVersionId || undefined,
        scenarioId: selectedScenarioId || undefined,
        entityId: requestEntityId || undefined,
        periodFrom: requestPeriodFrom || undefined,
        periodTo: requestPeriodTo || undefined,
      })
      if (!res.success || !res.data) throw new Error(res.message || "Domain view failed")
      if (currentRequest !== requestId.current) return
      if (!scopeMatches(res.data.scope, requestedScope)) throw new Error("Response scope did not match the requested workforce filters.")
      const mapped = mapDomain(res.data)
      setDeptRows(mapped.departments)
      setKpis(mapped.kpis)
      setHirePlan(mapped.hirePlan)
      setAttritionTrend(mapped.attritionTrend)
      const availableFilters = normalizeFilters(res.data.availableFilters)
      setFilters(availableFilters)
      periodsRef.current = availableFilters.periods ?? []
      setScope(res.data.scope)
      setDrivers(Array.isArray(res.data.drivers) ? res.data.drivers : [])
      loadedScopeRef.current = requestScopeKey
    } catch (err) {
      if (currentRequest !== requestId.current) return
      setError(err instanceof Error ? err.message : "Unable to load workforce analysis.")
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
      setPreviewError("Select a model, version, and scenario before previewing sensitivity.")
      return
    }
    if (invalidPeriodRange(periodsRef.current, periodFrom, periodTo)) {
      setPreviewError("INVALID_PERIOD_RANGE: The start period must not be after the end period.")
      return
    }
    const currentRequest = ++previewRequestId.current
    setPreviewLoading(true)
    setPreviewError(undefined)
    setPreview(undefined)
    try {
      const res = await fpaApi.previewDomainSensitivity("workforce", {
        modelId: selectedModelId,
        versionId: selectedVersionId,
        scenarioId: selectedScenarioId,
        entityId: entityId || undefined,
        periodFrom: periodFrom || undefined,
        periodTo: periodTo || undefined,
        overrides: [{ driverCode, value }],
      })
      if (!res.success || !res.data) throw new Error(res.message || "Sensitivity preview failed")
      if (currentRequest !== previewRequestId.current) return
      if (!scopeMatches(res.data.scope, {
        modelId: selectedModelId, versionId: selectedVersionId, scenarioId: selectedScenarioId,
        entityId, periodFrom, periodTo,
      })) throw new Error("Sensitivity scope did not match the requested workforce filters.")
      setPreview(mapDomain(res.data.preview))
    } catch (err) {
      if (currentRequest !== previewRequestId.current) return
      setPreviewError(err instanceof Error ? err.message : "Unable to preview sensitivity.")
    } finally {
      if (currentRequest === previewRequestId.current) setPreviewLoading(false)
    }
  }, [selectedModelId, selectedVersionId, selectedScenarioId, entityId, periodFrom, periodTo])

  if (!selectedModelId) {
    return <div className="min-h-full bg-[#f1f5f9] flex items-center justify-center p-8"><p className="text-sm text-[#64748b]">Select a model to load workforce analysis.</p></div>
  }

  return (
    <WorkforceAnalysisView
      loading={loading}
      error={error}
      kpis={kpis}
      deptRows={deptRows}
      hirePlan={hirePlan}
      attritionTrend={attritionTrend}
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
      onResetPreview={() => {
        setPreview(undefined)
        setPreviewError(undefined)
      }}
      onRefresh={() => void load()}
    />
  )
}
