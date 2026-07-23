"use client"

import { useMemo, useState, type ReactNode } from "react"
import {
  Target,
  CheckCircle2,
  AlertTriangle,
  Trophy,
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  X,
  MessageSquare,
  Plus,
  Calendar,
  Users,
  Rocket,
  LineChart,
  Filter,
} from "lucide-react"
import { PerformanceMockTopChrome } from "@/components/performance-mock/shell"
import { PmButton, PmPageHeader, PmSelectChip, PmStatusPill, PmAvatar, PmProgress } from "@/components/performance-mock/primitives"
import { PM_PHOTOS, pmPhoto } from "@/lib/performance-mock/photos"
import { cn } from "@/lib/utils"

type Confidence = "High" | "Medium" | "Low"
type Status = "On Track" | "At Risk" | "Needs Attention" | "Completed" | "In Progress"
type OkrType = "company" | "department"

type Owner = { initials: string; name: string; role: string; src: string }

type KeyResult = {
  id: string
  title: string
  owner?: Owner
  progress: number
  confidence: Confidence
  due: string
  status: Status
}

type Initiative = { name: string; status: Status; color: string }
type RelatedKpi = { name: string; value: string; trend: string; up: boolean; iconBg: string }
type CheckIn = { id: string; author: Owner; date: string; note: string; confidence: Confidence; latest?: boolean }

type Objective = {
  id: number
  title: string
  owner: Owner
  progress: number
  confidence: Confidence
  due: string
  status: Status
  type: OkrType
  description: string
  krs: KeyResult[]
  linkedInitiatives: Initiative[]
  relatedKpis: RelatedKpi[]
  checkins: CheckIn[]
}

const rumbidzai: Owner = {
  initials: "RC",
  name: "Rumbidzai Chaza",
  role: "Chief Commercial Officer",
  src: PM_PHOTOS.rumbidzai,
}
const kuda: Owner = {
  initials: "KB",
  name: "Kudakwashe Biti",
  role: "Head of Customer Success",
  src: pmPhoto(32),
}
const tatenda: Owner = {
  initials: "TM",
  name: "Tatenda Mlambo",
  role: "Head of People & Culture",
  src: PM_PHOTOS.tawanda,
}
const ashley: Owner = {
  initials: "AM",
  name: "Ashley Mutema",
  role: "Head of Product",
  src: PM_PHOTOS.blessing,
}
const admin: Owner = {
  initials: "AU",
  name: "Adm. User",
  role: "Super Administrator",
  src: PM_PHOTOS.admin,
}

const initialObjectives: Objective[] = [
  {
    id: 1,
    title: "Drive sustainable revenue growth",
    owner: rumbidzai,
    progress: 78,
    confidence: "High",
    due: "30 Jun 2026",
    status: "On Track",
    type: "company",
    description:
      "Expand our market presence and grow recurring revenue by acquiring high-value customers, increasing retention, and optimising monetisation strategies across enterprise and mid-market segments.",
    krs: [
      { id: "1.1", title: "Increase recurring revenue to $4.5M ARR", owner: rumbidzai, progress: 82, confidence: "High", due: "30 Jun 2026", status: "On Track" },
      { id: "1.2", title: "Acquire 120 new enterprise customers", owner: rumbidzai, progress: 65, confidence: "Medium", due: "30 Jun 2026", status: "On Track" },
      { id: "1.3", title: "Achieve Net Revenue Retention of 115%", owner: rumbidzai, progress: 88, confidence: "High", due: "30 Jun 2026", status: "On Track" },
    ],
    linkedInitiatives: [
      { name: "Enterprise Growth Campaign", status: "On Track", color: "#7C3AED" },
      { name: "Pricing Optimisation", status: "In Progress", color: "#2563EB" },
      { name: "Channel Partner Expansion", status: "On Track", color: "#0D9488" },
    ],
    relatedKpis: [
      { name: "Revenue Growth Rate", value: "72.3%", trend: "8.7%", up: true, iconBg: "#F3E8FF" },
      { name: "New Logo Wins", value: "68", trend: "13", up: true, iconBg: "#DBEAFE" },
      { name: "Net Revenue Retention", value: "112%", trend: "4%", up: true, iconBg: "#D1FAE5" },
    ],
    checkins: [
      {
        id: "c1-1",
        author: rumbidzai,
        date: "10 Jul 2026",
        note: "Strong pipeline conversion this month. Enterprise deals are progressing well and renewals remain healthy.",
        confidence: "High",
        latest: true,
      },
      {
        id: "c1-2",
        author: rumbidzai,
        date: "26 Jun 2026",
        note: "Renewal cycle on track. Closing a few large accounts next quarter.",
        confidence: "Medium",
      },
    ],
  },
  {
    id: 2,
    title: "Deliver world-class customer experience",
    owner: kuda,
    progress: 61,
    confidence: "Medium",
    due: "30 Jun 2026",
    status: "Needs Attention",
    type: "department",
    description:
      "Raise the bar on customer experience across every touchpoint, from onboarding through renewal, while keeping support responsive and reliable.",
    krs: [
      { id: "2.1", title: "Improve CSAT score to 4.6/5", owner: kuda, progress: 72, confidence: "High", due: "30 Jun 2026", status: "On Track" },
      { id: "2.2", title: "Reduce average support response time to < 2hrs", owner: kuda, progress: 58, confidence: "Medium", due: "30 Jun 2026", status: "Needs Attention" },
      { id: "2.3", title: "Achieve 95% SLA compliance", owner: kuda, progress: 46, confidence: "Low", due: "30 Jun 2026", status: "At Risk" },
      { id: "2.4", title: "Launch customer education academy", owner: kuda, progress: 68, confidence: "Medium", due: "30 Jun 2026", status: "Needs Attention" },
    ],
    linkedInitiatives: [
      { name: "Support Tiering Overhaul", status: "Needs Attention", color: "#F59E0B" },
      { name: "Customer Academy Launch", status: "On Track", color: "#7C3AED" },
      { name: "NPS Recovery Sprint", status: "In Progress", color: "#2563EB" },
    ],
    relatedKpis: [
      { name: "CSAT Score", value: "4.4/5", trend: "0.2", up: true, iconBg: "#DBEAFE" },
      { name: "First Response Time", value: "2.3hrs", trend: "0.4hrs", up: true, iconBg: "#FEF3C7" },
      { name: "SLA Compliance", value: "91%", trend: "2%", up: false, iconBg: "#FEE2E2" },
    ],
    checkins: [
      {
        id: "c2-1",
        author: kuda,
        date: "08 Jul 2026",
        note: "SLA compliance still lagging in APAC. Escalated staffing request.",
        confidence: "Medium",
        latest: true,
      },
    ],
  },
  {
    id: 3,
    title: "Build high-performing, engaged teams",
    owner: tatenda,
    progress: 84,
    confidence: "High",
    due: "30 Jun 2026",
    status: "On Track",
    type: "department",
    description: "Strengthen our talent pipeline, leadership bench and engagement culture so every team can perform at its best.",
    krs: [
      { id: "3.1", title: "Raise employee engagement score to 85%", owner: tatenda, progress: 88, confidence: "High", due: "30 Jun 2026", status: "On Track" },
      { id: "3.2", title: "Fill 90% of critical roles within 45 days", owner: tatenda, progress: 79, confidence: "High", due: "30 Jun 2026", status: "On Track" },
      { id: "3.3", title: "Complete leadership development cohort of 24", owner: tatenda, progress: 85, confidence: "High", due: "30 Jun 2026", status: "On Track" },
    ],
    linkedInitiatives: [
      { name: "Leadership Academy Cohort 3", status: "On Track", color: "#7C3AED" },
      { name: "Engagement Pulse Survey", status: "On Track", color: "#10B981" },
      { name: "Critical Role Hiring Blitz", status: "In Progress", color: "#2563EB" },
    ],
    relatedKpis: [
      { name: "Employee Engagement", value: "83%", trend: "5%", up: true, iconBg: "#D1FAE5" },
      { name: "Time to Fill", value: "41 days", trend: "6 days", up: true, iconBg: "#F3E8FF" },
      { name: "Leadership Bench", value: "76%", trend: "3%", up: true, iconBg: "#DBEAFE" },
    ],
    checkins: [
      {
        id: "c3-1",
        author: tatenda,
        date: "05 Jul 2026",
        note: "Leadership cohort graduation on schedule for August.",
        confidence: "High",
        latest: true,
      },
    ],
  },
  {
    id: 4,
    title: "Accelerate product innovation & impact",
    owner: ashley,
    progress: 53,
    confidence: "Medium",
    due: "30 Jun 2026",
    status: "Needs Attention",
    type: "company",
    description:
      "Ship differentiated product capabilities faster while ensuring quality, adoption and measurable customer impact.",
    krs: [
      { id: "4.1", title: "Ship 6 major feature releases", owner: ashley, progress: 50, confidence: "Medium", due: "30 Jun 2026", status: "Needs Attention" },
      { id: "4.2", title: "Achieve 70% adoption on new features within 60 days", owner: ashley, progress: 44, confidence: "Low", due: "30 Jun 2026", status: "At Risk" },
      { id: "4.3", title: "Reduce critical bug backlog by 40%", owner: ashley, progress: 66, confidence: "Medium", due: "30 Jun 2026", status: "On Track" },
    ],
    linkedInitiatives: [
      { name: "Platform Modernisation", status: "Needs Attention", color: "#F59E0B" },
      { name: "Feature Adoption Program", status: "At Risk", color: "#EF4444" },
      { name: "Quality Hardening Sprint", status: "In Progress", color: "#7C3AED" },
    ],
    relatedKpis: [
      { name: "Feature Adoption Rate", value: "58%", trend: "3%", up: false, iconBg: "#FEE2E2" },
      { name: "Critical Bug Backlog", value: "34", trend: "12", up: true, iconBg: "#D1FAE5" },
      { name: "Release Cadence", value: "3 / Q", trend: "1", up: false, iconBg: "#FEF3C7" },
    ],
    checkins: [
      {
        id: "c4-1",
        author: ashley,
        date: "03 Jul 2026",
        note: "Adoption tracking below target. Running in-app nudges to improve uptake.",
        confidence: "Medium",
        latest: true,
      },
    ],
  },
]

function statusTone(status: Status): "success" | "warning" | "danger" | "info" | "purple" | "neutral" {
  if (status === "On Track" || status === "Completed") return "success"
  if (status === "Needs Attention") return "warning"
  if (status === "At Risk") return "danger"
  if (status === "In Progress") return "info"
  return "neutral"
}

function ConfidenceBadge({ value }: { value: Confidence }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#374151]">
      <span
        className="h-2 w-2 rounded-full shrink-0"
        style={{
          backgroundColor: value === "High" ? "#10B981" : value === "Medium" ? "#F59E0B" : "#EF4444",
        }}
      />
      {value}
    </span>
  )
}

function CircularScore({ value, size = 56 }: { value: number; size?: number }) {
  const stroke = 5
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (value / 100) * c
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#EDE9FE" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#7C3AED"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[11px] font-bold text-[#111827]">{value.toFixed(1)}%</span>
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  sub,
  icon,
  iconBg,
  iconColor,
  ring,
  trend,
}: {
  label: string
  value: string
  sub: string
  icon?: ReactNode
  iconBg?: string
  iconColor?: string
  ring?: number
  trend?: string
}) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm min-w-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-[#6B7280]">{label}</p>
          <p className="mt-1.5 text-xl leading-none font-bold text-[#111827] tracking-tight">{value}</p>
          {trend ? (
            <p className="mt-1.5 text-xs font-semibold text-[#10B981]">{trend}</p>
          ) : (
            <p className="mt-1.5 text-xs text-[#9CA3AF]">{sub}</p>
          )}
          {trend && <p className="text-[11px] text-[#9CA3AF]">{sub}</p>}
        </div>
        {ring !== undefined ? (
          <CircularScore value={ring} />
        ) : (
          <div
            className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: iconBg, color: iconColor }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

export function GoalsMockScreen() {
  const [objectives, setObjectives] = useState<Objective[]>(initialObjectives)
  const [tab, setTab] = useState<"all" | "company" | "department">("all")
  const [search, setSearch] = useState("")
  const [expanded, setExpanded] = useState<Record<number, boolean>>({ 1: true, 2: true })
  const [selectedId, setSelectedId] = useState<number>(1)
  const [pageSize, setPageSize] = useState(10)
  const [period, setPeriod] = useState("Q2 2026 (Apr – Jun)")
  const [team, setTeam] = useState("All Teams")
  const [checkinOpen, setCheckinOpen] = useState(false)
  const [checkinDraft, setCheckinDraft] = useState("")
  const [panelOpen, setPanelOpen] = useState(true)

  const counts = useMemo(
    () => ({
      all: objectives.length,
      company: objectives.filter((o) => o.type === "company").length,
      department: objectives.filter((o) => o.type === "department").length,
    }),
    [objectives]
  )

  const filtered = useMemo(() => {
    return objectives.filter((o) => {
      if (tab !== "all" && o.type !== tab) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        if (!o.title.toLowerCase().includes(q) && !o.krs.some((k) => k.title.toLowerCase().includes(q))) return false
      }
      return true
    })
  }, [objectives, tab, search])

  const allKrs = objectives.flatMap((o) => o.krs)
  const overallProgress = 72.3
  const atRiskKrs = allKrs.filter((k) => k.status === "At Risk").length
  const onTrackKrs = allKrs.filter((k) => k.status === "On Track").length
  const completedKrs = 2

  const selected = objectives.find((o) => o.id === selectedId) ?? objectives[0]
  const selectedIndex = objectives.findIndex((o) => o.id === selected.id)

  const toggleExpand = (id: number) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))

  const selectObjective = (id: number) => {
    setSelectedId(id)
    setPanelOpen(true)
    setExpanded((prev) => ({ ...prev, [id]: true }))
  }

  const goPrev = () => {
    const i = Math.max(0, selectedIndex - 1)
    selectObjective(objectives[i].id)
  }
  const goNext = () => {
    const i = Math.min(objectives.length - 1, selectedIndex + 1)
    selectObjective(objectives[i].id)
  }

  const handleUpdateCheckin = () => {
    const note = checkinDraft.trim() || "Checked in on progress against key results."
    const newCheckin: CheckIn = {
      id: `c${selected.id}-${Date.now()}`,
      author: admin,
      date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      note,
      confidence: selected.confidence,
      latest: true,
    }
    setObjectives((prev) =>
      prev.map((o) =>
        o.id === selected.id
          ? { ...o, checkins: [newCheckin, ...o.checkins.map((c) => ({ ...c, latest: false }))] }
          : o
      )
    )
    setCheckinDraft("")
    setCheckinOpen(false)
  }

  const showPanel = panelOpen && selected

  return (
    <div className="min-h-full bg-[#F8FAFC]">
      <PerformanceMockTopChrome breadcrumbs={["Performance Management", "Goals"]} />
      <div className="p-4 lg:p-5 space-y-3">
        <PmPageHeader
          title="Objectives & Key Results"
          subtitle="Align goals, track progress, and drive exceptional outcomes."
          actions={
            <>
              <PmSelectChip
                icon={<Calendar className="h-3.5 w-3.5 text-[#6B7280]" />}
                label={period}
                onClick={() => setPeriod(period.startsWith("Q2") ? "Q1 2026 (Jan – Mar)" : "Q2 2026 (Apr – Jun)")}
              />
              <PmSelectChip
                icon={<Users className="h-3.5 w-3.5 text-[#6B7280]" />}
                label={team}
                onClick={() => setTeam(team === "All Teams" ? "Executive Team" : "All Teams")}
              />
              <PmButton variant="primary">
                <Plus className="h-3.5 w-3.5" /> Create OKR
              </PmButton>
              <button
                type="button"
                className="h-9 w-9 rounded-lg border border-[#E5E7EB] bg-white flex items-center justify-center text-[#6B7280] hover:bg-[#F9FAFB]"
                aria-label="Filters"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
            </>
          }
        />

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
          <MetricCard
            label="Overall OKR Progress"
            value={`${overallProgress}%`}
            sub="vs Q1 2026"
            trend="+ 8.6%"
            ring={overallProgress}
          />
          <MetricCard
            label="Objectives"
            value={String(objectives.length)}
            sub="0 completed"
            icon={<Target className="h-5 w-5" />}
            iconBg="#F3E8FF"
            iconColor="#7C3AED"
          />
          <MetricCard
            label="Key Results"
            value={String(allKrs.length)}
            sub={`${onTrackKrs} on track`}
            icon={<CheckCircle2 className="h-5 w-5" />}
            iconBg="#D1FAE5"
            iconColor="#059669"
          />
          <MetricCard
            label="At Risk"
            value={String(atRiskKrs)}
            sub={`${((atRiskKrs / allKrs.length) * 100).toFixed(1)}% of KRs`}
            icon={<AlertTriangle className="h-5 w-5" />}
            iconBg="#FEF3C7"
            iconColor="#D97706"
          />
          <MetricCard
            label="Completed KRs"
            value={String(completedKrs)}
            sub={`${((completedKrs / allKrs.length) * 100).toFixed(1)}%`}
            icon={<Trophy className="h-5 w-5" />}
            iconBg="#F3E8FF"
            iconColor="#7C3AED"
          />
        </div>

        <div className={cn("grid grid-cols-1 gap-4 items-start", showPanel && "xl:grid-cols-[minmax(0,1fr)_380px]")}>
          {/* Main table card */}
          <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-sm overflow-hidden">
            <div className="px-4 pt-4 pb-3 flex flex-wrap items-center justify-between gap-3 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-1">
                {(
                  [
                    { id: "all" as const, label: "All OKRs", count: counts.all },
                    { id: "company" as const, label: "Company OKRs", count: counts.company },
                    { id: "department" as const, label: "Department OKRs", count: counts.department },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={cn(
                      "h-9 px-3.5 rounded-lg text-sm font-medium transition-colors",
                      tab === t.id
                        ? "bg-[#F3E8FF] text-[#7C3AED]"
                        : "text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111827]"
                    )}
                  >
                    {t.label} ({t.count})
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end min-w-0">
                <div className="flex items-center h-9 w-full sm:w-[280px] rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-sm text-[#374151]">
                  <Search className="h-4 w-4 text-[#9CA3AF] mr-2 shrink-0" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search objectives or key results..."
                    className="flex-1 min-w-0 bg-transparent outline-none text-sm placeholder:text-[#9CA3AF]"
                  />
                </div>
                <button
                  type="button"
                  className="h-9 w-9 rounded-lg border border-[#E5E7EB] bg-white flex items-center justify-center text-[#6B7280] shrink-0"
                >
                  <Filter className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[900px]">
                <div className="grid grid-cols-[minmax(280px,2fr)_180px_140px_110px_110px_120px] gap-3 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF] border-b border-[#F1F5F9] bg-[#FAFAFB]">
                  <span>Objective & Key Results</span>
                  <span>Owner</span>
                  <span>Progress</span>
                  <span>Confidence</span>
                  <span>Due Date</span>
                  <span>Status</span>
                </div>

                <div>
                  {filtered.map((o) => {
                    const isOpen = !!expanded[o.id]
                    const isSelected = selectedId === o.id && panelOpen
                    return (
                      <div key={o.id} className="border-b border-[#F1F5F9] last:border-b-0">
                        <div
                          className={cn(
                            "grid grid-cols-[minmax(280px,2fr)_180px_140px_110px_110px_120px] gap-3 items-center px-3 py-2.5 cursor-pointer transition-colors",
                            isSelected ? "bg-[#F5F3FF]" : "hover:bg-[#F9FAFB]"
                          )}
                          onClick={() => selectObjective(o.id)}
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleExpand(o.id)
                              }}
                              className="h-5 w-5 rounded text-[#9CA3AF] flex items-center justify-center shrink-0 mt-0.5 hover:bg-[#F3F4F6]"
                            >
                              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                            <span className="h-6 w-6 rounded-md bg-[#F3E8FF] text-[#7C3AED] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {o.id}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[#111827] leading-snug">{o.title}</p>
                              <p className="text-[11px] text-[#9CA3AF] mt-0.5">{o.krs.length} Key Results</p>
                            </div>
                          </div>
                          <PmAvatar initials={o.owner.initials} name={o.owner.name} role={o.owner.role} src={o.owner.src} size="sm" />
                          <div className="pr-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-[#111827]">{o.progress}%</span>
                            </div>
                            <PmProgress value={o.progress} className="h-1.5" />
                          </div>
                          <ConfidenceBadge value={o.confidence} />
                          <span className="text-sm text-[#6B7280] whitespace-nowrap">{o.due}</span>
                          <div>
                            <PmStatusPill label={o.status} tone={statusTone(o.status)} />
                          </div>
                        </div>

                        {isOpen && (
                          <div className="bg-[#FCFCFD]">
                            {o.krs.map((kr, idx) => (
                              <div
                                key={kr.id}
                                className="grid grid-cols-[minmax(280px,2fr)_180px_140px_110px_110px_120px] gap-3 items-center px-4 py-2.5 border-t border-[#F3F4F6]"
                              >
                                <div className="flex items-start gap-2.5 min-w-0 pl-7">
                                  <div className="relative shrink-0 w-4 flex justify-center">
                                    <span className="absolute top-0 bottom-0 w-px bg-[#DDD6FE]" style={{ height: idx === o.krs.length - 1 ? "50%" : "100%", top: 0 }} />
                                    <span className="absolute top-2.5 left-1/2 w-2.5 h-px bg-[#DDD6FE]" />
                                    <span className="relative z-10 mt-1.5 h-2 w-2 rounded-full bg-[#A78BFA] ring-2 ring-white" />
                                  </div>
                                  <p className="text-[13px] text-[#374151] leading-snug">
                                    <span className="text-[#9CA3AF] font-medium">KR {kr.id}</span> {kr.title}
                                  </p>
                                </div>
                                <span className="text-xs text-[#6B7280] truncate pl-1">{kr.owner?.name ?? "—"}</span>
                                <div className="pr-2">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[11px] font-semibold text-[#4B5563]">{kr.progress}%</span>
                                  </div>
                                  <PmProgress value={kr.progress} className="h-1" color="#A78BFA" />
                                </div>
                                <ConfidenceBadge value={kr.confidence} />
                                <span className="text-xs text-[#9CA3AF] whitespace-nowrap">{kr.due}</span>
                                <div>
                                  <PmStatusPill label={kr.status} tone={statusTone(kr.status)} />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {filtered.length === 0 && (
                    <p className="py-12 text-center text-sm text-[#6B7280]">No objectives match your filters.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="px-3 py-2 border-t border-[#F1F5F9] flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-[#6B7280]">
                Showing 1 to {filtered.length} of {filtered.length} objectives
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="h-8 w-8 rounded-lg border border-[#E5E7EB] flex items-center justify-center text-[#9CA3AF] disabled:opacity-40"
                  disabled
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="h-8 w-8 rounded-lg bg-[#7C3AED] text-white text-sm font-semibold flex items-center justify-center">
                  1
                </span>
                <button
                  type="button"
                  className="h-8 w-8 rounded-lg border border-[#E5E7EB] flex items-center justify-center text-[#9CA3AF] disabled:opacity-40"
                  disabled
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="h-8 rounded-lg border border-[#E5E7EB] px-2 text-xs text-[#374151] bg-white"
                >
                  {[10, 20, 50].map((n) => (
                    <option key={n} value={n}>
                      {n} / page
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Right detail panel */}
          {showPanel && (
            <aside className="rounded-xl border border-[#E5E7EB] bg-white shadow-sm sticky top-24 max-h-[calc(100vh-7rem)] flex flex-col overflow-hidden">
              <div className="px-3 py-2 border-b border-[#F1F5F9] flex items-center justify-between gap-2 shrink-0">
                <span className="inline-flex items-center h-6 px-2 rounded-md bg-[#F3E8FF] text-[#7C3AED] text-[11px] font-semibold">
                  Objective
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-[#9CA3AF]">
                    {selectedIndex + 1} of {objectives.length}
                  </span>
                  <button
                    type="button"
                    onClick={goPrev}
                    disabled={selectedIndex <= 0}
                    className="h-7 w-7 rounded-md border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] disabled:opacity-40"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={selectedIndex >= objectives.length - 1}
                    className="h-7 w-7 rounded-md border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] disabled:opacity-40"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPanelOpen(false)}
                    className="h-7 w-7 rounded-md flex items-center justify-center text-[#9CA3AF] hover:bg-[#F3F4F6]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="px-4 pt-4 pb-4 border-b border-[#F1F5F9]">
                  <div className="flex items-start gap-2 justify-between">
                    <h2 className="text-lg font-bold text-[#111827] leading-snug">{selected.title}</h2>
                    <PmStatusPill label={selected.status} tone={statusTone(selected.status)} />
                  </div>
                  <div className="mt-3">
                    <PmAvatar
                      initials={selected.owner.initials}
                      name={selected.owner.name}
                      role={selected.owner.role}
                      src={selected.owner.src}
                    />
                  </div>
                  <div className="mt-4 rounded-xl bg-[#F9FAFB] border border-[#F1F5F9] p-3">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-[#6B7280]">Due {selected.due}</span>
                      <span className="font-bold text-[#111827]">{selected.progress}%</span>
                    </div>
                    <PmProgress value={selected.progress} className="h-2.5" />
                  </div>
                </div>

                <div className="px-3 py-3 border-b border-[#F1F5F9]">
                  <p className="text-xs font-semibold text-[#111827] mb-1.5">Description</p>
                  <p className="text-sm text-[#6B7280] leading-relaxed">{selected.description}</p>
                </div>

                <div className="px-3 py-3 border-b border-[#F1F5F9]">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-[#111827]">
                      Linked Initiatives <span className="text-[#9CA3AF]">({selected.linkedInitiatives.length})</span>
                    </p>
                    <button type="button" className="text-xs font-medium text-[#7C3AED] hover:underline">
                      View all
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {selected.linkedInitiatives.map((init) => (
                      <div key={init.name} className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-2.5 text-sm text-[#374151] min-w-0">
                          <span
                            className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${init.color}18`, color: init.color }}
                          >
                            <Rocket className="h-4 w-4" />
                          </span>
                          <span className="truncate font-medium">{init.name}</span>
                        </span>
                        <PmStatusPill label={init.status} tone={statusTone(init.status)} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="px-3 py-3 border-b border-[#F1F5F9]">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-[#111827]">
                      Related KPIs <span className="text-[#9CA3AF]">({selected.relatedKpis.length})</span>
                    </p>
                    <button type="button" className="text-xs font-medium text-[#7C3AED] hover:underline">
                      View all
                    </button>
                  </div>
                  <div className="space-y-3">
                    {selected.relatedKpis.map((kpi) => (
                      <div key={kpi.name} className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-2.5 text-sm text-[#374151] min-w-0">
                          <span
                            className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-[#7C3AED]"
                            style={{ backgroundColor: kpi.iconBg }}
                          >
                            <LineChart className="h-4 w-4" />
                          </span>
                          <span className="truncate">{kpi.name}</span>
                        </span>
                        <span className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-bold text-[#111827]">{kpi.value}</span>
                          <span className={cn("text-xs font-semibold", kpi.up ? "text-[#10B981]" : "text-[#EF4444]")}>
                            {kpi.up ? "▲" : "▼"} {kpi.trend}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="px-3 py-3">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-[#111827]">Recent Check-ins</p>
                    <button type="button" className="text-xs font-medium text-[#7C3AED] hover:underline">
                      View all
                    </button>
                  </div>
                  <div className="space-y-3">
                    {selected.checkins.map((c) => (
                      <div key={c.id} className="flex items-start gap-2.5">
                        <img
                          src={c.author.src}
                          alt={c.author.name}
                          className="h-8 w-8 rounded-full object-cover shrink-0 ring-2 ring-white shadow-sm"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-[#111827]">{c.author.name}</span>
                            {c.latest && (
                              <span className="inline-flex h-5 px-1.5 items-center rounded bg-[#F3E8FF] text-[#7C3AED] text-[10px] font-semibold">
                                Latest
                              </span>
                            )}
                            <span className="text-[11px] text-[#9CA3AF] ml-auto">{c.date}</span>
                          </div>
                          <p className="text-sm text-[#6B7280] mt-1 leading-relaxed">{c.note}</p>
                          <div className="mt-2 flex justify-end">
                            <span
                              className={cn(
                                "inline-flex h-6 px-2 items-center rounded-md text-[11px] font-semibold border",
                                c.confidence === "High" && "bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]",
                                c.confidence === "Medium" && "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]",
                                c.confidence === "Low" && "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]"
                              )}
                            >
                              {c.confidence}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-[#F1F5F9] shrink-0 bg-white">
                {checkinOpen ? (
                  <div className="space-y-2">
                    <textarea
                      value={checkinDraft}
                      onChange={(e) => setCheckinDraft(e.target.value)}
                      placeholder="What progress did you make? Any blockers?"
                      rows={3}
                      className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm placeholder:text-[#9CA3AF] resize-none outline-none focus:border-[#C4B5FD] focus:ring-2 focus:ring-[#EDE9FE]"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <PmButton variant="outline" className="flex-1" onClick={() => setCheckinOpen(false)}>
                        Cancel
                      </PmButton>
                      <PmButton variant="primary" className="flex-1" onClick={handleUpdateCheckin}>
                        Save Check-in
                      </PmButton>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCheckinOpen(true)}
                    className="w-full h-8 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 shadow-sm transition-colors"
                  >
                    <MessageSquare className="h-4 w-4" /> Update Check-in
                  </button>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}
