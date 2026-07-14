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
import {
  mockExpCategoryMix,
  mockExpDeptRows,
  mockExpKpis,
  mockExpMonthly,
  mockOverBudget,
} from "@/components/fpa/mock-data"
import {
  planningAvatarTone,
  planningInitials,
} from "@/components/fpa/planning/planning-collab-sidebar"

const R = "rounded-lg"

export type ExpDeptRow = {
  id: string
  dept: string
  category: string
  budget: number
  actual: number
  runRate: number
  forecast: number
  headcount: number
  entity: string
  status: "over" | "watch" | "ok"
}

export type ExpKpi = {
  label: string
  value: string
  delta?: string
  up?: boolean
  spark?: number[]
}

export type ExpDetail = {
  id: string
  dept: string
  category: string
  period: string
  actual: string
  budget: string
  forecast: string
  variance: string
  utilization: string
  headcount: number
  owner: string
  narrative: string
  lineItems: Array<{ name: string; budget: string; actual: string }>
}

const VERSION_SCALE: Record<string, number> = {
  Working: 1,
  Locked: 0.99,
  Published: 0.97,
}

const DEPT_OWNERS: Record<string, string> = {
  Marketing: "Jane Cooper",
  Sales: "Wade Warren",
  IT: "Cody Fisher",
  "G&A": "Robert Fox",
  Engineering: "Leslie Alexander",
  Operations: "Cameron W.",
  "People & Culture": "Esther Howard",
}

function fmtM(n: number): string {
  return `$${n.toFixed(1)}M`
}

function varTone(n: number): string {
  if (Math.abs(n) < 0.05) return "text-[#101828]"
  return n > 0 ? "text-[#f04438]" : "text-[#12b76a]"
}

function statusPill(status: ExpDeptRow["status"]) {
  if (status === "over") return "bg-[#fef3f2] text-[#b42318] border-[#fecdca]"
  if (status === "watch") return "bg-[#fffaeb] text-[#b54708] border-[#fedf89]"
  return "bg-[#ecfdf3] text-[#027a48] border-[#abefc6]"
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
  const varB = row.actual - row.budget
  const util = (row.actual / row.budget) * 100
  const owner = DEPT_OWNERS[row.dept] || "FP&A"
  return {
    id: row.id,
    dept: row.dept,
    category: row.category,
    period,
    actual: fmtM(row.actual),
    budget: fmtM(row.budget),
    forecast: fmtM(row.forecast),
    variance: `${varB >= 0 ? "+" : ""}${fmtM(varB)}`,
    utilization: `${util.toFixed(1)}%`,
    headcount: row.headcount,
    owner,
    narrative:
      varB > 0
        ? `${row.dept} is ${util.toFixed(0)}% of budget with run rate trending ${row.runRate > row.budget ? "above" : "in line with"} plan. Primary driver: ${row.category.toLowerCase()}.`
        : `${row.dept} is tracking under budget with favorable ${row.category.toLowerCase()} spend.`,
    lineItems: [
      { name: row.category, budget: fmtM(row.budget * 0.7), actual: fmtM(row.actual * 0.72) },
      { name: "Other OpEx", budget: fmtM(row.budget * 0.3), actual: fmtM(row.actual * 0.28) },
    ],
  }
}

export function mapMockExpDepts(): ExpDeptRow[] {
  return mockExpDeptRows.map((r) => ({ ...r }))
}

export function mapMockExpKpis(): ExpKpi[] {
  return mockExpKpis.map((k) => ({ ...k }))
}

type ExpensesAnalysisViewProps = {
  loading?: boolean
  kpis?: ExpKpi[]
  deptRows?: ExpDeptRow[]
  periodLabel?: string
  onRefresh?: () => void
}

export function ExpensesAnalysisView({
  loading = false,
  kpis = mapMockExpKpis(),
  deptRows = mapMockExpDepts(),
  periodLabel = "May 2025",
  onRefresh,
}: ExpensesAnalysisViewProps) {
  const [entity, setEntity] = useState("All Entities")
  const [department, setDepartment] = useState("All Departments")
  const [category, setCategory] = useState("All Categories")
  const [version, setVersion] = useState("Working")
  const [period, setPeriod] = useState(periodLabel)
  const [view, setView] = useState("Department View")
  const [detailOpen, setDetailOpen] = useState(true)
  const [selectedDetail, setSelectedDetail] = useState<ExpDetail | null>(
    detailForDept(deptRows[0], periodLabel),
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

  const filteredRows = useMemo(() => {
    let rows = deptRows.map((r) => ({
      ...r,
      budget: r.budget * versionFactor,
      actual: r.actual * versionFactor,
      runRate: r.runRate * versionFactor,
      forecast: r.forecast * versionFactor,
    }))
    if (entity !== "All Entities") rows = rows.filter((r) => r.entity === entity)
    if (department !== "All Departments") rows = rows.filter((r) => r.dept === department)
    if (category !== "All Categories") rows = rows.filter((r) => r.category === category)
    return rows
  }, [deptRows, entity, department, category, versionFactor])

  const categoryChartData = useMemo(() => {
    if (view !== "Category View") return mockExpCategoryMix
    const byCat = new Map<string, number>()
    for (const row of filteredRows) {
      byCat.set(row.category, (byCat.get(row.category) || 0) + row.actual)
    }
    const colors = ["#2563eb", "#7c3aed", "#0d9488", "#f59e0b", "#64748b", "#94a3b8"]
    return [...byCat.entries()].map(([name, value], i) => ({
      name,
      value,
      color: colors[i % colors.length],
    }))
  }, [filteredRows, view])

  const overBudgetAlerts = useMemo(() => {
    return mockOverBudget.filter((ob) => {
      if (department !== "All Departments" && ob.dept !== department) return false
      return true
    })
  }, [department])

  const totalOpex = filteredRows.reduce((s, r) => s + r.actual, 0)

  const adjustedKpis = useMemo(() => {
    return kpis.map((k, i) => {
      if (i === 0) return { ...k, value: fmtM(totalOpex) }
      return k
    })
  }, [kpis, totalOpex])

  const resetFilters = () => {
    setEntity("All Entities")
    setDepartment("All Departments")
    setCategory("All Categories")
    setVersion("Working")
    setPeriod(periodLabel)
    setView("Department View")
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
            <FilterSelect
              label="Entity"
              value={entity}
              options={["All Entities", "North America", "EMEA", "APAC", "LATAM"]}
              onChange={setEntity}
            />
            <FilterSelect
              label="Department"
              value={department}
              options={[
                "All Departments",
                "Marketing",
                "Sales",
                "IT",
                "G&A",
                "Engineering",
                "Operations",
                "People & Culture",
              ]}
              onChange={setDepartment}
            />
            <FilterSelect
              label="Category"
              value={category}
              options={["All Categories", "Advertising", "Commissions", "Software", "Payroll", "Facilities", "Professional Fees"]}
              onChange={setCategory}
            />
            <FilterSelect label="Version" value={version} options={["Working", "Locked", "Published"]} onChange={setVersion} />
            <FilterSelect
              label="Period"
              value={period}
              options={["May 2025", "Apr 2025", "Mar 2025", "FY2025", "FY2026"]}
              onChange={setPeriod}
            />
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
        </div>

        <div className="px-4 sm:px-5 pb-4">
          {loading ? (
            <div className="flex items-center gap-2 py-8 text-[#64748b]">
              <Loader2 className="size-5 animate-spin" /> Loading expenses…
            </div>
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
                    key={ob.dept}
                    type="button"
                    onClick={() => {
                      const row = deptRows.find((r) => r.dept === ob.dept)
                      if (row) pickDept(row)
                      else toast.message(ob.dept, { description: ob.variance })
                    }}
                    className={`${R} border border-[#fecdca] bg-white px-3 py-2 text-left hover:border-[#f97066] transition-colors`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="size-7 rounded-full inline-flex items-center justify-center text-[10px] font-semibold text-white shrink-0"
                        style={{ backgroundColor: ob.avatar }}
                      >
                        {ob.initials}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#101828] truncate">{ob.dept}</p>
                        <p className="text-xs text-[#b42318]">{ob.variance}</p>
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
              <div className="h-[240px] flex items-center">
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
              </div>
            </section>

            <section className={`${R} border border-[#e4e7ec] bg-white p-4`}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-[#101828]">Monthly Burn</h2>
                <span className="text-xs text-[#667085]">Budget vs Actual vs Forecast</span>
              </div>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={mockExpMonthly} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f2f4f7" />
                    <XAxis dataKey="m" tick={{ fontSize: 10, fill: "#667085" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#667085" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e4e7ec", fontSize: 12 }} />
                    <Bar dataKey="budget" fill="#e0e7ff" radius={[3, 3, 0, 0]} name="Budget" />
                    <Line type="monotone" dataKey="actual" stroke="#f04438" strokeWidth={2} dot={{ r: 3 }} name="Actual" />
                    <Line type="monotone" dataKey="forecast" stroke="#64748b" strokeWidth={2} strokeDasharray="4 4" dot={false} name="Forecast" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
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
                    <button type="button" onClick={() => { onRefresh?.(); toast.message("Data refreshed") }} className="w-full px-3 py-2 text-left text-xs hover:bg-[#f9fafb] flex items-center gap-2">
                      <RefreshCw className="size-3.5" /> Refresh
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="overflow-x-auto">
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
                  {filteredRows.map((row) => {
                    const varB = row.actual - row.budget
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
                        <td className="px-4 py-3 text-[#667085]">{row.category}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-[#667085]">{fmtM(row.budget)}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium">{fmtM(row.actual)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{fmtM(row.runRate)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{fmtM(row.forecast)}</td>
                        <td className={cn("px-4 py-3 text-right tabular-nums font-medium", varTone(varB))}>
                          {varB >= 0 ? "+" : ""}{fmtM(varB)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-[#667085]">{row.headcount}</td>
                        <td className="px-4 py-3">
                          <span className={cn("inline-flex px-2 py-0.5 text-[11px] font-medium border rounded-full capitalize", statusPill(row.status))}>
                            {row.status === "over" ? "Over" : row.status === "watch" ? "Watch" : "On Track"}
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
            <h2 className="text-sm font-semibold text-[#101828] mb-3">Budget → Forecast Bridge</h2>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={filteredRows.slice(0, 5).map((r) => ({
                    dept: r.dept.split(" ")[0],
                    budget: r.budget,
                    delta: r.forecast - r.budget,
                    forecast: r.forecast,
                  }))}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f2f4f7" />
                  <XAxis dataKey="dept" tick={{ fontSize: 10, fill: "#667085" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#667085" }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: number) => fmtM(v)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="budget" stackId="a" fill="#dbeafe" name="Budget" radius={[0, 0, 0, 0]} />
                  <Bar
                    dataKey="delta"
                    stackId="a"
                    name="Change"
                    radius={[4, 4, 0, 0]}
                    onClick={(data) => {
                      const row = filteredRows.find((r) => r.dept.startsWith(String(data.dept)))
                      if (row) pickDept(row)
                    }}
                  >
                    {filteredRows.slice(0, 5).map((r, i) => (
                      <Cell key={i} fill={r.forecast >= r.budget ? "#fecaca" : "#bbf7d0"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        {detailOpen && selectedDetail ? (
          <aside className="w-full sm:w-[360px] shrink-0 border-l border-[#e4e7ec] bg-white flex flex-col">
            <div className="px-4 py-3 border-b border-[#e4e7ec] flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-[#667085]">{selectedDetail.category} · {selectedDetail.period}</p>
                <h3 className="text-base font-semibold text-[#101828] mt-0.5">{selectedDetail.dept}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className="size-7 rounded-full inline-flex items-center justify-center text-[10px] font-semibold text-white shrink-0"
                    style={{ backgroundColor: planningAvatarTone(selectedDetail.owner) }}
                  >
                    {planningInitials(selectedDetail.owner)}
                  </span>
                  <span className="text-xs text-[#667085]">{selectedDetail.owner}</span>
                </div>
              </div>
              <button type="button" onClick={() => setDetailOpen(false)} className="size-8 rounded-full hover:bg-[#f2f4f7] inline-flex items-center justify-center">
                <X className="size-4 text-[#667085]" />
              </button>
            </div>
            <div className="p-4 space-y-4 overflow-auto flex-1">
              <div className={`${R} bg-[#f9fafb] border border-[#e4e7ec] p-3`}>
                <p className="text-xs text-[#667085]">Variance to Budget</p>
                <p className={cn("text-2xl font-semibold tabular-nums mt-1", selectedDetail.variance.startsWith("+") ? "text-[#f04438]" : "text-[#12b76a]")}>
                  {selectedDetail.variance}
                </p>
                <p className="text-xs text-[#667085] mt-1">Utilization {selectedDetail.utilization} · HC {selectedDetail.headcount}</p>
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
                <p className="text-xs font-semibold text-[#344054] mb-2">Line Items</p>
                <ul className="space-y-2">
                  {selectedDetail.lineItems.map((li) => (
                    <li key={li.name} className={`${R} border border-[#e4e7ec] px-3 py-2 flex justify-between text-sm`}>
                      <span className="text-[#667085]">{li.name}</span>
                      <span>
                        <span className="font-medium tabular-nums">{li.actual}</span>
                        <span className="text-[#98a2b3] text-xs ml-2">/ {li.budget}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-sm text-[#475569] leading-relaxed">{selectedDetail.narrative}</p>
              <Button variant="gradient-info" className="rounded-full h-10 w-full shadow-sm" onClick={() => toast.message("Request commentary", { description: `Notify ${selectedDetail.owner} for ${selectedDetail.dept}` })}>
                Request Commentary
              </Button>
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
