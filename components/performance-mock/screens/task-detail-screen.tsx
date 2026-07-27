"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Circle,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FileText,
  Flag,
  GripVertical,
  Link2,
  Pause,
  Play,
  Plus,
  Send,
  Share2,
  Shield,
  Target,
  Trophy,
} from "lucide-react"
import { toast } from "sonner"
import { PerformanceMockTopChrome } from "@/components/performance-mock/shell"
import { PmAvatar, PmButton, PmCard, PmFilterSelect, PmProgress, PmStatusPill } from "@/components/performance-mock/primitives"
import { hubTasks, type TaskPriority, type TaskStatus } from "@/lib/performance-mock/fixtures/tasks-hub"
import { PM_PHOTOS, pmPhoto } from "@/lib/performance-mock/photos"
import { cn } from "@/lib/utils"

type Subtask = { id: string; title: string; done: boolean; owner: string; ownerSrc: string; due: string }
type Deliverable = { name: string; type: "PDF" | "FIG" | "XLSX" | "URL"; meta: string }
type Comment = { name: string; src: string; at: string; text: string }
type Dependency = { title: string; status: "Completed" | "Pending" }
type ActivityEntry = { text: string; at: string }

type TaskDetailDef = {
  id: string
  title: string
  status: TaskStatus
  priority: TaskPriority
  owner: string
  ownerSrc: string
  startDate: string
  dueDate: string
  progress: number
  project: string
  projectId: string
  krCode: string
  krLabel: string
  individualGoal: string
  description: string
  subtasks: Subtask[]
  deliverables: Deliverable[]
  comments: Comment[]
  reviewers: { name: string; src: string }[]
  estimate: number
  logged: number
  dependencies: Dependency[]
  approval: { reviewer: string; src: string; status: "Pending" | "Approved" | "Changes requested"; due: string }
  activity: ActivityEntry[]
}

const taskDetails: Record<string, TaskDetailDef> = {
  "t-3": {
    id: "t-3",
    title: "Enterprise campaign launch",
    status: "In Progress",
    priority: "High",
    owner: "Rumbidzai Chaza",
    ownerSrc: PM_PHOTOS.rumbidzai,
    startDate: "01 Jul 2026",
    dueDate: "18 Jul 2026",
    progress: 72,
    project: "Southern Africa Expansion",
    projectId: "proj-sa",
    krCode: "KR 1.2",
    krLabel: "Acquire 120 enterprise customers",
    individualGoal: "Win 12 enterprise accounts",
    description:
      "Launch a multi-channel enterprise campaign to generate qualified pipeline and secure 12 new enterprise customers in the Southern Africa region. Target accounts will be engaged through personalised outbound, partner channels, paid media and a dedicated landing page. Success is measured by marketing qualified leads (MQLs), opportunities created and revenue influenced.",
    subtasks: [
      { id: "s1", title: "Approve campaign brief", done: true, owner: "Rumbidzai Chaza", ownerSrc: PM_PHOTOS.rumbidzai, due: "20 Jun 2026" },
      { id: "s2", title: "Confirm target account list", done: true, owner: "Nyasha Moyo", ownerSrc: pmPhoto("nyasha-moyo"), due: "23 Jun 2026" },
      { id: "s3", title: "Finalise creative assets", done: true, owner: "Tendai Dube", ownerSrc: pmPhoto("tendai-dube"), due: "30 Jun 2026" },
      { id: "s4", title: "Configure CRM tracking", done: true, owner: "Kudakwashe Biti", ownerSrc: pmPhoto("kudakwashe-biti"), due: "03 Jul 2026" },
      { id: "s5", title: "Brief regional sales team", done: true, owner: "Rumbi Chinoyi", ownerSrc: pmPhoto("rumbi-chinoyi"), due: "06 Jul 2026" },
      { id: "s6", title: "Launch partner email sequence", done: true, owner: "Nyasha Moyo", ownerSrc: pmPhoto("nyasha-moyo"), due: "09 Jul 2026" },
      { id: "s7", title: "Publish landing page", done: false, owner: "Tendai Dube", ownerSrc: pmPhoto("tendai-dube"), due: "15 Jul 2026" },
      { id: "s8", title: "Activate paid media", done: false, owner: "Rumbidzai Chaza", ownerSrc: PM_PHOTOS.rumbidzai, due: "18 Jul 2026" },
    ],
    deliverables: [
      { name: "Campaign brief.pdf", type: "PDF", meta: "1.2 MB" },
      { name: "Creative pack.fig", type: "FIG", meta: "6.8 MB" },
      { name: "Account list.xlsx", type: "XLSX", meta: "42 KB" },
      { name: "Landing page preview", type: "URL", meta: "arcus.co.zw/campaign" },
    ],
    comments: [
      { name: "Rumbidzai Chaza", src: PM_PHOTOS.rumbidzai, at: "10 Jul 2026, 09:14 AM", text: "Partner email sequence is live and landing page QA is in progress. Expecting final approvals by Monday." },
      { name: "Nyasha Moyo", src: pmPhoto("nyasha-moyo"), at: "10 Jul 2026, 10:08 AM", text: "Great progress! I've shared the sales briefing deck in Teams for tomorrow's enablement session." },
      { name: "Tendai Dube", src: pmPhoto("tendai-dube"), at: "10 Jul 2026, 10:28 AM", text: "Landing page build is complete. Added UTM parameters and ready for QA." },
    ],
    reviewers: [{ name: "Nyasha Moyo", src: pmPhoto("nyasha-moyo") }],
    estimate: 40,
    logged: 28.5,
    dependencies: [
      { title: "Configure CRM tracking", status: "Completed" },
      { title: "Brief regional sales team", status: "Completed" },
    ],
    approval: { reviewer: "Nyasha Moyo", src: pmPhoto("nyasha-moyo"), status: "Pending", due: "20 Jul 2026" },
    activity: [
      { text: "Task created by Rumbidzai Chaza", at: "01 Jul 2026, 09:12 AM" },
      { text: "Status changed to In Progress", at: "03 Jul 2026, 09:15 AM" },
      { text: "Nyasha Moyo added as reviewer", at: "09 Jul 2026, 11:02 AM" },
      { text: "Tendai Dube added a comment", at: "10 Jul 2026, 10:28 AM" },
    ],
  },
}

function buildFallbackDetail(taskId: string): TaskDetailDef {
  const hub = hubTasks.find((t) => t.id === taskId)
  if (!hub) return taskDetails["t-3"]
  const doneSubtasks = hub.subtasks?.done ?? (hub.status === "Complete" ? 4 : 2)
  const totalSubtasks = hub.subtasks?.total ?? 4
  const subtasks: Subtask[] = Array.from({ length: totalSubtasks }, (_, i) => ({
    id: `${hub.id}-s${i + 1}`,
    title: `${["Scope", "Draft", "Review", "Finalise", "Approve", "Publish"][i % 6]} ${hub.title.toLowerCase()}`,
    done: i < doneSubtasks,
    owner: hub.owner,
    ownerSrc: hub.ownerSrc,
    due: hub.due,
  }))
  return {
    id: hub.id,
    title: hub.title,
    status: hub.status,
    priority: hub.priority,
    owner: hub.owner,
    ownerSrc: hub.ownerSrc,
    startDate: "01 Jul 2026",
    dueDate: hub.due,
    progress: hub.progress ?? (hub.status === "Complete" ? 100 : Math.round((doneSubtasks / totalSubtasks) * 100)),
    project: hub.project,
    projectId: hub.projectId,
    krCode: hub.kr || "KR —",
    krLabel: "Linked key result for this workstream",
    individualGoal: "Win 12 enterprise accounts",
    description: `Deliver "${hub.title}" as part of the ${hub.project} workstream, aligned to ${hub.kr ? hub.kr + " objectives" : "the team's quarterly objectives"}.`,
    subtasks,
    deliverables: [{ name: `${hub.title.split(" ").slice(0, 2).join("-")}-notes.pdf`, type: "PDF", meta: "640 KB" }],
    comments: [{ name: hub.owner, src: hub.ownerSrc, at: hub.due, text: `Update pending on "${hub.title}".` }],
    reviewers: [{ name: "Nyasha Moyo", src: pmPhoto("nyasha-moyo") }],
    estimate: 24,
    logged: hub.progress ? Math.round((hub.progress / 100) * 24 * 10) / 10 : 6,
    dependencies: [],
    approval: { reviewer: "Nyasha Moyo", src: pmPhoto("nyasha-moyo"), status: "Pending", due: hub.due },
    activity: [{ text: `Task created by ${hub.owner}`, at: hub.due }],
  }
}

function getTaskDetail(taskId: string): TaskDetailDef {
  return taskDetails[taskId] || buildFallbackDetail(taskId)
}

const priorityTone: Record<TaskPriority, "danger" | "warning" | "success"> = {
  High: "danger",
  Medium: "warning",
  Low: "success",
}

const statusTone: Record<TaskStatus, "neutral" | "info" | "warning" | "success"> = {
  "To Do": "neutral",
  "In Progress": "info",
  "In Review": "warning",
  Complete: "success",
}

const fileIcon: Record<Deliverable["type"], typeof FileText> = {
  PDF: FileText,
  FIG: FileSpreadsheet,
  XLSX: FileSpreadsheet,
  URL: Link2,
}

function RingStat({ value, size = 44 }: { value: number; size?: number }) {
  const r = (size - 8) / 2
  const c = 2 * Math.PI * r
  const offset = c - (Math.min(100, Math.max(0, value)) / 100) * c
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F3E8FF" strokeWidth="5" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#7C3AED"
        strokeWidth="5"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="fill-[#111827]" style={{ fontSize: size * 0.24, fontWeight: 700 }}>
        {value}%
      </text>
    </svg>
  )
}

export function TaskDetailMockScreen({ taskId = "t-3" }: { taskId?: string }) {
  const router = useRouter()
  const base = useMemo(() => getTaskDetail(taskId), [taskId])

  const [status, setStatus] = useState<TaskStatus>(base.status)
  const [priority, setPriority] = useState<TaskPriority>(base.priority)
  const [watching, setWatching] = useState(false)
  const [subtasks, setSubtasks] = useState<Subtask[]>(base.subtasks)
  const [comments, setComments] = useState<Comment[]>(base.comments)
  const [draft, setDraft] = useState("")
  const [timerRunning, setTimerRunning] = useState(false)
  const [logged, setLogged] = useState(base.logged)
  const [reviewers, setReviewers] = useState(base.reviewers)

  const doneCount = subtasks.filter((s) => s.done).length
  const subtaskPct = subtasks.length ? Math.round((doneCount / subtasks.length) * 100) : 0

  const toggleSubtask = (id: string) => {
    setSubtasks((prev) => prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s)))
  }

  const addSubtask = () => {
    setSubtasks((prev) => [...prev, { id: `new-${prev.length + 1}`, title: "New subtask", done: false, owner: base.owner, ownerSrc: base.ownerSrc, due: base.dueDate }])
  }

  const sendComment = () => {
    if (!draft.trim()) return
    setComments((prev) => [...prev, { name: "Adm. User", src: PM_PHOTOS.admin, at: "Just now", text: draft.trim() }])
    setDraft("")
    toast.success("Comment posted")
  }

  const markReadyForReview = () => {
    setStatus("In Review")
    toast.success("Task submitted for review", { description: `${base.title} moved to In Review.` })
  }

  const toggleTimer = () => {
    setTimerRunning((r) => !r)
    if (!timerRunning) toast("Timer started", { description: base.title })
    else {
      setLogged((l) => Math.round((l + 0.1) * 10) / 10)
      toast("Timer stopped", { description: "Logged time updated." })
    }
  }

  return (
    <div className="min-h-full bg-[#F8FAFC]">
      <PerformanceMockTopChrome breadcrumbs={["Performance Management", "Tasks & Projects", base.project, base.title]} />
      <div className="p-4 lg:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav className="text-xs">
            <button type="button" onClick={() => router.push("/performance/tasks?tab=projects")} className="text-[#7C3AED] font-semibold hover:underline">
              Tasks &amp; Projects
            </button>
            <span className="mx-1.5 text-[#D1D5DB]">/</span>
            <button type="button" onClick={() => router.push(`/performance/tasks/projects/${base.projectId}`)} className="text-[#7C3AED] font-semibold hover:underline">
              {base.project}
            </button>
            <span className="mx-1.5 text-[#D1D5DB]">/</span>
            <span className="text-[#111827] font-medium">{base.title}</span>
          </nav>
          <div className="flex flex-wrap items-center gap-2">
            <PmButton variant="outline" onClick={() => setWatching((w) => !w)}>
              {watching ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />} {watching ? "Watching" : "Watch"}
            </PmButton>
            <PmButton variant="outline" onClick={() => toast("Share task", { description: "Link copied to clipboard." })}>
              <Share2 className="h-3.5 w-3.5" /> Share
            </PmButton>
            <button
              type="button"
              onClick={() => toast("Task options", { description: "Duplicate, move and delete actions available here." })}
              className="h-8 w-8 rounded-full border border-[#E5E7EB] bg-white flex items-center justify-center text-[#6B7280] hover:bg-[#F9FAFB]"
            >
              <span className="text-lg leading-none -mt-1">⋯</span>
            </button>
            <PmButton onClick={markReadyForReview} disabled={status === "In Review" || status === "Complete"}>
              <CheckCircle2 className="h-3.5 w-3.5" /> {status === "In Review" ? "Submitted for review" : status === "Complete" ? "Completed" : "Mark ready for review"}
            </PmButton>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <h1 className="text-xl font-bold text-[#111827] tracking-tight truncate">{base.title}</h1>
            <PmStatusPill label={status} tone={statusTone[status]} />
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FEE2E2] text-[#991B1B]">
              <Flag className="h-3 w-3" /> {priority} priority
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <PmAvatar initials={base.owner.slice(0, 2)} name={base.owner} role="Owner" src={base.ownerSrc} size="md" />
          <div className="flex items-center gap-2.5">
            <span className="h-9 w-9 rounded-full bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-bold text-[#111827]">{base.dueDate}</p>
              <p className="text-[10px] text-[#9CA3AF]">Due date</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <RingStat value={subtaskPct} />
            <div>
              <p className="text-sm font-bold text-[#111827]">{subtaskPct}%</p>
              <p className="text-[10px] text-[#9CA3AF]">Complete</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="h-7 w-7 rounded-full bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center shrink-0">
              <Target className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] text-[#9CA3AF]">Project</p>
              <p className="text-xs font-semibold text-[#111827] truncate">{base.project}</p>
            </div>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-[#C4B5FD] shrink-0" />
          <div className="flex items-center gap-2 min-w-0">
            <span className="h-7 w-7 rounded-full bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center shrink-0">
              <Shield className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] text-[#9CA3AF]">{base.krCode}</p>
              <p className="text-xs font-semibold text-[#111827] truncate">{base.krLabel}</p>
            </div>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-[#C4B5FD] shrink-0" />
          <div className="flex items-center gap-2 min-w-0">
            <span className="h-7 w-7 rounded-full bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center shrink-0">
              <Trophy className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] text-[#9CA3AF]">Individual goal</p>
              <p className="text-xs font-semibold text-[#111827] truncate">{base.individualGoal}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
          <div className="xl:col-span-9 space-y-4">
            <PmCard className="p-4">
              <h3 className="text-sm font-semibold text-[#111827] mb-2">Description</h3>
              <div className="flex flex-wrap items-center gap-1 mb-2 pb-2 border-b border-[#F1F5F9] text-[#6B7280]">
                <select className="h-6 rounded border border-[#E5E7EB] text-[10px] px-1.5 mr-1" defaultValue="Normal">
                  <option>Normal</option>
                  <option>Heading</option>
                </select>
                {["B", "I", "U"].map((f) => (
                  <button key={f} type="button" className="h-6 w-6 rounded hover:bg-[#F3F4F6] text-[11px] font-bold flex items-center justify-center">
                    {f}
                  </button>
                ))}
                <span className="mx-1 h-4 w-px bg-[#E5E7EB]" />
                <button type="button" className="h-6 w-6 rounded hover:bg-[#F3F4F6] flex items-center justify-center">
                  <Link2 className="h-3 w-3" />
                </button>
              </div>
              <p className="text-xs text-[#374151] leading-relaxed">{base.description}</p>
            </PmCard>

            <PmCard className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h3 className="text-sm font-semibold text-[#111827]">
                  Subtasks <span className="text-[#9CA3AF] font-medium">{doneCount} of {subtasks.length} complete</span>
                </h3>
                <button type="button" onClick={addSubtask} className="text-[11px] font-semibold text-[#7C3AED] hover:underline inline-flex items-center gap-1">
                  <Plus className="h-3.5 w-3.5" /> Add subtask
                </button>
              </div>
              <PmProgress value={subtaskPct} className="mb-3" />
              <div className="space-y-1">
                {subtasks.map((s) => (
                  <div key={s.id} className="flex items-center gap-2.5 py-1.5 border-b border-[#F8FAFC] last:border-0">
                    <GripVertical className="h-3.5 w-3.5 text-[#D1D5DB] shrink-0" />
                    <button type="button" onClick={() => toggleSubtask(s.id)} className="shrink-0">
                      {s.done ? <CheckCircle2 className="h-4 w-4 text-[#10B981]" /> : <Circle className="h-4 w-4 text-[#D1D5DB]" />}
                    </button>
                    <span className={cn("flex-1 text-xs min-w-0 truncate", s.done ? "text-[#9CA3AF] line-through" : "text-[#111827] font-medium")}>{s.title}</span>
                    <PmAvatar initials={s.owner.slice(0, 2)} src={s.ownerSrc} size="sm" />
                    <span className="text-[10px] text-[#9CA3AF] shrink-0 hidden sm:inline">{s.due}</span>
                  </div>
                ))}
              </div>
            </PmCard>

            <PmCard className="p-4">
              <h3 className="text-sm font-semibold text-[#111827] mb-3">Deliverables &amp; files</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {base.deliverables.map((f) => {
                  const Icon = fileIcon[f.type]
                  return (
                    <button
                      key={f.name}
                      type="button"
                      onClick={() => toast("Opening file", { description: f.name })}
                      className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] p-2.5 text-left hover:border-[#C4B5FD] min-w-0"
                    >
                      <Icon className="h-4 w-4 text-[#7C3AED] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-[#111827] truncate">{f.name}</p>
                        <p className="text-[10px] text-[#9CA3AF] truncate">
                          {f.type} · {f.meta}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </PmCard>

            <PmCard className="p-4">
              <h3 className="text-sm font-semibold text-[#111827] mb-3">Comments &amp; updates</h3>
              <div className="space-y-3">
                {comments.map((c, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <img src={c.src} alt="" className="h-7 w-7 rounded-full object-cover shrink-0 ring-2 ring-white shadow-sm" referrerPolicy="no-referrer" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-[#111827]">{c.name}</p>
                        <p className="text-[10px] text-[#9CA3AF]">{c.at}</p>
                      </div>
                      <p className="text-xs text-[#374151] mt-0.5 leading-relaxed">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendComment()}
                  placeholder="Write an update..."
                  className="flex-1 h-9 rounded-lg border border-[#E5E7EB] px-3 text-xs outline-none focus:border-[#C4B5FD]"
                />
                <PmButton onClick={sendComment}>
                  <Send className="h-3.5 w-3.5" /> Send
                </PmButton>
              </div>
            </PmCard>
          </div>

          <div className="xl:col-span-3 space-y-4">
            <PmCard className="p-4">
              <h3 className="text-sm font-semibold text-[#111827] mb-3">Task details</h3>
              <div className="space-y-2.5">
                <div>
                  <p className="text-[10px] text-[#9CA3AF] mb-1">Status</p>
                  <PmFilterSelect value={status} options={["To Do", "In Progress", "In Review", "Complete"]} onChange={(v) => setStatus(v as TaskStatus)} className="w-full" />
                </div>
                <div>
                  <p className="text-[10px] text-[#9CA3AF] mb-1">Priority</p>
                  <PmFilterSelect value={priority} options={["High", "Medium", "Low"]} onChange={(v) => setPriority(v as TaskPriority)} className="w-full" />
                </div>
                <div>
                  <p className="text-[10px] text-[#9CA3AF] mb-1">Owner</p>
                  <PmAvatar initials={base.owner.slice(0, 2)} name={base.owner} src={base.ownerSrc} size="sm" />
                </div>
                <div>
                  <p className="text-[10px] text-[#9CA3AF] mb-1">Reviewers</p>
                  <div className="space-y-1.5">
                    {reviewers.map((r) => (
                      <PmAvatar key={r.name} initials={r.name.slice(0, 2)} name={r.name} src={r.src} size="sm" />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setReviewers((prev) => [...prev, { name: "Farai Moyo", src: pmPhoto("farai-moyo") }])
                      toast("Reviewer added")
                    }}
                    className="mt-1.5 text-[11px] font-semibold text-[#7C3AED] hover:underline inline-flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Add reviewer
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <p className="text-[10px] text-[#9CA3AF]">Start date</p>
                    <p className="text-xs font-medium text-[#111827]">{base.startDate}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#9CA3AF]">Due date</p>
                    <p className="text-xs font-medium text-[#111827]">{base.dueDate}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#9CA3AF]">Estimate</p>
                    <p className="text-xs font-medium text-[#111827]">{base.estimate}h</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#9CA3AF]">Logged</p>
                    <p className="text-xs font-medium text-[#111827]">{logged}h</p>
                  </div>
                </div>
              </div>
            </PmCard>

            <PmCard className="p-4">
              <h3 className="text-sm font-semibold text-[#111827] mb-3">Dependencies</h3>
              {base.dependencies.length === 0 ? (
                <p className="text-[11px] text-[#9CA3AF]">No dependencies linked.</p>
              ) : (
                <div className="space-y-2">
                  {base.dependencies.map((d) => (
                    <div key={d.title} className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="text-[#374151] truncate">{d.title}</span>
                      <PmStatusPill label={d.status} tone={d.status === "Completed" ? "success" : "warning"} />
                    </div>
                  ))}
                </div>
              )}
            </PmCard>

            <PmCard className="p-4">
              <h3 className="text-sm font-semibold text-[#111827] mb-3">Time tracking</h3>
              <div className="flex items-center gap-3 mb-3">
                <RingStat value={Math.min(100, Math.round((logged / base.estimate) * 100))} size={48} />
                <div>
                  <p className="text-sm font-bold text-[#111827]">
                    {logged}h <span className="text-[#9CA3AF] font-normal">of {base.estimate}h</span>
                  </p>
                  <p className="text-[10px] text-[#9CA3AF]">Logged / Estimate</p>
                </div>
              </div>
              <PmProgress value={Math.min(100, (logged / base.estimate) * 100)} className="mb-3" />
              <div className="grid grid-cols-2 gap-2">
                <PmButton onClick={toggleTimer} className="w-full">
                  {timerRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />} {timerRunning ? "Stop timer" : "Start timer"}
                </PmButton>
                <PmButton variant="outline" className="w-full" onClick={() => toast("Add time", { description: "Manual time entry logged." })}>
                  <Plus className="h-3.5 w-3.5" /> Add time
                </PmButton>
              </div>
            </PmCard>

            <PmCard className="p-4">
              <h3 className="text-sm font-semibold text-[#111827] mb-3">Approval</h3>
              <div className="flex items-center justify-between gap-2">
                <PmAvatar initials={base.approval.reviewer.slice(0, 2)} name={base.approval.reviewer} src={base.approval.src} size="sm" />
                <PmStatusPill label={base.approval.status} tone={base.approval.status === "Approved" ? "success" : base.approval.status === "Changes requested" ? "danger" : "warning"} />
              </div>
              <p className="text-[10px] text-[#9CA3AF] mt-2">Due {base.approval.due}</p>
            </PmCard>

            <PmCard className="p-4">
              <h3 className="text-sm font-semibold text-[#111827] mb-3">Activity</h3>
              <div className="space-y-2.5">
                {base.activity.map((a, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED] mt-1.5 shrink-0" />
                    <p className="text-[#374151] leading-snug">
                      {a.text}
                      <span className="block text-[10px] text-[#9CA3AF] mt-0.5">{a.at}</span>
                    </p>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => toast("Activity", { description: "Opening full activity log." })} className="mt-3 text-[11px] font-medium text-[#7C3AED] hover:underline">
                View full activity →
              </button>
            </PmCard>
          </div>
        </div>
      </div>
    </div>
  )
}
