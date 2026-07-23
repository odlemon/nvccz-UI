"use client"

import { useMemo, useState } from "react"
import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer } from "recharts"
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Play,
  Search,
  Building2,
  Filter,
  Paperclip,
  History,
  Clock,
  FileCheck2,
  Scale,
  CheckCircle2,
  Hourglass,
} from "lucide-react"
import { toast } from "sonner"
import { PerformanceMockTopChrome } from "@/components/performance-mock/shell"
import { PmButton, PmCard, PmPageHeader, PmProgress, PmSelectChip, PmStatusPill } from "@/components/performance-mock/primitives"
import {
  ratingOptions,
  reviewCycles,
  reviewEmployees as reviewEmployeesSeed,
  reviewMetrics,
  reviewTeams,
  type ReviewEmployee,
  type ReviewStatus,
} from "@/lib/performance-mock/fixtures/reviews"
import { cn } from "@/lib/utils"

const PURPLE = "#8B5CF6"
const PAGE_SIZE = 8

const statusTone: Record<ReviewStatus, "success" | "warning" | "danger" | "info" | "purple" | "neutral"> = {
  Pending: "warning",
  Submitted: "purple",
  Calibrated: "info",
  "In Progress": "purple",
  Completed: "success",
}

const DETAIL_TABS = [
  { id: "form", label: "Review Form" },
  { id: "activity", label: "Activity Log" },
  { id: "attachments", label: "Attachments (2)" },
  { id: "audit", label: "Audit Trail" },
]

const metricIcons = {
  pending: Hourglass,
  submitted: FileCheck2,
  calibrated: Scale,
  completed: CheckCircle2,
} as const

function Spark({ data, color }: { data: number[]; color: string }) {
  const chart = data.map((v, i) => ({ i, v }))
  return (
    <div className="h-8 w-16">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chart}>
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ReviewsMockScreen() {
  const [cycle, setCycle] = useState(reviewCycles[0])
  const [team, setTeam] = useState(reviewTeams[0])
  const [listTab, setListTab] = useState<"employees" | "teams">("employees")
  const [search, setSearch] = useState("")
  const [employees, setEmployees] = useState<ReviewEmployee[]>(reviewEmployeesSeed)
  const [selectedId, setSelectedId] = useState(reviewEmployeesSeed[0].id)
  const [detailTab, setDetailTab] = useState("form")
  const [ratingOverrides, setRatingOverrides] = useState<Record<string, number>>({})
  const [page, setPage] = useState(1)

  const filteredEmployees = useMemo(() => {
    if (!search.trim()) return employees
    const q = search.toLowerCase()
    return employees.filter((e) => e.name.toLowerCase().includes(q) || e.role.toLowerCase().includes(q) || e.department.toLowerCase().includes(q))
  }, [employees, search])

  const grouped = useMemo(() => {
    const map = new Map<string, ReviewEmployee[]>()
    filteredEmployees.forEach((e) => {
      const arr = map.get(e.department) || []
      arr.push(e)
      map.set(e.department, arr)
    })
    return Array.from(map.entries())
  }, [filteredEmployees])

  const pageCount = Math.max(1, Math.ceil(filteredEmployees.length / PAGE_SIZE))
  const pageRows = filteredEmployees.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const selected = employees.find((e) => e.id === selectedId) || employees[0]
  const selectedIndex = employees.findIndex((e) => e.id === selectedId)
  const recommendedRating = ratingOverrides[selected.id] ?? selected.recommendedRating
  const completion = 56

  const goNav = (dir: 1 | -1) => {
    const next = (selectedIndex + dir + employees.length) % employees.length
    setSelectedId(employees[next].id)
    setDetailTab("form")
  }

  const setStatus = (id: string, status: ReviewStatus) => {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)))
  }

  const saveDraft = () => {
    setStatus(selected.id, "Submitted")
    toast.success("Draft saved", { description: `${selected.name}'s review saved as draft.` })
  }

  const submitReview = () => {
    setStatus(selected.id, "Completed")
    toast.success("Review submitted", { description: `${selected.name}'s review has been submitted for calibration.` })
  }

  const kpiDot = (pct: number) => (pct >= 85 ? "#10B981" : pct >= 75 ? "#F59E0B" : "#EF4444")

  return (
    <div className="min-h-full bg-[#F8FAFC]">
      <PerformanceMockTopChrome breadcrumbs={["Performance Management", "Reviews", "Performance Reviews"]} />
      <div className="p-4 lg:p-5 space-y-3">
        {/* Header */}
        <PmPageHeader
          title="Performance Reviews"
          subtitle="Conduct, monitor and complete performance reviews across the organization."
          actions={
            <>
              <PmSelectChip
                icon={<Calendar className="h-3.5 w-3.5 text-[#6B7280]" />}
                label={cycle}
                onClick={() => setCycle((c) => reviewCycles[(reviewCycles.indexOf(c) + 1) % reviewCycles.length])}
              />
              <PmSelectChip
                icon={<Building2 className="h-3.5 w-3.5 text-[#6B7280]" />}
                label={team}
                onClick={() => setTeam((t) => reviewTeams[(reviewTeams.indexOf(t) + 1) % reviewTeams.length])}
              />
              <PmButton
                className="!bg-[#8B5CF6] hover:!bg-[#7C3AED]"
                onClick={() => toast.success("Review cycle started", { description: `${cycle} has been kicked off for ${team}.` })}
              >
                <Play className="h-3.5 w-3.5" /> Start Review Cycle
              </PmButton>
            </>
          }
        />

        {/* KPI row: 4 status cards + overall completion */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
          {reviewMetrics.map((m) => {
            const Icon = metricIcons[m.id as keyof typeof metricIcons]
            return (
              <PmCard key={m.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: m.bg, color: m.color }}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <p className="text-xs font-medium text-[#6B7280] truncate">{m.label}</p>
                    </div>
                    <p className="mt-2 text-xl leading-none font-bold tracking-tight text-[#111827]">
                      {m.value}
                      <span className="ml-1.5 text-sm font-semibold" style={{ color: m.color }}>
                        {m.pct}
                      </span>
                    </p>
                    <p className={cn("mt-2 text-[11px] font-medium", m.trendPositive ? "text-[#10B981]" : "text-[#EF4444]")}>{m.trend}</p>
                  </div>
                  <Spark data={m.spark} color={m.color} />
                </div>
              </PmCard>
            )
          })}

          <PmCard className="p-4">
            <p className="text-xs font-medium text-[#6B7280] mb-2">Overall Completion</p>
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 relative shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[{ v: completion }, { v: 100 - completion }]} dataKey="v" innerRadius={22} outerRadius={30} startAngle={90} endAngle={-270} strokeWidth={0}>
                      <Cell fill={PURPLE} />
                      <Cell fill="#EDE9FE" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-[#111827]">{completion}%</div>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#111827]">114 of 200 Reviews Completed</p>
                <button type="button" className="text-[11px] font-semibold text-[#8B5CF6] hover:underline mt-1">
                  View cycle analytics →
                </button>
              </div>
            </div>
          </PmCard>
        </div>

        {/* Split: employee list | review detail */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
          {/* LEFT ~30%: employee directory */}
          <PmCard className="xl:col-span-4 overflow-hidden flex flex-col">
            <div className="px-4 pt-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-4">
                {(["employees", "teams"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setListTab(t)}
                    className={cn(
                      "pb-2.5 text-sm font-semibold capitalize border-b-2 -mb-px transition-colors",
                      listTab === t ? "text-[#8B5CF6] border-[#8B5CF6]" : "text-[#6B7280] border-transparent hover:text-[#111827]"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 border-b border-[#E5E7EB]">
              <div className="relative flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF]" />
                  <input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setPage(1)
                    }}
                    placeholder="Search employee…"
                    className="w-full h-9 pl-8 pr-3 rounded-lg border border-[#E5E7EB] text-xs outline-none focus:border-[#C4B5FD] bg-white"
                  />
                </div>
                <button type="button" className="h-9 w-9 rounded-lg border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] hover:bg-[#F9FAFB]">
                  <Filter className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-[1fr_90px_72px] gap-1 px-3 py-2 text-[10px] uppercase tracking-wide text-[#9CA3AF] font-semibold border-b border-[#F1F5F9] bg-[#FAFAFB]">
              <span>Employee</span>
              <span>Status</span>
              <span className="text-right">Due</span>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[520px]">
              {listTab === "employees"
                ? pageRows.map((e) => (
                    <EmployeeRow key={e.id} e={e} active={e.id === selectedId} onClick={() => { setSelectedId(e.id); setDetailTab("form") }} />
                  ))
                : grouped.map(([deptName, members]) => (
                    <div key={deptName}>
                      <div className="px-3 py-1.5 bg-[#F9FAFB] text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">
                        {deptName} · {members.length}
                      </div>
                      {members.map((e) => (
                        <EmployeeRow key={e.id} e={e} active={e.id === selectedId} onClick={() => { setSelectedId(e.id); setDetailTab("form") }} />
                      ))}
                    </div>
                  ))}
              {filteredEmployees.length === 0 && <p className="text-center text-xs text-[#6B7280] py-8">No employees match your search.</p>}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 border-t border-[#E5E7EB] text-[11px] text-[#6B7280]">
              <span>
                Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filteredEmployees.length)} of {filteredEmployees.length}
              </span>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(pageCount, 3) }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n)}
                    className={cn("h-7 w-7 rounded-full text-xs font-semibold", page === n ? "bg-[#8B5CF6] text-white" : "hover:bg-[#F3F4F6]")}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </PmCard>

          {/* RIGHT ~70%: review detail */}
          <PmCard className="xl:col-span-8 overflow-hidden">
            {/* Profile header */}
            <div className="p-4 border-b border-[#E5E7EB]">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={selected.src} alt={selected.name} className="h-12 w-12 rounded-full object-cover ring-2 ring-white shadow-sm shrink-0" referrerPolicy="no-referrer" />
                  <div className="min-w-0">
                    <p className="text-base font-bold text-[#111827] truncate">{selected.name}</p>
                    <p className="text-xs text-[#6B7280]">
                      {selected.role} · {selected.department}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button type="button" onClick={() => goNav(-1)} className="h-8 px-3 rounded-lg border border-[#E5E7EB] text-xs font-medium text-[#374151] hover:bg-[#F9FAFB] inline-flex items-center gap-1">
                    <ChevronLeft className="h-3.5 w-3.5" /> Previous
                  </button>
                  <button type="button" onClick={() => goNav(1)} className="h-8 px-3 rounded-lg border border-[#E5E7EB] text-xs font-medium text-[#374151] hover:bg-[#F9FAFB] inline-flex items-center gap-1">
                    Next <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" className="h-8 w-8 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:bg-[#F3F4F6]">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide font-semibold">Review Cycle</p>
                  <p className="text-[#111827] font-medium mt-0.5">{cycle}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide font-semibold">Review Period</p>
                  <p className="text-[#111827] font-medium mt-0.5">{selected.reviewPeriod}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide font-semibold">Status</p>
                  <div className="mt-0.5">
                    <PmStatusPill label={selected.status} tone={statusTone[selected.status]} />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide font-semibold">Due Date</p>
                  <p className="text-[#111827] font-medium mt-0.5">
                    {selected.dueDate}
                    <span className={cn("ml-1.5 font-semibold", selected.dueUrgent ? "text-[#EF4444]" : "text-[#6B7280]")}>{selected.dueRelative}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Detail tabs */}
            <div className="px-4 border-b border-[#E5E7EB] flex items-center gap-1 overflow-x-auto">
              {DETAIL_TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setDetailTab(t.id)}
                  className={cn(
                    "px-3 py-3 text-xs font-semibold whitespace-nowrap border-b-2 -mb-px inline-flex items-center gap-1.5 transition-colors",
                    detailTab === t.id ? "text-[#8B5CF6] border-[#8B5CF6]" : "text-[#6B7280] border-transparent hover:text-[#111827]"
                  )}
                >
                  {t.id === "attachments" && <Paperclip className="h-3 w-3" />}
                  {t.id === "audit" && <History className="h-3 w-3" />}
                  {t.id === "activity" && <Clock className="h-3 w-3" />}
                  {t.label}
                </button>
              ))}
            </div>

            {detailTab === "form" && (
              <div className="p-4 space-y-3">
                {/* Top grid: Competency | KPI | Goals */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
                    <h4 className="text-sm font-semibold text-[#111827] mb-3">Competency Assessment</h4>
                    <div className="space-y-3">
                      {selected.competencies.map((c) => (
                        <div key={c.label}>
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-[#374151] font-medium">{c.label}</span>
                            <span className="font-bold text-[#111827]">{c.score.toFixed(1)}</span>
                          </div>
                          <PmProgress value={(c.score / 5) * 100} color={PURPLE} />
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#F1F5F9] text-[10px] text-[#6B7280] flex-wrap">
                      <LegendDot color="#EF4444" label="1 Needs Imp." />
                      <LegendDot color="#F59E0B" label="2–3 Developing" />
                      <LegendDot color="#10B981" label="4 Meets" />
                      <LegendDot color="#8B5CF6" label="5 Outstanding" />
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-[#111827]">KPI Summary</h4>
                      <button type="button" className="text-[11px] font-semibold text-[#8B5CF6] hover:underline">
                        View scorecard →
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-28 w-28 relative shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={[{ v: selected.overallKpiScore }, { v: 100 - selected.overallKpiScore }]} dataKey="v" innerRadius={36} outerRadius={50} startAngle={90} endAngle={-270} strokeWidth={0}>
                              <Cell fill={PURPLE} />
                              <Cell fill="#EDE9FE" />
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-lg font-bold text-[#111827] leading-none">{selected.overallKpiScore}%</span>
                          <span className="text-[9px] text-[#9CA3AF] mt-0.5">KPI Score</span>
                        </div>
                      </div>
                      <div className="flex-1 space-y-1.5 min-w-0">
                        {selected.kpiSummary.map((k) => (
                          <div key={k.label} className="flex items-center justify-between text-xs gap-2">
                            <span className="inline-flex items-center gap-1.5 text-[#374151] truncate">
                              <span className="h-2 w-2 rounded-full shrink-0" style={{ background: kpiDot(k.achievement) }} />
                              {k.label}
                            </span>
                            <span className="font-semibold text-[#111827] shrink-0">{k.achievement}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#F1F5F9]">
                      <span className="text-xs text-[#6B7280]">Overall KPI Score</span>
                      <span className="text-sm font-bold text-[#8B5CF6]">{selected.overallKpiScore}%</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-[#111827]">Goals Achieved</h4>
                      <button type="button" className="text-[11px] font-semibold text-[#8B5CF6] hover:underline">
                        View goals →
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-28 w-28 relative shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { v: selected.goals.achieved, c: "#10B981" },
                                { v: selected.goals.partial, c: "#F59E0B" },
                                { v: selected.goals.notAchieved || 0.001, c: "#EF4444" },
                              ]}
                              dataKey="v"
                              innerRadius={36}
                              outerRadius={50}
                              paddingAngle={2}
                              strokeWidth={0}
                            >
                              <Cell fill="#10B981" />
                              <Cell fill="#F59E0B" />
                              <Cell fill="#EF4444" />
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-lg font-bold text-[#111827] leading-none">
                            {selected.goals.achieved}/{selected.goals.total}
                          </span>
                          <span className="text-[9px] text-[#9CA3AF] mt-0.5">Goals</span>
                        </div>
                      </div>
                      <div className="flex-1 space-y-2 text-xs min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <LegendDot color="#10B981" label="Achieved" />
                          <span className="font-semibold text-[#111827]">
                            {selected.goals.achieved} · {Math.round((selected.goals.achieved / selected.goals.total) * 100)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <LegendDot color="#F59E0B" label="Partial" />
                          <span className="font-semibold text-[#111827]">
                            {selected.goals.partial} · {Math.round((selected.goals.partial / selected.goals.total) * 100)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <LegendDot color="#EF4444" label="Not Achieved" />
                          <span className="font-semibold text-[#111827]">
                            {selected.goals.notAchieved} · {Math.round((selected.goals.notAchieved / selected.goals.total) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feedback row: Manager | Self | Peer */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <FeedbackCard
                    title="Manager Feedback"
                    text={selected.managerFeedback.text}
                    by={selected.managerFeedback.by}
                    role={selected.managerFeedback.role}
                    at={selected.managerFeedback.at}
                    src={selected.managerFeedback.src}
                  />
                  <FeedbackCard
                    title="Self-Assessment"
                    text={selected.selfAssessment.text}
                    by={selected.selfAssessment.by}
                    role={selected.selfAssessment.role}
                    at={selected.selfAssessment.at}
                    src={selected.selfAssessment.src}
                  />
                  <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-[#111827]">Peer Feedback</h4>
                      <button type="button" className="text-[11px] font-semibold text-[#8B5CF6] hover:underline">
                        View all ({selected.peerFeedback.length})
                      </button>
                    </div>
                    {selected.peerFeedback.length === 0 ? (
                      <p className="text-xs text-[#9CA3AF] py-6 text-center">No peer feedback yet.</p>
                    ) : (
                      <div className="space-y-3 flex-1">
                        {selected.peerFeedback.slice(0, 2).map((p) => (
                          <div key={p.name} className="flex items-start gap-2.5">
                            <img src={p.src} alt={p.name} className="h-7 w-7 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-xs font-semibold text-[#111827]">{p.name}</p>
                                <span className="text-[10px] text-[#9CA3AF]">{p.at}</span>
                              </div>
                              <p className="text-xs text-[#6B7280] mt-0.5 leading-relaxed">{p.text}</p>
                            </div>
                          </div>
                        ))}
                        {selected.peerFeedback.length > 2 && (
                          <button type="button" className="text-[11px] font-semibold text-[#8B5CF6]">
                            +{selected.peerFeedback.length - 2} more feedback
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Final recommendation */}
                <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
                  <h4 className="text-sm font-semibold text-[#111827] mb-3">Final Recommendation</h4>
                  <div className="flex flex-wrap gap-2">
                    {ratingOptions.map((label, i) => {
                      const value = ratingOptions.length - i
                      const active = recommendedRating === value
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => setRatingOverrides((prev) => ({ ...prev, [selected.id]: value }))}
                          className={cn(
                            "h-9 px-3.5 rounded-lg text-xs font-semibold border transition-colors",
                            active ? "bg-[#8B5CF6] text-white border-[#8B5CF6] shadow-sm" : "bg-white text-[#374151] border-[#E5E7EB] hover:bg-[#F9FAFB]"
                          )}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-[#F1F5F9]">
                    <p className="text-xs text-[#374151]">
                      Recommended Rating:{" "}
                      <span className="font-bold text-[#111827]">
                        {recommendedRating} – {ratingOptions[ratingOptions.length - recommendedRating]}
                      </span>
                    </p>
                    <PmStatusPill
                      label={`Calibration Status: ${selected.calibrationStatus}`}
                      tone={selected.calibrationStatus === "Calibrated" ? "success" : "purple"}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <PmButton variant="outline" onClick={saveDraft}>
                    Save Draft
                  </PmButton>
                  <PmButton className="!bg-[#8B5CF6] hover:!bg-[#7C3AED]" onClick={submitReview}>
                    Submit Review
                  </PmButton>
                </div>
              </div>
            )}

            {detailTab === "activity" && (
              <div className="p-4 space-y-3">
                {[
                  { label: "Review opened", by: selected.name, at: selected.dueDate },
                  { label: "Self-assessment submitted", by: selected.name, at: selected.selfAssessment.at },
                  { label: "Manager feedback added", by: selected.managerFeedback.by, at: selected.managerFeedback.at },
                ].map((a, i) => (
                  <div key={i} className="flex items-start gap-3 text-xs">
                    <span className="h-2 w-2 rounded-full bg-[#8B5CF6] mt-1.5 shrink-0" />
                    <div>
                      <p className="text-[#111827] font-medium">{a.label}</p>
                      <p className="text-[#6B7280]">
                        {a.by} · {a.at}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {detailTab === "attachments" && (
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {["Self-Assessment-Notes.pdf", "Q2-Deliverables-Summary.xlsx"].map((f) => (
                  <div key={f} className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[#E5E7EB] text-xs">
                    <Paperclip className="h-3.5 w-3.5 text-[#8B5CF6]" />
                    <span className="text-[#374151] truncate">{f}</span>
                  </div>
                ))}
              </div>
            )}

            {detailTab === "audit" && (
              <div className="p-4 space-y-3">
                {[
                  { who: "System", action: `Status set to ${selected.status}`, at: "Just now" },
                  { who: selected.managerFeedback.by, action: "Added manager feedback", at: selected.managerFeedback.at },
                  { who: selected.name, action: "Submitted self-assessment", at: selected.selfAssessment.at },
                ].map((a, i) => (
                  <div key={i} className="flex items-center justify-between text-xs border-b border-[#F1F5F9] pb-2 last:border-0">
                    <span className="text-[#374151]">
                      <span className="font-semibold text-[#111827]">{a.who}</span> — {a.action}
                    </span>
                    <span className="text-[#9CA3AF]">{a.at}</span>
                  </div>
                ))}
              </div>
            )}
          </PmCard>
        </div>
      </div>
    </div>
  )
}

function EmployeeRow({ e, active, onClick }: { e: ReviewEmployee; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full grid grid-cols-[1fr_90px_72px] gap-1 items-center px-3 py-2.5 border-b border-[#F1F5F9] text-left transition-colors",
        active ? "bg-[#F5F3FF]" : "hover:bg-[#FAFAFA]"
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <img src={e.src} alt={e.name} className="h-8 w-8 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#111827] truncate">{e.name}</p>
          <p className="text-[10px] text-[#6B7280] truncate">{e.role}</p>
        </div>
      </div>
      <div>
        <PmStatusPill label={e.status} tone={statusTone[e.status]} />
      </div>
      <div className="text-right">
        <p className="text-[10px] text-[#6B7280]">{e.dueDate.split(" ").slice(0, 2).join(" ")}</p>
        <p className={cn("text-[10px] font-semibold", e.dueUrgent ? "text-[#EF4444]" : "text-[#9CA3AF]")}>{e.dueRelative}</p>
      </div>
    </button>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} /> {label}
    </span>
  )
}

function FeedbackCard({
  title,
  text,
  by,
  role,
  at,
  src,
}: {
  title: string
  text: string
  by: string
  role: string
  at: string
  src: string
}) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 flex flex-col">
      <h4 className="text-sm font-semibold text-[#111827] mb-2">{title}</h4>
      <p className="text-xs text-[#374151] leading-relaxed flex-1">{text}</p>
      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-[#F1F5F9]">
        <img src={src} alt={by} className="h-7 w-7 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-[#111827] truncate">{by}</p>
          <p className="text-[10px] text-[#9CA3AF] truncate">{role}</p>
        </div>
        <span className="text-[10px] text-[#9CA3AF] whitespace-nowrap shrink-0">{at}</span>
      </div>
    </div>
  )
}
