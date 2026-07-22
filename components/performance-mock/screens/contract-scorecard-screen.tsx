"use client"

import { useMemo, useState } from "react"
import { Sparkles, MessageSquare, TrendingUp, Users, Settings, Lightbulb, Crown, Users2 } from "lucide-react"
import { toast } from "sonner"
import { PerformanceMockTopChrome } from "@/components/performance-mock/shell"
import { PmAvatar, PmButton, PmCard, PmModal, PmPageHeader, PmProgress, PmSelectChip, PmStatusPill } from "@/components/performance-mock/primitives"

type Pillar = "Financial" | "Customer" | "Internal Process" | "Learning & Growth"
type RowStatus = "On Track" | "At Risk" | "Off Track"

type ScorecardRow = {
  id: string
  pillar: Pillar
  objective: string
  kpi: string
  weight: number
  target: string
  actual: string
  score: number
  status: RowStatus
  comments: { id: string; author: string; text: string; date: string }[]
}

const pillarIcon: Record<Pillar, typeof TrendingUp> = {
  Financial: TrendingUp,
  Customer: Users,
  "Internal Process": Settings,
  "Learning & Growth": Lightbulb,
}

const pillarColor: Record<Pillar, string> = {
  Financial: "#7C3AED",
  Customer: "#2563EB",
  "Internal Process": "#10B981",
  "Learning & Growth": "#F97316",
}

const boardRows: Omit<ScorecardRow, "comments">[] = [
  { id: "b1", pillar: "Financial", objective: "Strengthen Financial Resilience & Governance", kpi: "Cash Reserves ($M)", weight: 30, target: "$6M – $10M", actual: "$8.4M", score: 92, status: "On Track" },
  { id: "b2", pillar: "Customer", objective: "Protect Brand & Stakeholder Trust", kpi: "Regulatory Compliance Score (%)", weight: 25, target: "95% – 100%", actual: "97%", score: 94, status: "On Track" },
  { id: "b3", pillar: "Internal Process", objective: "Ensure Effective Risk Oversight", kpi: "Audit Findings Closed (%)", weight: 25, target: "85% – 100%", actual: "79%", score: 74, status: "At Risk" },
  { id: "b4", pillar: "Learning & Growth", objective: "Strengthen Board & Leadership Capability", kpi: "Director Development Hours", weight: 20, target: "20 – 40 hrs", actual: "26 hrs", score: 81, status: "On Track" },
]

const ceoRows: Omit<ScorecardRow, "comments">[] = [
  { id: "c1", pillar: "Financial", objective: "Drive Sustainable Revenue Growth", kpi: "Revenue Growth (%)", weight: 30, target: "15% – 25%", actual: "18.4%", score: 88, status: "On Track" },
  { id: "c2", pillar: "Customer", objective: "Deliver World-Class Customer Experience", kpi: "NPS Score", weight: 20, target: "50 – 80", actual: "72", score: 85, status: "On Track" },
  { id: "c3", pillar: "Internal Process", objective: "Drive Operational Excellence", kpi: "Process Efficiency (%)", weight: 25, target: "80% – 95%", actual: "87%", score: 89, status: "On Track" },
  { id: "c4", pillar: "Learning & Growth", objective: "Build High-Performing Teams", kpi: "Employee Engagement (%)", weight: 25, target: "60% – 85%", actual: "68%", score: 66, status: "At Risk" },
]

function statusTone(status: RowStatus): "success" | "warning" | "danger" {
  if (status === "On Track") return "success"
  if (status === "At Risk") return "warning"
  return "danger"
}

export function ContractScorecardMockScreen({ type }: { type: "BOARD" | "CEO" }) {
  const meta = useMemo(
    () =>
      type === "BOARD"
        ? { title: "Board Scorecard", holder: "Board of Directors", icon: Users2, color: "#7C3AED", seed: boardRows, breadcrumb: "Board Scorecards" }
        : { title: "CEO Scorecard", holder: "Tariro Moyo, Chief Executive Officer", icon: Crown, color: "#F59E0B", seed: ceoRows, breadcrumb: "CEO Scorecards" },
    [type]
  )

  const [period, setPeriod] = useState("FY 2026")
  const [rows, setRows] = useState<ScorecardRow[]>(meta.seed.map((r) => ({ ...r, comments: [] })))
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [qualModalRowId, setQualModalRowId] = useState<string | null>(null)
  const [commentDraft, setCommentDraft] = useState("")

  const overallScore = useMemo(() => {
    const totalWeight = rows.reduce((s, r) => s + r.weight, 0)
    return Math.round(rows.reduce((s, r) => s + r.score * (r.weight / totalWeight), 0))
  }, [rows])

  const qualModalRow = rows.find((r) => r.id === qualModalRowId) || null

  const handleGenerate = () => {
    setGeneratedAt(
      new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    )
    toast.success(`${meta.title} generated`, { description: `Overall score: ${overallScore}%` })
  }

  const addComment = () => {
    if (!qualModalRow || !commentDraft.trim()) {
      toast.error("Enter a comment before saving")
      return
    }
    const newComment = { id: `qc${Date.now()}`, author: "Adm. User", text: commentDraft.trim(), date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) }
    setRows((prev) => prev.map((r) => (r.id === qualModalRow.id ? { ...r, comments: [newComment, ...r.comments] } : r)))
    setCommentDraft("")
    toast.success("Qualitative comment added", { description: qualModalRow.kpi })
  }

  const Icon = meta.icon

  return (
    <div className="min-h-full">
      <PerformanceMockTopChrome breadcrumbs={["Performance Management", "Scorecards", meta.breadcrumb]} searchPlaceholder="Search objectives…" />
      <div className="p-4 lg:p-6 space-y-5">
        <PmPageHeader
          title={meta.title}
          subtitle={`Balanced scorecard results for the ${type === "BOARD" ? "Board of Directors" : "Chief Executive Officer"}, with weighted scoring across all four perspectives.`}
          actions={
            <>
              <PmSelectChip label={period} onClick={() => setPeriod(period === "FY 2026" ? "FY 2025" : "FY 2026")} />
              <PmButton variant="primary" onClick={handleGenerate}>
                <Sparkles className="h-3.5 w-3.5" /> Generate Scorecard
              </PmButton>
            </>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
          <PmCard className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${meta.color}1A`, color: meta.color }}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#111827] truncate">{meta.holder}</p>
                <p className="text-[11px] text-[#9CA3AF]">{period}</p>
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-4xl font-bold text-[#111827]">{overallScore}%</p>
              <p className="text-[11px] text-[#6B7280] mt-1">Overall Weighted Score</p>
            </div>
            {generatedAt && <p className="mt-3 text-[10px] text-[#9CA3AF] text-center">Last generated: {generatedAt}</p>}
          </PmCard>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {rows.map((r) => {
              const PIcon = pillarIcon[r.pillar]
              return (
                <PmCard key={r.id} className="p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-[#6B7280] truncate">{r.pillar}</p>
                      <p className="mt-1 text-xl font-bold text-[#111827]">{r.score}%</p>
                    </div>
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${pillarColor[r.pillar]}1A`, color: pillarColor[r.pillar] }}>
                      <PIcon className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="mt-1 text-[10px] text-[#9CA3AF]">Weight {r.weight}%</p>
                </PmCard>
              )
            })}
          </div>
        </div>

        <PmCard className="overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB]">
            <h3 className="text-sm font-semibold text-[#111827]">Balanced Scorecard Detail</h3>
            <PmAvatar initials={type === "BOARD" ? "BD" : "TM"} name={meta.holder.split(",")[0]} color={meta.color} size="sm" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[900px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-wide text-[#9CA3AF] border-b border-[#F1F5F9]">
                  {["Pillar", "Objective", "KPI", "Weight", "Target", "Actual", "Score", "Status", "Qualitative"].map((h) => (
                    <th key={h} className="py-2.5 px-3 font-semibold whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-[#F1F5F9] hover:bg-[#FAFAFA]">
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap" style={{ color: pillarColor[r.pillar] }}>
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: pillarColor[r.pillar] }} />
                        {r.pillar}
                      </span>
                    </td>
                    <td className="py-3 px-3 max-w-[220px]">
                      <p className="text-[#111827] font-medium truncate">{r.objective}</p>
                    </td>
                    <td className="py-3 px-3 text-[#374151] whitespace-nowrap">{r.kpi}</td>
                    <td className="py-3 px-3 text-[#374151]">{r.weight}%</td>
                    <td className="py-3 px-3 text-[#6B7280] whitespace-nowrap">{r.target}</td>
                    <td className="py-3 px-3 font-semibold text-[#111827] whitespace-nowrap">{r.actual}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <PmProgress value={r.score} className="w-16" color={pillarColor[r.pillar]} />
                        <span className="font-semibold text-[#111827]">{r.score}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <PmStatusPill label={r.status} tone={statusTone(r.status)} />
                    </td>
                    <td className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => {
                          setQualModalRowId(r.id)
                          setCommentDraft("")
                        }}
                        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#7C3AED] hover:underline whitespace-nowrap"
                      >
                        <MessageSquare className="h-3.5 w-3.5" /> {r.comments.length > 0 ? `${r.comments.length} comment(s)` : "Add comment"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PmCard>
      </div>

      <PmModal
        open={!!qualModalRow}
        onClose={() => setQualModalRowId(null)}
        title="Qualitative Assessment"
        description={qualModalRow ? `${qualModalRow.kpi} · ${qualModalRow.objective}` : undefined}
        widthClass="max-w-lg"
        footer={
          <>
            <PmButton variant="outline" onClick={() => setQualModalRowId(null)}>
              Close
            </PmButton>
            <PmButton variant="primary" onClick={addComment}>
              Save Comment
            </PmButton>
          </>
        }
      >
        <div className="space-y-3">
          {qualModalRow && qualModalRow.comments.length > 0 && (
            <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
              {qualModalRow.comments.map((c) => (
                <div key={c.id} className="rounded-lg bg-[#F9FAFB] px-3 py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#111827]">{c.author}</span>
                    <span className="text-[10px] text-[#9CA3AF]">{c.date}</span>
                  </div>
                  <p className="mt-1 text-xs text-[#374151] leading-snug">{c.text}</p>
                </div>
              ))}
            </div>
          )}
          <label className="block">
            <span className="block text-xs font-medium text-[#374151] mb-1">New Comment</span>
            <textarea
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              placeholder="Add board/CEO-level context on this result…"
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-sm outline-none focus:border-[#7C3AED] resize-none"
            />
          </label>
        </div>
      </PmModal>
    </div>
  )
}
