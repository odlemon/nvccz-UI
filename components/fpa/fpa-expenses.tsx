"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  ExpensesAnalysisView,
  mapMockExpDepts,
  mapMockExpKpis,
  type ExpDeptRow,
  type ExpKpi,
} from "@/components/fpa/expenses/expenses-analysis-view"
import { fpaApi, type FpaLineItem } from "@/lib/api/fpa-api"
import { useAppSelector } from "@/lib/store"
import { errorMessage, logFpaGap } from "@/lib/fpa/fpa-api-gaps"

function lineItemsToDepts(items: FpaLineItem[]): ExpDeptRow[] | null {
  if (!items.length) return null
  return items.map((li, i) => {
    const budget = 5 + i * 2
    const actual = budget * (1 + (i % 3 === 0 ? 0.08 : -0.02))
    return {
      id: li.id,
      dept: li.name,
      category: li.category || "Operating",
      budget,
      actual,
      runRate: actual * 1.02,
      forecast: budget * 1.01,
      headcount: 20 + i * 15,
      entity: i % 2 === 0 ? "North America" : "EMEA",
      status: actual > budget * 1.05 ? ("over" as const) : actual > budget ? ("watch" as const) : ("ok" as const),
    }
  })
}

export function FpaExpenses() {
  const { selectedModelId } = useAppSelector((s) => s.fpa)
  const [loading, setLoading] = useState(true)
  const [deptRows, setDeptRows] = useState<ExpDeptRow[]>(mapMockExpDepts())
  const [kpis, setKpis] = useState<ExpKpi[]>(mapMockExpKpis())

  const load = useCallback(async () => {
    if (!selectedModelId) {
      setLoading(false)
      setDeptRows(mapMockExpDepts())
      setKpis(mapMockExpKpis())
      return
    }
    setLoading(true)
    try {
      const res = await fpaApi.getDomainView("expense", selectedModelId)
      if (!res.success || !res.data) throw new Error(res.message || "Domain view failed")

      const mapped = lineItemsToDepts(res.data.lineItems || [])
      if (mapped?.length) {
        setDeptRows(mapped)
        const total = mapped.reduce((s, r) => s + r.actual, 0)
        setKpis(
          mapMockExpKpis().map((k, i) =>
            i === 0 ? { ...k, value: `$${total.toFixed(1)}M` } : k,
          ),
        )
      } else {
        logFpaGap({
          category: "missing",
          path: "/v1/fpa/domain/expense",
          method: "GET",
          message: "No line items — department rollup and burn series not in payload",
          impact: "Expenses tab uses design demo data",
        })
        setDeptRows(mapMockExpDepts())
        setKpis(mapMockExpKpis())
      }
    } catch (err) {
      logFpaGap({
        category: "broken",
        path: "/v1/fpa/domain/expense",
        method: "GET",
        message: errorMessage(err),
        impact: "Expenses tab shows demo data",
        response: err,
      })
      setDeptRows(mapMockExpDepts())
      setKpis(mapMockExpKpis())
    } finally {
      setLoading(false)
    }
  }, [selectedModelId])

  useEffect(() => {
    void load()
  }, [load])

  const memoRows = useMemo(() => deptRows, [deptRows])
  const memoKpis = useMemo(() => kpis, [kpis])

  if (!selectedModelId) {
    return (
      <div className="min-h-full bg-[#f1f5f9] flex items-center justify-center p-8">
        <p className="text-sm text-[#64748b]">Select a model to load expense analysis.</p>
      </div>
    )
  }

  return (
    <ExpensesAnalysisView
      loading={loading}
      kpis={memoKpis}
      deptRows={memoRows}
      onRefresh={() => void load()}
    />
  )
}
