"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import {
  VarianceAnalysisView,
  detailForCommentary,
  detailForDept,
  mapMockCommentary,
  mapMockDeptRows,
  mapMockKpis,
  type VarCommentaryReq,
  type VarDetail,
  type VarKpi,
} from "@/components/fpa/variance/variance-analysis-view"
import {
  asNumber,
  formatMoney,
  fpaApi,
  type FpaVarianceResult,
} from "@/lib/api/fpa-api"
import { useAppSelector } from "@/lib/store"
import { errorMessage, logFpaGap } from "@/lib/fpa/fpa-api-gaps"
import { useFpaPermissions } from "@/lib/hooks/useFpaPermissions"
import { mockVarKpis, mockVarTornado, mockVarTrend } from "@/components/fpa/mock-data"

function useDemoKpis(): VarKpi[] {
  return useMemo(() => mapMockKpis(), [])
}

function buildKpisFromResults(results: FpaVarianceResult[]): VarKpi[] | null {
  if (!results.length) return null
  const revenue = results.filter((r) => /revenue/i.test(r.lineItem?.name || r.lineItem?.code || ""))
  const opex = results.filter((r) => /opex|expense/i.test(r.lineItem?.name || r.lineItem?.code || ""))
  const ebitda = results.filter((r) => /ebitda/i.test(r.lineItem?.name || r.lineItem?.code || ""))

  const sumActual = (rows: FpaVarianceResult[]) =>
    rows.reduce((s, r) => s + asNumber(r.actualValue), 0)
  const sumPlan = (rows: FpaVarianceResult[]) =>
    rows.reduce((s, r) => s + asNumber(r.planValue), 0)
  const sumVar = (rows: FpaVarianceResult[]) =>
    rows.reduce((s, r) => s + asNumber(r.varianceAmount), 0)

  const revActual = sumActual(revenue.length ? revenue : results.slice(0, 5))
  const revPlan = sumPlan(revenue.length ? revenue : results.slice(0, 5))
  const revVar = sumVar(revenue.length ? revenue : results.slice(0, 5))
  const opexVar = sumVar(opex)
  const ebitdaVar = sumVar(ebitda)

  const pct = (v: number, base: number) => (base ? (v / base) * 100 : 0)

  const pctLabel = (v: number, base: number) => {
    const p = pct(v, base)
    const arrow = p >= 0 ? "▲" : "▼"
    return `${arrow} ${Math.abs(p).toFixed(1)}% vs Budget`
  }

  const demo = mapMockKpis()

  return [
    {
      ...demo[0],
      value: formatMoney(revActual) || demo[0].value,
    },
    {
      ...demo[1],
      value: formatMoney(revPlan) || demo[1].value,
    },
    {
      ...demo[2],
      value: formatMoney(revVar) || demo[2].value,
      delta: pctLabel(revVar, revPlan),
      trendArrow: revVar >= 0 ? ("up" as const) : ("down" as const),
    },
    {
      ...demo[3],
      value: formatMoney(opexVar) || demo[3].value,
    },
    {
      ...demo[4],
      value: formatMoney(ebitdaVar) || demo[4].value,
    },
  ]
}

export function FpaVarianceAnalysis() {
  const { selectedModelId } = useAppSelector((s) => s.fpa)
  const { canAddCommentary } = useFpaPermissions()
  const demoKpis = useDemoKpis()

  const [results, setResults] = useState<FpaVarianceResult[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [detailOpen, setDetailOpen] = useState(true)
  const [selectedDetail, setSelectedDetail] = useState<VarDetail | null>(
    detailForDept("Product Development") ?? null,
  )
  const [varianceIdForComment, setVarianceIdForComment] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!selectedModelId) {
      setLoading(false)
      setResults([])
      return
    }
    setLoading(true)
    try {
      const res = await fpaApi.listVarianceResults({ modelId: selectedModelId, limit: 200 })
      if (!res.success) throw new Error(res.message || "Variance list failed")
      setResults(res.data || [])
    } catch (err) {
      logFpaGap({
        category: "broken",
        path: "/v1/fpa/variance/results",
        method: "GET",
        message: errorMessage(err),
        impact: "Variance table empty — showing design demo data",
        response: err,
      })
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [selectedModelId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    logFpaGap({
      category: "missing",
      path: "/v1/fpa/variance/results",
      method: "GET",
      message: "No department aggregation, forecast column, KPI summary, or trend series in variance payloads",
      impact: "Department table and charts use mock-data fallbacks",
    })
  }, [])

  const kpis = useMemo(() => {
    const live = buildKpisFromResults(results)
    return live?.length ? live : demoKpis
  }, [results, demoKpis])

  const commentaryReqs = useMemo((): VarCommentaryReq[] => mapMockCommentary(), [])

  const saveCommentary = async (body: string) => {
    if (!varianceIdForComment || !body.trim()) {
      toast.message("Commentary saved locally (demo detail)")
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
    const detail = detailForDept(dept, period)
    if (detail) {
      setSelectedDetail(detail)
      setDetailOpen(true)
      setVarianceIdForComment(null)
    }
  }

  const onSelectCommentary = (req: VarCommentaryReq, period: string) => {
    setSelectedDetail(detailForCommentary(req, period))
    setDetailOpen(true)
    setVarianceIdForComment(req.id.startsWith("cr-") ? null : req.id)
  }

  return (
    <VarianceAnalysisView
      loading={loading && !!selectedModelId}
      busy={busy}
      kpis={kpis}
      deptRows={mapMockDeptRows()}
      commentaryReqs={commentaryReqs}
      trend={mockVarTrend}
      breakdown={mockVarTornado}
      selectedDetail={selectedDetail}
      detailOpen={detailOpen}
      canAddCommentary={canAddCommentary}
      onSelectDept={onSelectDept}
      onSelectCommentary={onSelectCommentary}
      onCloseDetail={() => setDetailOpen(false)}
      onSaveComment={(body) => void saveCommentary(body)}
      onRefresh={() => void load()}
    />
  )
}
