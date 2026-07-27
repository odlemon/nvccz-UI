"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  Check,
  ChevronDown,
  Circle,
  ClipboardList,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Info,
  MessageSquare,
  MoreHorizontal,
  Network,
  Plus,
  Save,
  Send,
  Target,
} from "lucide-react"
import { toast } from "sonner"
import { PmAvatar, PmButton, PmCard, PmProgress, PmStatusPill } from "@/components/performance-mock/primitives"
import { PM_PHOTOS } from "@/lib/performance-mock/photos"
import { cn } from "@/lib/utils"

type Person = { name: string; role: string; src: string }
type ActionPlanItem = {
  id: string
  action: string
  owner: Person
  targetDate: string
  progress: number
  status: "In Progress" | "On Track" | "Not Started" | "Complete"
}
type Milestone = { label: string; sub: string; date: string; status: "done" | "active" | "upcoming" }
type SuccessMeasure = { label: string; target: string; current: string; caption: string; trend: number[] }
type RootCauseGroup = { id: string; label: string; items: { id: string; text: string; selected: boolean }[] }
type Comment = { author: Person; at: string; text: string }
type AuditEntry = { at: string; text: string; by: string }

const nyasha: Person = { name: "Nyasha Dube", role: "Digital Lead", src: PM_PHOTOS.nyasha }
const tawanda: Person = { name: "Tawanda Chikore", role: "CIO", src: PM_PHOTOS.tawanda }
const farai: Person = { name: "Farai Muchengezi", role: "Super Administrator", src: PM_PHOTOS.farai }
const rudo: Person = { name: "Rudo Ndlovu", role: "Product Analyst", src: PM_PHOTOS.rudo }
const chipo: Person = { name: "Chipo Biti", role: "Mobile Lead", src: PM_PHOTOS.chipo }

const INITIAL_ROOT: RootCauseGroup[] = [
  {
    id: "people",
    label: "People",
    items: [
      { id: "p1", text: "Limited user training", selected: true },
      { id: "p2", text: "Low change awareness", selected: true },
    ],
  },
  {
    id: "process",
    label: "Process",
    items: [
      { id: "pr1", text: "Complex onboarding", selected: true },
      { id: "pr2", text: "Inconsistent incentives", selected: false },
    ],
  },
  {
    id: "tech",
    label: "Technology",
    items: [
      { id: "t1", text: "Mobile latency", selected: true },
      { id: "t2", text: "App stability issues", selected: false },
    ],
  },
  {
    id: "data",
    label: "Data",
    items: [
      { id: "d1", text: "Incomplete usage data", selected: false },
      { id: "d2", text: "No usage telemetry", selected: true },
    ],
  },
]

const INITIAL_ACTIONS: ActionPlanItem[] = [
  { id: "a1", action: "Simplify onboarding flow", owner: nyasha, targetDate: "17 Jul 2026", progress: 75, status: "In Progress" },
  { id: "a2", action: "Run role-based training", owner: nyasha, targetDate: "24 Jul 2026", progress: 60, status: "In Progress" },
  { id: "a3", action: "Improve mobile performance", owner: tawanda, targetDate: "28 Jul 2026", progress: 40, status: "In Progress" },
  { id: "a4", action: "Launch adoption nudges", owner: rudo, targetDate: "31 Jul 2026", progress: 30, status: "In Progress" },
  { id: "a5", action: "Validate analytics setup", owner: chipo, targetDate: "22 Jul 2026", progress: 90, status: "On Track" },
]

const MILESTONES: Milestone[] = [
  { label: "Diagnose", sub: "Complete", date: "03 Jul 2026", status: "done" },
  { label: "Plan approved", sub: "Complete", date: "07 Jul 2026", status: "done" },
  { label: "Execute", sub: "In progress", date: "08 – 24 Jul 2026", status: "active" },
  { label: "Verify", sub: "Pending", date: "25 – 28 Jul 2026", status: "upcoming" },
  { label: "Close", sub: "Pending", date: "31 Jul 2026", status: "upcoming" },
]

const SUCCESS: SuccessMeasure[] = [
  { label: "Digital Adoption", target: "80%", current: "68%", caption: "Current vs baseline", trend: [58, 60, 62, 64, 65, 67, 68] },
  { label: "Weekly active users", target: "+15%", current: "+6%", caption: "Current vs baseline", trend: [2, 2.5, 3, 4, 4.5, 5.5, 6] },
  { label: "Training completion", target: "95%", current: "78%", caption: "Target 95%", trend: [55, 60, 65, 70, 72, 75, 78] },
]

const EVIDENCE = [
  { name: "Usage analysis.pdf", size: "412 KB", kind: "pdf" as const },
  { name: "Adoption baseline.xlsx", size: "186 KB", kind: "xlsx" as const },
  { name: "User feedback.docx", size: "98 KB", kind: "docx" as const },
]

function MiniSpark({ data }: { data: number[] }) {
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const span = Math.max(max - min, 1)
  const coords = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100
    const y = 28 - ((v - min) / span) * 24
    return `${x},${y}`
  })
  const line = coords.join(" ")
  const area = `0,30 ${line} 100,30`
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-8">
      <polygon points={area} fill="#EDE9FE" />
      <polyline points={line} fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function FileKindIcon({ kind }: { kind: "pdf" | "xlsx" | "docx" }) {
  if (kind === "pdf") {
    return (
      <span className="h-9 w-9 rounded-lg bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center shrink-0">
        <FileText className="h-4 w-4" />
      </span>
    )
  }
  if (kind === "xlsx") {
    return (
      <span className="h-9 w-9 rounded-lg bg-[#D1FAE5] text-[#059669] flex items-center justify-center shrink-0">
        <FileSpreadsheet className="h-4 w-4" />
      </span>
    )
  }
  return (
    <span className="h-9 w-9 rounded-lg bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center shrink-0">
      <FileText className="h-4 w-4" />
    </span>
  )
}

export function CorrectiveActionDetailMockScreen({ actionId = "CA-2026-014" }: { actionId?: string }) {
  const router = useRouter()
  const id = actionId?.startsWith("CA-") ? actionId : "CA-2026-014"

  const [rootCauses, setRootCauses] = useState(INITIAL_ROOT)
  const [actionPlan, setActionPlan] = useState(INITIAL_ACTIONS)
  const [comments, setComments] = useState<Comment[]>([
    {
      author: nyasha,
      at: "08 Jul · 10:12",
      text: "Latest feedback highlights onboarding friction and slow mobile experience on low-end devices.",
    },
    {
      author: tawanda,
      at: "09 Jul · 15:41",
      text: "Approved. Proceed with the plan and update training completion weekly.",
    },
  ])
  const [commentDraft, setCommentDraft] = useState("")
  const [audit, setAudit] = useState<AuditEntry[]>([
    { at: "03 Jul 2026 · 10:05", text: "Corrective action created", by: "Nyasha Dube" },
    { at: "07 Jul 2026 · 09:22", text: "Plan approved", by: "Tawanda Chikore" },
    { at: "10 Jul 2026 · 11:42", text: "Action updated", by: "Nyasha Dube" },
    { at: "10 Jul 2026 · 14:16", text: "Evidence added", by: "Nyasha Dube" },
  ])
  const [completion, setCompletion] = useState(58)
  const [verification, setVerification] = useState([
    { label: "Root cause documented", done: true },
    { label: "Action plan defined", done: true },
    { label: "Evidence attached", done: true },
    { label: "Progress of ≥3 actions tracked", done: false },
    { label: "Success measures on track", done: false },
  ])
  const [exportOpen, setExportOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [menuActionId, setMenuActionId] = useState<string | null>(null)

  const verificationDone = verification.filter((v) => v.done).length
  const overallActionProgress = useMemo(() => {
    if (actionPlan.length === 0) return 0
    return Math.round(actionPlan.reduce((s, a) => s + a.progress, 0) / actionPlan.length)
  }, [actionPlan])

  const toggleRootItem = (groupId: string, itemId: string) => {
    setRootCauses((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, items: g.items.map((it) => (it.id === itemId ? { ...it, selected: !it.selected } : it)) } : g
      )
    )
  }

  const postComment = () => {
    if (!commentDraft.trim()) return
    setComments((prev) => [...prev, { author: farai, at: "Just now", text: commentDraft.trim() }])
    setAudit((prev) => [{ at: "Just now", text: "Comment added", by: farai.name }, ...prev])
    setCommentDraft("")
    toast.success("Comment posted")
  }

  const addAction = () => {
    setActionPlan((prev) => [
      ...prev,
      {
        id: `a${Date.now()}`,
        action: "New corrective action",
        owner: nyasha,
        targetDate: "31 Jul 2026",
        progress: 0,
        status: "Not Started",
      },
    ])
    toast.success("Action added")
  }

  const bumpAction = (aid: string) => {
    setActionPlan((prev) =>
      prev.map((a) =>
        a.id === aid
          ? {
              ...a,
              progress: Math.min(100, a.progress + 10),
              status: a.progress + 10 >= 100 ? "Complete" : a.status === "Not Started" ? "In Progress" : a.status,
            }
          : a
      )
    )
    setCompletion((c) => Math.min(100, c + 2))
    setMenuActionId(null)
  }

  return (
    <div className="min-h-full bg-[#F8FAFC]">
      <div className="p-4 lg:p-5 space-y-3.5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <nav className="text-[11px] text-[#94A3B8] mb-1.5">
              <button type="button" onClick={() => router.push("/performance/corrective-actions")} className="hover:text-[#7C3AED] hover:underline">
                Corrective Actions
              </button>
              <span className="mx-1.5">/</span>
              <span className="text-[#64748B]">{id}</span>
            </nav>
            <h1 className="text-[22px] font-bold text-[#0F172A] tracking-tight leading-tight">Improve digital adoption</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 relative">
            <div className="relative">
              <PmButton
                variant="outline"
                onClick={() => {
                  setExportOpen((o) => !o)
                  setMoreOpen(false)
                }}
              >
                <Download className="h-3.5 w-3.5" /> Export <ChevronDown className="h-3 w-3 opacity-60" />
              </PmButton>
              {exportOpen && (
                <div className="absolute right-0 top-full mt-1 z-30 w-40 rounded-xl border border-[#E2E8F0] bg-white shadow-lg py-1 text-xs">
                  {["PDF report", "Excel export", "Share link"].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        toast.success(opt, { description: id })
                        setExportOpen(false)
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-[#F8FAFC] text-[#334155]"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <PmButton
                variant="outline"
                onClick={() => {
                  setMoreOpen((o) => !o)
                  setExportOpen(false)
                }}
              >
                <MoreHorizontal className="h-3.5 w-3.5" /> More <ChevronDown className="h-3 w-3 opacity-60" />
              </PmButton>
              {moreOpen && (
                <div className="absolute right-0 top-full mt-1 z-30 w-44 rounded-xl border border-[#E2E8F0] bg-white shadow-lg py-1 text-xs">
                  {["Escalate", "Reassign owner", "Archive"].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        toast(opt, { description: id })
                        setMoreOpen(false)
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-[#F8FAFC] text-[#334155]"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <PmButton
              variant="outline"
              onClick={() => {
                toast.success("Draft saved", { description: id })
                setAudit((prev) => [{ at: "Just now", text: "Draft saved", by: "Adm. User" }, ...prev])
              }}
              className="border-[#C4B5FD] text-[#7C3AED] hover:bg-[#F5F3FF]"
            >
              <Save className="h-3.5 w-3.5" /> Save draft
            </PmButton>
            <PmButton
              onClick={() => {
                toast.success("Submitted for verification", { description: `${id} · Improve digital adoption` })
                setAudit((prev) => [{ at: "Just now", text: "Submitted for verification", by: "Adm. User" }, ...prev])
              }}
            >
              Submit for verification
            </PmButton>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 shadow-sm">
          <MetaBlock label="ID">
            <span className="text-[13px] font-bold text-[#0F172A]">{id}</span>
          </MetaBlock>
          <MetaBlock label="Status">
            <span className="inline-flex items-center h-6 px-2 rounded-full bg-[#F3E8FF] text-[#7C3AED] text-[11px] font-bold">In Progress</span>
          </MetaBlock>
          <MetaBlock label="Severity">
            <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#EF4444]">
              <span className="h-2 w-2 rounded-full bg-[#EF4444]" /> High
            </span>
          </MetaBlock>
          <MetaBlock label="Owner">
            <PmAvatar initials="ND" name={nyasha.name} role={nyasha.role} src={nyasha.src} size="sm" />
          </MetaBlock>
          <MetaBlock label="Sponsor">
            <PmAvatar initials="TC" name={tawanda.name} role={tawanda.role} src={tawanda.src} size="sm" />
          </MetaBlock>
          <MetaBlock label="Due date">
            <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#0F172A]">
              <Calendar className="h-3.5 w-3.5 text-[#7C3AED]" /> 31 Jul 2026
            </span>
          </MetaBlock>
          <div className="min-w-[150px] flex-1 max-w-[220px]">
            <p className="text-[10px] font-medium text-[#94A3B8] mb-1">Completion</p>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold text-[#0F172A] tabular-nums">{completion}%</span>
              <PmProgress value={completion} className="flex-1 h-1.5" />
            </div>
          </div>
        </div>

        <PmCard className="p-3.5">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <FlowChip icon={<BarChart3 className="h-4 w-4" />} tone="purple" label="Trigger KPI" value="Digital Adoption" detail="68% versus 80% target" />
            <span className="text-[#CBD5E1] text-lg hidden sm:inline">→</span>
            <FlowChip icon={<Target className="h-4 w-4" />} tone="purple" label="Objective" value="Expand Digital Engagement" />
            <span className="text-[#CBD5E1] text-lg hidden sm:inline">→</span>
            <FlowChip icon={<AlertTriangle className="h-4 w-4" />} tone="danger" label="Alert" value="Off track for 2 periods" valueClass="text-[#EF4444]" />
          </div>
        </PmCard>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-3 space-y-3.5 min-w-0">
            <PmCard className="p-4">
              <h3 className="text-[13px] font-bold text-[#0F172A] mb-3 inline-flex items-center gap-1.5">
                <ClipboardList className="h-3.5 w-3.5 text-[#7C3AED]" /> Problem statement
              </h3>
              <div className="space-y-3 text-[12px]">
                <ProblemRow label="Observed gap" value="Digital Adoption is 68% against a target of 80%." />
                <ProblemRow label="Business impact" value="Lower platform usage reduces efficiency of digital strategy and customer delivery." />
                <ProblemRow label="Opened" value="02 Jul 2026" />
              </div>
            </PmCard>

            <PmCard className="p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <h3 className="text-[13px] font-bold text-[#0F172A]">Root-cause analysis</h3>
                <button type="button" onClick={() => toast("Root-cause analysis", { description: "Toggle causes that apply to this CA." })} className="text-[#94A3B8] hover:text-[#7C3AED]">
                  <Info className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="relative">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
                  <span className="h-11 w-11 rounded-full bg-[#7C3AED] text-white shadow-md flex items-center justify-center ring-4 ring-[#EDE9FE]">
                    <Network className="h-5 w-5" />
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {rootCauses.map((g) => (
                    <div key={g.id} className="rounded-xl border border-[#E2E8F0] bg-[#FAFAFB] p-2.5 min-h-[88px]">
                      <p className="text-[11px] font-bold text-[#7C3AED] mb-1.5">{g.label}</p>
                      <ul className="space-y-1">
                        {g.items.map((it) => (
                          <li key={it.id}>
                            <button type="button" onClick={() => toggleRootItem(g.id, it.id)} className="flex items-start gap-1.5 text-left w-full">
                              <span
                                className={cn(
                                  "mt-0.5 h-3 w-3 rounded-full border-2 shrink-0 flex items-center justify-center",
                                  it.selected ? "border-[#7C3AED] bg-[#7C3AED]" : "border-[#CBD5E1] bg-white"
                                )}
                              >
                                {it.selected && <span className="h-1 w-1 rounded-full bg-white" />}
                              </span>
                              <span className={cn("text-[10px] leading-snug", it.selected ? "text-[#334155] font-medium" : "text-[#94A3B8]")}>{it.text}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </PmCard>

            <PmCard className="p-4">
              <h3 className="text-[13px] font-bold text-[#0F172A] mb-3">Evidence</h3>
              <div className="space-y-2">
                {EVIDENCE.map((ev) => (
                  <button
                    key={ev.name}
                    type="button"
                    onClick={() => toast("Opening file", { description: ev.name })}
                    className="w-full flex items-center gap-2.5 rounded-xl border border-[#E2E8F0] px-2.5 py-2 text-left hover:border-[#C4B5FD]"
                  >
                    <FileKindIcon kind={ev.kind} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[11px] font-semibold text-[#0F172A] truncate">{ev.name}</span>
                      <span className="block text-[10px] text-[#94A3B8]">{ev.size}</span>
                    </span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => toast("KPI trend", { description: "Opening Digital Adoption trend." })}
                className="mt-3 text-[11px] font-semibold text-[#7C3AED] hover:underline inline-flex items-center gap-1"
              >
                View KPI trend: Digital Adoption <ExternalLink className="h-3 w-3" />
              </button>
            </PmCard>

            <PmCard className="p-4">
              <h3 className="text-[13px] font-bold text-[#0F172A] mb-3 inline-flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-[#7C3AED]" /> Comments &amp; decisions
              </h3>
              <div className="space-y-3.5">
                {comments.map((c, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <img src={c.author.src} alt="" className="h-7 w-7 rounded-full object-cover shrink-0 ring-2 ring-white shadow-sm" referrerPolicy="no-referrer" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <p className="text-[12px] font-bold text-[#0F172A]">{c.author.name}</p>
                        <p className="text-[10px] text-[#94A3B8]">{c.at}</p>
                      </div>
                      <p className="text-[12px] text-[#475569] mt-0.5 leading-relaxed">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <input
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && postComment()}
                  placeholder="Add a comment..."
                  className="flex-1 h-9 rounded-full border border-[#E2E8F0] px-3.5 text-[12px] outline-none focus:border-[#7C3AED]"
                />
                <button type="button" onClick={postComment} className="h-9 w-9 rounded-full bg-[#7C3AED] text-white flex items-center justify-center shrink-0 hover:bg-[#6D28D9] shadow-sm" aria-label="Send comment">
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </PmCard>
          </div>

          <div className="lg:col-span-6 space-y-3.5 min-w-0">
            <PmCard className="p-4 overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-bold text-[#0F172A]">Action plan</h3>
                <span className="text-[10px] text-[#94A3B8]">Avg. {overallActionProgress}%</span>
              </div>
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-left text-[11px] min-w-[640px]">
                  <thead>
                    <tr className="text-[10px] font-semibold text-[#94A3B8] border-b border-[#F1F5F9]">
                      <th className="py-2 px-1 w-6">#</th>
                      <th className="py-2 px-1">Action</th>
                      <th className="py-2 px-1">Owner</th>
                      <th className="py-2 px-1">Target date</th>
                      <th className="py-2 px-1">Progress</th>
                      <th className="py-2 px-1">Status</th>
                      <th className="py-2 px-1 w-7" />
                    </tr>
                  </thead>
                  <tbody>
                    {actionPlan.map((a, i) => (
                      <tr key={a.id} className="border-b border-[#F8FAFC] last:border-0">
                        <td className="py-2.5 px-1 text-[#94A3B8]">{i + 1}</td>
                        <td className="py-2.5 px-1 font-semibold text-[#0F172A] whitespace-nowrap">{a.action}</td>
                        <td className="py-2.5 px-1">
                          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                            <img src={a.owner.src} alt="" className="h-5 w-5 rounded-full object-cover" referrerPolicy="no-referrer" />
                            <span className="text-[#334155] font-medium">{a.owner.name.split(" ")[0]}</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-1 text-[#64748B] whitespace-nowrap">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-[#94A3B8]" /> {a.targetDate}
                          </span>
                        </td>
                        <td className="py-2.5 px-1 min-w-[110px]">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-[#0F172A] w-7 tabular-nums">{a.progress}%</span>
                            <PmProgress value={a.progress} className="flex-1 h-1.5" />
                          </div>
                        </td>
                        <td className="py-2.5 px-1">
                          <PmStatusPill label={a.status} tone={a.status === "On Track" || a.status === "Complete" ? "success" : a.status === "Not Started" ? "neutral" : "purple"} />
                        </td>
                        <td className="py-2.5 px-1 relative">
                          <button type="button" onClick={() => setMenuActionId((cur) => (cur === a.id ? null : a.id))} className="h-6 w-6 rounded-md flex items-center justify-center text-[#94A3B8] hover:bg-[#F1F5F9]">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </button>
                          {menuActionId === a.id && (
                            <div className="absolute right-0 top-full z-20 w-36 rounded-lg border border-[#E2E8F0] bg-white shadow-lg py-1">
                              <button type="button" onClick={() => bumpAction(a.id)} className="w-full text-left px-3 py-1.5 hover:bg-[#F8FAFC] text-[#334155]">
                                +10% progress
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  toast("Edit action", { description: a.action })
                                  setMenuActionId(null)
                                }}
                                className="w-full text-left px-3 py-1.5 hover:bg-[#F8FAFC] text-[#334155]"
                              >
                                Edit
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" onClick={addAction} className="mt-2.5 text-[12px] font-semibold text-[#7C3AED] hover:underline inline-flex items-center gap-1">
                <Plus className="h-3.5 w-3.5" /> Add action
              </button>
            </PmCard>

            <PmCard className="p-4">
              <h3 className="text-[13px] font-bold text-[#0F172A] mb-4">Milestones</h3>
              <div className="overflow-x-auto">
                <div className="flex items-start min-w-[520px]">
                  {MILESTONES.map((m, i) => (
                    <div key={m.label} className="flex items-start flex-1 last:flex-none">
                      <div className="flex flex-col items-center text-center min-w-[72px] px-1">
                        <span
                          className={cn(
                            "h-7 w-7 rounded-full flex items-center justify-center shrink-0",
                            m.status === "done" && "bg-[#7C3AED] text-white",
                            m.status === "active" && "border-[3px] border-[#7C3AED] bg-white",
                            m.status === "upcoming" && "border-2 border-[#E2E8F0] bg-white"
                          )}
                        >
                          {m.status === "done" ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
                          {m.status === "active" ? <span className="h-2 w-2 rounded-full bg-[#7C3AED]" /> : null}
                        </span>
                        <p className={cn("text-[11px] font-bold mt-2 leading-tight", m.status === "upcoming" ? "text-[#94A3B8]" : "text-[#0F172A]")}>{m.label}</p>
                        <p className={cn("text-[10px] mt-0.5", m.status === "active" ? "text-[#7C3AED] font-semibold" : "text-[#94A3B8]")}>{m.sub}</p>
                        <p className="text-[9px] text-[#94A3B8] mt-0.5">{m.date}</p>
                      </div>
                      {i < MILESTONES.length - 1 && <div className={cn("flex-1 h-0.5 mt-3.5 mx-0.5", m.status === "done" ? "bg-[#7C3AED]" : "bg-[#E2E8F0]")} />}
                    </div>
                  ))}
                </div>
              </div>
            </PmCard>

            <PmCard className="p-4">
              <h3 className="text-[13px] font-bold text-[#0F172A] mb-3">Success measures</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {SUCCESS.map((m) => (
                  <div key={m.label} className="rounded-xl border border-[#E2E8F0] p-3">
                    <p className="text-[11px] font-semibold text-[#64748B] truncate">{m.label}</p>
                    <div className="mt-1 flex items-end justify-between gap-2">
                      <p className="text-xl font-extrabold text-[#0F172A] leading-none tabular-nums">{m.current}</p>
                      <div className="flex-1 max-w-[72px]">
                        <MiniSpark data={m.trend} />
                      </div>
                    </div>
                    <p className="text-[10px] text-[#94A3B8] mt-1.5">
                      {m.caption}
                      {m.caption.includes("Target") ? "" : ` · Target ${m.target}`}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-[#94A3B8] mt-3 inline-flex items-start gap-1">
                <Info className="h-3 w-3 mt-0.5 shrink-0" />
                Targets measured at corrective action completion and verified during review.
              </p>
            </PmCard>
          </div>

          <div className="lg:col-span-3 space-y-3.5 min-w-0">
            <PmCard className="p-4">
              <h3 className="text-[13px] font-bold text-[#0F172A] mb-3">Governance</h3>
              <div className="space-y-3">
                {[
                  { role: "Action owner", person: nyasha },
                  { role: "Verifier", person: farai },
                  { role: "Sponsor", person: tawanda },
                ].map((g) => (
                  <div key={g.role} className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[#64748B]">{g.role}</span>
                    <PmAvatar initials={g.person.name.slice(0, 2)} name={g.person.name} role={g.person.role} src={g.person.src} size="sm" />
                  </div>
                ))}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#F1F5F9]">
                  <span className="text-[11px] text-[#64748B]">Review cadence</span>
                  <span className="text-[12px] font-bold text-[#0F172A]">Weekly</span>
                </div>
              </div>
            </PmCard>

            <PmCard className="p-4">
              <h3 className="text-[13px] font-bold text-[#0F172A] mb-3 inline-flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-[#F59E0B]" /> Risk &amp; dependencies
              </h3>
              <div className="space-y-3">
                {[
                  { label: "Mobile performance dependency", severity: "High" as const, detail: "Depends on infrastructure optimisation owned by ICT Operations." },
                  { label: "User availability for training", severity: "Medium" as const, detail: "Competes with quarter-end operational priorities." },
                ].map((r) => (
                  <div key={r.label} className="flex items-start gap-2">
                    <span className={cn("mt-1 h-2 w-2 rounded-full shrink-0", r.severity === "High" ? "bg-[#EF4444]" : "bg-[#F59E0B]")} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[11px] font-bold text-[#0F172A] leading-snug">{r.label}</p>
                        <span className={cn("text-[10px] font-bold shrink-0", r.severity === "High" ? "text-[#EF4444]" : "text-[#F59E0B]")}>{r.severity}</span>
                      </div>
                      <p className="text-[10px] text-[#64748B] mt-0.5 leading-snug">{r.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => toast("Risks", { description: "Opening full risk register." })} className="mt-3 text-[11px] font-semibold text-[#7C3AED] hover:underline">
                View all risks &amp; dependencies
              </button>
            </PmCard>

            <PmCard className="p-4 bg-[#F5F3FF]/60 border-[#E9E5FF]">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="text-[13px] font-bold text-[#0F172A]">Next review</h3>
                <button
                  type="button"
                  onClick={() => toast.success("Review rescheduled", { description: "Pick a new slot from calendar." })}
                  className="h-7 px-2.5 rounded-full border border-[#C4B5FD] text-[10px] font-semibold text-[#7C3AED] hover:bg-white"
                >
                  Reschedule
                </button>
              </div>
              <p className="text-[14px] font-extrabold text-[#7C3AED] leading-snug">18 Jul 2026, 10:00 SAST</p>
              <p className="text-[10px] text-[#64748B] mt-1">Weekly review</p>
            </PmCard>

            <PmCard className="p-4">
              <h3 className="text-[13px] font-bold text-[#0F172A] mb-2">Verification readiness</h3>
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="text-[#64748B]">
                  {verificationDone} of {verification.length} complete
                </span>
                <span className="font-bold text-[#7C3AED]">{Math.round((verificationDone / verification.length) * 100)}%</span>
              </div>
              <PmProgress value={(verificationDone / verification.length) * 100} className="mb-3 h-1.5" />
              <div className="space-y-2">
                {verification.map((v, idx) => (
                  <button
                    key={v.label}
                    type="button"
                    onClick={() => setVerification((prev) => prev.map((x, i) => (i === idx ? { ...x, done: !x.done } : x)))}
                    className="flex items-center gap-2 text-[11px] w-full text-left"
                  >
                    {v.done ? (
                      <span className="h-4 w-4 rounded-full bg-[#10B981] text-white flex items-center justify-center shrink-0">
                        <Check className="h-2.5 w-2.5" strokeWidth={3} />
                      </span>
                    ) : (
                      <Circle className="h-4 w-4 text-[#CBD5E1] shrink-0" />
                    )}
                    <span className={v.done ? "text-[#334155] font-medium" : "text-[#94A3B8]"}>{v.label}</span>
                  </button>
                ))}
              </div>
            </PmCard>

            <PmCard className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-bold text-[#0F172A]">Audit trail</h3>
                <button type="button" onClick={() => toast("Audit trail", { description: "Opening full history." })} className="text-[11px] font-semibold text-[#7C3AED] hover:underline">
                  View full
                </button>
              </div>
              <div className="relative space-y-3 pl-3">
                <span className="absolute left-[5px] top-1.5 bottom-1.5 w-px bg-[#E2E8F0]" />
                {audit.map((a, i) => (
                  <div key={i} className="relative flex items-start gap-2.5 text-[11px]">
                    <span className="absolute -left-3 mt-1.5 h-2 w-2 rounded-full bg-[#7C3AED] ring-2 ring-white shrink-0" />
                    <p className="text-[#475569] leading-snug pl-1">
                      <span className="font-semibold text-[#0F172A]">{a.text}</span>
                      <span className="text-[#94A3B8]"> · {a.by}</span>
                      <span className="block text-[10px] text-[#94A3B8] mt-0.5">{a.at}</span>
                    </p>
                  </div>
                ))}
              </div>
            </PmCard>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetaBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-medium text-[#94A3B8] mb-0.5">{label}</p>
      {children}
    </div>
  )
}

function ProblemRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[96px_1fr] gap-2 items-start">
      <p className="text-[11px] font-semibold text-[#94A3B8]">{label}</p>
      <p className="text-[12px] text-[#0F172A] font-medium leading-snug">{value}</p>
    </div>
  )
}

function FlowChip({
  icon,
  tone,
  label,
  value,
  detail,
  valueClass,
}: {
  icon: React.ReactNode
  tone: "purple" | "danger"
  label: string
  value: string
  detail?: string
  valueClass?: string
}) {
  return (
    <div className="flex items-center gap-2.5 min-w-0 flex-1 basis-[200px]">
      <span className={cn("h-9 w-9 rounded-full flex items-center justify-center shrink-0", tone === "purple" ? "bg-[#F5F3FF] text-[#7C3AED]" : "bg-[#FEE2E2] text-[#EF4444]")}>{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-medium text-[#94A3B8]">{label}</p>
        <p className={cn("text-[12px] font-bold text-[#0F172A] truncate", valueClass)}>{value}</p>
        {detail && <p className="text-[10px] text-[#64748B] truncate">{detail}</p>}
      </div>
    </div>
  )
}
