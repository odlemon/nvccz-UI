"use client"

import { useMemo, useState } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import {
  Clock,
  Gauge,
  Briefcase,
  Building2,
  CalendarOff,
  HelpCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  FileClock,
  AlertTriangle,
  TrendingDown,
  Target,
  Coins,
  ShieldAlert,
} from "lucide-react"
import { toast } from "sonner"
import { PerformanceMockTopChrome } from "@/components/performance-mock/shell"
import { PmButton, PmCard, PmFilterSelect, PmMetricCard, PmPageHeader, PmSelectChip, PmStatusPill } from "@/components/performance-mock/primitives"
import { cn } from "@/lib/utils"

const departments = ["All Departments", "Investments", "Client Solutions", "Portfolio Monitoring", "Risk & Compliance", "Finance & Operations", "People & Culture"]
const teamsList = ["All Teams", "Investment Team", "Client Solutions", "Portfolio Monitoring", "Risk & Compliance", "Finance & Operations", "People & Culture"]
const projectsList = ["All Projects", "Client Reporting Automation", "Valuation Model Upgrade", "New Fund Launch", "ERP Data Migration"]
const objectivesList = [
  "All Objectives",
  "Grow client assets under management",
  "Improve client experience",
  "Enhance portfolio performance",
  "Reduce portfolio reporting turnaround",
  "Build organisation capability",
  "Strengthen risk & compliance",
]
const employeesFilterList = ["All Employees", "Tariro Ncube", "Rudo Chikore", "Farai Moyo", "Nyasha Moyo", "Chipo Mhlanga", "Tendai Sibanda", "Blessing Dube", "Brandon Mandiza", "Lerato Mutasa", "Vimbai Chitauro"]

const weeklyCapacity = [
  { week: "30 Jun–4 Jul", available: 1000, logged: 760 },
  { week: "7–11 Jul", available: 940, logged: 820 },
  { week: "14–18 Jul", available: 940, logged: 880 },
  { week: "21–25 Jul", available: 940, logged: 780 },
  { week: "26–27 Jul", available: 376, logged: 316 },
]

const timeAllocationRaw = [
  { objective: "Grow client assets under management", hours: 842 },
  { objective: "Improve client experience", hours: 602 },
  { objective: "Enhance portfolio performance", hours: 514 },
  { objective: "Reduce portfolio reporting turnaround", hours: 486 },
  { objective: "Build organisation capability", hours: 276 },
  { objective: "Strengthen risk & compliance", hours: 152 },
]
const timeAllocationTotal = timeAllocationRaw.reduce((s, r) => s + r.hours, 0)
const timeAllocation = timeAllocationRaw.map((r) => ({ ...r, pct: (r.hours / timeAllocationTotal) * 100 }))

type HeatRow = { team: string; days: number[] }
const heatDays = ["Mon", "Tue", "Wed", "Thu", "Fri"]
const heatmapRows: HeatRow[] = [
  { team: "Investment Team", days: [92, 78, 104, 83, 79] },
  { team: "Client Solutions", days: [78, 91, 83, 79, 84] },
  { team: "Portfolio Monitoring", days: [88, 84, 86, 92, 90] },
  { team: "Risk & Compliance", days: [70, 76, 92, 84, 95] },
  { team: "Finance & Operations", days: [99, 92, 84, 97, 92] },
  { team: "People & Culture", days: [64, 68, 84, 66, 67] },
]

function heatAvg(days: number[]) {
  return days.reduce((s, v) => s + v, 0) / days.length
}
function heatCellStyle(v: number) {
  if (v >= 100) return { bg: "#FEE2E2", text: "#991B1B" }
  if (v >= 90) return { bg: "#D1FAE5", text: "#065F46" }
  if (v >= 75) return { bg: "#F3F4F6", text: "#374151" }
  return { bg: "#FEF3C7", text: "#92400E" }
}

type EmployeeRow = {
  id: string
  name: string
  role: string
  dept: string
  available: number
  logged: number
  util: number
  projectHours: number
  internal: number
  leave: number
  unclassified: number
  overtime: number
  compliance: number
  status: "Approved" | "Pending" | "Missing Friday"
}

const employeeRows: EmployeeRow[] = [
  { id: "e1", name: "Tariro Ncube", role: "Head of Strategy", dept: "Investments", available: 176, logged: 132, util: 75, projectHours: 68, internal: 160, leave: 8, unclassified: 0, overtime: 0, compliance: 100, status: "Approved" },
  { id: "e2", name: "Rudo Chikore", role: "Investment Analyst", dept: "Investments", available: 184, logged: 192, util: 104, projectHours: 160, internal: 8, leave: 0, unclassified: 24, overtime: 8, compliance: 100, status: "Approved" },
  { id: "e3", name: "Farai Moyo", role: "Portfolio Manager", dept: "Portfolio Monitoring", available: 184, logged: 181, util: 98, projectHours: 144, internal: 10, leave: 0, unclassified: 27, overtime: 0, compliance: 100, status: "Approved" },
  { id: "e4", name: "Nyasha Moyo", role: "Client Solutions Lead", dept: "Client Solutions", available: 184, logged: 156, util: 85, projectHours: 110, internal: 30, leave: 16, unclassified: 0, overtime: 0, compliance: 100, status: "Approved" },
  { id: "e5", name: "Chipo Mhlanga", role: "Risk & Compliance Mgr", dept: "Risk & Compliance", available: 184, logged: 134, util: 73, projectHours: 58, internal: 76, leave: 0, unclassified: 0, overtime: 0, compliance: 100, status: "Approved" },
  { id: "e6", name: "Tendai Sibanda", role: "Finance Manager", dept: "Finance & Operations", available: 184, logged: 176, util: 96, projectHours: 100, internal: 68, leave: 8, unclassified: 0, overtime: 0, compliance: 100, status: "Approved" },
  { id: "e7", name: "Blessing Dube", role: "Operations Lead", dept: "Finance & Operations", available: 188, logged: 192, util: 102, projectHours: 94, internal: 62, leave: 0, unclassified: 36, overtime: 4, compliance: 88, status: "Missing Friday" },
  { id: "e8", name: "Brandon Mandiza", role: "Data & Reporting Analyst", dept: "Portfolio Monitoring", available: 184, logged: 149, util: 81, projectHours: 88, internal: 42, leave: 0, unclassified: 19, overtime: 0, compliance: 100, status: "Approved" },
  { id: "e9", name: "Lerato Mutasa", role: "HR Business Partner", dept: "People & Culture", available: 184, logged: 138, util: 75, projectHours: 40, internal: 74, leave: 24, unclassified: 0, overtime: 0, compliance: 100, status: "Approved" },
  { id: "e10", name: "Vimbai Chitauro", role: "Executive Assistant", dept: "People & Culture", available: 176, logged: 120, util: 68, projectHours: 24, internal: 72, leave: 24, unclassified: 0, overtime: 0, compliance: 100, status: "Approved" },
]

const TOTAL_EMPLOYEES = 42
const PAGE_SIZE = employeeRows.length

function statusTone(status: EmployeeRow["status"]): "success" | "warning" | "danger" {
  if (status === "Approved") return "success"
  if (status === "Pending") return "warning"
  return "danger"
}

export function TimesheetsMockScreen() {
  const [department, setDepartment] = useState(departments[0])
  const [team, setTeam] = useState(teamsList[0])
  const [project, setProject] = useState(projectsList[0])
  const [objective, setObjective] = useState(objectivesList[0])
  const [employee, setEmployee] = useState(employeesFilterList[0])
  const [dateRange, setDateRange] = useState("30 Jun – 27 Jul 2026")
  const [page, setPage] = useState(1)
  const totalPages = Math.ceil(TOTAL_EMPLOYEES / PAGE_SIZE)

  const filteredRows = useMemo(() => {
    return employeeRows.filter((r) => {
      if (department !== departments[0] && r.dept !== department) return false
      if (employee !== employeesFilterList[0] && r.name !== employee) return false
      return true
    })
  }, [department, employee])

  const heatWithAvg = heatmapRows.map((r) => ({ ...r, avg: heatAvg(r.days) }))

  return (
    <div className="min-h-full">
      <PerformanceMockTopChrome breadcrumbs={["Performance Management", "Operations", "Timesheets"]} searchPlaceholder="Search employee or project…" />
      <div className="p-4 lg:p-5 space-y-3">
        <PmPageHeader
          title="Timesheet Analytics · July 2026"
          subtitle="Insight into capacity, utilisation and time allocation to drive strategy execution."
          actions={
            <>
              <PmButton variant="outline" onClick={() => toast("Timesheet data", { description: "Sourced from Timesheets module." })}>
                <FileClock className="h-3.5 w-3.5" /> Timesheet data
              </PmButton>
              <PmButton variant="outline" onClick={() => toast("Payroll cost", { description: "Sourced from Payroll (read-only)." })}>
                <Coins className="h-3.5 w-3.5" /> Payroll cost
              </PmButton>
            </>
          }
        />

        <PmCard className="p-3 flex flex-wrap items-center gap-2">
          <PmFilterSelect label="Department" value={department} options={departments} onChange={setDepartment} />
          <PmFilterSelect label="Team" value={team} options={teamsList} onChange={setTeam} />
          <PmFilterSelect label="Project" value={project} options={projectsList} onChange={setProject} />
          <PmFilterSelect label="Objective" value={objective} options={objectivesList} onChange={setObjective} />
          <PmFilterSelect label="Employee" value={employee} options={employeesFilterList} onChange={setEmployee} />
          <PmSelectChip label={`Date range: ${dateRange}`} onClick={() => setDateRange((d) => (d.startsWith("30 Jun") ? "1 – 28 Jun 2026" : "30 Jun – 27 Jul 2026"))} />
        </PmCard>

        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-3">
          <PmMetricCard label="Logged hours" value="2,846h" trend="▲ 7.3% vs Jun 2026" trendPositive icon={<Clock className="h-4 w-4" />} />
          <PmMetricCard label="Capacity utilisation" value="87%" trend="▲ 4pp" trendPositive icon={<Gauge className="h-4 w-4" />} />
          <PmMetricCard label="Project / Portfolio work" value="68%" trend="1,937h" icon={<Briefcase className="h-4 w-4" />} />
          <PmMetricCard label="Internal work" value="19%" trend="540h" icon={<Building2 className="h-4 w-4" />} />
          <PmMetricCard label="Leave" value="8%" trend="224h" icon={<CalendarOff className="h-4 w-4" />} />
          <PmMetricCard label="Unclassified" value="5%" trend="145h" trendPositive={false} icon={<HelpCircle className="h-4 w-4" />} iconBg="#FEE2E2" />
          <PmMetricCard label="Submission compliance" value="94%" trend="▲ 3pp vs Jun 2026" trendPositive icon={<CheckCircle2 className="h-4 w-4" />} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-4">
          <PmCard className="p-4">
            <h3 className="text-sm font-semibold text-[#111827] mb-1">Capacity vs logged hours (weekly)</h3>
            <p className="text-[11px] text-[#6B7280] mb-2">Available capacity (h) vs Logged hours (h)</p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyCapacity} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 9, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="available" name="Available capacity (h)" fill="#DDD6FE" radius={[3, 3, 0, 0]} barSize={16} />
                  <Bar dataKey="logged" name="Logged hours (h)" fill="#7C3AED" radius={[3, 3, 0, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </PmCard>

          <PmCard className="p-4">
            <h3 className="text-sm font-semibold text-[#111827] mb-3">Time allocation by strategic objective (hours)</h3>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[10px] uppercase tracking-wide text-[#9CA3AF]">
                  <th className="pb-2 font-semibold">Strategic Objective</th>
                  <th className="pb-2 font-semibold text-right">Hours</th>
                  <th className="pb-2 font-semibold text-right w-16">% of total</th>
                </tr>
              </thead>
              <tbody>
                {timeAllocation.map((r) => (
                  <tr key={r.objective} className="border-t border-[#F1F5F9]">
                    <td className="py-2 pr-2">
                      <p className="text-[#374151]">{r.objective}</p>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-[#F3F4F6] overflow-hidden">
                        <div className="h-full rounded-full bg-[#7C3AED]" style={{ width: `${(r.hours / timeAllocationRaw[0].hours) * 100}%` }} />
                      </div>
                    </td>
                    <td className="py-2 pr-2 text-right font-semibold text-[#111827] whitespace-nowrap">{r.hours}</td>
                    <td className="py-2 text-right text-[#6B7280] whitespace-nowrap">{r.pct.toFixed(1)}%</td>
                  </tr>
                ))}
                <tr className="border-t border-[#E5E7EB] font-semibold">
                  <td className="py-2 text-[#111827]">Total</td>
                  <td className="py-2 text-right text-[#111827]">{timeAllocationTotal.toLocaleString()}</td>
                  <td className="py-2 text-right text-[#111827]">100%</td>
                </tr>
              </tbody>
            </table>
          </PmCard>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
          <div className="space-y-3">
            <PmCard className="p-4 overflow-x-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[#111827]">Team capacity heatmap (Logged hours vs capacity %)</h3>
              </div>
              <table className="w-full text-left text-xs min-w-[520px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wide text-[#9CA3AF]">
                    <th className="pb-2 font-semibold pr-2">Team</th>
                    {heatDays.map((d) => (
                      <th key={d} className="pb-2 font-semibold text-center px-1">
                        {d}
                      </th>
                    ))}
                    <th className="pb-2 font-semibold text-center px-1">Avg.</th>
                  </tr>
                </thead>
                <tbody>
                  {heatWithAvg.map((row) => (
                    <tr key={row.team} className="border-t border-[#F1F5F9]">
                      <td className="py-2 pr-2 font-medium text-[#111827] whitespace-nowrap">{row.team}</td>
                      {row.days.map((v, i) => {
                        const c = heatCellStyle(v)
                        return (
                          <td key={i} className="py-1.5 px-1 text-center">
                            <span className="inline-flex items-center justify-center rounded-md px-1.5 py-1 font-semibold w-full" style={{ backgroundColor: c.bg, color: c.text }}>
                              {v}%
                            </span>
                          </td>
                        )
                      })}
                      <td className="py-1.5 px-1 text-center font-semibold text-[#111827]">{row.avg.toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-3 pt-2 border-t border-[#F1F5F9] flex items-center gap-3 text-[10px] text-[#6B7280]">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-[#FEF3C7]" /> &lt;75%
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-[#F3F4F6]" /> 75–90%
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-[#D1FAE5]" /> 90–100%
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-[#FEE2E2]" /> &gt;100%
                </span>
              </div>
            </PmCard>

            <PmCard className="p-4 overflow-x-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[#111827]">Employee timesheet summary</h3>
                <PmButton variant="outline" onClick={() => toast.success("Export started", { description: "Utilisation report will download shortly." })}>
                  <Download className="h-3.5 w-3.5" /> Export
                </PmButton>
              </div>
              <table className="w-full text-left text-xs min-w-[860px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wide text-[#9CA3AF]">
                    <th className="pb-2 font-semibold pr-2">Employee</th>
                    <th className="pb-2 font-semibold pr-2">Role</th>
                    <th className="pb-2 font-semibold pr-2 text-right">Available</th>
                    <th className="pb-2 font-semibold pr-2 text-right">Logged</th>
                    <th className="pb-2 font-semibold pr-2 text-right">Utilisation</th>
                    <th className="pb-2 font-semibold pr-2 text-right">Project</th>
                    <th className="pb-2 font-semibold pr-2 text-right">Internal</th>
                    <th className="pb-2 font-semibold pr-2 text-right">Leave</th>
                    <th className="pb-2 font-semibold pr-2 text-right">Unclass.</th>
                    <th className="pb-2 font-semibold pr-2 text-right">Overtime</th>
                    <th className="pb-2 font-semibold pr-2 text-right">Compl.</th>
                    <th className="pb-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((r) => (
                    <tr key={r.id} className="border-t border-[#F1F5F9] hover:bg-[#FAFAFA]">
                      <td className="py-2.5 pr-2 font-medium text-[#111827] whitespace-nowrap">{r.name}</td>
                      <td className="py-2.5 pr-2 text-[#6B7280] whitespace-nowrap">{r.role}</td>
                      <td className="py-2.5 pr-2 text-right text-[#374151]">{r.available}h</td>
                      <td className={cn("py-2.5 pr-2 text-right font-semibold", r.util >= 100 ? "text-[#DC2626]" : "text-[#111827]")}>{r.logged}h</td>
                      <td className={cn("py-2.5 pr-2 text-right font-semibold", r.util >= 100 ? "text-[#DC2626]" : r.util < 75 ? "text-[#D97706]" : "text-[#111827]")}>{r.util}%</td>
                      <td className="py-2.5 pr-2 text-right text-[#6B7280]">{r.projectHours}h</td>
                      <td className="py-2.5 pr-2 text-right text-[#6B7280]">{r.internal}h</td>
                      <td className="py-2.5 pr-2 text-right text-[#6B7280]">{r.leave}h</td>
                      <td className={cn("py-2.5 pr-2 text-right", r.unclassified > 0 ? "text-[#DC2626] font-medium" : "text-[#6B7280]")}>{r.unclassified}h</td>
                      <td className="py-2.5 pr-2 text-right text-[#6B7280]">{r.overtime}h</td>
                      <td className="py-2.5 pr-2 text-right text-[#6B7280]">{r.compliance}%</td>
                      <td className="py-2.5">
                        <PmStatusPill label={r.status} tone={statusTone(r.status)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-3 pt-3 border-t border-[#F1F5F9] flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-[#6B7280]">
                  Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, TOTAL_EMPLOYEES)} of {TOTAL_EMPLOYEES} employees
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="h-7 w-7 rounded-md border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] disabled:opacity-40"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPage(i + 1)}
                      className={cn(
                        "h-7 w-7 rounded-md text-xs font-semibold flex items-center justify-center",
                        page === i + 1 ? "bg-[#7C3AED] text-white" : "border border-[#E5E7EB] text-[#6B7280]"
                      )}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="h-7 w-7 rounded-md border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] disabled:opacity-40"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-xs text-[#6B7280] ml-1">10 / page</span>
                </div>
              </div>
            </PmCard>
          </div>

          <div className="space-y-3">
            <PmCard className="p-4">
              <h3 className="text-sm font-semibold text-[#111827] mb-3">Insights & exceptions</h3>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[11px] font-semibold text-[#991B1B] inline-flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" /> Over capacity (&gt;100%)
                  </p>
                </div>
                <div className="space-y-1.5">
                  {[
                    { name: "Rudo Chikore", v: "104%", delta: "+8h" },
                    { name: "Blessing Dube", v: "102%", delta: "+4h" },
                    { name: "Tatenda Makoni", v: "101%", delta: "+2h" },
                  ].map((o) => (
                    <div key={o.name} className="flex items-center justify-between text-[11px]">
                      <span className="text-[#374151] truncate">{o.name}</span>
                      <span className="text-[#DC2626] font-semibold shrink-0">
                        {o.v} <span className="text-[#9CA3AF] font-normal">{o.delta}</span>
                      </span>
                    </div>
                  ))}
                </div>
                <button type="button" className="mt-1.5 text-[11px] font-medium text-[#7C3AED] hover:underline">
                  View all 5 over capacity →
                </button>
              </div>

              <div className="mb-4 pt-3 border-t border-[#F1F5F9]">
                <p className="text-[11px] font-semibold text-[#92400E] inline-flex items-center gap-1.5 mb-1.5">
                  <TrendingDown className="h-3.5 w-3.5" /> Under recorded time (&lt;75% utilisation)
                </p>
                <div className="space-y-1.5">
                  {[
                    { name: "Vimbai Chitauro", v: "68%", delta: "-58h" },
                    { name: "Lerato Mutasa", v: "75%", delta: "-46h" },
                    { name: "Chipo Mhlanga", v: "75%", delta: "-50h" },
                  ].map((o) => (
                    <div key={o.name} className="flex items-center justify-between text-[11px]">
                      <span className="text-[#374151] truncate">{o.name}</span>
                      <span className="text-[#D97706] font-semibold shrink-0">
                        {o.v} <span className="text-[#9CA3AF] font-normal">{o.delta}</span>
                      </span>
                    </div>
                  ))}
                </div>
                <button type="button" className="mt-1.5 text-[11px] font-medium text-[#7C3AED] hover:underline">
                  View all 6 under recorded →
                </button>
              </div>

              <div className="mb-4 pt-3 border-t border-[#F1F5F9]">
                <p className="text-[11px] font-semibold text-[#111827] mb-1.5">Projects exceeding allocation</p>
                <div className="space-y-1.5">
                  {[
                    { name: "Client Reporting Automation", v: "118%" },
                    { name: "Valuation Model Upgrade", v: "112%" },
                    { name: "New Fund Launch", v: "104%" },
                  ].map((p) => (
                    <div key={p.name} className="flex items-center justify-between text-[11px]">
                      <span className="text-[#374151] truncate">{p.name}</span>
                      <span className="text-[#DC2626] font-semibold shrink-0">{p.v}</span>
                    </div>
                  ))}
                </div>
                <button type="button" className="mt-1.5 text-[11px] font-medium text-[#7C3AED] hover:underline">
                  View all 4 projects →
                </button>
              </div>

              <div className="mb-4 pt-3 border-t border-[#F1F5F9]">
                <p className="text-[11px] font-semibold text-[#111827] inline-flex items-center gap-1.5 mb-1.5">
                  <Target className="h-3.5 w-3.5 text-[#7C3AED]" /> Strategic objective focus
                </p>
                <p className="text-[11px] text-[#374151] leading-snug">Reduce portfolio reporting turnaround</p>
                <div className="mt-1.5 flex items-center justify-between text-[11px]">
                  <span className="text-[#6B7280]">Hours this period</span>
                  <span className="font-semibold text-[#111827]">486h</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#6B7280]">% of total effort</span>
                  <span className="font-semibold text-[#111827]">17.1%</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#6B7280]">vs last period</span>
                  <span className="font-semibold text-[#10B981]">+2.4pp</span>
                </div>
              </div>

              <div className="mb-4 pt-3 border-t border-[#F1F5F9]">
                <p className="text-[11px] font-semibold text-[#111827] inline-flex items-center gap-1.5 mb-1.5">
                  <Coins className="h-3.5 w-3.5 text-[#7C3AED]" /> Effort cost context (read-only)
                </p>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#6B7280]">Payroll cost for logged hours</span>
                  <span className="font-semibold text-[#111827]">ZIG 9.42M</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#6B7280]">Avg cost per hour</span>
                  <span className="font-semibold text-[#111827]">ZIG 3,310</span>
                </div>
                <p className="text-[10px] text-[#9CA3AF] mt-1">Source: Payroll · Jul 2026</p>
              </div>

              <div className="pt-3 border-t border-[#F1F5F9]">
                <p className="text-[11px] font-semibold text-[#92400E] inline-flex items-center gap-1.5 mb-1.5">
                  <ShieldAlert className="h-3.5 w-3.5" /> Data quality exceptions
                </p>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#6B7280]">Unclassified hours</span>
                  <span className="font-semibold text-[#DC2626]">145h (5%)</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#6B7280]">Missing timesheets</span>
                  <span className="font-semibold text-[#111827]">3 employees</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#6B7280]">Late submissions</span>
                  <span className="font-semibold text-[#111827]">4 employees</span>
                </div>
                <button type="button" className="mt-1.5 text-[11px] font-medium text-[#7C3AED] hover:underline">
                  View data quality report →
                </button>
              </div>
            </PmCard>

            <PmCard className="p-3 space-y-2">
              <PmButton variant="primary" className="w-full" onClick={() => toast("Employee timesheet", { description: "Opening timesheet detail view." })}>
                Open employee timesheet
              </PmButton>
              <PmButton variant="outline" className="w-full" onClick={() => toast.success("Capacity action created", { description: "Logged to Corrective Actions." })}>
                Create capacity action
              </PmButton>
              <PmButton variant="outline" className="w-full" onClick={() => toast.success("Export started", { description: "Utilisation report will download shortly." })}>
                Export utilisation report
              </PmButton>
              <p className="text-[10px] text-[#9CA3AF] pt-1 leading-snug">Hours inform capacity planning and evidence. They're not used for performance ratings.</p>
            </PmCard>
          </div>
        </div>
      </div>
    </div>
  )
}
