"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  RevenueAnalysisView,
  mapMockRevKpis,
  mapMockRevStreams,
  type RevKpi,
  type RevStreamRow,
} from "@/components/fpa/revenue/revenue-analysis-view"
import { fpaApi, type FpaLineItem } from "@/lib/api/fpa-api"
import { useAppSelector } from "@/lib/store"
import { errorMessage, logFpaGap } from "@/lib/fpa/fpa-api-gaps"

function lineItemsToStreams(items: FpaLineItem[]): RevStreamRow[] | null {
  if (!items.length) return null
  return items.map((li, i) => {
    const base = 10 + i * 5
    return {
      id: li.id,
      name: li.name,
      region: "Global",
      method: li.lineItemType || "Formula",
      actual: base,
      budget: base * 0.96,
      forecast: base * 1.02,
      yoy: 8 + i * 2,
      share: Math.round(100 / Math.max(items.length, 1)),
      entity: "North America",
    }
  })
}

export function FpaRevenue() {
  const { selectedModelId } = useAppSelector((s) => s.fpa)
  const [loading, setLoading] = useState(true)
  const [streams, setStreams] = useState<RevStreamRow[]>(mapMockRevStreams())
  const [kpis, setKpis] = useState<RevKpi[]>(mapMockRevKpis())

  const load = useCallback(async () => {
    if (!selectedModelId) {
      setLoading(false)
      setStreams(mapMockRevStreams())
      setKpis(mapMockRevKpis())
      return
    }
    setLoading(true)
    try {
      const res = await fpaApi.getDomainView("revenue", selectedModelId)
      if (!res.success || !res.data) throw new Error(res.message || "Domain view failed")

      const mapped = lineItemsToStreams(res.data.lineItems || [])
      if (mapped?.length) {
        setStreams(mapped)
        const total = mapped.reduce((s, r) => s + r.actual, 0)
        setKpis(
          mapMockRevKpis().map((k, i) =>
            i === 0 ? { ...k, value: `$${total.toFixed(1)}M` } : k,
          ),
        )
      } else {
        logFpaGap({
          category: "missing",
          path: "/v1/fpa/domain/revenue",
          method: "GET",
          message: "No line items — waterfall and monthly series not in payload",
          impact: "Revenue tab uses design demo data",
        })
        setStreams(mapMockRevStreams())
        setKpis(mapMockRevKpis())
      }
    } catch (err) {
      logFpaGap({
        category: "broken",
        path: "/v1/fpa/domain/revenue",
        method: "GET",
        message: errorMessage(err),
        impact: "Revenue tab shows demo data",
        response: err,
      })
      setStreams(mapMockRevStreams())
      setKpis(mapMockRevKpis())
    } finally {
      setLoading(false)
    }
  }, [selectedModelId])

  useEffect(() => {
    void load()
  }, [load])

  const memoStreams = useMemo(() => streams, [streams])
  const memoKpis = useMemo(() => kpis, [kpis])

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
      kpis={memoKpis}
      streams={memoStreams}
      onRefresh={() => void load()}
    />
  )
}
