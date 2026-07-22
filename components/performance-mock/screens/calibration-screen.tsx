"use client"

import { useMemo, useState } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Download, Send, Search, Filter, X, ChevronLeft, ChevronRight, FileText, Check } from "lucide-react"
import { toast } from "sonner"
import { PerformanceMockTopChrome } from "@/components/performance-mock/shell"
import { PmButton, PmCard, PmPageHeader, PmStatusPill, PmTabPills } from "@/components/performance-mock/primitives"
import { cn } from "@/lib/utils"

type CalibrationStatus = "Calibrated" | "Under review"

type EmployeeRow = {
  id: string
  name: string
  role: string
  manager: string
  goalScore: number
  competencyScore: number
  provisional: number
  calibrated: number
  evidenceCoverage: number
  status: CalibrationStatus
  evidence: { name: string; size: string; date: string }[]
  timesheet: { submitted: number; approved: number; onTime: number }
}

const employees: EmployeeRow[] = [
  { id: "e1", name: "Tendai Sibanda", role: "Analyst", manager: "Farai Moyo", goalScore: 3.8, competencyScore: 3.6, provisional: 3.7, calibrated: 3.6, evidenceCoverage: 92, status: "Calibrated", evidence: [], timesheet: { submitted: 92, approved: 90, onTime: 88 } },
  { id: "e2", name: "Chipo Mhlanga", role: "Portfolio Associate", manager: "Rudo Chikore", goalScore: 4.1, competencyScore: 4.0, provisional: 4.0, calibrated: 4.0, evidenceCoverage: 88, status: "Calibrated", evidence: [], timesheet: { submitted: 88, approved: 86, onTime: 80 } },
  {
    id: "e3",
    name: "Nyasha Moyo",
    role: "Portfolio Manager",
    manager: "Rudo Chikore",
    goalScore: 4.2,
    competencyScore: 4.2,
    provisional: 4.2,
    calibrated: 3.9,
    evidenceCoverage: 76,
    status: "Under review",
    evidence: [
      { name: "Q3 Board Memo - Asian Portfolio Co.pdf", size: "512 KB", date: "12 Mar 2026" },
      { name: "Stakeholder Feedback Q3.pdf", size: "312 KB", date: "05 Mar 2026" },
      { name: "Monthly Check-ins Notes - Feb 2026.docx", size: "88 KB", date: "28 Feb 2026" },
    ],
    timesheet: { submitted: 88, approved: 84, onTime: 76 },
  },
  { id: "e4", name: "Tawanda Kaseke", role: "Senior Analyst", manager: "Farai Moyo", goalScore: 3.5, competencyScore: 3.4, provisional: 3.4, calibrated: 3.4, evidenceCoverage: 84, status: "Calibrated", evidence: [], timesheet: { submitted: 84, approved: 82, onTime: 78 } },
  { id: "e5", name: "Rudo Chikore", role: "Head of Portfolio Ops", manager: "Tariro Ncube", goalScore: 4.3, competencyScore: 4.3, provisional: 4.4, calibrated: 4.2, evidenceCoverage: 100, status: "Calibrated", evidence: [], timesheet: { submitted: 100, approved: 100, onTime: 96 } },
  { id: "e6", name: "Farai Moyo", role: "Investment Manager", manager: "Tariro Ncube", goalScore: 4.0, competencyScore: 4.1, provisional: 4.0, calibrated: 4.0, evidenceCoverage: 96, status: "Calibrated", evidence: [], timesheet: { submitted: 96, approved: 94, onTime: 90 } },
  { id: "e7", name: "Blessing Dube", role: "ESG Analyst", manager: "Farai Moyo", goalScore: 3.2, competencyScore: 3.1, provisional: 3.1, calibrated: 3.1, evidenceCoverage: 72, status: "Calibrated", evidence: [], timesheet: { submitted: 72, approved: 68, onTime: 60 } },
  { id: "e8", name: "Mukudzei Chirwa", role: "Research Analyst", manager: "Rudo Chikore", goalScore: 3.6, competencyScore: 3.5, provisional: 3.6, calibrated: 3.5, evidenceCoverage: 80, status: "Calibrated", evidence: [], timesheet: { submitted: 80, approved: 78, onTime: 74 } },
  {
    id: "e9",
    name: "Gilbert Mandeya",
    role: "Equity Analyst",
    manager: "Farai Moyo",
    goalScore: 3.9,
    competencyScore: 3.8,
    provisional: 3.5,
    calibrated: 3.8,
    evidenceCoverage: 68,
    status: "Under review",
    evidence: [{ name: "Peer Feedback Summary Q3.pdf", size: "204 KB", date: "10 Mar 2026" }],
    timesheet: { submitted: 68, approved: 64, onTime: 58 },
  },
  { id: "e10", name: "Kudakwashe Mafios", role: "Portfolio Associate", manager: "Rudo Chikore", goalScore: 3.4, competencyScore: 3.3, provisional: 3.3, calibrated: 3.3, evidenceCoverage: 68, status: "Calibrated", evidence: [], timesheet: { submitted: 68, approved: 64, onTime: 60 } },
]

const TOTAL_EMPLOYEES = 24

const distribution = [
  { bucket: "1.0–1.9", provisional: 0, calibrated: 0 },
  { bucket: "2.0–2.9", provisional: 1, calibrated: 1 },
  { bucket: "3.0–3.9", provisional: 11, calibrated: 9 },
  { bucket: "4.0–4.4", provisional: 9, calibrated: 8 },
  { bucket: "4.5–5.0", provisional: 3, calibrated: 3 },
]

const panelMembers = [
  { name: "Tariro Ncube", role: "Managing Partner", conflict: "No conflict" },
  { name: "Farai Moyo", role: "Investment Manager", conflict: "No conflict" },
  { name: "Rudo Chikore", role: "Head of Portfolio Ops", conflict: "No conflict" },
]

const declarations = [
  { name: "Tariro Ncube", at: "19 Apr 2026 09:12", declaration: "No conflict" },
  { name: "Farai Moyo", at: "19 Apr 2026 09:14", declaration: "No conflict" },
  { name: "Rudo Chikore", at: "19 Apr 2026 09:16", declaration: "No conflict" },
]

const decisionLog = [
  { at: "19 Apr 2026 10:15", who: "Tariro Ncube", action: "Proposed", note: "Adjust to 3.9 for consistency with peer outcomes" },
  { at: "19 Apr 2026 10:17", who: "Rudo Chikore", action: "Seconded", note: "Agree with rationale" },
  { at: "19 Apr 2026 10:22", who: "Rudo Chikore", action: "Approved", note: "Approved calibrated rating" },
]

const detailTabs = [
  { id: "overview", label: "Overview" },
  { id: "breakdown", label: "Score breakdown" },
  { id: "history", label: "History" },
  { id: "peers", label: "Peers" },
  { id: "evidence", label: "Evidence" },
  { id: "context", label: "Context" },
  { id: "comments", label: "Comments" },
]

function statusTone(s: CalibrationStatus): "success" | "warning" {
  return s === "Calibrated" ? "success" : "warning"
}

export function CalibrationMockScreen() {
  const [search, setSearch] = useState("")
  const [role, setRole] = useState("All Roles")
  const [status, setStatus] = useState("All Status")
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>("e3")
  const [detailTab, setDetailTab] = useState("overview")
  const [signOffs, setSignOffs] = useState<Record<string, boolean>>({ "Tariro Ncube": true, "Farai Moyo": true, "Rudo Chikore": false })
  const [confirmChecked, setConfirmChecked] = useState(false)

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      if (role !== "All Roles" && e.role !== role) return false
      if (status !== "All Status" && e.status !== status) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        if (!e.name.toLowerCase().includes(q) && !e.role.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [role, status, search])

  const selected = employees.find((e) => e.id === selectedId) || null

  const roles = useMemo(() => ["All Roles", ...Array.from(new Set(employees.map((e) => e.role)))], [])

  const avgProvisional = (employees.reduce((s, e) => s + e.provisional, 0) / employees.length).toFixed(2)
  const avgCalibrated = (employees.reduce((s, e) => s + e.calibrated, 0) / employees.length).toFixed(2)
  const changesProposed = employees.filter((e) => e.provisional !== e.calibrated).length
  const evidenceGaps = employees.filter((e) => e.evidenceCoverage < 80).length
  const reviewsReady = employees.filter((e) => e.status === "Calibrated").length + employees.filter((e) => e.status === "Under review" && e.evidenceCoverage >= 70).length

  const allApproved = Object.values(signOffs).every(Boolean)

  const toggleSignOff = (name: string) => {
    setSignOffs((prev) => ({ ...prev, [name]: !prev[name] }))
    toast.success("Sign-off recorded", { description: `${name} has ${signOffs[name] ? "withdrawn" : "approved"} the calibration.` })
  }

  const handleFinalise = () => {
    if (!confirmChecked) {
      toast.error("Confirmation required", { description: "Please confirm the calibration is fair, consistent and evidence-based." })
      return
    }
    toast.success("Calibration finalised", { description: "Calibrated ratings have been locked and published." })
  }

  return (
    <div className="min-h-full">
      <PerformanceMockTopChrome breadcrumbs={["Performance Management", "Operations", "Calibration"]} searchPlaceholder="Search employees…" />
      <div className="p-4 lg:p-6 space-y-5">
        <PmPageHeader
          title="Performance Calibration · Mid-Year FY2026"
          subtitle="Department: Investment & Portfolio Operations"
          actions={
            <>
              <PmButton variant="outline" onClick={() => toast.success("Export started", { description: "Calibration pack will download shortly." })}>
                <Download className="h-3.5 w-3.5" /> Export pack
              </PmButton>
              <PmButton variant="primary" onClick={() => toast.success("Submitted", { description: "Calibration submitted for sign-off." })}>
                <Send className="h-3.5 w-3.5" /> Submit calibration
              </PmButton>
            </>
          }
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <PmCard className="p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Employees</p>
            <p className="mt-1 text-lg font-bold text-[#111827]">{TOTAL_EMPLOYEES}</p>
          </PmCard>
          <PmCard className="p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Reviews ready</p>
            <p className="mt-1 text-lg font-bold text-[#111827]">{reviewsReady}</p>
            <p className="mt-0.5 text-[10px] text-[#10B981] font-medium">{((reviewsReady / TOTAL_EMPLOYEES) * 100).toFixed(1)}%</p>
          </PmCard>
          <PmCard className="p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Rating changes proposed</p>
            <p className="mt-1 text-lg font-bold text-[#111827]">{changesProposed}</p>
            <p className="mt-0.5 text-[10px] text-[#D97706] font-medium">{((changesProposed / employees.length) * 100).toFixed(1)}%</p>
          </PmCard>
          <PmCard className="p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Evidence gaps</p>
            <p className="mt-1 text-lg font-bold text-[#111827]">{evidenceGaps}</p>
            <p className="mt-0.5 text-[10px] text-[#D97706] font-medium">{((evidenceGaps / employees.length) * 100).toFixed(1)}%</p>
          </PmCard>
          <PmCard className="p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Average provisional</p>
            <p className="mt-1 text-lg font-bold text-[#111827]">{avgProvisional}</p>
            <p className="mt-0.5 text-[10px] text-[#6B7280]">out of 5</p>
          </PmCard>
          <PmCard className="p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Average calibrated</p>
            <p className="mt-1 text-lg font-bold text-[#111827]">{avgCalibrated}</p>
            <p className="mt-0.5 text-[10px] text-[#6B7280]">out of 5</p>
          </PmCard>
        </div>

        <PmCard className="p-4">
          <h3 className="text-sm font-semibold text-[#111827] mb-2">Rating distribution (count of employees)</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="bucket" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="provisional" name="Provisional" fill="#DDD6FE" radius={[3, 3, 0, 0]} barSize={18} />
                <Bar dataKey="calibrated" name="Calibrated" fill="#7C3AED" radius={[3, 3, 0, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-[#6B7280] mt-1">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-[#DDD6FE]" /> Provisional
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-[#7C3AED]" /> Calibrated
            </span>
          </div>
        </PmCard>

        <div className={cn("grid grid-cols-1 gap-4", selected && "xl:grid-cols-[1fr_360px]")}>
          <PmCard className="p-4 overflow-x-auto">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3 className="text-sm font-semibold text-[#111827]">Employees</h3>
              <div className="flex items-center gap-2">
                <div className="flex items-center h-8 w-52 rounded-lg border border-[#E5E7EB] px-2 text-xs text-[#374151] bg-white">
                  <Search className="h-3.5 w-3.5 text-[#9CA3AF] mr-1.5" />
                  <input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setPage(1)
                    }}
                    placeholder="Search employee…"
                    className="flex-1 outline-none text-xs placeholder:text-[#9CA3AF]"
                  />
                </div>
                <button type="button" className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-[#E5E7EB] bg-white text-xs text-[#374151] hover:bg-[#F9FAFB]">
                  <Filter className="h-3.5 w-3.5" /> Filters
                </button>
                <select value={role} onChange={(e) => { setRole(e.target.value); setPage(1) }} className="h-8 rounded-lg border border-[#E5E7EB] px-2 text-xs text-[#374151]">
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="h-8 rounded-lg border border-[#E5E7EB] px-2 text-xs text-[#374151]">
                  {["All Status", "Calibrated", "Under review"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-[#6B7280] whitespace-nowrap">
                  {filtered.length} of {TOTAL_EMPLOYEES}
                </span>
              </div>
            </div>
            <table className="w-full text-left text-[11px] min-w-[880px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-wide text-[#9CA3AF]">
                  <th className="pb-2 font-semibold pr-2 w-5">
                    <input type="checkbox" className="rounded border-[#D1D5DB]" />
                  </th>
                  <th className="pb-2 font-semibold pr-2">Employee</th>
                  <th className="pb-2 font-semibold pr-2">Role</th>
                  <th className="pb-2 font-semibold pr-2">Manager</th>
                  <th className="pb-2 font-semibold pr-2 text-right">Goal Score /5</th>
                  <th className="pb-2 font-semibold pr-2 text-right">Competency /5</th>
                  <th className="pb-2 font-semibold pr-2 text-right">Provisional</th>
                  <th className="pb-2 font-semibold pr-2 text-right">Calibrated</th>
                  <th className="pb-2 font-semibold pr-2 text-right">Change</th>
                  <th className="pb-2 font-semibold pr-2 text-right">Evidence</th>
                  <th className="pb-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => {
                  const change = e.calibrated - e.provisional
                  return (
                    <tr
                      key={e.id}
                      onClick={() => {
                        setSelectedId(e.id)
                        setDetailTab("overview")
                      }}
                      className={cn("border-t border-[#F1F5F9] cursor-pointer", selectedId === e.id ? "bg-[#F5F3FF]" : "hover:bg-[#FAFAFA]")}
                    >
                      <td className="py-2 pr-2">
                        <input type="checkbox" className="rounded border-[#D1D5DB]" onClick={(ev) => ev.stopPropagation()} />
                      </td>
                      <td className="py-2 pr-2 font-medium text-[#111827] whitespace-nowrap">{e.name}</td>
                      <td className="py-2 pr-2 text-[#6B7280] whitespace-nowrap">{e.role}</td>
                      <td className="py-2 pr-2 text-[#6B7280] whitespace-nowrap">{e.manager}</td>
                      <td className="py-2 pr-2 text-right text-[#374151]">{e.goalScore.toFixed(2)}</td>
                      <td className="py-2 pr-2 text-right text-[#374151]">{e.competencyScore.toFixed(2)}</td>
                      <td className="py-2 pr-2 text-right font-medium text-[#111827]">{e.provisional.toFixed(1)}</td>
                      <td className="py-2 pr-2 text-right font-semibold text-[#111827]">{e.calibrated.toFixed(1)}</td>
                      <td className={cn("py-2 pr-2 text-right font-medium", change < 0 ? "text-[#DC2626]" : change > 0 ? "text-[#10B981]" : "text-[#9CA3AF]")}>
                        {change === 0 ? "0.0" : change > 0 ? `+${change.toFixed(1)}` : change.toFixed(1)}
                      </td>
                      <td className={cn("py-2 pr-2 text-right", e.evidenceCoverage < 80 ? "text-[#D97706] font-medium" : "text-[#6B7280]")}>{e.evidenceCoverage}%</td>
                      <td className="py-2">
                        <PmStatusPill label={e.status} tone={statusTone(e.status)} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="mt-3 pt-3 border-t border-[#F1F5F9] flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-[#6B7280]">
                Showing 1–{filtered.length} of {TOTAL_EMPLOYEES}
              </p>
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} className="h-7 w-7 rounded-md border border-[#E5E7EB] flex items-center justify-center text-[#6B7280]">
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                {[1, 2, 3].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={cn("h-7 w-7 rounded-md text-xs font-semibold flex items-center justify-center", page === p ? "bg-[#7C3AED] text-white" : "border border-[#E5E7EB] text-[#6B7280]")}
                  >
                    {p}
                  </button>
                ))}
                <button type="button" onClick={() => setPage((p) => Math.min(3, p + 1))} className="h-7 w-7 rounded-md border border-[#E5E7EB] flex items-center justify-center text-[#6B7280]">
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </PmCard>

          {selected && (
            <PmCard className="p-0 h-fit sticky top-16">
              <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-3 border-b border-[#F1F5F9]">
                <div className="flex items-center gap-2.5">
                  <span className="h-9 w-9 rounded-full bg-[#7C3AED] text-white text-xs font-semibold flex items-center justify-center shrink-0">
                    {selected.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-[#111827]">{selected.name}</p>
                    <p className="text-[11px] text-[#6B7280]">
                      {selected.role} · Manager: {selected.manager}
                    </p>
                  </div>
                </div>
                <button type="button" onClick={() => setSelectedId(null)} className="text-[#9CA3AF] hover:text-[#111827] shrink-0">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="px-4 pt-3 pb-1 overflow-x-auto">
                <PmTabPills tabs={detailTabs} active={detailTab} onChange={setDetailTab} />
              </div>

              <div className="px-4 py-4">
                {detailTab === "overview" && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-[11px] font-semibold text-[#111827] mb-1.5">Score summary</p>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <p className="text-[#9CA3AF]">Goal score</p>
                          <p className="font-semibold text-[#111827]">{selected.goalScore.toFixed(2)} / 5</p>
                        </div>
                        <div>
                          <p className="text-[#9CA3AF]">Competency score</p>
                          <p className="font-semibold text-[#111827]">{selected.competencyScore.toFixed(2)} / 5</p>
                        </div>
                        <div>
                          <p className="text-[#9CA3AF]">Composite (weighted)</p>
                          <p className="font-semibold text-[#111827]">{(selected.goalScore * 0.7 + selected.competencyScore * 0.3).toFixed(2)} / 5</p>
                        </div>
                        <div>
                          <p className="text-[#9CA3AF]">Weighting</p>
                          <p className="font-medium text-[#111827]">70% Goal / 30% Competencies</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg border border-[#E5E7EB] p-2.5">
                        <p className="text-[10px] text-[#9CA3AF]">Current provisional rating</p>
                        <p className="text-base font-bold text-[#111827] mt-0.5">{selected.provisional.toFixed(1)} / 5</p>
                      </div>
                      <div className="rounded-lg border border-[#E5E7EB] p-2.5">
                        <p className="text-[10px] text-[#9CA3AF]">Proposed calibrated rating</p>
                        <p className="text-base font-bold text-[#7C3AED] mt-0.5">{selected.calibrated.toFixed(1)} / 5</p>
                      </div>
                    </div>

                    <div className="rounded-lg bg-[#F5F3FF] p-2.5">
                      <p className="text-[11px] font-semibold text-[#111827] mb-1">Proposed rating change</p>
                      <p className="text-[11px] text-[#374151]">
                        From <span className="font-semibold">{selected.provisional.toFixed(1)}</span> to <span className="font-semibold">{selected.calibrated.toFixed(1)}</span>{" "}
                        <span className={cn("font-semibold", selected.calibrated - selected.provisional < 0 ? "text-[#DC2626]" : "text-[#10B981]")}>
                          ({(selected.calibrated - selected.provisional).toFixed(1)})
                        </span>
                      </p>
                      <p className="text-[10px] text-[#6B7280] mt-1">Reason: Consistency with peer outcomes and evidence coverage.</p>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold text-[#111827] mb-1.5">Timesheet compliance (Q3)</p>
                      <div className="grid grid-cols-3 gap-2 text-[11px]">
                        <div>
                          <p className="text-[#9CA3AF]">Submitted</p>
                          <p className="font-semibold text-[#111827]">{selected.timesheet.submitted}%</p>
                        </div>
                        <div>
                          <p className="text-[#9CA3AF]">Approved</p>
                          <p className="font-semibold text-[#111827]">{selected.timesheet.approved}%</p>
                        </div>
                        <div>
                          <p className="text-[#9CA3AF]">On-time</p>
                          <p className="font-semibold text-[#111827]">{selected.timesheet.onTime}%</p>
                        </div>
                      </div>
                      <button type="button" className="mt-1.5 text-[11px] font-medium text-[#7C3AED] hover:underline">
                        Reference: Timesheets module →
                      </button>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold text-[#111827] mb-1.5">Evidence highlights</p>
                      {selected.evidence.length === 0 ? (
                        <p className="text-[11px] text-[#9CA3AF]">No supplementary evidence attached.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {selected.evidence.map((f) => (
                            <div key={f.name} className="flex items-center justify-between gap-2 text-[11px]">
                              <span className="inline-flex items-center gap-1.5 text-[#374151] truncate">
                                <FileText className="h-3.5 w-3.5 text-[#7C3AED] shrink-0" /> {f.name}
                              </span>
                              <span className="text-[10px] text-[#9CA3AF] shrink-0">
                                {f.size} · {f.date}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {detailTab !== "overview" && (
                  <p className="text-xs text-[#9CA3AF] py-8 text-center">
                    {detailTabs.find((t) => t.id === detailTab)?.label} details will appear here.
                  </p>
                )}
              </div>
            </PmCard>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <PmCard className="p-4">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-sm font-semibold text-[#111827]">Calibration panel</h3>
              <button type="button" className="text-[11px] font-medium text-[#7C3AED] hover:underline">
                Manage panel members
              </button>
            </div>
            <div className="space-y-2">
              {panelMembers.map((m) => (
                <div key={m.name} className="flex items-center justify-between gap-2 text-[11px]">
                  <div className="min-w-0">
                    <p className="font-medium text-[#111827] truncate">{m.name}</p>
                    <p className="text-[10px] text-[#9CA3AF] truncate">{m.role}</p>
                  </div>
                  <PmStatusPill label={m.conflict} tone="success" />
                </div>
              ))}
            </div>
          </PmCard>

          <PmCard className="p-4">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-sm font-semibold text-[#111827]">Conflict of interest declarations</h3>
            </div>
            <div className="space-y-2">
              {declarations.map((d) => (
                <div key={d.name} className="text-[11px]">
                  <p className="font-medium text-[#111827]">{d.name}</p>
                  <p className="text-[10px] text-[#9CA3AF]">
                    {d.at} · {d.declaration}
                  </p>
                </div>
              ))}
            </div>
            <button type="button" className="mt-2 text-[11px] font-medium text-[#7C3AED] hover:underline">
              View declarations →
            </button>
          </PmCard>

          <PmCard className="p-4">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-sm font-semibold text-[#111827]">Decision log</h3>
            </div>
            <div className="space-y-2">
              {decisionLog.map((d, i) => (
                <div key={i} className="text-[11px]">
                  <p className="text-[#374151]">
                    <span className="font-semibold text-[#111827]">{d.who}</span> — {d.action}
                  </p>
                  <p className="text-[10px] text-[#9CA3AF]">
                    {d.at} · {d.note}
                  </p>
                </div>
              ))}
            </div>
            <button type="button" className="mt-2 text-[11px] font-medium text-[#7C3AED] hover:underline">
              View full log →
            </button>
          </PmCard>

          <PmCard className="p-4">
            <h3 className="text-sm font-semibold text-[#111827] mb-2.5">Panel sign-off</h3>
            <div className="space-y-2 mb-3">
              {panelMembers.map((m) => (
                <div key={m.name} className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-[#374151] truncate">{m.name}</span>
                  <button
                    type="button"
                    onClick={() => toggleSignOff(m.name)}
                    className={cn(
                      "inline-flex items-center gap-1 h-7 px-2.5 rounded-full text-[10px] font-semibold border transition-colors shrink-0",
                      signOffs[m.name] ? "bg-[#D1FAE5] text-[#065F46] border-[#A7F3D0]" : "bg-white text-[#374151] border-[#E5E7EB] hover:bg-[#F9FAFB]"
                    )}
                  >
                    {signOffs[m.name] && <Check className="h-3 w-3" />} {signOffs[m.name] ? "Approved" : "Approve"}
                  </button>
                </div>
              ))}
            </div>
            <label className="flex items-start gap-2 text-[10px] text-[#374151] mb-2.5 cursor-pointer">
              <input type="checkbox" checked={confirmChecked} onChange={(e) => setConfirmChecked(e.target.checked)} className="mt-0.5 rounded border-[#D1D5DB]" />
              I confirm the calibration is fair, consistent and evidence-based.
            </label>
            <PmButton variant="primary" className="w-full" onClick={handleFinalise} disabled={!allApproved}>
              Finalise calibration
            </PmButton>
          </PmCard>
        </div>
      </div>
    </div>
  )
}
