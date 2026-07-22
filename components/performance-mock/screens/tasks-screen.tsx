"use client"

import { Suspense, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Plus,
  LayoutGrid,
  List,
  Search,
  MoreVertical,
  Coins,
  GitBranch,
  CheckCircle2,
  Clock3,
  Send,
} from "lucide-react"
import { toast } from "sonner"
import { PerformanceMockTopChrome } from "@/components/performance-mock/shell"
import { PmAvatar, PmButton, PmCard, PmModal, PmPageHeader, PmStatusPill, PmTabPills } from "@/components/performance-mock/primitives"
import { cn } from "@/lib/utils"

type TaskStatus = "To Do" | "In Progress" | "Review" | "Done"
type TaskPriority = "Low" | "Medium" | "High"

type Task = {
  id: string
  title: string
  description: string
  assignee: string
  assigneeInitials: string
  assigneeColor: string
  dept: string
  priority: TaskPriority
  status: TaskStatus
  dueDate: string
  scope: "my" | "department"
}

const initialTasks: Task[] = [
  { id: "t1", title: "Submit Q2 KPI actuals", description: "Enter actual values for all owned KPIs before the freeze date.", assignee: "Adm. User", assigneeInitials: "AU", assigneeColor: "#7C3AED", dept: "Finance", priority: "High", status: "In Progress", dueDate: "24 Jul 2026", scope: "my" },
  { id: "t2", title: "Review objective check-ins", description: "Review and acknowledge check-in notes from KR owners.", assignee: "Adm. User", assigneeInitials: "AU", assigneeColor: "#7C3AED", dept: "Executive", priority: "Medium", status: "To Do", dueDate: "26 Jul 2026", scope: "my" },
  { id: "t3", title: "Approve corrective action plan", description: "Approve CAP submitted for SLA compliance gap.", assignee: "Adm. User", assigneeInitials: "AU", assigneeColor: "#7C3AED", dept: "Customer Success", priority: "High", status: "Review", dueDate: "22 Jul 2026", scope: "my" },
  { id: "t4", title: "Finalize FY27 pillar weights", description: "Confirm proposed BSC pillar weight changes ahead of board sign-off.", assignee: "Adm. User", assigneeInitials: "AU", assigneeColor: "#7C3AED", dept: "Executive", priority: "Medium", status: "Done", dueDate: "18 Jul 2026", scope: "my" },
  { id: "t5", title: "Update department scorecard narrative", description: "Add qualitative commentary for Q2 department scorecard.", assignee: "Farai Muchengeti", assigneeInitials: "FM", assigneeColor: "#2563EB", dept: "Finance", priority: "Medium", status: "To Do", dueDate: "25 Jul 2026", scope: "department" },
  { id: "t6", title: "Reconcile revenue KPI source data", description: "Cross-check Oracle ERP export against manual ledger totals.", assignee: "Anesu Mlambo", assigneeInitials: "AM", assigneeColor: "#10B981", dept: "Finance", priority: "High", status: "In Progress", dueDate: "23 Jul 2026", scope: "department" },
  { id: "t7", title: "Draft customer retention improvement plan", description: "Propose actions to lift retention rate above 90%.", assignee: "Rupatadzo Zulu", assigneeInitials: "RZ", assigneeColor: "#F97316", dept: "Customer Success", priority: "High", status: "Review", dueDate: "27 Jul 2026", scope: "department" },
  { id: "t8", title: "Close out training completion backlog", description: "Chase outstanding LMS completions for Q2 cohort.", assignee: "Chipo Dube", assigneeInitials: "CD", assigneeColor: "#EC4899", dept: "Human Resources", priority: "Low", status: "Done", dueDate: "15 Jul 2026", scope: "department" },
]

const statuses: TaskStatus[] = ["To Do", "In Progress", "Review", "Done"]

function priorityTone(p: TaskPriority): "success" | "warning" | "danger" {
  if (p === "Low") return "success"
  if (p === "Medium") return "warning"
  return "danger"
}

function statusTone(s: TaskStatus): "neutral" | "info" | "warning" | "success" {
  if (s === "To Do") return "neutral"
  if (s === "In Progress") return "info"
  if (s === "Review") return "warning"
  return "success"
}

const emptyTaskForm = { title: "", description: "", assignee: "Adm. User", dept: "Finance", priority: "Medium" as TaskPriority, dueDate: "" }

const kpiOptions = [
  { code: "FIN-001", name: "Revenue Growth (%)", target: "15% – 25%" },
  { code: "CUS-002", name: "Customer Retention Rate (%)", target: "70% – 90%" },
  { code: "INT-002", name: "Cycle Time (Days)", target: "5 – 10" },
  { code: "LRN-001", name: "Employee Engagement (%)", target: "60% – 80%" },
]

type BscLogEntry = { id: string; kpiCode: string; kpiName: string; actual: string; comment: string; submittedAt: string }

type WorkflowSubmission = {
  id: string
  title: string
  type: string
  submittedBy: string
  submittedAt: string
  status: "Pending" | "Approved" | "Rejected" | "Returned"
  step: string
}

const initialWorkflowSubmissions: WorkflowSubmission[] = [
  { id: "WF-2201", title: "Q2 Finance Department Scorecard", type: "Scorecard Approval", submittedBy: "Farai Muchengeti", submittedAt: "18 Jul 2026, 09:12", status: "Approved", step: "Finance Director → CFO" },
  { id: "WF-2202", title: "Corrective Action Plan — SLA Compliance", type: "CAP Approval", submittedBy: "Rupatadzo Zulu", submittedAt: "19 Jul 2026, 14:40", status: "Pending", step: "Head of CS → COO" },
  { id: "WF-2203", title: "KPI Threshold Change — FIN-005", type: "KPI Change Request", submittedBy: "Anesu Mlambo", submittedAt: "20 Jul 2026, 10:05", status: "Returned", step: "Returned to submitter" },
  { id: "WF-2204", title: "Employee Contract Renewal — T. Chari", type: "Contract Approval", submittedBy: "Chipo Dube", submittedAt: "21 Jul 2026, 08:55", status: "Pending", step: "HR Business Partner → COO" },
]

const workflowStatusTone: Record<WorkflowSubmission["status"], "success" | "warning" | "danger" | "info"> = {
  Approved: "success",
  Pending: "info",
  Rejected: "danger",
  Returned: "warning",
}

const TAB_IDS = ["my-tasks", "department", "bsc-entry", "workflow"] as const
type TabId = (typeof TAB_IDS)[number]

function TasksMockScreenInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const tab: TabId = (TAB_IDS as readonly string[]).includes(tabParam || "") ? (tabParam as TabId) : "my-tasks"

  const setTab = (id: string) => {
    router.push(`/performance/tasks?tab=${id}`)
  }

  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban")
  const [search, setSearch] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState(emptyTaskForm)

  const [bscForm, setBscForm] = useState({ kpiCode: kpiOptions[0].code, actual: "", comment: "" })
  const [bscLog, setBscLog] = useState<BscLogEntry[]>([
    { id: "b1", kpiCode: "FIN-001", kpiName: "Revenue Growth (%)", actual: "18.4%", comment: "Strong Q2 close, enterprise renewals landed early.", submittedAt: "15 Jul 2026, 16:20" },
  ])

  const [submissions, setSubmissions] = useState<WorkflowSubmission[]>(initialWorkflowSubmissions)
  const [submitOpen, setSubmitOpen] = useState(false)
  const [submitForm, setSubmitForm] = useState({ title: "", type: "Scorecard Approval", step: "" })

  const scopeTasks = useMemo(() => tasks.filter((t) => t.scope === (tab === "department" ? "department" : "my")), [tasks, tab])

  const filteredTasks = useMemo(() => {
    if (!search.trim()) return scopeTasks
    const q = search.toLowerCase()
    return scopeTasks.filter((t) => t.title.toLowerCase().includes(q) || t.assignee.toLowerCase().includes(q) || t.dept.toLowerCase().includes(q))
  }, [scopeTasks, search])

  const columns = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = { "To Do": [], "In Progress": [], Review: [], Done: [] }
    filteredTasks.forEach((t) => map[t.status].push(t))
    return map
  }, [filteredTasks])

  const moveTask = (id: string, status: TaskStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)))
  }

  const handleCreateTask = () => {
    if (!form.title.trim()) {
      toast.error("Task title is required")
      return
    }
    const initials = form.assignee
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
    const newTask: Task = {
      id: `t${Date.now()}`,
      title: form.title,
      description: form.description || "—",
      assignee: form.assignee,
      assigneeInitials: initials,
      assigneeColor: "#7C3AED",
      dept: form.dept,
      priority: form.priority,
      status: "To Do",
      dueDate: form.dueDate || "TBD",
      scope: tab === "department" ? "department" : "my",
    }
    setTasks((prev) => [newTask, ...prev])
    setCreateOpen(false)
    setForm(emptyTaskForm)
    toast.success("Task created", { description: newTask.title })
  }

  const recordBscEntry = () => {
    if (!bscForm.actual.trim()) {
      toast.error("Enter an actual value before recording")
      return
    }
    const kpi = kpiOptions.find((k) => k.code === bscForm.kpiCode)!
    const entry: BscLogEntry = {
      id: `b${Date.now()}`,
      kpiCode: kpi.code,
      kpiName: kpi.name,
      actual: bscForm.actual,
      comment: bscForm.comment || "—",
      submittedAt: new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    }
    setBscLog((prev) => [entry, ...prev])
    setBscForm({ kpiCode: kpiOptions[0].code, actual: "", comment: "" })
    toast.success("BSC entry recorded", { description: `${kpi.name}: ${entry.actual}` })
  }

  const handleCreateSubmission = () => {
    if (!submitForm.title.trim()) {
      toast.error("Submission title is required")
      return
    }
    const newSub: WorkflowSubmission = {
      id: `WF-${2200 + submissions.length + 1}`,
      title: submitForm.title,
      type: submitForm.type,
      submittedBy: "Adm. User",
      submittedAt: new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      status: "Pending",
      step: submitForm.step || "Awaiting first approver",
    }
    setSubmissions((prev) => [newSub, ...prev])
    setSubmitOpen(false)
    setSubmitForm({ title: "", type: "Scorecard Approval", step: "" })
    toast.success("Workflow submission created", { description: newSub.title })
  }

  const doneCount = tasks.filter((t) => t.status === "Done" && t.scope === "my").length
  const overdueCount = 1

  return (
    <div className="min-h-full">
      <PerformanceMockTopChrome breadcrumbs={["Performance Management", "Tasks"]} searchPlaceholder="Search tasks…" />
      <div className="p-4 lg:p-6 space-y-5">
        <PmPageHeader
          title="Tasks"
          subtitle="Track personal and department tasks, capture BSC actuals, and manage workflow approvals."
          actions={
            (tab === "my-tasks" || tab === "department") && (
              <PmButton variant="primary" onClick={() => setCreateOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> New Task
              </PmButton>
            )
          }
        />

        <PmTabPills
          tabs={[
            { id: "my-tasks", label: "My Tasks" },
            { id: "department", label: "Department" },
            { id: "bsc-entry", label: "BSC Entry" },
            { id: "workflow", label: "Workflow History" },
          ]}
          active={tab}
          onChange={setTab}
        />

        {(tab === "my-tasks" || tab === "department") && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <PmCard className="p-3.5">
                <p className="text-[11px] font-medium text-[#6B7280]">Total Tasks</p>
                <p className="mt-1 text-xl font-bold text-[#111827]">{scopeTasks.length}</p>
              </PmCard>
              <PmCard className="p-3.5">
                <p className="text-[11px] font-medium text-[#6B7280]">In Progress</p>
                <p className="mt-1 text-xl font-bold text-[#111827]">{columns["In Progress"].length}</p>
              </PmCard>
              <PmCard className="p-3.5">
                <p className="text-[11px] font-medium text-[#6B7280]">Completed</p>
                <p className="mt-1 text-xl font-bold text-[#111827]">{tab === "my-tasks" ? doneCount : columns.Done.length}</p>
              </PmCard>
              <PmCard className="p-3.5">
                <p className="text-[11px] font-medium text-[#6B7280]">Overdue</p>
                <p className="mt-1 text-xl font-bold text-[#EF4444]">{overdueCount}</p>
              </PmCard>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tasks…"
                  className="w-full h-9 pl-8 pr-3 rounded-lg border border-[#E5E7EB] bg-white text-xs outline-none focus:border-[#7C3AED]"
                />
              </div>
              <div className="inline-flex items-center rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode("kanban")}
                  className={cn(
                    "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium transition-colors",
                    viewMode === "kanban" ? "bg-[#7C3AED] text-white shadow-sm" : "text-[#6B7280]"
                  )}
                >
                  <LayoutGrid className="h-3.5 w-3.5" /> Kanban
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium transition-colors",
                    viewMode === "list" ? "bg-white shadow-sm text-[#111827]" : "text-[#6B7280]"
                  )}
                >
                  <List className="h-3.5 w-3.5" /> List
                </button>
              </div>
            </div>

            {viewMode === "kanban" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {statuses.map((status) => (
                  <div key={status} className="min-w-0">
                    <div className="flex items-center justify-between mb-2 px-1">
                      <span className="text-xs font-semibold text-[#374151]">{status}</span>
                      <span className="h-5 min-w-5 px-1 rounded-full bg-[#F3F4F6] text-[#6B7280] text-[10px] font-semibold flex items-center justify-center">
                        {columns[status].length}
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      {columns[status].map((t) => (
                        <PmCard key={t.id} className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-semibold text-[#111827] leading-snug">{t.title}</p>
                            <PmStatusPill label={t.priority} tone={priorityTone(t.priority)} />
                          </div>
                          <p className="mt-1 text-[11px] text-[#6B7280] leading-snug line-clamp-2">{t.description}</p>
                          <div className="mt-2.5 flex items-center justify-between">
                            <PmAvatar initials={t.assigneeInitials} name={t.assignee} color={t.assigneeColor} size="sm" />
                            <span className="text-[10px] text-[#9CA3AF] whitespace-nowrap">{t.dueDate}</span>
                          </div>
                          <div className="mt-2.5 flex items-center gap-1.5">
                            {statuses
                              .filter((s) => s !== status)
                              .slice(0, 3)
                              .map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => moveTask(t.id, s)}
                                  className="text-[10px] px-2 py-1 rounded-md border border-[#E5E7EB] text-[#6B7280] hover:border-[#DDD6FE] hover:text-[#7C3AED]"
                                >
                                  {s}
                                </button>
                              ))}
                          </div>
                        </PmCard>
                      ))}
                      {columns[status].length === 0 && (
                        <div className="rounded-lg border border-dashed border-[#E5E7EB] py-6 text-center text-[11px] text-[#9CA3AF]">No tasks</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <PmCard className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[760px]">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-wide text-[#9CA3AF] border-b border-[#F1F5F9]">
                        {["Task", "Assignee", "Department", "Priority", "Status", "Due Date", ""].map((h) => (
                          <th key={h} className="py-2.5 px-3 font-semibold whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTasks.map((t) => (
                        <tr key={t.id} className="border-b border-[#F1F5F9] hover:bg-[#FAFAFA]">
                          <td className="py-3 px-3 max-w-[260px]">
                            <p className="font-medium text-[#111827] truncate">{t.title}</p>
                            <p className="text-[10px] text-[#9CA3AF] truncate">{t.description}</p>
                          </td>
                          <td className="py-3 px-3">
                            <PmAvatar initials={t.assigneeInitials} name={t.assignee} color={t.assigneeColor} size="sm" />
                          </td>
                          <td className="py-3 px-3 text-[#6B7280] whitespace-nowrap">{t.dept}</td>
                          <td className="py-3 px-3">
                            <PmStatusPill label={t.priority} tone={priorityTone(t.priority)} />
                          </td>
                          <td className="py-3 px-3">
                            <select
                              value={t.status}
                              onChange={(e) => moveTask(t.id, e.target.value as TaskStatus)}
                              className="h-7 rounded-md border border-[#E5E7EB] px-1.5 text-[11px] bg-white"
                            >
                              {statuses.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3 px-3 text-[#6B7280] whitespace-nowrap">{t.dueDate}</td>
                          <td className="py-3 px-3 text-right">
                            <button type="button" className="text-[#9CA3AF] hover:text-[#111827]">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredTasks.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-10 text-center text-sm text-[#6B7280]">
                            No tasks match the current filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </PmCard>
            )}
          </>
        )}

        {tab === "bsc-entry" && (
          <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-4">
            <PmCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center">
                  <Coins className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-[#111827]">Record BSC Actual</h3>
              </div>
              <div className="space-y-3">
                <label className="block">
                  <span className="block text-xs font-medium text-[#374151] mb-1">KPI</span>
                  <select
                    value={bscForm.kpiCode}
                    onChange={(e) => setBscForm((f) => ({ ...f, kpiCode: e.target.value }))}
                    className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] text-sm bg-white"
                  >
                    {kpiOptions.map((k) => (
                      <option key={k.code} value={k.code}>
                        {k.code} — {k.name}
                      </option>
                    ))}
                  </select>
                  <span className="mt-1 block text-[10px] text-[#9CA3AF]">
                    Target range: {kpiOptions.find((k) => k.code === bscForm.kpiCode)?.target}
                  </span>
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-[#374151] mb-1">Actual Value *</span>
                  <input
                    value={bscForm.actual}
                    onChange={(e) => setBscForm((f) => ({ ...f, actual: e.target.value }))}
                    placeholder="e.g. 18.4%"
                    className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] text-sm outline-none focus:border-[#7C3AED]"
                  />
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-[#374151] mb-1">Comment</span>
                  <textarea
                    value={bscForm.comment}
                    onChange={(e) => setBscForm((f) => ({ ...f, comment: e.target.value }))}
                    placeholder="Context for this actual…"
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-sm outline-none focus:border-[#7C3AED] resize-none"
                  />
                </label>
                <PmButton variant="primary" className="w-full" onClick={recordBscEntry}>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Record Entry
                </PmButton>
              </div>
            </PmCard>

            <PmCard className="p-0 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB]">
                <h3 className="text-sm font-semibold text-[#111827]">Entry Log ({bscLog.length})</h3>
              </div>
              <div className="divide-y divide-[#F1F5F9] max-h-[480px] overflow-y-auto">
                {bscLog.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3 px-4 py-3">
                    <div className="h-8 w-8 rounded-lg bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center shrink-0">
                      <Coins className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-[#111827] truncate">
                          {entry.kpiCode} · {entry.kpiName}
                        </p>
                        <span className="text-xs font-bold text-[#7C3AED] shrink-0">{entry.actual}</span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-[#6B7280] leading-snug">{entry.comment}</p>
                      <p className="mt-1 text-[10px] text-[#9CA3AF]">{entry.submittedAt}</p>
                    </div>
                  </div>
                ))}
                {bscLog.length === 0 && <p className="py-10 text-center text-sm text-[#6B7280]">No BSC entries recorded yet.</p>}
              </div>
            </PmCard>
          </div>
        )}

        {tab === "workflow" && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                  <GitBranch className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-[#111827]">Workflow Submissions ({submissions.length})</h3>
              </div>
              <PmButton variant="primary" onClick={() => setSubmitOpen(true)}>
                <Send className="h-3.5 w-3.5" /> New Submission
              </PmButton>
            </div>
            <PmCard className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[820px]">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wide text-[#9CA3AF] border-b border-[#F1F5F9]">
                      {["Submission", "Type", "Submitted By", "Submitted At", "Current Step", "Status"].map((h) => (
                        <th key={h} className="py-2.5 px-3 font-semibold whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((s) => (
                      <tr key={s.id} className="border-b border-[#F1F5F9] hover:bg-[#FAFAFA]">
                        <td className="py-3 px-3 max-w-[240px]">
                          <p className="font-medium text-[#111827] truncate">{s.title}</p>
                          <p className="text-[10px] text-[#9CA3AF]">{s.id}</p>
                        </td>
                        <td className="py-3 px-3 text-[#374151] whitespace-nowrap">{s.type}</td>
                        <td className="py-3 px-3 text-[#374151] whitespace-nowrap">{s.submittedBy}</td>
                        <td className="py-3 px-3 text-[#6B7280] whitespace-nowrap">{s.submittedAt}</td>
                        <td className="py-3 px-3 text-[#374151] whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5">
                            <Clock3 className="h-3 w-3 text-[#9CA3AF]" /> {s.step}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <PmStatusPill label={s.status} tone={workflowStatusTone[s.status]} />
                        </td>
                      </tr>
                    ))}
                    {submissions.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-sm text-[#6B7280]">
                          No workflow submissions yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </PmCard>
          </>
        )}
      </div>

      <PmModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New Task"
        description="Create a task and assign it to yourself or a team member."
        footer={
          <>
            <PmButton variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </PmButton>
            <PmButton variant="primary" onClick={handleCreateTask}>
              Create Task
            </PmButton>
          </>
        }
      >
        <div className="space-y-3">
          <label className="block">
            <span className="block text-xs font-medium text-[#374151] mb-1">Task Title *</span>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Submit Q3 KPI actuals"
              className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] text-sm outline-none focus:border-[#7C3AED]"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-[#374151] mb-1">Description</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-sm outline-none focus:border-[#7C3AED] resize-none"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs font-medium text-[#374151] mb-1">Assignee</span>
              <input
                value={form.assignee}
                onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] text-sm"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-[#374151] mb-1">Department</span>
              <select
                value={form.dept}
                onChange={(e) => setForm((f) => ({ ...f, dept: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] text-sm bg-white"
              >
                {["Finance", "Sales & Marketing", "Operations", "Human Resources", "Information Technology", "Customer Success", "Executive"].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs font-medium text-[#374151] mb-1">Priority</span>
              <select
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as TaskPriority }))}
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] text-sm bg-white"
              >
                {(["Low", "Medium", "High"] as TaskPriority[]).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-[#374151] mb-1">Due Date</span>
              <input
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                placeholder="e.g. 30 Jul 2026"
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] text-sm"
              />
            </label>
          </div>
        </div>
      </PmModal>

      <PmModal
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
        title="New Workflow Submission"
        description="Submit an item for approval routing."
        footer={
          <>
            <PmButton variant="outline" onClick={() => setSubmitOpen(false)}>
              Cancel
            </PmButton>
            <PmButton variant="primary" onClick={handleCreateSubmission}>
              <Send className="h-3.5 w-3.5" /> Submit
            </PmButton>
          </>
        }
      >
        <div className="space-y-3">
          <label className="block">
            <span className="block text-xs font-medium text-[#374151] mb-1">Title *</span>
            <input
              value={submitForm.title}
              onChange={(e) => setSubmitForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Q2 Sales Department Scorecard"
              className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] text-sm outline-none focus:border-[#7C3AED]"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-[#374151] mb-1">Submission Type</span>
            <select
              value={submitForm.type}
              onChange={(e) => setSubmitForm((f) => ({ ...f, type: e.target.value }))}
              className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] text-sm bg-white"
            >
              {["Scorecard Approval", "CAP Approval", "KPI Change Request", "Contract Approval", "Goal Change Request"].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-[#374151] mb-1">Routing Note</span>
            <input
              value={submitForm.step}
              onChange={(e) => setSubmitForm((f) => ({ ...f, step: e.target.value }))}
              placeholder="e.g. Department Head → COO"
              className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] text-sm"
            />
          </label>
        </div>
      </PmModal>
    </div>
  )
}

export function TasksMockScreen() {
  return (
    <Suspense fallback={<div className="min-h-full" />}>
      <TasksMockScreenInner />
    </Suspense>
  )
}
