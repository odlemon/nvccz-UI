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
import type { FpaDomainScope, FpaDriver } from "@/lib/api/fpa-api"

const R = "rounded-lg"

export type CashStatementRow = {
  id: string
  line: string
  type: "inflow" | "outflow" | "total"
  values: Record<string, number | null>
}

export type CashKpi = {
  label: string
  value: string
  delta?: string
  up?: boolean
  spark?: number[]
}

export type CashDetail = {
  id: string
  line: string
  period: string
  amount: string
  type: string
  ytd: string
  drivers: Array<{ label: string; value: string }>
}

function fmtM(n: number | null | undefined, signed = false): string {
  if (n == null) return "—"
  const abs = Math.abs(n).toFixed(1)
  if (signed && n < 0) return `($${abs}M)`
  if (signed && n > 0) return `+$${abs}M`
  return `$${abs}M`
}

function cellTone(n: number, type: CashStatementRow["type"]): string {
  if (type === "total") return "font-semibold text-[#101828]"
  if (n === 0) return "text-[#667085]"
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


function CashKpiCard({ kpi, onClick }: { kpi: CashKpi; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${R} border border-[#e4e7ec] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(16,24,40,0.03)] flex items-center justify-between gap-3 min-h-[92px] w-full text-left hover:border-[#b2ddff] transition-colors`}
    >
      <div className="min-w-0 flex flex-col justify-center">
        <p className="text-[13px] font-semibold text-[#344054] leading-tight">{kpi.label}</p>
        <p className="mt-1.5 text-[26px] font-semibold text-[#101828] tabular-nums leading-none tracking-tight">{kpi.value}</p>
        {kpi.delta ? (
          <p className={cn("mt-1.5 text-[12px] font-medium", kpi.up !== false ? "text-[#12b76a]" : "text-[#f04438]")}>
            {kpi.delta}
          </p>
        ) : null}
      </div>
      {kpi.spark ? <KpiSparkline values={kpi.spark} color={kpi.label === "Closing Cash" ? "#2563eb" : "#0d9488"} /> : null}
    </button>
  )
}

export function detailForLine(row: CashStatementRow, periodKey: string, periods: string[]): CashDetail {
  const val = row.values[periodKey]
  const ytdValues = periods.slice(0, periods.indexOf(periodKey) + 1).map((key) => row.values[key])
  const ytd = ytdValues.some((value) => value == null) ? null : ytdValues.reduce<number>((sum, value) => sum + (value ?? 0), 0)
  return {
    id: row.id,
    line: row.line,
    period: periodKey,
    amount: fmtM(val, true),
    type: row.type === "inflow" ? "Cash Inflow" : row.type === "outflow" ? "Cash Outflow" : "Balance",
    ytd: fmtM(ytd, true),
    drivers: [],
  }
}

type CashFlowAnalysisViewProps = {
  loading?: boolean
  error?: string
  kpis?: CashKpi[]
  periods?: string[]
  statementRows?: CashStatementRow[]
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
  preview?: { kpis: CashKpi[]; periods: string[]; statementRows: CashStatementRow[] }
  previewLoading?: boolean
  previewError?: string
  onPreview?: (driverCode: string, value: number) => void
  onResetPreview?: () => void
}

export function CashFlowAnalysisView({
  loading = false,
  error,
  kpis = [],
  periods = [],
  statementRows = [],
  periodLabel = "May 2025",
  onRefresh,
  entities = [], availablePeriods = [], selectedEntityId = "", periodFrom = "", periodTo = "",
  appliedScope, onEntityChange, onPeriodFromChange, onPeriodToChange,
  drivers = [], preview, previewLoading = false, previewError, onPreview, onResetPreview,
}: CashFlowAnalysisViewProps) {
  const displayedKpis = preview?.kpis ?? kpis
  const displayedPeriods = preview?.periods ?? periods
  const displayedRows = preview?.statementRows ?? statementRows
  const [period, setPeriod] = useState(displayedPeriods[0] || periodLabel)
  const [view, setView] = useState("Statement View")
  const [collectionDays, setCollectionDays] = useState(45)
  const [driverCode, setDriverCode] = useState("")
  const [detailOpen, setDetailOpen] = useState(true)
  const [selectedDetail, setSelectedDetail] = useState<CashDetail | null>(
    displayedRows[0] && displayedPeriods[0] ? detailForLine(displayedRows[0], displayedPeriods[0], displayedPeriods) : null,
  )
  const [infoOpen, setInfoOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const selectedEntityName = entities.find((option) => option.id === selectedEntityId)?.name ?? "All Entities"
  const driverOptions = useMemo(() => drivers.map((driver) => `${driver.name} · ${driver.code}`), [drivers])

  const activePeriod = displayedPeriods.includes(period) ? period : displayedPeriods[0]

  useEffect(() => {
    if (displayedPeriods.length === 0) {
      setSelectedDetail(null)
      return
    }
    setPeriod((current) => displayedPeriods.includes(current) ? current : displayedPeriods[0])
    setSelectedDetail((current) => {
      const row = current ? displayedRows.find((candidate) => candidate.id === current.id) : displayedRows[0]
      return row ? detailForLine(row, displayedPeriods.includes(period) ? period : displayedPeriods[0], displayedPeriods) : null
    })
  }, [displayedPeriods, displayedRows, period])

  useEffect(() => {
    if (driverCode && !drivers.some((driver) => driver.code === driverCode)) setDriverCode("")
    if (!driverCode) {
      const relevant = drivers.find((driver) => {
        const value = `${driver.code} ${driver.name}`.toLowerCase()
        return value.includes("collection") && value.includes("day")
      })
      if (relevant) {
        setDriverCode(relevant.code)
        const value = Number(relevant.value)
        if (Number.isFinite(value)) setCollectionDays(value)
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

  const visibleRows = displayedRows

  const monthlyChart = useMemo(() => {
    return displayedPeriods.map((key) => {
      const inflowValues = displayedRows.filter((row) => row.type === "inflow").map((row) => row.values[key])
      const outflowValues = displayedRows.filter((row) => row.type === "outflow").map((row) => row.values[key])
      const inflow = inflowValues.length > 0 && inflowValues.every((value) => value != null) ? inflowValues.reduce<number>((sum, value) => sum + (value ?? 0), 0) : undefined
      const outflow = outflowValues.length > 0 && outflowValues.every((value) => value != null) ? outflowValues.reduce<number>((sum, value) => sum + (value ?? 0), 0) : undefined
      const closing = displayedRows.find((row) => /closing cash/i.test(row.line))?.values[key]
      return { period: key, inflow, outflow, net: inflow == null || outflow == null ? undefined : inflow + outflow, closing }
    })
  }, [displayedPeriods, displayedRows])
  const netCashChart = useMemo(() => monthlyChart.filter((point) => point.inflow != null || point.outflow != null || point.net != null), [monthlyChart])
  const closingCashChart = useMemo(() => monthlyChart.filter((point) => point.closing != null), [monthlyChart])

  const adjustedKpis = useMemo(() => {
    return displayedKpis
  }, [displayedKpis])

  const resetFilters = () => {
    setPeriod(displayedPeriods[0] || periodLabel)
    onEntityChange?.("")
    onPeriodFromChange?.("")
    onPeriodToChange?.("")
    setView("Statement View")
    setCollectionDays(45)
    onResetPreview?.()
    toast.message("Filters reset")
  }

  const pickCell = (row: CashStatementRow, periodKey: string) => {
    setSelectedDetail(detailForLine(row, periodKey, displayedPeriods))
    setDetailOpen(true)
  }

  const exportCsv = () => {
    const header = "Line," + displayedPeriods.join(",") + "\n"
    const body = visibleRows.map((r) => `${r.line},${displayedPeriods.map((key) => r.values[key] == null ? "" : r.values[key]?.toFixed(1)).join(",")}`).join("\n")
    const blob = new Blob([header + body], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `cash-flow-${period.replace(/\s/g, "-")}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Cash flow export downloaded")
  }

  const hasData = adjustedKpis.length > 0 || displayedPeriods.length > 0 || displayedRows.length > 0
  if (loading && !hasData) return <div className="min-h-full bg-[#f1f5f9] flex items-center justify-center gap-2 text-sm text-[#64748b]"><Loader2 className="size-5 animate-spin" /> Loading cash flow analysis…</div>
  if (error && !hasData) return <div className="min-h-full bg-[#f1f5f9] flex items-center justify-center p-8 text-sm text-[#b42318]">{error}</div>

  return (
    <div className="min-h-full bg-[#f1f5f9] flex flex-col">
      <div className="bg-white border-b border-[#e4e7ec]">
        <div className="px-4 sm:px-5 pt-4 pb-3">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-[18px] font-semibold text-[#101828]">Cash Flow</h1>
            <Button variant="outline" className="rounded-full h-9 px-4 text-xs" onClick={() => onRefresh?.()}>
              <RefreshCw className="size-3.5" />
              Refresh
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap items-end gap-2">
            {entities.length > 0 ? <FilterSelect label="Entity" value={selectedEntityName} options={["All Entities", ...entities.map((option) => option.name)]} onChange={(name) => onEntityChange?.(entities.find((option) => option.name === name)?.id ?? "")} /> : null}
            {availablePeriods.length > 0 ? <>
              <FilterSelect label="Period from" value={periodFrom || "All Periods"} options={["All Periods", ...availablePeriods]} onChange={(value) => onPeriodFromChange?.(value === "All Periods" ? "" : value)} />
              <FilterSelect label="Period to" value={periodTo || "All Periods"} options={["All Periods", ...availablePeriods]} onChange={(value) => onPeriodToChange?.(value === "All Periods" ? "" : value)} />
            </> : null}
            {displayedPeriods.length > 0 ? <FilterSelect label="Period" value={activePeriod} options={displayedPeriods} onChange={setPeriod} /> : null}
            <FilterSelect label="View" value={view} options={["Statement View", "Runway View"]} onChange={setView} />
            <button type="button" onClick={resetFilters} className="ml-auto mb-0.5 px-1 text-[12px] font-semibold text-[#1570ef] hover:underline">
              Reset Filters
            </button>
          </div>
          <p className="mt-2 text-[11px] text-[#667085]">Applied scope: {appliedScope?.entityId ? selectedEntityName : "All entities"} · {appliedScope?.periodFrom || "First period"} → {appliedScope?.periodTo || "Latest period"}</p>
        </div>

        <div className="px-4 sm:px-5 pb-4">
          {adjustedKpis.length === 0 ? (
            <p className="py-8 text-sm text-[#64748b]">No cash flow KPIs are available.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
              {adjustedKpis.map((k) => (
                <CashKpiCard key={k.label} kpi={k} onClick={() => toast.message(k.label, { description: `${k.value} · ${period}` })} />
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
          {view === "Runway View" ? (
            <section className={`${R} border border-[#e4e7ec] bg-white p-4`}>
              <h2 className="text-sm font-semibold text-[#101828] mb-3">Cash Runway by Scenario</h2>
              <p className="py-12 text-center text-sm text-[#64748b]">Scenario runway breakdown is not available for this domain view.</p>
            </section>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <section className={`${R} border border-[#e4e7ec] bg-white p-4`}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-[#101828]">Net Cash Flow</h2>
                  <button type="button" onClick={() => setInfoOpen(true)} className="text-[#98a2b3] hover:text-[#667085]">
                    <Info className="size-4" />
                  </button>
                </div>
                {netCashChart.length === 0 ? (
                  <p className="py-12 text-center text-sm text-[#64748b]">No monthly cash flow data is available.</p>
                ) : <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={netCashChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f2f4f7" />
                      <XAxis dataKey="period" tick={{ fontSize: 10, fill: "#667085" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#667085" }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                      <ReferenceLine y={0} stroke="#94a3b8" />
                      <Bar dataKey="inflow" fill="#bbf7d0" name="Inflows" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="outflow" fill="#fecaca" name="Outflows" />
                      <Line type="monotone" dataKey="net" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} name="Net" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>}
              </section>

              <section className={`${R} border border-[#e4e7ec] bg-white p-4`}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-[#101828]">Closing Cash Balance</h2>
                </div>
                {closingCashChart.length === 0 ? (
                  <p className="py-12 text-center text-sm text-[#64748b]">No closing cash history is available.</p>
                ) : <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={closingCashChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f2f4f7" />
                      <XAxis dataKey="period" tick={{ fontSize: 10, fill: "#667085" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#667085" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
                      <Tooltip formatter={(v: number) => fmtM(v)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                      <Line type="monotone" dataKey="closing" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4, fill: "#fff", strokeWidth: 2 }} name="Closing Cash" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>}
              </section>
            </div>
          )}

          <section className={`${R} border border-[#e4e7ec] bg-white overflow-hidden`}>
            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#101828]">Cash Statement</h2>
              <div className="relative" ref={menuRef}>
                <button type="button" onClick={() => setMenuOpen((o) => !o)} className="size-8 inline-flex items-center justify-center rounded-full hover:bg-[#f2f4f7] text-[#667085]">
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
                    <th className="px-4 py-3 font-medium sticky left-0 bg-[#f9fafb]">Line Item</th>
                    {displayedPeriods.map((key) => (
                      <th key={key} className={cn("px-3 py-3 font-medium text-right", key === activePeriod && "bg-[#eff8ff] text-[#1570ef]")}>
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.length === 0 ? (
                    <tr><td colSpan={Math.max(displayedPeriods.length + 1, 2)} className="px-4 py-10 text-center text-sm text-[#64748b]">No cash statement rows are available.</td></tr>
                  ) : null}
                  {visibleRows.map((row) => (
                    <tr key={row.id} className={cn("border-t border-[#f2f4f7]", row.type === "total" && "bg-[#f9fafb]")}>
                      <td className={cn("px-4 py-3 sticky left-0 bg-white", row.type === "total" && "bg-[#f9fafb] font-semibold")}>
                        {row.line}
                      </td>
                      {displayedPeriods.map((key) => (
                        <td
                          key={key}
                          className={cn(
                            "px-3 py-3 text-right tabular-nums cursor-pointer hover:bg-[#eff8ff]",
                            row.values[key] == null ? "text-[#667085]" : cellTone(row.values[key], row.type),
                            key === activePeriod && "bg-[#eff8ff]/50",
                          )}
                          onClick={() => pickCell(row, key)}
                        >
                          {fmtM(row.values[key], true)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className={`${R} border border-[#e4e7ec] bg-white p-4`}>
            <div className="flex items-center gap-2 mb-4">
              <SlidersHorizontal className="size-4 text-[#2563eb]" />
              <h2 className="text-sm font-semibold text-[#101828]">What-if: Collection Days</h2>
              <span className="text-xs text-[#667085] ml-auto tabular-nums">{collectionDays} days</span>
            </div>
            {drivers.length === 0 ? <p className="text-sm text-[#667085]">No cash driver was returned, so this control is unavailable.</p> : <>
              <div className="flex flex-wrap items-end gap-2">
                <FilterSelect label="Driver" value={drivers.find((driver) => driver.code === driverCode) ? `${drivers.find((driver) => driver.code === driverCode)?.name} · ${driverCode}` : "Select driver"} options={["Select driver", ...driverOptions]} onChange={(value) => {
                  const selected = drivers.find((driver) => `${driver.name} · ${driver.code}` === value)
                  setDriverCode(selected?.code ?? "")
                  const numeric = Number(selected?.value)
                  if (Number.isFinite(numeric)) setCollectionDays(numeric)
                  onResetPreview?.()
                }} />
                <input type="number" step="1" value={collectionDays} onChange={(e) => setCollectionDays(Number(e.target.value))} className="h-10 w-32 rounded-full border border-[#d0d5dd] px-4 text-sm" />
                <Button className="rounded-full h-10 px-6" disabled={!driverCode || !Number.isFinite(collectionDays) || previewLoading} onClick={() => onPreview?.(driverCode, collectionDays)}>
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
                <p className="text-xs text-[#667085]">{selectedDetail.type} · {selectedDetail.period}</p>
                <h3 className="text-base font-semibold text-[#101828] mt-0.5">{selectedDetail.line}</h3>
              </div>
              <button type="button" onClick={() => setDetailOpen(false)} className="size-8 rounded-full hover:bg-[#f2f4f7] inline-flex items-center justify-center">
                <X className="size-4 text-[#667085]" />
              </button>
            </div>
            <div className="p-4 space-y-4 overflow-auto flex-1">
              <div className={`${R} bg-[#f9fafb] border border-[#e4e7ec] p-3`}>
                <p className="text-xs text-[#667085]">Period Amount</p>
                <p className="text-2xl font-semibold tabular-nums mt-1 text-[#101828]">{selectedDetail.amount}</p>
                <p className="text-xs text-[#667085] mt-1">YTD {selectedDetail.ytd}</p>
              </div>
              {selectedDetail.drivers.length > 0 ? <div>
                <p className="text-xs font-semibold text-[#344054] mb-2">Cash Drivers</p>
                <ul className="space-y-2">
                  {selectedDetail.drivers.map((d) => (
                    <li key={d.label} className="flex justify-between text-sm">
                      <span className="text-[#667085]">{d.label}</span>
                      <span className="font-medium tabular-nums">{d.value}</span>
                    </li>
                  ))}
                </ul>
              </div> : <p className="text-sm text-[#667085]">Budget variance, drivers, and commentary are not included in this domain response.</p>}
            </div>
          </aside>
        ) : null}
      </div>

      {infoOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setInfoOpen(false)}>
          <div className={`${R} bg-white max-w-md w-full p-5 shadow-xl`} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-[#101828]">Cash Flow Analysis</h3>
            <p className="text-sm text-[#475569] mt-2 leading-relaxed">
              Track inflows, outflows, and closing cash by period. Sensitivity uses a returned cash driver and activates a clearly labeled, non-persisted preview dataset.
            </p>
            <Button variant="outline" className="rounded-full mt-4" onClick={() => setInfoOpen(false)}>Close</Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
