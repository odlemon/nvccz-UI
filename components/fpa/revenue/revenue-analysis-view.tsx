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
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { cn } from "@/lib/utils"
import { KpiSparkline } from "@/components/fpa/kpi-sparkline"
import { Button } from "@/components/ui/button"
import {
  mockRevByRegion,
  mockRevDrivers,
  mockRevKpis,
  mockRevMonthly,
  mockRevStreamRows,
  mockWaterfall,
} from "@/components/fpa/mock-data"

const R = "rounded-lg"

export type RevStreamRow = {
  id: string
  name: string
  region: string
  method: string
  actual: number
  budget: number
  forecast: number
  yoy: number
  share: number
  entity: string
}

export type RevKpi = {
  label: string
  value: string
  delta?: string
  up?: boolean
  spark?: number[]
}

export type RevDetail = {
  id: string
  name: string
  region: string
  method: string
  period: string
  actual: string
  budget: string
  forecast: string
  variance: string
  yoy: string
  drivers: Array<{ label: string; value: string }>
  narrative: string
}

const VERSION_SCALE: Record<string, number> = {
  Working: 1,
  Locked: 0.99,
  Published: 0.97,
}

function fmtM(n: number): string {
  return `$${n.toFixed(1)}M`
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
        className={`h-10 min-w-[118px] inline-flex items-center ${R} border border-[#d0d5dd] bg-white pl-2.5 pr-7 text-left hover:bg-[#f9fafb]`}
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

function buildWaterfallData() {
  let running = 0
  return mockWaterfall.map((item) => {
    if (item.type === "total") {
      const start = 0
      running = item.value
      return { ...item, start, end: item.value, fill: "#2563eb" }
    }
    const start = running
    running += item.value
    return {
      ...item,
      start: Math.min(start, running),
      end: Math.max(start, running),
      fill: item.value >= 0 ? "#12b76a" : "#f04438",
    }
  })
}

export function detailForStream(row: RevStreamRow, period: string): RevDetail {
  const varB = row.actual - row.budget
  return {
    id: row.id,
    name: row.name,
    region: row.region,
    method: row.method,
    period,
    actual: fmtM(row.actual),
    budget: fmtM(row.budget),
    forecast: fmtM(row.forecast),
    variance: `${varB >= 0 ? "+" : ""}${fmtM(varB)}`,
    yoy: `${row.yoy >= 0 ? "+" : ""}${row.yoy.toFixed(1)}%`,
    drivers: mockRevDrivers.slice(0, 3).map((d) => ({
      label: d.name,
      value: d.unit === "%" ? `${d.value}%` : d.unit === "$" ? `$${d.value}` : String(d.value),
    })),
    narrative: `${row.name} is ${varB >= 0 ? "ahead of" : "behind"} budget driven by ${row.method.toLowerCase()}. YoY growth at ${row.yoy.toFixed(1)}% with ${row.share}% revenue share.`,
  }
}

export function mapMockRevStreams(): RevStreamRow[] {
  return mockRevStreamRows.map((r) => ({ ...r }))
}

export function mapMockRevKpis(): RevKpi[] {
  return mockRevKpis.map((k) => ({ ...k }))
}

type RevenueAnalysisViewProps = {
  loading?: boolean
  kpis?: RevKpi[]
  streams?: RevStreamRow[]
  periodLabel?: string
  onRefresh?: () => void
}

export function RevenueAnalysisView({
  loading = false,
  kpis = mapMockRevKpis(),
  streams = mapMockRevStreams(),
  periodLabel = "May 2025",
  onRefresh,
}: RevenueAnalysisViewProps) {
  const [entity, setEntity] = useState("All Entities")
  const [streamFilter, setStreamFilter] = useState("All Streams")
  const [version, setVersion] = useState("Working")
  const [period, setPeriod] = useState(periodLabel)
  const [view, setView] = useState("Stream View")
  const [growthRate, setGrowthRate] = useState(4.5)
  const [detailOpen, setDetailOpen] = useState(true)
  const [selectedDetail, setSelectedDetail] = useState<RevDetail | null>(
    detailForStream(streams[0], periodLabel),
  )
  const [infoOpen, setInfoOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [])

  const versionFactor = VERSION_SCALE[version] ?? 1
  const growthFactor = 1 + (growthRate - 4.5) / 100

  const filteredStreams = useMemo(() => {
    let rows = streams.map((r) => ({
      ...r,
      actual: r.actual * versionFactor * growthFactor,
      budget: r.budget * versionFactor,
      forecast: r.forecast * versionFactor * growthFactor,
    }))
    if (entity !== "All Entities") rows = rows.filter((r) => r.entity === entity)
    if (streamFilter !== "All Streams") {
      rows = rows.filter((r) => r.name.startsWith(streamFilter.split(" ")[0]))
    }
    return rows
  }, [streams, entity, streamFilter, versionFactor, growthFactor])

  const regionRows = useMemo(() => {
    return mockRevByRegion.map((r) => ({
      ...r,
      actual: r.actual * versionFactor * growthFactor,
      budget: r.budget * versionFactor,
      forecast: r.forecast * versionFactor * growthFactor,
    }))
  }, [versionFactor, growthFactor])

  const tableRows = view === "Region View" ? regionRows.map((r) => ({
    id: r.region,
    name: r.region,
    region: r.region,
    method: "Consolidated",
    actual: r.actual,
    budget: r.budget,
    forecast: r.forecast,
    yoy: ((r.actual - r.budget) / r.budget) * 100,
    share: Math.round((r.actual / 125.8) * 100),
    entity: r.region,
  })) : filteredStreams

  const waterfallData = buildWaterfallData()

  const adjustedKpis = useMemo(() => {
    const total = filteredStreams.reduce((s, r) => s + r.actual, 0)
    return kpis.map((k, i) => {
      if (i === 0) return { ...k, value: fmtM(total) }
      if (i === 1) return { ...k, value: `${(growthRate + 14).toFixed(1)}%` }
      return k
    })
  }, [kpis, filteredStreams, growthRate])

  const resetFilters = () => {
    setEntity("All Entities")
    setStreamFilter("All Streams")
    setVersion("Working")
    setPeriod(periodLabel)
    setView("Stream View")
    setGrowthRate(4.5)
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
            <FilterSelect
              label="Entity"
              value={entity}
              options={["All Entities", "North America", "EMEA", "APAC", "LATAM"]}
              onChange={setEntity}
            />
            <FilterSelect
              label="Stream"
              value={streamFilter}
              options={["All Streams", "Subscription", "Contract", "Volume", "Pipeline"]}
              onChange={setStreamFilter}
            />
            <FilterSelect
              label="Version"
              value={version}
              options={["Working", "Locked", "Published"]}
              onChange={setVersion}
            />
            <FilterSelect
              label="Period"
              value={period}
              options={["May 2025", "Apr 2025", "Mar 2025", "FY2025", "FY2026"]}
              onChange={setPeriod}
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
        </div>

        <div className="px-4 sm:px-5 pb-4">
          {loading ? (
            <div className="flex items-center gap-2 py-8 text-[#64748b]">
              <Loader2 className="size-5 animate-spin" /> Loading revenue…
            </div>
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
              <div className="h-[240px]">
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
              </div>
            </section>

            <section className={`${R} border border-[#e4e7ec] bg-white p-4`}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-[#101828]">Monthly Trend</h2>
                <span className="text-xs text-[#667085]">Actual vs Budget vs Forecast</span>
              </div>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={mockRevMonthly} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f2f4f7" />
                    <XAxis dataKey="m" tick={{ fontSize: 10, fill: "#667085" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#667085" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e4e7ec", fontSize: 12 }} />
                    <ReferenceLine x="May" stroke="#94a3b8" strokeDasharray="4 4" />
                    <Bar dataKey="budget" fill="#dbeafe" radius={[3, 3, 0, 0]} name="Budget" />
                    <Line type="monotone" dataKey="actual" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} name="Actual" />
                    <Line type="monotone" dataKey="forecast" stroke="#12b76a" strokeWidth={2} strokeDasharray="4 4" dot={false} name="Forecast" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
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
                    <button type="button" onClick={() => { onRefresh?.(); toast.message("Data refreshed") }} className="w-full px-3 py-2 text-left text-xs hover:bg-[#f9fafb] flex items-center gap-2">
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
                  {tableRows.map((row) => {
                    const varB = row.actual - row.budget
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
                        <td className="px-4 py-3 text-[#667085]">{row.method}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium">{fmtM(row.actual)}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-[#667085]">{fmtM(row.budget)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{fmtM(row.forecast)}</td>
                        <td className={cn("px-4 py-3 text-right tabular-nums font-medium", varTone(varB))}>
                          {varB >= 0 ? "+" : ""}{fmtM(varB)}
                        </td>
                        <td className={cn("px-4 py-3 text-right tabular-nums", varTone(row.yoy))}>
                          {row.yoy >= 0 ? "+" : ""}{row.yoy.toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-[#667085]">{row.share}%</td>
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
            <input
              type="range"
              min={0}
              max={12}
              step={0.1}
              value={growthRate}
              onChange={(e) => setGrowthRate(Number(e.target.value))}
              className="w-full accent-[#2563eb]"
            />
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {mockRevDrivers.map((d) => (
                <button
                  key={d.name}
                  type="button"
                  onClick={() => toast.message(d.name, { description: d.impact })}
                  className={`${R} border border-[#e4e7ec] px-3 py-2 text-left hover:border-[#b2ddff] transition-colors`}
                >
                  <p className="text-[11px] text-[#667085]">{d.name}</p>
                  <p className="text-sm font-semibold tabular-nums">
                    {d.unit === "%" ? `${d.value}%` : d.unit === "$" ? `$${d.value}` : d.value}
                  </p>
                  <p className="text-[10px] text-[#98a2b3] mt-0.5">{d.impact}</p>
                </button>
              ))}
            </div>
          </section>
        </div>

        {detailOpen && selectedDetail ? (
          <aside className="w-full sm:w-[360px] shrink-0 border-l border-[#e4e7ec] bg-white flex flex-col">
            <div className="px-4 py-3 border-b border-[#e4e7ec] flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-[#667085]">{selectedDetail.region} · {selectedDetail.period}</p>
                <h3 className="text-base font-semibold text-[#101828] mt-0.5">{selectedDetail.name}</h3>
                <p className="text-xs text-[#98a2b3] mt-1">{selectedDetail.method}</p>
              </div>
              <button type="button" onClick={() => setDetailOpen(false)} className="size-8 rounded-full hover:bg-[#f2f4f7] inline-flex items-center justify-center">
                <X className="size-4 text-[#667085]" />
              </button>
            </div>
            <div className="p-4 space-y-4 overflow-auto flex-1">
              <div className={`${R} bg-[#f9fafb] border border-[#e4e7ec] p-3`}>
                <p className="text-xs text-[#667085]">Variance to Budget</p>
                <p className={cn("text-2xl font-semibold tabular-nums mt-1", selectedDetail.variance.startsWith("+") ? "text-[#12b76a]" : "text-[#f04438]")}>
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
              <div>
                <p className="text-xs font-semibold text-[#344054] mb-2">Key Drivers</p>
                <ul className="space-y-2">
                  {selectedDetail.drivers.map((d) => (
                    <li key={d.label} className="flex justify-between text-sm">
                      <span className="text-[#667085]">{d.label}</span>
                      <span className="font-medium tabular-nums">{d.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-sm text-[#475569] leading-relaxed">{selectedDetail.narrative}</p>
              <Button variant="gradient-info" className="rounded-full h-10 w-full shadow-sm" onClick={() => toast.message("Open in worksheet", { description: "Navigate to planning grid for this stream" })}>
                Open in Worksheet
              </Button>
            </div>
          </aside>
        ) : null}
      </div>

      {infoOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setInfoOpen(false)}>
          <div className={`${R} bg-white max-w-md w-full p-5 shadow-xl`} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-[#101828]">Revenue Analysis</h3>
            <p className="text-sm text-[#475569] mt-2 leading-relaxed">
              Explore revenue streams, regional breakdown, and budget-to-forecast waterfall. Use the growth slider to simulate what-if scenarios. Click any row for stream detail.
            </p>
            <Button variant="outline" className="rounded-full mt-4" onClick={() => setInfoOpen(false)}>Close</Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
