"use client"

import { useMemo, useState } from "react"
import { MessageSquare, TrendingUp, Users, Settings, Lightbulb, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { PerformanceMockTopChrome } from "@/components/performance-mock/shell"
import { PmButton, PmCard, PmModal, PmPageHeader, PmProgress, PmSelectChip, PmStatusPill } from "@/components/performance-mock/primitives"

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

type DeptScorecard = {
  deptId: string
  deptName: string
  head: string
  period: string
  rows: ScorecardRow[]
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

const departmentOptions = [
  { id: "finance", name: "Finance", head: "Anesu Mlambo" },
  { id: "sales", name: "Sales & Marketing", head: "Takudzwa Chari" },
  { id: "operations", name: "Operations", head: "Tatenda Chikomo" },
  { id: "customer-success", name: "Customer Success", head: "Rupatadzo Zulu" },
  { id: "hr", name: "Human Resources", head: "Chipo Dube" },
]

function buildRows(deptId: string): ScorecardRow[] {
  const seeds: Record<string, Omit<ScorecardRow, "comments">[]> = {
    finance: [
      { id: "r1", pillar: "Financial", objective: "Grow Revenue Sustainably", kpi: "Revenue Growth (%)", weight: 25, target: "15% – 25%", actual: "18.4%", score: 88, status: "On Track" },
      { id: "r2", pillar: "Financial", objective: "Improve Profitability", kpi: "Net Profit Margin (%)", weight: 20, target: "10% – 20%", actual: "16.2%", score: 91, status: "On Track" },
      { id: "r3", pillar: "Internal Process", objective: "Ensure Quality & Compliance", kpi: "Process Compliance (%)", weight: 20, target: "80% – 95%", actual: "92%", score: 93, status: "On Track" },
      { id: "r4", pillar: "Customer", objective: "Deepen Customer Relationships", kpi: "Vendor SLA Adherence (%)", weight: 15, target: "90% – 100%", actual: "84%", score: 68, status: "At Risk" },
      { id: "r5", pillar: "Learning & Growth", objective: "Build Future-Ready Skills", kpi: "Team Certification Rate (%)", weight: 20, target: "60% – 80%", actual: "71%", score: 84, status: "On Track" },
    ],
    sales: [
      { id: "r1", pillar: "Financial", objective: "Grow Revenue Sustainably", kpi: "New Logo Wins", weight: 25, target: "60 – 90", actual: "68", score: 76, status: "On Track" },
      { id: "r2", pillar: "Customer", objective: "Grow Market Share", kpi: "Market Share (%)", weight: 20, target: "15% – 30%", actual: "22%", score: 79, status: "On Track" },
      { id: "r3", pillar: "Customer", objective: "Expand Digital Engagement", kpi: "Digital Adoption Rate (%)", weight: 20, target: "55% – 75%", actual: "58%", score: 62, status: "At Risk" },
      { id: "r4", pillar: "Internal Process", objective: "Operational Excellence", kpi: "Pipeline Conversion (%)", weight: 15, target: "20% – 35%", actual: "19%", score: 54, status: "Off Track" },
      { id: "r5", pillar: "Learning & Growth", objective: "Engage & Empower People", kpi: "Sales Enablement Completion (%)", weight: 20, target: "70% – 90%", actual: "77%", score: 82, status: "On Track" },
    ],
  }
  const base = seeds[deptId] || seeds.finance
  return base.map((r) => ({ ...r, comments: [] as ScorecardRow["comments"] }))
}

function statusTone(status: RowStatus): "success" | "warning" | "danger" {
  if (status === "On Track") return "success"
  if (status === "At Risk") return "warning"
  return "danger"
}

export function DepartmentScorecardMockScreen() {
  const [deptId, setDeptId] = useState(departmentOptions[0].id)
  const [period, setPeriod] = useState("Q2 2026")
  const [scorecards, setScorecards] = useState<Record<string, ScorecardRow[]>>({})
  const [qualModalRowId, setQualModalRowId] = useState<string | null>(null)
  const [commentDraft, setCommentDraft] = useState("")

  const dept = departmentOptions.find((d) => d.id === deptId)!
  const rows = scorecards[deptId] || buildRows(deptId)

  const overallScore = useMemo(() => {
    const totalWeight = rows.reduce((s, r) => s + r.weight, 0)
    const weighted = rows.reduce((s, r) => s + r.score * (r.weight / totalWeight), 0)
    return Math.round(weighted)
  }, [rows])

  const pillarSummary = useMemo(() => {
    const map = new Map<Pillar, { weight: number; score: number; count: number }>()
    rows.forEach((r) => {
      const cur = map.get(r.pillar) || { weight: 0, score: 0, count: 0 }
      map.set(r.pillar, { weight: cur.weight + r.weight, score: cur.score + r.score, count: cur.count + 1 })
    })
    return Array.from(map.entries()).map(([pillar, v]) => ({ pillar, weight: v.weight, avgScore: Math.round(v.score / v.count) }))
  }, [rows])

  const qualModalRow = rows.find((r) => r.id === qualModalRowId) || null

  const setRows = (next: ScorecardRow[]) => {
    setScorecards((prev) => ({ ...prev, [deptId]: next }))
  }

  const addComment = () => {
    if (!qualModalRow || !commentDraft.trim()) {
      toast.error("Enter a comment before saving")
      return
    }
    const newComment = { id: `c${Date.now()}`, author: "Adm. User", text: commentDraft.trim(), date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) }
    setRows(rows.map((r) => (r.id === qualModalRow.id ? { ...r, comments: [newComment, ...r.comments] } : r)))
    setCommentDraft("")
    toast.success("Qualitative comment added", { description: qualModalRow.kpi })
  }

  return (
    <div className="min-h-full">
      <PerformanceMockTopChrome breadcrumbs={["Performance Management", "Scorecards", "Department Scorecards"]} searchPlaceholder="Search departments…" />
      <div className="p-4 lg:p-6 space-y-5">
        <PmPageHeader
          title="Department Scorecards"
          subtitle="Review balanced-scorecard results by department, and capture qualitative context on KPI performance."
          actions={<PmSelectChip label={period} onClick={() => setPeriod(period === "Q2 2026" ? "Q1 2026" : "Q2 2026")} />}
        />

        <PmCard className="p-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-[#6B7280]">Department:</span>
          <div className="relative">
            <select
              value={deptId}
              onChange={(e) => setDeptId(e.target.value)}
              className="h-9 pl-3 pr-8 rounded-lg border border-[#E5E7EB] bg-white text-sm text-[#111827] font-medium appearance-none"
            >
              {departmentOptions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF] pointer-events-none" />
          </div>
          <span className="text-xs text-[#6B7280] ml-2">
            Head: <span className="font-medium text-[#111827]">{dept.head}</span>
          </span>
        </PmCard>

        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4">
          <PmCard className="p-4 flex flex-col items-center justify-center text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Overall Score</p>
            <p className="mt-2 text-4xl font-bold text-[#111827]">{overallScore}%</p>
            <p className="mt-1 text-xs text-[#6B7280]">{period}</p>
          </PmCard>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {pillarSummary.map((p) => {
              const Icon = pillarIcon[p.pillar]
              return (
                <PmCard key={p.pillar} className="p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-medium text-[#6B7280]">{p.pillar}</p>
                      <p className="mt-1 text-xl font-bold text-[#111827]">{p.avgScore}%</p>
                      <p className="text-[10px] text-[#9CA3AF] mt-0.5">Weight {p.weight}%</p>
                    </div>
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${pillarColor[p.pillar]}1A`, color: pillarColor[p.pillar] }}>
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                </PmCard>
              )
            })}
          </div>
        </div>

        <PmCard className="overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB]">
            <h3 className="text-sm font-semibold text-[#111827]">{dept.name} Scorecard Matrix</h3>
            <span className="text-xs text-[#9CA3AF]">{rows.length} KPIs</span>
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
                    <td className="py-3 px-3 max-w-[200px]">
                      <p className="text-[#111827] font-medium truncate">{r.objective}</p>
                    </td>
                    <td className="py-3 px-3 text-[#374151] whitespace-nowrap">{r.kpi}</td>
                    <td className="py-3 px-3 text-[#374151]">{r.weight}%</td>
                    <td className="py-3 px-3 text-[#6B7280] whitespace-nowrap">{r.target}</td>
                    <td className="py-3 px-3 font-semibold text-[#111827] whitespace-nowrap">{r.actual}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <PmProgress value={r.score} className="w-16" />
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
              placeholder="Add context on drivers, blockers, or corrective actions…"
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-sm outline-none focus:border-[#7C3AED] resize-none"
            />
          </label>
        </div>
      </PmModal>
    </div>
  )
}
