"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import {
  Check,
  ChevronDown,
  Download,
  Info,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  SlidersHorizontal,
  X,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { cn } from "@/lib/utils"
import { KpiSparkline } from "@/components/fpa/kpi-sparkline"
import { Button } from "@/components/ui/button"
import type { FpaDomainScope, FpaDriver } from "@/lib/api/fpa-api"

const R = "rounded-lg"

export type RevStreamRow = {
  id: string
  name: string
  region: string | null
  method: string | null
  actual: number | null
  budget: number | null
  forecast: number | null
  yoy: number | null
  share: number | null
}

export type RevKpi = {
  label: string
  value: string
  delta?: string
  up?: boolean
  spark?: number[]
}

export type RevWaterfallPoint = { key: string; label: string; value?: number; delta?: number }
export type RevMonthlyPoint = { period: string; actual?: number; budget?: number; forecast?: number }

export type RevDetail = {
  id: string
  name: string
  region: string | null
  method: string | null
  period: string
  actual: string
  budget: string
  forecast: string
  variance: string
  yoy: string
  drivers: Array<{ label: string; value: string }>
}

function fmtM(n: number | null): string {
  return n == null ? "—" : `$${n.toFixed(1)}M`
}

function varTone(n: number): string {
  if (n === 0) return "text-[#101828]"
  return n > 0 ? "text-[#12b76a]" : "text-[#f04438]"
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
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
        onClick={() => setOpen((o) => !o)}
        className="h-10 min-w-[118px] inline-flex items-center rounded-full border border-[#d0d5dd] bg-white pl-2.5 pr-7 text-left hover:bg-[#f9fafb]"
      >
        <span className="flex flex-col justify-center min-w-0 py-1">
          <span className="text-[9px] font-medium uppercase tracking-wide text-[#98a2b3] leading-none">
            {label}
          </span>
          <span className="text-[12px] font-semibold text-[#101828] leading-tight mt-0.5 truncate">
            {value}
          </span>
        </span>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-4 text-[#98a2b3]" />
      </button>
      {open ? (
        <div
          className={`absolute left-0 top-[calc(100%+4px)] z-40 min-w-[180px] ${R} border border-[#e4e7ec] bg-white py-1 shadow-lg`}
        >
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt)
                setOpen(false)
              }}
              className={cn(
                "w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-[12px] hover:bg-[#f9fafb]",
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


function RevKpiCard({ kpi, onClick }: { kpi: RevKpi; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${R} border border-[#e4e7ec] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(16,24,40,0.03)] flex items-center justify-between gap-3 min-h-[92px] w-full text-left hover:border-[#b2ddff] transition-colors`}
    >
      <div className="min-w-0 flex flex-col justify-center">
        <p className="text-[13px] font-semibold text-[#344054] leading-tight">{kpi.label}</p>
        <p className="mt-1.5 text-[26px] font-semibold text-[#101828] tabular-nums leading-none tracking-tight">
          {kpi.value}
        </p>
        {kpi.delta ? (
          <p className={cn("mt-1.5 text-[12px] font-medium", kpi.up ? "text-[#12b76a]" : "text-[#f04438]")}>
            {kpi.delta}
          </p>
        ) : null}
      </div>
      {kpi.spark ? <KpiSparkline values={kpi.spark} /> : null}
    </button>
  )
}

function buildWaterfallData(items: RevWaterfallPoint[]) {
  let running = 0
  return items.map((item) => {
    const amount = item.value ?? item.delta ?? 0
    if (item.value != null) {
      const start = 0
      running = amount
      return { ...item, name: item.label, start, end: amount, fill: "#2563eb" }
    }
    const start = running
    running += amount
    return {
      ...item,
      name: item.label,
      start: Math.min(start, running),
      end: Math.max(start, running),
      fill: amount >= 0 ? "#12b76a" : "#f04438",
    }
  })
}

export function detailForStream(row: RevStreamRow, period: string): RevDetail {
  const varB = row.actual == null || row.budget == null ? null : row.actual - row.budget
  return {
    id: row.id,
    name: row.name,
    region: row.region,
    method: row.method,
    period,
    actual: fmtM(row.actual),
    budget: fmtM(row.budget),
    forecast: fmtM(row.forecast),
    variance: varB == null ? "—" : `${varB >= 0 ? "+" : ""}${fmtM(varB)}`,
    yoy: row.yoy == null ? "—" : `${row.yoy >= 0 ? "+" : ""}${row.yoy.toFixed(1)}%`,
    drivers: [],
  }
}

type RevenueAnalysisViewProps = {
  loading?: boolean
  error?: string
  kpis?: RevKpi[]
  streams?: RevStreamRow[]
  waterfall?: RevWaterfallPoint[]
  monthly?: RevMonthlyPoint[]
  periodLabel?: string
  onRefresh?: () => void
  entities?: Array<{ id: string; name: string }>
  availablePeriods?: string[]
  selectedEntityId?: string
  periodFrom?: string
  periodTo?: string
  appliedScope?: FpaDomainScope
  onEntityChange?: (value: string) => void
  onPeriodFromChange?: (value: string) => void
  onPeriodToChange?: (value: string) => void
  drivers?: FpaDriver[]
  preview?: { kpis: RevKpi[]; streams: RevStreamRow[]; waterfall: RevWaterfallPoint[]; monthly: RevMonthlyPoint[] }
  previewLoading?: boolean
  previewError?: string
  onPreview?: (driverCode: string, value: number) => void
  onResetPreview?: () => void
}

export function RevenueAnalysisView({
  loading = false,
  error,
  kpis = [],
  streams = [],
  waterfall = [],
  monthly = [],
  periodLabel = "May 2025",
  onRefresh,
  entities = [], availablePeriods = [], selectedEntityId = "", periodFrom = "", periodTo = "",
  appliedScope, onEntityChange, onPeriodFromChange, onPeriodToChange,
  drivers = [], preview, previewLoading = false, previewError, onPreview, onResetPreview,
}: RevenueAnalysisViewProps) {
  const displayedKpis = preview?.kpis ?? kpis
  const displayedStreams = preview?.streams ?? streams
  const displayedWaterfall = preview?.waterfall ?? waterfall
  const displayedMonthly = preview?.monthly ?? monthly
  const [streamFilter, setStreamFilter] = useState("All Streams")
  const [view, setView] = useState("Stream View")
  const [growthRate, setGrowthRate] = useState(4.5)
  const [driverCode, setDriverCode] = useState("")
  const [detailOpen, setDetailOpen] = useState(true)
  const [selectedDetail, setSelectedDetail] = useState<RevDetail | null>(
    displayedStreams[0] ? detailForStream(displayedStreams[0], periodLabel) : null,
  )
  const [infoOpen, setInfoOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const streamOptions = useMemo(() => ["All Streams", ...new Set(displayedStreams.map((row) => row.name).filter(Boolean))], [displayedStreams])
  const period = periodTo || periodFrom || periodLabel
  const selectedEntityName = entities.find((option) => option.id === selectedEntityId)?.name ?? "All Entities"
  const driverOptions = useMemo(() => drivers.map((driver) => `${driver.name} · ${driver.code}`), [drivers])

  useEffect(() => {
    setSelectedDetail((current) => {
      const row = current ? displayedStreams.find((candidate) => candidate.id === current.id) : displayedStreams[0]
      return row ? detailForStream(row, period) : null
    })
  }, [displayedStreams, period])

  useEffect(() => {
    if (driverCode && !drivers.some((driver) => driver.code === driverCode)) setDriverCode("")
    if (!driverCode) {
      const relevant = drivers.find((driver) => {
        const value = `${driver.code} ${driver.name}`.toLowerCase()
        return value.includes("revenue") && value.includes("growth")
      })
      if (relevant) {
        setDriverCode(relevant.code)
        const value = Number(relevant.value)
        if (Number.isFinite(value)) setGrowthRate(value)
      }
    }
  }, [drivers, driverCode])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [])

  const filteredStreams = useMemo(() => {
    let rows = displayedStreams
    if (streamFilter !== "All Streams") {
      rows = rows.filter((r) => r.name === streamFilter)
    }
    return rows
  }, [displayedStreams, streamFilter])

  const regionRows = useMemo(() => {
    const grouped = new Map<string, RevStreamRow>()
    for (const row of filteredStreams) {
      const key = row.region
      if (!key) continue
      const current = grouped.get(key)
      if (current) {
        current.actual = current.actual == null || row.actual == null ? null : current.actual + row.actual
        current.budget = current.budget == null || row.budget == null ? null : current.budget + row.budget
        current.forecast = current.forecast == null || row.forecast == null ? null : current.forecast + row.forecast
        current.share = current.share == null || row.share == null ? null : current.share + row.share
      } else grouped.set(key, { ...row, id: key, name: key, method: null })
    }
    return [...grouped.values()]
  }, [filteredStreams])

  const tableRows = view === "Region View" ? regionRows : filteredStreams

  const waterfallData = useMemo(() => buildWaterfallData(displayedWaterfall), [displayedWaterfall])
  const adjustedKpis = displayedKpis

  const resetFilters = () => {
    setStreamFilter("All Streams")
    onEntityChange?.("")
    onPeriodFromChange?.("")
    onPeriodToChange?.("")
    setView("Stream View")
    setGrowthRate(4.5)
    onResetPreview?.()
    toast.message("Filters reset")
  }

  const pickStream = (row: RevStreamRow) => {
    setSelectedDetail(detailForStream(row, period))
    setDetailOpen(true)
  }

  const exportCsv = () => {
    const header = "Stream,Actual,Budget,Forecast,YoY%,Share\n"
    const body = tableRows
      .map((r) => `${r.name},${r.actual},${r.budget},${r.forecast},${r.yoy},${r.share}`)
      .join("\n")
    const blob = new Blob([header + body], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `revenue-${period.replace(/\s/g, "-")}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Revenue export downloaded")
  }

  const hasData = adjustedKpis.length > 0 || displayedStreams.length > 0 || displayedWaterfall.length > 0 || displayedMonthly.length > 0
  if (loading && !hasData) return <div className="min-h-full bg-[#f1f5f9] flex items-center justify-center gap-2 text-sm text-[#64748b]"><Loader2 className="size-5 animate-spin" /> Loading revenue analysis…</div>
  if (error && !hasData) return <div className="min-h-full bg-[#f1f5f9] flex items-center justify-center p-8 text-sm text-[#b42318]">{error}</div>

  return (
    <div className="min-h-full bg-[#f1f5f9] flex flex-col">
      <div className="bg-white border-b border-[#e4e7ec]">
        <div className="px-4 sm:px-5 pt-4 pb-3">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-[18px] font-semibold text-[#101828]">Revenue</h1>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="rounded-full h-9 px-4 text-xs"
                onClick={() => onRefresh?.()}
              >
                <RefreshCw className="size-3.5" />
                Refresh
              </Button>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-end gap-2">
            {entities.length > 0 ? <FilterSelect label="Entity" value={selectedEntityName} options={["All Entities", ...entities.map((option) => option.name)]} onChange={(name) => onEntityChange?.(entities.find((option) => option.name === name)?.id ?? "")} /> : null}
            {availablePeriods.length > 0 ? <>
              <FilterSelect label="Period from" value={periodFrom || "All Periods"} options={["All Periods", ...availablePeriods]} onChange={(value) => onPeriodFromChange?.(value === "All Periods" ? "" : value)} />
              <FilterSelect label="Period to" value={periodTo || "All Periods"} options={["All Periods", ...availablePeriods]} onChange={(value) => onPeriodToChange?.(value === "All Periods" ? "" : value)} />
            </> : null}
            <FilterSelect
              label="Stream"
              value={streamFilter}
              options={streamOptions}
              onChange={setStreamFilter}
            />
            <FilterSelect
              label="View"
              value={view}
              options={["Stream View", "Region View"]}
              onChange={setView}
            />
            <button
              type="button"
              onClick={resetFilters}
              className="ml-auto mb-0.5 px-1 text-[12px] font-semibold text-[#1570ef] hover:underline"
            >
              Reset Filters
            </button>
          </div>
          <p className="mt-2 text-[11px] text-[#667085]">Applied scope: {appliedScope?.entityId ? selectedEntityName : "All entities"} · {appliedScope?.periodFrom || "First period"} → {appliedScope?.periodTo || "Latest period"}</p>
        </div>

        <div className="px-4 sm:px-5 pb-4">
          {adjustedKpis.length === 0 ? (
            <p className="py-8 text-sm text-[#64748b]">No revenue KPIs are available.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
              {adjustedKpis.map((k) => (
                <RevKpiCard
                  key={k.label}
                  kpi={k}
                  onClick={() => toast.message(k.label, { description: `${k.value} · ${period}` })}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 p-4 sm:p-5 space-y-4 overflow-auto">
          {preview ? <div className="rounded-lg border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3 text-xs font-semibold text-[#1d4ed8]">Preview · not persisted — cards, charts, and tables below use the preview dataset.</div> : null}
          {loading && hasData ? <p className="text-xs text-[#667085]"><Loader2 className="mr-1 inline size-3 animate-spin" />Refreshing current scope…</p> : null}
          {error && hasData ? <p className="text-sm text-[#b42318]">{error}</p> : null}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <section className={`${R} border border-[#e4e7ec] bg-white p-4`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-[#101828]">Revenue Waterfall</h2>
                  <button type="button" onClick={() => setInfoOpen(true)} className="text-[#98a2b3] hover:text-[#667085]">
                    <Info className="size-4" />
                  </button>
                </div>
                <span className="text-xs text-[#667085]">{period} · Budget → Forecast</span>
              </div>
              {waterfallData.length === 0 ? (
                <p className="py-12 text-center text-sm text-[#64748b]">No revenue waterfall data is available.</p>
              ) : <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={waterfallData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f2f4f7" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#667085" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#667085" }} axisLine={false} tickLine={false} unit="M" />
                    <Tooltip
                      formatter={(v: number) => [`$${v.toFixed(1)}M`, ""]}
                      contentStyle={{ borderRadius: 8, border: "1px solid #e4e7ec", fontSize: 12 }}
                    />
                    <Bar dataKey="end" radius={[4, 4, 0, 0]}>
                      {waterfallData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>}
            </section>

            <section className={`${R} border border-[#e4e7ec] bg-white p-4`}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-[#101828]">Monthly Trend</h2>
                <span className="text-xs text-[#667085]">Actual vs Budget vs Forecast</span>
              </div>
              {displayedMonthly.length === 0 ? (
                <p className="py-12 text-center text-sm text-[#64748b]">No monthly revenue data is available.</p>
              ) : <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={displayedMonthly} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f2f4f7" />
                    <XAxis dataKey="period" tick={{ fontSize: 10, fill: "#667085" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#667085" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e4e7ec", fontSize: 12 }} />
                    <Bar dataKey="budget" fill="#dbeafe" radius={[3, 3, 0, 0]} name="Budget" />
                    <Line type="monotone" dataKey="actual" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} name="Actual" />
                    <Line type="monotone" dataKey="forecast" stroke="#12b76a" strokeWidth={2} strokeDasharray="4 4" dot={false} name="Forecast" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>}
            </section>
          </div>

          <section className={`${R} border border-[#e4e7ec] bg-white overflow-hidden`}>
            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-[#101828]">
                  {view === "Region View" ? "Revenue by Region" : "Revenue Streams"}
                </h2>
                <button type="button" onClick={() => setInfoOpen(true)} className="text-[#98a2b3] hover:text-[#667085]">
                  <Info className="size-4" />
                </button>
              </div>
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  className="size-8 inline-flex items-center justify-center rounded-full hover:bg-[#f2f4f7] text-[#667085]"
                >
                  <MoreHorizontal className="size-4" />
                </button>
                {menuOpen ? (
                  <div className={`absolute right-0 top-full mt-1 z-30 ${R} border border-[#e4e7ec] bg-white py-1 shadow-lg min-w-[140px]`}>
                    <button type="button" onClick={exportCsv} className="w-full px-3 py-2 text-left text-xs hover:bg-[#f9fafb] flex items-center gap-2">
                      <Download className="size-3.5" /> Export CSV
                    </button>
                    <button type="button" onClick={() => onRefresh?.()} className="w-full px-3 py-2 text-left text-xs hover:bg-[#f9fafb] flex items-center gap-2">
                      <RefreshCw className="size-3.5" /> Refresh
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="border-y border-[#e4e7ec] text-left text-xs text-[#667085] bg-[#f9fafb]">
                    <th className="px-4 py-3 font-medium">{view === "Region View" ? "Region" : "Stream"}</th>
                    <th className="px-4 py-3 font-medium">Method</th>
                    <th className="px-4 py-3 font-medium text-right">Actual</th>
                    <th className="px-4 py-3 font-medium text-right">Budget</th>
                    <th className="px-4 py-3 font-medium text-right">Forecast</th>
                    <th className="px-4 py-3 font-medium text-right">Var $</th>
                    <th className="px-4 py-3 font-medium text-right">YoY %</th>
                    <th className="px-4 py-3 font-medium text-right">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-[#64748b]">No revenue stream data is available.</td></tr>
                  ) : null}
                  {tableRows.map((row) => {
                    const varB = row.actual == null || row.budget == null ? null : row.actual - row.budget
                    return (
                      <tr
                        key={row.id}
                        className="border-t border-[#f2f4f7] hover:bg-[#f9fafb] cursor-pointer"
                        onClick={() => pickStream(row)}
                      >
                        <td className="px-4 py-3">
                          <button type="button" className="font-medium text-[#1570ef] hover:underline text-left">
                            {row.name}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-[#667085]">{row.method ?? "—"}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium">{fmtM(row.actual)}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-[#667085]">{fmtM(row.budget)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{fmtM(row.forecast)}</td>
                        <td className={cn("px-4 py-3 text-right tabular-nums font-medium", varB == null ? "text-[#667085]" : varTone(varB))}>
                          {varB == null ? "—" : `${varB >= 0 ? "+" : ""}${fmtM(varB)}`}
                        </td>
                        <td className={cn("px-4 py-3 text-right tabular-nums", row.yoy == null ? "text-[#667085]" : varTone(row.yoy))}>
                          {row.yoy == null ? "—" : `${row.yoy >= 0 ? "+" : ""}${row.yoy.toFixed(1)}%`}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-[#667085]">{row.share == null ? "—" : `${row.share}%`}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className={`${R} border border-[#e4e7ec] bg-white p-4`}>
            <div className="flex items-center gap-2 mb-4">
              <SlidersHorizontal className="size-4 text-[#2563eb]" />
              <h2 className="text-sm font-semibold text-[#101828]">What-if: Revenue Growth Rate</h2>
              <span className="text-xs text-[#667085] ml-auto tabular-nums">{growthRate.toFixed(1)}%</span>
            </div>
            {drivers.length === 0 ? <p className="text-sm text-[#667085]">No revenue driver was returned, so this control is unavailable.</p> : <>
              <div className="flex flex-wrap items-end gap-2">
                <FilterSelect label="Driver" value={drivers.find((driver) => driver.code === driverCode) ? `${drivers.find((driver) => driver.code === driverCode)?.name} · ${driverCode}` : "Select driver"} options={["Select driver", ...driverOptions]} onChange={(value) => {
                  const selected = drivers.find((driver) => `${driver.name} · ${driver.code}` === value)
                  setDriverCode(selected?.code ?? "")
                  const numeric = Number(selected?.value)
                  if (Number.isFinite(numeric)) setGrowthRate(numeric)
                  onResetPreview?.()
                }} />
                <input type="number" step="0.1" value={growthRate} onChange={(e) => setGrowthRate(Number(e.target.value))} className="h-10 w-32 rounded-full border border-[#d0d5dd] px-4 text-sm" />
                <Button className="rounded-full h-10 px-6" disabled={!driverCode || !Number.isFinite(growthRate) || previewLoading} onClick={() => onPreview?.(driverCode, growthRate)}>
                  {previewLoading ? <Loader2 className="size-4 animate-spin" /> : null} Preview
                </Button>
                {preview ? <Button variant="outline" className="rounded-full h-10 px-4" onClick={onResetPreview}>Reset to official</Button> : null}
              </div>
              {!driverCode ? <p className="mt-3 text-[11px] text-[#667085]">Choose a returned driver; no driver code has been guessed.</p> : null}
            </>}
            {previewError ? <p className="mt-3 text-sm text-[#b42318]">{previewError}</p> : null}
          </section>
        </div>

        {detailOpen && selectedDetail ? (
          <aside className="w-full sm:w-[360px] shrink-0 border-l border-[#e4e7ec] bg-white flex flex-col">
            <div className="px-4 py-3 border-b border-[#e4e7ec] flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-[#667085]">{selectedDetail.region ?? "—"} · {selectedDetail.period}</p>
                <h3 className="text-base font-semibold text-[#101828] mt-0.5">{selectedDetail.name}</h3>
                <p className="text-xs text-[#98a2b3] mt-1">{selectedDetail.method ?? "—"}</p>
              </div>
              <button type="button" onClick={() => setDetailOpen(false)} className="size-8 rounded-full hover:bg-[#f2f4f7] inline-flex items-center justify-center">
                <X className="size-4 text-[#667085]" />
              </button>
            </div>
            <div className="p-4 space-y-4 overflow-auto flex-1">
              <div className={`${R} bg-[#f9fafb] border border-[#e4e7ec] p-3`}>
                <p className="text-xs text-[#667085]">Variance to Budget</p>
                <p className={cn("text-2xl font-semibold tabular-nums mt-1", selectedDetail.variance === "—" ? "text-[#667085]" : selectedDetail.variance.startsWith("+") ? "text-[#12b76a]" : "text-[#f04438]")}>
                  {selectedDetail.variance}
                </p>
                <p className="text-xs text-[#667085] mt-1">YoY {selectedDetail.yoy}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: "Actual", value: selectedDetail.actual },
                  { label: "Budget", value: selectedDetail.budget },
                  { label: "Forecast", value: selectedDetail.forecast },
                ].map((cell) => (
                  <div key={cell.label} className={`${R} border border-[#e4e7ec] p-2`}>
                    <p className="text-[10px] text-[#667085]">{cell.label}</p>
                    <p className="text-sm font-semibold tabular-nums mt-0.5">{cell.value}</p>
                  </div>
                ))}
              </div>
              {selectedDetail.drivers.length > 0 ? <div>
                <p className="text-xs font-semibold text-[#344054] mb-2">Key Drivers</p>
                <ul className="space-y-2">
                  {selectedDetail.drivers.map((d) => (
                    <li key={d.label} className="flex justify-between text-sm">
                      <span className="text-[#667085]">{d.label}</span>
                      <span className="font-medium tabular-nums">{d.value}</span>
                    </li>
                  ))}
                </ul>
              </div> : <p className="text-sm text-[#667085]">Driver details and commentary are not included in this domain response.</p>}
            </div>
          </aside>
        ) : null}
      </div>

      {infoOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setInfoOpen(false)}>
          <div className={`${R} bg-white max-w-md w-full p-5 shadow-xl`} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-[#101828]">Revenue Analysis</h3>
            <p className="text-sm text-[#475569] mt-2 leading-relaxed">
              Explore revenue streams, regional breakdown, and budget-to-forecast waterfall. Sensitivity uses a returned revenue driver and activates a clearly labeled, non-persisted preview dataset.
            </p>
            <Button variant="outline" className="rounded-full mt-4" onClick={() => setInfoOpen(false)}>Close</Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
