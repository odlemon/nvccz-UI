"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import {
  VarianceAnalysisView,
  type VarCommentaryReq,
  type VarDeptRow,
  type VarDetail,
  type VarKpi,
  type VarTrendPoint,
  type VarTornadoPoint,
} from "@/components/fpa/variance/variance-analysis-view"
import {
  asNumber,
  formatMoney,
  fpaApi,
  type FpaVarianceResult,
  type FpaVarianceSummary,
} from "@/lib/api/fpa-api"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { setSelectedVersionId } from "@/lib/store/slices/fpaSlice"
import { errorMessage, logFpaGap } from "@/lib/fpa/fpa-api-gaps"
import { useFpaPermissions } from "@/lib/hooks/useFpaPermissions"

function moneyInMillions(value: unknown): number {
  return asNumber(value) / 1_000_000
}

function formatVariance(value: unknown): string {
  const amount = asNumber(value)
  return amount < 0 ? `(${formatMoney(Math.abs(amount))})` : formatMoney(amount)
}

function mapKpis(summary: FpaVarianceSummary | null): VarKpi[] {
  if (!summary) return []
  const values = [
    ["Revenue Variance", summary.kpis.revenueVar],
    ["Opex Variance", summary.kpis.opexVar],
    ["EBITDA Variance", summary.kpis.ebitdaVar],
  ] as const
  return values
    .filter((entry): entry is readonly [string, number] => entry[1] != null)
    .map(([label, value]) => ({
      label,
      value: formatVariance(value),
      deltaTone: value >= 0 ? "up" : "down",
      showTrendIcon: true,
      trendArrow: value >= 0 ? "up" : "down",
    }))
}

function commentaryStatus(row: FpaVarianceResult): VarCommentaryReq["status"] {
  const status = (row.commentaryStatus || "").toLowerCase()
  if (status.includes("submit") || (!row.commentaryRequired && Boolean(row.commentary))) return "Submitted"
  if (status.includes("overdue")) return "Overdue"
  if (status.includes("progress")) return "In Progress"
  return "—"
}

function rowName(row: FpaVarianceResult): string {
  return row.lineItemName || row.lineItem?.name || row.lineItem?.code || "—"
}

function departmentName(row: FpaVarianceResult): string {
  return cleanLabel(row.departmentName) || "—"
}

function rowActual(row: FpaVarianceResult): number {
  return asNumber(row.actualValue ?? row.actual)
}

function rowPlan(row: FpaVarianceResult): number {
  return asNumber(row.planValue ?? row.plan)
}

function rowForecast(row: FpaVarianceResult): number | null {
  const value = row.forecastValue ?? row.forecast
  return value == null ? null : asNumber(value)
}

function rowVariance(row: FpaVarianceResult): number {
  return asNumber(row.varianceAmount ?? row.varianceAbs)
}

function rowVariancePct(row: FpaVarianceResult): number {
  return asNumber(row.variancePercent ?? row.variancePct)
}

function mapCommentary(results: FpaVarianceResult[]): VarCommentaryReq[] {
  return results
    .filter((row) => row.commentaryRequired || row.commentaryStatus || row.commentary)
    .map((row) => ({
      id: row.id,
      dept: departmentName(row),
      area: rowName(row),
      owner: row.comments?.at(-1)?.userName || "—",
      due: "—",
      variance: formatVariance(rowVariance(row)),
      status: commentaryStatus(row),
      period: row.period || row.periodDate || "",
    }))
}

function cleanLabel(value: unknown): string | null {
  if (typeof value !== "string") return null
  const label = value.trim()
  if (!label || label === "—") return null
  return label
}

function resultPeriod(row: FpaVarianceResult): string {
  return cleanLabel(row.period) || cleanLabel(row.periodDate) || ""
}

function detailFromResult(row: FpaVarianceResult, period?: string): VarDetail {
  const variance = rowVariance(row)
  const forecast = rowForecast(row)
  const latestComment = row.commentary || row.comments?.at(-1)?.commentary || row.comments?.at(-1)?.body
  return {
    id: row.id,
    dept: departmentName(row),
    area: rowName(row),
    period: row.period || row.periodDate || period || "—",
    headline: formatVariance(variance),
    headlineTone: variance >= 0 ? "up" : "down",
    pctLabel: `${rowVariancePct(row).toFixed(1)}% vs plan`,
    explanation: latestComment || "—",
    correctiveAction: row.comments?.at(-1)?.correctiveAction || "—",
    supporting: [
      { label: "Actual", value: formatMoney(rowActual(row)) },
      { label: "Plan", value: formatMoney(rowPlan(row)) },
      { label: "Forecast", value: forecast == null ? "Unavailable" : formatMoney(forecast) },
      { label: "Variance", value: formatVariance(variance) },
      { label: "Variance %", value: `${rowVariancePct(row).toFixed(1)}%` },
    ],
    owner: row.comments?.at(-1)?.userName || "—",
    due: "—",
    status: commentaryStatus(row),
  }
}

export function FpaVarianceAnalysis() {
  const dispatch = useAppDispatch()
  const searchParams = useSearchParams()
  const { selectedModelId, selectedVersionId, selectedScenarioId, models, versions } =
    useAppSelector((s) => s.fpa)
  const { canAddCommentary } = useFpaPermissions()
  const cycleId = searchParams.get("cycleId") || undefined
  const versionId =
    selectedVersionId ||
    models.find((model) => model.id === selectedModelId)?.defaultVersionId ||
    null

  const [results, setResults] = useState<FpaVarianceResult[]>([])
  const [summary, setSummary] = useState<FpaVarianceSummary | null>(null)
  const [resultsLoading, setResultsLoading] = useState(true)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedDetail, setSelectedDetail] = useState<VarDetail | null>(null)
  const [varianceIdForComment, setVarianceIdForComment] = useState<string | null>(null)
  const [resultsError, setResultsError] = useState<string | null>(null)
  const [summaryError, setSummaryError] = useState<string | null>(null)
  const [selectionError, setSelectionError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState("")
  const loadRequestRef = useRef(0)
  const contextRef = useRef("")

  const load = useCallback(async () => {
    const requestId = ++loadRequestRef.current
    const contextKey = `${selectedModelId || ""}|${versionId || ""}`
    if (contextRef.current !== contextKey) {
      contextRef.current = contextKey
      setResults([])
      setSummary(null)
      setSelectedDetail(null)
      setDetailOpen(false)
      setVarianceIdForComment(null)
      setResultsError(null)
      setSummaryError(null)
    }
    if (!selectedModelId || !versionId) {
      setResultsLoading(false)
      setSummaryLoading(false)
      setSelectionError("Select a model and version to view variance analysis.")
      return
    }
    setSelectionError(null)
    setResultsLoading(true)
    setSummaryLoading(true)
    const [resultsOutcome, summaryOutcome] = await Promise.allSettled([
        fpaApi.listVarianceResults({ modelId: selectedModelId, versionId, limit: 200 }),
        fpaApi.getVarianceSummary({ modelId: selectedModelId, versionId }),
    ])
    if (requestId !== loadRequestRef.current) return

    if (resultsOutcome.status === "fulfilled" && resultsOutcome.value.success) {
      const resultsRes = resultsOutcome.value
      setResults(resultsRes.data || [])
      setResultsError(null)
    } else {
      const reason =
        resultsOutcome.status === "rejected"
          ? resultsOutcome.reason
          : new Error(resultsOutcome.value.message || "Variance results failed")
      const message = errorMessage(reason)
      setResultsError(message)
      logFpaGap({
        category: "broken",
        path: "/v1/fpa/variance/results",
        method: "GET",
        message,
        impact: "Variance result rows and commentary cannot be loaded",
        response: reason,
      })
      toast.error(`Variance results: ${message}`)
    }

    if (summaryOutcome.status === "fulfilled" && summaryOutcome.value.success) {
      const summaryRes = summaryOutcome.value
      setSummary(summaryRes.data || null)
      setSummaryError(null)
    } else {
      const reason =
        summaryOutcome.status === "rejected"
          ? summaryOutcome.reason
          : new Error(summaryOutcome.value.message || "Variance summary failed")
      const message = errorMessage(reason)
      setSummaryError(message)
      logFpaGap({
        category: "broken",
        path: "/v1/fpa/variance/summary",
        method: "GET",
        message,
        impact: "Variance KPIs, department summary, trend, and breakdown cannot be loaded",
        response: reason,
      })
      toast.error(`Variance summary: ${message}`)
    }
    setResultsLoading(false)
    setSummaryLoading(false)
  }, [selectedModelId, versionId])

  useEffect(() => {
    void load()
  }, [load])

  const kpis = useMemo(() => mapKpis(summary), [summary])
  const deptRows = useMemo((): VarDeptRow[] => {
    if (!summary) return []
    return summary.departments.flatMap((row) => {
      const dept = cleanLabel(row.departmentName)
      if (!dept) return []
      return [
        {
          dept,
          actual: moneyInMillions(row.actual),
          budget: moneyInMillions(row.plan),
          forecast: row.forecast == null ? null : moneyInMillions(row.forecast),
          varB: moneyInMillions(row.varianceAbs),
          varBp: asNumber(row.variancePct),
          varF: row.forecast == null ? null : moneyInMillions(row.actual - row.forecast),
        },
      ]
    })
  }, [summary])
  const commentaryReqs = useMemo(() => mapCommentary(results), [results])
  const trend = useMemo(
    (): VarTrendPoint[] =>
      summary?.trend.map((point) => ({
        period: point.period,
        variance: moneyInMillions(point.variance),
      })) || [],
    [summary],
  )
  const breakdown = useMemo(
    (): VarTornadoPoint[] =>
      summary?.tornado.flatMap((point) => {
        const dept = cleanLabel(point.departmentName)
        if (!dept) return []
        return [
          {
            dept,
            value: moneyInMillions(point.varianceAbs),
          },
        ]
      }) || [],
    [summary],
  )
  const departmentOptions = useMemo(() => {
    const seen = new Set<string>()
    const options: string[] = []
    const add = (value: unknown) => {
      const label = cleanLabel(value)
      if (!label || /^(all departments|total company)$/i.test(label)) return
      const key = label.toLocaleLowerCase()
      if (seen.has(key)) return
      seen.add(key)
      options.push(label)
    }
    summary?.departments.forEach((row) => add(row.departmentName))
    results.forEach((row) => add(row.departmentName))
    summary?.tornado.forEach((row) => add(row.departmentName))
    return options
  }, [results, summary])
  const periodOptions = useMemo(() => {
    const seen = new Set<string>()
    const periods: string[] = []
    const add = (value: unknown) => {
      const period = cleanLabel(value)
      if (!period || seen.has(period)) return
      seen.add(period)
      periods.push(period)
    }
    results.forEach((row) => add(resultPeriod(row)))
    summary?.trend.forEach((point) => add(point.period))
    return periods
  }, [results, summary])

  useEffect(() => {
    if (!periodOptions.length) {
      setSelectedPeriod("")
      return
    }
    if (!periodOptions.includes(selectedPeriod)) {
      setSelectedPeriod(periodOptions.at(-1) || "")
    }
  }, [periodOptions, selectedPeriod])

  const saveCommentary = async (body: string) => {
    if (!body.trim()) return
    if (!varianceIdForComment) {
      toast.error("Commentary is unavailable because this row has no variance result ID.")
      return
    }
    setBusy(true)
    try {
      const res = await fpaApi.addVarianceCommentary(varianceIdForComment, {
        commentary: body.trim(),
        body: body.trim(),
      })
      if (!res.success) throw new Error(res.message || "Commentary failed")
      toast.success("Commentary saved")
      await load()
    } catch (err) {
      logFpaGap({
        category: "broken",
        path: `/v1/fpa/variance/${varianceIdForComment}/commentary`,
        method: "POST",
        message: errorMessage(err),
        impact: "Cannot add variance commentary",
        response: err,
      })
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const onSelectDept = (dept: string, period: string) => {
    const departmentRows = results.filter((item) => departmentName(item) === dept)
    const row =
      departmentRows.find((item) => Boolean(period) && resultPeriod(item) === period) ||
      departmentRows[0]
    if (!row) {
      setSelectedDetail(null)
      setDetailOpen(false)
      setVarianceIdForComment(null)
      toast.message("Variance detail is unavailable for this department.")
      return
    }
    setSelectedDetail(detailFromResult(row, period))
    setDetailOpen(true)
    setVarianceIdForComment(row.id)
  }

  const onSelectCommentary = (req: VarCommentaryReq, period: string) => {
    const row = results.find((item) => item.id === req.id)
    if (!row) {
      toast.error("Variance detail is unavailable.")
      return
    }
    setSelectedDetail(detailFromResult(row, period))
    setDetailOpen(true)
    setVarianceIdForComment(row.id)
  }

  const recalculate = async () => {
    if (!selectedModelId || !versionId) {
      toast.error("Select a model and version before recalculating variance.")
      return
    }
    setBusy(true)
    try {
      const res = await fpaApi.calculateVariance({
        modelId: selectedModelId,
        versionId,
        scenarioId: selectedScenarioId || undefined,
        cycleId,
      })
      if (!res.success) throw new Error(res.message || "Variance recalculation failed")
      toast.success("Variance recalculated")
      await load()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <VarianceAnalysisView
      loading={(resultsLoading || summaryLoading) && !!selectedModelId}
      busy={busy}
      selectionError={selectionError}
      resultsError={resultsError}
      summaryError={summaryError}
      kpis={kpis}
      deptRows={deptRows}
      commentaryReqs={commentaryReqs}
      trend={trend}
      breakdown={breakdown}
      selectedDetail={selectedDetail}
      detailOpen={detailOpen}
      periodLabel={selectedPeriod || "No periods"}
      periodOptions={periodOptions}
      onPeriodChange={setSelectedPeriod}
      versionLabel={versions.find((item) => item.id === versionId)?.name || "—"}
      selectedVersionId={versionId || ""}
      versionOptions={versions
        .filter((item) => !item.modelId || item.modelId === selectedModelId)
        .map((item) => ({ value: item.id, label: item.name }))}
      onVersionChange={(id) => dispatch(setSelectedVersionId(id))}
      departmentOptions={departmentOptions}
      canAddCommentary={canAddCommentary}
      canRecalculate={Boolean(selectedModelId && versionId)}
      onSelectDept={onSelectDept}
      onSelectCommentary={onSelectCommentary}
      onCloseDetail={() => setDetailOpen(false)}
      onSaveComment={(body) => void saveCommentary(body)}
      onRefresh={() => void load()}
      onRecalculate={() => void recalculate()}
    />
  )
}
