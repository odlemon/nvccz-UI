"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  FileSpreadsheet,
  FileText,
  History,
  MessageSquare,
  MoreVertical,
  RefreshCw,
  Send,
  Target,
  Users,
} from "lucide-react"
import { toast } from "sonner"
import { PmAvatar, PmButton, PmCard, PmFilterSelect, PmProgress, PmStatusPill } from "@/components/performance-mock/primitives"
import { PM_PHOTOS, pmPhoto } from "@/lib/performance-mock/photos"
import { cn } from "@/lib/utils"

type Owner = { name: string; role: string; src: string }
type Confidence = "High" | "Medium" | "Low"
type Status = "On Track" | "At Risk" | "Needs Attention" | "Completed"

type KeyResult = {
  id: string
  code: string
  title: string
  progress: number
  current: string
  of: string
  owner: Owner
  confidence: Confidence
  due: string
  lastUpdate: string
  status: Status
}

type Evidence = { name: string; type: "PDF" | "DOCX" | "XLSX" | "PPTX"; size: string }

type Milestone = {
  title: string
  date: string
  status: "Completed" | "In progress" | "Upcoming"
  description: string
  evidence: Evidence[]
}

type LinkedProject = {
  name: string
  owner: string
  ownerSrc: string
  tasksDone: number
  tasksTotal: number
  progress: number
  status: Status
}

type CheckIn = { author: Owner; date: string; note: string; tags: string[] }

type ActivityEntry = {
  text: string
  at: string
  kind: "checkin" | "update" | "milestone" | "evidence" | "comment"
}

type ObjectiveDetail = {
  id: string
  title: string
  owner: Owner
  progress: number
  confidence: Confidence
  due: string
  status: Status
  companyGoal: string
  departmentObjective: string
  krs: KeyResult[]
  milestones: Milestone[]
  linkedProjects: LinkedProject[]
  latestCheckin: CheckIn
  contributors: { src: string; name: string }[]
  contributorsExtra: number
  activity: ActivityEntry[]
}

const PURPLE = "#7C3AED"

const rumbidzai: Owner = { name: "Rumbidzai Chaza", role: "Chief Commercial Officer", src: PM_PHOTOS.rumbidzai }
const tawanda: Owner = { name: "Tawanda Moyo", role: "Head of Partnerships", src: PM_PHOTOS.tawanda }
const kudzai: Owner = { name: "Kudakwashe Biti", role: "Head of Customer Success", src: pmPhoto(32) }

const fileMeta: Record<Evidence["type"], { icon: typeof FileText; bg: string; color: string }> = {
  PDF: { icon: FileText, bg: "#FEE2E2", color: "#DC2626" },
  DOCX: { icon: FileText, bg: "#DBEAFE", color: "#2563EB" },
  XLSX: { icon: FileSpreadsheet, bg: "#D1FAE5", color: "#059669" },
  PPTX: { icon: FileText, bg: "#FFEDD5", color: "#EA580C" },
}

const objectives: Record<string, ObjectiveDetail> = {
  "obj-1": {
    id: "obj-1",
    title: "Drive sustainable revenue growth",
    owner: rumbidzai,
    progress: 78,
    confidence: "High",
    due: "30 Jun 2026",
    status: "On Track",
    companyGoal: "Sustainable growth",
    departmentObjective: "Expand Southern Africa",
    krs: [
      {
        id: "1.1",
        code: "KR 1.1",
        title: "Increase recurring revenue to $4.5M ARR",
        progress: 82,
        current: "$3.69M",
        of: "$4.50M",
        owner: rumbidzai,
        confidence: "High",
        due: "30 Jun 2026",
        lastUpdate: "10 Jul 2026",
        status: "On Track",
      },
      {
        id: "1.2",
        code: "KR 1.2",
        title: "Acquire 120 new enterprise customers",
        progress: 65,
        current: "78",
        of: "120",
        owner: tawanda,
        confidence: "Medium",
        due: "30 Jun 2026",
        lastUpdate: "08 Jul 2026",
        status: "On Track",
      },
      {
        id: "1.3",
        code: "KR 1.3",
        title: "Achieve Net Revenue Retention of 115%",
        progress: 88,
        current: "112%",
        of: "115%",
        owner: kudzai,
        confidence: "High",
        due: "30 Jun 2026",
        lastUpdate: "09 Jul 2026",
        status: "On Track",
      },
    ],
    milestones: [
      {
        title: "Market launch completed",
        date: "15 May 2026",
        status: "Completed",
        description: "Launched the new value proposition and go-to-market in Southern Africa.",
        evidence: [
          { name: "Go-to-market plan.pdf", type: "PDF", size: "482 KB" },
          { name: "Launch summary.docx", type: "DOCX", size: "214 KB" },
        ],
      },
      {
        title: "Partner programme completed",
        date: "31 May 2026",
        status: "Completed",
        description: "Onboarded and enabled strategic partners across key markets.",
        evidence: [
          { name: "Partner playbook.pdf", type: "PDF", size: "1.1 MB" },
          { name: "Partner list.xlsx", type: "XLSX", size: "86 KB" },
        ],
      },
      {
        title: "Enterprise campaign in progress",
        date: "30 Jun 2026",
        status: "In progress",
        description: "Executing multi-channel campaign targeting enterprise accounts.",
        evidence: [
          { name: "Campaign plan.docx", type: "DOCX", size: "318 KB" },
          { name: "Campaign deck.pptx", type: "PPTX", size: "6.2 MB" },
        ],
      },
    ],
    linkedProjects: [
      {
        name: "Enterprise Growth Campaign",
        owner: "Tawanda Moyo",
        ownerSrc: PM_PHOTOS.tawanda,
        tasksDone: 8,
        tasksTotal: 12,
        progress: 67,
        status: "On Track",
      },
      {
        name: "Pricing Optimisation",
        owner: "Tawanda Moyo",
        ownerSrc: PM_PHOTOS.tawanda,
        tasksDone: 5,
        tasksTotal: 9,
        progress: 56,
        status: "On Track",
      },
      {
        name: "Channel Partner Expansion",
        owner: "Rumbidzai Chaza",
        ownerSrc: PM_PHOTOS.rumbidzai,
        tasksDone: 6,
        tasksTotal: 10,
        progress: 60,
        status: "On Track",
      },
    ],
    latestCheckin: {
      author: rumbidzai,
      date: "10 Jul 2026",
      note: "Revenue momentum remains strong with double-digit growth in recurring revenue and solid enterprise pipeline. Partner programme is delivering results, and we are on track to hit our ARR target. Continuing to refine pricing strategy and invest in key account coverage to sustain retention.",
      tags: ["Revenue", "Customers", "Partnerships"],
    },
    contributors: [
      { src: PM_PHOTOS.rumbidzai, name: "Rumbidzai Chaza" },
      { src: PM_PHOTOS.tawanda, name: "Tawanda Moyo" },
      { src: pmPhoto(32), name: "Kudakwashe Biti" },
      { src: PM_PHOTOS.nyasha, name: "Nyasha Moyo" },
      { src: PM_PHOTOS.farai, name: "Farai Muchenje" },
    ],
    contributorsExtra: 4,
    activity: [
      { text: "Check-in added by Rumbidzai Chaza", at: "10 Jul 2026", kind: "checkin" },
      { text: "KR 1.2 updated by Tawanda Moyo", at: "08 Jul 2026", kind: "update" },
      { text: 'Milestone "Enterprise campaign" updated', at: "07 Jul 2026", kind: "milestone" },
      { text: 'Evidence added to "Partner programme"', at: "04 Jul 2026", kind: "evidence" },
      { text: "Comment by Kudakwashe Biti", at: "03 Jul 2026", kind: "comment" },
    ],
  },
}

function statusTone(status: Status): "success" | "warning" | "danger" | "purple" | "neutral" {
  if (status === "On Track" || status === "Completed") return "success"
  if (status === "Needs Attention") return "warning"
  if (status === "At Risk") return "danger"
  return "neutral"
}

function ActivityIcon({ kind }: { kind: ActivityEntry["kind"] }) {
  const cls = "h-3.5 w-3.5 text-[#7C3AED]"
  if (kind === "checkin" || kind === "comment") return <MessageSquare className={cls} />
  if (kind === "update") return <RefreshCw className={cls} />
  if (kind === "milestone") return <CheckCircle2 className={cls} />
  return <FileText className={cls} />
}

function ProgressRing({ value, size = 52 }: { value: number; size?: number }) {
  const r = 15
  const c = 2 * Math.PI * r
  const offset = c - (value / 100) * c
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
        <circle cx="18" cy="18" r={r} fill="none" stroke="#F3E8FF" strokeWidth="3.2" />
        <circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          stroke={PURPLE}
          strokeWidth="3.2"
          strokeDasharray={`${c}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[12px] font-bold text-[#0F172A]">{value}%</span>
      </div>
    </div>
  )
}

function AlignmentPath({
  companyGoal,
  departmentObjective,
  title,
}: {
  companyGoal: string
  departmentObjective: string
  title: string
}) {
  const steps = [
    { icon: Target, label: "Company strategy", value: companyGoal },
    { icon: Building2, label: "Department objective", value: departmentObjective },
    { icon: Target, label: "This objective", value: title },
  ]
  return (
    <div className="rounded-xl bg-[#F5F3FF] px-3.5 py-2.5 inline-flex flex-wrap items-center gap-2 w-fit max-w-[min(100%,52rem)]">
      {steps.map((s, i) => (
        <div key={s.label} className="flex items-center gap-2 min-w-0">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-[#A78BFA] shrink-0" />}
          <div className="flex items-center gap-2 min-w-0">
            <span className="h-7 w-7 rounded-full bg-white border border-[#E9E5FF] text-[#7C3AED] flex items-center justify-center shrink-0">
              <s.icon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-[#6B7280] leading-none">{s.label}</p>
              <p className={cn("text-[12px] mt-0.5 truncate leading-tight", i === 2 ? "font-bold text-[#0F172A]" : "font-semibold text-[#1E293B]")}>
                {s.value}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function ObjectiveDetailMockScreen({ objectiveId = "obj-1" }: { objectiveId?: string }) {
  const router = useRouter()
  const base = objectives[objectiveId] || objectives["obj-1"]

  const [period, setPeriod] = useState("Q2 2026 (Apr – Jun)")
  const [team, setTeam] = useState("Commercial")
  const [checkinOpen, setCheckinOpen] = useState(false)
  const [checkinDraft, setCheckinDraft] = useState("")
  const [checkins, setCheckins] = useState<CheckIn[]>([base.latestCheckin])
  const [activity, setActivity] = useState<ActivityEntry[]>(base.activity)

  const contributorTotal = base.contributors.length + base.contributorsExtra

  const submitCheckin = () => {
    const note = checkinDraft.trim() || "Checked in on progress against key results."
    const entry: CheckIn = {
      author: { name: "Adm. User", role: "Super Administrator", src: PM_PHOTOS.admin },
      date: "Just now",
      note,
      tags: [],
    }
    setCheckins((prev) => [entry, ...prev])
    setActivity((prev) => [{ text: "Check-in added by Adm. User", at: "Just now", kind: "checkin" }, ...prev])
    setCheckinDraft("")
    setCheckinOpen(false)
    toast.success("Check-in updated", { description: base.title })
  }

  const latest = checkins[0]

  return (
    <div className="min-h-full bg-[#F8FAFC]">
      <div className="p-4 lg:p-5 space-y-4">
        {/* Top bar: breadcrumb left · filters + actions right */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav className="text-[12px] font-medium">
            <button
              type="button"
              onClick={() => router.push("/performance/goals")}
              className="text-[#7C3AED] hover:underline"
            >
              Goals
            </button>
            <span className="mx-1.5 text-[#C4B5FD]">/</span>
            <span className="text-[#7C3AED]">Objective detail</span>
          </nav>
          <div className="flex flex-wrap items-center gap-2">
            <PmFilterSelect
              icon={<Calendar className="h-3.5 w-3.5 text-[#6B7280]" />}
              value={period}
              options={["Q2 2026 (Apr – Jun)", "Q1 2026 (Jan – Mar)"]}
              onChange={setPeriod}
            />
            <PmFilterSelect
              icon={<Users className="h-3.5 w-3.5 text-[#6B7280]" />}
              value={team}
              options={["Commercial", "All Teams"]}
              onChange={setTeam}
            />
            <PmButton onClick={() => setCheckinOpen((o) => !o)}>
              <MessageSquare className="h-3.5 w-3.5" /> Update check-in
            </PmButton>
            <button
              type="button"
              onClick={() => toast("Objective options", { description: "Edit, duplicate and archive actions available here." })}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#E5E7EB] bg-white text-xs font-semibold text-[#374151] hover:bg-[#F9FAFB]"
            >
              <MoreVertical className="h-3.5 w-3.5" />
              More
              <ChevronDown className="h-3.5 w-3.5 text-[#9CA3AF]" />
            </button>
          </div>
        </div>

        {/* Two-column from the title down — sidebar tops out with the heading */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
          {/* LEFT */}
          <div className="xl:col-span-8 space-y-4 min-w-0">
            <h1 className="text-[22px] font-bold text-[#0F172A] tracking-tight leading-tight">{base.title}</h1>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <PmAvatar
                initials={base.owner.name.slice(0, 2).toUpperCase()}
                name={base.owner.name}
                role={base.owner.role}
                src={base.owner.src}
                size="md"
              />
              <span className="hidden sm:block h-8 w-px bg-[#E5E7EB]" />
              <PmStatusPill label={base.status} tone={statusTone(base.status)} />
              <span className="hidden sm:block h-8 w-px bg-[#E5E7EB]" />
              <p className="text-sm font-bold text-[#0F172A]">
                {base.progress}% <span className="font-medium text-[#64748B]">Progress</span>
              </p>
              <span className="hidden sm:block h-8 w-px bg-[#E5E7EB]" />
              <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F172A]">
                <Calendar className="h-3.5 w-3.5 text-[#7C3AED]" />
                {base.due} <span className="font-medium text-[#64748B]">Due date</span>
              </p>
              <span className="hidden sm:block h-8 w-px bg-[#E5E7EB]" />
              <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F172A]">
                <span className="h-5 w-5 rounded-full bg-[#10B981] text-white flex items-center justify-center shrink-0">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {base.confidence} <span className="font-medium text-[#64748B]">Confidence</span>
              </p>
            </div>

            {/* Content-width only — stops short of the left column’s right edge */}
            <AlignmentPath
              companyGoal={base.companyGoal}
              departmentObjective={base.departmentObjective}
              title={base.title}
            />

            {/* Key results */}
            <PmCard className="p-4">
              <h3 className="text-[15px] font-bold text-[#0F172A] mb-3">Key results</h3>
              <div className="space-y-3">
                {base.krs.map((kr, i) => (
                  <div
                    key={kr.id}
                    className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-3 flex flex-wrap items-center gap-x-4 gap-y-3 hover:shadow-sm transition-shadow"
                  >
                    <span className="h-7 w-7 rounded-full bg-[#F3E8FF] text-[#7C3AED] text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>

                    <div className="min-w-0 flex-1 basis-[200px]">
                      <p className="text-[13px] font-bold text-[#0F172A] leading-snug">{kr.title}</p>
                      <p className="text-[11px] text-[#94A3B8] mt-0.5">{kr.code}</p>
                    </div>

                    <div className="w-[100px] shrink-0">
                      <p className="text-sm font-bold text-[#0F172A] mb-1">{kr.progress}%</p>
                      <PmProgress value={kr.progress} color={PURPLE} />
                    </div>

                    <div className="min-w-[88px] shrink-0">
                      <p className="text-[10px] text-[#94A3B8] font-medium">Current</p>
                      <p className="text-[12px] font-bold text-[#0F172A]">
                        {kr.current} <span className="font-medium text-[#94A3B8]">of {kr.of}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 min-w-[132px] shrink-0">
                      <img
                        src={kr.owner.src}
                        alt={kr.owner.name}
                        className="h-7 w-7 rounded-full object-cover ring-2 ring-white shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <p className="text-[10px] text-[#94A3B8]">Owner</p>
                        <p className="text-[11px] font-semibold text-[#0F172A] truncate max-w-[100px]">{kr.owner.name}</p>
                      </div>
                    </div>

                    <div className="min-w-[72px] shrink-0">
                      <p className="text-[10px] text-[#94A3B8]">Confidence</p>
                      <p
                        className={cn(
                          "text-[12px] font-bold inline-flex items-center gap-1",
                          kr.confidence === "High" ? "text-[#10B981]" : kr.confidence === "Medium" ? "text-[#F59E0B]" : "text-[#EF4444]"
                        )}
                      >
                        {kr.confidence === "High" && (
                          <span className="h-3.5 w-3.5 rounded-full bg-[#10B981] text-white inline-flex items-center justify-center">
                            <Check className="h-2.5 w-2.5" strokeWidth={3} />
                          </span>
                        )}
                        {kr.confidence}
                      </p>
                    </div>

                    <div className="min-w-[88px] shrink-0">
                      <p className="text-[10px] text-[#94A3B8]">Due date</p>
                      <p className="text-[12px] font-semibold text-[#0F172A]">{kr.due}</p>
                    </div>

                    <div className="min-w-[88px] shrink-0">
                      <p className="text-[10px] text-[#94A3B8]">Last update</p>
                      <p className="text-[12px] font-semibold text-[#0F172A]">{kr.lastUpdate}</p>
                    </div>

                    <div className="flex items-center gap-1.5 ml-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => toast("Opening key result", { description: kr.title })}
                        className="h-8 px-3 rounded-lg border border-[#C4B5FD] text-[#7C3AED] text-xs font-bold hover:bg-[#F5F3FF]"
                      >
                        Open
                      </button>
                      <button
                        type="button"
                        onClick={() => toast("Key result options", { description: kr.code })}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:bg-[#F3F4F6]"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </PmCard>

            {/* Milestones & evidence */}
            <PmCard className="p-4">
              <h3 className="text-[15px] font-bold text-[#0F172A] mb-1">Milestones &amp; evidence</h3>
              <div className="relative mt-1">
                {/* Solid purple rail — center of first icon → center of last icon only */}
                <div
                  className="pointer-events-none absolute left-[15px] top-8 bottom-8 w-px bg-[#C4B5FD]"
                  aria-hidden
                />
                {base.milestones.map((m) => (
                  <div
                    key={m.title}
                    className="relative flex flex-wrap items-center gap-x-4 gap-y-3 py-4 border-b border-[#F1F5F9] last:border-b-0"
                  >
                    {/* Timeline node */}
                    <div className="relative z-10 w-8 shrink-0 flex justify-center self-center">
                      <span
                        className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center border-2 bg-white",
                          m.status === "Completed"
                            ? "border-[#86EFAC] text-[#16A34A] bg-[#F0FDF4]"
                            : m.status === "In progress"
                              ? "border-[#C4B5FD] text-[#7C3AED] bg-[#F5F3FF]"
                              : "border-[#E5E7EB] text-[#9CA3AF] bg-[#F9FAFB]"
                        )}
                      >
                        {m.status === "Completed" ? (
                          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                        ) : (
                          <Clock className="h-3.5 w-3.5" />
                        )}
                      </span>
                    </div>

                    {/* Title + description */}
                    <div className="min-w-0 flex-1 basis-[180px]">
                      <p className="text-[13px] font-bold text-[#0F172A] leading-snug">{m.title}</p>
                      <p className="text-[12px] text-[#64748B] mt-1 leading-snug">{m.description}</p>
                    </div>

                    {/* Date + status text (not pills) */}
                    <div className="w-[108px] shrink-0">
                      <p className="text-[12px] text-[#64748B]">{m.date}</p>
                      <p
                        className={cn(
                          "text-[12px] font-semibold mt-1",
                          m.status === "In progress" ? "text-[#7C3AED]" : "text-[#64748B]"
                        )}
                      >
                        {m.status === "Completed" ? "Completed" : m.status === "In progress" ? "In progress" : "Upcoming"}
                      </p>
                    </div>

                    {/* Evidence file cards */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {m.evidence.map((ev) => {
                        const meta = fileMeta[ev.type]
                        const Icon = meta.icon
                        return (
                          <button
                            key={ev.name}
                            type="button"
                            onClick={() => toast("Opening file", { description: ev.name })}
                            className="inline-flex items-center gap-2 rounded-lg bg-[#F3F4F6] px-2.5 py-2 text-left hover:bg-[#EDE9FE] transition-colors"
                          >
                            <span
                              className="h-7 w-7 rounded-md flex items-center justify-center shrink-0"
                              style={{ backgroundColor: meta.bg, color: meta.color }}
                            >
                              <Icon className="h-3.5 w-3.5" />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-[11px] font-semibold text-[#0F172A] truncate max-w-[130px]">
                                {ev.name}
                              </span>
                              <span className="block text-[10px] text-[#94A3B8]">{ev.size}</span>
                            </span>
                          </button>
                        )
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => toast("Milestone options", { description: m.title })}
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:bg-[#F3F4F6] shrink-0 ml-auto"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </PmCard>

            {/* Linked projects */}
            <PmCard className="overflow-hidden">
              <div className="px-4 pt-4 pb-2">
                <h3 className="text-[15px] font-bold text-[#0F172A]">Linked projects &amp; tasks</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[560px]">
                  <thead>
                    <tr className="text-[11px] text-[#94A3B8] border-y border-[#F1F5F9]">
                      <th className="py-2.5 px-4 font-semibold">Project</th>
                      <th className="py-2.5 px-3 font-semibold">Owner</th>
                      <th className="py-2.5 px-3 font-semibold">Tasks</th>
                      <th className="py-2.5 px-3 font-semibold">Progress</th>
                      <th className="py-2.5 px-3 font-semibold">Status</th>
                      <th className="py-2.5 px-3 font-semibold w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {base.linkedProjects.map((p) => (
                      <tr
                        key={p.name}
                        className="border-b border-[#F8FAFC] last:border-0 hover:bg-[#F9FAFB] cursor-pointer transition-colors"
                        onClick={() => router.push("/performance/tasks?tab=projects")}
                      >
                        <td className="py-3 px-4 font-bold text-[#0F172A] whitespace-nowrap text-[13px]">{p.name}</td>
                        <td className="py-3 px-3">
                          <PmAvatar initials={p.owner.slice(0, 2).toUpperCase()} name={p.owner} src={p.ownerSrc} size="sm" />
                        </td>
                        <td className="py-3 px-3 text-xs text-[#64748B] whitespace-nowrap font-medium">
                          {p.tasksDone} of {p.tasksTotal}
                        </td>
                        <td className="py-3 px-3 min-w-[120px]">
                          <div className="flex items-center gap-2">
                            <PmProgress value={p.progress} color={PURPLE} className="flex-1" />
                            <span className="text-[11px] font-bold text-[#0F172A] w-8 text-right">{p.progress}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <PmStatusPill label={p.status} tone={statusTone(p.status)} />
                        </td>
                        <td className="py-3 px-3 text-[#94A3B8]">
                          <ChevronRight className="h-4 w-4" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </PmCard>
          </div>

          {/* RIGHT — tops out with the page title */}
          <div className="xl:col-span-4 space-y-4">
            {/* Latest check-in */}
            <PmCard className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[15px] font-bold text-[#0F172A]">Latest check-in</h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#F3E8FF] text-[#6D28D9]">
                  Latest
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <img
                  src={latest.author.src}
                  alt={latest.author.name}
                  className="h-9 w-9 rounded-full object-cover shrink-0 ring-2 ring-white shadow-sm"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#0F172A] truncate">{latest.author.name}</p>
                      <p className="text-[11px] text-[#94A3B8]">{latest.author.role}</p>
                    </div>
                    <span className="text-[11px] text-[#94A3B8] shrink-0">{latest.date}</span>
                  </div>
                  <p className="text-xs text-[#475569] mt-2.5 leading-relaxed">{latest.note}</p>
                  {latest.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {latest.tags.map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#F3E8FF] text-[#6D28D9]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {checkinOpen ? (
                <div className="mt-3 pt-3 border-t border-[#F1F5F9] space-y-2">
                  <textarea
                    value={checkinDraft}
                    onChange={(e) => setCheckinDraft(e.target.value)}
                    placeholder="What progress did you make? Any blockers?"
                    rows={3}
                    className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-xs placeholder:text-[#9CA3AF] resize-none outline-none focus:border-[#C4B5FD] focus:ring-2 focus:ring-[#EDE9FE]"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <PmButton variant="outline" className="flex-1" onClick={() => setCheckinOpen(false)}>
                      Cancel
                    </PmButton>
                    <PmButton variant="primary" className="flex-1" onClick={submitCheckin}>
                      <Send className="h-3.5 w-3.5" /> Save
                    </PmButton>
                  </div>
                </div>
              ) : null}
            </PmCard>

            {/* Health signals */}
            <PmCard className="p-4">
              <h3 className="text-[15px] font-bold text-[#0F172A] mb-3">Health signals</h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-[#E5E7EB] p-2.5 flex flex-col items-center text-center gap-1.5">
                  <p className="text-[10px] font-medium text-[#94A3B8]">Progress</p>
                  <ProgressRing value={base.progress} size={48} />
                  <p className="text-[11px] font-semibold text-[#10B981] inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                    On Track
                  </p>
                </div>
                <div className="rounded-xl border border-[#E5E7EB] p-2.5 flex flex-col items-center text-center gap-1.5">
                  <p className="text-[10px] font-medium text-[#94A3B8]">Confidence</p>
                  <span className="h-12 w-12 rounded-full bg-[#10B981] text-white flex items-center justify-center shadow-sm">
                    <Check className="h-6 w-6" strokeWidth={2.5} />
                  </span>
                  <p className="text-[11px] font-semibold text-[#10B981] inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                    High
                  </p>
                </div>
                <div className="rounded-xl border border-[#E5E7EB] p-2.5 flex flex-col items-center text-center gap-1.5">
                  <p className="text-[10px] font-medium text-[#94A3B8]">Schedule</p>
                  <span className="h-12 w-12 rounded-full bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center">
                    <Calendar className="h-5 w-5" />
                  </span>
                  <p className="text-[11px] font-semibold text-[#10B981] inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                    On Track
                  </p>
                </div>
              </div>
            </PmCard>

            {/* Contributors */}
            <PmCard className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-[15px] font-bold text-[#0F172A] mb-2.5">Contributors</h3>
                  <div className="flex items-center -space-x-2">
                    {base.contributors.map((c) => (
                      <img
                        key={c.name}
                        src={c.src}
                        alt={c.name}
                        title={c.name}
                        className="h-8 w-8 rounded-full object-cover ring-2 ring-white shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                    ))}
                    <div className="h-8 w-8 rounded-full bg-[#F3E8FF] text-[10px] font-bold text-[#6D28D9] flex items-center justify-center ring-2 ring-white">
                      +{base.contributorsExtra}
                    </div>
                  </div>
                </div>
                <span className="text-[11px] text-[#94A3B8] font-medium whitespace-nowrap">{contributorTotal} contributors</span>
              </div>
            </PmCard>

            {/* Activity */}
            <PmCard className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[15px] font-bold text-[#0F172A]">Activity</h3>
                <button
                  type="button"
                  onClick={() => toast("Activity", { description: "Opening full activity feed." })}
                  className="text-[11px] font-semibold text-[#7C3AED] hover:underline"
                >
                  View all
                </button>
              </div>
              <div className="space-y-3">
                {activity.map((a, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="h-7 w-7 rounded-full bg-[#F5F3FF] flex items-center justify-center shrink-0">
                      <ActivityIcon kind={a.kind} />
                    </span>
                    <p className="text-[12px] text-[#334155] leading-snug flex-1 pt-1">{a.text}</p>
                    <span className="text-[10px] text-[#94A3B8] shrink-0 pt-1.5 whitespace-nowrap">{a.at}</span>
                  </div>
                ))}
              </div>
            </PmCard>

            <button
              type="button"
              onClick={() => toast("Goal history", { description: "Opening full change history for this objective." })}
              className="w-full h-10 inline-flex items-center justify-center gap-2 rounded-lg border border-[#C4B5FD] bg-white text-[#7C3AED] text-xs font-bold hover:bg-[#F5F3FF] transition-colors"
            >
              <History className="h-3.5 w-3.5" /> View goal history
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
