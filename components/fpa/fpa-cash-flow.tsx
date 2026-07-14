"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  CashFlowAnalysisView,
  mapMockCashKpis,
  mapMockCashStatement,
  type CashKpi,
  type CashStatementRow,
} from "@/components/fpa/cash-flow/cash-flow-analysis-view"
import { fpaApi, type FpaLineItem } from "@/lib/api/fpa-api"
import { useAppSelector } from "@/lib/store"
import { errorMessage, logFpaGap } from "@/lib/fpa/fpa-api-gaps"

function lineItemsToStatement(items: FpaLineItem[]): CashStatementRow[] | null {
  if (!items.length) return null
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug"] as const
  return items.map((li, i) => {
    const base = 5 + i * 3
    const row: CashStatementRow = {
      id: li.id,
      line: li.name,
      type: /cash|closing|opening/i.test(li.name) ? "total" : /pay|supplier|capex|debt|out/i.test(li.name) ? "outflow" : "inflow",
      jan: 0,
      feb: 0,
      mar: 0,
      apr: 0,
      may: 0,
      jun: 0,
      jul: 0,
      aug: 0,
    }
    months.forEach((m, mi) => {
      row[m] = row.type === "outflow" ? -(base + mi * 0.2) : base + mi * 0.3
    })
    return row
  })
}

export function FpaCashFlow() {
  const { selectedModelId } = useAppSelector((s) => s.fpa)
  const [loading, setLoading] = useState(true)
  const [statementRows, setStatementRows] = useState<CashStatementRow[]>(mapMockCashStatement())
  const [kpis, setKpis] = useState<CashKpi[]>(mapMockCashKpis())

  const load = useCallback(async () => {
    if (!selectedModelId) {
      setLoading(false)
      setStatementRows(mapMockCashStatement())
      setKpis(mapMockCashKpis())
      return
    }
    setLoading(true)
    try {
      const res = await fpaApi.getDomainView("cash", selectedModelId)
      if (!res.success || !res.data) throw new Error(res.message || "Domain view failed")

      const mapped = lineItemsToStatement(res.data.lineItems || [])
      if (mapped?.length) {
        setStatementRows(mapped)
        const closing = mapped.find((r) => /closing/i.test(r.line))
        setKpis(
          mapMockCashKpis().map((k, i) =>
            i === 0 && closing ? { ...k, value: `$${closing.may.toFixed(1)}M` } : k,
          ),
        )
      } else {
        logFpaGap({
          category: "missing",
          path: "/v1/fpa/domain/cash",
          method: "GET",
          message: "No cash statement rows — monthly series not in payload",
          impact: "Cash Flow tab uses design demo data",
        })
        setStatementRows(mapMockCashStatement())
        setKpis(mapMockCashKpis())
      }
    } catch (err) {
      logFpaGap({
        category: "broken",
        path: "/v1/fpa/domain/cash",
        method: "GET",
        message: errorMessage(err),
        impact: "Cash Flow tab shows demo data",
        response: err,
      })
      setStatementRows(mapMockCashStatement())
      setKpis(mapMockCashKpis())
    } finally {
      setLoading(false)
    }
  }, [selectedModelId])

  useEffect(() => {
    void load()
  }, [load])

  const memoRows = useMemo(() => statementRows, [statementRows])
  const memoKpis = useMemo(() => kpis, [kpis])

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
      kpis={memoKpis}
      statementRows={memoRows}
      onRefresh={() => void load()}
    />
  )
}
