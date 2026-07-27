"use client"

import { useMemo, useState, type Dispatch, type SetStateAction } from "react"
import { useSearchParams } from "next/navigation"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  FileText,
  Flag,
  GripVertical,
  Info,
  Lightbulb,
  MoreHorizontal,
  Pencil,
  Plus,
  Rows3,
  Save,
  Settings2,
  Sparkles,
  Table2,
  Target,
  Type,
  Users,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { PmAvatar, PmButton, PmCard, PmProgress, PmStatusPill, PmToggle } from "@/components/performance-mock/primitives"
import {
  reportHistory,
  reportLibrary,
  scheduledReports,
} from "@/lib/performance-mock/fixtures/reports"
import { PM_PHOTOS } from "@/lib/performance-mock/photos"
import { cn } from "@/lib/utils"

type BuilderStep = "content" | "recipients" | "schedule"
type SectionId =
  | "exec-summary"
  | "strategy-progress"
  | "kpi-performance"
  | "okr-progress"
  | "team-performance"
  | "corrective-actions"
  | "risks-recommendations"
  | string

type Section = { id: SectionId; label: string; visible: boolean }

const initialSections: Section[] = [
  { id: "exec-summary", label: "Executive summary", visible: true },
  { id: "strategy-progress", label: "Strategy progress", visible: true },
  { id: "kpi-performance", label: "KPI performance", visible: true },
  { id: "okr-progress", label: "OKR progress", visible: true },
  { id: "team-performance", label: "Team performance", visible: true },
  { id: "corrective-actions", label: "Corrective actions", visible: true },
  { id: "risks-recommendations", label: "Risks & recommendations", visible: false },
]

const trendData = [
  { month: "Apr 2026", value: 71.2 },
  { month: "May 2026", value: 74.8 },
  { month: "Jun 2026", value: 76.4 },
]

const execMetrics = [
  { label: "Alignment", value: "86.4%", trend: "+4.3pp", up: true, icon: Target, color: "#7C3AED", spark: [78, 80, 82, 83, 85, 86.4] },
  { label: "KPI achievement", value: "76.4%", trend: "+3.7pp", up: true, icon: BarChart3, color: "#7C3AED", spark: [68, 70, 72, 73, 75, 76.4] },
  { label: "OKR progress", value: "72.3%", trend: "+4.4pp", up: true, icon: Flag, color: "#2563EB", spark: [62, 64, 66, 68, 70, 72.3] },
  { label: "Reviews complete", value: "56%", trend: "-6.1pp", up: false, icon: CheckCircle2, color: "#EF4444", spark: [68, 65, 62, 60, 58, 56] },
]

const highlights = [
  "Alignment improved by 4.3pp driven by clearer strategy cascades.",
  "OKR progress up 4.4pp with strong delivery in strategic themes.",
  "Mobile performance initiative on track to hit Q3 targets.",
]

const attentionItems = [
  "KPI achievement remains below 80% target.",
  "Review completion rate declined this quarter.",
  "Cross-department dependencies impacting delivery timelines.",
]

const strategyCascade = [
  { level: "Company", name: "Sustainable growth", pct: 78 },
  { level: "Theme", name: "Digital engagement", pct: 68 },
  { level: "Objective", name: "Expand Digital Engagement", pct: 72 },
]

const kpiRows = [
  { name: "Digital Adoption", actual: 68, target: 80, variance: -12, owner: "Nyasha Dube" },
  { name: "Revenue Growth Rate", actual: 12.4, target: 10, variance: 2.4, owner: "Farai Muchengezi" },
  { name: "NPS", actual: 42, target: 50, variance: -8, owner: "Rumbidzai Chaza" },
  { name: "Review completion", actual: 56, target: 90, variance: -34, owner: "Tendai Nyathi" },
]

const okrCards = [
  {
    title: "Expand Digital Engagement",
    progress: 72,
    krs: [
      { label: "Weekly active users +15%", pct: 40 },
      { label: "Training completion 95%", pct: 78 },
      { label: "Onboarding drop-off <20%", pct: 61 },
    ],
  },
  {
    title: "Drive sustainable revenue growth",
    progress: 81,
    krs: [
      { label: "ARR growth 12%", pct: 88 },
      { label: "Win 12 enterprise accounts", pct: 67 },
      { label: "Gross margin ≥ 58%", pct: 92 },
    ],
  },
]

const teamRows = [
  { name: "Commercial", lead: "Rumbidzai Chaza", score: 84, capacity: 78, src: PM_PHOTOS.rumbidzai },
  { name: "Digital", lead: "Nyasha Dube", score: 71, capacity: 92, src: PM_PHOTOS.nyasha },
  { name: "Finance", lead: "Tendai Nyathi", score: 88, capacity: 64, src: PM_PHOTOS.tendai },
  { name: "People & Culture", lead: "Chipo Biti", score: 76, capacity: 70, src: PM_PHOTOS.chipo },
]

const caRows = [
  { id: "CA-2026-014", title: "Improve digital adoption", severity: "High", status: "In Progress", progress: 58 },
  { id: "CA-2026-011", title: "Close review cycle backlog", severity: "Medium", status: "In Progress", progress: 42 },
  { id: "CA-2026-008", title: "Stabilise mobile latency", severity: "High", status: "On Track", progress: 74 },
]

const riskRows = [
  { title: "Mobile performance dependency", severity: "High", owner: "ICT Ops" },
  { title: "Training capacity conflict", severity: "Medium", owner: "P&C" },
  { title: "Data telemetry gaps", severity: "Medium", owner: "Analytics" },
]

const dataSourceOptions = ["Company scorecard", "OKRs", "Reviews", "KPIs", "Corrective actions", "Timesheets"]
const departmentFilters = ["All Departments", "Commercial", "Finance", "Operations", "People & Culture", "Digital"]
const comparisonOptions = ["vs Q1 2026", "vs prior year", "No comparison"]
const formatOptions = ["PDF", "PPTX", "XLSX"] as const

const recipientsSeed = [
  { name: "Farai Muchengezi", role: "CEO", src: PM_PHOTOS.farai, delivery: "To" as const },
  { name: "Tendai Nyathi", role: "CFO", src: PM_PHOTOS.tendai, delivery: "To" as const },
  { name: "Rumbidzai Chaza", role: "CCO", src: PM_PHOTOS.rumbidzai, delivery: "Cc" as const },
  { name: "Tawanda Chikore", role: "CIO", src: PM_PHOTOS.tawanda, delivery: "Cc" as const },
]

function MiniSpark({ data, color, up }: { data: number[]; color: string; up: boolean }) {
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const span = Math.max(max - min, 1)
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${22 - ((v - min) / span) * 18}`).join(" ")
  return (
    <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="w-full h-6">
      <polyline points={pts} fill="none" stroke={up ? color : "#EF4444"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LibraryListView({
  title,
  subtitle,
  rows,
}: {
  title: string
  subtitle: string
  rows: { id: string; primary: string; secondary: string; meta: string; status?: string }[]
}) {
  return (
    <div className="p-4 lg:p-5 space-y-4">
      <div>
        <nav className="text-[11px] text-[#94A3B8] mb-1.5">
          Reports <span className="mx-1.5">/</span> <span className="text-[#64748B]">{title}</span>
        </nav>
        <h1 className="text-[22px] font-bold text-[#0F172A] tracking-tight">{title}</h1>
        <p className="text-xs text-[#64748B] mt-1">{subtitle}</p>
      </div>
      <PmCard className="overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-[10px] font-semibold text-[#94A3B8] border-b border-[#F1F5F9]">
              <th className="px-4 py-2.5">Report</th>
              <th className="px-4 py-2.5">Details</th>
              <th className="px-4 py-2.5">Meta</th>
              <th className="px-4 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-[#F8FAFC] last:border-0 hover:bg-[#FAFAFB]">
                <td className="px-4 py-3 font-semibold text-[#0F172A]">{r.primary}</td>
                <td className="px-4 py-3 text-[#64748B]">{r.secondary}</td>
                <td className="px-4 py-3 text-[#64748B]">{r.meta}</td>
                <td className="px-4 py-3">
                  {r.status ? <PmStatusPill label={r.status} tone={r.status === "Success" || r.status === "Active" ? "success" : r.status === "Failed" ? "danger" : "purple"} /> : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </PmCard>
    </div>
  )
}

export function ReportsMockScreen() {
  const searchParams = useSearchParams()
  const view = searchParams.get("view")

  if (view === "adhoc") {
    return (
      <LibraryListView
        title="Ad-hoc Reports"
        subtitle="One-off analyses requested outside the scheduled pack cadence."
        rows={reportLibrary.slice(0, 4).map((r) => ({
          id: r.id,
          primary: r.title,
          secondary: r.description,
          meta: r.owner,
          status: "Draft",
        }))}
      />
    )
  }

  if (view === "scheduled") {
    return (
      <LibraryListView
        title="Scheduled Reports"
        subtitle="Recurring packs with cadence, recipients and delivery format."
        rows={scheduledReports.map((r) => ({
          id: r.id,
          primary: r.name,
          secondary: r.cadence,
          meta: `Next · ${r.nextRun}`,
          status: "Active",
        }))}
      />
    )
  }

  if (view === "history") {
    return (
      <LibraryListView
        title="Report History"
        subtitle="Generated runs, sizes and delivery outcomes."
        rows={reportHistory.map((r) => ({
          id: r.id,
          primary: r.name,
          secondary: r.runBy,
          meta: r.runAt,
          status: r.status,
        }))}
      />
    )
  }

  return <ReportBuilderWorkspace />
}

function ReportBuilderWorkspace() {
  const [title, setTitle] = useState("Q2 Executive Performance Review")
  const [editingTitle, setEditingTitle] = useState(false)
  const [step, setStep] = useState<BuilderStep>("content")
  const [sections, setSections] = useState<Section[]>(initialSections)
  const [activeSection, setActiveSection] = useState<SectionId>("exec-summary")
  const [dataSources, setDataSources] = useState(["Company scorecard", "OKRs", "Reviews"])
  const [department, setDepartment] = useState(departmentFilters[0])
  const [aiAssisted, setAiAssisted] = useState(true)
  const [prompt, setPrompt] = useState("Focus on material changes and decisions")
  const [comparison, setComparison] = useState(comparisonOptions[0])
  const [reviewer] = useState({ name: "Tawanda Chikore", src: PM_PHOTOS.tawanda })
  const [summaryText, setSummaryText] = useState(
    "Overall performance for Q2 2026 shows steady progress towards our strategic objectives. While we have made significant gains in alignment and OKR advancement, KPI achievement and review completion present opportunities for focused improvement."
  )
  const [checksPage, setChecksPage] = useState(1)
  const [zoom, setZoom] = useState("90%")
  const [moreOpen, setMoreOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [trendMetric, setTrendMetric] = useState("Overall score")
  const [recommendations, setRecommendations] = useState([
    "Ring-fence training capacity ahead of quarter-end operational peaks.",
    "Prioritise mobile latency remediation owned by ICT Operations.",
  ])
  const [recDraft, setRecDraft] = useState("")
  const [recipients, setRecipients] = useState(recipientsSeed)
  const [recipientDraft, setRecipientDraft] = useState("")
  const [recipientGroups, setRecipientGroups] = useState<string[]>(["Executive Committee"])
  const [formats, setFormats] = useState<string[]>(["PDF", "PPTX"])
  const [schedule, setSchedule] = useState({
    frequency: "One-time",
    date: "01 Aug 2026",
    time: "08:00",
    timezone: "SAST",
    channels: ["Email"] as string[],
    publishNow: false,
  })

  const reportChecks = useMemo(
    () => [
      { label: "Executive summary complete", ok: summaryText.trim().length > 40 },
      { label: "Data sources connected", ok: dataSources.length > 0 },
      { label: "Section settings reviewed", ok: true },
      { label: "Recipients confirmed", ok: recipients.length > 0 && step !== "content" },
      { label: "Branding applied", ok: true },
      { label: "Schedule configured", ok: step === "schedule" || schedule.date.length > 0 },
      { label: "Missing one recommendation", ok: recommendations.length >= 2 },
    ],
    [summaryText, dataSources, recipients, step, schedule.date, recommendations]
  )
  const checksDone = reportChecks.filter((c) => c.ok).length
  const missingCheck = reportChecks.find((c) => !c.ok)

  const toggleSectionVisible = (id: string) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s)))
  }

  const removeDataSource = (name: string) => setDataSources((prev) => prev.filter((d) => d !== name))
  const addDataSource = (name: string) => {
    if (!dataSources.includes(name)) setDataSources((prev) => [...prev, name])
  }

  const addRecipient = () => {
    const v = recipientDraft.trim()
    if (!v) return
    setRecipients((prev) => [...prev, { name: v, role: "Recipient", src: PM_PHOTOS.admin, delivery: "To" }])
    setRecipientDraft("")
    toast.success("Recipient added")
  }

  const removeRecipient = (name: string) => setRecipients((prev) => prev.filter((r) => r.name !== name))

  const activeSectionLabel = sections.find((s) => s.id === activeSection)?.label ?? ""

  const generateDraft = () => {
    if (aiAssisted) {
      setSummaryText(
        `AI draft (${prompt}): Q2 performance improved on alignment and OKRs, while KPI achievement and review completion remain the priority gaps for leadership action.`
      )
    }
    toast.success("Draft generated", { description: title })
  }

  const primaryAction = () => {
    if (step === "content") {
      setStep("recipients")
      return
    }
    if (step === "recipients") {
      setStep("schedule")
      return
    }
    toast.success("Report scheduled & published", {
      description: `${title} · ${schedule.frequency} · ${schedule.date} ${schedule.time} ${schedule.timezone}`,
    })
  }

  const primaryLabel =
    step === "content" ? "Continue to recipients" : step === "recipients" ? "Continue to schedule" : "Schedule & publish"

  const zoomScale = zoom === "75%" ? 0.75 : zoom === "100%" ? 1 : 0.9

  return (
    <div className="min-h-full bg-[#F8FAFC]">
      <div className="p-4 lg:p-5 space-y-3.5">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <nav className="text-[11px] text-[#94A3B8]">
            Reports <span className="mx-1.5">/</span> <span className="text-[#64748B]">Q2 Executive Review</span>
          </nav>
          <div className="flex flex-wrap items-center gap-2 relative">
            <PmButton variant="outline" onClick={() => setPreviewOpen(true)}>
              <Eye className="h-3.5 w-3.5" /> Preview
            </PmButton>
            <PmButton variant="outline" onClick={() => toast.success("Draft saved", { description: title })}>
              <Save className="h-3.5 w-3.5" /> Save draft
            </PmButton>
            <div className="relative">
              <PmButton
                variant="outline"
                onClick={() => setMoreOpen((o) => !o)}
              >
                <MoreHorizontal className="h-3.5 w-3.5" /> More <ChevronDown className="h-3 w-3 opacity-60" />
              </PmButton>
              {moreOpen && (
                <div className="absolute right-0 top-full mt-1 z-30 w-44 rounded-xl border border-[#E2E8F0] bg-white shadow-lg py-1 text-xs">
                  {["Duplicate report", "Export PDF", "Archive"].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        toast(opt, { description: title })
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
              onClick={() => {
                setStep("schedule")
                toast("Schedule & publish", { description: "Jumping to schedule step." })
              }}
            >
              <Calendar className="h-3.5 w-3.5" /> Schedule &amp; publish
            </PmButton>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {editingTitle ? (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditingTitle(false)}
              autoFocus
              className="text-[22px] font-bold text-[#0F172A] tracking-tight outline-none border-b-2 border-[#C4B5FD] bg-transparent min-w-[280px]"
            />
          ) : (
            <button type="button" onClick={() => setEditingTitle(true)} className="text-left">
              <h1 className="text-[22px] font-bold text-[#0F172A] tracking-tight leading-tight">{title}</h1>
            </button>
          )}
          <span className="inline-flex items-center h-[22px] px-2 rounded-md bg-[#F3E8FF] text-[#7C3AED] text-[11px] font-semibold">
            Draft
          </span>
        </div>

        <div className="flex flex-wrap items-stretch gap-0 text-xs">
          <div className="flex items-center gap-2.5 pr-5">
            <img src={PM_PHOTOS.farai} alt="" className="h-8 w-8 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
            <div className="leading-tight">
              <p className="text-[11px] text-[#94A3B8]">Owner</p>
              <p className="text-[13px] font-semibold text-[#0F172A]">Farai Muchengezi</p>
            </div>
          </div>
          <div className="w-px self-stretch bg-[#E2E8F0] mx-1 hidden sm:block" />
          <div className="flex items-center gap-2.5 px-5">
            <Calendar className="h-4 w-4 text-[#94A3B8] shrink-0" strokeWidth={1.75} />
            <div className="leading-tight">
              <p className="text-[11px] text-[#94A3B8]">Reporting period</p>
              <p className="text-[13px] font-semibold text-[#0F172A]">01 Apr – 30 Jun 2026</p>
            </div>
          </div>
          <div className="w-px self-stretch bg-[#E2E8F0] mx-1 hidden sm:block" />
          <div className="flex items-center gap-2.5 pl-5">
            <Users className="h-4 w-4 text-[#94A3B8] shrink-0" strokeWidth={1.75} />
            <div className="leading-tight">
              <p className="text-[11px] text-[#94A3B8]">Audience</p>
              <p className="text-[13px] font-semibold text-[#0F172A]">Executive Committee</p>
            </div>
          </div>
        </div>

        {/* Stepper — chevron active pill matching crop */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white px-2.5 py-2 overflow-x-auto">
          <div className="flex items-center min-w-[560px]">
            {(
              [
                { id: "content" as const, n: 1, label: "Content", sub: "Build your report" },
                { id: "recipients" as const, n: 2, label: "Recipients", sub: "Select report recipients" },
                { id: "schedule" as const, n: 3, label: "Schedule", sub: "Choose delivery date" },
              ]
            ).map((s, i, arr) => {
              const order = { content: 1, recipients: 2, schedule: 3 }
              const isActive = s.id === step
              const isDone = order[s.id] < order[step]
              return (
                <div key={s.id} className="flex items-center flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => setStep(s.id)}
                    className={cn(
                      "relative flex items-center gap-2.5 text-left shrink-0 h-[54px]",
                      isActive ? "pl-3.5 pr-9 min-w-[168px]" : "px-2"
                    )}
                  >
                    {isActive && (
                      <svg
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        viewBox="0 0 200 54"
                        preserveAspectRatio="none"
                        aria-hidden
                      >
                        <path
                          d="M4 2 H170 L196 27 L170 52 H4 Q2 52 2 50 V4 Q2 2 4 2 Z"
                          fill="#F5F3FF"
                          stroke="#C4B5FD"
                          strokeWidth="1.5"
                          vectorEffect="non-scaling-stroke"
                        />
                      </svg>
                    )}
                    <span
                      className={cn(
                        "relative z-[1] h-7 w-7 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0",
                        isDone
                          ? "bg-[#10B981] text-white"
                          : isActive
                            ? "bg-[#7C3AED] text-white"
                            : "bg-white text-[#94A3B8] border-[1.5px] border-[#CBD5E1]"
                      )}
                    >
                      {isDone ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : s.n}
                    </span>
                    <span className="relative z-[1] min-w-0">
                      <span
                        className={cn(
                          "block text-[13px] font-semibold leading-tight",
                          isActive ? "text-[#7C3AED]" : "text-[#334155]"
                        )}
                      >
                        {s.label}
                      </span>
                      <span className="block text-[11px] text-[#94A3B8] mt-0.5 leading-tight whitespace-nowrap">{s.sub}</span>
                    </span>
                  </button>
                  {i < arr.length - 1 && (
                    <div className="flex-1 h-px bg-[#E2E8F0] mx-1 min-w-[32px]" aria-hidden />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {step === "content" && (
          <div className="grid grid-cols-1 xl:grid-cols-[210px_minmax(0,1fr)_280px] gap-3.5 items-start">
            {/* Outline */}
            <PmCard className="p-3">
              <div className="flex items-center gap-1.5 mb-2.5">
                <h3 className="text-[12px] font-bold text-[#0F172A]">Report outline</h3>
                <button type="button" onClick={() => toast("Outline", { description: "Drag to reorder, toggle visibility with the eye." })} className="text-[#94A3B8] hover:text-[#7C3AED]">
                  <Info className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="space-y-0.5">
                {sections.map((s, i) => (
                  <div
                    key={s.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setActiveSection(s.id)}
                    onKeyDown={(e) => e.key === "Enter" && setActiveSection(s.id)}
                    className={cn(
                      "group flex items-center gap-1.5 rounded-lg px-2 py-2 cursor-pointer text-left border-l-[3px]",
                      activeSection === s.id
                        ? "bg-[#F5F3FF] border-[#7C3AED]"
                        : "border-transparent hover:bg-[#F8FAFC]",
                      !s.visible && "opacity-60"
                    )}
                  >
                    <GripVertical className="h-3.5 w-3.5 text-[#CBD5E1] shrink-0" />
                    <span className={cn("text-[10px] font-bold w-3.5 shrink-0", activeSection === s.id ? "text-[#7C3AED]" : "text-[#94A3B8]")}>
                      {i + 1}.
                    </span>
                    <span
                      className={cn(
                        "flex-1 min-w-0 truncate text-[11px]",
                        activeSection === s.id ? "font-semibold text-[#7C3AED]" : "text-[#334155]",
                        !s.visible && "line-through text-[#94A3B8]"
                      )}
                    >
                      {s.label}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleSectionVisible(s.id)
                      }}
                      className="shrink-0 text-[#94A3B8] hover:text-[#7C3AED]"
                    >
                      {s.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  const id = `section-${Date.now()}`
                  setSections((prev) => [...prev, { id, label: "New section", visible: true }])
                  setActiveSection(id)
                  toast.success("Section added")
                }}
                className="mt-2.5 w-full h-9 rounded-xl border border-dashed border-[#C4B5FD] bg-[#F5F3FF]/50 text-[11px] font-semibold text-[#7C3AED] hover:bg-[#F5F3FF] inline-flex items-center justify-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> Add section
              </button>
              <button
                type="button"
                onClick={() => toast("Templates", { description: "Opening report template library." })}
                className="mt-1.5 w-full h-9 rounded-full border border-[#E2E8F0] text-[11px] font-semibold text-[#334155] hover:bg-[#F8FAFC] inline-flex items-center justify-center gap-1.5"
              >
                <FileText className="h-3.5 w-3.5 text-[#7C3AED]" /> Use template
              </button>
            </PmCard>

            {/* Editor */}
            <PmCard className="p-0 min-w-0 overflow-hidden">
              <div className="flex items-center gap-1 px-3 py-2 border-b border-[#F1F5F9] overflow-x-auto">
                {[
                  { icon: Type, label: "Text" },
                  { icon: BarChart3, label: "Chart" },
                  { icon: Table2, label: "Table" },
                  { icon: Lightbulb, label: "Insight" },
                  { icon: Rows3, label: "Page break" },
                ].map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => toast(`Insert ${t.label}`, { description: `${t.label} block inserted into ${activeSectionLabel}.` })}
                    className="h-8 px-2.5 rounded-full text-[11px] font-semibold text-[#64748B] hover:bg-[#F5F3FF] hover:text-[#7C3AED] inline-flex items-center gap-1.5 shrink-0"
                  >
                    <t.icon className="h-3.5 w-3.5" /> {t.label}
                  </button>
                ))}
              </div>

              <div className="p-4 origin-top-left transition-transform" style={{ transform: `scale(${zoomScale})`, width: `${100 / zoomScale}%` }}>
                {!sections.find((s) => s.id === activeSection)?.visible ? (
                  <div className="py-16 text-center">
                    <EyeOff className="h-8 w-8 text-[#CBD5E1] mx-auto mb-2" />
                    <p className="text-sm font-semibold text-[#0F172A]">{activeSectionLabel} is hidden</p>
                    <p className="text-xs text-[#94A3B8] mt-1">Toggle visibility from the outline to include it in the pack.</p>
                  </div>
                ) : activeSection === "exec-summary" ? (
                  <ExecSummarySection
                    summaryText={summaryText}
                    setSummaryText={setSummaryText}
                    trendMetric={trendMetric}
                    setTrendMetric={setTrendMetric}
                  />
                ) : activeSection === "strategy-progress" ? (
                  <StrategySection />
                ) : activeSection === "kpi-performance" ? (
                  <KpiSection />
                ) : activeSection === "okr-progress" ? (
                  <OkrSection />
                ) : activeSection === "team-performance" ? (
                  <TeamSection />
                ) : activeSection === "corrective-actions" ? (
                  <CorrectiveSection />
                ) : activeSection === "risks-recommendations" ? (
                  <RisksSection
                    recommendations={recommendations}
                    setRecommendations={setRecommendations}
                    recDraft={recDraft}
                    setRecDraft={setRecDraft}
                  />
                ) : (
                  <CustomSection label={activeSectionLabel} />
                )}
              </div>
            </PmCard>

            {/* Settings */}
            <PmCard className="p-4 space-y-3.5">
              <h3 className="text-[13px] font-bold text-[#0F172A] inline-flex items-center gap-1.5">
                <Settings2 className="h-3.5 w-3.5 text-[#7C3AED]" /> Section settings
              </h3>

              <div>
                <p className="text-[11px] font-semibold text-[#334155] mb-1.5">Data source</p>
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {dataSources.map((d) => (
                    <span key={d} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-[#DDD6FE] bg-[#F5F3FF] text-[10px] font-semibold text-[#6D28D9]">
                      {d}
                      <button type="button" onClick={() => removeDataSource(d)} className="text-[#A78BFA] hover:text-[#6D28D9]">
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
                <select
                  value=""
                  onChange={(e) => e.target.value && addDataSource(e.target.value)}
                  className="w-full h-9 rounded-lg border border-[#E2E8F0] px-2.5 text-[11px] text-[#64748B] bg-white"
                >
                  <option value="">+ Add data source</option>
                  {dataSourceOptions.filter((o) => !dataSources.includes(o)).map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-[#334155] mb-1.5">Department filter</p>
                <select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full h-9 rounded-lg border border-[#E2E8F0] px-2.5 text-xs text-[#0F172A] bg-white">
                  {departmentFilters.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#334155] inline-flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#7C3AED]" /> AI-assisted summary
                </span>
                <PmToggle checked={aiAssisted} onChange={setAiAssisted} size="sm" />
              </div>

              {aiAssisted && (
                <div>
                  <p className="text-[11px] font-semibold text-[#334155] mb-1.5">Prompt</p>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-[#E2E8F0] px-2.5 py-1.5 text-[11px] outline-none focus:border-[#7C3AED] resize-none"
                  />
                </div>
              )}

              <div>
                <p className="text-[11px] font-semibold text-[#334155] mb-1.5">Comparison</p>
                <select value={comparison} onChange={(e) => setComparison(e.target.value)} className="w-full h-9 rounded-lg border border-[#E2E8F0] px-2.5 text-xs text-[#0F172A] bg-white">
                  {comparisonOptions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-[#334155] mb-1.5">Reviewer</p>
                <div className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] px-2.5 py-2">
                  <PmAvatar initials="TC" name={reviewer.name} src={reviewer.src} size="sm" />
                  <ChevronDown className="h-3.5 w-3.5 text-[#94A3B8] ml-auto" />
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-[#334155] mb-1.5">Branding</p>
                <div className="flex items-center gap-2 rounded-xl border border-[#E2E8F0] px-2.5 py-2.5">
                  <span className="h-8 w-8 rounded-lg bg-[#7C3AED] text-white text-[11px] font-bold flex items-center justify-center shrink-0">A</span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-[#0F172A] truncate">Arcus Performance Management</p>
                    <p className="text-[10px] text-[#94A3B8]">Default theme</p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#F1F5F9]">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[11px] font-semibold text-[#334155]">Report checks</p>
                  <span className="text-[10px] text-[#94A3B8]">{checksDone} of {reportChecks.length} complete</span>
                </div>
                <PmProgress value={(checksDone / reportChecks.length) * 100} className="mb-2 h-1.5" />
                {missingCheck && (
                  <p className="text-[10px] text-[#D97706] inline-flex items-center gap-1.5 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]" /> {missingCheck.label}
                  </p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <button type="button" onClick={() => setChecksPage((p) => Math.max(1, p - 1))} className="h-7 w-7 rounded-full flex items-center justify-center text-[#94A3B8] hover:bg-[#F1F5F9]">
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-[10px] font-medium text-[#64748B]">Page {checksPage} of 8</span>
                  <button type="button" onClick={() => setChecksPage((p) => Math.min(8, p + 1))} className="h-7 w-7 rounded-full flex items-center justify-center text-[#94A3B8] hover:bg-[#F1F5F9]">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </PmCard>
          </div>
        )}

        {step === "recipients" && (
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-4 items-start">
            <PmCard className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-bold text-[#0F172A] inline-flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-[#7C3AED]" /> Recipients
                </h3>
                <span className="text-[11px] text-[#94A3B8]">{recipients.length} people</span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <input
                  value={recipientDraft}
                  onChange={(e) => setRecipientDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addRecipient()}
                  placeholder="Add recipient by name or email..."
                  className="flex-1 h-10 rounded-full border border-[#E2E8F0] px-4 text-sm outline-none focus:border-[#7C3AED]"
                />
                <PmButton onClick={addRecipient}>
                  <Plus className="h-3.5 w-3.5" /> Add
                </PmButton>
              </div>
              <div className="mb-4">
                <p className="text-[11px] font-semibold text-[#334155] mb-2">Recipient groups</p>
                <div className="flex flex-wrap gap-2">
                  {["Executive Committee", "Department Heads", "Board Observers"].map((g) => {
                    const on = recipientGroups.includes(g)
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() =>
                          setRecipientGroups((prev) => (on ? prev.filter((x) => x !== g) : [...prev, g]))
                        }
                        className={cn(
                          "h-8 px-3 rounded-full text-[11px] font-semibold border",
                          on ? "bg-[#F5F3FF] border-[#C4B5FD] text-[#7C3AED]" : "border-[#E2E8F0] text-[#64748B]"
                        )}
                      >
                        {g}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="space-y-2">
                {recipients.map((r) => (
                  <div key={r.name} className="flex items-center justify-between gap-2 rounded-xl border border-[#F1F5F9] px-3 py-2.5">
                    <PmAvatar initials={r.name.slice(0, 2).toUpperCase()} name={r.name} role={r.role} src={r.src} size="sm" />
                    <div className="flex items-center gap-2">
                      <select
                        value={r.delivery}
                        onChange={(e) =>
                          setRecipients((prev) =>
                            prev.map((x) => (x.name === r.name ? { ...x, delivery: e.target.value as "To" | "Cc" } : x))
                          )
                        }
                        className="h-8 rounded-full border border-[#E2E8F0] px-2 text-[11px] bg-white"
                      >
                        <option value="To">To</option>
                        <option value="Cc">Cc</option>
                      </select>
                      <button type="button" onClick={() => removeRecipient(r.name)} className="text-[#94A3B8] hover:text-[#EF4444]">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <p className="text-[11px] font-semibold text-[#334155] mb-2">Delivery formats</p>
                <div className="flex flex-wrap gap-2">
                  {formatOptions.map((f) => {
                    const on = formats.includes(f)
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() =>
                          setFormats((prev) => (on ? prev.filter((x) => x !== f) : [...prev, f]))
                        }
                        className={cn(
                          "h-8 px-3 rounded-full text-[11px] font-semibold border",
                          on ? "bg-[#F5F3FF] border-[#C4B5FD] text-[#7C3AED]" : "border-[#E2E8F0] text-[#64748B]"
                        )}
                      >
                        {f}
                      </button>
                    )
                  })}
                </div>
              </div>
            </PmCard>
            <PmCard className="p-4 space-y-3">
              <h3 className="text-[13px] font-bold text-[#0F172A]">Delivery summary</h3>
              <div className="rounded-xl bg-[#F5F3FF] border border-[#E9E5FF] p-3 space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-[#64748B]">Audience</span><span className="font-semibold text-[#0F172A]">Executive Committee</span></div>
                <div className="flex justify-between"><span className="text-[#64748B]">Groups</span><span className="font-semibold text-[#0F172A] text-right max-w-[140px]">{recipientGroups.join(", ") || "—"}</span></div>
                <div className="flex justify-between"><span className="text-[#64748B]">To</span><span className="font-semibold text-[#0F172A]">{recipients.filter((r) => r.delivery === "To").length}</span></div>
                <div className="flex justify-between"><span className="text-[#64748B]">Cc</span><span className="font-semibold text-[#0F172A]">{recipients.filter((r) => r.delivery === "Cc").length}</span></div>
                <div className="flex justify-between"><span className="text-[#64748B]">Formats</span><span className="font-semibold text-[#0F172A]">{formats.join(", ") || "—"}</span></div>
              </div>
              <PmButton variant="outline" className="w-full" onClick={() => setStep("content")}>
                Back to content
              </PmButton>
            </PmCard>
          </div>
        )}

        {step === "schedule" && (
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-4 items-start">
            <PmCard className="p-4 max-w-2xl">
              <h3 className="text-[13px] font-bold text-[#0F172A] mb-3 inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[#7C3AED]" /> Schedule &amp; delivery
              </h3>
              <div className="space-y-3.5">
                <label className="block">
                  <span className="block text-xs font-semibold text-[#334155] mb-1">Frequency</span>
                  <select
                    value={schedule.frequency}
                    onChange={(e) => setSchedule((s) => ({ ...s, frequency: e.target.value }))}
                    className="w-full h-10 rounded-lg border border-[#E2E8F0] px-3 text-sm bg-white"
                  >
                    {["One-time", "Weekly", "Monthly", "Quarterly"].map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="block">
                    <span className="block text-xs font-semibold text-[#334155] mb-1">Date</span>
                    <input value={schedule.date} onChange={(e) => setSchedule((s) => ({ ...s, date: e.target.value }))} className="w-full h-10 rounded-lg border border-[#E2E8F0] px-3 text-sm outline-none focus:border-[#7C3AED]" />
                  </label>
                  <label className="block">
                    <span className="block text-xs font-semibold text-[#334155] mb-1">Time</span>
                    <input value={schedule.time} onChange={(e) => setSchedule((s) => ({ ...s, time: e.target.value }))} className="w-full h-10 rounded-lg border border-[#E2E8F0] px-3 text-sm outline-none focus:border-[#7C3AED]" />
                  </label>
                  <label className="block">
                    <span className="block text-xs font-semibold text-[#334155] mb-1">Timezone</span>
                    <select value={schedule.timezone} onChange={(e) => setSchedule((s) => ({ ...s, timezone: e.target.value }))} className="w-full h-10 rounded-lg border border-[#E2E8F0] px-3 text-sm bg-white">
                      {["SAST", "CAT", "UTC"].map((z) => (
                        <option key={z} value={z}>{z}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#334155] mb-2">Channels</p>
                  <div className="flex flex-wrap gap-2">
                    {["Email", "Slack", "Portal"].map((c) => {
                      const on = schedule.channels.includes(c)
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() =>
                            setSchedule((s) => ({
                              ...s,
                              channels: on ? s.channels.filter((x) => x !== c) : [...s.channels, c],
                            }))
                          }
                          className={cn(
                            "h-8 px-3 rounded-full text-[11px] font-semibold border",
                            on ? "bg-[#F5F3FF] border-[#C4B5FD] text-[#7C3AED]" : "border-[#E2E8F0] text-[#64748B]"
                          )}
                        >
                          {c}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <label className="flex items-center justify-between rounded-xl border border-[#E2E8F0] px-3 py-2.5">
                  <span className="text-xs font-semibold text-[#334155]">Publish immediately after schedule</span>
                  <PmToggle checked={schedule.publishNow} onChange={(v) => setSchedule((s) => ({ ...s, publishNow: v }))} size="sm" />
                </label>
              </div>
            </PmCard>
            <PmCard className="p-4 space-y-3">
              <h3 className="text-[13px] font-bold text-[#0F172A]">Readiness</h3>
              <div className="space-y-2 text-xs">
                {[
                  { label: "Content", ok: true },
                  { label: "Recipients", ok: recipients.length > 0 },
                  { label: "Formats", ok: formats.length > 0 },
                  { label: "Schedule", ok: Boolean(schedule.date && schedule.time) },
                ].map((c) => (
                  <div key={c.label} className="flex items-center justify-between">
                    <span className="text-[#64748B]">{c.label}</span>
                    {c.ok ? <CheckCircle2 className="h-4 w-4 text-[#10B981]" /> : <AlertTriangle className="h-4 w-4 text-[#F59E0B]" />}
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-[#64748B] leading-relaxed">
                Delivers <span className="font-semibold text-[#0F172A]">{title}</span> to {recipients.length} recipients on{" "}
                <span className="font-semibold text-[#0F172A]">{schedule.date} {schedule.time} {schedule.timezone}</span>.
              </p>
            </PmCard>
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 shadow-sm">
          <span className="text-[11px] text-[#64748B] inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#10B981]" /> Autosaved just now
          </span>
          <div className="flex items-center gap-1.5 text-[11px] text-[#64748B]">
            <span>Zoom</span>
            <select value={zoom} onChange={(e) => setZoom(e.target.value)} className="h-8 rounded-full border border-[#E2E8F0] px-2.5 bg-white font-semibold text-[#0F172A]">
              {["75%", "90%", "100%"].map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            {step !== "content" && (
              <PmButton variant="outline" onClick={() => setStep(step === "schedule" ? "recipients" : "content")}>
                Back
              </PmButton>
            )}
            <PmButton variant="outline" onClick={generateDraft} className="border-[#C4B5FD] text-[#7C3AED]">
              <Sparkles className="h-3.5 w-3.5" /> Generate draft
            </PmButton>
            <PmButton onClick={primaryAction}>
              {primaryLabel} <ChevronRight className="h-3.5 w-3.5" />
            </PmButton>
          </div>
        </div>
      </div>

      {previewOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setPreviewOpen(false)}>
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#0F172A]">Preview · {title}</h3>
              <button type="button" onClick={() => setPreviewOpen(false)} className="text-[#94A3B8] hover:text-[#0F172A]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-[#64748B] mb-3">Showing {sections.filter((s) => s.visible).length} visible sections · {recipients.length} recipients · {formats.join(", ")}</p>
            <div className="rounded-xl border border-[#E2E8F0] p-4 max-h-[50vh] overflow-y-auto space-y-2">
              {sections.filter((s) => s.visible).map((s, i) => (
                <div key={s.id} className="flex items-center gap-2 text-xs">
                  <span className="h-6 w-6 rounded-full bg-[#F5F3FF] text-[#7C3AED] text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                  <span className="font-semibold text-[#0F172A]">{s.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <PmButton onClick={() => setPreviewOpen(false)}>Close preview</PmButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-base font-bold text-[#0F172A]">{title}</h2>
      <button type="button" onClick={() => toast("Editing section", { description: title })} className="text-[#94A3B8] hover:text-[#7C3AED]">
        <Pencil className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

function ExecSummarySection({
  summaryText,
  setSummaryText,
  trendMetric,
  setTrendMetric,
}: {
  summaryText: string
  setSummaryText: (v: string) => void
  trendMetric: string
  setTrendMetric: (v: string) => void
}) {
  return (
    <div className="space-y-4">
      <SectionHeader title="Executive summary" />
      <textarea
        value={summaryText}
        onChange={(e) => setSummaryText(e.target.value)}
        rows={3}
        className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2.5 text-[12px] text-[#475569] leading-relaxed outline-none focus:border-[#7C3AED] resize-none"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {execMetrics.map((m) => (
          <div key={m.label} className="rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-sm">
            <span className="h-8 w-8 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: `${m.color}18`, color: m.color }}>
              <m.icon className="h-4 w-4" />
            </span>
            <p className="text-[10px] text-[#94A3B8]">{m.label}</p>
            <p className="text-lg font-extrabold text-[#0F172A] leading-tight">{m.value}</p>
            <p className={cn("text-[10px] font-bold mt-0.5", m.up ? "text-[#10B981]" : "text-[#EF4444]")}>
              {m.trend} vs Q1 2026
            </p>
            <div className="mt-1.5">
              <MiniSpark data={m.spark} color={m.color} up={m.up} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="rounded-xl border border-[#E2E8F0] p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[12px] font-bold text-[#0F172A]">Performance trend</h4>
            <select
              value={trendMetric}
              onChange={(e) => setTrendMetric(e.target.value)}
              className="h-7 rounded-full border border-[#E2E8F0] px-2 text-[10px] bg-white font-semibold text-[#64748B]"
            >
              {["Overall score", "Alignment", "KPI achievement"].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 18, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="rbTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} domain={[60, 90]} />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#7C3AED"
                  strokeWidth={2.5}
                  fill="url(#rbTrend)"
                  dot={{ r: 4, fill: "#7C3AED", stroke: "#fff", strokeWidth: 2 }}
                  label={{ position: "top", fontSize: 10, fill: "#7C3AED", formatter: (v: number) => `${v}%` }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="rounded-xl border border-[#D1FAE5] bg-[#ECFDF5] p-3">
            <h4 className="text-[12px] font-bold text-[#065F46] mb-2 inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" /> Highlights
            </h4>
            <ul className="space-y-1.5">
              {highlights.map((h) => (
                <li key={h} className="text-[11px] text-[#065F46] leading-snug flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#10B981] shrink-0" />
                  {h}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-3">
            <h4 className="text-[12px] font-bold text-[#991B1B] mb-2 inline-flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" /> Areas requiring attention
            </h4>
            <ul className="space-y-1.5">
              {attentionItems.map((h) => (
                <li key={h} className="text-[11px] text-[#991B1B] leading-snug flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#EF4444] shrink-0" />
                  {h}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function StrategySection() {
  return (
    <div className="space-y-4">
      <SectionHeader title="Strategy progress" />
      <div className="space-y-2">
        {strategyCascade.map((s, i) => (
          <div key={s.name} className="rounded-xl border border-[#E2E8F0] p-3 flex items-center gap-3">
            <span className="h-8 w-8 rounded-full bg-[#F5F3FF] text-[#7C3AED] text-[11px] font-bold flex items-center justify-center">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-[#94A3B8] font-semibold uppercase tracking-wide">{s.level}</p>
              <p className="text-[12px] font-bold text-[#0F172A]">{s.name}</p>
              <PmProgress value={s.pct} className="mt-1.5 h-1.5" />
            </div>
            <span className="text-sm font-extrabold text-[#7C3AED] tabular-nums">{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function KpiSection() {
  return (
    <div className="space-y-4">
      <SectionHeader title="KPI performance" />
      <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
        <table className="w-full text-left text-[11px] min-w-[520px]">
          <thead>
            <tr className="text-[10px] font-semibold text-[#94A3B8] border-b border-[#F1F5F9] bg-[#FAFAFB]">
              <th className="px-3 py-2">KPI</th>
              <th className="px-3 py-2">Actual</th>
              <th className="px-3 py-2">Target</th>
              <th className="px-3 py-2">Variance</th>
              <th className="px-3 py-2">Owner</th>
            </tr>
          </thead>
          <tbody>
            {kpiRows.map((r) => (
              <tr key={r.name} className="border-b border-[#F8FAFC] last:border-0">
                <td className="px-3 py-2.5 font-semibold text-[#0F172A]">{r.name}</td>
                <td className="px-3 py-2.5">{r.actual}%</td>
                <td className="px-3 py-2.5 text-[#64748B]">{r.target}%</td>
                <td className={cn("px-3 py-2.5 font-bold", r.variance >= 0 ? "text-[#10B981]" : "text-[#EF4444]")}>
                  {r.variance > 0 ? "+" : ""}
                  {r.variance}pp
                </td>
                <td className="px-3 py-2.5 text-[#64748B]">{r.owner}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="h-40 rounded-xl border border-[#E2E8F0] p-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={kpiRows}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
            <Tooltip />
            <Bar dataKey="actual" fill="#7C3AED" radius={[6, 6, 0, 0]} />
            <Bar dataKey="target" fill="#E9E5FF" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function OkrSection() {
  return (
    <div className="space-y-4">
      <SectionHeader title="OKR progress" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {okrCards.map((o) => (
          <div key={o.title} className="rounded-xl border border-[#E2E8F0] p-3.5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[12px] font-bold text-[#0F172A]">{o.title}</p>
              <span className="text-sm font-extrabold text-[#7C3AED]">{o.progress}%</span>
            </div>
            <PmProgress value={o.progress} className="mb-3 h-1.5" />
            <div className="space-y-2">
              {o.krs.map((kr) => (
                <div key={kr.label}>
                  <div className="flex justify-between text-[10px] mb-0.5">
                    <span className="text-[#64748B]">{kr.label}</span>
                    <span className="font-bold text-[#0F172A]">{kr.pct}%</span>
                  </div>
                  <PmProgress value={kr.pct} className="h-1" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TeamSection() {
  return (
    <div className="space-y-4">
      <SectionHeader title="Team performance" />
      <div className="space-y-2">
        {teamRows.map((t) => (
          <div key={t.name} className="rounded-xl border border-[#E2E8F0] p-3 flex items-center gap-3">
            <img src={t.src} alt="" className="h-9 w-9 rounded-full object-cover" referrerPolicy="no-referrer" />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold text-[#0F172A]">{t.name}</p>
              <p className="text-[10px] text-[#94A3B8]">Lead · {t.lead}</p>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[9px] text-[#94A3B8]">Score</p>
                  <PmProgress value={t.score} className="h-1" />
                </div>
                <div>
                  <p className="text-[9px] text-[#94A3B8]">Capacity</p>
                  <PmProgress value={t.capacity} color={t.capacity > 85 ? "#EF4444" : "#7C3AED"} className="h-1" />
                </div>
              </div>
            </div>
            <span className="text-sm font-extrabold text-[#0F172A] tabular-nums">{t.score}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CorrectiveSection() {
  return (
    <div className="space-y-4">
      <SectionHeader title="Corrective actions" />
      <div className="space-y-2">
        {caRows.map((c) => (
          <div key={c.id} className="rounded-xl border border-[#E2E8F0] p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] text-[#94A3B8] font-semibold">{c.id}</p>
                <p className="text-[12px] font-bold text-[#0F172A]">{c.title}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <PmStatusPill label={c.severity} tone={c.severity === "High" ? "danger" : "warning"} />
                <PmStatusPill label={c.status} tone={c.status === "On Track" ? "success" : "purple"} />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <PmProgress value={c.progress} className="flex-1 h-1.5" />
              <span className="text-[11px] font-bold text-[#0F172A] tabular-nums">{c.progress}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RisksSection({
  recommendations,
  setRecommendations,
  recDraft,
  setRecDraft,
}: {
  recommendations: string[]
  setRecommendations: Dispatch<SetStateAction<string[]>>
  recDraft: string
  setRecDraft: (v: string) => void
}) {
  return (
    <div className="space-y-4">
      <SectionHeader title="Risks & recommendations" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-[#0F172A]">Risks</p>
          {riskRows.map((r) => (
            <div key={r.title} className="rounded-xl border border-[#E2E8F0] p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-bold text-[#0F172A]">{r.title}</p>
                <PmStatusPill label={r.severity} tone={r.severity === "High" ? "danger" : "warning"} />
              </div>
              <p className="text-[10px] text-[#94A3B8] mt-1">Owner · {r.owner}</p>
            </div>
          ))}
        </div>
        <div>
          <p className="text-[11px] font-bold text-[#0F172A] mb-2">Recommendations</p>
          <div className="space-y-2 mb-2">
            {recommendations.map((r, i) => (
              <div key={i} className="rounded-xl border border-[#E9E5FF] bg-[#F5F3FF]/50 px-3 py-2 text-[11px] text-[#334155] flex gap-2">
                <Lightbulb className="h-3.5 w-3.5 text-[#7C3AED] shrink-0 mt-0.5" />
                <span className="flex-1">{r}</span>
                <button
                  type="button"
                  onClick={() => setRecommendations((prev) => prev.filter((_, idx) => idx !== i))}
                  className="text-[#94A3B8] hover:text-[#EF4444]"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={recDraft}
              onChange={(e) => setRecDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && recDraft.trim()) {
                  setRecommendations((prev) => [...prev, recDraft.trim()])
                  setRecDraft("")
                }
              }}
              placeholder="Add recommendation..."
              className="flex-1 h-9 rounded-full border border-[#E2E8F0] px-3 text-[11px] outline-none focus:border-[#7C3AED]"
            />
            <PmButton
              onClick={() => {
                if (!recDraft.trim()) return
                setRecommendations((prev) => [...prev, recDraft.trim()])
                setRecDraft("")
              }}
            >
              Add
            </PmButton>
          </div>
        </div>
      </div>
    </div>
  )
}

function CustomSection({ label }: { label: string }) {
  const [body, setBody] = useState(`Narrative for ${label}. Add charts, tables or insights from the toolbar.`)
  return (
    <div className="space-y-3">
      <SectionHeader title={label} />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={6}
        className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2.5 text-[12px] text-[#475569] outline-none focus:border-[#7C3AED] resize-none"
      />
    </div>
  )
}
