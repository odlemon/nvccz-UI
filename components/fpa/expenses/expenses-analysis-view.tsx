"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import {
  AlertTriangle,
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
  Pie,
  PieChart,
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
const planningInitials = (name: string) => name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()
const planningAvatarTone = (seed: string) => ["#2563eb", "#7c3aed", "#0d9488", "#d97706"][seed.length % 4]

export type ExpDeptRow = {
  id: string
  dept: string
  category: string | null
  budget: number | null
  actual: number | null
  runRate: number | null
  forecast: number | null
  headcount: number | null
  status?: "over" | "watch" | "ok"
}

export type ExpKpi = {
  label: string
  value: string
  delta?: string
  up?: boolean
  spark?: number[]
}

export type ExpAlert = {
  departmentId: string
  departmentName: string
  severityPct?: number | null
  severityAmount?: number
  severity?: string
}
export type ExpCategoryPoint = { category: string; amount: number | null; sharePct?: number }
export type ExpMonthlyPoint = { period: string; actual?: number; budget?: number; forecast?: number }
export type ExpBridgePoint = { key: string; label: string; value?: number; delta?: number }

export type ExpDetail = {
  id: string
  dept: string
  category: string | null
  period: string
  actual: string
  budget: string
  forecast: string
  variance: string
  utilization: string
  headcount: number | null
}

function fmtM(n: number | null): string {
  return n == null ? "—" : `$${n.toFixed(1)}M`
}

function varTone(n: number): string {
  if (Math.abs(n) < 0.05) return "text-[#101828]"
  return n > 0 ? "text-[#f04438]" : "text-[#12b76a]"
}

function statusPill(status: ExpDeptRow["status"]) {
  if (status === "over") return "bg-[#fef3f2] text-[#b42318] border-[#fecdca]"
  if (status === "watch") return "bg-[#fffaeb] text-[#b54708] border-[#fedf89]"
  return status === "ok" ? "bg-[#ecfdf3] text-[#027a48] border-[#abefc6]" : "bg-[#f2f4f7] text-[#667085] border-[#e4e7ec]"
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


function ExpKpiCard({ kpi, onClick }: { kpi: ExpKpi; onClick?: () => void }) {
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
      {kpi.spark ? <KpiSparkline values={kpi.spark} color="#0d9488" /> : null}
    </button>
  )
}

export function detailForDept(row: ExpDeptRow, period: string): ExpDetail {
  const varB = row.actual == null || row.budget == null ? null : row.actual - row.budget
  const util = row.actual == null || row.budget == null || row.budget === 0 ? null : (row.actual / row.budget) * 100
  return {
    id: row.id,
    dept: row.dept,
    category: row.category,
    period,
    actual: fmtM(row.actual),
    budget: fmtM(row.budget),
    forecast: fmtM(row.forecast),
    variance: varB == null ? "—" : `${varB >= 0 ? "+" : ""}${fmtM(varB)}`,
    utilization: util == null ? "—" : `${util.toFixed(1)}%`,
    headcount: row.headcount,
  }
}

type ExpensesAnalysisViewProps = {
  loading?: boolean
  error?: string
  kpis?: ExpKpi[]
  deptRows?: ExpDeptRow[]
  alerts?: ExpAlert[]
  byCategory?: ExpCategoryPoint[]
  monthlyBurn?: ExpMonthlyPoint[]
  bridge?: ExpBridgePoint[]
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
  preview?: { kpis: ExpKpi[]; deptRows: ExpDeptRow[]; alerts: ExpAlert[]; byCategory: ExpCategoryPoint[]; monthlyBurn: ExpMonthlyPoint[]; bridge: ExpBridgePoint[] }
  previewLoading?: boolean
  previewError?: string
  onPreview?: (driverCode: string, value: number) => void
  onResetPreview?: () => void
}

export function ExpensesAnalysisView({
  loading = false,
  error,
  kpis = [],
  deptRows = [],
  alerts = [],
  byCategory = [],
  monthlyBurn = [],
  bridge = [],
  periodLabel = "May 2025",
  onRefresh,
  entities = [], availablePeriods = [], selectedEntityId = "", periodFrom = "", periodTo = "",
  appliedScope, onEntityChange, onPeriodFromChange, onPeriodToChange,
  drivers = [], preview, previewLoading = false, previewError, onPreview, onResetPreview,
}: ExpensesAnalysisViewProps) {
  const displayedKpis = preview?.kpis ?? kpis
  const displayedDeptRows = preview?.deptRows ?? deptRows
  const displayedAlerts = preview?.alerts ?? alerts
  const displayedByCategory = preview?.byCategory ?? byCategory
  const displayedMonthlyBurn = preview?.monthlyBurn ?? monthlyBurn
  const displayedBridge = preview?.bridge ?? bridge
  const [department, setDepartment] = useState("All Departments")
  const [category, setCategory] = useState("All Categories")
  const [driverCode, setDriverCode] = useState("")
  const [driverValue, setDriverValue] = useState(0)
  const [view, setView] = useState("Department View")
  const [detailOpen, setDetailOpen] = useState(true)
  const [selectedDetail, setSelectedDetail] = useState<ExpDetail | null>(
    displayedDeptRows[0] ? detailForDept(displayedDeptRows[0], periodLabel) : null,
  )
  const [infoOpen, setInfoOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const departmentOptions = useMemo(() => ["All Departments", ...new Set(displayedDeptRows.map((row) => row.dept).filter(Boolean))], [displayedDeptRows])
  const categoryOptions = useMemo(() => ["All Categories", ...new Set(displayedByCategory.map((row) => row.category).filter(Boolean))], [displayedByCategory])
  const period = periodTo || periodFrom || periodLabel
  const selectedEntityName = entities.find((option) => option.id === selectedEntityId)?.name ?? "All Entities"
  const driverOptions = useMemo(() => drivers.map((driver) => `${driver.name} · ${driver.code}`), [drivers])

  useEffect(() => {
    setSelectedDetail((current) => {
      const row = current ? displayedDeptRows.find((candidate) => candidate.id === current.id) : displayedDeptRows[0]
      return row ? detailForDept(row, period) : null
    })
  }, [displayedDeptRows, period])

  useEffect(() => {
    if (driverCode && !drivers.some((driver) => driver.code === driverCode)) setDriverCode("")
  }, [drivers, driverCode])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [])

  const filteredRows = useMemo(() => {
    let rows = displayedDeptRows
    if (department !== "All Departments") rows = rows.filter((r) => r.dept === department)
    return rows
  }, [displayedDeptRows, department])

  const visibleCategories = useMemo(
    () => category === "All Categories" ? displayedByCategory : displayedByCategory.filter((row) => row.category === category),
    [displayedByCategory, category],
  )

  const categoryChartData = useMemo(() => {
    const colors = ["#2563eb", "#7c3aed", "#0d9488", "#f59e0b", "#64748b", "#94a3b8"]
    return visibleCategories.filter((row) => row.amount != null).map((row, i) => ({
      name: row.category,
      value: row.amount,
      color: colors[i % colors.length],
    }))
  }, [visibleCategories])

  const overBudgetAlerts = useMemo(() => {
    return displayedAlerts.filter((alert) => {
      if (department !== "All Departments" && alert.departmentName !== department) return false
      return true
    })
  }, [displayedAlerts, department])

  const adjustedKpis = displayedKpis

  const resetFilters = () => {
    setDepartment("All Departments")
    setCategory("All Categories")
    onEntityChange?.("")
    onPeriodFromChange?.("")
    onPeriodToChange?.("")
    setView("Department View")
    onResetPreview?.()
    toast.message("Filters reset")
  }

  const pickDept = (row: ExpDeptRow) => {
    setSelectedDetail(detailForDept(row, period))
    setDetailOpen(true)
  }

  const exportCsv = () => {
    const header = "Department,Category,Budget,Actual,RunRate,Forecast,Headcount,Status\n"
    const body = filteredRows
      .map((r) => `${r.dept},${r.category},${r.budget},${r.actual},${r.runRate},${r.forecast},${r.headcount},${r.status}`)
      .join("\n")
    const blob = new Blob([header + body], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `expenses-${period.replace(/\s/g, "-")}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Expenses export downloaded")
  }

  const hasData = adjustedKpis.length > 0 || displayedDeptRows.length > 0 || displayedByCategory.length > 0 || displayedMonthlyBurn.length > 0 || displayedBridge.length > 0
  if (loading && !hasData) return <div className="min-h-full bg-[#f1f5f9] flex items-center justify-center gap-2 text-sm text-[#64748b]"><Loader2 className="size-5 animate-spin" /> Loading expense analysis…</div>
  if (error && !hasData) return <div className="min-h-full bg-[#f1f5f9] flex items-center justify-center p-8 text-sm text-[#b42318]">{error}</div>

  return (
    <div className="min-h-full bg-[#f1f5f9] flex flex-col">
      <div className="bg-white border-b border-[#e4e7ec]">
        <div className="px-4 sm:px-5 pt-4 pb-3">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-[18px] font-semibold text-[#101828]">Expenses</h1>
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
            <FilterSelect
              label="Department"
              value={department}
              options={departmentOptions}
              onChange={setDepartment}
            />
            {view === "Category View" && categoryOptions.length > 1 ? <FilterSelect
              label="Category"
              value={category}
              options={categoryOptions}
              onChange={setCategory}
            /> : null}
            <FilterSelect
              label="View"
              value={view}
              options={["Department View", "Category View"]}
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
            <p className="py-8 text-sm text-[#64748b]">No expense KPIs are available.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
              {adjustedKpis.map((k) => (
                <ExpKpiCard
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
          {preview ? <div className="rounded-lg border border-[#99f6e4] bg-[#f0fdfa] px-4 py-3 text-xs font-semibold text-[#0f766e]">Preview · not persisted — cards, charts, and tables below use the preview dataset.</div> : null}
          {loading && hasData ? <p className="text-xs text-[#667085]"><Loader2 className="mr-1 inline size-3 animate-spin" />Refreshing current scope…</p> : null}
          {error && hasData ? <p className="text-sm text-[#b42318]">{error}</p> : null}
          {overBudgetAlerts.length > 0 ? (
            <section className={`${R} border border-[#fecdca] bg-[#fef3f2] p-4`}>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="size-4 text-[#b42318]" />
                <h2 className="text-sm font-semibold text-[#912018]">Over-Budget Alerts</h2>
                <span className="text-xs text-[#b42318] ml-auto">{overBudgetAlerts.length} departments</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                {overBudgetAlerts.slice(0, 3).map((ob) => (
                  <button
                    key={ob.departmentId}
                    type="button"
                    onClick={() => {
                      const row = displayedDeptRows.find((r) => r.id === ob.departmentId)
                      if (row) pickDept(row)
                      else toast.message(ob.departmentName)
                    }}
                    className={`${R} border border-[#fecdca] bg-white px-3 py-2 text-left hover:border-[#f97066] transition-colors`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="size-7 rounded-full inline-flex items-center justify-center text-[10px] font-semibold text-white shrink-0"
                        style={{ backgroundColor: planningAvatarTone(ob.departmentName) }}
                      >
                        {planningInitials(ob.departmentName)}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#101828] truncate">{ob.departmentName}</p>
                        <p className="text-xs text-[#b42318]">
                          {ob.severityPct != null ? `${ob.severityPct.toFixed(1)}% over budget` : ob.severityAmount != null ? `${fmtM(ob.severityAmount)} over budget` : ob.severity || "Over budget"}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <section className={`${R} border border-[#e4e7ec] bg-white p-4`}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-[#101828]">OpEx by Category</h2>
                <button type="button" onClick={() => setInfoOpen(true)} className="text-[#98a2b3] hover:text-[#667085]">
                  <Info className="size-4" />
                </button>
              </div>
              {categoryChartData.length === 0 ? (
                <p className="py-12 text-center text-sm text-[#64748b]">No expense category data is available.</p>
              ) : <div className="h-[240px] flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={2}
                      onClick={(_, i) => toast.message(categoryChartData[i]?.name || "Category", { description: fmtM(categoryChartData[i]?.value || 0) })}
                    >
                      {categoryChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} className="cursor-pointer" />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmtM(v)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="hidden sm:block w-[140px] shrink-0 space-y-1.5 pl-2">
                  {categoryChartData.map((c) => (
                    <div key={c.name} className="flex items-center gap-2 text-xs">
                      <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="text-[#667085] truncate">{c.name}</span>
                      <span className="ml-auto tabular-nums font-medium">{fmtM(c.value)}</span>
                    </div>
                  ))}
                </div>
              </div>}
            </section>

            <section className={`${R} border border-[#e4e7ec] bg-white p-4`}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-[#101828]">Monthly Burn</h2>
                <span className="text-xs text-[#667085]">Budget vs Actual vs Forecast</span>
              </div>
              {displayedMonthlyBurn.length === 0 ? (
                <p className="py-12 text-center text-sm text-[#64748b]">No monthly burn data is available.</p>
              ) : <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={displayedMonthlyBurn} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f2f4f7" />
                    <XAxis dataKey="period" tick={{ fontSize: 10, fill: "#667085" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#667085" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e4e7ec", fontSize: 12 }} />
                    <Bar dataKey="budget" fill="#e0e7ff" radius={[3, 3, 0, 0]} name="Budget" />
                    <Line type="monotone" dataKey="actual" stroke="#f04438" strokeWidth={2} dot={{ r: 3 }} name="Actual" />
                    <Line type="monotone" dataKey="forecast" stroke="#64748b" strokeWidth={2} strokeDasharray="4 4" dot={false} name="Forecast" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>}
            </section>
          </div>

          <section className={`${R} border border-[#e4e7ec] bg-white overflow-hidden`}>
            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#101828]">
                {view === "Category View" ? "Expenses by Category" : "Department Expenses"}
              </h2>
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
              {view === "Category View" ? (
                <table className="w-full text-sm min-w-[520px]">
                  <thead>
                    <tr className="border-y border-[#e4e7ec] text-left text-xs text-[#667085] bg-[#f9fafb]">
                      <th className="px-4 py-3 font-medium">Category</th>
                      <th className="px-4 py-3 font-medium text-right">Amount</th>
                      <th className="px-4 py-3 font-medium text-right">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleCategories.length === 0 ? <tr><td colSpan={3} className="px-4 py-10 text-center text-sm text-[#64748b]">No expense category data is available.</td></tr> : null}
                    {visibleCategories.map((row) => (
                      <tr key={row.category} className="border-t border-[#f2f4f7]">
                        <td className="px-4 py-3 font-medium text-[#101828]">{row.category}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{fmtM(row.amount)}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-[#667085]">{row.sharePct == null ? "—" : `${row.sharePct.toFixed(1)}%`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="border-y border-[#e4e7ec] text-left text-xs text-[#667085] bg-[#f9fafb]">
                    <th className="px-4 py-3 font-medium">Department</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium text-right">Budget</th>
                    <th className="px-4 py-3 font-medium text-right">Actual</th>
                    <th className="px-4 py-3 font-medium text-right">Run Rate</th>
                    <th className="px-4 py-3 font-medium text-right">Forecast</th>
                    <th className="px-4 py-3 font-medium text-right">Var $</th>
                    <th className="px-4 py-3 font-medium text-right">HC</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.length === 0 ? (
                    <tr><td colSpan={9} className="px-4 py-10 text-center text-sm text-[#64748b]">No department expense data is available.</td></tr>
                  ) : null}
                  {filteredRows.map((row) => {
                    const varB = row.actual == null || row.budget == null ? null : row.actual - row.budget
                    return (
                      <tr
                        key={row.id}
                        className="border-t border-[#f2f4f7] hover:bg-[#f9fafb] cursor-pointer"
                        onClick={() => pickDept(row)}
                      >
                        <td className="px-4 py-3">
                          <button type="button" className="font-medium text-[#1570ef] hover:underline text-left">
                            {row.dept}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-[#667085]">{row.category ?? "—"}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-[#667085]">{fmtM(row.budget)}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium">{fmtM(row.actual)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{fmtM(row.runRate)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{fmtM(row.forecast)}</td>
                        <td className={cn("px-4 py-3 text-right tabular-nums font-medium", varB == null ? "text-[#667085]" : varTone(varB))}>
                          {varB == null ? "—" : `${varB >= 0 ? "+" : ""}${fmtM(varB)}`}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-[#667085]">{row.headcount}</td>
                        <td className="px-4 py-3">
                          <span className={cn("inline-flex px-2 py-0.5 text-[11px] font-medium border rounded-full capitalize", statusPill(row.status))}>
                            {row.status === "over" ? "Over" : row.status === "watch" ? "Watch" : row.status === "ok" ? "On Track" : "—"}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              )}
            </div>
          </section>

          <section className={`${R} border border-[#e4e7ec] bg-white p-4`}>
            <h2 className="text-sm font-semibold text-[#101828] mb-3">Budget → Forecast Bridge</h2>
            {displayedBridge.length === 0 ? (
              <p className="py-10 text-center text-sm text-[#64748b]">No budget-to-forecast bridge data is available.</p>
            ) : <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={displayedBridge.map((point) => ({
                    key: point.key,
                    label: point.label,
                    budget: point.value ?? 0,
                    delta: point.delta ?? 0,
                  }))}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f2f4f7" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#667085" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#667085" }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: number) => fmtM(v)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="budget" stackId="a" fill="#dbeafe" name="Budget" radius={[0, 0, 0, 0]} />
                  <Bar
                    dataKey="delta"
                    stackId="a"
                    name="Change"
                    radius={[4, 4, 0, 0]}
                  >
                    {displayedBridge.map((point) => (
                      <Cell key={point.key} fill={(point.delta ?? 0) >= 0 ? "#fecaca" : "#bbf7d0"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>}
          </section>

          <section className={`${R} border border-[#e4e7ec] bg-white p-4`}>
            <div className="flex items-center gap-2 mb-4">
              <SlidersHorizontal className="size-4 text-[#0d9488]" />
              <h2 className="text-sm font-semibold text-[#101828]">What-if sensitivity</h2>
            </div>
            {drivers.length === 0 ? <p className="text-sm text-[#667085]">No expense driver was returned, so sensitivity is unavailable.</p> : <div className="flex flex-wrap items-end gap-2">
              <FilterSelect label="Driver" value={drivers.find((driver) => driver.code === driverCode) ? `${drivers.find((driver) => driver.code === driverCode)?.name} · ${driverCode}` : "Select driver"} options={["Select driver", ...driverOptions]} onChange={(value) => {
                const selected = drivers.find((driver) => `${driver.name} · ${driver.code}` === value)
                setDriverCode(selected?.code ?? "")
                const numeric = Number(selected?.value)
                setDriverValue(Number.isFinite(numeric) ? numeric : 0)
                onResetPreview?.()
              }} />
              <input type="number" step="0.1" value={driverValue} onChange={(e) => setDriverValue(Number(e.target.value))} className="h-10 w-32 rounded-full border border-[#d0d5dd] px-4 text-sm" />
              <Button className="rounded-full h-10 px-6" disabled={!driverCode || !Number.isFinite(driverValue) || previewLoading} onClick={() => onPreview?.(driverCode, driverValue)}>
                {previewLoading ? <Loader2 className="size-4 animate-spin" /> : null} Preview
              </Button>
              {preview ? <Button variant="outline" className="rounded-full h-10 px-4" onClick={onResetPreview}>Reset to official</Button> : null}
            </div>}
            {!driverCode && drivers.length > 0 ? <p className="mt-3 text-[11px] text-[#667085]">Choose a returned driver; no driver code has been guessed.</p> : null}
            {previewError ? <p className="mt-3 text-sm text-[#b42318]">{previewError}</p> : null}
          </section>
        </div>

        {detailOpen && selectedDetail ? (
          <aside className="w-full sm:w-[360px] shrink-0 border-l border-[#e4e7ec] bg-white flex flex-col">
            <div className="px-4 py-3 border-b border-[#e4e7ec] flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-[#667085]">{selectedDetail.category ?? "—"} · {selectedDetail.period}</p>
                <h3 className="text-base font-semibold text-[#101828] mt-0.5">{selectedDetail.dept}</h3>
              </div>
              <button type="button" onClick={() => setDetailOpen(false)} className="size-8 rounded-full hover:bg-[#f2f4f7] inline-flex items-center justify-center">
                <X className="size-4 text-[#667085]" />
              </button>
            </div>
            <div className="p-4 space-y-4 overflow-auto flex-1">
              <div className={`${R} bg-[#f9fafb] border border-[#e4e7ec] p-3`}>
                <p className="text-xs text-[#667085]">Variance to Budget</p>
                <p className={cn("text-2xl font-semibold tabular-nums mt-1", selectedDetail.variance === "—" ? "text-[#667085]" : selectedDetail.variance.startsWith("+") ? "text-[#f04438]" : "text-[#12b76a]")}>
                  {selectedDetail.variance}
                </p>
                <p className="text-xs text-[#667085] mt-1">Utilization {selectedDetail.utilization} · HC {selectedDetail.headcount ?? "—"}</p>
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
              <p className="text-sm text-[#667085]">Line-item detail, ownership, and commentary are not included in this domain response.</p>
            </div>
          </aside>
        ) : null}
      </div>

      {infoOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setInfoOpen(false)}>
          <div className={`${R} bg-white max-w-md w-full p-5 shadow-xl`} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-[#101828]">Expense Analysis</h3>
            <p className="text-sm text-[#475569] mt-2 leading-relaxed">
              Track departmental OpEx against budget and run rate. Over-budget alerts highlight areas needing attention. Click rows or chart segments for detail.
            </p>
            <Button variant="outline" className="rounded-full mt-4" onClick={() => setInfoOpen(false)}>Close</Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
