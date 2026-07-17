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
  Users,
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

export type WfDeptRow = {
  id: string
  dept: string
  entity: string | null
  hc: number | null
  budgetHc: number | null
  salary: number | null
  avgSalary: number | null
  hires: number | null
  attrition: number | null
  openRoles: number | null
  status?: "hiring" | "on-track" | "under" | "over"
}

export type WfKpi = {
  label: string
  value: string
  delta?: string
  up?: boolean
  spark?: number[]
}

export type WfHirePlanPoint = { period: string; planned: number; actual: number }
export type WfAttritionPoint = { period: string; pct: number }

export type WfDetail = {
  id: string
  dept: string
  entity: string | null
  period: string
  headcount: number | null
  budgetHc: number | null
  salary: string
  avgSalary: string
  netHires: number | null
  attrition: number | null
  openRoles: number | null
}

function fmtM(n: number | null): string {
  return n == null ? "—" : `$${n.toFixed(1)}M`
}

function statusPill(status: WfDeptRow["status"]) {
  if (status === "hiring") return "bg-[#eff8ff] text-[#175cd3] border-[#b2ddff]"
  if (status === "over") return "bg-[#fef3f2] text-[#b42318] border-[#fecdca]"
  if (status === "under") return "bg-[#fffaeb] text-[#b54708] border-[#fedf89]"
  return status === "on-track" ? "bg-[#ecfdf3] text-[#027a48] border-[#abefc6]" : "bg-[#f2f4f7] text-[#667085] border-[#e4e7ec]"
}

function statusLabel(status: WfDeptRow["status"]) {
  if (status === "hiring") return "Hiring"
  if (status === "over") return "Over Plan"
  if (status === "under") return "Under Plan"
  return status === "on-track" ? "On Track" : "—"
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


function WfKpiCard({ kpi, onClick }: { kpi: WfKpi; onClick?: () => void }) {
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
      {kpi.spark ? <KpiSparkline values={kpi.spark} color="#7c3aed" /> : null}
    </button>
  )
}

export function detailForDept(row: WfDeptRow, period: string): WfDetail {
  return {
    id: row.id,
    dept: row.dept,
    entity: row.entity,
    period,
    headcount: row.hc,
    budgetHc: row.budgetHc,
    salary: fmtM(row.salary),
    avgSalary: row.avgSalary == null ? "—" : `$${row.avgSalary}K`,
    netHires: row.hires,
    attrition: row.attrition,
    openRoles: row.openRoles,
  }
}

type WorkforceAnalysisViewProps = {
  loading?: boolean
  error?: string
  kpis?: WfKpi[]
  deptRows?: WfDeptRow[]
  hirePlan?: WfHirePlanPoint[]
  attritionTrend?: WfAttritionPoint[]
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
  preview?: { kpis: WfKpi[]; departments: WfDeptRow[]; hirePlan: WfHirePlanPoint[]; attritionTrend: WfAttritionPoint[] }
  previewLoading?: boolean
  previewError?: string
  onPreview?: (driverCode: string, value: number) => void
  onResetPreview?: () => void
}

export function WorkforceAnalysisView({
  loading = false,
  error,
  kpis = [],
  deptRows = [],
  hirePlan = [],
  attritionTrend = [],
  periodLabel = "May 2025",
  onRefresh,
  entities = [],
  availablePeriods = [],
  selectedEntityId = "",
  periodFrom = "",
  periodTo = "",
  appliedScope,
  onEntityChange,
  onPeriodFromChange,
  onPeriodToChange,
  drivers = [],
  preview,
  previewLoading = false,
  previewError,
  onPreview,
  onResetPreview,
}: WorkforceAnalysisViewProps) {
  const displayedKpis = preview?.kpis ?? kpis
  const displayedDeptRows = preview?.departments ?? deptRows
  const displayedHirePlan = preview?.hirePlan ?? hirePlan
  const displayedAttritionTrend = preview?.attritionTrend ?? attritionTrend
  const [department, setDepartment] = useState("All Departments")
  const [view, setView] = useState("Department View")
  const [salaryInflation, setSalaryInflation] = useState(6.0)
  const [driverCode, setDriverCode] = useState("")
  const [detailOpen, setDetailOpen] = useState(true)
  const [selectedDetail, setSelectedDetail] = useState<WfDetail | null>(
    displayedDeptRows[0] ? detailForDept(displayedDeptRows[0], periodLabel) : null,
  )
  const [infoOpen, setInfoOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const entityOptions = useMemo(() => ["All Entities", ...entities.map((option) => option.name)], [entities])
  const departmentOptions = useMemo(() => ["All Departments", ...new Set(displayedDeptRows.map((row) => row.dept).filter(Boolean))], [displayedDeptRows])
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
    if (!driverCode) {
      const relevant = drivers.find((driver) => {
        const value = `${driver.code} ${driver.name}`.toLowerCase()
        return value.includes("salary") && value.includes("inflation")
      })
      if (relevant) {
        setDriverCode(relevant.code)
        const value = Number(relevant.value)
        if (Number.isFinite(value)) setSalaryInflation(value)
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

  const filteredRows = useMemo(() => {
    let rows = displayedDeptRows
    if (department !== "All Departments") rows = rows.filter((r) => r.dept === department)
    return rows
  }, [displayedDeptRows, department])

  const hcChartData = useMemo(() => {
    return filteredRows.filter((r) => r.hc != null || r.budgetHc != null).map((r) => ({
      dept: r.dept.split(" ")[0],
      actual: r.hc,
      budget: r.budgetHc,
      gap: r.hc == null || r.budgetHc == null ? null : r.hc - r.budgetHc,
    }))
  }, [filteredRows])

  const adjustedKpis = displayedKpis
  const chartableAttrition = useMemo(
    () => displayedAttritionTrend.filter((point) => point.period && Number.isFinite(point.pct)),
    [displayedAttritionTrend],
  )

  const resetFilters = () => {
    onEntityChange?.("")
    onPeriodFromChange?.("")
    onPeriodToChange?.("")
    setDepartment("All Departments")
    setView("Department View")
    setSalaryInflation(6.0)
    onResetPreview?.()
    toast.message("Filters reset")
  }

  const pickDept = (row: WfDeptRow) => {
    setSelectedDetail(detailForDept(row, period))
    setDetailOpen(true)
  }

  const exportCsv = () => {
    const header = "Department,Entity,Headcount,Budget HC,Payroll,Hires,Attrition %,Open Roles,Status\n"
    const body = filteredRows
      .map((r) => `${r.dept},${r.entity},${r.hc},${r.budgetHc},${r.salary},${r.hires},${r.attrition},${r.openRoles},${r.status}`)
      .join("\n")
    const blob = new Blob([header + body], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `workforce-${period.replace(/\s/g, "-")}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Workforce export downloaded")
  }

  const hasData = adjustedKpis.length > 0 || displayedDeptRows.length > 0 || displayedHirePlan.length > 0 || chartableAttrition.length > 0
  if (loading && !hasData) return <div className="min-h-full bg-[#f1f5f9] flex items-center justify-center gap-2 text-sm text-[#64748b]"><Loader2 className="size-5 animate-spin" /> Loading workforce analysis…</div>
  if (error && !hasData) return <div className="min-h-full bg-[#f1f5f9] flex items-center justify-center p-8 text-sm text-[#b42318]">{error}</div>

  return (
    <div className="min-h-full bg-[#f1f5f9] flex flex-col">
      <div className="bg-white border-b border-[#e4e7ec]">
        <div className="px-4 sm:px-5 pt-4 pb-3">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-[18px] font-semibold text-[#101828]">Workforce</h1>
            <Button variant="outline" className="rounded-full h-9 px-4 text-xs" onClick={() => onRefresh?.()}>
              <RefreshCw className="size-3.5" />
              Refresh
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap items-end gap-2">
            {entityOptions.length > 1 ? <FilterSelect label="Entity" value={selectedEntityName} options={entityOptions} onChange={(name) => onEntityChange?.(entities.find((option) => option.name === name)?.id ?? "")} /> : null}
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
            <FilterSelect label="View" value={view} options={["Department View", "Hire Plan View"]} onChange={setView} />
            <button type="button" onClick={resetFilters} className="ml-auto mb-0.5 px-1 text-[12px] font-semibold text-[#1570ef] hover:underline">
              Reset Filters
            </button>
          </div>
          <p className="mt-2 text-[11px] text-[#667085]">
            Applied scope: {appliedScope?.entityId ? selectedEntityName : "All entities"} · {appliedScope?.periodFrom || "First period"} → {appliedScope?.periodTo || "Latest period"}
          </p>
        </div>

        <div className="px-4 sm:px-5 pb-4">
          {adjustedKpis.length === 0 ? (
            <p className="py-8 text-sm text-[#64748b]">No workforce KPIs are available.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
              {adjustedKpis.map((k) => (
                <WfKpiCard key={k.label} kpi={k} onClick={() => toast.message(k.label, { description: `${k.value} · ${period}` })} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 p-4 sm:p-5 space-y-4 overflow-auto">
          {preview ? <div className="rounded-lg border border-[#c4b5fd] bg-[#f5f3ff] px-4 py-3 text-xs font-semibold text-[#6d28d9]">Preview · not persisted — cards, charts, and tables below use the preview dataset.</div> : null}
          {loading && hasData ? <p className="text-xs text-[#667085]"><Loader2 className="mr-1 inline size-3 animate-spin" />Refreshing current scope…</p> : null}
          {error && hasData ? <p className="text-sm text-[#b42318]">{error}</p> : null}
          {view === "Hire Plan View" ? (
            <section className={`${R} border border-[#e4e7ec] bg-white p-4`}>
              <div className="flex items-center gap-2 mb-3">
                <Users className="size-4 text-[#7c3aed]" />
                <h2 className="text-sm font-semibold text-[#101828]">Hire Plan vs Actual</h2>
              </div>
              {displayedHirePlan.length === 0 ? (
                <p className="py-12 text-center text-sm text-[#64748b]">No hire plan data is available.</p>
              ) : <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={displayedHirePlan} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f2f4f7" />
                    <XAxis dataKey="period" tick={{ fontSize: 10, fill: "#667085" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#667085" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="planned" fill="#ddd6fe" name="Planned" radius={[3, 3, 0, 0]} />
                    <Line type="monotone" dataKey="actual" stroke="#7c3aed" strokeWidth={2} dot={{ r: 4 }} name="Actual" connectNulls={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>}
            </section>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <section className={`${R} border border-[#e4e7ec] bg-white p-4`}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-[#101828]">Headcount vs Budget</h2>
                  <button type="button" onClick={() => setInfoOpen(true)} className="text-[#98a2b3] hover:text-[#667085]">
                    <Info className="size-4" />
                  </button>
                </div>
                {hcChartData.length === 0 ? (
                  <p className="py-12 text-center text-sm text-[#64748b]">No department headcount data is available.</p>
                ) : <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hcChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f2f4f7" />
                      <XAxis dataKey="dept" tick={{ fontSize: 10, fill: "#667085" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#667085" }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="budget" fill="#e0e7ff" name="Budget HC" radius={[3, 3, 0, 0]} />
                      <Bar
                        dataKey="actual"
                        name="Actual HC"
                        radius={[3, 3, 0, 0]}
                        onClick={(data) => {
                          const row = filteredRows.find((r) => r.dept.startsWith(String(data.dept)))
                          if (row) pickDept(row)
                        }}
                      >
                        {hcChartData.map((entry, i) => (
                          <Cell key={i} fill={entry.gap == null ? "#94a3b8" : entry.gap > 0 ? "#f04438" : entry.gap < 0 ? "#f59e0b" : "#12b76a"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>}
              </section>

              <section className={`${R} border border-[#e4e7ec] bg-white p-4`}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-[#101828]">Attrition Trend</h2>
                  <span className="text-xs text-[#667085]">Rolling 6 months</span>
                </div>
                {chartableAttrition.length === 0 ? (
                  <p className="py-12 text-center text-sm text-[#64748b]">No attrition trend data is available.</p>
                ) : <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartableAttrition} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f2f4f7" />
                      <XAxis dataKey="period" tick={{ fontSize: 10, fill: "#667085" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#667085" }} axisLine={false} tickLine={false} unit="%" />
                      <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                      <Line type="monotone" dataKey="pct" stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 4, fill: "#fff", strokeWidth: 2 }} name="Attrition %" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>}
              </section>
            </div>
          )}

          <section className={`${R} border border-[#e4e7ec] bg-white overflow-hidden`}>
            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#101828]">Department Headcount Plan</h2>
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
              <table className="w-full text-sm min-w-[880px]">
                <thead>
                  <tr className="border-y border-[#e4e7ec] text-left text-xs text-[#667085] bg-[#f9fafb]">
                    <th className="px-4 py-3 font-medium">Department</th>
                    <th className="px-4 py-3 font-medium">Entity</th>
                    <th className="px-4 py-3 font-medium text-right">Headcount</th>
                    <th className="px-4 py-3 font-medium text-right">Budget HC</th>
                    <th className="px-4 py-3 font-medium text-right">Var</th>
                    <th className="px-4 py-3 font-medium text-right">Payroll</th>
                    <th className="px-4 py-3 font-medium text-right">Avg Salary</th>
                    <th className="px-4 py-3 font-medium text-right">Hires</th>
                    <th className="px-4 py-3 font-medium text-right">Attrition</th>
                    <th className="px-4 py-3 font-medium text-right">Open</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.length === 0 ? (
                    <tr><td colSpan={11} className="px-4 py-10 text-center text-sm text-[#64748b]">No department workforce data is available.</td></tr>
                  ) : null}
                  {filteredRows.map((row) => {
                    const varHc = row.hc == null || row.budgetHc == null ? null : row.hc - row.budgetHc
                    return (
                      <tr key={row.id} className="border-t border-[#f2f4f7] hover:bg-[#f9fafb] cursor-pointer" onClick={() => pickDept(row)}>
                        <td className="px-4 py-3">
                          <button type="button" className="font-medium text-[#1570ef] hover:underline text-left">
                            {row.dept}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-[#667085]">{row.entity ?? "—"}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium">{row.hc}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-[#667085]">{row.budgetHc}</td>
                        <td className={cn("px-4 py-3 text-right tabular-nums font-medium", varHc != null && varHc > 0 ? "text-[#f04438]" : varHc != null && varHc < 0 ? "text-[#f59e0b]" : "text-[#667085]")}>
                          {varHc == null ? "—" : `${varHc > 0 ? "+" : ""}${varHc}`}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">{fmtM(row.salary)}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-[#667085]">{row.avgSalary == null ? "—" : `$${row.avgSalary.toFixed(0)}K`}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-[#12b76a]">{row.hires == null ? "—" : `+${row.hires}`}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-[#f04438]">{row.attrition == null ? "—" : `${row.attrition.toFixed(1)}%`}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium">{row.openRoles ?? "—"}</td>
                        <td className="px-4 py-3">
                          <span className={cn("inline-flex px-2 py-0.5 text-[11px] font-medium border rounded-full", statusPill(row.status))}>
                            {statusLabel(row.status)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className={`${R} border border-[#e4e7ec] bg-white p-4`}>
            <div className="flex items-center gap-2 mb-4">
              <SlidersHorizontal className="size-4 text-[#7c3aed]" />
              <h2 className="text-sm font-semibold text-[#101828]">What-if: Salary Inflation</h2>
              <span className="text-xs text-[#667085] ml-auto tabular-nums">{salaryInflation.toFixed(1)}%</span>
            </div>
            {drivers.length === 0 ? <p className="text-sm text-[#667085]">No workforce driver was returned, so this control is unavailable.</p> : <>
              <div className="flex flex-wrap items-end gap-2">
                <FilterSelect label="Driver" value={drivers.find((driver) => driver.code === driverCode) ? `${drivers.find((driver) => driver.code === driverCode)?.name} · ${driverCode}` : "Select driver"} options={["Select driver", ...driverOptions]} onChange={(value) => {
                  const selected = drivers.find((driver) => `${driver.name} · ${driver.code}` === value)
                  setDriverCode(selected?.code ?? "")
                  const numeric = Number(selected?.value)
                  if (Number.isFinite(numeric)) setSalaryInflation(numeric)
                  onResetPreview?.()
                }} />
                <input type="number" step="0.1" value={salaryInflation} onChange={(e) => setSalaryInflation(Number(e.target.value))} className="h-10 w-32 rounded-full border border-[#d0d5dd] px-4 text-sm" />
                <Button className="rounded-full h-10 px-6" disabled={!driverCode || !Number.isFinite(salaryInflation) || previewLoading} onClick={() => onPreview?.(driverCode, salaryInflation)}>
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
                <p className="text-xs text-[#667085]">{selectedDetail.entity ?? "—"} · {selectedDetail.period}</p>
                <h3 className="text-base font-semibold text-[#101828] mt-0.5">{selectedDetail.dept}</h3>
              </div>
              <button type="button" onClick={() => setDetailOpen(false)} className="size-8 rounded-full hover:bg-[#f2f4f7] inline-flex items-center justify-center">
                <X className="size-4 text-[#667085]" />
              </button>
            </div>
            <div className="p-4 space-y-4 overflow-auto flex-1">
              <div className="grid grid-cols-2 gap-2">
                <div className={`${R} border border-[#e4e7ec] p-2 text-center`}>
                  <p className="text-[10px] text-[#667085]">Headcount</p>
                  <p className="text-lg font-semibold tabular-nums">{selectedDetail.headcount ?? "—"}</p>
                  <p className="text-[10px] text-[#98a2b3]">Budget {selectedDetail.budgetHc ?? "—"}</p>
                </div>
                <div className={`${R} border border-[#e4e7ec] p-2 text-center`}>
                  <p className="text-[10px] text-[#667085]">Payroll</p>
                  <p className="text-lg font-semibold tabular-nums">{selectedDetail.salary}</p>
                  <p className="text-[10px] text-[#98a2b3]">Avg {selectedDetail.avgSalary}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: "Net Hires", value: selectedDetail.netHires == null ? "—" : `+${selectedDetail.netHires}` },
                  { label: "Attrition", value: selectedDetail.attrition == null ? "—" : `${selectedDetail.attrition.toFixed(1)}%` },
                  { label: "Open Roles", value: selectedDetail.openRoles == null ? "—" : String(selectedDetail.openRoles) },
                ].map((cell) => (
                  <div key={cell.label} className={`${R} border border-[#e4e7ec] p-2`}>
                    <p className="text-[10px] text-[#667085]">{cell.label}</p>
                    <p className="text-sm font-semibold tabular-nums mt-0.5">{cell.value}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-[#667085]">Role-level details and commentary are not included in this domain response.</p>
            </div>
          </aside>
        ) : null}
      </div>

      {infoOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setInfoOpen(false)}>
          <div className={`${R} bg-white max-w-md w-full p-5 shadow-xl`} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-[#101828]">Workforce Planning</h3>
            <p className="text-sm text-[#475569] mt-2 leading-relaxed">
              Monitor headcount, payroll, hires, and attrition by department. Sensitivity uses a returned workforce driver and replaces the active dataset only as a non-persisted preview.
            </p>
            <Button variant="outline" className="rounded-full mt-4" onClick={() => setInfoOpen(false)}>Close</Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
