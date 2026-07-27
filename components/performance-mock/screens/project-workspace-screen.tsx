"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Filter,
  Flag,
  GanttChart,
  Kanban,
  LayoutGrid,
  List,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
  Share2,
  Shield,
  Target,
  Users,
} from "lucide-react"
import { toast } from "sonner"
import {
  PmAvatar,
  PmButton,
  PmCard,
  PmFilterSelect,
  PmProgress,
  PmStatusPill,
} from "@/components/performance-mock/primitives"
import { hubProjects, hubTasks, type HubTask, type TaskStatus } from "@/lib/performance-mock/fixtures/tasks-hub"
import { PM_PHOTOS, pmPhoto } from "@/lib/performance-mock/photos"
import { cn } from "@/lib/utils"

type HubTab = "overview" | "board" | "timeline" | "workload" | "files"

const BOARD_COLUMNS: { id: TaskStatus; label: string; dot: string }[] = [
  { id: "To Do", label: "Backlog", dot: "#64748B" },
  { id: "In Progress", label: "In Progress", dot: "#3B82F6" },
  { id: "In Review", label: "In Review", dot: "#F59E0B" },
  { id: "Complete", label: "Done", dot: "#10B981" },
]

const priorityTone: Record<string, "danger" | "warning" | "success"> = {
  High: "danger",
  Medium: "warning",
  Low: "success",
}

const categoryTone: Record<string, string> = {
  "Market Research": "bg-[#DBEAFE] text-[#1E40AF]",
  "Legal & Compliance": "bg-[#FEE2E2] text-[#991B1B]",
  Partnership: "bg-[#D1FAE5] text-[#065F46]",
  Partnerships: "bg-[#D1FAE5] text-[#065F46]",
  Marketing: "bg-[#FEF3C7] text-[#92400E]",
  Pricing: "bg-[#F3E8FF] text-[#6D28D9]",
  "Customer Insight": "bg-[#E0E7FF] text-[#3730A3]",
  Strategy: "bg-[#FCE7F3] text-[#9D174D]",
  Enablement: "bg-[#CCFBF1] text-[#115E59]",
  Governance: "bg-[#F3F4F6] text-[#374151]",
}

type ProjectDetail = {
  team: string
  health: { label: string; status: "On track" | "At risk" | "Off track" }[]
  workload: { name: string; pct: number; src: string }[]
  milestone: { title: string; date: string; note: string }
  activity: { who: string; text: string; when: string }[]
  time: { logged: number; budget: number }
  files: { name: string; type: string; size: string; by: string; date: string }[]
}

const projectDetails: Record<string, ProjectDetail> = {
  "proj-sa": {
    team: "Commercial Team",
    health: [
      { label: "Scope", status: "On track" },
      { label: "Schedule", status: "At risk" },
      { label: "Budget", status: "On track" },
    ],
    workload: [
      { name: "Rumbidzai Chaza", pct: 85, src: PM_PHOTOS.rumbidzai },
      { name: "Tawanda Moyo", pct: 72, src: PM_PHOTOS.tawanda },
      { name: "Nyasha Dube", pct: 60, src: PM_PHOTOS.nyasha },
      { name: "Tendai Nyathi", pct: 55, src: PM_PHOTOS.tendai },
      { name: "Kudzai Biti", pct: 45, src: pmPhoto("kudzai-biti") },
    ],
    milestone: { title: "Campaign launch", date: "18 Jul 2026", note: "In 5 days" },
    activity: [
      { who: "Rumbidzai Chaza", text: 'updated task "Enterprise campaign launch"', when: "10 Jul, 10:32am" },
      { who: "Nyasha Dube", text: 'added a comment on "Partner onboarding playbook"', when: "09 Jul, 4:05pm" },
      { who: "Tendai Nyathi", text: 'uploaded a file to "Pricing localisation model"', when: "08 Jul, 9:12am" },
    ],
    time: { logged: 246, budget: 320 },
    files: [
      { name: "Campaign brief.pdf", type: "PDF", size: "1.2 MB", by: "Rumbidzai Chaza", date: "10 Jul 2026" },
      { name: "Creative pack.fig", type: "FIG", size: "6.8 MB", by: "Tendai Nyathi", date: "08 Jul 2026" },
      { name: "Account list.xlsx", type: "XLSX", size: "42 KB", by: "Nyasha Dube", date: "05 Jul 2026" },
      { name: "Regulatory checklist.docx", type: "DOCX", size: "220 KB", by: "Nyasha Dube", date: "02 Jul 2026" },
    ],
  },
  "proj-review": {
    team: "People & Culture",
    health: [
      { label: "Scope", status: "At risk" },
      { label: "Schedule", status: "At risk" },
      { label: "Budget", status: "On track" },
    ],
    workload: [
      { name: "Rumbidzai Chaza", pct: 78, src: PM_PHOTOS.rumbidzai },
      { name: "Memory Sibanda", pct: 91, src: PM_PHOTOS.chipo },
      { name: "Tariro Gwenzi", pct: 64, src: PM_PHOTOS.tariro },
    ],
    milestone: { title: "Calibration pack", date: "22 Jul 2026", note: "In 9 days" },
    activity: [
      { who: "Memory Sibanda", text: 'moved "Launch performance review cycle" to In Progress', when: "07 Jul, 2:14pm" },
      { who: "Rumbidzai Chaza", text: "requested calibration data from HR", when: "05 Jul, 11:20am" },
    ],
    time: { logged: 118, budget: 200 },
    files: [
      { name: "Calibration guide.pdf", type: "PDF", size: "980 KB", by: "Memory Sibanda", date: "06 Jul 2026" },
      { name: "Review cycle timeline.xlsx", type: "XLSX", size: "58 KB", by: "Rumbidzai Chaza", date: "03 Jul 2026" },
    ],
  },
  "proj-iso": {
    team: "Risk & Controls",
    health: [
      { label: "Scope", status: "On track" },
      { label: "Schedule", status: "On track" },
      { label: "Budget", status: "On track" },
    ],
    workload: [
      { name: "Farai Muchengeti", pct: 66, src: PM_PHOTOS.farai },
      { name: "Blessing Ncube", pct: 52, src: PM_PHOTOS.blessing },
    ],
    milestone: { title: "Evidence pack", date: "28 Jul 2026", note: "In 15 days" },
    activity: [
      { who: "Farai Muchengeti", text: 'uploaded evidence for "Complete ISO 27001 evidence pack"', when: "04 Jul, 3:40pm" },
    ],
    time: { logged: 64, budget: 180 },
    files: [{ name: "ISO evidence pack.pdf", type: "PDF", size: "3.1 MB", by: "Farai Muchengeti", date: "04 Jul 2026" }],
  },
}

function RingStat({ value, size = 40 }: { value: number; size?: number }) {
  const r = 15
  const c = 2 * Math.PI * r
  const offset = c - (Math.min(100, Math.max(0, value)) / 100) * c
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
        <circle cx="18" cy="18" r={r} fill="none" stroke="#F3E8FF" strokeWidth="3.2" />
        <circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          stroke="#7C3AED"
          strokeWidth="3.2"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

function AlignmentPath({
  companyGoal,
  departmentObjective,
  individualGoal,
}: {
  companyGoal: string
  departmentObjective: string
  individualGoal: string
}) {
  const steps = [
    { icon: Target, label: "Company goal", value: companyGoal },
    { icon: Shield, label: "Department objective", value: departmentObjective },
    { icon: Target, label: "Individual goal", value: individualGoal },
  ]
  return (
    <div className="rounded-xl bg-[#F5F3FF] px-3.5 py-2.5 inline-flex flex-wrap items-center gap-2 w-fit max-w-[min(100%,52rem)]">
      {steps.map((s, i) => (
        <div key={s.label} className="flex items-center gap-2 min-w-0">
          {i > 0 && <span className="text-[#A78BFA] text-sm shrink-0">→</span>}
          <div className="flex items-center gap-2 min-w-0">
            <span className="h-7 w-7 rounded-full bg-white border border-[#E9E5FF] text-[#7C3AED] flex items-center justify-center shrink-0">
              <s.icon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-[#6B7280] leading-none">{s.label}</p>
              <p className="text-[12px] mt-0.5 font-semibold text-[#0F172A] truncate leading-tight">{s.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ProjectTaskCard({ task, router }: { task: HubTask; router: ReturnType<typeof useRouter> }) {
  return (
    <button
      type="button"
      onClick={() => router.push(`/performance/tasks/${task.id}`)}
      className="block w-full text-left rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-sm hover:shadow-md hover:border-[#DDD6FE] transition-all space-y-2"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-bold text-[#0F172A] leading-snug">{task.title}</p>
        {task.status === "Complete" && (
          <span className="h-5 w-5 rounded-full border border-[#10B981] text-[#10B981] flex items-center justify-center shrink-0">
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
        )}
      </div>

      {task.category && (
        <span
          className={cn(
            "inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold",
            categoryTone[task.category] || "bg-[#F3E8FF] text-[#6D28D9]"
          )}
        >
          {task.category}
        </span>
      )}

      {task.status === "In Progress" && typeof task.progress === "number" && (
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 rounded-full bg-[#F1F5F9] overflow-hidden">
            <div className="h-full rounded-full bg-[#7C3AED]" style={{ width: `${task.progress}%` }} />
          </div>
          <span className="text-[10px] font-bold text-[#0F172A]">{task.progress}%</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-0.5">
        <img
          src={task.ownerSrc}
          alt={task.owner}
          title={task.owner}
          className="h-6 w-6 rounded-full object-cover ring-2 ring-white"
          referrerPolicy="no-referrer"
        />
        <div className="flex items-center gap-2 text-[10px] font-semibold text-[#94A3B8]">
          <span className="inline-flex items-center gap-0.5">
            <Calendar className="h-3 w-3" />
            {task.due.replace(" 2026", "")}
          </span>
          <span className="inline-flex items-center gap-0.5">
            <MessageSquare className="h-3 w-3" /> {task.comments}
          </span>
          <span className="inline-flex items-center gap-0.5">
            <Paperclip className="h-3 w-3" /> {task.files}
          </span>
        </div>
      </div>
    </button>
  )
}

export function ProjectWorkspaceMockScreen({ projectId }: { projectId: string }) {
  const router = useRouter()
  const project = hubProjects.find((p) => p.id === projectId) || hubProjects[0]
  const detail = projectDetails[project.id] || projectDetails["proj-sa"]

  const [tab, setTab] = useState<HubTab>("board")
  const [search, setSearch] = useState("")
  const [assignee, setAssignee] = useState("All assignees")
  const [statusFilter, setStatusFilter] = useState("All statuses")
  const [priorityFilter, setPriorityFilter] = useState("All priorities")
  const [krFilter, setKrFilter] = useState("All KRs")
  const [groupBy, setGroupBy] = useState<"Status" | "Assignee">("Status")
  const [view, setView] = useState<"board" | "list">("board")

  const projectTasks = useMemo(() => hubTasks.filter((t) => t.projectId === project.id), [project.id])

  const assigneeOptions = useMemo(() => ["All assignees", ...Array.from(new Set(projectTasks.map((t) => t.owner)))], [projectTasks])
  const krOptions = useMemo(() => ["All KRs", ...Array.from(new Set(projectTasks.map((t) => t.kr).filter(Boolean) as string[]))], [projectTasks])

  const filtered = useMemo(() => {
    return projectTasks.filter((t) => {
      if (search.trim() && !t.title.toLowerCase().includes(search.toLowerCase())) return false
      if (assignee !== "All assignees" && t.owner !== assignee) return false
      if (statusFilter !== "All statuses" && t.status !== statusFilter) return false
      if (priorityFilter !== "All priorities" && t.priority !== priorityFilter) return false
      if (krFilter !== "All KRs" && t.kr !== krFilter) return false
      return true
    })
  }, [projectTasks, search, assignee, statusFilter, priorityFilter, krFilter])

  const filtersActive = search || assignee !== "All assignees" || statusFilter !== "All statuses" || priorityFilter !== "All priorities" || krFilter !== "All KRs"

  const clearFilters = () => {
    setSearch("")
    setAssignee("All assignees")
    setStatusFilter("All statuses")
    setPriorityFilter("All priorities")
    setKrFilter("All KRs")
  }

  const groupedColumns = useMemo(() => {
    if (groupBy === "Status") {
      return BOARD_COLUMNS.map((c) => ({
        id: c.id,
        label: c.label,
        dot: c.dot,
        items: filtered.filter((t) => t.status === c.id),
      }))
    }
    const owners = Array.from(new Set(projectTasks.map((t) => t.owner)))
    return owners.map((o) => ({
      id: o,
      label: o,
      dot: "#7C3AED",
      items: filtered.filter((t) => t.owner === o),
    }))
  }, [groupBy, filtered, projectTasks])

  const doneCount = projectTasks.filter((t) => t.status === "Complete").length
  const overdueCount = projectTasks.filter((t) => t.status !== "Complete" && new Date(t.due) < new Date("2026-07-15")).length
  const taskParts = project.tasks.replace(/\s/g, "").split("/")
  const tasksDone = taskParts[0] || String(doneCount)
  const tasksTotal = taskParts[1] || String(projectTasks.length)

  const teamAvatarSrcs = detail.workload.slice(0, 4).map((w) => w.src)

  const tabMeta = [
    { id: "overview" as const, label: "Overview", icon: LayoutGrid },
    { id: "board" as const, label: "Board", icon: Kanban },
    { id: "timeline" as const, label: "Timeline", icon: GanttChart },
    { id: "workload" as const, label: "Workload", icon: Users },
    { id: "files" as const, label: "Files", icon: FileText },
  ]

  const RightRail = (
    <div className="xl:col-span-3 space-y-3">
      <PmCard className="p-4">
        <h3 className="text-[13px] font-bold text-[#0F172A] mb-3">Project health</h3>
        <div className="space-y-2.5">
          {detail.health.map((h) => (
            <div key={h.label} className="flex items-center justify-between text-xs">
              <span className="font-medium text-[#475569]">{h.label}</span>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 text-[11px] font-semibold",
                  h.status === "On track" ? "text-[#10B981]" : h.status === "At risk" ? "text-[#F59E0B]" : "text-[#EF4444]"
                )}
              >
                {h.status === "On track" ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5" />
                )}
                {h.status === "On track" ? "On track" : h.status === "At risk" ? "At risk" : "Off track"}
              </span>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => toast("Project health", { description: "Opening detailed health breakdown." })}
          className="mt-3 text-[11px] font-semibold text-[#7C3AED] hover:underline"
        >
          View details
        </button>
      </PmCard>

      <PmCard className="p-4">
        <h3 className="text-[13px] font-bold text-[#0F172A] mb-3">Team workload</h3>
        <div className="space-y-2.5">
          {detail.workload.map((w) => (
            <div key={w.name} className="flex items-center gap-2">
              <img src={w.src} alt="" className="h-6 w-6 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-[#374151] truncate">{w.name.split(" ")[0]}</span>
                  <span className="text-[11px] font-bold text-[#0F172A]">{w.pct}%</span>
                </div>
                <PmProgress value={w.pct} color="#7C3AED" />
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setTab("workload")} className="mt-3 text-[11px] font-semibold text-[#7C3AED] hover:underline">
          View workload
        </button>
      </PmCard>

      <PmCard className="p-4">
        <h3 className="text-[13px] font-bold text-[#0F172A] mb-2 inline-flex items-center gap-1.5">
          <Flag className="h-3.5 w-3.5 text-[#7C3AED]" /> Next milestone
        </h3>
        <p className="text-xs font-bold text-[#0F172A]">{detail.milestone.title}</p>
        <p className="text-sm font-bold text-[#7C3AED] mt-0.5">{detail.milestone.date}</p>
        <p className="text-[10px] text-[#94A3B8] mt-0.5">{detail.milestone.note.replace("In ", "in ")}</p>
        <button type="button" onClick={() => setTab("timeline")} className="mt-3 text-[11px] font-semibold text-[#7C3AED] hover:underline">
          View milestones
        </button>
      </PmCard>

      <PmCard className="p-4">
        <h3 className="text-[13px] font-bold text-[#0F172A] mb-3">Recent activity</h3>
        <div className="space-y-3">
          {detail.activity.map((a, i) => {
            const src = detail.workload.find((w) => w.name === a.who)?.src || PM_PHOTOS.admin
            return (
              <div key={i} className="flex items-start gap-2 text-[11px]">
                <img src={src} alt="" className="h-6 w-6 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                <p className="text-[#475569] leading-snug flex-1">
                  <span className="font-bold text-[#0F172A]">{a.who.split(" ")[0]}</span> {a.text}
                  <span className="block text-[10px] text-[#94A3B8] mt-0.5">{a.when}</span>
                </p>
              </div>
            )
          })}
        </div>
        <button
          type="button"
          onClick={() => toast("Activity", { description: "Opening full activity log." })}
          className="mt-3 text-[11px] font-semibold text-[#7C3AED] hover:underline"
        >
          View all activity
        </button>
      </PmCard>

      <PmCard className="p-4">
        <h3 className="text-[13px] font-bold text-[#0F172A] mb-2 inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-[#7C3AED]" /> Project time
        </h3>
        <div className="flex items-baseline justify-between gap-2">
          <div>
            <p className="text-[10px] text-[#94A3B8]">Logged</p>
            <p className="text-sm font-bold text-[#0F172A]">{detail.time.logged}h</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-[#94A3B8]">Budget</p>
            <p className="text-sm font-bold text-[#0F172A]">{detail.time.budget}h</p>
          </div>
        </div>
        <div className="mt-2">
          <PmProgress value={(detail.time.logged / detail.time.budget) * 100} />
        </div>
        <p className="mt-1 text-[10px] text-[#94A3B8]">
          {Math.round((detail.time.logged / detail.time.budget) * 100)}% of budget used
        </p>
        <button
          type="button"
          onClick={() => router.push("/performance/timesheets")}
          className="mt-3 text-[11px] font-semibold text-[#7C3AED] hover:underline"
        >
          View time report
        </button>
      </PmCard>
    </div>
  )

  return (
    <div className="min-h-full bg-[#F8FAFC]">
      <div className="p-4 lg:p-5 space-y-4">
        {/* Breadcrumb + actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav className="text-xs">
            <button
              type="button"
              onClick={() => router.push("/performance/tasks?tab=projects")}
              className="text-[#7C3AED] font-semibold hover:underline"
            >
              Tasks &amp; Projects
            </button>
            <span className="mx-1.5 text-[#CBD5E1]">/</span>
            <span className="text-[#0F172A] font-medium">{project.name}</span>
          </nav>
          <div className="flex flex-wrap items-center gap-2">
            <PmFilterSelect
              icon={<Building2 className="h-3.5 w-3.5 text-[#64748B]" />}
              value={detail.team}
              options={[detail.team, "Sales Team", "Partnerships"]}
              onChange={() => {}}
            />
            <div className="flex items-center -space-x-2 pl-1">
              {teamAvatarSrcs.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  className="h-7 w-7 rounded-full object-cover ring-2 ring-white shadow-sm"
                  referrerPolicy="no-referrer"
                />
              ))}
              <div className="h-7 w-7 rounded-full bg-[#F1F5F9] text-[9px] font-semibold text-[#64748B] flex items-center justify-center ring-2 ring-white">
                +{Math.max(0, detail.workload.length - 3)}
              </div>
            </div>
            <PmButton
              variant="outline"
              onClick={() => toast("Share project", { description: "Invite link copied to clipboard." })}
            >
              <Share2 className="h-3.5 w-3.5" /> Share
            </PmButton>
            <PmButton onClick={() => router.push("/performance/tasks/new")}>
              <Plus className="h-3.5 w-3.5" /> Add task
            </PmButton>
          </div>
        </div>

        {/* Tabs with icons */}
        <div className="flex items-center gap-1 border-b border-[#E2E8F0] overflow-x-auto">
          {tabMeta.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap",
                tab === t.id
                  ? "border-[#7C3AED] text-[#7C3AED]"
                  : "border-transparent text-[#64748B] hover:text-[#0F172A]"
              )}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Title + sidebar share the same top row (like Objective detail) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
          <div className="xl:col-span-9 space-y-4 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                <h1 className="text-[22px] font-bold text-[#0F172A] tracking-tight leading-tight">
                  {project.name}
                </h1>
                <PmStatusPill
                  label={project.health}
                  tone={
                    project.health === "On Track"
                      ? "success"
                      : project.health === "At Risk"
                        ? "warning"
                        : "danger"
                  }
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  toast("Project options", {
                    description: "Rename, archive and export actions available here.",
                  })
                }
                className="h-8 w-8 rounded-full border border-[#E2E8F0] bg-white flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC] shrink-0"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
              <div className="flex items-center gap-2.5">
                <RingStat value={project.progress} />
                <div>
                  <p className="text-sm font-bold text-[#0F172A] leading-none">{project.progress}%</p>
                  <p className="text-[10px] text-[#94A3B8] mt-0.5">Complete</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="h-9 w-9 rounded-full bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-bold text-[#0F172A] leading-none">
                    {tasksDone} of {tasksTotal}
                  </p>
                  <p className="text-[10px] text-[#94A3B8] mt-0.5">Tasks</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="h-9 w-9 rounded-full bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center">
                  <Calendar className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-bold text-[#0F172A] leading-none">{project.due}</p>
                  <p className="text-[10px] text-[#94A3B8] mt-0.5">Due date</p>
                </div>
              </div>
              <PmAvatar
                initials={project.lead.slice(0, 2)}
                name={project.lead}
                role="Project lead"
                src={project.leadSrc}
                size="md"
              />
            </div>

            <AlignmentPath
              companyGoal="Sustainable growth"
              departmentObjective={project.goal}
              individualGoal="Win 12 enterprise accounts"
            />

            {tab === "board" && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-[160px] max-w-xs">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#94A3B8]" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search tasks..."
                      className="w-full h-8 pl-8 pr-3 rounded-full border border-[#E2E8F0] text-xs outline-none focus:border-[#C4B5FD] bg-white"
                    />
                  </div>
                  <PmFilterSelect label="Assignee" value={assignee} options={assigneeOptions} onChange={setAssignee} />
                  <PmFilterSelect
                    label="Status"
                    value={statusFilter}
                    options={["All statuses", "To Do", "In Progress", "In Review", "Complete"]}
                    onChange={setStatusFilter}
                  />
                  <PmFilterSelect
                    label="Priority"
                    value={priorityFilter}
                    options={["All priorities", "High", "Medium", "Low"]}
                    onChange={setPriorityFilter}
                  />
                  <PmFilterSelect label="KR" value={krFilter} options={krOptions} onChange={setKrFilter} />
                  <button
                    type="button"
                    onClick={clearFilters}
                    className={cn(
                      "text-[11px] font-semibold text-[#7C3AED] hover:underline",
                      !filtersActive && "opacity-60"
                    )}
                  >
                    Clear filters
                  </button>
                  <div className="ml-auto flex items-center gap-2">
                    <PmFilterSelect
                      icon={<Filter className="h-3.5 w-3.5 text-[#64748B]" />}
                      label="Group by"
                      value={groupBy}
                      options={["Status", "Assignee"]}
                      onChange={(v) => setGroupBy(v as "Status" | "Assignee")}
                    />
                    <div className="inline-flex rounded-full border border-[#E2E8F0] bg-white p-0.5">
                      {(
                        [
                          { id: "board", icon: Kanban },
                          { id: "list", icon: List },
                        ] as const
                      ).map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setView(v.id)}
                          className={cn(
                            "h-7 w-7 rounded-full flex items-center justify-center",
                            view === v.id ? "bg-[#F3E8FF] text-[#7C3AED]" : "text-[#64748B]"
                          )}
                        >
                          <v.icon className="h-3.5 w-3.5" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {view === "board" ? (
                  <div
                    className={cn(
                      "grid grid-cols-1 sm:grid-cols-2 gap-3",
                      { 1: "xl:grid-cols-1", 2: "xl:grid-cols-2", 3: "xl:grid-cols-3" }[
                        Math.min(4, groupedColumns.length)
                      ] || "xl:grid-cols-4"
                    )}
                  >
                    {groupedColumns.map((col) => (
                      <div
                        key={col.id}
                        className="rounded-xl bg-[#F1F5F9]/70 p-2.5 min-h-[320px]"
                      >
                        <div className="flex items-center justify-between mb-2.5 px-1">
                          <div className="flex items-center gap-2 min-w-0">
                            {"dot" in col && col.dot ? (
                              <span
                                className="h-2 w-2 rounded-full shrink-0"
                                style={{ backgroundColor: col.dot }}
                              />
                            ) : null}
                            <p className="text-[11px] font-bold text-[#334155] uppercase tracking-wide truncate">
                              {col.label}{" "}
                              <span className="text-[#94A3B8] font-semibold">({col.items.length})</span>
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => router.push("/performance/tasks/new")}
                            className="text-[#94A3B8] hover:text-[#7C3AED] shrink-0"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="space-y-2">
                          {col.items.map((t) => (
                            <ProjectTaskCard key={t.id} task={t} router={router} />
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => router.push("/performance/tasks/new")}
                          className="mt-2 w-full h-8 rounded-full border border-dashed border-[#C4B5FD] text-[11px] font-semibold text-[#7C3AED] hover:bg-[#F5F3FF]"
                        >
                          + Add task
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <PmCard className="overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-[#94A3B8] text-left border-b border-[#F1F5F9]">
                          <th className="px-3 py-2 font-medium">Task</th>
                          <th className="px-3 py-2 font-medium">Category</th>
                          <th className="px-3 py-2 font-medium">Priority</th>
                          <th className="px-3 py-2 font-medium">Owner</th>
                          <th className="px-3 py-2 font-medium">Status</th>
                          <th className="px-3 py-2 font-medium">Due</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((t) => (
                          <tr
                            key={t.id}
                            className="border-t border-[#F1F5F9] hover:bg-[#FAFAFB] cursor-pointer"
                            onClick={() => router.push(`/performance/tasks/${t.id}`)}
                          >
                            <td className="px-3 py-2 font-semibold text-[#0F172A]">{t.title}</td>
                            <td className="px-3 py-2 text-[#64748B]">{t.category || "—"}</td>
                            <td className="px-3 py-2">
                              <PmStatusPill label={t.priority} tone={priorityTone[t.priority]} />
                            </td>
                            <td className="px-3 py-2">
                              <PmAvatar initials={t.owner.slice(0, 2)} name={t.owner} src={t.ownerSrc} size="sm" />
                            </td>
                            <td className="px-3 py-2 text-[#334155]">{t.status}</td>
                            <td className="px-3 py-2 text-[#64748B]">{t.due}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </PmCard>
                )}
              </div>
            )}

            {tab === "overview" && (
              <div className="space-y-4">
                <PmCard className="p-4">
                  <h3 className="text-sm font-semibold text-[#0F172A] mb-1.5">About this project</h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Coordinated go-to-market and operational readiness workstream to expand commercial coverage
                    across Southern Africa, spanning market research, partnerships, pricing localisation and
                    enterprise sales enablement.
                  </p>
                </PmCard>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Total tasks", value: String(projectTasks.length) },
                    { label: "Completed", value: String(doneCount) },
                    {
                      label: "In progress",
                      value: String(projectTasks.filter((t) => t.status === "In Progress").length),
                    },
                    { label: "Overdue", value: String(overdueCount), danger: true },
                  ].map((m) => (
                    <PmCard key={m.label} className="p-3">
                      <p className="text-[11px] text-[#64748B]">{m.label}</p>
                      <p className={cn("text-lg font-bold mt-0.5", m.danger ? "text-[#EF4444]" : "text-[#0F172A]")}>
                        {m.value}
                      </p>
                    </PmCard>
                  ))}
                </div>
                <PmCard className="p-4">
                  <h3 className="text-sm font-semibold text-[#0F172A] mb-3">Recently updated tasks</h3>
                  <div className="space-y-2">
                    {projectTasks.slice(0, 5).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => router.push(`/performance/tasks/${t.id}`)}
                        className="w-full flex items-center justify-between gap-2 rounded-xl border border-[#F1F5F9] px-3 py-2 text-left hover:bg-[#FAFAFB]"
                      >
                        <span className="text-xs font-medium text-[#0F172A] truncate">{t.title}</span>
                        <PmStatusPill
                          label={t.status}
                          tone={
                            t.status === "Complete"
                              ? "success"
                              : t.status === "In Review"
                                ? "info"
                                : "neutral"
                          }
                        />
                      </button>
                    ))}
                  </div>
                </PmCard>
              </div>
            )}

            {tab === "timeline" && (
              <PmCard className="p-4">
                <h3 className="text-sm font-semibold text-[#0F172A] mb-4">Project timeline</h3>
                <div className="space-y-0">
                  {[...projectTasks]
                    .sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime())
                    .map((t, i, arr) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => router.push(`/performance/tasks/${t.id}`)}
                        className="relative flex w-full items-start gap-3 pb-5 last:pb-0 text-left"
                      >
                        {i < arr.length - 1 && (
                          <span className="absolute left-[7px] top-4 bottom-0 w-px bg-[#E2E8F0]" />
                        )}
                        <span
                          className={cn(
                            "mt-1 h-3.5 w-3.5 rounded-full shrink-0 ring-4 ring-white",
                            t.status === "Complete" ? "bg-[#10B981]" : "bg-[#7C3AED]"
                          )}
                        />
                        <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#0F172A] truncate">{t.title}</p>
                            <p className="text-[10px] text-[#94A3B8]">{t.owner}</p>
                          </div>
                          <span className="text-[11px] font-medium text-[#64748B] shrink-0">{t.due}</span>
                        </div>
                      </button>
                    ))}
                </div>
              </PmCard>
            )}

            {tab === "workload" && (
              <PmCard className="p-4">
                <h3 className="text-sm font-semibold text-[#0F172A] mb-4">Team workload distribution</h3>
                <div className="space-y-4">
                  {detail.workload.map((w) => {
                    const assigned = projectTasks.filter((t) => t.owner === w.name)
                    return (
                      <div key={w.name} className="flex items-center gap-3">
                        <PmAvatar initials={w.name.slice(0, 2)} name={w.name} src={w.src} size="md" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] text-[#64748B]">{assigned.length} tasks assigned</span>
                            <span className="text-xs font-bold text-[#0F172A]">{w.pct}%</span>
                          </div>
                          <PmProgress value={w.pct} color={w.pct > 85 ? "#EF4444" : "#7C3AED"} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </PmCard>
            )}

            {tab === "files" && (
              <PmCard className="overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[#94A3B8] text-left border-b border-[#F1F5F9]">
                      <th className="px-4 py-2.5 font-medium">File</th>
                      <th className="px-4 py-2.5 font-medium">Size</th>
                      <th className="px-4 py-2.5 font-medium">Uploaded by</th>
                      <th className="px-4 py-2.5 font-medium">Date</th>
                      <th className="px-4 py-2.5 font-medium" />
                    </tr>
                  </thead>
                  <tbody>
                    {detail.files.map((f) => (
                      <tr key={f.name} className="border-t border-[#F1F5F9] hover:bg-[#FAFAFB]">
                        <td className="px-4 py-2.5 font-medium text-[#0F172A]">
                          <span className="inline-flex items-center gap-2">
                            <Paperclip className="h-3.5 w-3.5 text-[#7C3AED]" /> {f.name}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-[#64748B]">{f.size}</td>
                        <td className="px-4 py-2.5 text-[#64748B]">{f.by}</td>
                        <td className="px-4 py-2.5 text-[#64748B]">{f.date}</td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => toast("Downloading", { description: f.name })}
                            className="text-[#7C3AED]"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </PmCard>
            )}
          </div>

          {RightRail}
        </div>
      </div>
    </div>
  )
}
