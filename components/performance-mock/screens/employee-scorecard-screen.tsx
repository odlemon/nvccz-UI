"use client"

import { Fragment, useMemo, useState } from "react"
import { Plus, PlayCircle, Download, TrendingUp, TrendingDown, Minus, ExternalLink, Pencil } from "lucide-react"
import { toast } from "sonner"
import { PerformanceMockTopChrome } from "@/components/performance-mock/shell"
import { PmButton, PmCard, PmPageHeader, PmStatusPill } from "@/components/performance-mock/primitives"
import { cn } from "@/lib/utils"

type Trend = "up" | "down" | "flat"
type GoalStatus = "On track" | "Needs attention" | "At risk" | "Not started"

type GoalRow = {
  code: string
  title: string
  weight: number
  target: string
  actual: string
  score: number
  trend: Trend
  evidence: string
  status: GoalStatus
}

type Perspective = {
  name: string
  weight: number
  color: string
  goals: GoalRow[]
}

type Employee = {
  id: string
  name: string
  role: string
  manager: string
  department: string
  cycle: string
  quarter: string
  hireDate: string
  employeeId: string
  overall: number
  goalWeighted: number
  competency: number
  checkinsDone: number
  checkinsTotal: number
  timesheetCompliance: number
  lastCheckin: string
  nextCheckin: string
  onTrack: boolean
}

const employees: Employee[] = [
  {
    id: "emp-043",
    name: "Nyasha Moyo",
    role: "Portfolio Analyst",
    manager: "Farai Moyo",
    department: "Investments",
    cycle: "FY2026",
    quarter: "Q3 (Jan – Mar 2026)",
    hireDate: "10 Aug 2022",
    employeeId: "EMP-0043",
    overall: 81.6,
    goalWeighted: 79.2,
    competency: 85.0,
    checkinsDone: 6,
    checkinsTotal: 8,
    timesheetCompliance: 96,
    lastCheckin: "15 May 2026",
    nextCheckin: "31 May 2026",
    onTrack: true,
  },
  {
    id: "emp-021",
    name: "Rudo Chikore",
    role: "Investment Analyst",
    manager: "Tariro Ncube",
    department: "Investments",
    cycle: "FY2026",
    quarter: "Q3 (Jan – Mar 2026)",
    hireDate: "3 Feb 2021",
    employeeId: "EMP-0021",
    overall: 74.3,
    goalWeighted: 72.1,
    competency: 76.8,
    checkinsDone: 5,
    checkinsTotal: 8,
    timesheetCompliance: 88,
    lastCheckin: "12 May 2026",
    nextCheckin: "28 May 2026",
    onTrack: false,
  },
]

const perspectivesByEmployee: Record<string, Perspective[]> = {
  "emp-043": [
    {
      name: "Financial",
      weight: 25,
      color: "#7C3AED",
      goals: [
        { code: "1.1", title: "Support portfolio value growth", weight: 12.5, target: "ZWG 1.5bn (85% of target)", actual: "ZWG 1.32bn", score: 80, trend: "up", evidence: "Q3 Portfolio Report", status: "On track" },
        { code: "1.2", title: "Investment model quality", weight: 12.5, target: "Avg score ≥ 80%", actual: "82%", score: 82, trend: "up", evidence: "Memo Quality Tracker", status: "On track" },
      ],
    },
    {
      name: "Customer & Stakeholder",
      weight: 25,
      color: "#2563EB",
      goals: [
        { code: "2.1", title: "Timely company-report validation", weight: 15, target: "100% on-time", actual: "97% (33 of 34)", score: 87, trend: "flat", evidence: "Validation Tracker", status: "On track" },
        { code: "2.2", title: "Stakeholder satisfaction", weight: 10, target: "≥ 4.0 / 5.0", actual: "4.1 / 5.0", score: 82, trend: "up", evidence: "Stakeholder Survey", status: "On track" },
      ],
    },
    {
      name: "Internal Process",
      weight: 25,
      color: "#10B981",
      goals: [
        { code: "3.1", title: "Financial model accuracy", weight: 12.5, target: "≥ 95% accurate", actual: "94.2%", score: 78, trend: "down", evidence: "Model Audit Log", status: "Needs attention" },
        { code: "3.2", title: "Investment due diligence quality", weight: 12.5, target: "≥ 80% quality score", actual: "76%", score: 76, trend: "down", evidence: "DD Quality Tracker", status: "Needs attention" },
      ],
    },
    {
      name: "Learning & Growth",
      weight: 25,
      color: "#F97316",
      goals: [
        { code: "4.1", title: "Training & technical development", weight: 12.5, target: "≥ 30 hours", actual: "34.5 hrs", score: 92, trend: "up", evidence: "Learning Record", status: "On track" },
        { code: "4.2", title: "Team collaboration", weight: 12.5, target: "≥ 4.0 / 5.0", actual: "4.3 / 5.0", score: 86, trend: "up", evidence: "360 Feedback", status: "On track" },
      ],
    },
  ],
}
perspectivesByEmployee["emp-021"] = perspectivesByEmployee["emp-043"].map((p) => ({
  ...p,
  goals: p.goals.map((g) => ({ ...g, score: Math.max(45, g.score - 12), status: g.score - 12 < 60 ? "At risk" : "Needs attention" })),
}))

type EffortRow = { objective: string; linked: string; hoursLogged: number; hoursPlanned: number; keyActivities: string }
const effortByEmployee: Record<string, EffortRow[]> = {
  "emp-043": [
    { objective: "Grow and protect portfolio value", linked: "1.1", hoursLogged: 118.5, hoursPlanned: 120, keyActivities: "Portfolio analysis, valuation reviews, board packs" },
    { objective: "Disciplined investment process", linked: "3.1, 3.2", hoursLogged: 142.0, hoursPlanned: 150, keyActivities: "Financial modelling, due diligence, risk assessment" },
    { objective: "Stakeholder engagement excellence", linked: "2.1, 2.2", hoursLogged: 62.5, hoursPlanned: 60, keyActivities: "Company-report validation, stakeholder calls, surveys" },
    { objective: "Build capability & high-performing team", linked: "4.1, 4.2", hoursLogged: 34.5, hoursPlanned: 30, keyActivities: "Training, knowledge sharing, team meetings" },
  ],
}
effortByEmployee["emp-021"] = effortByEmployee["emp-043"]

function trendIcon(t: Trend) {
  if (t === "up") return <TrendingUp className="h-3.5 w-3.5 text-[#10B981]" />
  if (t === "down") return <TrendingDown className="h-3.5 w-3.5 text-[#EF4444]" />
  return <Minus className="h-3.5 w-3.5 text-[#9CA3AF]" />
}
function statusTone(s: GoalStatus): "success" | "warning" | "danger" | "neutral" {
  if (s === "On track") return "success"
  if (s === "Needs attention") return "warning"
  if (s === "At risk") return "danger"
  return "neutral"
}
function scoreLabel(score: number) {
  if (score >= 85) return "Exceptional"
  if (score >= 70) return "Good"
  if (score >= 50) return "Fair"
  return "Poor"
}

export function EmployeeScorecardMockScreen() {
  const [employeeId, setEmployeeId] = useState(employees[0].id)
  const [viewBy, setViewBy] = useState("Goals & KPIs")
  const [showCompleted, setShowCompleted] = useState(true)
  const [effortPeriod, setEffortPeriod] = useState("Q3 (Jan – Mar 2026)")

  const employee = employees.find((e) => e.id === employeeId) || employees[0]
  const perspectives = perspectivesByEmployee[employeeId] || []
  const effort = effortByEmployee[employeeId] || []

  const totalWeight = perspectives.reduce((s, p) => s + p.weight, 0)
  const overallScore = employee.overall

  const effortTotals = useMemo(
    () => ({
      logged: effort.reduce((s, r) => s + r.hoursLogged, 0),
      planned: effort.reduce((s, r) => s + r.hoursPlanned, 0),
    }),
    [effort]
  )

  return (
    <div className="min-h-full">
      <PerformanceMockTopChrome breadcrumbs={["Performance Management", "Scorecards", "Employee Scorecard"]} searchPlaceholder="Search employees…" />
      <div className="p-4 lg:p-5 space-y-3">
        <PmPageHeader
          title={`Employee Scorecard · ${employee.name}`}
          subtitle={`${employee.role} · Manager ${employee.manager} · ${employee.department} · Cycle ${employee.cycle} · ${employee.quarter}`}
          actions={
            <>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="h-9 rounded-full border border-[#E5E7EB] bg-white px-3.5 text-sm text-[#374151]"
              >
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
              <PmButton variant="outline" onClick={() => toast("New goal", { description: "Add a new goal or KPI to this scorecard." })}>
                <Plus className="h-3.5 w-3.5" /> Add goal
              </PmButton>
              <PmButton variant="primary" onClick={() => toast.success("Check-in started", { description: `New check-in created for ${employee.name}.` })}>
                <PlayCircle className="h-3.5 w-3.5" /> Start check-in
              </PmButton>
              <PmButton variant="outline" onClick={() => toast.success("Export started", { description: "Scorecard PDF will download shortly." })}>
                <Download className="h-3.5 w-3.5" /> Export
              </PmButton>
            </>
          }
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <PmCard className="p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Overall score</p>
            <p className="mt-1 text-xl font-bold text-[#111827]">{overallScore.toFixed(1)}/100</p>
            <p className="mt-0.5 text-[11px] text-[#6B7280]">{scoreLabel(overallScore)}</p>
          </PmCard>
          <PmCard className="p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Goal (weighted) score</p>
            <p className="mt-1 text-xl font-bold text-[#111827]">{employee.goalWeighted.toFixed(1)}/100</p>
            <p className="mt-0.5 text-[11px] text-[#6B7280]">{scoreLabel(employee.goalWeighted)}</p>
          </PmCard>
          <PmCard className="p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Competency score</p>
            <p className="mt-1 text-xl font-bold text-[#111827]">{employee.competency.toFixed(1)}/100</p>
            <p className="mt-0.5 text-[11px] text-[#6B7280]">{scoreLabel(employee.competency)}</p>
          </PmCard>
          <PmCard className="p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Check-ins completed</p>
            <div className="mt-1 flex items-baseline gap-1">
              <p className="text-xl font-bold text-[#111827]">{employee.checkinsDone}</p>
              <span className="text-sm text-[#9CA3AF]">/ {employee.checkinsTotal}</span>
            </div>
            <p className="mt-0.5 text-[11px] text-[#6B7280]">Last check-in {employee.lastCheckin}</p>
          </PmCard>
          <PmCard className="p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Timesheet compliance</p>
            <p className="mt-1 text-xl font-bold text-[#111827]">{employee.timesheetCompliance}%</p>
            <p className={cn("mt-0.5 text-[11px] font-medium", employee.onTrack ? "text-[#10B981]" : "text-[#D97706]")}>{employee.onTrack ? "On track" : "Below target"}</p>
            <p className="mt-0.5 text-[10px] text-[#9CA3AF]">Next check-in {employee.nextCheckin}</p>
          </PmCard>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
          <div className="space-y-3">
            <PmCard className="p-4 overflow-x-auto">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h3 className="text-sm font-semibold text-[#111827]">All perspectives · Score calculation: Weighted average</h3>
                <div className="flex items-center gap-2">
                  <select value={viewBy} onChange={(e) => setViewBy(e.target.value)} className="h-8 rounded-lg border border-[#E5E7EB] px-2 text-xs text-[#374151]">
                    <option>Goals & KPIs</option>
                    <option>Goals only</option>
                    <option>KPIs only</option>
                  </select>
                  <label className="inline-flex items-center gap-1.5 text-[11px] text-[#374151] cursor-pointer">
                    <input type="checkbox" checked={showCompleted} onChange={(e) => setShowCompleted(e.target.checked)} className="rounded border-[#D1D5DB]" />
                    Show completed
                  </label>
                </div>
              </div>
              <table className="w-full text-left text-xs min-w-[760px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wide text-[#9CA3AF]">
                    <th className="pb-2 font-semibold pr-2">Goal / KPI</th>
                    <th className="pb-2 font-semibold pr-2 text-right">Weight</th>
                    <th className="pb-2 font-semibold pr-2">Original Target</th>
                    <th className="pb-2 font-semibold pr-2">Actual</th>
                    <th className="pb-2 font-semibold pr-2 text-right">Score</th>
                    <th className="pb-2 font-semibold pr-2 text-center">Trend</th>
                    <th className="pb-2 font-semibold pr-2">Evidence</th>
                    <th className="pb-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {perspectives.map((p) => (
                    <Fragment key={p.name}>
                      <tr className="border-t border-[#E5E7EB] bg-[#FAFAFA]">
                        <td className="py-2 pr-2 font-semibold" style={{ color: p.color }}>
                          {p.name}
                        </td>
                        <td className="py-2 pr-2 text-right font-semibold text-[#111827]">{p.weight}%</td>
                        <td colSpan={6} />
                      </tr>
                      {p.goals.map((g) => (
                        <tr key={g.code} className="border-t border-[#F1F5F9] hover:bg-[#FAFAFA]">
                          <td className="py-2.5 pr-2">
                            <p className="text-[#374151] leading-snug">{g.title}</p>
                            <p className="text-[10px] text-[#9CA3AF]">{g.code}</p>
                          </td>
                          <td className="py-2.5 pr-2 text-right text-[#6B7280]">{g.weight}%</td>
                          <td className="py-2.5 pr-2 text-[#6B7280] whitespace-nowrap">{g.target}</td>
                          <td className="py-2.5 pr-2 font-medium text-[#111827] whitespace-nowrap">{g.actual}</td>
                          <td className="py-2.5 pr-2 text-right font-semibold text-[#111827]">{g.score}</td>
                          <td className="py-2.5 pr-2 flex items-center justify-center">{trendIcon(g.trend)}</td>
                          <td className="py-2.5 pr-2 text-[#7C3AED] whitespace-nowrap">{g.evidence}</td>
                          <td className="py-2.5">
                            <PmStatusPill label={g.status} tone={statusTone(g.status)} />
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                  <tr className="border-t-2 border-[#E5E7EB] font-semibold">
                    <td className="py-2.5 pr-2 text-[#111827]">Total / Overall Score</td>
                    <td className="py-2.5 pr-2 text-right text-[#111827]">{totalWeight}%</td>
                    <td colSpan={3} />
                    <td className="py-2.5 pr-2 text-right text-[#7C3AED]">{overallScore.toFixed(1)}</td>
                    <td colSpan={2} />
                  </tr>
                </tbody>
              </table>
              <div className="mt-3 pt-2 border-t border-[#F1F5F9] flex items-center gap-3 text-[10px] text-[#6B7280] flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" /> ≥ 80 Good
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]" /> 60 – 79 Needs attention
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#EF4444]" /> &lt; 60 At risk
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#9CA3AF]" /> Not started
                </span>
              </div>
            </PmCard>

            <PmCard className="p-4 overflow-x-auto">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h3 className="text-sm font-semibold text-[#111827] inline-flex items-center gap-1.5">
                  Timesheet-derived effort by strategic objective (supporting evidence)
                </h3>
                <div className="flex items-center gap-2">
                  <select value={effortPeriod} onChange={(e) => setEffortPeriod(e.target.value)} className="h-8 rounded-lg border border-[#E5E7EB] px-2 text-xs text-[#374151]">
                    <option>Q3 (Jan – Mar 2026)</option>
                    <option>Q2 (Oct – Dec 2025)</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => toast("Timesheets", { description: "Opening linked timesheet entries." })}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#E5E7EB] bg-white text-xs text-[#374151] hover:bg-[#F9FAFB]"
                  >
                    View timesheets
                  </button>
                </div>
              </div>
              <table className="w-full text-left text-xs min-w-[680px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wide text-[#9CA3AF]">
                    <th className="pb-2 font-semibold pr-2">Strategic Objective</th>
                    <th className="pb-2 font-semibold pr-2">Linked Goals</th>
                    <th className="pb-2 font-semibold pr-2 text-right">Hours Logged</th>
                    <th className="pb-2 font-semibold pr-2 text-right">Planned Hours</th>
                    <th className="pb-2 font-semibold pr-2 text-right">% vs Plan</th>
                    <th className="pb-2 font-semibold">Key Activities</th>
                  </tr>
                </thead>
                <tbody>
                  {effort.map((r) => {
                    const pct = Math.round((r.hoursLogged / r.hoursPlanned) * 100)
                    return (
                      <tr key={r.objective} className="border-t border-[#F1F5F9]">
                        <td className="py-2.5 pr-2 text-[#374151] whitespace-nowrap">{r.objective}</td>
                        <td className="py-2.5 pr-2 text-[#7C3AED] whitespace-nowrap">{r.linked}</td>
                        <td className="py-2.5 pr-2 text-right font-medium text-[#111827]">{r.hoursLogged.toFixed(1)}</td>
                        <td className="py-2.5 pr-2 text-right text-[#6B7280]">{r.hoursPlanned.toFixed(1)}</td>
                        <td className={cn("py-2.5 pr-2 text-right font-semibold", pct > 105 ? "text-[#DC2626]" : pct < 90 ? "text-[#D97706]" : "text-[#10B981]")}>{pct}%</td>
                        <td className="py-2.5 text-[#6B7280]">{r.keyActivities}</td>
                      </tr>
                    )
                  })}
                  <tr className="border-t-2 border-[#E5E7EB] font-semibold">
                    <td className="py-2.5 pr-2 text-[#111827]">Total</td>
                    <td className="py-2.5 pr-2" />
                    <td className="py-2.5 pr-2 text-right text-[#111827]">{effortTotals.logged.toFixed(1)}</td>
                    <td className="py-2.5 pr-2 text-right text-[#111827]">{effortTotals.planned.toFixed(1)}</td>
                    <td className="py-2.5 pr-2 text-right text-[#111827]">{Math.round((effortTotals.logged / effortTotals.planned) * 100)}%</td>
                    <td className="py-2.5" />
                  </tr>
                </tbody>
              </table>
              <p className="mt-2 text-[10px] text-[#9CA3AF]">FP&amp;A forecast source: 2026 Budget v1.0 (15 Nov 2025) · Accounting actuals source: GL - Posted to 30 Apr</p>
            </PmCard>
          </div>

          <div className="space-y-3">
            <PmCard className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-[#111827]">Role expectations</h3>
                <button type="button" className="text-[11px] font-medium text-[#7C3AED] hover:underline">
                  View all
                </button>
              </div>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Drive quality analysis and due diligence to support investment decisions and safeguard portfolio value creation.
              </p>
            </PmCard>

            <PmCard className="p-4">
              <h3 className="text-sm font-semibold text-[#111827] mb-2">Current quarter priorities ({employee.quarter.split(" ")[0]})</h3>
              <ul className="space-y-1.5 text-xs text-[#374151] list-disc pl-4">
                <li>Validate Q3 company reports promptly</li>
                <li>Improve financial model accuracy</li>
                <li>Support two investment mints to IC</li>
                <li>Complete required training modules</li>
              </ul>
            </PmCard>

            <PmCard className="p-4">
              <h3 className="text-sm font-semibold text-[#111827] mb-2">Strengths</h3>
              <div className="flex flex-wrap gap-1.5">
                {["Analytical rigour", "Attention to detail", "Ownership"].map((s) => (
                  <PmStatusPill key={s} label={s} tone="success" />
                ))}
              </div>
              <h3 className="text-sm font-semibold text-[#111827] mt-3.5 mb-2">Development areas</h3>
              <div className="flex flex-wrap gap-1.5">
                {["Advanced valuation techniques", "Presentation skills"].map((s) => (
                  <PmStatusPill key={s} label={s} tone="warning" />
                ))}
              </div>
            </PmCard>

            <PmCard className="p-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-[#111827]">Manager feedback</h3>
                <span className="text-[10px] text-[#9CA3AF]">15 May 2026</span>
              </div>
              <p className="text-xs text-[#374151] leading-relaxed">
                Strong analytical capability and ownership. Focus on improving modelling accuracy and executive storytelling.
              </p>
              <p className="text-[10px] text-[#9CA3AF] mt-1.5">— {employee.manager}</p>
            </PmCard>

            <PmCard className="p-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-[#111827]">Peer feedback</h3>
                <button type="button" className="text-[11px] font-medium text-[#7C3AED] hover:underline inline-flex items-center gap-1">
                  View details <ExternalLink className="h-3 w-3" />
                </button>
              </div>
              <p className="text-xs text-[#374151]">Avg 4.3 / 5 · "Collaborative, responsive and reliable team member."</p>
            </PmCard>

            <PmCard className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-[#111827]">Linked training plan</h3>
                <button type="button" className="text-[11px] font-medium text-[#7C3AED] hover:underline">
                  View plan
                </button>
              </div>
              <div className="space-y-2">
                {[
                  { name: "Advanced Financial Modelling", status: "In progress" },
                  { name: "DCF & Valuation Techniques", status: "Not started" },
                  { name: "Executive Presentation Skills", status: "Not started" },
                ].map((t) => (
                  <div key={t.name} className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-[#374151] truncate">{t.name}</span>
                    <PmStatusPill label={t.status} tone={t.status === "In progress" ? "info" : "neutral"} />
                  </div>
                ))}
              </div>
            </PmCard>

            <PmCard className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-[#111827]">Scorecard edit log (Manager / HR only)</h3>
                <button
                  type="button"
                  onClick={() => toast("Edit score", { description: "Opening manual score override." })}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-[#7C3AED] hover:underline"
                >
                  <Pencil className="h-3 w-3" /> Edit score
                </button>
              </div>
              <div className="text-xs">
                <p className="text-[#111827] font-medium">3.1 Financial model accuracy</p>
                <p className="text-[#6B7280] mt-0.5">Original 72 → Updated 78</p>
                <p className="text-[10px] text-[#9CA3AF] mt-0.5">Reason: Manual override with additional evidence considered</p>
              </div>
              <button type="button" className="mt-2 text-[11px] font-medium text-[#7C3AED] hover:underline">
                View audit log →
              </button>
            </PmCard>
          </div>
        </div>

        <p className="text-[10px] text-[#9CA3AF]">Last data refresh: 18 Jul 2026 08:15 · Last edit: {employee.manager} · 15 May 2026 14:42</p>
      </div>
    </div>
  )
}
