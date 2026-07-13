"use client"

import { useEffect } from "react"
import Link from "next/link"
import { FpaPageHeader } from "./fpa-page-header"
import { formatMoney } from "@/lib/api/fpa-api"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchFpaDashboard } from "@/lib/store/slices/fpaSlice"
import { logFpaGap } from "@/lib/fpa/fpa-api-gaps"
import { cn } from "@/lib/utils"

export function FpaRollingForecast() {
  const dispatch = useAppDispatch()
  const { selectedModelId, selectedVersionId, dashboard, loadingDashboard, models } = useAppSelector(
    (s) => s.fpa,
  )
  const model = models.find((m) => m.id === selectedModelId)

  useEffect(() => {
    if (selectedModelId) {
      void dispatch(
        fetchFpaDashboard({
          modelId: selectedModelId,
          versionId: selectedVersionId || undefined,
        }),
      )
    }
  }, [dispatch, selectedModelId, selectedVersionId])

  useEffect(() => {
    logFpaGap({
      category: "missing",
      path: "/v1/fpa/home/dashboard",
      method: "GET",
      message: "No rolling-horizon month flags (actual vs forecast) — Forecast page uses KPI strip only",
      impact: "Horizon month chips empty / derived from model start/end only if present",
    })
  }, [])

  const kpis = [
    { label: "Revenue", value: formatMoney(dashboard?.kpis?.revenue) },
    { label: "EBITDA", value: formatMoney(dashboard?.kpis?.ebitda) },
    { label: "Closing cash", value: formatMoney(dashboard?.kpis?.closingCash) },
    {
      label: "Runway",
      value: dashboard?.kpis?.runwayMonths != null ? `${dashboard.kpis.runwayMonths} mo` : "—",
    },
  ]

  const worksheetHref = selectedModelId
    ? `/forecasting/models/${selectedModelId}/worksheet`
    : "/forecasting/models"

  return (
    <div className="min-h-full bg-[#f8fafc]">
      <FpaPageHeader title="Forecasts" />

      <div className="p-4 sm:p-5 space-y-4">
        <section className="rounded-md border border-[#e2e8f0] bg-white p-5">
          <h2 className="text-sm font-semibold text-[#0f172a] mb-1">Rolling horizon</h2>
          <p className="text-xs text-[#64748b] mb-4">
            Model window: {model?.startPeriod?.slice(0, 10) || "—"} → {model?.endPeriod?.slice(0, 10) || "—"} (
            {model?.timeGranularity || "period"})
          </p>
          <p className="text-xs text-[#94a3b8]">
            Per-month actual/forecast flags are not returned by the API. Edit cells in the worksheet.
          </p>
        </section>

        <div className="flex flex-wrap gap-2">
          {["Run-rate", "Driver-based", "Pipeline-weighted", "Manual"].map((m, i) => (
            <span
              key={m}
              className={cn(
                "h-8 inline-flex items-center rounded-full border px-3 text-xs font-medium",
                i === 1
                  ? "border-[#2563eb] bg-[#eff6ff] text-[#2563eb]"
                  : "border-[#e2e8f0] bg-white text-[#475569]",
              )}
            >
              {m}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
          {loadingDashboard ? (
            <p className="text-sm text-[#94a3b8] col-span-4">Loading KPIs…</p>
          ) : (
            kpis.map((k) => (
              <div key={k.label} className="rounded-md border border-[#e2e8f0] bg-white p-4">
                <p className="text-xs text-[#64748b]">{k.label}</p>
                <p className="text-lg font-semibold text-[#0f172a] mt-1 tabular-nums">{k.value}</p>
              </div>
            ))
          )}
          <div className="rounded-md border border-[#e2e8f0] bg-white p-4 flex flex-col justify-center">
            <Link
              href={worksheetHref}
              className="h-10 inline-flex items-center justify-center rounded-full bg-[#2563eb] px-4 text-xs font-medium text-white hover:bg-[#1d4ed8]"
            >
              Open worksheet
            </Link>
            <p className="text-[10px] text-[#94a3b8] mt-2 text-center truncate">
              {model?.name || "Select model"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
