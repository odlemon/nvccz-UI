"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  AlertCircle,
  Check,
  ChevronDown,
  Lock,
  Play,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from "lucide-react"
import { toast } from "sonner"
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { fpaApi, formatMoney, type FpaRollingForecast } from "@/lib/api/fpa-api"
import { errorMessage } from "@/lib/fpa/fpa-api-gaps"
import { useFpaBootstrap } from "@/lib/hooks/useFpaBootstrap"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const R = "rounded-lg"

function monthKey(period?: string | null) {
  return period?.slice(0, 7) || ""
}

function monthLabel(period?: string | null, compact = false) {
  if (!period) return "—"
  const match = /^(\d{4})-(\d{2})/.exec(period)
  if (!match) return period
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1))
  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: compact ? "2-digit" : "numeric",
    timeZone: "UTC",
  }).format(date)
}

function requestError(err: unknown) {
  const detail = errorMessage(err)
  const apiError = err as { status?: number; response?: { code?: string; status?: number; statusCode?: number } }
  const code = apiError.response?.code
  const status = apiError.status ?? apiError.response?.status ?? apiError.response?.statusCode
  if (code === "LOCKED_VERSION") return `This forecast version is locked. ${detail}`
  if (code === "INVALID_CUTOFF") return `The selected cut-off is outside the forecast horizon. ${detail}`
  if (status === 403 || /permission|forbidden/i.test(detail)) {
    return `You do not have permission to change this forecast. ${detail}`
  }
  return detail
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="h-10 min-w-[118px] inline-flex items-center rounded-full border border-[#d0d5dd] bg-white pl-3 pr-8 text-left hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="flex flex-col justify-center min-w-0 py-1">
          <span className="text-[9px] font-medium uppercase tracking-wide text-[#98a2b3] leading-none">{label}</span>
          <span className="text-[12px] font-semibold text-[#101828] leading-tight mt-0.5 truncate">{value}</span>
        </span>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-4 text-[#98a2b3]" />
      </button>
      {open ? (
        <div className={`absolute left-0 top-[calc(100%+4px)] z-40 min-w-[180px] ${R} border border-[#e4e7ec] bg-white py-1 shadow-lg`}>
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false) }}
              className={cn(
                "w-full flex items-center justify-between gap-2 rounded-full px-3 py-2 text-left text-[12px] hover:bg-[#f9fafb]",
                opt === value ? "text-[#1570ef] font-semibold" : "text-[#344054]",
              )}
            >
              {opt}
              {opt === value ? <Check className="size-3.5 shrink-0" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function FpaRollingForecast() {
  const searchParams = useSearchParams()
  const {
    selectedModelId,
    selectedVersionId,
    selectedScenarioId,
    models,
    versions,
    scenarios,
    loading: loadingSelection,
    selectModel,
    setVersionId,
    setScenarioId,
  } = useFpaBootstrap()
  const model = models.find((m) => m.id === selectedModelId)
  const effectiveVersionId = selectedVersionId || model?.defaultVersionId || undefined
  const effectiveScenarioId = selectedScenarioId || model?.defaultScenarioId || undefined
  const cycleId = searchParams.get("cycleId") || undefined
  const [summary, setSummary] = useState<FpaRollingForecast | null>(null)
  const [loading, setLoading] = useState(false)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [draftCutoffIndex, setDraftCutoffIndex] = useState(0)
  const loadRequestRef = useRef(0)

  const loadForecast = useCallback(async (notify = true) => {
    const requestId = ++loadRequestRef.current
    if (!selectedModelId) {
      setSummary(null)
      setLoadError("Select a model to view its rolling forecast.")
      return
    }
    setLoading(true)
    setLoadError(null)
    try {
      const response = await fpaApi.getRollingForecast(selectedModelId, {
        versionId: effectiveVersionId,
        scenarioId: effectiveScenarioId,
        cycleId,
      })
      if (!response.success || !response.data) {
        throw new Error(response.message || "Rolling forecast summary is unavailable")
      }
      if (requestId === loadRequestRef.current) setSummary(response.data)
    } catch (err) {
      const message = requestError(err)
      if (requestId === loadRequestRef.current) {
        setLoadError(message)
        if (notify) toast.error("Could not load rolling forecast", { description: message })
      }
    } finally {
      if (requestId === loadRequestRef.current) setLoading(false)
    }
  }, [cycleId, effectiveScenarioId, effectiveVersionId, selectedModelId])

  useEffect(() => {
    if (loadingSelection) {
      loadRequestRef.current += 1
      setLoading(false)
      return
    }
    void loadForecast()
  }, [loadForecast, loadingSelection])

  const periods = useMemo(() => summary?.trend || [], [summary?.trend])
  const cutoffIndex = useMemo(() => {
    const cutoff = monthKey(summary?.actualsCutoff)
    let lastActual = -1
    let lastBeforeCutoff = -1
    periods.forEach((item, index) => {
      if (item.actual != null) lastActual = index
      if (cutoff && monthKey(item.period) <= cutoff) lastBeforeCutoff = index
    })
    if (!cutoff) return Math.max(0, lastActual)
    const exact = periods.findIndex((item) => monthKey(item.period) === cutoff)
    if (exact >= 0) return exact
    return Math.max(0, lastBeforeCutoff)
  }, [periods, summary?.actualsCutoff])

  useEffect(() => {
    setDraftCutoffIndex(cutoffIndex)
  }, [cutoffIndex])

  const activeMethod = summary?.activeMethod || ""
  const method = summary?.methods?.find(
    (item) => item.code.toLowerCase() === activeMethod.toLowerCase(),
  )
  const isBusy = loading || busyAction !== null
  const initialLoading = !summary && (loading || loadingSelection)
  const horizonMonths = summary?.horizonMonths ?? 0
  const cutoffPeriod = periods[draftCutoffIndex]?.period || summary?.actualsCutoff || null
  const persistedCutoffPeriod = summary?.actualsCutoff || periods[cutoffIndex]?.period || null

  const kpis = useMemo(() => {
    const values = summary?.kpis
    const money = (value?: number | null) => value == null ? "—" : formatMoney(value)
    const number = (value?: number | null, suffix = "") =>
      value == null ? "—" : `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })}${suffix}`
    return [
      { label: "Revenue Forecast", value: money(values?.revenue), delta: "Rolling horizon" },
      { label: "EBITDA", value: money(values?.ebitda), delta: "Rolling horizon" },
      { label: "Closing Cash", value: money(values?.closingCash ?? values?.cash), delta: "Forecast close" },
      { label: "Cash Runway", value: number(values?.runwayMonths, " mo"), delta: "Forecast runway" },
      { label: "Forecast Accuracy", value: number(values?.accuracyPct, "%"), delta: "Reported accuracy" },
    ]
  }, [summary?.kpis])

  const trendData = useMemo(() => periods.map((item) => ({
    period: item.period,
    actualLine: item.actual == null ? null : item.actual / 1e6,
    forecastLine: item.forecast == null ? null : item.forecast / 1e6,
    budget: item.budget == null ? null : item.budget / 1e6,
  })), [periods])

  const methodCompare = useMemo(() => (summary?.methods || [])
    .map((item) => ({
      code: item.code,
      name: item.label,
      revenue: item.revenue == null ? null : Number(item.revenue) / 1e6,
    })), [summary?.methods])

  const updateCutoff = async (nextIndex: number, nextHorizon = horizonMonths) => {
    const nextPeriod = periods[nextIndex]?.period || persistedCutoffPeriod
    if (!selectedModelId || !nextPeriod || !nextHorizon) return
    if (monthKey(nextPeriod) === monthKey(persistedCutoffPeriod) && nextHorizon === horizonMonths) {
      setDraftCutoffIndex(cutoffIndex)
      return
    }
    setBusyAction("cutoff")
    setLoadError(null)
    try {
      const response = await fpaApi.updateRollingForecastCutoff(selectedModelId, {
        versionId: effectiveVersionId,
        scenarioId: effectiveScenarioId,
        cycleId,
        actualsCutoff: nextPeriod,
        horizonMonths: nextHorizon,
      })
      if (!response.success) throw new Error(response.message || "Could not update forecast cut-off")
      toast.success("Rolling forecast window updated")
      await loadForecast(false)
    } catch (err) {
      const message = requestError(err)
      setLoadError(message)
      toast.error("Could not update rolling forecast", { description: message })
      setDraftCutoffIndex(cutoffIndex)
    } finally {
      setBusyAction(null)
    }
  }

  const handleMethodChange = async (code: string) => {
    if (!selectedModelId || code.toLowerCase() === activeMethod.toLowerCase()) return
    setBusyAction("method")
    setLoadError(null)
    try {
      const response = await fpaApi.updateRollingForecastMethod(selectedModelId, {
        versionId: effectiveVersionId,
        scenarioId: effectiveScenarioId,
        cycleId,
        method: code,
      })
      if (!response.success) throw new Error(response.message || "Could not update forecast method")
      toast.success("Forecast method updated")
      await loadForecast(false)
    } catch (err) {
      const message = requestError(err)
      setLoadError(message)
      toast.error("Could not update forecast method", { description: message })
    } finally {
      setBusyAction(null)
    }
  }

  const handleRollForward = async () => {
    if (!selectedModelId) return
    setBusyAction("roll")
    setLoadError(null)
    try {
      const response = await fpaApi.rollForwardForecast(selectedModelId, {
        versionId: effectiveVersionId,
        scenarioId: effectiveScenarioId,
        cycleId,
        months: 1,
      })
      if (!response.success) throw new Error(response.message || "Could not roll forecast forward")
      toast.success("Forecast rolled forward by one month")
      await loadForecast(false)
    } catch (err) {
      const message = requestError(err)
      setLoadError(message)
      toast.error("Could not roll forecast forward", { description: message })
    } finally {
      setBusyAction(null)
    }
  }

  const handleSyncActuals = async () => {
    if (!selectedModelId) return
    setBusyAction("sync")
    setLoadError(null)
    try {
      const response = await fpaApi.syncActuals({
        modelId: selectedModelId,
        versionId: effectiveVersionId,
        scenarioId: effectiveScenarioId,
      })
      if (!response.success) throw new Error(response.message || "Could not sync actuals")
      const data = response.data as { rowCount?: number; synced?: number; count?: number } | null
      const count = data?.rowCount ?? data?.synced ?? data?.count
      toast.success(typeof count === "number" ? `Synced ${count} actual rows` : "Actuals synced")
      await loadForecast(false)
    } catch (err) {
      const message = requestError(err)
      setLoadError(message)
      toast.error("Could not sync actuals", { description: message })
    } finally {
      setBusyAction(null)
    }
  }

  const worksheetHref = selectedModelId
    ? `/forecasting/models/${selectedModelId}/worksheet`
    : "/forecasting/models"

  const closedCount = periods.filter((item) => item.actual != null).length
  const openCount = periods.filter((item) => item.forecast != null).length
  const versionName = versions.find((item) => item.id === effectiveVersionId)?.name || "—"
  const scenarioName = scenarios.find((item) => item.id === effectiveScenarioId)?.name || "—"

  return (
    <div className="min-h-full bg-[#f1f5f9] flex flex-col w-full">
      <div className="bg-white border-b border-[#e4e7ec] w-full">
        <div className="px-4 sm:px-5 pt-4 pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-[18px] font-semibold text-[#101828]">Forecasts</h1>
              <p className="text-[12px] text-[#667085] mt-0.5">
                Rolling forecast · {closedCount} actual periods + {openCount} forecast periods
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="rounded-full h-9 px-4 text-xs"
                disabled={isBusy || !selectedModelId}
                onClick={handleSyncActuals}
              >
                <RefreshCw className={cn("size-3.5", busyAction === "sync" && "animate-spin")} />
                Sync Actuals
              </Button>
              <Button
                variant="gradient-info"
                className="rounded-full h-9 px-4 text-xs shadow-sm"
                disabled={isBusy || !selectedModelId}
                onClick={handleRollForward}
              >
                {busyAction === "roll" ? <RefreshCw className="size-3.5 animate-spin" /> : <Play className="size-3.5 fill-white" />}
                Roll Forward
              </Button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-end gap-2">
            <FilterSelect
              label="Model"
              value={model?.name || "—"}
              options={models.map((item) => item.name)}
              disabled={isBusy || loadingSelection}
              onChange={(name) => {
                const next = models.find((item) => item.name === name)
                if (next && next.id !== selectedModelId) void selectModel(next.id)
              }}
            />
            <FilterSelect
              label="Version"
              value={versionName}
              options={versions.map((item) => item.name)}
              disabled={isBusy || loadingSelection}
              onChange={(name) => setVersionId(versions.find((item) => item.name === name)?.id || null)}
            />
            <FilterSelect
              label="Scenario"
              value={scenarioName}
              options={scenarios.map((item) => item.name)}
              disabled={isBusy || loadingSelection}
              onChange={(name) => setScenarioId(scenarios.find((item) => item.name === name)?.id || null)}
            />
            <FilterSelect
              label="Horizon"
              value={horizonMonths ? `${horizonMonths} months` : "—"}
              options={Array.from(new Set([horizonMonths, 12, 18]))
                .filter((value) => value > 0)
                .map((value) => `${value} months`)}
              disabled={isBusy || !summary || !persistedCutoffPeriod}
              onChange={(value) => {
                const nextHorizon = Number.parseInt(value, 10)
                if (Number.isFinite(nextHorizon) && nextHorizon !== horizonMonths) {
                  void updateCutoff(cutoffIndex, nextHorizon)
                }
              }}
            />
          </div>
        </div>

        {loadError ? (
          <div className="mx-4 sm:mx-5 mb-3 rounded-lg border border-[#fecdca] bg-[#fef3f2] px-3 py-2 text-[12px] text-[#b42318] flex items-center justify-between gap-3" role="alert">
            <span>{loadError}</span>
            <button
              type="button"
              disabled={loading}
              onClick={() => void loadForecast()}
              className="h-8 shrink-0 rounded-full border border-[#fda29b] px-3 font-semibold hover:bg-[#fee4e2] disabled:opacity-50"
            >
              Retry
            </button>
          </div>
        ) : null}

        <div className="px-4 sm:px-5 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            {initialLoading ? Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className={`${R} border border-[#e4e7ec] bg-white px-4 py-3 space-y-3`}
                role="status"
              >
                <div className="h-3 w-28 animate-pulse rounded bg-[#e4e7ec]" />
                <div className="h-6 w-32 animate-pulse rounded bg-[#e4e7ec]" />
                <div className="h-3 w-20 animate-pulse rounded bg-[#e4e7ec]" />
              </div>
            )) : kpis.map((k) => (
              <div
                key={k.label}
                className={`${R} border border-[#e4e7ec] bg-white px-4 py-3 text-left shadow-[0_1px_2px_rgba(16,24,40,0.03)]`}
              >
                <p className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider">{k.label}</p>
                <p className="text-xl font-bold text-[#101828] mt-1 tabular-nums">{k.value}</p>
                <p className="text-[11px] text-[#667085] mt-1">{k.delta}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 sm:p-5 space-y-4 w-full">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <section className={`${R} border border-[#e4e7ec] bg-white p-4`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-semibold text-[#101828]">Actual vs Forecast Trend</h2>
                <p className="text-[11px] text-[#667085]">
                  Revenue (millions) · actuals through {monthLabel(summary?.actualsCutoff)} · forecast starts {monthLabel(summary?.forecastStart)}
                </p>
              </div>
              <span className="text-[11px] font-semibold text-[#079455] bg-[#edfcf2] px-2 py-0.5 rounded-full border border-[#abefc6]">
                SRD formula: Actuals + Forecast
              </span>
            </div>
            <div className="h-[240px]">
              {initialLoading ? (
                <div className="h-full w-full animate-pulse rounded-md bg-[#f2f4f7]" role="status" />
              ) : trendData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f2f4f7" />
                    <XAxis
                      dataKey="period"
                      tickFormatter={(value) => monthLabel(String(value), true)}
                      tick={{ fontSize: 10, fill: "#667085" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis tick={{ fontSize: 10, fill: "#667085" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      labelFormatter={(value) => monthLabel(String(value))}
                      formatter={(value: number) => [`${value.toFixed(2)}M`, ""]}
                      contentStyle={{ borderRadius: 8, fontSize: 12 }}
                    />
                    {persistedCutoffPeriod ? (
                      <ReferenceLine
                        x={periods[cutoffIndex]?.period || persistedCutoffPeriod}
                        stroke="#f59e0b"
                        strokeDasharray="4 4"
                        label={{ value: "Cut-off", fontSize: 10, fill: "#b54708" }}
                      />
                    ) : null}
                    <Bar dataKey="budget" fill="#e0e7ff" name="Budget" radius={[3, 3, 0, 0]} />
                    <Line type="monotone" dataKey="actualLine" stroke="#12b76a" strokeWidth={2.5} dot={{ r: 3 }} name="Actual" connectNulls={false} />
                    <Line type="monotone" dataKey="forecastLine" stroke="#2563eb" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 3 }} name="Forecast" connectNulls={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-[12px] text-[#98a2b3]">
                  {loading ? "Loading trend…" : "No trend periods available"}
                </div>
              )}
            </div>
          </section>

          <section className={`${R} border border-[#e4e7ec] bg-white p-4`}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[#101828]">Method Comparison</h2>
              <span className="text-[11px] text-[#667085]">Revenue ($M) by method</span>
            </div>
            <div className="h-[240px]">
              {initialLoading ? (
                <div className="h-full w-full animate-pulse rounded-md bg-[#f2f4f7]" role="status" />
              ) : methodCompare.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={methodCompare} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f2f4f7" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "#667085" }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#344054" }} width={100} />
                    <Tooltip formatter={(value: number) => [`${value.toFixed(2)}M`, "Revenue"]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Bar
                      dataKey="revenue"
                      fill="#2563eb"
                      radius={[0, 4, 4, 0]}
                      onClick={(data) => {
                        if (data?.code) void handleMethodChange(String(data.code))
                      }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-[12px] text-[#98a2b3]">
                  {loading ? "Loading methods…" : "No method comparison data available"}
                </div>
              )}
            </div>
          </section>
        </div>

        <section className={`${R} border border-[#e4e7ec] bg-white p-5 shadow-sm w-full`}>
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <div>
              <h2 className="text-[15px] font-semibold text-[#101828]">Rolling Horizon & Cut-off</h2>
              <p className="text-[12px] text-[#667085] mt-0.5">
                Model: {model?.name || "—"} · Granularity: {model?.timeGranularity || "—"}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#079455] bg-[#edfcf2] px-2 py-0.5 rounded-full border border-[#abefc6]">
              <TrendingUp className="w-3 h-3" />
              {horizonMonths ? `${horizonMonths}-month rolling window` : "Horizon unavailable"}
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2 mb-6">
            {initialLoading ? Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-full bg-[#e4e7ec]" role="status" />
            )) : null}
            {periods.map((item, idx) => {
              const isActual = item.actual != null || monthKey(item.period) <= monthKey(persistedCutoffPeriod)
              return (
                <button
                  key={item.period}
                  type="button"
                  disabled={isBusy}
                  onClick={() => void updateCutoff(idx)}
                  className={cn(
                    "rounded-full px-2 py-2.5 text-center border transition-all flex flex-col justify-between items-center gap-1.5 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60",
                    isActual
                      ? "bg-[#edfcf2] border-[#abefc6] text-[#087443]"
                      : "bg-[#eff8ff] border-[#b2ddff] text-[#175cd3]",
                    idx === cutoffIndex && "ring-2 ring-[#f59e0b] ring-offset-1",
                  )}
                >
                  <span className="text-[12px] font-bold">{monthLabel(item.period, true)}</span>
                  <span className={cn(
                    "text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5",
                    isActual ? "bg-[#079455]/10 text-[#079455]" : "bg-[#1570ef]/10 text-[#1570ef]",
                  )}>
                    {isActual ? <Lock className="w-2.5 h-2.5" /> : null}
                    {isActual ? "Actual" : "Fcst"}
                  </span>
                </button>
              )
            })}
            {!periods.length ? (
              <p className="col-span-full py-4 text-center text-[12px] text-[#98a2b3]">
                {loading ? "Loading forecast periods…" : "No forecast periods available"}
              </p>
            ) : null}
          </div>

          <div className="space-y-2 border-t border-[#f2f4f7] pt-4">
            <div className="flex items-center justify-between text-[12px] font-semibold text-[#344054]">
              <span>Actuals cut-off month</span>
              <span className="text-[#2563eb]">{monthLabel(cutoffPeriod)}</span>
            </div>
            {periods.length > 1 ? (
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={periods.length - 1}
                  value={Math.min(draftCutoffIndex, periods.length - 1)}
                  disabled={isBusy}
                  onChange={(event) => setDraftCutoffIndex(Number(event.target.value))}
                  className="w-full h-1.5 bg-[#eaecf0] rounded-lg appearance-none cursor-pointer accent-[#2563eb] disabled:cursor-not-allowed disabled:opacity-60"
                />
                <Button
                  variant="outline"
                  className="rounded-full h-8 px-4 text-xs shrink-0"
                  disabled={isBusy || draftCutoffIndex === cutoffIndex}
                  onClick={() => void updateCutoff(draftCutoffIndex)}
                >
                  {busyAction === "cutoff" ? <RefreshCw className="size-3 animate-spin" /> : null}
                  Save
                </Button>
              </div>
            ) : null}
            <p className="text-[11px] text-[#667085]">
              Closed periods become actuals from Data Hub; open periods recalculate using the selected forecast method.
            </p>
          </div>
        </section>

        <section className={`${R} border border-[#e4e7ec] bg-white p-4 w-full`}>
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <div>
              <h3 className="text-[14px] font-semibold text-[#101828]">Forecast Method</h3>
              <p className="text-[11px] text-[#667085]">
                {method
                  ? `${method.confidence ? `${method.confidence} confidence · ` : ""}${method.label}`
                  : activeMethod || "No active method reported"}
              </p>
            </div>
            <Link href={worksheetHref}>
              <Button variant="gradient-info" className="rounded-full h-9 px-4 text-xs shadow-sm" disabled={isBusy}>
                Open Worksheet
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap gap-2">
            {(summary?.methods || []).map((item) => (
              <button
                key={item.code}
                type="button"
                disabled={isBusy}
                onClick={() => void handleMethodChange(item.code)}
                className={cn(
                  "h-9 inline-flex items-center rounded-full border px-4 text-xs font-semibold transition-all shadow-sm gap-1 disabled:cursor-not-allowed disabled:opacity-60",
                  activeMethod.toLowerCase() === item.code.toLowerCase()
                    ? "border-[#2563eb] bg-[#eff8ff] text-[#175cd3]"
                    : "border-[#d0d5dd] bg-white text-[#344054] hover:bg-[#f9fafb]",
                  item.code.toLowerCase() === "ai" && "gap-1.5",
                )}
              >
                {item.code.toLowerCase() === "ai" ? <Sparkles className="w-3 h-3" /> : null}
                {item.label}
              </button>
            ))}
            {!summary?.methods?.length ? (
              <p className="text-[12px] text-[#98a2b3]">
                {loading ? "Loading forecast methods…" : "No forecast methods available"}
              </p>
            ) : null}
          </div>
        </section>

        <div className={`${R} border border-[#d1e9ff] bg-[#f5faff] p-4 flex items-start gap-3 w-full`}>
          <AlertCircle className="w-5 h-5 text-[#1570ef] shrink-0 mt-0.5" />
          <div className="text-[12.5px] leading-relaxed">
            <h4 className="font-semibold text-[#175cd3]">Data Hub & Actuals Cut-off Policy</h4>
            <p className="text-[#1e468f] mt-1">
              Historical actuals are locked and imported from Arcus Data Hub. Roll forward shifts the cut-off boundary — closed periods stay read-only; future periods recalculate from drivers and the active method.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
