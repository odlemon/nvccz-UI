"use client"

import { useMemo, useState } from "react"
import { ClipboardCheck, Download, ChevronDown, Check } from "lucide-react"
import { toast } from "sonner"
import { PerformanceMockTopChrome } from "@/components/performance-mock/shell"
import { PmButton, PmCard, PmPageHeader, PmStatusPill, PmTabPills } from "@/components/performance-mock/primitives"
import { cn } from "@/lib/utils"

type StepStatus = "completed" | "current" | "pending"
type ObjectiveRow = {
  no: number
  title: string
  code: string
  perspective: string
  weight: number
  self: number
  selfRating: string
  manager: number
  managerRating: string
  evidenceCoverage: number
  evidenceItems: number
  selfComment: string
  managerComment: string
}

type Competency = { name: string; self: number; manager: number }

type ReviewDef = {
  id: string
  title: string
  employee: string
  role: string
  cycle: string
  periodStart: string
  periodEnd: string
  dueDate: string
  daysRemaining: number
  objectives: ObjectiveRow[]
  competencies: Competency[]
  evidenceCoveragePct: number
  keyStrengths: string[]
  performanceGaps: string[]
  nextCyclePriorities: string[]
  developmentPlan: { name: string; date: string }[]
  approvalChain: { step: string; name: string; status: "Completed" | "In progress" | "Pending" }[]
  versionHistory: { version: string; date: string; by: string; current?: boolean }[]
}

const reviews: Record<string, ReviewDef> = {
  "REV-2026-Q3-0012": {
    id: "REV-2026-Q3-0012",
    title: "Mid-Year Performance Review",
    employee: "Rudo Chikore",
    role: "Senior Manager, Risk & Compliance",
    cycle: "FY2026",
    periodStart: "01 Jan 2026",
    periodEnd: "30 Jun 2026",
    dueDate: "31 Jul 2026",
    daysRemaining: 12,
    objectives: [
      {
        no: 1,
        title: "Strengthen credit risk governance",
        code: "G1.1",
        perspective: "Internal Process",
        weight: 25,
        self: 78,
        selfRating: "3 – Meets",
        manager: 72,
        managerRating: "3 – Meets",
        evidenceCoverage: 100,
        evidenceItems: 4,
        selfComment: "Implemented revised credit risk policy and stage migration framework. System integration still in progress.",
        managerComment: "Strong policy work delivered. Need faster credit scoring model and training completion.",
      },
      {
        no: 2,
        title: "Reduce non-performing loan ratio",
        code: "F1.2",
        perspective: "Financial",
        weight: 20,
        self: 70,
        selfRating: "3 – Meets",
        manager: 70,
        managerRating: "3 – Meets",
        evidenceCoverage: 60,
        evidenceItems: 3,
        selfComment: "NPL ratio reduced from 6.1% to 4.8% through tighter monitoring.",
        managerComment: "Good improvement in NPLs. Continue focus on early collection strategies.",
      },
      {
        no: 3,
        title: "Enhance compliance & regulatory adherence",
        code: "C1.1",
        perspective: "Customer & Stakeholder",
        weight: 20,
        self: 88,
        selfRating: "4 – Exceeds",
        manager: 86,
        managerRating: "4 – Exceeds",
        evidenceCoverage: 100,
        evidenceItems: 5,
        selfComment: "All regulatory submissions 100% on time, no adverse findings.",
        managerComment: "Excellent compliance record and stakeholder management. Maintain momentum.",
      },
      {
        no: 4,
        title: "Improve operational efficiency",
        code: "I1.2",
        perspective: "Internal Process",
        weight: 20,
        self: 70,
        selfRating: "3 – Meets",
        manager: 70,
        managerRating: "3 – Meets",
        evidenceCoverage: 86,
        evidenceItems: 3,
        selfComment: "Process mapping completed. Automation delivered in KYC.",
        managerComment: "Good progress. Evidence for automation benefits incomplete.",
      },
      {
        no: 5,
        title: "Develop risk & compliance capability",
        code: "L1.1",
        perspective: "Learning & Growth",
        weight: 15,
        self: 86,
        selfRating: "4 – Exceeds",
        manager: 86,
        managerRating: "4 – Exceeds",
        evidenceCoverage: 83,
        evidenceItems: 2,
        selfComment: "Delivered 6 training sessions. Team certifications improved.",
        managerComment: "Strong leadership in building capability. Close remaining evidence items.",
      },
    ],
    competencies: [
      { name: "Leadership", self: 4.2, manager: 4.0 },
      { name: "Communication", self: 4.0, manager: 3.8 },
      { name: "Risk Judgement", self: 4.4, manager: 4.4 },
      { name: "Collaboration", self: 4.0, manager: 4.2 },
      { name: "Accountability", self: 4.2, manager: 4.0 },
    ],
    evidenceCoveragePct: 92,
    keyStrengths: ["Risk governance and compliance leadership", "Regulatory submissions 100% on time", "Team capability development and coaching"],
    performanceGaps: ["Credit risk model integration behind plan", "Evidence for automation benefits incomplete"],
    nextCyclePriorities: ["Complete credit risk model integration", "Strengthen early warning indicators", "Deepen operational automation benefits"],
    developmentPlan: [
      { name: "Advanced Credit Risk Analytics", date: "30 Nov 2026" },
      { name: "CAMS Refresher", date: "31 Oct 2026" },
      { name: "Coaching – Executive Leadership", date: "15 Dec 2026" },
    ],
    approvalChain: [
      { step: "Self", name: "Rudo Chikore (Self)", status: "Completed" },
      { step: "Manager", name: "Farai Moyo (Manager)", status: "In progress" },
      { step: "Calibration", name: "Nyasha Chikwature (Calibration)", status: "Pending" },
      { step: "HR", name: "Chipo Mhlanga (HR)", status: "Pending" },
      { step: "CEO", name: "Tendai Sibanda (CEO)", status: "Pending" },
    ],
    versionHistory: [
      { version: "v2.0", date: "14 Jul 2026 10:15", by: "Farai Moyo", current: true },
      { version: "v1.1", date: "12 Jul 2026 16:40", by: "Rudo Chikore" },
      { version: "v1.0", date: "10 Jul 2026 09:22", by: "Rudo Chikore" },
    ],
  },
}

const stepDefs = [
  { id: "self", label: "Self-assessment", note: "Completed 10 Jul 2026", status: "completed" as StepStatus },
  { id: "manager", label: "Manager assessment", note: "In progress", status: "current" as StepStatus },
  { id: "calibration", label: "Calibration", note: "Pending", status: "pending" as StepStatus },
  { id: "ack", label: "Acknowledgement", note: "Pending", status: "pending" as StepStatus },
  { id: "complete", label: "Complete", note: "", status: "pending" as StepStatus },
]

const ratingGuide = [
  { score: 5, label: "Exceeds expectations — Exceptional Performance" },
  { score: 4, label: "Above expectations — Strong Performance" },
  { score: 3, label: "Meets expectations — Solid Performance" },
  { score: 2, label: "Below expectations — Improvement needed" },
  { score: 1, label: "Far below expectations — Unsatisfactory" },
]

const detailTabs = [
  { id: "objectives", label: "Objectives" },
  { id: "competencies", label: "Competencies" },
  { id: "feedback", label: "Feedback" },
  { id: "development", label: "Development" },
  { id: "summary", label: "Summary" },
]

function approvalTone(status: string): "success" | "info" | "neutral" {
  if (status === "Completed") return "success"
  if (status === "In progress") return "info"
  return "neutral"
}

export function ManagerReviewMockScreen({ reviewId = "REV-2026-Q3-0012" }: { reviewId?: string }) {
  const review = reviews[reviewId] || reviews["REV-2026-Q3-0012"]
  const [tab, setTab] = useState("objectives")
  const [managerScores, setManagerScores] = useState<Record<number, number>>({})

  const objectives = review.objectives.map((o) => ({ ...o, manager: managerScores[o.no] ?? o.manager }))

  const goalResult = useMemo(() => {
    const totalWeight = objectives.reduce((s, o) => s + o.weight, 0) || 1
    return objectives.reduce((s, o) => s + o.manager * o.weight, 0) / totalWeight
  }, [objectives])

  const competencyResult = useMemo(() => {
    const avg = review.competencies.reduce((s, c) => s + c.manager, 0) / review.competencies.length
    return (avg / 5) * 100
  }, [review.competencies])

  const preliminaryRating = ((goalResult / 100) * 5 * 0.5 + (competencyResult / 100) * 5 * 0.5).toFixed(1)

  const variances = objectives.filter((o) => Math.abs(o.manager - o.self) >= 5)
  const missingEvidence = objectives.filter((o) => o.evidenceCoverage < 100)

  const setManagerScore = (no: number, value: number) => setManagerScores((prev) => ({ ...prev, [no]: value }))

  const handleSave = () => toast.success("Assessment saved", { description: `${review.employee}'s manager assessment saved as draft.` })
  const handleSubmit = () => toast.success("Submitted for calibration", { description: `${review.employee}'s review sent to calibration panel.` })
  const handleRequestEvidence = () => toast("Evidence requested", { description: "Notification sent to employee." })

  return (
    <div className="min-h-full">
      <PerformanceMockTopChrome breadcrumbs={["Performance Management", "Reviews", review.id]} searchPlaceholder="Search reviews…" />
      <div className="p-4 lg:p-5 space-y-3">
        <PmPageHeader
          title={`${review.title} · ${review.cycle} · ${review.employee}`}
          subtitle={review.role}
          actions={
            <>
              <div className="text-right text-[11px] text-[#6B7280] leading-snug hidden lg:block">
                <p>
                  Review period: {review.periodStart} – {review.periodEnd}
                </p>
                <p>Review due: {review.dueDate}</p>
              </div>
              <PmButton variant="outline" onClick={() => toast.success("Export started", { description: "Review PDF will download shortly." })}>
                <Download className="h-3.5 w-3.5" /> Export
              </PmButton>
            </>
          }
        />

        <PmCard className="p-4">
          <div className="flex items-center overflow-x-auto">
            {stepDefs.map((s, i) => (
              <div key={s.id} className="flex items-center flex-1 last:flex-none min-w-[120px]">
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
                  {s.note && <span className="text-[10px] text-[#9CA3AF] whitespace-nowrap">{s.note}</span>}
                </div>
                {i < stepDefs.length - 1 && <div className="flex-1 h-px bg-[#E5E7EB] mx-2 mb-5" />}
              </div>
            ))}
          </div>
        </PmCard>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <PmCard className="p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Goal result (weighted)</p>
            <p className="mt-1 text-lg font-bold text-[#111827]">{goalResult.toFixed(1)}/100</p>
            <p className="mt-0.5 text-[10px] text-[#2563EB] font-medium">In progress</p>
          </PmCard>
          <PmCard className="p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Competency result (avg)</p>
            <p className="mt-1 text-lg font-bold text-[#111827]">{competencyResult.toFixed(1)}/100</p>
            <p className="mt-0.5 text-[10px] text-[#2563EB] font-medium">In progress</p>
          </PmCard>
          <PmCard className="p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Preliminary rating</p>
            <p className="mt-1 text-lg font-bold text-[#111827]">{preliminaryRating} / 5</p>
            <p className="mt-0.5 text-[10px] text-[#6B7280]">Preliminary rating</p>
          </PmCard>
          <PmCard className="p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Evidence coverage</p>
            <p className="mt-1 text-lg font-bold text-[#111827]">{review.evidenceCoveragePct}%</p>
            <p className="mt-0.5 text-[10px] text-[#10B981] font-medium">Good</p>
          </PmCard>
          <PmCard className="p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Review due</p>
            <p className="mt-1 text-lg font-bold text-[#111827]">{review.dueDate}</p>
            <p className="mt-0.5 text-[10px] text-[#6B7280]">{review.daysRemaining} days remaining</p>
          </PmCard>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4">
          <PmCard className="p-4 overflow-x-auto">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <PmTabPills tabs={detailTabs} active={tab} onChange={setTab} />
            </div>

            {tab === "objectives" && (
              <>
                <table className="w-full text-left text-[11px] min-w-[920px]">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wide text-[#9CA3AF]">
                      <th className="pb-2 font-semibold pr-2 w-6">#</th>
                      <th className="pb-2 font-semibold pr-2">Strategic Objective</th>
                      <th className="pb-2 font-semibold pr-2 text-right">Weight</th>
                      <th className="pb-2 font-semibold pr-2">Self rating</th>
                      <th className="pb-2 font-semibold pr-2">Manager rating</th>
                      <th className="pb-2 font-semibold pr-2 text-right">Evidence</th>
                      <th className="pb-2 font-semibold pr-2">Self commentary / Manager commentary</th>
                      <th className="pb-2 font-semibold text-right">Variance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {objectives.map((o) => {
                      const variance = o.manager - o.self
                      return (
                        <tr key={o.no} className="border-t border-[#F1F5F9] align-top">
                          <td className="py-2.5 pr-2 text-[#9CA3AF]">{o.no}</td>
                          <td className="py-2.5 pr-2">
                            <p className="font-medium text-[#111827] leading-snug">{o.title}</p>
                            <p className="text-[10px] text-[#9CA3AF] mt-0.5">
                              {o.perspective} · {o.code}
                            </p>
                          </td>
                          <td className="py-2.5 pr-2 text-right text-[#6B7280]">{o.weight}%</td>
                          <td className="py-2.5 pr-2">
                            <p className="font-semibold text-[#111827]">{o.self}</p>
                            <p className="text-[10px] text-[#6B7280]">{o.selfRating}</p>
                          </td>
                          <td className="py-2.5 pr-2">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={o.manager}
                              onChange={(e) => setManagerScore(o.no, Number(e.target.value))}
                              className="w-14 h-7 rounded-md border border-[#E5E7EB] px-1.5 text-[11px] font-semibold text-[#111827]"
                            />
                            <p className="text-[10px] text-[#6B7280] mt-0.5">{o.managerRating}</p>
                          </td>
                          <td className="py-2.5 pr-2 text-right">
                            <span className={cn("font-medium", o.evidenceCoverage < 100 ? "text-[#D97706]" : "text-[#10B981]")}>{o.evidenceCoverage}%</span>
                            <p className="text-[10px] text-[#9CA3AF]">{o.evidenceItems} items</p>
                          </td>
                          <td className="py-2.5 pr-2 max-w-[260px]">
                            <p className="text-[#374151] leading-snug">{o.selfComment}</p>
                            <p className="text-[#7C3AED] leading-snug mt-1">{o.managerComment}</p>
                          </td>
                          <td className={cn("py-2.5 text-right font-semibold", variance < 0 ? "text-[#DC2626]" : variance > 0 ? "text-[#10B981]" : "text-[#6B7280]")}>
                            {variance > 0 ? `+${variance}` : variance}
                          </td>
                        </tr>
                      )
                    })}
                    <tr className="border-t-2 border-[#E5E7EB] font-semibold">
                      <td colSpan={2} className="py-2.5 text-[#111827]">
                        Total
                      </td>
                      <td className="py-2.5 text-right text-[#111827]">{objectives.reduce((s, o) => s + o.weight, 0)}%</td>
                      <td className="py-2.5 text-[#111827]">{(objectives.reduce((s, o) => s + o.self, 0) / objectives.length).toFixed(1)}</td>
                      <td className="py-2.5 text-[#7C3AED]">{goalResult.toFixed(1)}</td>
                      <td colSpan={3} />
                    </tr>
                  </tbody>
                </table>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                  <PmCard className="p-3">
                    <p className="text-xs font-semibold text-[#111827] mb-1.5">Key strengths</p>
                    <ul className="space-y-1 text-[11px] text-[#374151] list-disc pl-3.5">
                      {review.keyStrengths.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </PmCard>
                  <PmCard className="p-3">
                    <p className="text-xs font-semibold text-[#111827] mb-1.5">Performance gaps</p>
                    <ul className="space-y-1 text-[11px] text-[#374151] list-disc pl-3.5">
                      {review.performanceGaps.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </PmCard>
                  <PmCard className="p-3">
                    <p className="text-xs font-semibold text-[#111827] mb-1.5">Next-cycle priorities</p>
                    <ol className="space-y-1 text-[11px] text-[#374151] list-decimal pl-3.5">
                      {review.nextCyclePriorities.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ol>
                  </PmCard>
                  <PmCard className="p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-semibold text-[#111827]">Development plan</p>
                      <button type="button" className="text-[10px] font-medium text-[#7C3AED] hover:underline">
                        View plan
                      </button>
                    </div>
                    <ul className="space-y-1 text-[11px] text-[#374151]">
                      {review.developmentPlan.map((d) => (
                        <li key={d.name} className="flex items-center justify-between gap-2">
                          <span className="truncate">{d.name}</span>
                          <span className="text-[10px] text-[#9CA3AF] shrink-0">{d.date}</span>
                        </li>
                      ))}
                    </ul>
                  </PmCard>
                </div>
              </>
            )}

            {tab === "competencies" && (
              <table className="w-full text-left text-xs min-w-[480px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wide text-[#9CA3AF]">
                    <th className="pb-2 font-semibold pr-2">Competency</th>
                    <th className="pb-2 font-semibold pr-2 text-right">Self rating</th>
                    <th className="pb-2 font-semibold pr-2 text-right">Manager rating</th>
                    <th className="pb-2 font-semibold text-right">Variance</th>
                  </tr>
                </thead>
                <tbody>
                  {review.competencies.map((c) => {
                    const variance = c.manager - c.self
                    return (
                      <tr key={c.name} className="border-t border-[#F1F5F9]">
                        <td className="py-2.5 pr-2 font-medium text-[#111827]">{c.name}</td>
                        <td className="py-2.5 pr-2 text-right text-[#6B7280]">{c.self.toFixed(1)} / 5</td>
                        <td className="py-2.5 pr-2 text-right font-semibold text-[#111827]">{c.manager.toFixed(1)} / 5</td>
                        <td className={cn("py-2.5 text-right font-medium", variance < 0 ? "text-[#DC2626]" : variance > 0 ? "text-[#10B981]" : "text-[#6B7280]")}>
                          {variance > 0 ? `+${variance.toFixed(1)}` : variance.toFixed(1)}
                        </td>
                      </tr>
                    )
                  })}
                  <tr className="border-t-2 border-[#E5E7EB] font-semibold">
                    <td className="py-2.5 text-[#111827]">Average</td>
                    <td className="py-2.5 text-right text-[#6B7280]">{(review.competencies.reduce((s, c) => s + c.self, 0) / review.competencies.length).toFixed(1)} / 5</td>
                    <td className="py-2.5 text-right text-[#7C3AED]">{(review.competencies.reduce((s, c) => s + c.manager, 0) / review.competencies.length).toFixed(1)} / 5</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            )}

            {tab === "feedback" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <PmCard className="p-3.5">
                  <p className="text-xs font-semibold text-[#111827] mb-2">Manager feedback</p>
                  <p className="text-xs text-[#374151] leading-relaxed">
                    {review.employee} continues to lead risk governance with rigour. Focus areas for H2 are accelerating the credit model integration and closing outstanding evidence items on operational
                    efficiency.
                  </p>
                </PmCard>
                <PmCard className="p-3.5">
                  <p className="text-xs font-semibold text-[#111827] mb-2">Self-assessment summary</p>
                  <p className="text-xs text-[#374151] leading-relaxed">
                    Delivered against all objectives with strong compliance outcomes. NPL ratio improved materially. Credit model integration is the key carry-forward item.
                  </p>
                </PmCard>
                <PmCard className="p-3.5 lg:col-span-2">
                  <p className="text-xs font-semibold text-[#111827] mb-2">Peer feedback (3)</p>
                  <div className="space-y-2.5">
                    {[
                      { name: "Chipo Mhlanga", text: "Rudo is a strong collaborator on cross-functional compliance initiatives." },
                      { name: "Nyasha Moyo", text: "Always responsive and thorough on portfolio risk queries." },
                    ].map((p) => (
                      <div key={p.name} className="text-xs">
                        <p className="font-semibold text-[#111827]">{p.name}</p>
                        <p className="text-[#6B7280] mt-0.5">{p.text}</p>
                      </div>
                    ))}
                  </div>
                </PmCard>
              </div>
            )}

            {tab === "development" && (
              <div className="space-y-2.5">
                {review.developmentPlan.map((d) => (
                  <div key={d.name} className="flex items-center justify-between gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-xs">
                    <span className="text-[#374151] font-medium">{d.name}</span>
                    <span className="text-[#6B7280]">Target: {d.date}</span>
                  </div>
                ))}
              </div>
            )}

            {tab === "summary" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="text-xs">
                    <p className="text-[#9CA3AF]">Goal result</p>
                    <p className="font-semibold text-[#111827]">{goalResult.toFixed(1)}/100</p>
                  </div>
                  <div className="text-xs">
                    <p className="text-[#9CA3AF]">Competency result</p>
                    <p className="font-semibold text-[#111827]">{competencyResult.toFixed(1)}/100</p>
                  </div>
                  <div className="text-xs">
                    <p className="text-[#9CA3AF]">Preliminary rating</p>
                    <p className="font-semibold text-[#111827]">{preliminaryRating}/5</p>
                  </div>
                  <div className="text-xs">
                    <p className="text-[#9CA3AF]">Evidence coverage</p>
                    <p className="font-semibold text-[#111827]">{review.evidenceCoveragePct}%</p>
                  </div>
                </div>
                <PmCard className="p-3.5">
                  <p className="text-xs font-semibold text-[#111827] mb-2">Overall manager recommendation</p>
                  <p className="text-xs text-[#374151] leading-relaxed">
                    Recommend a rating of {Math.round(Number(preliminaryRating))} – Meets/Above expectations, pending calibration. Strong compliance delivery offset by integration delays on credit risk
                    modelling.
                  </p>
                </PmCard>
              </div>
            )}
          </PmCard>

          <div className="space-y-3">
            <PmCard className="p-4">
              <h3 className="text-sm font-semibold text-[#111827] mb-2.5">Rating guide (1–5)</h3>
              <div className="space-y-2">
                {ratingGuide.map((r) => (
                  <div key={r.score} className="flex items-start gap-2 text-[11px]">
                    <span className="h-5 w-5 rounded-full bg-[#F5F3FF] text-[#7C3AED] font-bold flex items-center justify-center shrink-0">{r.score}</span>
                    <p className="text-[#374151] leading-snug">{r.label}</p>
                  </div>
                ))}
              </div>
            </PmCard>

            <PmCard className="p-4 space-y-2">
              <h3 className="text-sm font-semibold text-[#111827] mb-1">Review controls</h3>
              <button
                type="button"
                onClick={handleRequestEvidence}
                className="inline-flex items-center justify-between gap-1.5 w-full h-9 px-3.5 rounded-full border border-[#E5E7EB] bg-white text-sm text-[#374151] hover:bg-[#F9FAFB]"
              >
                Request evidence <ChevronDown className="h-3.5 w-3.5 text-[#9CA3AF]" />
              </button>
              <PmButton variant="outline" className="w-full" onClick={handleSave}>
                Save assessment
              </PmButton>
              <PmButton variant="primary" className="w-full" onClick={handleSubmit}>
                <ClipboardCheck className="h-3.5 w-3.5" /> Submit for calibration
              </PmButton>
            </PmCard>

            {missingEvidence.length > 0 && (
              <PmCard className="p-3.5 bg-[#FEF3C7] border-[#FDE68A]">
                <p className="text-[11px] font-semibold text-[#92400E]">Missing evidence</p>
                <p className="text-[11px] text-[#92400E] mt-0.5">{missingEvidence.length} objectives require evidence</p>
                <button type="button" className="mt-1 text-[11px] font-medium text-[#92400E] hover:underline">
                  View details →
                </button>
              </PmCard>
            )}

            {variances.length > 0 && (
              <PmCard className="p-3.5 bg-[#FEE2E2] border-[#FECACA]">
                <p className="text-[11px] font-semibold text-[#991B1B]">Rating variance</p>
                <p className="text-[11px] text-[#991B1B] mt-0.5">{variances.length} objectives have variance ≥ 5 points</p>
                <button type="button" className="mt-1 text-[11px] font-medium text-[#991B1B] hover:underline">
                  Review variances →
                </button>
              </PmCard>
            )}

            <PmCard className="p-4">
              <h3 className="text-sm font-semibold text-[#111827] mb-2.5">Approval chain</h3>
              <div className="space-y-2">
                {review.approvalChain.map((a, i) => (
                  <div key={a.step} className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-[#374151] truncate">
                      {i + 1}. {a.name}
                    </span>
                    <PmStatusPill label={a.status} tone={approvalTone(a.status)} />
                  </div>
                ))}
              </div>
            </PmCard>

            <PmCard className="p-4">
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-sm font-semibold text-[#111827]">Version history</h3>
              </div>
              <div className="space-y-2">
                {review.versionHistory.map((v) => (
                  <div key={v.version} className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-[#374151]">
                      {v.version} · {v.date} · {v.by}
                    </span>
                    {v.current && <PmStatusPill label="Current" tone="purple" />}
                  </div>
                ))}
              </div>
              <button type="button" className="mt-2 text-[11px] font-medium text-[#7C3AED] hover:underline">
                View full history →
              </button>
            </PmCard>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-[#9CA3AF] pt-1">
          <span>Last saved: 18 Jul 2026 08:47 by Farai Moyo</span>
          <span className="flex items-center gap-3">
            <button type="button" className="hover:text-[#7C3AED]">
              Audit trail
            </button>
            <button type="button" className="hover:text-[#7C3AED]">
              Data integrity
            </button>
            <button type="button" className="hover:text-[#7C3AED]">
              Support
            </button>
            <span>v2026.07.18</span>
          </span>
        </div>
      </div>
    </div>
  )
}
