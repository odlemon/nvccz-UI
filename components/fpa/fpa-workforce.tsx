"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  WorkforceAnalysisView,
  mapMockWfDepts,
  mapMockWfKpis,
  type WfDeptRow,
  type WfKpi,
} from "@/components/fpa/workforce/workforce-analysis-view"
import { fpaApi, type FpaLineItem } from "@/lib/api/fpa-api"
import { useAppSelector } from "@/lib/store"
import { errorMessage, logFpaGap } from "@/lib/fpa/fpa-api-gaps"

function domainToDepts(items: FpaLineItem[]): WfDeptRow[] | null {
  if (!items.length) return null
  return items.map((li, i) => {
    const hc = 30 + i * 25
    const budgetHc = hc - (i % 2 === 0 ? 3 : -2)
    return {
      id: li.id,
      dept: li.name,
      entity: i % 2 === 0 ? "North America" : "EMEA",
      hc,
      budgetHc,
      salary: 2 + i * 1.5,
      avgSalary: 65 + i * 5,
      hires: 2 + (i % 4),
      attrition: i % 3,
      openRoles: i % 3,
      status: hc > budgetHc ? ("over" as const) : hc < budgetHc ? ("under" as const) : ("on-track" as const),
    }
  })
}

export function FpaWorkforce() {
  const { selectedModelId } = useAppSelector((s) => s.fpa)
  const [loading, setLoading] = useState(true)
  const [deptRows, setDeptRows] = useState<WfDeptRow[]>(mapMockWfDepts())
  const [kpis, setKpis] = useState<WfKpi[]>(mapMockWfKpis())

  const load = useCallback(async () => {
    if (!selectedModelId) {
      setLoading(false)
      setDeptRows(mapMockWfDepts())
      setKpis(mapMockWfKpis())
      return
    }
    setLoading(true)
    try {
      const res = await fpaApi.getDomainView("workforce", selectedModelId)
      if (!res.success || !res.data) throw new Error(res.message || "Domain view failed")

      const mapped = domainToDepts(res.data.lineItems || [])
      if (mapped?.length) {
        setDeptRows(mapped)
        const totalHc = mapped.reduce((s, r) => s + r.hc, 0)
        const totalPay = mapped.reduce((s, r) => s + r.salary, 0)
        setKpis(
          mapMockWfKpis().map((k, i) => {
            if (i === 0) return { ...k, value: String(totalHc) }
            if (i === 1) return { ...k, value: `$${totalPay.toFixed(1)}M` }
            return k
          }),
        )
      } else {
        logFpaGap({
          category: "missing",
          path: "/v1/fpa/domain/workforce",
          method: "GET",
          message: "No hire plan or headcount rollup in payload",
          impact: "Workforce tab uses design demo data",
        })
        setDeptRows(mapMockWfDepts())
        setKpis(mapMockWfKpis())
      }
    } catch (err) {
      logFpaGap({
        category: "broken",
        path: "/v1/fpa/domain/workforce",
        method: "GET",
        message: errorMessage(err),
        impact: "Workforce tab shows demo data",
        response: err,
      })
      setDeptRows(mapMockWfDepts())
      setKpis(mapMockWfKpis())
    } finally {
      setLoading(false)
    }
  }, [selectedModelId])

  useEffect(() => {
    void load()
  }, [load])

  const memoRows = useMemo(() => deptRows, [deptRows])
  const memoKpis = useMemo(() => kpis, [kpis])

  return (
    <WorkforceAnalysisView
      loading={loading}
      kpis={memoKpis}
      deptRows={memoRows}
      onRefresh={() => void load()}
    />
  )
}
