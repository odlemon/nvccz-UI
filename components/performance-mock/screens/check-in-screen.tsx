"use client"

import { useMemo, useState } from "react"
import { Check, Mail, Phone, CalendarClock, Plus, AlertTriangle, ShieldAlert } from "lucide-react"
import { toast } from "sonner"
import { PerformanceMockTopChrome } from "@/components/performance-mock/shell"
import { PmButton, PmCard, PmPageHeader, PmProgress, PmStatusPill, PmTabPills } from "@/components/performance-mock/primitives"
import { cn } from "@/lib/utils"

type KrRow = { no: number; title: string; weight: number; target: string; previous: string; current: string; progress: number; evidence: string; status: "On track" | "Behind" | "At risk" }

type CheckInDef = {
  id: string
  objective: string
  perspective: string
  owner: string
  weight: number
  previousProgress: number
  proposedProgress: number
  asOf: string
  manager: string
  managerRole: string
  krs: KrRow[]
  createdBy: string
  createdAt: string
  savedAt: string
}

const checkIns: Record<string, CheckInDef> = {
  "CHK-2026-Q3-0048": {
    id: "CHK-2026-Q3-0048",
    objective: "Reduce portfolio reporting turnaround",
    perspective: "Internal Process",
    owner: "Nyasha Moyo",
    weight: 15,
    previousProgress: 68,
    proposedProgress: 74,
    asOf: "18 Jul 2026",
    manager: "Farai Moyo",
    managerRole: "Head of Performance & Analytics",
    krs: [
      { no: 1, title: "% of portfolio companies submitting complete reports by due date", weight: 50, target: "80%", previous: "60%", current: "74%", progress: 74, evidence: "EV-2026-2451", status: "On track" },
      { no: 2, title: "Average reporting turnaround time (days)", weight: 30, target: "5 days", previous: "6.2 days", current: "5.2 days", progress: 78, evidence: "EV-2026-2452", status: "On track" },
      { no: 3, title: "Data quality score (out of 100)", weight: 20, target: "90", previous: "82", current: "86", progress: 86, evidence: "EV-2026-2453", status: "Behind" },
    ],
    createdBy: "Nyasha Moyo",
    createdAt: "18 Jul 2026 09:12",
    savedAt: "18 Jul 2026 09:27",
  },
}

const evidenceRows = [
  { type: "File", name: "Standard Reporting Pack v2.pdf", ref: "EV-2026-2451", date: "18 Jul 2026", by: "Nyasha Moyo" },
  { type: "File", name: "Data Validation Checklist - Pilot Report.pdf", ref: "EV-2026-2452", date: "12 Jul 2026", by: "Nyasha Moyo" },
  { type: "File", name: "Turnaround Time Analysis Q3.xlsx", ref: "EV-2026-2453", date: "14 Jul 2026", by: "Nyasha Moyo" },
]

type ActionItem = { no: number; action: string; owner: string; due: string; priority: "High" | "Medium" | "Low"; dependency: string; status: "Open" | "Done" }
const initialActions: ActionItem[] = [
  { no: 1, action: "Support Metro Retail ERP data mapping and extraction", owner: "Tendai Sibanda", due: "28 Jul 2026", priority: "High", dependency: "Decision", status: "Open" },
  { no: 2, action: "Enforce reporting calendar for late submissions", owner: "Chipo Mhlanga", due: "31 Jul 2026", priority: "Medium", dependency: "Decision", status: "Open" },
  { no: 3, action: "Complete onboarding for remaining 2 portfolio companies", owner: "Nyasha Moyo", due: "15 Aug 2026", priority: "Medium", dependency: "None", status: "Open" },
]

const checkinHistory = [
  { period: "Q3 (Current)", date: "18 Jul 2026", note: "Employee update", value: null as string | null },
  { period: "Q2", date: "15 Apr 2026", note: "Manager review completed", value: "68%" },
  { period: "Q1", date: "16 Jan 2026", note: "Manager review completed", value: "55%" },
  { period: "Q4 (FY2025)", date: "17 Oct 2025", note: "Manager review completed", value: "42%" },
]

const makerCheckerHistory = [
  { who: "Nyasha Moyo", role: "Maker", at: "18 Jul 2026 09:27", note: "Employee update saved" },
  { who: "System", role: "", at: "18 Jul 2026 09:12", note: "Check-in prepared" },
]

const stepDefs = [
  { id: "prepare", label: "Prepare", status: "completed" as const },
  { id: "employee", label: "Employee update", status: "current" as const },
  { id: "manager", label: "Manager review", status: "pending" as const },
  { id: "agree", label: "Agree actions", status: "pending" as const },
  { id: "complete", label: "Complete", status: "pending" as const },
]

const recordTabs = [
  { id: "evidence", label: "Evidence" },
  { id: "actions", label: "Action Items" },
]

function statusTone(s: KrRow["status"]): "success" | "warning" | "danger" {
  if (s === "On track") return "success"
  if (s === "Behind") return "warning"
  return "danger"
}
function priorityTone(p: ActionItem["priority"]): "danger" | "warning" | "neutral" {
  if (p === "High") return "danger"
  if (p === "Medium") return "warning"
  return "neutral"
}

function CharCount({ value, max = 1000 }: { value: string; max?: number }) {
  return (
    <span className={cn("text-[10px]", value.length > max ? "text-[#EF4444]" : "text-[#9CA3AF]")}>
      {value.length}/{max}
    </span>
  )
}

export function CheckInMockScreen({ id = "CHK-2026-Q3-0048" }: { id?: string }) {
  const checkIn = checkIns[id] || checkIns["CHK-2026-Q3-0048"]
  const [confidence, setConfidence] = useState("Medium")
  const [proposedProgress, setProposedProgress] = useState(checkIn.proposedProgress)
  const [progressNarrative, setProgressNarrative] = useState(
    "Two portfolio companies moved to the standard reporting pack (AgriGrow and ZimBuild). We trained finance teams and piloted the data validation checklist. Reporting pack adoption is at 74% compared to the 80% target."
  )
  const [achievements, setAchievements] = useState(
    "Standard reporting pack adopted by 2 portfolio companies. Data validation checklist piloted with improved accuracy. Average report preparation time reduced by 18%."
  )
  const [blockers, setBlockers] = useState("One portfolio company (Metro Retail) delayed data submission due to ERP cutover.")
  const [decisions, setDecisions] = useState("Approve resource support for Metro Retail ERP data mapping. Confirm enforcement of reporting calendar for late submissions.")
  const [nextCommitments, setNextCommitments] = useState("Complete onboarding for remaining 2 portfolio companies. Finalise automation of report consolidation by end of Q4.")
  const [actionsTab, setActionsTab] = useState<"evidence" | "actions">("evidence")
  const [actions, setActions] = useState<ActionItem[]>(initialActions)

  const weightedProgress = useMemo(() => {
    const totalWeight = checkIn.krs.reduce((s, k) => s + k.weight, 0) || 1
    return checkIn.krs.reduce((s, k) => s + k.progress * k.weight, 0) / totalWeight
  }, [checkIn.krs])

  const handleAddEvidence = () => toast("Add evidence", { description: "Opening evidence upload dialog." })
  const handleAddAction = () => {
    setActions((prev) => [...prev, { no: prev.length + 1, action: "New action item", owner: checkIn.owner, due: "TBD", priority: "Medium", dependency: "None", status: "Open" }])
  }
  const handleSaveDraft = () => toast.success("Draft saved", { description: `${checkIn.id} saved as draft.` })
  const handleSubmit = () => toast.success("Submitted to manager", { description: `${checkIn.id} sent to ${checkIn.manager} for review.` })

  return (
    <div className="min-h-full">
      <PerformanceMockTopChrome breadcrumbs={["Performance Management", "Check-ins", checkIn.id]} searchPlaceholder="Search check-ins…" />
      <div className="p-4 lg:p-6 space-y-5">
        <PmPageHeader
          title={`Quarterly Check-In · ${checkIn.id}`}
          subtitle={`Objective: ${checkIn.objective} · Perspective: ${checkIn.perspective} · Owner (Employee): ${checkIn.owner} · Weight: ${checkIn.weight}%`}
        />

        <PmCard className="p-4">
          <div className="flex items-center overflow-x-auto">
            {stepDefs.map((s, i) => (
              <div key={s.id} className="flex items-center flex-1 last:flex-none min-w-[110px]">
                <div className="flex flex-col items-center gap-1 text-center">
                  <span
                    className={cn(
                      "h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                      s.status === "completed" ? "bg-[#10B981] text-white" : s.status === "current" ? "bg-[#7C3AED] text-white" : "bg-[#F3F4F6] text-[#9CA3AF]"
                    )}
                  >
                    {s.status === "completed" ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span className={cn("text-[11px] font-medium whitespace-nowrap", s.status === "current" ? "text-[#7C3AED]" : s.status === "completed" ? "text-[#10B981]" : "text-[#9CA3AF]")}>
                    {s.label}
                  </span>
                </div>
                {i < stepDefs.length - 1 && <div className="flex-1 h-px bg-[#E5E7EB] mx-2 mb-5" />}
              </div>
            ))}
          </div>
        </PmCard>

        <PmCard className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Previous progress (Q2)</p>
              <p className="mt-1 text-lg font-bold text-[#111827]">{checkIn.previousProgress}%</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Proposed progress (Q3)</p>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={proposedProgress}
                  onChange={(e) => setProposedProgress(Number(e.target.value))}
                  className="w-16 h-8 rounded-md border border-[#E5E7EB] px-2 text-sm font-bold text-[#111827]"
                />
                <span className="text-sm font-bold text-[#111827]">%</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Confidence level</p>
              <select value={confidence} onChange={(e) => setConfidence(e.target.value)} className="mt-1 h-8 w-full rounded-md border border-[#E5E7EB] px-2 text-sm text-[#111827]">
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">As of</p>
              <p className="mt-1 text-sm font-medium text-[#111827] flex items-center gap-1.5 h-8">
                <CalendarClock className="h-3.5 w-3.5 text-[#9CA3AF]" /> {checkIn.asOf}
              </p>
            </div>
          </div>
        </PmCard>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4">
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <PmCard className="p-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#111827]">Progress narrative</label>
                  <CharCount value={progressNarrative} />
                </div>
                <textarea value={progressNarrative} onChange={(e) => setProgressNarrative(e.target.value)} rows={4} className="w-full rounded-lg border border-[#E5E7EB] px-2.5 py-2 text-xs leading-relaxed outline-none focus:border-[#C4B5FD] resize-none" />
              </PmCard>
              <PmCard className="p-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#111827]">Achievements this period</label>
                  <CharCount value={achievements} />
                </div>
                <textarea value={achievements} onChange={(e) => setAchievements(e.target.value)} rows={4} className="w-full rounded-lg border border-[#E5E7EB] px-2.5 py-2 text-xs leading-relaxed outline-none focus:border-[#C4B5FD] resize-none" />
              </PmCard>
              <PmCard className="p-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#111827]">Blockers / Issues</label>
                  <CharCount value={blockers} />
                </div>
                <textarea value={blockers} onChange={(e) => setBlockers(e.target.value)} rows={3} className="w-full rounded-lg border border-[#E5E7EB] px-2.5 py-2 text-xs leading-relaxed outline-none focus:border-[#C4B5FD] resize-none" />
              </PmCard>
              <PmCard className="p-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#111827]">Decisions needed</label>
                  <CharCount value={decisions} />
                </div>
                <textarea value={decisions} onChange={(e) => setDecisions(e.target.value)} rows={3} className="w-full rounded-lg border border-[#E5E7EB] px-2.5 py-2 text-xs leading-relaxed outline-none focus:border-[#C4B5FD] resize-none" />
              </PmCard>
              <PmCard className="p-3.5 lg:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#111827]">Next period commitments</label>
                  <CharCount value={nextCommitments} />
                </div>
                <textarea value={nextCommitments} onChange={(e) => setNextCommitments(e.target.value)} rows={3} className="w-full rounded-lg border border-[#E5E7EB] px-2.5 py-2 text-xs leading-relaxed outline-none focus:border-[#C4B5FD] resize-none" />
              </PmCard>
            </div>

            <PmCard className="p-4 overflow-x-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[#111827]">Key Results</h3>
                <span className="text-[11px] text-[#6B7280]">
                  Weighted progress: <span className="font-semibold text-[#111827]">{weightedProgress.toFixed(0)}%</span>
                </span>
              </div>
              <table className="w-full text-left text-[11px] min-w-[700px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wide text-[#9CA3AF]">
                    <th className="pb-2 font-semibold pr-2 w-6">#</th>
                    <th className="pb-2 font-semibold pr-2">Key Result</th>
                    <th className="pb-2 font-semibold pr-2 text-right">Weight</th>
                    <th className="pb-2 font-semibold pr-2 text-right">Target (Q3)</th>
                    <th className="pb-2 font-semibold pr-2 text-right">Previous (Q2)</th>
                    <th className="pb-2 font-semibold pr-2 text-right">Current (Q3)</th>
                    <th className="pb-2 font-semibold pr-2 w-24">Progress</th>
                    <th className="pb-2 font-semibold pr-2">Evidence</th>
                    <th className="pb-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {checkIn.krs.map((k) => (
                    <tr key={k.no} className="border-t border-[#F1F5F9]">
                      <td className="py-2.5 pr-2 text-[#9CA3AF]">{k.no}</td>
                      <td className="py-2.5 pr-2 text-[#374151] leading-snug">{k.title}</td>
                      <td className="py-2.5 pr-2 text-right text-[#6B7280]">{k.weight}%</td>
                      <td className="py-2.5 pr-2 text-right text-[#6B7280] whitespace-nowrap">{k.target}</td>
                      <td className="py-2.5 pr-2 text-right text-[#6B7280] whitespace-nowrap">{k.previous}</td>
                      <td className="py-2.5 pr-2 text-right font-semibold text-[#111827] whitespace-nowrap">{k.current}</td>
                      <td className="py-2.5 pr-2">
                        <PmProgress value={k.progress} color={k.status === "On track" ? "#10B981" : k.status === "Behind" ? "#F59E0B" : "#EF4444"} />
                      </td>
                      <td className="py-2.5 pr-2 text-[#7C3AED] whitespace-nowrap">{k.evidence}</td>
                      <td className="py-2.5">
                        <PmStatusPill label={k.status} tone={statusTone(k.status)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </PmCard>

            <PmCard className="p-4">
              <PmTabPills tabs={recordTabs} active={actionsTab} onChange={(v) => setActionsTab(v as "evidence" | "actions")} />

              {actionsTab === "evidence" && (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-[11px] min-w-[540px]">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-wide text-[#9CA3AF]">
                        <th className="pb-2 font-semibold pr-2">Type</th>
                        <th className="pb-2 font-semibold pr-2">Name / Description</th>
                        <th className="pb-2 font-semibold pr-2">Ref</th>
                        <th className="pb-2 font-semibold pr-2">Date</th>
                        <th className="pb-2 font-semibold">Added by</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evidenceRows.map((e) => (
                        <tr key={e.ref} className="border-t border-[#F1F5F9]">
                          <td className="py-2 pr-2 text-[#6B7280]">{e.type}</td>
                          <td className="py-2 pr-2 text-[#374151]">{e.name}</td>
                          <td className="py-2 pr-2 text-[#7C3AED]">{e.ref}</td>
                          <td className="py-2 pr-2 text-[#6B7280] whitespace-nowrap">{e.date}</td>
                          <td className="py-2 text-[#6B7280] whitespace-nowrap">{e.by}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button
                    type="button"
                    onClick={handleAddEvidence}
                    className="mt-3 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-dashed border-[#D1D5DB] text-[11px] text-[#6B7280] hover:bg-[#F9FAFB]"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add evidence
                  </button>
                </div>
              )}

              {actionsTab === "actions" && (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-[11px] min-w-[620px]">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-wide text-[#9CA3AF]">
                        <th className="pb-2 font-semibold pr-2 w-6">#</th>
                        <th className="pb-2 font-semibold pr-2">Action</th>
                        <th className="pb-2 font-semibold pr-2">Owner</th>
                        <th className="pb-2 font-semibold pr-2">Due date</th>
                        <th className="pb-2 font-semibold pr-2">Priority</th>
                        <th className="pb-2 font-semibold pr-2">Dependency</th>
                        <th className="pb-2 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {actions.map((a) => (
                        <tr key={a.no} className="border-t border-[#F1F5F9]">
                          <td className="py-2 pr-2 text-[#9CA3AF]">{a.no}</td>
                          <td className="py-2 pr-2 text-[#374151]">{a.action}</td>
                          <td className="py-2 pr-2 text-[#6B7280] whitespace-nowrap">{a.owner}</td>
                          <td className="py-2 pr-2 text-[#6B7280] whitespace-nowrap">{a.due}</td>
                          <td className="py-2 pr-2">
                            <PmStatusPill label={a.priority} tone={priorityTone(a.priority)} />
                          </td>
                          <td className="py-2 pr-2 text-[#6B7280] whitespace-nowrap">{a.dependency}</td>
                          <td className="py-2">
                            <PmStatusPill label={a.status} tone={a.status === "Open" ? "info" : "success"} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button
                    type="button"
                    onClick={handleAddAction}
                    className="mt-3 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-dashed border-[#D1D5DB] text-[11px] text-[#6B7280] hover:bg-[#F9FAFB]"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add action item
                  </button>
                </div>
              )}
            </PmCard>
          </div>

          <div className="space-y-4">
            <PmCard className="p-4">
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-sm font-semibold text-[#111827]">Accountability</h3>
                <button type="button" className="text-[11px] font-medium text-[#7C3AED] hover:underline">
                  Edit
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide mb-1">Manager</p>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-8 w-8 rounded-full bg-[#2563EB] text-white text-[11px] font-semibold flex items-center justify-center shrink-0">FM</span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#111827] truncate">{checkIn.manager}</p>
                        <p className="text-[10px] text-[#6B7280] truncate">{checkIn.managerRole}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button type="button" className="h-6 w-6 rounded-full flex items-center justify-center text-[#6B7280] hover:bg-[#F3F4F6]">
                        <Mail className="h-3 w-3" />
                      </button>
                      <button type="button" className="h-6 w-6 rounded-full flex items-center justify-center text-[#6B7280] hover:bg-[#F3F4F6]">
                        <Phone className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide mb-1">Employee</p>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-8 w-8 rounded-full bg-[#7C3AED] text-white text-[11px] font-semibold flex items-center justify-center shrink-0">NM</span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#111827] truncate">{checkIn.owner}</p>
                        <p className="text-[10px] text-[#6B7280] truncate">Performance Analyst</p>
                      </div>
                    </div>
                    <button type="button" className="h-6 w-6 rounded-full flex items-center justify-center text-[#6B7280] hover:bg-[#F3F4F6] shrink-0">
                      <Mail className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            </PmCard>

            <PmCard className="p-4">
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-sm font-semibold text-[#111827]">Scheduled conversation</h3>
              </div>
              <p className="text-xs text-[#374151]">22 Jul 2026 10:00</p>
              <PmButton variant="outline" className="w-full mt-2" onClick={() => toast("Reschedule", { description: "Opening calendar to reschedule conversation." })}>
                <CalendarClock className="h-3.5 w-3.5" /> Reschedule
              </PmButton>
            </PmCard>

            <PmCard className="p-4">
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-sm font-semibold text-[#111827]">Check-in history</h3>
              </div>
              <div className="space-y-2.5">
                {checkinHistory.map((h) => (
                  <div key={h.period} className="flex items-start gap-2.5 text-[11px]">
                    <span className={cn("h-2 w-2 rounded-full mt-1 shrink-0", h.period.includes("Current") ? "bg-[#7C3AED]" : "bg-[#D1D5DB]")} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[#111827]">{h.period}</p>
                      <p className="text-[#6B7280]">
                        {h.date} · {h.note} {h.value && <span className="font-semibold text-[#111827]">{h.value}</span>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </PmCard>

            <PmCard className="p-4">
              <h3 className="text-sm font-semibold text-[#111827] mb-2.5">Manager comments</h3>
              <div className="flex items-start gap-2.5">
                <span className="h-7 w-7 rounded-full bg-[#2563EB] text-white text-[10px] font-semibold flex items-center justify-center shrink-0">FM</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#111827]">
                    {checkIn.manager} <span className="text-[10px] text-[#9CA3AF] font-normal">18 Jul 2026 09:30</span>
                  </p>
                  <p className="text-[11px] text-[#374151] mt-0.5 leading-snug">Good progress. Please ensure Metro Retail support has a clear timeline.</p>
                  <button type="button" className="text-[11px] font-medium text-[#7C3AED] hover:underline mt-1">
                    Reply
                  </button>
                </div>
              </div>
            </PmCard>

            <PmCard className="p-3.5 bg-[#FEF3C7] border-[#FDE68A]">
              <p className="text-[11px] font-semibold text-[#92400E] inline-flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" /> Validation warning
              </p>
              <p className="text-[11px] text-[#92400E] mt-0.5">One blocker has no clear owner</p>
              <button type="button" className="mt-1 text-[11px] font-medium text-[#92400E] hover:underline">
                View details →
              </button>
            </PmCard>

            <PmCard className="p-4">
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-sm font-semibold text-[#111827] inline-flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-[#7C3AED]" /> Maker-Checker history
                </h3>
                <button type="button" className="text-[11px] font-medium text-[#7C3AED] hover:underline">
                  View all
                </button>
              </div>
              <div className="space-y-2.5">
                {makerCheckerHistory.map((m, i) => (
                  <div key={i} className="text-[11px]">
                    <p className="text-[#374151]">
                      <span className="font-semibold text-[#111827]">{m.who}</span> {m.role && `(${m.role})`}
                    </p>
                    <p className="text-[#9CA3AF]">
                      {m.at} · {m.note}
                    </p>
                  </div>
                ))}
              </div>
            </PmCard>

            <div className="flex items-center gap-2">
              <PmButton variant="outline" className="flex-1" onClick={handleSaveDraft}>
                Save draft
              </PmButton>
              <PmButton variant="primary" className="flex-1" onClick={handleSubmit}>
                Submit to manager
              </PmButton>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-[#9CA3AF]">
          Created {checkIn.createdAt} by {checkIn.createdBy} · Last saved {checkIn.savedAt} by {checkIn.createdBy}
        </p>
      </div>
    </div>
  )
}
