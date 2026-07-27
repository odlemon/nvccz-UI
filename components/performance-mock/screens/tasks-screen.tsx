"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Calendar,
  CalendarRange,
  Check,
  CheckCircle2,
  ChevronsUp,
  Clock,
  Filter,
  FolderKanban,
  Info,
  Kanban,
  LayoutGrid,
  List,
  Minus,
  MoreHorizontal,
  MoreVertical,
  Pin,
  Plus,
  Search,
  User,
  Users,
  ChevronDown,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  CheckSquare,
  ChevronRight,
  ChevronUp,
  Building2,
  ShieldAlert,
  Network,
  Target,
  Sliders,
  ClipboardCheck,
  RefreshCw,
  ExternalLink,
} from "lucide-react"
import { toast } from "sonner"
import { PerformanceMockTopChrome } from "@/components/performance-mock/shell"
import {
  PmAvatar,
  PmButton,
  PmCard,
  PmFilterSelect,
  PmPageHeader,
  PmProgress,
  PmSelectChip,
  PmStatusPill,
  PmToggle,
} from "@/components/performance-mock/primitives"
import { hubProjects, hubTasks, todayPriorities, type HubTask, type TaskStatus } from "@/lib/performance-mock/fixtures/tasks-hub"
import { PM_PHOTOS, pmPhoto } from "@/lib/performance-mock/photos"
import { cn } from "@/lib/utils"

const COLUMNS: TaskStatus[] = ["To Do", "In Progress", "In Review", "Complete"]

const priorityTone: Record<string, "danger" | "warning" | "success"> = {
  High: "danger",
  Medium: "warning",
  Low: "success",
}

type HubTab = "overview" | "tasks" | "projects" | "teams" | "calendar"

function TaskCard({ task }: { task: HubTask }) {
  const init = task.owner.slice(0, 2).toUpperCase()
  const initBg =
    init === "RC"
      ? "bg-[#6D28D9] text-white"
      : init === "TM"
      ? "bg-[#2563EB] text-white"
      : init === "TD"
      ? "bg-[#059669] text-white"
      : init === "FM"
      ? "bg-[#4F46E5] text-white"
      : "bg-[#7C3AED] text-white"

  return (
    <Link
      href={`/performance/tasks/${task.id}`}
      className="block rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-xs hover:shadow-md transition-all space-y-2.5 relative"
    >
      {/* Top Header: Title & Complete Checkmark or Progress Bar */}
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-xs font-bold text-[#0F172A] leading-snug">{task.title}</h4>

        {/* Complete Checkmark Icon */}
        {task.status === "Complete" && (
          <div className="h-4.5 w-4.5 rounded-full border border-[#10B981] bg-white text-[#10B981] flex items-center justify-center shrink-0">
            <span className="text-[10px] font-extrabold leading-none">✓</span>
          </div>
        )}

        {/* In Progress Percentage & Bar */}
        {task.status === "In Progress" && typeof task.progress === "number" && (
          <div className="flex flex-col items-end shrink-0 ml-1">
            <span className="text-xs font-extrabold text-[#0F172A] leading-none mb-1">{task.progress}%</span>
            <div className="h-1.5 w-14 rounded-full bg-[#F1F5F9] overflow-hidden">
              <div className="h-full bg-[#7C3AED] rounded-full transition-all" style={{ width: `${task.progress}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Badges row */}
      <div className="flex flex-wrap items-center gap-1.5">
        {/* Project Badge */}
        <span
          className={cn(
            "px-2 py-0.5 rounded text-[9.5px] font-bold border",
            task.project.includes("Expansion")
              ? "bg-[#F5F3FF] border-[#DDD6FE] text-[#7C3AED]"
              : task.project.includes("ISO")
              ? "bg-[#FFFBEB] border-[#FDE68A] text-[#D97706]"
              : "bg-[#EFF6FF] border-[#BFDBFE] text-[#2563EB]"
          )}
        >
          {task.project}
        </span>

        {/* Priority Badge */}
        <span
          className={cn(
            "px-2 py-0.5 rounded text-[9.5px] font-bold border flex items-center gap-0.5",
            task.priority === "High"
              ? "bg-[#FEF2F2] border-[#FCA5A5] text-[#EF4444]"
              : task.priority === "Medium"
              ? "bg-[#FFFBEB] border-[#FDE68A] text-[#D97706]"
              : "bg-[#ECFDF5] border-[#A7F3D0] text-[#059669]"
          )}
        >
          {task.priority === "High" ? "^ High" : task.priority === "Medium" ? "~ Medium" : "~ Low"}
        </span>
      </div>

      {/* Due date if present */}
      {task.due && task.status === "In Review" && (
        <div className="flex items-center gap-1 text-[10px] font-semibold text-[#64748B]">
          <Calendar className="h-3 w-3 text-[#94A3B8]" />
          <span>{task.due}</span>
        </div>
      )}

      {/* Bottom Footer: Owner & Comments/Files */}
      <div className="flex items-center justify-between gap-2 pt-1">
        {/* Owner */}
        <div className="flex items-center">
          <div className={cn("h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 shadow-xs", initBg)}>
            {init}
          </div>
          <span className="text-[10px] font-bold text-[#475569] ml-1.5 truncate max-w-[100px]">{task.owner}</span>
        </div>

        {/* Comments & Attachments count */}
        <div className="flex items-center gap-2.5 text-[10px] font-semibold text-[#94A3B8]">
          <div className="flex items-center gap-1">
            <span className="text-[11px]">💬</span>
            <span>{task.comments}</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[11px]">📎</span>
            <span>{task.files}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

/* ------------------------------------------------------------------ */
/* Projects portfolio tab (matched to client crop)                     */
/* ------------------------------------------------------------------ */

const AVATAR_COLORS: Record<string, string> = {
  TM: "#2563EB",
  NM: "#7C3AED",
  RC: "#6D28D9",
  TD: "#059669",
  FM: "#4F46E5",
}

type PinnedProject = {
  id: string
  name: string
  health: "On Track" | "At Risk"
  goal: string
  pct: number
  done: number
  total: number
  due: string
  team: string[]
  extra: number
  lead: string
  next: string
  nextDate: string
}

type GridProject = {
  name: string
  health: "On Track" | "At Risk"
  goal: string
  dept: string
  owner: string
  done: number
  total: number
  pct: number
  due: string
  overdue?: boolean
}

const pinnedProjects: PinnedProject[] = [
  { id: "proj-sa", name: "Southern Africa Expansion", health: "On Track", goal: "Expand Southern Africa", pct: 67, done: 8, total: 12, due: "30 Sep 2026", team: ["TM", "NM"], extra: 3, lead: "Tatenda Mlambo", next: "Sign market access agreements", nextDate: "15 Aug 2026" },
  { id: "proj-review", name: "Performance Review Cycle", health: "At Risk", goal: "Performance Review Cycle", pct: 65, done: 13, total: 20, due: "31 Jul 2026", team: ["NM", "RC"], extra: 4, lead: "Nyasha Moyo", next: "Department evaluations complete", nextDate: "24 Jul 2026" },
  { id: "proj-iso", name: "ISO 27001 Readiness", health: "On Track", goal: "ISO 27001 Readiness", pct: 52, done: 15, total: 29, due: "15 Oct 2026", team: ["TD", "RC"], extra: 2, lead: "Tendai Dube", next: "Control implementation review", nextDate: "30 Aug 2026" },
]

const allProjects: GridProject[] = [
  { name: "Customer Success Playbook", health: "On Track", goal: "Sustainable growth", dept: "Sales & Marketing", owner: "Nyasha Moyo", done: 6, total: 14, pct: 58, due: "20 Aug 2026" },
  { name: "Executive Scorecard", health: "On Track", goal: "Win 12 enterprise accounts", dept: "Strategy Office", owner: "Tatenda Mlambo", done: 5, total: 12, pct: 61, due: "31 Aug 2026" },
  { name: "Leadership Framework", health: "At Risk", goal: "Finalise leadership competency framework", dept: "HR", owner: "Nyasha Moyo", done: 4, total: 10, pct: 45, due: "14 Jul 2026", overdue: true },
  { name: "FY2026 Revenue Forecast", health: "On Track", goal: "Validate FY2026 revenue forecast", dept: "Finance", owner: "Farai Muchenyezi", done: 3, total: 8, pct: 72, due: "15 Jul 2026" },
  { name: "Regional Hiring Plan", health: "On Track", goal: "Review regional hiring plan", dept: "HR", owner: "Rumbidzai Choza", done: 4, total: 9, pct: 66, due: "28 Aug 2026" },
  { name: "Digital Adoption Recovery", health: "At Risk", goal: "Drive digital adoption", dept: "IT", owner: "Tendai Dube", done: 3, total: 11, pct: 41, due: "5 Sep 2026" },
  { name: "Data Platform Migration", health: "On Track", goal: "Modernise reporting stack", dept: "IT", owner: "Tendai Dube", done: 2, total: 9, pct: 24, due: "30 Nov 2026" },
  { name: "Customer NPS Uplift", health: "On Track", goal: "Sustainable growth", dept: "Sales & Marketing", owner: "Nyasha Moyo", done: 1, total: 6, pct: 18, due: "12 Dec 2026" },
  { name: "Compliance Training Rollout", health: "On Track", goal: "Risk & controls", dept: "HR", owner: "Rumbidzai Choza", done: 2, total: 7, pct: 30, due: "15 Nov 2026" },
]

const portfolioMilestones = [
  { title: "Department evaluations complete", project: "Performance Review Cycle", date: "24 Jul 2026", dot: "#EF4444", late: true },
  { title: "Finalize leadership competencies", project: "Leadership Framework", date: "14 Jul 2026", dot: "#EF4444", late: true },
  { title: "Validate FY2026 revenue forecast", project: "FY2026 Revenue Forecast", date: "15 Jul 2026", dot: "#F59E0B", late: false },
  { title: "Sign market access agreements", project: "Southern Africa Expansion", date: "15 Aug 2026", dot: "#22C55E", late: false },
  { title: "Control implementation review", project: "ISO 27001 Readiness", date: "30 Aug 2026", dot: "#22C55E", late: false },
]

const recentlyViewedProjects = [
  { id: "proj-review", name: "Performance Review Cycle", sub: "At Risk · 65%" },
  { id: "proj-iso", name: "ISO 27001 Readiness", sub: "On Track · 52%" },
  { id: "", name: "FY2026 Revenue Forecast", sub: "On Track · 72%" },
]

function HealthPill({ health }: { health: "On Track" | "At Risk" }) {
  const on = health === "On Track"
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 h-[18px] px-2 rounded-full text-[9px] font-bold shrink-0 whitespace-nowrap",
        on ? "bg-[#ECFDF5] text-[#059669]" : "bg-[#FEF2F2] text-[#DC2626]"
      )}
    >
      <span className={cn("h-1 w-1 rounded-full", on ? "bg-[#22C55E]" : "bg-[#EF4444]")} />
      {health}
    </span>
  )
}

function MiniDonut({ pct, size = 22, stroke = 3.5, color = "#7C3AED" }: { pct: number; size?: number; stroke?: number; color?: string }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EDE9FE" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={`${(pct / 100) * c} ${c}`}
        strokeLinecap="round"
      />
    </svg>
  )
}

function PortfolioHealthDonut() {
  const size = 116
  const stroke = 17
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const segs = [
    { v: 50, color: "#22C55E" },
    { v: 25, color: "#F59E0B" },
    { v: 8, color: "#EF4444" },
    { v: 17, color: "#8B5CF6" },
  ]
  let offset = 0
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        {segs.map((s, i) => {
          const dash = (s.v / 100) * c
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={`${Math.max(dash - 2, 0)} ${c}`}
              strokeDashoffset={-offset}
            />
          )
          offset += dash
          return el
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-tight">
        <span className="text-[19px] font-extrabold text-[#0F172A]">12</span>
        <span className="text-[8.5px] text-[#94A3B8] font-medium">Active projects</span>
      </div>
    </div>
  )
}

function AvatarStack({ initials, extra }: { initials: string[]; extra: number }) {
  return (
    <div className="flex items-center">
      {initials.map((i, idx) => (
        <span
          key={i}
          className={cn(
            "h-6 w-6 rounded-full flex items-center justify-center text-[8.5px] font-black text-white ring-2 ring-white shrink-0",
            idx > 0 && "-ml-1.5"
          )}
          style={{ backgroundColor: AVATAR_COLORS[i] ?? "#7C3AED" }}
        >
          {i}
        </span>
      ))}
      <span className="h-6 w-6 rounded-full bg-[#F1F5F9] text-[#64748B] text-[8.5px] font-bold flex items-center justify-center ring-2 ring-white -ml-1.5 shrink-0">
        +{extra}
      </span>
    </div>
  )
}

function GoalChip({ goal }: { goal: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 h-6 pl-1 pr-2.5 rounded-full bg-white border border-[#E9E2FB] max-w-full">
      <span className="h-4 w-4 rounded-full bg-[#F5F3FF] flex items-center justify-center shrink-0">
        <Target className="h-2.5 w-2.5 text-[#7C3AED]" />
      </span>
      <span className="text-[10px] font-semibold text-[#7C3AED] truncate">{goal}</span>
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* My Tasks — Calendar view (matched to client crop)                   */
/* ------------------------------------------------------------------ */

const PROJECT_DOT: Record<string, string> = {
  "Performance Review Cycle": "#7C3AED",
  "Southern Africa Expansion": "#A78BFA",
  "ISO 27001 Readiness": "#2563EB",
  "Sustainable Growth": "#10B981",
  "Digital Adoption Drive": "#10B981",
  "Customer Success Playbook": "#10B981",
}

function projectDotColor(project: string) {
  return PROJECT_DOT[project] ?? "#6B7280"
}

function PriorityGlyph({ priority, status }: { priority: string; status?: string }) {
  if (status === "Complete") {
    return (
      <span className="h-3.5 w-3.5 rounded-full bg-[#10B981] flex items-center justify-center shrink-0">
        <Check className="h-2 w-2 text-white" strokeWidth={3} />
      </span>
    )
  }
  if (priority === "High") return <ChevronsUp className="h-3.5 w-3.5 text-[#EF4444] shrink-0" strokeWidth={2.5} />
  if (priority === "Medium") return <ChevronUp className="h-3.5 w-3.5 text-[#F59E0B] shrink-0" strokeWidth={2.5} />
  if (priority === "Low") return <ChevronDown className="h-3.5 w-3.5 text-[#10B981] shrink-0" strokeWidth={2.5} />
  return (
    <span className="h-3.5 w-3.5 rounded-full border border-[#CBD5E1] flex items-center justify-center shrink-0">
      <Minus className="h-2 w-2 text-[#94A3B8]" strokeWidth={2.5} />
    </span>
  )
}

function parseDueParts(due: string): { day: number; month: number; year: number } | null {
  // "15 Jul 2026" | "16 Jul"
  const m = due.match(/^(\d{1,2})\s+([A-Za-z]{3})(?:\s+(\d{4}))?/)
  if (!m) return null
  const months: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 }
  const month = months[m[2]]
  if (month === undefined) return null
  return { day: Number(m[1]), month, year: m[3] ? Number(m[3]) : 2026 }
}

/** Extra calendar events to densify the month like the crop */
const calendarExtras: HubTask[] = [
  { id: "c-1", title: "Kick-off Q3 OKR sync", project: "Performance Review Cycle", projectId: "proj-review", priority: "High", status: "To Do", owner: "Rumbidzai Chaza", ownerSrc: PM_PHOTOS.rumbidzai, comments: 0, files: 0, due: "01 Jul 2026" },
  { id: "c-2", title: "Vendor security questionnaire", project: "ISO 27001 Readiness", projectId: "proj-iso", priority: "Medium", status: "In Progress", owner: "Farai Muchengeti", ownerSrc: PM_PHOTOS.farai, comments: 0, files: 0, due: "01 Jul 2026" },
  { id: "c-3", title: "Market sizing draft review", project: "Southern Africa Expansion", projectId: "proj-sa", priority: "Low", status: "To Do", owner: "Nyasha Dube", ownerSrc: PM_PHOTOS.nyasha, comments: 0, files: 0, due: "02 Jul 2026" },
  { id: "c-4", title: "Weekly stand-up notes", project: "General / Admin", projectId: "proj-sa", priority: "Low", status: "Complete", owner: "Tatenda Mlambo", ownerSrc: pmPhoto(21), comments: 0, files: 0, due: "03 Jul 2026" },
  { id: "c-5", title: "Partner intro call prep", project: "Southern Africa Expansion", projectId: "proj-sa", priority: "High", status: "In Progress", owner: "Rumbidzai Chaza", ownerSrc: PM_PHOTOS.rumbidzai, comments: 0, files: 0, due: "03 Jul 2026" },
  { id: "c-6", title: "Access review checklist", project: "ISO 27001 Readiness", projectId: "proj-iso", priority: "Medium", status: "To Do", owner: "Tendai Dube", ownerSrc: PM_PHOTOS.tendai, comments: 0, files: 0, due: "07 Jul 2026" },
  { id: "c-7", title: "Publish department KPIs", project: "Southern Africa Expansion", projectId: "proj-sa", priority: "Low", status: "Complete", owner: "Nyasha Dube", ownerSrc: PM_PHOTOS.nyasha, comments: 0, files: 0, due: "07 Jul 2026" },
  { id: "c-8", title: "Board pack outline", project: "Performance Review Cycle", projectId: "proj-review", priority: "High", status: "In Progress", owner: "Tatenda Mlambo", ownerSrc: pmPhoto(21), comments: 0, files: 0, due: "08 Jul 2026" },
  { id: "c-9", title: "Control walkthrough", project: "ISO 27001 Readiness", projectId: "proj-iso", priority: "Medium", status: "To Do", owner: "Farai Muchengeti", ownerSrc: PM_PHOTOS.farai, comments: 0, files: 0, due: "09 Jul 2026" },
  { id: "c-10", title: "Pricing localisation QA", project: "Southern Africa Expansion", projectId: "proj-sa", priority: "High", status: "In Review", owner: "Tendai Nyathi", ownerSrc: PM_PHOTOS.tendai, comments: 0, files: 0, due: "10 Jul 2026" },
  { id: "c-11", title: "Manager calibration dry-run", project: "Performance Review Cycle", projectId: "proj-review", priority: "Medium", status: "To Do", owner: "Rumbidzai Chaza", ownerSrc: PM_PHOTOS.rumbidzai, comments: 0, files: 0, due: "14 Jul 2026" },
  { id: "c-12", title: "Campaign creative review", project: "Southern Africa Expansion", projectId: "proj-sa", priority: "High", status: "In Progress", owner: "Nyasha Dube", ownerSrc: PM_PHOTOS.nyasha, comments: 0, files: 0, due: "16 Jul 2026" },
  { id: "c-13", title: "Timesheet approval sweep", project: "General / Admin", projectId: "proj-sa", priority: "Low", status: "To Do", owner: "Memory Sibanda", ownerSrc: PM_PHOTOS.chipo, comments: 0, files: 0, due: "17 Jul 2026" },
  { id: "c-14", title: "Evidence pack peer review", project: "ISO 27001 Readiness", projectId: "proj-iso", priority: "High", status: "In Review", owner: "Farai Muchengeti", ownerSrc: PM_PHOTOS.farai, comments: 0, files: 0, due: "21 Jul 2026" },
  { id: "c-15", title: "NPS recovery workshop", project: "Sustainable Growth", projectId: "proj-sa", priority: "Medium", status: "To Do", owner: "Nyasha Moyo", ownerSrc: PM_PHOTOS.nyasha, comments: 0, files: 0, due: "22 Jul 2026" },
  { id: "c-16", title: "Hiring plan sign-off", project: "Southern Africa Expansion", projectId: "proj-sa", priority: "Low", status: "Complete", owner: "Rumbidzai Chaza", ownerSrc: PM_PHOTOS.rumbidzai, comments: 0, files: 0, due: "22 Jul 2026" },
  { id: "c-17", title: "Risk register update", project: "ISO 27001 Readiness", projectId: "proj-iso", priority: "Medium", status: "In Progress", owner: "Tendai Dube", ownerSrc: PM_PHOTOS.tendai, comments: 0, files: 0, due: "23 Jul 2026" },
  { id: "c-18", title: "Executive briefing slides", project: "Performance Review Cycle", projectId: "proj-review", priority: "High", status: "To Do", owner: "Tatenda Mlambo", ownerSrc: pmPhoto(21), comments: 0, files: 0, due: "28 Jul 2026" },
  { id: "c-19", title: "Month-end capacity report", project: "General / Admin", projectId: "proj-sa", priority: "Low", status: "To Do", owner: "Farai Muchengeti", ownerSrc: PM_PHOTOS.farai, comments: 0, files: 0, due: "30 Jul 2026" },
  { id: "c-20", title: "August roadmap draft", project: "Southern Africa Expansion", projectId: "proj-sa", priority: "Medium", status: "To Do", owner: "Nyasha Dube", ownerSrc: PM_PHOTOS.nyasha, comments: 0, files: 0, due: "31 Jul 2026" },
]

function MyTasksCalendarView({
  tasks,
  search,
  setSearch,
  view,
  setView,
}: {
  tasks: HubTask[]
  search: string
  setSearch: (v: string) => void
  view: "board" | "list" | "calendar"
  setView: (v: "board" | "list" | "calendar") => void
}) {
  const router = useRouter()
  const [calRange, setCalRange] = useState<"month" | "week">("month")
  const [cursor, setCursor] = useState(() => new Date(2026, 6, 1)) // July 2026
  const [selectedDay, setSelectedDay] = useState(15)
  const [selectedTaskId, setSelectedTaskId] = useState("t-8")
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [projectF, setProjectF] = useState("Project")
  const [priorityF, setPriorityF] = useState("Priority")
  const [statusF, setStatusF] = useState("Status")
  const [goalF, setGoalF] = useState("Linked goal")

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const monthLabel = cursor.toLocaleString("en-GB", { month: "long", year: "numeric" })
  const selectedDate = new Date(year, month, selectedDay)
  const selectedLabel = selectedDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })

  const allTasks = useMemo(() => {
    const merged = [...tasks, ...calendarExtras]
    const seen = new Set<string>()
    return merged.filter((t) => {
      if (seen.has(t.id)) return false
      seen.add(t.id)
      return true
    })
  }, [tasks])

  const filteredCal = useMemo(() => {
    return allTasks.filter((t) => {
      if (search.trim() && !t.title.toLowerCase().includes(search.toLowerCase())) return false
      if (projectF !== "Project" && t.project !== projectF) return false
      if (priorityF !== "Priority" && t.priority !== priorityF) return false
      if (statusF !== "Status" && t.status !== statusF) return false
      return true
    })
  }, [allTasks, search, projectF, priorityF, statusF, goalF])

  const tasksByDay = useMemo(() => {
    const map = new Map<string, HubTask[]>()
    filteredCal.forEach((t) => {
      const p = parseDueParts(t.due)
      if (!p) return
      const key = `${p.year}-${p.month}-${p.day}`
      const list = map.get(key) ?? []
      list.push(t)
      map.set(key, list)
    })
    return map
  }, [filteredCal])

  const cells = useMemo(() => {
    const first = new Date(year, month, 1)
    const startOffset = (first.getDay() + 6) % 7
    const start = new Date(year, month, 1 - startOffset)
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }, [year, month])

  const weekCells = useMemo(() => {
    const selected = new Date(year, month, selectedDay)
    const monOffset = (selected.getDay() + 6) % 7
    const monday = new Date(selected)
    monday.setDate(selected.getDate() - monOffset)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return d
    })
  }, [year, month, selectedDay])

  const displayCells = calRange === "week" ? weekCells : cells
  const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  const selectedKey = `${year}-${month}-${selectedDay}`
  const selectedDayTasks = tasksByDay.get(selectedKey) ?? []

  const goToday = () => {
    setCursor(new Date(2026, 6, 1))
    setSelectedDay(15)
    setSelectedTaskId("t-8")
  }

  const shift = (dir: -1 | 1) => {
    if (calRange === "week") {
      const next = new Date(year, month, selectedDay + dir * 7)
      setCursor(new Date(next.getFullYear(), next.getMonth(), 1))
      setSelectedDay(next.getDate())
      return
    }
    setCursor(new Date(year, month + dir, 1))
  }

  const hoursFor = (t: HubTask) => {
    if (t.id === "t-8") return "2.5h"
    if (t.priority === "High") return "2.0h"
    if (t.priority === "Medium") return "1.5h"
    return "1.0h"
  }

  const upcomingDeadlines = useMemo(() => {
    return filteredCal
      .map((t) => ({ t, p: parseDueParts(t.due) }))
      .filter((x) => x.p && (x.p.month > month || (x.p.month === month && x.p.day > selectedDay)))
      .sort((a, b) => a.p!.day + a.p!.month * 40 - (b.p!.day + b.p!.month * 40))
      .slice(0, 3)
      .map((x) => x.t)
  }, [filteredCal, month, selectedDay])

  const focusBlocks = [
    { time: "09:00 – 11:00", label: "Deep work" },
    { time: "14:00 – 15:30", label: "Strategy focus" },
    { time: "16:00 – 16:45", label: "Review buffer" },
  ]

  const shortDue = (due: string) => due.replace(/\s+2026$/, "")

  return (
    <div className="space-y-3.5">
      {/* Calendar-only stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Tasks this month", value: "26", icon: List, bg: "#F5F3FF", color: "#7C3AED" },
          { label: "Due this week", value: "8", icon: Calendar, bg: "#F5F3FF", color: "#7C3AED" },
          { label: "Overdue", value: "3", icon: ShieldAlert, bg: "#FEF2F2", color: "#EF4444" },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-[#E9EDF3] bg-white px-3.5 py-3 flex items-center gap-3">
            <span className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: m.bg }}>
              <m.icon className="h-[18px] w-[18px]" style={{ color: m.color }} strokeWidth={1.75} />
            </span>
            <span className="leading-tight min-w-0">
              <span className="block text-[10px] text-[#94A3B8] font-medium">{m.label}</span>
              <span className="block text-[18px] font-extrabold text-[#0F172A]">{m.value}</span>
            </span>
          </div>
        ))}
        <div className="rounded-xl border border-[#E9EDF3] bg-white px-3.5 py-3 flex items-center gap-3">
          <MiniDonut pct={72} size={30} stroke={4.5} />
          <span className="leading-tight min-w-0">
            <span className="block text-[10px] text-[#94A3B8] font-medium">Focus capacity</span>
            <span className="block text-[18px] font-extrabold text-[#0F172A]">72%</span>
          </span>
        </div>
      </div>

      {/* Filters + view switcher */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#94A3B8]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="h-8 w-[170px] rounded-lg border border-[#E5E7EB] bg-white pl-8 pr-3 text-[11px] outline-none focus:border-[#7C3AED] placeholder:text-[#94A3B8]"
          />
        </div>
        <PmFilterSelect
          value={projectF}
          onChange={setProjectF}
          options={["Project", "Performance Review Cycle", "Southern Africa Expansion", "ISO 27001 Readiness", "Sustainable Growth", "General / Admin"]}
        />
        <PmFilterSelect value={priorityF} onChange={setPriorityF} options={["Priority", "High", "Medium", "Low"]} />
        <PmFilterSelect value={statusF} onChange={setStatusF} options={["Status", "To Do", "In Progress", "In Review", "Complete"]} />
        <PmFilterSelect value={goalF} onChange={setGoalF} options={["Linked goal", "Expand Southern Africa", "Sustainable growth", "Win 12 enterprise accounts"]} />
        <div className="ml-auto inline-flex items-center rounded-lg border border-[#E2E8F0] bg-white p-0.5 shrink-0">
          {(
            [
              { id: "board" as const, label: "Board", icon: Kanban },
              { id: "list" as const, label: "List", icon: List },
              { id: "calendar" as const, label: "Calendar", icon: Calendar },
            ]
          ).map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setView(v.id)}
              className={cn(
                "h-7 px-2.5 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition-colors",
                view === v.id
                  ? "bg-[#F5F3FF] text-[#7C3AED] border border-[#C4B5FD]"
                  : "text-[#64748B] border border-transparent"
              )}
            >
              <v.icon className="h-3.5 w-3.5" />
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar chrome */}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={goToday} className="h-8 px-3 rounded-lg border border-[#E5E7EB] bg-white text-[11px] font-semibold text-[#475569]">
          Today
        </button>
        <button type="button" onClick={() => shift(-1)} className="h-8 w-8 rounded-lg border border-[#E5E7EB] bg-white flex items-center justify-center text-[#64748B]">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => shift(1)} className="h-8 w-8 rounded-lg border border-[#E5E7EB] bg-white flex items-center justify-center text-[#64748B]">
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => toast("Pick month", { description: "Month picker opens here." })}
          className="inline-flex items-center gap-1 text-[14px] font-bold text-[#0F172A] ml-1"
        >
          {monthLabel}
          <ChevronDown className="h-4 w-4 text-[#94A3B8]" />
        </button>
        <div className="ml-auto inline-flex items-center rounded-lg border border-[#E5E7EB] bg-white p-0.5">
          <button
            type="button"
            onClick={() => setCalRange("month")}
            className={cn("h-7 px-3 rounded-md text-[11px] font-semibold", calRange === "month" ? "bg-[#F5F3FF] text-[#7C3AED]" : "text-[#64748B]")}
          >
            Month
          </button>
          <button
            type="button"
            onClick={() => setCalRange("week")}
            className={cn("h-7 px-3 rounded-md text-[11px] font-semibold", calRange === "week" ? "bg-[#F5F3FF] text-[#7C3AED]" : "text-[#64748B]")}
          >
            Week
          </button>
        </div>
      </div>

      {/* Calendar + Selected day — original layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_280px] gap-3.5 items-start">
        <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
          <div className="grid grid-cols-7 border-b border-[#E5E7EB]">
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((d) => (
              <div key={d} className="py-2 text-center text-[11px] font-semibold text-[#64748B] border-r border-[#E5E7EB] last:border-r-0">
                {d}
              </div>
            ))}
          </div>
          <div className={cn("grid grid-cols-7", calRange === "week" ? "auto-rows-[minmax(220px,1fr)]" : "auto-rows-[minmax(102px,1fr)]")}>
            {displayCells.map((d) => {
              const inMonth = d.getMonth() === month
              const dayNum = d.getDate()
              const isWeekend = d.getDay() === 0 || d.getDay() === 6
              const isSelected = inMonth && dayNum === selectedDay
              const key = dayKey(d)
              const dayTasks = tasksByDay.get(key) ?? []
              const visible = dayTasks.slice(0, calRange === "week" ? 6 : 2)
              const more = dayTasks.length - visible.length
              const label = !inMonth ? `${dayNum} ${d.toLocaleString("en-GB", { month: "short" })}` : String(dayNum)

              return (
                <div
                  key={key}
                  onClick={() => {
                    setCursor(new Date(d.getFullYear(), d.getMonth(), 1))
                    setSelectedDay(dayNum)
                  }}
                  className={cn(
                    "border-r border-b border-[#E5E7EB] p-1.5 min-h-0 cursor-pointer",
                    isWeekend && "bg-[#F8FAFC]",
                    !inMonth && "bg-[#FAFAFB]",
                    isSelected && "bg-[#FAF8FF]"
                  )}
                >
                  <div className="flex justify-start mb-1">
                    <span
                      className={cn(
                        "text-[11px] font-semibold leading-none",
                        !inMonth && "text-[#94A3B8]",
                        inMonth && !isSelected && "text-[#64748B]",
                        isSelected && "h-6 w-6 rounded-full border-2 border-[#7C3AED] text-[#7C3AED] flex items-center justify-center font-bold"
                      )}
                    >
                      {isSelected ? dayNum : label}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {visible.map((t) => {
                      const active = t.id === selectedTaskId && isSelected
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedTaskId(t.id)
                            setSelectedDay(dayNum)
                            setCursor(new Date(d.getFullYear(), d.getMonth(), 1))
                          }}
                          onDoubleClick={() => router.push(`/performance/tasks/${t.id}`)}
                          className={cn(
                            "w-full flex items-center gap-1 rounded-md border px-1.5 py-1 text-left",
                            active ? "border-[#7C3AED] bg-[#F5F3FF]" : "border-[#E5E7EB] bg-white"
                          )}
                        >
                          <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: projectDotColor(t.project) }} />
                          <span className="flex-1 min-w-0 text-[10px] font-medium text-[#334155] truncate leading-tight">{t.title}</span>
                          <PriorityGlyph priority={t.priority} status={t.status} />
                        </button>
                      )
                    })}
                    {more > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          toast(`${more} more task${more > 1 ? "s" : ""}`, {
                            description: dayTasks.slice(visible.length).map((t) => t.title).join(" · "),
                          })
                        }}
                        className="text-[10px] font-semibold text-[#7C3AED] pl-0.5 hover:underline"
                      >
                        + {more} more
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Selected day rail */}
        <div className="rounded-xl border border-[#E9EDF3] bg-white p-3.5 space-y-3.5 xl:sticky xl:top-24">
          <div>
            <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wide">Selected day</p>
            <h3 className="text-[14px] font-bold text-[#0F172A] mt-0.5">{selectedLabel}</h3>
          </div>

          <div className="space-y-2">
            {selectedDayTasks.length === 0 ? (
              <p className="text-[11px] text-[#94A3B8] py-2">No tasks scheduled for this day.</p>
            ) : (
              selectedDayTasks.slice(0, 4).map((t) => (
                <div
                  key={t.id}
                  className={cn(
                    "rounded-xl border p-2.5",
                    t.id === selectedTaskId ? "border-[#C4B5FD] bg-[#FAF8FF]" : "border-[#E9EDF3] bg-white"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <button
                      type="button"
                      onClick={() => setChecked((c) => ({ ...c, [t.id]: !c[t.id] }))}
                      className={cn(
                        "mt-0.5 h-4 w-4 rounded border flex items-center justify-center shrink-0",
                        checked[t.id] || t.status === "Complete"
                          ? "bg-[#7C3AED] border-[#7C3AED] text-white"
                          : "border-[#CBD5E1] bg-white"
                      )}
                    >
                      {(checked[t.id] || t.status === "Complete") && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-[#0F172A] leading-snug">{t.title}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-[#64748B]">
                        <span className="inline-flex items-center gap-1 font-semibold text-[#0F172A]">
                          <Clock className="h-3 w-3 text-[#94A3B8]" /> {hoursFor(t)}
                        </span>
                        <span className="inline-flex items-center gap-1 truncate">
                          <User className="h-3 w-3 text-[#94A3B8]" /> {t.owner.split(" ")[0]}
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center gap-0.5 font-bold",
                            t.priority === "High" ? "text-[#EF4444]" : t.priority === "Medium" ? "text-[#F59E0B]" : "text-[#10B981]"
                          )}
                        >
                          <PriorityGlyph priority={t.priority} />
                          {t.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-[#F1F5F9] pt-3">
            <div className="flex items-center justify-between text-[10px] mb-1.5 gap-2">
              <span className="font-semibold text-[#475569]">Day capacity</span>
              <span className="text-[#64748B] text-right">
                <span className="font-bold text-[#0F172A]">6.5h</span> scheduled · <span className="font-bold text-[#0F172A]">8h</span> available
              </span>
            </div>
            <div className="h-2 rounded-full bg-[#F1F5F9] overflow-hidden">
              <div className="h-full rounded-full bg-[#7C3AED]" style={{ width: "81.25%" }} />
            </div>
          </div>

          <div className="border-t border-[#F1F5F9] pt-3">
            <p className="text-[10px] font-bold text-[#475569] uppercase tracking-wide mb-2">Focus blocks</p>
            <div className="space-y-2">
              {focusBlocks.map((b) => (
                <div key={b.time} className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-[#7C3AED] shrink-0" />
                  <span className="text-[10px] font-semibold text-[#0F172A] w-[88px] shrink-0">{b.time}</span>
                  <span className="text-[10px] font-semibold text-[#7C3AED]">{b.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-[#F1F5F9] pt-3">
            <p className="text-[10px] font-bold text-[#475569] uppercase tracking-wide mb-2">Upcoming deadlines</p>
            <div className="space-y-2">
              {(upcomingDeadlines.length ? upcomingDeadlines : filteredCal.slice(0, 3)).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    const p = parseDueParts(t.due)
                    if (p) {
                      setCursor(new Date(p.year, p.month, 1))
                      setSelectedDay(p.day)
                      setSelectedTaskId(t.id)
                    }
                  }}
                  className="w-full flex items-center gap-2 text-left"
                >
                  <span className="text-[10px] font-bold text-[#0F172A] w-12 shrink-0">{shortDue(t.due)}</span>
                  <span className="flex-1 min-w-0 text-[10px] font-medium text-[#475569] truncate">{t.title}</span>
                  <PriorityGlyph priority={t.priority} status={t.status} />
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => toast.success("Calendar synced", { description: "Outlook / Google sync is mock-only." })}
            className="w-full h-9 rounded-full border border-[#E5E7EB] bg-white text-[11px] font-semibold text-[#475569] inline-flex items-center justify-center gap-1.5 hover:bg-[#F8FAFC]"
          >
            <RefreshCw className="h-3.5 w-3.5 text-[#7C3AED]" />
            Sync calendar
            <ExternalLink className="h-3 w-3 text-[#94A3B8]" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-2.5">
        <div className="flex flex-wrap items-center gap-3 text-[10px] text-[#64748B]">
          <span className="font-semibold text-[#475569]">Priority:</span>
          <span className="inline-flex items-center gap-1"><ChevronsUp className="h-3.5 w-3.5 text-[#EF4444]" strokeWidth={2.5} /> High</span>
          <span className="inline-flex items-center gap-1"><ChevronUp className="h-3.5 w-3.5 text-[#F59E0B]" strokeWidth={2.5} /> Medium</span>
          <span className="inline-flex items-center gap-1"><ChevronDown className="h-3.5 w-3.5 text-[#10B981]" strokeWidth={2.5} /> Low</span>
          <span className="inline-flex items-center gap-1">
            <span className="h-3.5 w-3.5 rounded-full border border-[#CBD5E1] flex items-center justify-center">
              <Minus className="h-2 w-2 text-[#94A3B8]" />
            </span>
            None
          </span>
        </div>
        <div className="h-3 w-px bg-[#E5E7EB] hidden sm:block" />
        <div className="flex flex-wrap items-center gap-3 text-[10px] text-[#64748B]">
          <span className="font-semibold text-[#475569]">Projects:</span>
          {[
            { l: "Performance Review Cycle", c: "#7C3AED" },
            { l: "Southern Africa Expansion", c: "#A78BFA" },
            { l: "ISO 27001 Readiness", c: "#2563EB" },
            { l: "Sustainable Growth", c: "#10B981" },
            { l: "General / Admin", c: "#6B7280" },
          ].map((p) => (
            <span key={p.l} className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.c }} />
              {p.l}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Teams workspace tab (matched to client crop)                        */
/* ------------------------------------------------------------------ */

type TeamCardData = {
  id: string
  name: string
  status: "On Track" | "Over capacity"
  lead: string
  leadSrc: string
  members: number
  activeTasks: number
  capacity: number
  avatars: string[]
  extra: number
  statusCounts: { on: number; risk: number; off: number; none: number }
  projects: string[]
  nextDue: string
  nextProject: string
}

const teamCards: TeamCardData[] = [
  {
    id: "tm-1",
    name: "Commercial Growth",
    status: "On Track",
    lead: "Rumbidzai Chaza",
    leadSrc: PM_PHOTOS.rumbidzai,
    members: 8,
    activeTasks: 14,
    capacity: 82,
    avatars: [PM_PHOTOS.rumbidzai, PM_PHOTOS.nyasha, PM_PHOTOS.tawanda, PM_PHOTOS.farai],
    extra: 4,
    statusCounts: { on: 9, risk: 3, off: 1, none: 1 },
    projects: ["Southern Africa Expansion", "Customer Success Playbook"],
    nextDue: "18 Jul",
    nextProject: "Campaign launch",
  },
  {
    id: "tm-2",
    name: "People & Culture",
    status: "Over capacity",
    lead: "Memory Sibanda",
    leadSrc: PM_PHOTOS.chipo,
    members: 6,
    activeTasks: 18,
    capacity: 91,
    avatars: [PM_PHOTOS.chipo, PM_PHOTOS.rudo, PM_PHOTOS.blessing, PM_PHOTOS.nyasha],
    extra: 2,
    statusCounts: { on: 8, risk: 5, off: 3, none: 2 },
    projects: ["Performance Review Cycle", "Leadership Framework"],
    nextDue: "22 Jul",
    nextProject: "Calibration pack",
  },
  {
    id: "tm-3",
    name: "Digital Experience",
    status: "On Track",
    lead: "Nyasha Dube",
    leadSrc: PM_PHOTOS.nyasha,
    members: 7,
    activeTasks: 14,
    capacity: 74,
    avatars: [PM_PHOTOS.nyasha, PM_PHOTOS.tendai, PM_PHOTOS.admin, PM_PHOTOS.tawanda],
    extra: 3,
    statusCounts: { on: 10, risk: 2, off: 1, none: 1 },
    projects: ["Digital Adoption Drive", "Data Platform Migration"],
    nextDue: "24 Jul",
    nextProject: "Training wave",
  },
  {
    id: "tm-4",
    name: "Risk & Controls",
    status: "On Track",
    lead: "Farai Muchengeti",
    leadSrc: PM_PHOTOS.farai,
    members: 5,
    activeTasks: 12,
    capacity: 68,
    avatars: [PM_PHOTOS.farai, PM_PHOTOS.tendai, PM_PHOTOS.admin, PM_PHOTOS.rumbidzai],
    extra: 1,
    statusCounts: { on: 8, risk: 2, off: 0, none: 2 },
    projects: ["ISO 27001 Readiness", "Compliance Training"],
    nextDue: "28 Jul",
    nextProject: "Evidence pack",
  },
  {
    id: "tm-5",
    name: "Finance Operations",
    status: "On Track",
    lead: "Tatenda Mlambo",
    leadSrc: pmPhoto(21),
    members: 9,
    activeTasks: 16,
    capacity: 79,
    avatars: [pmPhoto(21), PM_PHOTOS.farai, PM_PHOTOS.tariro, PM_PHOTOS.tawanda],
    extra: 5,
    statusCounts: { on: 11, risk: 3, off: 1, none: 1 },
    projects: ["FY2026 Revenue Forecast", "Executive Scorecard"],
    nextDue: "30 Jul",
    nextProject: "Board pack draft",
  },
  {
    id: "tm-6",
    name: "Customer Success",
    status: "Over capacity",
    lead: "Tendai Nyathi",
    leadSrc: PM_PHOTOS.tendai,
    members: 8,
    activeTasks: 21,
    capacity: 96,
    avatars: [PM_PHOTOS.tendai, PM_PHOTOS.nyasha, PM_PHOTOS.blessing, PM_PHOTOS.rudo],
    extra: 4,
    statusCounts: { on: 7, risk: 6, off: 5, none: 3 },
    projects: ["Customer NPS Uplift", "Success Playbook"],
    nextDue: "16 Jul",
    nextProject: "NPS recovery plan",
  },
]

const workloadRows = [
  { name: "Rumbidzai Chaza", src: PM_PHOTOS.rumbidzai, role: "Team lead · Commercial", assigned: 7, dueWeek: 3, hours: "28.5h", capacity: 88, avail: "Good" as const },
  { name: "Memory Sibanda", src: PM_PHOTOS.chipo, role: "Team lead · People", assigned: 9, dueWeek: 5, hours: "36.0h", capacity: 112, avail: "Over capacity" as const },
  { name: "Nyasha Dube", src: PM_PHOTOS.nyasha, role: "Team lead · Digital", assigned: 6, dueWeek: 2, hours: "24.0h", capacity: 75, avail: "Good" as const },
  { name: "Farai Muchengeti", src: PM_PHOTOS.farai, role: "Team lead · Risk", assigned: 5, dueWeek: 2, hours: "22.0h", capacity: 68, avail: "Good" as const },
  { name: "Tendai Nyathi", src: PM_PHOTOS.tendai, role: "Senior analyst · CS", assigned: 8, dueWeek: 4, hours: "34.5h", capacity: 108, avail: "Over capacity" as const },
  { name: "Tawanda Moyo", src: PM_PHOTOS.tawanda, role: "Analyst · Commercial", assigned: 4, dueWeek: 1, hours: "18.0h", capacity: 56, avail: "Good" as const },
]

const capacityByTeam = [
  { name: "Commercial", pct: 82 },
  { name: "People", pct: 91 },
  { name: "Digital", pct: 74 },
  { name: "Risk", pct: 68 },
  { name: "Finance", pct: 79 },
  { name: "CS", pct: 96 },
]

const peopleNeedingAttention = [
  { name: "Memory Sibanda", team: "People & Culture", pct: 112, src: PM_PHOTOS.chipo },
  { name: "Tendai Nyathi", team: "Customer Success", pct: 108, src: PM_PHOTOS.tendai },
  { name: "Chipo Mhlanga", team: "People & Culture", pct: 104, src: PM_PHOTOS.rudo },
  { name: "Blessing Ncube", team: "Customer Success", pct: 101, src: PM_PHOTOS.blessing },
]

const upcomingLeave = [
  { name: "Nyasha Dube", team: "Digital Experience", range: "21–25 Jul", days: "5 days", src: PM_PHOTOS.nyasha },
  { name: "Farai Muchengeti", team: "Risk & Controls", range: "28–29 Jul", days: "2 days", src: PM_PHOTOS.farai },
  { name: "Tariro Ncube", team: "Finance Operations", range: "4–8 Aug", days: "5 days", src: PM_PHOTOS.tariro },
]

const unassignedTasks = [
  { title: "Draft partner outreach list", project: "Southern Africa Expansion" },
  { title: "Update competency rubric", project: "Leadership Framework" },
  { title: "Schedule control walkthrough", project: "ISO 27001 Readiness" },
  { title: "Prep NPS recovery workshop", project: "Customer NPS Uplift" },
]

function TeamStatusPill({ status }: { status: "On Track" | "Over capacity" }) {
  const ok = status === "On Track"
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 h-[18px] px-2 rounded-full text-[9px] font-bold shrink-0 whitespace-nowrap",
        ok ? "bg-[#ECFDF5] text-[#059669]" : "bg-[#FEF2F2] text-[#DC2626]"
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", ok ? "bg-[#22C55E]" : "bg-[#EF4444]")} />
      {status}
    </span>
  )
}

function SegmentedTaskBar({ counts }: { counts: { on: number; risk: number; off: number; none: number } }) {
  const total = Math.max(counts.on + counts.risk + counts.off + counts.none, 1)
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[9px] font-semibold">
        <span className="text-[#059669]">{counts.on} On Track</span>
        <span className="text-[#D97706]">{counts.risk} At Risk</span>
        <span className="text-[#EF4444]">{counts.off} Off Track</span>
        <span className="text-[#94A3B8]">{counts.none} Not Started</span>
      </div>
      <div className="h-1.5 w-full rounded-full overflow-hidden flex bg-[#F1F5F9]">
        <div className="h-full bg-[#22C55E]" style={{ width: `${(counts.on / total) * 100}%` }} />
        <div className="h-full bg-[#F59E0B]" style={{ width: `${(counts.risk / total) * 100}%` }} />
        <div className="h-full bg-[#EF4444]" style={{ width: `${(counts.off / total) * 100}%` }} />
        <div className="h-full bg-[#CBD5E1]" style={{ width: `${(counts.none / total) * 100}%` }} />
      </div>
    </div>
  )
}

function CapacityBarChart() {
  const max = 150
  return (
    <div className="relative h-[140px] pt-4 pb-5">
      {/* Y labels */}
      <div className="absolute left-0 top-0 bottom-5 w-7 flex flex-col justify-between text-[8px] text-[#94A3B8] font-medium">
        <span>150%</span>
        <span>100%</span>
        <span>50%</span>
        <span>0%</span>
      </div>
      <div className="ml-8 h-full relative border-l border-b border-[#E5E7EB]">
        {/* Optimal 80% line */}
        <div className="absolute left-0 right-0 border-t border-dashed border-[#C4B5FD]" style={{ bottom: `${(80 / max) * 100}%` }}>
          <span className="absolute -top-3.5 right-0 text-[8px] font-semibold text-[#7C3AED] bg-white px-0.5">Optimal 80%</span>
        </div>
        <div className="absolute inset-0 flex items-end justify-around px-1 gap-1">
          {capacityByTeam.map((t) => (
            <div key={t.name} className="flex-1 flex flex-col items-center justify-end h-full max-w-[28px]">
              <div
                className="w-full rounded-t-sm bg-[#7C3AED]"
                style={{ height: `${Math.min((t.pct / max) * 100, 100)}%` }}
                title={`${t.name}: ${t.pct}%`}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="ml-8 flex justify-around gap-1 mt-1">
        {capacityByTeam.map((t) => (
          <span key={t.name} className="flex-1 text-center text-[7.5px] text-[#94A3B8] font-medium truncate max-w-[28px]">
            {t.name}
          </span>
        ))}
      </div>
    </div>
  )
}

function TeamsWorkspaceTab() {
  const [search, setSearch] = useState("")
  const [dept, setDept] = useState("Department")
  const [leadF, setLeadF] = useState("Team lead")
  const [availF, setAvailF] = useState("Availability")
  const [skillF, setSkillF] = useState("Skill")
  const [viewMode, setViewMode] = useState<"cards" | "directory">("cards")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState("Show 10 per page")

  const filteredTeams = useMemo(() => {
    return teamCards.filter((t) => {
      const q = search.trim().toLowerCase()
      if (q && !t.name.toLowerCase().includes(q) && !t.lead.toLowerCase().includes(q)) return false
      if (leadF !== "Team lead" && t.lead !== leadF) return false
      if (availF === "Over capacity" && t.status !== "Over capacity") return false
      if (availF === "On Track" && t.status !== "On Track") return false
      if (dept === "Commercial" && !t.name.includes("Commercial") && !t.name.includes("Customer")) return false
      if (dept === "HR" && !t.name.includes("People")) return false
      if (dept === "IT" && !t.name.includes("Digital")) return false
      if (dept === "Risk" && !t.name.includes("Risk")) return false
      if (dept === "Finance" && !t.name.includes("Finance")) return false
      return true
    })
  }, [search, leadF, availF, dept])

  const filteredWorkload = useMemo(() => {
    return workloadRows.filter((r) => {
      const q = search.trim().toLowerCase()
      if (q && !r.name.toLowerCase().includes(q) && !r.role.toLowerCase().includes(q)) return false
      if (availF === "Over capacity" && r.avail !== "Over capacity") return false
      if (availF === "Good" && r.avail !== "Good") return false
      return true
    })
  }, [search, availF])

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_280px] gap-4 items-start">
      <div className="space-y-3.5 min-w-0">
        <div>
          <h2 className="text-[16px] font-bold text-[#0F172A] tracking-tight">Teams</h2>
          <p className="text-[11px] text-[#64748B] mt-0.5">Manage capacity, ownership and delivery across teams.</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Active teams", value: "8", icon: Users, bg: "#F5F3FF", color: "#7C3AED" },
            { label: "Team members", value: "64", icon: User, bg: "#F5F3FF", color: "#7C3AED" },
          ].map((m) => (
            <div key={m.label} className="rounded-xl border border-[#E9EDF3] bg-white px-3.5 py-3 flex items-center gap-3">
              <span className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: m.bg }}>
                <m.icon className="h-[18px] w-[18px]" style={{ color: m.color }} strokeWidth={1.75} />
              </span>
              <span className="leading-tight min-w-0">
                <span className="block text-[10px] text-[#94A3B8] font-medium truncate">{m.label}</span>
                <span className="block text-[18px] font-extrabold text-[#0F172A]">{m.value}</span>
              </span>
            </div>
          ))}
          <div className="rounded-xl border border-[#E9EDF3] bg-white px-3.5 py-3 flex items-center gap-3">
            <MiniDonut pct={78} size={30} stroke={4.5} />
            <span className="leading-tight min-w-0">
              <span className="block text-[10px] text-[#94A3B8] font-medium truncate">Capacity used</span>
              <span className="block text-[18px] font-extrabold text-[#0F172A]">78%</span>
            </span>
          </div>
          <div className="rounded-xl border border-[#E9EDF3] bg-white px-3.5 py-3 flex items-center gap-3">
            <span className="h-9 w-9 rounded-lg bg-[#FEF2F2] flex items-center justify-center shrink-0">
              <ShieldAlert className="h-[18px] w-[18px] text-[#EF4444]" strokeWidth={1.75} />
            </span>
            <span className="leading-tight min-w-0">
              <span className="block text-[10px] text-[#94A3B8] font-medium truncate">Overallocated</span>
              <span className="block text-[18px] font-extrabold text-[#EF4444]">5</span>
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#94A3B8]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search teams or people..."
              className="h-8 w-[180px] rounded-lg border border-[#E5E7EB] bg-white pl-8 pr-2.5 text-[11px] outline-none focus:border-[#7C3AED] placeholder:text-[#94A3B8]"
            />
          </div>
          <PmFilterSelect value={dept} onChange={setDept} options={["Department", "Commercial", "HR", "IT", "Risk", "Finance"]} />
          <PmFilterSelect value={leadF} onChange={setLeadF} options={["Team lead", ...teamCards.map((t) => t.lead)]} />
          <PmFilterSelect value={availF} onChange={setAvailF} options={["Availability", "Good", "On Track", "Over capacity"]} />
          <PmFilterSelect value={skillF} onChange={setSkillF} options={["Skill", "Strategy", "Delivery", "Risk", "People"]} />
          <div className="ml-auto inline-flex items-center rounded-lg border border-[#E5E7EB] bg-white p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={cn(
                "h-7 px-2.5 rounded-md text-[11px] font-semibold flex items-center gap-1.5",
                viewMode === "cards" ? "bg-[#7C3AED] text-white" : "text-[#64748B]"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode("directory")}
              className={cn(
                "h-7 px-2.5 rounded-md text-[11px] font-semibold flex items-center gap-1.5",
                viewMode === "directory" ? "bg-[#7C3AED] text-white" : "text-[#64748B]"
              )}
            >
              <List className="h-3.5 w-3.5" /> Directory
            </button>
          </div>
        </div>

        {/* Team cards */}
        {viewMode === "cards" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredTeams.map((t) => (
              <div key={t.id} className="rounded-xl border border-[#E9EDF3] bg-white p-3.5 flex flex-col gap-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-[13px] font-bold text-[#0F172A] leading-snug">{t.name}</h3>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <img src={t.leadSrc} alt="" className="h-5 w-5 rounded-full object-cover" referrerPolicy="no-referrer" />
                      <span className="text-[10px] text-[#64748B]">
                        Lead: <span className="font-semibold text-[#0F172A]">{t.lead}</span>
                      </span>
                    </div>
                  </div>
                  <TeamStatusPill status={t.status} />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center">
                    {t.avatars.map((src, i) => (
                      <img
                        key={src + i}
                        src={src}
                        alt=""
                        className={cn("h-6 w-6 rounded-full object-cover ring-2 ring-white", i > 0 && "-ml-1.5")}
                        referrerPolicy="no-referrer"
                      />
                    ))}
                    <span className="h-6 w-6 rounded-full bg-[#F5F3FF] text-[#7C3AED] text-[8.5px] font-bold flex items-center justify-center ring-2 ring-white -ml-1.5">
                      +{t.extra}
                    </span>
                  </div>
                  <div className="text-right text-[10px] text-[#64748B] leading-snug shrink-0">
                    <p><span className="font-bold text-[#0F172A]">{t.members}</span> members</p>
                    <p><span className="font-bold text-[#0F172A]">{t.activeTasks}</span> active tasks</p>
                    <p><span className={cn("font-bold", t.capacity >= 90 ? "text-[#EF4444]" : "text-[#0F172A]")}>{t.capacity}%</span> capacity</p>
                  </div>
                </div>

                <SegmentedTaskBar counts={t.statusCounts} />

                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <div>
                    <p className="text-[9px] text-[#94A3B8] font-medium mb-1">Current projects</p>
                    <ul className="space-y-1">
                      {t.projects.map((p) => (
                        <li key={p} className="flex items-start gap-1.5 text-[10px] font-semibold text-[#0F172A] leading-snug">
                          <FolderKanban className="h-3 w-3 text-[#7C3AED] shrink-0 mt-0.5" />
                          <span className="truncate">{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[9px] text-[#94A3B8] font-medium mb-1">Next due</p>
                    <p className="text-[10px] font-bold text-[#0F172A]">{t.nextDue}</p>
                    <p className="text-[10px] text-[#64748B] mt-0.5 leading-snug">{t.nextProject}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toast("Open team", { description: `${t.name} board opens here.` })}
                  className="mt-auto pt-2.5 border-t border-[#F1F5F9] text-[11px] font-semibold text-[#7C3AED] inline-flex items-center gap-1 hover:underline"
                >
                  Open team <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {filteredTeams.length === 0 && (
              <p className="col-span-full text-[11px] text-[#94A3B8] py-6 text-center">No teams match the current filters.</p>
            )}
          </div>
        )}

        {viewMode === "directory" && (
          <div className="rounded-xl border border-[#E9EDF3] bg-white divide-y divide-[#F1F5F9] overflow-hidden">
            {filteredTeams.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => toast("Open team", { description: t.name })}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left hover:bg-[#FAFAFB]"
              >
                <img src={t.leadSrc} alt="" className="h-8 w-8 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                <span className="flex-1 min-w-0">
                  <span className="block text-[11.5px] font-bold text-[#0F172A] truncate">{t.name}</span>
                  <span className="block text-[10px] text-[#94A3B8] truncate">Lead: {t.lead} · {t.members} members</span>
                </span>
                <span className={cn("text-[11px] font-bold w-12 text-right", t.capacity >= 90 ? "text-[#EF4444]" : "text-[#0F172A]")}>{t.capacity}%</span>
                <TeamStatusPill status={t.status} />
                <ChevronRight className="h-3.5 w-3.5 text-[#CBD5E1]" />
              </button>
            ))}
          </div>
        )}

        {/* Workload overview */}
        <div className="rounded-xl border border-[#E9EDF3] bg-white overflow-hidden">
          <div className="px-3.5 py-2.5 border-b border-[#F1F5F9]">
            <h3 className="text-[13px] font-bold text-[#0F172A]">Workload overview</h3>
            <p className="text-[10px] text-[#94A3B8] mt-0.5">Member capacity and availability for this period.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[720px]">
              <thead>
                <tr className="bg-[#FAFAFB] text-[9.5px] font-bold uppercase tracking-wide text-[#94A3B8] border-b border-[#F1F5F9]">
                  <th className="px-3.5 py-2 font-semibold">Member</th>
                  <th className="px-3 py-2 font-semibold">Role</th>
                  <th className="px-3 py-2 font-semibold text-right">Assigned tasks</th>
                  <th className="px-3 py-2 font-semibold text-right">Due this week</th>
                  <th className="px-3 py-2 font-semibold text-right">Logged hours</th>
                  <th className="px-3 py-2 font-semibold text-right">Capacity</th>
                  <th className="px-3.5 py-2 font-semibold">Availability</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkload.map((r) => (
                  <tr key={r.name} className="border-b border-[#F8FAFC] last:border-0">
                    <td className="px-3.5 py-2.5">
                      <div className="flex items-center gap-2">
                        <img src={r.src} alt="" className="h-7 w-7 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                        <span className="text-[11px] font-semibold text-[#0F172A]">{r.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-[10.5px] text-[#64748B]">{r.role}</td>
                    <td className="px-3 py-2.5 text-[11px] font-bold text-[#0F172A] text-right">{r.assigned}</td>
                    <td className="px-3 py-2.5 text-[11px] font-semibold text-[#0F172A] text-right">{r.dueWeek}</td>
                    <td className="px-3 py-2.5 text-[11px] text-[#64748B] text-right">{r.hours}</td>
                    <td className={cn("px-3 py-2.5 text-[11px] font-extrabold text-right", r.capacity > 100 ? "text-[#EF4444]" : "text-[#0F172A]")}>
                      {r.capacity}%
                    </td>
                    <td className="px-3.5 py-2.5">
                      <span
                        className={cn(
                          "inline-flex h-[18px] items-center px-2 rounded-full text-[9px] font-bold",
                          r.avail === "Good" ? "bg-[#ECFDF5] text-[#059669]" : "bg-[#FEF2F2] text-[#DC2626]"
                        )}
                      >
                        {r.avail}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 border-t border-[#F1F5F9]">
            <span className="text-[10px] text-[#94A3B8]">1–6 of 64</span>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setPage(1)} className="h-7 w-7 rounded-lg border border-[#E5E7EB] bg-white flex items-center justify-center text-[#94A3B8]">
                <ChevronsLeft className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} className="h-7 w-7 rounded-lg border border-[#E5E7EB] bg-white flex items-center justify-center text-[#94A3B8]">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {[1, 2].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  className={cn(
                    "h-7 w-7 rounded-lg text-[11px] font-bold flex items-center justify-center border",
                    page === n ? "bg-[#7C3AED] border-[#7C3AED] text-white" : "border-[#E5E7EB] bg-white text-[#475569]"
                  )}
                >
                  {n}
                </button>
              ))}
              <button type="button" onClick={() => setPage((p) => Math.min(2, p + 1))} className="h-7 w-7 rounded-lg border border-[#E5E7EB] bg-white flex items-center justify-center text-[#94A3B8]">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={() => setPage(2)} className="h-7 w-7 rounded-lg border border-[#E5E7EB] bg-white flex items-center justify-center text-[#94A3B8]">
                <ChevronsRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <PmFilterSelect value={pageSize} onChange={setPageSize} options={["Show 10 per page", "Show 20 per page"]} className="h-7" />
          </div>
        </div>
      </div>

      {/* Right sidebar */}
      <div className="space-y-3.5">
        <div className="rounded-xl border border-[#E9EDF3] bg-white p-3.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[12.5px] font-bold text-[#0F172A]">Capacity by team</span>
            <button type="button" onClick={() => toast("Capacity chart options")} className="text-[#94A3B8]">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
          <CapacityBarChart />
        </div>

        <div className="rounded-xl border border-[#E9EDF3] bg-white p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12.5px] font-bold text-[#0F172A]">People needing attention</span>
            <button type="button" onClick={() => toast("Attention list", { description: "Full overallocation list." })} className="text-[10px] font-semibold text-[#7C3AED] hover:underline">
              View all
            </button>
          </div>
          <div className="space-y-2">
            {peopleNeedingAttention.map((p) => (
              <div key={p.name} className="flex items-center gap-2.5">
                <img src={p.src} alt="" className="h-8 w-8 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                <div className="flex-1 min-w-0 leading-tight">
                  <p className="text-[10.5px] font-bold text-[#0F172A] truncate">{p.name}</p>
                  <p className="text-[9.5px] text-[#94A3B8] truncate">{p.team}</p>
                </div>
                <span className="text-[11px] font-extrabold text-[#EF4444] shrink-0">{p.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[#E9EDF3] bg-white p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12.5px] font-bold text-[#0F172A]">Upcoming leave</span>
            <button type="button" onClick={() => toast("Leave calendar")} className="text-[10px] font-semibold text-[#7C3AED] hover:underline">
              View all
            </button>
          </div>
          <div className="space-y-2.5">
            {upcomingLeave.map((l) => (
              <div key={l.name} className="flex items-center gap-2.5">
                <img src={l.src} alt="" className="h-8 w-8 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                <div className="flex-1 min-w-0 leading-tight">
                  <p className="text-[10.5px] font-bold text-[#0F172A] truncate">{l.name}</p>
                  <p className="text-[9.5px] text-[#94A3B8] truncate">{l.team} · {l.range}</p>
                </div>
                <span className="h-5 px-1.5 rounded-md bg-[#EFF6FF] text-[#2563EB] text-[9px] font-bold shrink-0 inline-flex items-center">
                  {l.days}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[#E9EDF3] bg-white p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-[#0F172A]">
              Unassigned tasks
              <span className="h-4 min-w-4 px-1 rounded-full bg-[#7C3AED] text-white text-[9px] font-bold flex items-center justify-center">4</span>
            </span>
          </div>
          <div className="space-y-2">
            {unassignedTasks.map((u) => (
              <div key={u.title} className="leading-tight">
                <p className="text-[10.5px] font-semibold text-[#0F172A] truncate">{u.title}</p>
                <p className="text-[9.5px] text-[#94A3B8] truncate">{u.project}</p>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => toast("Assign tasks", { description: "Open the unassigned queue." })}
            className="mt-3 text-[11px] font-semibold text-[#7C3AED] inline-flex items-center gap-1 hover:underline"
          >
            View and assign <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

function ProjectsPortfolioTab() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [dept, setDept] = useState("Department")
  const [ownerF, setOwnerF] = useState("Owner")
  const [healthF, setHealthF] = useState("Health")
  const [goalF, setGoalF] = useState("Linked goal")
  const [sortF, setSortF] = useState("Sort")
  const [viewMode, setViewMode] = useState<"grid" | "list" | "timeline">("grid")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState("10 / page")

  const filteredProjects = useMemo(() => {
    let rows = allProjects.filter((p) => {
      if (search.trim() && !p.name.toLowerCase().includes(search.toLowerCase())) return false
      if (dept !== "Department" && p.dept !== dept) return false
      if (ownerF !== "Owner" && p.owner !== ownerF) return false
      if (healthF !== "Health" && p.health !== healthF) return false
      if (goalF !== "Linked goal" && p.goal !== goalF) return false
      return true
    })
    if (sortF === "Completion") rows = [...rows].sort((a, b) => b.pct - a.pct)
    if (sortF === "Name") rows = [...rows].sort((a, b) => a.name.localeCompare(b.name))
    return rows
  }, [search, dept, ownerF, healthF, goalF, sortF])

  const filtering = search.trim() !== "" || dept !== "Department" || ownerF !== "Owner" || healthF !== "Health" || goalF !== "Linked goal"
  const pageRows = filtering ? filteredProjects : page === 1 ? filteredProjects.slice(0, 6) : filteredProjects.slice(6)

  const openProject = (id?: string) => {
    if (id) router.push(`/performance/tasks/projects/${id}`)
    else toast("Project workspace", { description: "Opens the project delivery space." })
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_292px] gap-4 items-start">
      {/* ------------------------- Main column ------------------------- */}
      <div className="space-y-3.5 min-w-0">
        <div>
          <h2 className="text-[16px] font-bold text-[#0F172A] tracking-tight">Projects</h2>
          <p className="text-[11px] text-[#64748B] mt-0.5">Organise work into goal-aligned delivery spaces.</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Active projects", value: "12", icon: FolderKanban, bg: "#F5F3FF", color: "#7C3AED" },
            { label: "At risk", value: "3", icon: ShieldAlert, bg: "#FEF2F2", color: "#EF4444" },
            { label: "Due this month", value: "5", icon: Calendar, bg: "#F5F3FF", color: "#7C3AED" },
          ].map((m) => (
            <div key={m.label} className="rounded-xl border border-[#E9EDF3] bg-white px-3.5 py-3 flex items-center gap-3">
              <span className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: m.bg }}>
                <m.icon className="h-[18px] w-[18px]" style={{ color: m.color }} strokeWidth={1.75} />
              </span>
              <span className="leading-tight min-w-0">
                <span className="block text-[10px] text-[#94A3B8] font-medium truncate">{m.label}</span>
                <span className="block text-[18px] font-extrabold text-[#0F172A]">{m.value}</span>
              </span>
            </div>
          ))}
          <div className="rounded-xl border border-[#E9EDF3] bg-white px-3.5 py-3 flex items-center gap-3">
            <MiniDonut pct={64} size={30} stroke={4.5} />
            <span className="leading-tight min-w-0">
              <span className="block text-[10px] text-[#94A3B8] font-medium truncate">Average completion</span>
              <span className="block text-[18px] font-extrabold text-[#0F172A]">64%</span>
            </span>
          </div>
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#94A3B8]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="h-8 w-[150px] rounded-lg border border-[#E5E7EB] bg-white pl-8 pr-2.5 text-[11px] outline-none focus:border-[#7C3AED] placeholder:text-[#94A3B8]"
            />
          </div>
          <PmFilterSelect value={dept} onChange={setDept} options={["Department", "Sales & Marketing", "Strategy Office", "HR", "Finance", "IT"]} />
          <PmFilterSelect value={ownerF} onChange={setOwnerF} options={["Owner", "Nyasha Moyo", "Tatenda Mlambo", "Farai Muchenyezi", "Rumbidzai Choza", "Tendai Dube"]} />
          <PmFilterSelect value={healthF} onChange={setHealthF} options={["Health", "On Track", "At Risk"]} />
          <PmFilterSelect value={goalF} onChange={setGoalF} options={["Linked goal", "Sustainable growth", "Win 12 enterprise accounts", "Expand Southern Africa", "Drive digital adoption"]} />
          <PmFilterSelect value={sortF} onChange={setSortF} options={["Sort", "Due date", "Completion", "Name"]} />
          <div className="ml-auto inline-flex items-center rounded-lg border border-[#E5E7EB] bg-white p-0.5">
            {(
              [
                { id: "grid" as const, label: "Grid", icon: LayoutGrid },
                { id: "list" as const, label: "List", icon: List },
                { id: "timeline" as const, label: "Timeline", icon: CalendarRange },
              ]
            ).map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setViewMode(v.id)}
                className={cn(
                  "h-7 px-2.5 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition-colors",
                  viewMode === v.id ? "bg-[#F5F3FF] text-[#7C3AED]" : "text-[#64748B] hover:text-[#0F172A]"
                )}
              >
                <v.icon className="h-3.5 w-3.5" /> {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pinned projects */}
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#0F172A]">
            <Pin className="h-3.5 w-3.5 text-[#475569]" /> Pinned projects
          </span>
          <span className="text-[10px] text-[#94A3B8] font-medium">3 pinned</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {pinnedProjects.map((p) => (
            <div key={p.id} className="rounded-2xl border border-[#E4DCFB] bg-[#FBFAFF] p-3.5 flex flex-col gap-2.5">
              <div className="flex items-start justify-between gap-1.5">
                <h3 className="text-[13px] font-bold text-[#0F172A] leading-snug">{p.name}</h3>
                <div className="flex items-center gap-1 shrink-0">
                  <HealthPill health={p.health} />
                  <button type="button" onClick={() => toast("Project actions", { description: p.name })} className="text-[#94A3B8] hover:text-[#475569]">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <GoalChip goal={p.goal} />
              <div className="flex items-end justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[16px] font-extrabold text-[#0F172A] leading-none">{p.pct}%</p>
                  <p className="text-[9px] text-[#94A3B8] mt-0.5 mb-1.5">completion</p>
                  <div className="h-1.5 w-full max-w-[110px] rounded-full bg-[#EDE9FE] overflow-hidden">
                    <div className="h-full rounded-full bg-[#7C3AED]" style={{ width: `${p.pct}%` }} />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] leading-tight">
                    <span className="font-extrabold text-[#0F172A]">{p.done} / {p.total}</span>{" "}
                    <span className="text-[#94A3B8]">tasks</span>
                  </p>
                  <p className="text-[10px] text-[#64748B] mt-1 inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-[#94A3B8]" /> due {p.due}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AvatarStack initials={p.team} extra={p.extra} />
                <p className="text-[10px] text-[#64748B] truncate">
                  Lead: <span className="font-semibold text-[#0F172A]">{p.lead}</span>
                </p>
              </div>
              <div className="border-t border-[#EDE9FE] pt-2">
                <p className="text-[9px] text-[#94A3B8] font-medium">Next milestone</p>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <p className="text-[10.5px] font-semibold text-[#0F172A] truncate">{p.next}</p>
                  <p className="text-[10px] text-[#64748B] inline-flex items-center gap-1 shrink-0">
                    <Calendar className="h-3 w-3 text-[#94A3B8]" /> {p.nextDate}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => openProject(p.id)}
                className="h-8 w-full rounded-full border border-[#C4B5FD] bg-white text-[11px] font-semibold text-[#7C3AED] hover:bg-[#F5F3FF] transition-colors"
              >
                Open project
              </button>
            </div>
          ))}
        </div>

        {/* All projects */}
        <h3 className="text-[12px] font-bold text-[#0F172A]">All projects</h3>

        {viewMode === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {pageRows.map((p) => (
              <div key={p.name} className="rounded-xl border border-[#E9EDF3] bg-white p-3 flex flex-col gap-2 hover:shadow-md transition-shadow cursor-pointer" onClick={() => openProject()}>
                <div className="flex items-start justify-between gap-1.5">
                  <h4 className="text-[11.5px] font-bold text-[#0F172A] leading-snug">{p.name}</h4>
                  <div className="flex items-center gap-1 shrink-0">
                    <HealthPill health={p.health} />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        toast("Project actions", { description: p.name })
                      }}
                      className="text-[#94A3B8] hover:text-[#475569]"
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <GoalChip goal={p.goal} />
                <div className="flex items-center gap-3 text-[10px] text-[#64748B] min-w-0">
                  <span className="inline-flex items-center gap-1 truncate">
                    <Building2 className="h-3 w-3 text-[#94A3B8] shrink-0" /> {p.dept}
                  </span>
                  <span className="inline-flex items-center gap-1 truncate">
                    <User className="h-3 w-3 text-[#94A3B8] shrink-0" /> {p.owner}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <span className="text-[10px]">
                    <span className="font-extrabold text-[#0F172A]">{p.done} / {p.total}</span>{" "}
                    <span className="text-[#94A3B8]">tasks</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MiniDonut pct={p.pct} size={18} stroke={3} />
                    <span className="text-[10px] font-bold text-[#0F172A]">{p.pct}%</span>
                  </span>
                  <span className={cn("text-[10px] inline-flex items-center gap-1", p.overdue ? "text-[#DC2626] font-semibold" : "text-[#64748B]")}>
                    <Calendar className={cn("h-3 w-3", p.overdue ? "text-[#DC2626]" : "text-[#94A3B8]")} /> due {p.due}
                  </span>
                </div>
              </div>
            ))}
            {pageRows.length === 0 && (
              <p className="col-span-full text-[11px] text-[#94A3B8] py-6 text-center">No projects match the current filters.</p>
            )}
          </div>
        )}

        {viewMode === "list" && (
          <div className="rounded-xl border border-[#E9EDF3] bg-white divide-y divide-[#F1F5F9] overflow-hidden">
            {pageRows.map((p) => (
              <button key={p.name} type="button" onClick={() => openProject()} className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left hover:bg-[#FAFAFB] transition-colors">
                <span className="flex-1 min-w-0">
                  <span className="block text-[11.5px] font-bold text-[#0F172A] truncate">{p.name}</span>
                  <span className="block text-[10px] text-[#94A3B8] truncate">{p.dept} · {p.owner}</span>
                </span>
                <span className="hidden sm:flex items-center gap-2 w-32 shrink-0">
                  <div className="h-1.5 flex-1 rounded-full bg-[#EDE9FE] overflow-hidden">
                    <div className="h-full rounded-full bg-[#7C3AED]" style={{ width: `${p.pct}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-[#0F172A]">{p.pct}%</span>
                </span>
                <span className={cn("text-[10px] w-24 text-right shrink-0", p.overdue ? "text-[#DC2626] font-semibold" : "text-[#64748B]")}>{p.due}</span>
                <HealthPill health={p.health} />
                <ChevronRight className="h-3.5 w-3.5 text-[#CBD5E1] shrink-0" />
              </button>
            ))}
          </div>
        )}

        {viewMode === "timeline" && (
          <div className="rounded-xl border border-[#E9EDF3] bg-white p-3.5">
            <div className="grid grid-cols-[140px_repeat(6,1fr)] gap-y-2.5 text-[9px] text-[#94A3B8] font-semibold">
              <span />
              {["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m) => (
                <span key={m} className="text-center">{m}</span>
              ))}
              {pageRows.map((p) => {
                const dueMonth = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].findIndex((m) => p.due.includes(m))
                const span = Math.max(dueMonth + 1, 1)
                return (
                  <div key={p.name} className="contents">
                    <span className="text-[10px] font-semibold text-[#0F172A] truncate pr-2 self-center">{p.name}</span>
                    <div className="col-span-6 self-center">
                      <div
                        className={cn("h-2.5 rounded-full", p.health === "At Risk" ? "bg-[#FCA5A5]" : "bg-[#C4B5FD]")}
                        style={{ width: `${(span / 6) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Footer / pagination */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <span className="text-[10px] text-[#94A3B8]">12 projects</span>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setPage(1)} className="h-7 w-7 rounded-lg border border-[#E5E7EB] bg-white flex items-center justify-center text-[#94A3B8] hover:text-[#475569]">
                <ChevronsLeft className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} className="h-7 w-7 rounded-lg border border-[#E5E7EB] bg-white flex items-center justify-center text-[#94A3B8] hover:text-[#475569]">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {[1, 2].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  className={cn(
                    "h-7 w-7 rounded-lg text-[11px] font-bold flex items-center justify-center border transition-colors",
                    page === n ? "bg-[#7C3AED] border-[#7C3AED] text-white" : "border-[#E5E7EB] bg-white text-[#475569] hover:bg-[#F9FAFB]"
                  )}
                >
                  {n}
                </button>
              ))}
              <button type="button" onClick={() => setPage((p) => Math.min(2, p + 1))} className="h-7 w-7 rounded-lg border border-[#E5E7EB] bg-white flex items-center justify-center text-[#94A3B8] hover:text-[#475569]">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={() => setPage(2)} className="h-7 w-7 rounded-lg border border-[#E5E7EB] bg-white flex items-center justify-center text-[#94A3B8] hover:text-[#475569]">
                <ChevronsRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <PmFilterSelect value={pageSize} onChange={setPageSize} options={["10 / page", "20 / page", "50 / page"]} className="h-7" />
          </div>
        </div>
      </div>

      {/* ------------------------- Right sidebar ------------------------- */}
      <div className="space-y-3.5">
        {/* Portfolio health */}
        <div className="rounded-xl border border-[#E9EDF3] bg-white p-3.5">
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-[#0F172A]">
              Portfolio health
              <button type="button" onClick={() => toast("Portfolio health", { description: "Distribution of active projects by delivery status." })} className="text-[#94A3B8] hover:text-[#475569]">
                <Info className="h-3 w-3" />
              </button>
            </span>
            <button type="button" onClick={() => toast("Portfolio options")} className="text-[#94A3B8] hover:text-[#475569]">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <PortfolioHealthDonut />
            <div className="space-y-2 min-w-0 flex-1">
              {[
                { label: "On Track", val: "6 (50%)", c: "#22C55E" },
                { label: "At Risk", val: "3 (25%)", c: "#F59E0B" },
                { label: "Off Track", val: "1 (8%)", c: "#EF4444" },
                { label: "Not Started", val: "2 (17%)", c: "#8B5CF6" },
              ].map((x) => (
                <div key={x.label} className="flex items-center justify-between gap-2 text-[10px]">
                  <span className="inline-flex items-center gap-1.5 text-[#64748B]">
                    <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: x.c }} />
                    {x.label}
                  </span>
                  <span className="font-bold text-[#0F172A] whitespace-nowrap">{x.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming milestones */}
        <div className="rounded-xl border border-[#E9EDF3] bg-white p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12.5px] font-bold text-[#0F172A]">Upcoming milestones</span>
            <button type="button" onClick={() => toast("Milestones", { description: "Full milestone schedule opens here." })} className="text-[10px] font-semibold text-[#7C3AED] hover:underline">
              View all
            </button>
          </div>
          <div className="divide-y divide-[#F1F5F9]">
            {portfolioMilestones.map((m) => (
              <div key={m.title} className="flex items-center gap-2 py-2 first:pt-1 last:pb-0">
                <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: m.dot }} />
                <div className="flex-1 min-w-0 leading-tight">
                  <p className="text-[10.5px] font-semibold text-[#0F172A] truncate">{m.title}</p>
                  <p className="text-[9.5px] text-[#94A3B8] truncate">{m.project}</p>
                </div>
                <span className={cn("text-[10px] font-semibold whitespace-nowrap shrink-0", m.late ? "text-[#DC2626]" : "text-[#0F172A]")}>{m.date}</span>
                <Calendar className="h-3 w-3 text-[#94A3B8] shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Recently viewed */}
        <div className="rounded-xl border border-[#E9EDF3] bg-white p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12.5px] font-bold text-[#0F172A]">Recently viewed</span>
            <button type="button" onClick={() => toast("Recently viewed", { description: "Your full project history opens here." })} className="text-[10px] font-semibold text-[#7C3AED] hover:underline">
              View all
            </button>
          </div>
          <div className="space-y-1">
            {recentlyViewedProjects.map((r) => (
              <div key={r.name} className="flex items-center gap-2.5 rounded-lg px-1 py-1.5 hover:bg-[#FAFAFB] transition-colors cursor-pointer" onClick={() => openProject(r.id || undefined)}>
                <span className="h-8 w-8 rounded-full bg-[#F5F3FF] flex items-center justify-center shrink-0">
                  <Target className="h-3.5 w-3.5 text-[#7C3AED]" />
                </span>
                <div className="flex-1 min-w-0 leading-tight">
                  <p className="text-[10.5px] font-bold text-[#0F172A] truncate">{r.name}</p>
                  <p className="text-[9.5px] text-[#94A3B8]">{r.sub}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    toast("Project actions", { description: r.name })
                  }}
                  className="text-[#94A3B8] hover:text-[#475569] shrink-0"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function TasksMockScreen() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const wantsCalendar = searchParams.get("view") === "calendar" || searchParams.get("tab") === "calendar"
  const rawTab = (searchParams.get("tab") as HubTab) || "tasks"
  const initialTab: HubTab = wantsCalendar
    ? "tasks"
    : ["overview", "tasks", "projects", "teams", "calendar"].includes(rawTab)
      ? rawTab
      : "tasks"
  const [tab, setTab] = useState<HubTab>(initialTab)
  const [scope, setScope] = useState<"my" | "team">(initialTab === "teams" ? "team" : "my")
  const [view, setView] = useState<"board" | "list" | "calendar">(wantsCalendar ? "calendar" : "board")
  const [projectFilter, setProjectFilter] = useState(hubProjects[0].name)
  const [search, setSearch] = useState("")
  const [bulk, setBulk] = useState(false)

  const filtered = useMemo(() => {
    return hubTasks.filter((t) => {
      if (projectFilter !== "All" && t.project !== projectFilter) return false
      if (search.trim() && !t.title.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [projectFilter, search])

  const setHubTab = (t: HubTab) => {
    if (t === "calendar") {
      setTab("tasks")
      setView("calendar")
      setScope("my")
      router.replace("/performance/tasks?view=calendar")
      return
    }
    setTab(t)
    if (t === "teams") setScope("team")
    if (t === "tasks") setScope("my")
    const url = t === "tasks" ? "/performance/tasks" : `/performance/tasks?tab=${t}`
    router.replace(url)
  }

  const setTaskView = (v: "board" | "list" | "calendar") => {
    setView(v)
    router.replace(v === "calendar" ? "/performance/tasks?view=calendar" : "/performance/tasks")
  }

  const primaryCta =
    tab === "teams"
      ? { label: "Create team", onClick: () => toast.success("Create team", { description: "New team draft opened." }) }
      : tab === "projects"
        ? { label: "New project", onClick: () => router.push("/performance/tasks/new") }
        : tab === "tasks" && view === "calendar"
          ? { label: "New task", onClick: () => router.push("/performance/tasks/new") }
          : { label: "New", onClick: () => router.push("/performance/tasks/new") }

  return (
    <div className="min-h-full bg-[#F8FAFC]">
      <div className="p-4 lg:p-5 space-y-4">
        {/* Custom Header Layout */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#F1F5F9] pb-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
              {tab === "tasks" && view === "calendar" ? "My tasks" : "Tasks & Projects"}
            </h1>
            <p className="mt-1 text-xs text-[#64748B]">
              {tab === "tasks" && view === "calendar"
                ? "Plan your week and protect focus time."
                : "Plan, assign and track work that delivers organisational goals."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* My work / Team work selector */}
            <div className="inline-flex items-center rounded-lg border border-[#E2E8F0] bg-white p-0.5 shadow-sm">
              <button
                type="button"
                onClick={() => setScope("my")}
                className={cn(
                  "h-8 px-4 rounded-lg text-xs font-bold transition-all",
                  scope === "my" ? "bg-[#7C3AED] text-white shadow-sm" : "text-[#475569] hover:bg-[#F9FAFB]"
                )}
              >
                My work
              </button>
              <button
                type="button"
                onClick={() => setScope("team")}
                className={cn(
                  "h-8 px-4 rounded-lg text-xs font-bold transition-all",
                  scope === "team" ? "bg-[#7C3AED] text-white shadow-sm" : "text-[#475569] hover:bg-[#F9FAFB]"
                )}
              >
                Team work
              </button>
            </div>

            {/* Q3 2026 Select Dropdown */}
            <button
              type="button"
              onClick={() => toast.message("Dropdown filter clicked")}
              className="h-8.5 px-3.5 rounded-lg border border-[#E2E8F0] bg-white text-xs font-semibold text-[#475569] flex items-center gap-2 hover:bg-[#F9FAFB] shadow-sm transition-colors cursor-pointer"
            >
              <Calendar className="h-3.5 w-3.5 text-[#94A3B8]" />
              <span>Q3 2026</span>
              <ChevronDown className="h-3.5 w-3.5 text-[#94A3B8] ml-1" />
            </button>

            {/* Primary CTA — Create team on Teams tab */}
            {tab === "teams" ? (
              <button
                type="button"
                onClick={primaryCta.onClick}
                className="h-8.5 px-4 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-xs font-semibold text-white flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{primaryCta.label}</span>
              </button>
            ) : (
              <div className="flex items-center shadow-sm">
                <button
                  type="button"
                  onClick={primaryCta.onClick}
                  className="h-8.5 px-4 rounded-l-full bg-[#7C3AED] hover:bg-[#6D28D9] text-xs font-semibold text-white flex items-center gap-1.5 transition-colors border-r border-[#6D28D9]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{primaryCta.label}</span>
                </button>
                <button
                  type="button"
                  onClick={() => toast.message("Add option dropdown clicked")}
                  className="h-8.5 px-2.5 rounded-r-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white flex items-center justify-center transition-colors"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="flex items-center gap-1 border-b border-[#E2E8F0]">
          {([
            { id: "overview", label: "Overview", icon: LayoutGrid },
            { id: "tasks", label: "My tasks", icon: CheckSquare },
            { id: "projects", label: "Projects", icon: Calendar },
            { id: "teams", label: "Teams", icon: Users },
          ] as const).map((t) => {
            const Icon = t.icon
            const isActive = tab === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setHubTab(t.id as any)}
                className={cn(
                  "px-3 py-2.5 text-xs font-semibold border-b-2 -mb-px flex items-center gap-2 transition-all",
                  isActive
                    ? "border-[#7C3AED] text-[#7C3AED]"
                    : "border-transparent text-[#64748B] hover:text-[#0F172A]"
                )}
              >
                <Icon className={cn("h-3.5 w-3.5", isActive ? "text-[#7C3AED]" : "text-[#94A3B8]")} />
                <span>{t.label}</span>
              </button>
            )
          })}
        </div>

        {tab === "tasks" && view === "calendar" && (
          <MyTasksCalendarView
            tasks={hubTasks}
            search={search}
            setSearch={setSearch}
            view={view}
            setView={setTaskView}
          />
        )}

        {tab === "tasks" && view !== "calendar" && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
            <div className="xl:col-span-9 space-y-4">
              {/* Recent Projects Row */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-extrabold text-[#475569] mr-1">Recent projects:</span>
                
                {/* Chip 1 */}
                <button
                  type="button"
                  onClick={() => setProjectFilter("Southern Africa Expansion")}
                  className={cn(
                    "h-8.5 px-3.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-sm border",
                    projectFilter === "Southern Africa Expansion"
                      ? "bg-[#F5F3FF] border-[#DDD6FE] text-[#7C3AED]"
                      : "bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#F9FAFB]"
                  )}
                >
                  <Building2 className="h-3.5 w-3.5" />
                  <span>Southern Africa Expansion</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>

                {/* Chip 2 */}
                <button
                  type="button"
                  onClick={() => setProjectFilter("Performance Review Cycle")}
                  className={cn(
                    "h-8.5 px-3.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-sm border",
                    projectFilter === "Performance Review Cycle"
                      ? "bg-[#F5F3FF] border-[#DDD6FE] text-[#7C3AED]"
                      : "bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#F9FAFB]"
                  )}
                >
                  <ClipboardCheck className="h-3.5 w-3.5" />
                  <span>Performance Review Cycle</span>
                </button>

                {/* Chip 3 */}
                <button
                  type="button"
                  onClick={() => setProjectFilter("ISO 27001 Readiness")}
                  className={cn(
                    "h-8.5 px-3.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-sm border",
                    projectFilter === "ISO 27001 Readiness"
                      ? "bg-[#F5F3FF] border-[#DDD6FE] text-[#7C3AED]"
                      : "bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#F9FAFB]"
                  )}
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>ISO 27001 Readiness</span>
                </button>

                {/* View all projects */}
                <button
                  type="button"
                  onClick={() => toast.message("Redirecting to all projects...")}
                  className="text-xs font-bold text-[#7C3AED] hover:underline ml-auto flex items-center gap-1"
                >
                  <span>View all projects</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Goal Alignment Banner */}
              <div className="border border-[#E2E8F0] bg-[#FAFAFA]/70 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-3 md:gap-5 flex-1">
                  {/* Company Goal */}
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-[#EEF2FF] border border-[#C7D2FE] text-[#6366F1] flex items-center justify-center shrink-0">
                      <Target className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider block leading-none">Company goal</span>
                      <span className="text-[12.5px] font-bold text-[#0F172A] mt-1.5 block leading-none">Sustainable growth</span>
                    </div>
                  </div>

                  <ChevronRight className="h-4.5 w-4.5 text-[#94A3B8] shrink-0 mx-1 hidden sm:block" />

                  {/* Department Objective */}
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-[#EEF2FF] border border-[#C7D2FE] text-[#6366F1] flex items-center justify-center shrink-0">
                      <Network className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider block leading-none">Department objective</span>
                      <span className="text-[12.5px] font-bold text-[#0F172A] mt-1.5 block leading-none">Expand Southern Africa</span>
                    </div>
                  </div>

                  <ChevronRight className="h-4.5 w-4.5 text-[#94A3B8] shrink-0 mx-1 hidden sm:block" />

                  {/* Individual Goal */}
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-[#EEF2FF] border border-[#C7D2FE] text-[#6366F1] flex items-center justify-center shrink-0">
                      <Target className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider block leading-none">Individual goal</span>
                      <span className="text-[12.5px] font-bold text-[#0F172A] mt-1.5 block leading-none">Win 12 enterprise accounts</span>
                    </div>
                  </div>
                </div>

                {/* Linked Tasks Count & View map button */}
                <div className="flex items-center gap-4 shrink-0 border-t md:border-t-0 md:border-l border-[#E2E8F0] pt-3 md:pt-0 md:pl-4">
                  <div className="text-center pr-2">
                    <span className="text-lg font-black text-[#0F172A] block leading-none">26</span>
                    <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider block mt-1 leading-none">linked tasks</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toast.message("Loading Goal Map...")}
                    className="border border-[#7C3AED] bg-white text-[#7C3AED] hover:bg-[#F5F3FF] text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <Users className="h-3.5 w-3.5" />
                    <span>View goal map</span>
                  </button>
                </div>
              </div>

              {/* Metrics cards row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Active tasks */}
                <PmCard className="p-3.5 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-[#EEF2FF] text-[#6366F1] flex items-center justify-center shrink-0">
                    <List className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-[#64748B] block leading-none">Active tasks</span>
                    <span className="text-xl font-bold text-[#0F172A] mt-1.5 block leading-none">26</span>
                  </div>
                </PmCard>

                {/* Due this week */}
                <PmCard className="p-3.5 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-[#EEF2FF] text-[#6366F1] flex items-center justify-center shrink-0">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-[#64748B] block leading-none">Due this week</span>
                    <span className="text-xl font-bold text-[#0F172A] mt-1.5 block leading-none">8</span>
                  </div>
                </PmCard>

                {/* Overdue */}
                <PmCard className="p-3.5 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-[#FEF2F2] text-[#EF4444] flex items-center justify-center shrink-0">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-[#64748B] block leading-none">Overdue</span>
                    <span className="text-xl font-bold text-[#0F172A] mt-1.5 block leading-none">3</span>
                  </div>
                </PmCard>

                {/* Completion rate */}
                <PmCard className="p-3.5 flex items-center gap-3">
                  <div className="relative h-10 w-10 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 36 36" className="h-9 w-9 -rotate-90">
                      <circle cx="18" cy="18" r="15" fill="none" stroke="#F1F5F9" strokeWidth="3" />
                      <circle
                        cx="18"
                        cy="18"
                        r="15"
                        fill="none"
                        stroke="#7C3AED"
                        strokeWidth="3"
                        strokeDasharray={`${68 * 0.942} 100`}
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-[#64748B] block leading-none">Completion rate</span>
                    <span className="text-xl font-bold text-[#0F172A] mt-1.5 block leading-none">68%</span>
                  </div>
                </PmCard>
              </div>
              {/* Board view filters row */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Search tasks... */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#94A3B8]" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search tasks..."
                    className="w-full h-8.5 pl-9 pr-3 rounded-lg border border-[#E2E8F0] text-xs outline-none focus:border-[#7C3AED] bg-white font-medium text-[#344054]"
                  />
                </div>

                {/* Filter buttons */}
                {["Status", "Priority", "Owner", "Project", "Linked goal"].map((f) => (
                  <button
                    key={f}
                    type="button"
                    className="h-8.5 px-3 rounded-lg border border-[#E2E8F0] bg-white text-xs font-semibold text-[#475569] flex items-center gap-1.5 hover:bg-[#F9FAFB]"
                  >
                    <span>{f}</span>
                    <ChevronDown className="h-3 w-3 text-[#94A3B8]" />
                  </button>
                ))}

                {/* More filters */}
                <button
                  type="button"
                  className="h-8.5 px-3 rounded-lg border border-[#E2E8F0] bg-white text-xs font-semibold text-[#475569] flex items-center gap-1.5 hover:bg-[#F9FAFB]"
                >
                  <Filter className="h-3.5 w-3.5 text-[#94A3B8]" />
                  <span>More filters</span>
                </button>

                {/* Switch view */}
                <div className="inline-flex items-center rounded-lg border border-[#E2E8F0] bg-white p-0.5 shadow-sm ml-auto">
                  <button
                    type="button"
                    onClick={() => setTaskView("board")}
                    className={cn(
                      "h-7 px-3 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all",
                      view === "board"
                        ? "bg-white border border-[#7C3AED] text-[#7C3AED] shadow-xs"
                        : "text-[#64748B] hover:text-[#0F172A]"
                    )}
                  >
                    <Kanban className="h-3.5 w-3.5" />
                    <span>Board</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskView("list")}
                    className={cn(
                      "h-7 px-3 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all",
                      view === "list"
                        ? "bg-white border border-[#7C3AED] text-[#7C3AED] shadow-xs"
                        : "text-[#64748B] hover:text-[#0F172A]"
                    )}
                  >
                    <List className="h-3.5 w-3.5" />
                    <span>List</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskView("calendar")}
                    className={cn(
                      "h-7 px-3 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all",
                      view === "calendar"
                        ? "bg-white border border-[#7C3AED] text-[#7C3AED] shadow-xs"
                        : "text-[#64748B] hover:text-[#0F172A]"
                    )}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Calendar</span>
                  </button>
                </div>
              </div>

              {/* Sub-filters options row */}
              <div className="flex items-center justify-end gap-2.5 w-full pt-1 pb-1">
                <button
                  type="button"
                  className="h-7.5 px-2.5 rounded-lg border border-[#E2E8F0] bg-white text-xs font-semibold text-[#475569] flex items-center gap-1.5 hover:bg-[#F9FAFB]"
                >
                  <span className="text-[#8F9CAE]">Group by</span>
                  <span>Status</span>
                  <ChevronDown className="h-3 w-3 text-[#94A3B8]" />
                </button>

                <button
                  type="button"
                  className="h-7.5 px-2.5 rounded-lg border border-[#E2E8F0] bg-white text-xs font-semibold text-[#475569] flex items-center gap-1.5 hover:bg-[#F9FAFB]"
                >
                  <Sliders className="h-3.5 w-3.5 text-[#94A3B8]" />
                  <span>Sort</span>
                  <ChevronDown className="h-3 w-3 text-[#94A3B8]" />
                </button>

                <button
                  type="button"
                  onClick={() => setBulk(!bulk)}
                  className={cn(
                    "h-7.5 px-2.5 rounded-lg border border-[#E2E8F0] text-xs font-semibold flex items-center gap-2 hover:bg-[#F9FAFB] transition-all",
                    bulk ? "bg-[#F5F3FF] border-[#DDD6FE] text-[#7C3AED]" : "bg-white text-[#475569]"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={bulk}
                    readOnly
                    className="rounded border-[#D0D5DD] text-[#7C3AED] focus:ring-[#7C3AED] h-3.5 w-3.5 cursor-pointer"
                  />
                  <span>Bulk select</span>
                </button>
              </div>

              {/* Board columns */}
              {view === "board" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                  {COLUMNS.map((col) => {
                    const items = filtered.filter((t) => t.status === col)
                    return (
                      <div key={col} className="rounded-xl bg-[#F1F5F9]/50 p-2.5 min-h-[380px] flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-3 px-1">
                            <div className="flex items-center gap-2">
                              {col === "To Do" && <span className="h-2 w-2 rounded-full bg-[#64748B] shrink-0" />}
                              {col === "In Progress" && <span className="h-2 w-2 rounded-full bg-[#3B82F6] shrink-0" />}
                              {col === "In Review" && <span className="h-2 w-2 rounded-full bg-[#F59E0B] shrink-0" />}
                              {col === "Complete" && <span className="h-2 w-2 rounded-full bg-[#10B981] shrink-0" />}
                              <p className="text-[11px] font-bold text-[#374151] uppercase tracking-wide">
                                {col} <span className="text-[#9CA3AF] font-bold ml-0.5">{items.length}</span>
                              </p>
                            </div>
                            <button type="button" onClick={() => router.push("/performance/tasks/new")} className="text-[#94A3B8] hover:text-[#7C3AED]">
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="space-y-2.5">
                            {items.map((t) => (
                              <TaskCard key={t.id} task={t} />
                            ))}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => router.push("/performance/tasks/new")}
                          className="mt-4 w-full h-8.5 rounded-lg border border-dashed border-[#DDD6FE] text-xs font-bold text-[#7C3AED] hover:bg-[#F5F3FF] transition-all bg-white"
                        >
                          + Add task
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Enclosed Load More Footer Bar */}
              <div className="border border-[#E2E8F0] bg-white rounded-xl px-4 py-3 flex items-center justify-between shadow-xs hover:border-[#DDD6FE] transition-colors mt-2 cursor-pointer" onClick={() => toast.message("Loading more tasks...")}>
                <span className="text-xs font-semibold text-[#64748B]">12 of 26 tasks visible</span>
                <div className="text-xs font-bold text-[#7C3AED] hover:underline flex items-center gap-1.5">
                  <span>Load more</span>
                  <ChevronDown className="h-3.5 w-3.5 text-[#7C3AED]" />
                </div>
              </div>

              {view === "list" && (
                <PmCard className="overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-[#9CA3AF] text-left border-b border-[#F1F5F9]">
                        <th className="px-3 py-2 font-medium">Task</th>
                        <th className="px-3 py-2 font-medium">Project</th>
                        <th className="px-3 py-2 font-medium">Priority</th>
                        <th className="px-3 py-2 font-medium">Owner</th>
                        <th className="px-3 py-2 font-medium">Status</th>
                        <th className="px-3 py-2 font-medium">Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((t) => (
                        <tr key={t.id} className="border-t border-[#F1F5F9] hover:bg-[#FAFAFB] cursor-pointer" onClick={() => router.push(`/performance/tasks/${t.id}`)}>
                          <td className="px-3 py-2 font-semibold text-[#111827]">{t.title}</td>
                          <td className="px-3 py-2 text-[#6B7280]">{t.project}</td>
                          <td className="px-3 py-2">
                            <PmStatusPill label={t.priority} tone={priorityTone[t.priority]} />
                          </td>
                          <td className="px-3 py-2">
                            <PmAvatar initials={t.owner.slice(0, 2)} name={t.owner} src={t.ownerSrc} size="sm" />
                          </td>
                          <td className="px-3 py-2 text-[#374151]">{t.status}</td>
                          <td className="px-3 py-2 text-[#6B7280]">{t.due}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </PmCard>
              )}
            </div>

            {/* Today Side Panel */}
            <PmCard className="xl:col-span-3 p-4 xl:sticky xl:top-24 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#0F172A]">Today</h3>
                <ChevronUp className="h-4 w-4 text-[#94A3B8] cursor-pointer hover:text-[#475569]" />
              </div>

              {/* Top Priorities Section */}
              <div>
                <div className="flex items-center justify-between mb-2 pb-1">
                  <span className="text-[10px] uppercase tracking-wide text-[#64748B] font-bold">Top priorities</span>
                  <span className="bg-[#EEF2FF] text-[#6366F1] text-[10px] font-black h-4.5 px-2 rounded-full flex items-center justify-center shrink-0">
                    3
                  </span>
                </div>
                <div className="space-y-2">
                  {todayPriorities.map((p) => (
                    <div
                      key={p.title}
                      onClick={() => toast.message(`Opening details for "${p.title}"`)}
                      className="rounded-lg border border-[#E2E8F0] p-2.5 bg-white hover:shadow-xs transition-shadow cursor-pointer flex items-start justify-between gap-1.5"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#0F172A] leading-snug line-clamp-2">{p.title}</p>
                        <p className="text-[10px] font-semibold text-[#64748B] mt-1 truncate">{p.project}</p>
                        <div className="flex items-center gap-1.5 text-[9px] font-semibold text-[#94A3B8] mt-1.5">
                          <Calendar className="h-3 w-3 text-[#94A3B8]" />
                          <span>{p.due}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-between h-full gap-3">
                        <span className="bg-[#FEF2F2] text-[#EF4444] border border-[#FCA5A5] text-[8px] font-extrabold px-1.5 py-0.5 rounded shrink-0">
                          ^ High
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-[#94A3B8] mt-auto" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Time Logged Section */}
              <div className="border-t border-[#F1F5F9] pt-3.5">
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-[#475569]">Time logged</span>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-[#0F172A]">5.5h</span>
                    <span className="text-[9px] font-semibold text-[#94A3B8] ml-1">Today</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-[#F1F5F9] overflow-hidden mb-1">
                  <div className="h-full bg-[#7C3AED] rounded-full transition-all" style={{ width: "68.75%" }} />
                </div>
                <span className="text-[9px] font-semibold text-[#94A3B8]">Goal 8.0h</span>
              </div>

              {/* Next Due Section */}
              <div className="border-t border-[#F1F5F9] pt-3.5">
                <span className="text-[10px] uppercase tracking-wide text-[#64748B] font-bold block mb-2">Next due</span>
                <div
                  onClick={() => toast.message("Opening details for next due task")}
                  className="rounded-lg border border-[#E2E8F0] p-2.5 bg-white hover:shadow-xs transition-shadow cursor-pointer flex items-start justify-between gap-1.5"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#0F172A] leading-snug line-clamp-2">Draft Q3 market expansion plan</p>
                    <p className="text-[10px] font-semibold text-[#64748B] mt-1 truncate">Southern Africa Expansion</p>
                    <div className="flex items-center gap-1.5 text-[9px] font-semibold text-[#94A3B8] mt-1.5">
                      <Calendar className="h-3 w-3 text-[#94A3B8]" />
                      <span>Due 18 Jul 2026</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between h-full gap-3">
                    <span className="bg-[#FEF2F2] text-[#EF4444] border border-[#FCA5A5] text-[8px] font-extrabold px-1.5 py-0.5 rounded shrink-0">
                      ^ High
                    </span>
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#94A3B8] mt-auto">
                      <span className="text-[11px]">💬</span>
                      <span>2</span>
                      <span className="text-[11px]">📎</span>
                      <span>1</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* View Timesheet Link */}
              <div
                onClick={() => router.push("/performance/timesheets")}
                className="border-t border-[#F1F5F9] pt-3.5 flex items-center justify-between text-xs font-bold text-[#475569] hover:text-[#7C3AED] cursor-pointer transition-colors"
              >
                <span>View my timesheet</span>
                <ChevronRight className="h-3.5 w-3.5 text-[#94A3B8]" />
              </div>
            </PmCard>
          </div>
        )}

        {tab === "projects" && <ProjectsPortfolioTab />}

        {tab === "teams" && <TeamsWorkspaceTab />}

        {tab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <PmCard className="p-4" onClick={() => setHubTab("tasks")}>
              <LayoutGrid className="h-5 w-5 text-[#7C3AED] mb-2" />
              <h3 className="text-sm font-semibold">My tasks board</h3>
              <p className="text-[11px] text-[#6B7280] mt-1">Kanban of active work with Today rail.</p>
            </PmCard>
            <PmCard className="p-4" onClick={() => setHubTab("projects")}>
              <Kanban className="h-5 w-5 text-[#7C3AED] mb-2" />
              <h3 className="text-sm font-semibold">Projects portfolio</h3>
              <p className="text-[11px] text-[#6B7280] mt-1">Health, leads and milestones across delivery.</p>
            </PmCard>
            <PmCard className="p-4" onClick={() => setHubTab("teams")}>
              <Users className="h-5 w-5 text-[#7C3AED] mb-2" />
              <h3 className="text-sm font-semibold">Teams & capacity</h3>
              <p className="text-[11px] text-[#6B7280] mt-1">Workload distribution and over-allocation.</p>
            </PmCard>
          </div>
        )}
      </div>
    </div>
  )
}
