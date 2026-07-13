import type {
  FpaApprovalEvent,
  FpaBudgetCycle,
  FpaBudgetCycleStatus,
  FpaCycleTask,
  FpaReviewWorkspace,
  FpaTask,
  FpaWorkflowStage,
} from "@/lib/api/fpa-api"
import { BUDGET_STATUS_LABEL } from "@/components/fpa/budget/budget-constants"
import { looksLikeDbId } from "@/lib/fpa/humanize-dept-message"

/** Resolve a human-readable department label when the API returns CUIDs as names. */
export function humanDeptName(
  departmentId?: string | null,
  departmentName?: string | null,
  owners?: FpaBudgetCycle["owners"],
  deptById?: Map<string, string> | null,
  taskTitle?: string | null,
): string {
  if (departmentName && !looksLikeDbId(departmentName)) return departmentName
  if (departmentId) {
    const fromOwner = owners?.find((o) => o.departmentId === departmentId)?.departmentName
    if (fromOwner && !looksLikeDbId(fromOwner)) return fromOwner
    const mapped = deptById?.get(departmentId)
    if (mapped && !looksLikeDbId(mapped)) return mapped
  }
  if (departmentName && looksLikeDbId(departmentName)) {
    const mapped = deptById?.get(departmentName)
    if (mapped && !looksLikeDbId(mapped)) return mapped
  }
  if (taskTitle?.includes(" — ")) {
    const part = taskTitle.split(" — ").pop()?.trim()
    if (part && !looksLikeDbId(part)) return part
  }
  return "Department"
}

export type WorkflowTab = "All" | "My Tasks" | "Pending Review" | "Returned"

export type WorkflowTaskRow = {
  id: string
  title: string
  status: string
  priority?: string | null
  dueDate?: string | null
  submittedOn?: string | null
  changeNotes?: string | null
  departmentId?: string | null
  departmentName?: string | null
  assigneeId?: string | null
  assigneeName?: string | null
  reviewerId?: string | null
  reviewerName?: string | null
  workflowId?: string | null
  modelId?: string | null
  versionId?: string | null
  scenarioId?: string | null
  cycleId?: string | null
}

export const WORKFLOW_STAGES = [
  { key: "setup", label: "Setup" },
  { key: "input", label: "Department Input" },
  { key: "fpa", label: "FP&A Review" },
  { key: "cfo", label: "CFO Approval" },
  { key: "locked", label: "Locked" },
] as const

export function cycleStatusLabel(status?: string | null): string {
  if (!status) return "—"
  const key = status as FpaBudgetCycleStatus
  return BUDGET_STATUS_LABEL[key] || status.replace(/_/g, " ")
}

/** Map cycle status/stage → stepper index 0..4 */
export function workflowStepperIndex(cycle: FpaBudgetCycle | null): number {
  if (!cycle) return 0
  const st = String(cycle.status || "").toUpperCase()
  const stage = String(cycle.currentStage || "").toUpperCase()
  if (st === "LOCKED" || stage.includes("LOCK") || stage.includes("REPORT")) return 4
  if (st === "APPROVED" || st === "PENDING_CFO_REVIEW" || stage.includes("CFO")) return 3
  if (
    st === "PENDING_FPA_REVIEW" ||
    st === "PENDING_VALIDATION" ||
    stage.includes("FPA") ||
    stage.includes("VALID")
  )
    return 2
  if (
    st === "OPEN_FOR_INPUT" ||
    st === "RETURNED_FOR_CORRECTION" ||
    st === "LOADING_ACTUALS" ||
    st === "LOADING_BASELINE" ||
    stage.includes("OWNER") ||
    stage.includes("INPUT") ||
    stage.includes("ASSIGN")
  )
    return 1
  return 0
}

export function taskStatusTone(
  status: string,
): "info" | "warning" | "success" | "danger" | "neutral" {
  const s = status.toUpperCase()
  if (s === "APPROVED" || s === "SUBMITTED" || s === "COMPLETED") return "success"
  if (s === "RETURNED" || s.includes("RETURN")) return "danger"
  if (s === "IN_PROGRESS" || s === "PENDING" || s === "OPEN" || s.includes("REVIEW"))
    return "info"
  return "neutral"
}

export function normalizePriority(priority?: string | null): string | null {
  if (priority == null || priority === "") return null
  const p = String(priority).toUpperCase()
  if (p === "NORMAL") return "MEDIUM"
  if (p === "HIGH" || p === "MEDIUM" || p === "LOW") return p
  return p
}

export function priorityTone(
  priority?: string | null,
): "danger" | "warning" | "success" | "neutral" {
  const p = normalizePriority(priority) || ""
  if (p === "HIGH") return "danger"
  if (p === "MEDIUM") return "warning"
  if (p === "LOW") return "success"
  return "neutral"
}

export function formatShortDate(value?: string | null): string {
  if (!value) return "—"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value.slice(0, 10)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

/** e.g. May 22, 2025 10:15 AM */
export function formatDateTime(value?: string | null): string {
  if (!value) return "—"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export type ApprovalFeedRow = {
  id: string
  name: string
  role: string
  at: string | null
  statusLabel: string
}

/** Designer control states for task detail actions (permissions ∩ cycle ∩ task). */
export type TaskActionControls = {
  approveEnabled: boolean
  returnEnabled: boolean
  reassignEnabled: boolean
  commentEnabled: boolean
  /** Short reason shown under the action bar when actions are blocked. */
  banner: string | null
  approveTitle: string
  returnTitle: string
  reassignTitle: string
}

export function getTaskActionControls(opts: {
  cycleStatus?: string | null
  taskStatus?: string | null
  canApprove: boolean
  canReturn: boolean
  canReassign: boolean
}): TaskActionControls {
  const cycle = String(opts.cycleStatus || "").toUpperCase()
  const task = normalizeTaskStatus(opts.taskStatus)
  const locked = cycle === "LOCKED" || cycle === "REPORTS"
  const cycleApproved = cycle === "APPROVED"
  const inReview = cycle === "PENDING_FPA_REVIEW" || cycle === "PENDING_CFO_REVIEW"
  const taskDone = task === "APPROVED" || task === "COMPLETED"
  const taskReturned = task === "RETURNED"
  const taskReviewable =
    task === "SUBMITTED" ||
    task.includes("REVIEW") ||
    task === "PENDING_REVIEW" ||
    task === "IN_REVIEW"

  if (locked) {
    return {
      approveEnabled: false,
      returnEnabled: false,
      reassignEnabled: false,
      commentEnabled: false,
      banner: "This budget cycle is locked. Approve, return, and reassign are disabled.",
      approveTitle: "Cycle is locked",
      returnTitle: "Cycle is locked",
      reassignTitle: "Cycle is locked",
    }
  }

  if (cycleApproved) {
    return {
      approveEnabled: false,
      returnEnabled: false,
      reassignEnabled: false,
      commentEnabled: false,
      banner: "Budget is approved. Lock the cycle from Cycle actions when ready.",
      approveTitle: "Cycle already approved",
      returnTitle: "Cycle already approved",
      reassignTitle: "Cycle already approved — reassignment closed",
    }
  }

  if (!inReview) {
    return {
      approveEnabled: false,
      returnEnabled: false,
      reassignEnabled: Boolean(opts.canReassign) && !taskDone,
      commentEnabled: Boolean(opts.canReturn || opts.canApprove),
      banner:
        cycle === "RETURNED_FOR_CORRECTION"
          ? "Cycle was returned for correction. Owners must resubmit before review actions."
          : "Review actions unlock when the cycle is in FP&A or CFO review.",
      approveTitle: "Cycle is not in review",
      returnTitle: "Cycle is not in review",
      reassignTitle: opts.canReassign ? "Reassign task" : "No permission to reassign",
    }
  }

  if (taskDone) {
    return {
      approveEnabled: false,
      returnEnabled: false,
      reassignEnabled: false,
      commentEnabled: false,
      banner: "This task is already approved.",
      approveTitle: "Task already approved",
      returnTitle: "Task already approved",
      reassignTitle: "Task already approved",
    }
  }

  if (taskReturned) {
    return {
      approveEnabled: false,
      returnEnabled: false,
      reassignEnabled: Boolean(opts.canReassign),
      commentEnabled: Boolean(opts.canReturn || opts.canApprove),
      banner: "Task was returned. Waiting for the owner to resubmit.",
      approveTitle: "Task was returned — wait for resubmit",
      returnTitle: "Task already returned",
      reassignTitle: opts.canReassign ? "Reassign task" : "No permission to reassign",
    }
  }

  if (!taskReviewable) {
    return {
      approveEnabled: false,
      returnEnabled: false,
      reassignEnabled: Boolean(opts.canReassign),
      commentEnabled: Boolean(opts.canReturn || opts.canApprove),
      banner: "Task is not submitted for review yet.",
      approveTitle: "Submit the task before approving",
      returnTitle: "Submit the task before returning",
      reassignTitle: opts.canReassign ? "Reassign task" : "No permission to reassign",
    }
  }

  return {
    approveEnabled: Boolean(opts.canApprove),
    returnEnabled: Boolean(opts.canReturn),
    reassignEnabled: Boolean(opts.canReassign),
    commentEnabled: Boolean(opts.canApprove || opts.canReturn || opts.canReassign),
    banner: null,
    approveTitle: opts.canApprove ? "Approve this task" : "No permission to approve",
    returnTitle: opts.canReturn ? "Return with a comment" : "No permission to return",
    reassignTitle: opts.canReassign ? "Reassign task" : "No permission to reassign",
  }
}

export type CycleActionControls = {
  showFpaAccept: boolean
  showCfoApprove: boolean
  showReturn: boolean
  showLock: boolean
  commentEnabled: boolean
  readOnlyMessage: string | null
}

export function getCycleActionControls(opts: {
  cycleStatus?: string | null
  canReviewSubmissions: boolean
  canApproveBudget: boolean
  canReturnTask: boolean
  canLockVersion: boolean
}): CycleActionControls {
  const st = String(opts.cycleStatus || "").toUpperCase()

  if (st === "LOCKED" || st === "REPORTS") {
    return {
      showFpaAccept: false,
      showCfoApprove: false,
      showReturn: false,
      showLock: false,
      commentEnabled: false,
      readOnlyMessage: "This cycle is locked. Review and approval actions are closed.",
    }
  }

  const showFpaAccept = opts.canReviewSubmissions && st === "PENDING_FPA_REVIEW"
  const showCfoApprove = opts.canApproveBudget && st === "PENDING_CFO_REVIEW"
  const showReturn =
    opts.canReturnTask &&
    ((opts.canReviewSubmissions && st === "PENDING_FPA_REVIEW") ||
      (opts.canApproveBudget && st === "PENDING_CFO_REVIEW"))
  const showLock = opts.canLockVersion && st === "APPROVED"

  return {
    showFpaAccept,
    showCfoApprove,
    showReturn,
    showLock,
    commentEnabled: showFpaAccept || showCfoApprove || showReturn || showLock,
    readOnlyMessage:
      showFpaAccept || showCfoApprove || showReturn || showLock
        ? null
        : st === "APPROVED"
          ? "Budget is approved. An authorized user can lock the version."
          : st === "PENDING_FPA_REVIEW" || st === "PENDING_CFO_REVIEW"
            ? "You do not have permission for the available review actions on this cycle."
            : null,
  }
}

export function buildApprovalFeedRows(
  review: FpaReviewWorkspace | null,
  tasks: WorkflowTaskRow[],
  events?: FpaApprovalEvent[] | null,
): ApprovalFeedRow[] {
  const history = (events && events.length > 0 ? events : null) || review?.approvalHistory || []
  if (history.length > 0) {
    return history.map((h, i) => {
      const action = String(h.action || "APPROVED").toUpperCase()
      const statusLabel = action.includes("RETURN")
        ? "Returned"
        : action.includes("LOCK")
          ? "Locked"
          : action.includes("ACCEPT")
            ? "Accepted"
            : action.includes("SUBMIT")
              ? "Submitted"
              : action.includes("REASSIGN")
                ? "Reassigned"
                : "Approved"
      return {
        id: String(h.id || `hist-${i}-${h.createdAt || h.at || i}`),
        name: h.actorName || h.byName || "Reviewer",
        role: action.includes("CFO")
          ? "CFO"
          : action.includes("FPA") || action.includes("FP&A")
            ? "FP&A"
            : "Approver",
        at: h.createdAt || h.at || null,
        statusLabel,
      }
    })
  }

  return tasks
    .filter((row) => isApprovedStatus(row.status) || isReturnedStatus(row.status))
    .map((row) => ({
      id: row.id,
      name: row.reviewerName || row.assigneeName || "Assignee",
      role: row.departmentName || "Department",
      at: row.submittedOn || row.dueDate || null,
      statusLabel: isReturnedStatus(row.status) ? "Returned" : "Approved",
    }))
}

export function formatRelative(value?: string | null): string {
  if (!value) return ""
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${Math.max(1, mins)}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 48) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function normalizeTaskStatus(status?: string | null): string {
  return String(status || "PENDING").toUpperCase()
}

export function isPendingReviewStatus(status?: string | null): boolean {
  const s = normalizeTaskStatus(status)
  return s === "SUBMITTED" || s === "PENDING" || s === "IN_PROGRESS" || s === "OPEN"
}

export function isReturnedStatus(status?: string | null): boolean {
  return normalizeTaskStatus(status) === "RETURNED"
}

export function isApprovedStatus(status?: string | null): boolean {
  const s = normalizeTaskStatus(status)
  return s === "APPROVED" || s === "COMPLETED"
}

export function taskFromFpaTask(
  t: FpaTask,
  extras?: Partial<WorkflowTaskRow>,
): WorkflowTaskRow {
  return {
    id: t.id,
    title: t.title || "Budget task",
    status: String(t.status || "PENDING"),
    priority: t.priority,
    dueDate: t.dueDate,
    departmentId: t.departmentId,
    assigneeId: t.assigneeId,
    reviewerId: t.reviewerId,
    reviewerName: t.reviewerName,
    workflowId: t.workflowId,
    modelId: t.modelId,
    versionId: t.versionId,
    ...extras,
  }
}

export function mergeWorkflowTasks(opts: {
  myTasks: FpaTask[]
  cycleTasks?: FpaCycleTask[] | null
  review?: FpaReviewWorkspace | null
  cycle?: FpaBudgetCycle | null
  currentUserId?: string | null
}): WorkflowTaskRow[] {
  const byId = new Map<string, WorkflowTaskRow>()

  for (const t of opts.cycleTasks || []) {
    byId.set(t.id, {
      id: t.id,
      title: t.title || "Budget task",
      status: String(t.status || "PENDING"),
      priority: normalizePriority(t.priority) || t.priority,
      dueDate: t.dueDate,
      submittedOn: t.submittedOn,
      changeNotes: t.changeNotes,
      departmentId: t.departmentId,
      departmentName: t.departmentName,
      assigneeId: t.assigneeId,
      assigneeName: t.assigneeName,
      reviewerId: t.reviewerId,
      reviewerName: t.reviewerName,
      workflowId: t.workflowId || opts.cycle?.workflowId,
      modelId: t.modelId || opts.cycle?.modelId,
      versionId: t.versionId || opts.cycle?.versionId,
      scenarioId: t.scenarioId || opts.cycle?.scenarioId,
      cycleId: t.cycleId || opts.cycle?.id,
    })
  }

  for (const t of opts.myTasks) {
    const existing = byId.get(t.id)
    byId.set(
      t.id,
      taskFromFpaTask(t, {
        cycleId: opts.cycle?.id,
        scenarioId: opts.cycle?.scenarioId,
        modelId: t.modelId || opts.cycle?.modelId,
        versionId: t.versionId || opts.cycle?.versionId,
        // Preserve richer cycle-task fields when my-tasks is thinner
        submittedOn: existing?.submittedOn,
        changeNotes: existing?.changeNotes,
        departmentName: existing?.departmentName,
        assigneeName: existing?.assigneeName,
        reviewerId: existing?.reviewerId ?? t.reviewerId,
        reviewerName: existing?.reviewerName ?? t.reviewerName,
        priority: normalizePriority(t.priority) || existing?.priority || t.priority,
      }),
    )
  }

  for (const q of opts.review?.taskQueue || []) {
    if (!q.id) continue
    const existing = byId.get(q.id)
    byId.set(q.id, {
      id: q.id,
      title: q.title || existing?.title || "Budget task",
      status: q.status || existing?.status || "PENDING",
      dueDate: q.dueDate ?? existing?.dueDate,
      departmentId: q.departmentId ?? existing?.departmentId,
      departmentName: q.departmentName ?? existing?.departmentName,
      assigneeName: q.assigneeName ?? existing?.assigneeName,
      priority: normalizePriority(q.priority ?? existing?.priority) || existing?.priority,
      submittedOn: q.submittedOn ?? existing?.submittedOn,
      changeNotes: q.changeNotes ?? existing?.changeNotes,
      assigneeId: q.assigneeId ?? existing?.assigneeId,
      reviewerId: q.reviewerId ?? existing?.reviewerId,
      reviewerName: q.reviewerName ?? existing?.reviewerName,
      workflowId: existing?.workflowId || opts.cycle?.workflowId,
      modelId: existing?.modelId || opts.cycle?.modelId,
      versionId: existing?.versionId || opts.cycle?.versionId,
      scenarioId: existing?.scenarioId || opts.cycle?.scenarioId,
      cycleId: opts.cycle?.id,
    })
  }

  for (const o of opts.cycle?.owners || []) {
    if (!o.taskId) continue
    const existing = byId.get(o.taskId)
    byId.set(o.taskId, {
      id: o.taskId,
      title: existing?.title || `${o.departmentName || "Department"} budget input`,
      status: o.status || existing?.status || "PENDING",
      dueDate: o.dueDate ?? existing?.dueDate,
      departmentId: o.departmentId || existing?.departmentId,
      departmentName: o.departmentName || existing?.departmentName,
      assigneeId: o.assigneeId || existing?.assigneeId,
      assigneeName: o.assigneeName || existing?.assigneeName,
      priority: normalizePriority(existing?.priority) || existing?.priority || "MEDIUM",
      submittedOn: existing?.submittedOn,
      changeNotes: existing?.changeNotes,
      reviewerId: existing?.reviewerId,
      reviewerName: existing?.reviewerName,
      workflowId: existing?.workflowId || opts.cycle?.workflowId,
      modelId: existing?.modelId || opts.cycle?.modelId,
      versionId: existing?.versionId || opts.cycle?.versionId,
      scenarioId: existing?.scenarioId || opts.cycle?.scenarioId,
      cycleId: opts.cycle?.id,
    })
  }

  for (const wt of opts.cycle?.workflow?.tasks || []) {
    if (!wt?.id) continue
    const existing = byId.get(wt.id)
    if (!existing) continue
    byId.set(wt.id, {
      ...existing,
      reviewerId: wt.reviewerId ?? existing.reviewerId,
      reviewerName: wt.reviewerName ?? existing.reviewerName,
      status: String(wt.status || existing.status),
      assigneeId: wt.assigneeId ?? existing.assigneeId,
      submittedOn: existing.submittedOn || wt.submittedAt || null,
    })
  }

  return Array.from(byId.values()).sort((a, b) => {
    const ad = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER
    const bd = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER
    return ad - bd
  })
}

export function countReviewQueue(tasks: WorkflowTaskRow[]) {
  return {
    pending: tasks.filter((t) => isPendingReviewStatus(t.status)).length,
    returned: tasks.filter((t) => isReturnedStatus(t.status)).length,
  }
}

export function deptProgressRows(
  review: FpaReviewWorkspace | null,
  tasks: WorkflowTaskRow[],
  opts?: {
    owners?: FpaBudgetCycle["owners"]
    deptById?: Map<string, string> | null
  },
): Array<{
  departmentId: string
  departmentName: string
  submitted: number
  inReview: number
  inProgress: number
  notSubmitted: number
  total: number
  percent: number
}> {
  const map = new Map<
    string,
    {
      departmentId: string
      departmentName: string
      submitted: number
      inReview: number
      inProgress: number
      notSubmitted: number
    }
  >()

  const resolveName = (departmentId: string, departmentName: string, taskTitle?: string) =>
    humanDeptName(departmentId, departmentName, opts?.owners, opts?.deptById, taskTitle)

  const bump = (
    departmentId: string,
    departmentName: string,
    status: string,
    taskTitle?: string,
  ) => {
    const key = departmentId || departmentName || "unknown"
    const row = map.get(key) || {
      departmentId: departmentId || key,
      departmentName: resolveName(departmentId, departmentName, taskTitle),
      submitted: 0,
      inReview: 0,
      inProgress: 0,
      notSubmitted: 0,
    }
    const s = normalizeTaskStatus(status)
    if (s === "APPROVED" || s === "SUBMITTED" || s === "COMPLETED") row.submitted += 1
    else if (s.includes("REVIEW")) row.inReview += 1
    else if (s === "IN_PROGRESS" || s === "OPEN") row.inProgress += 1
    else if (s === "RETURNED" || s === "PENDING") row.notSubmitted += 1
    else row.notSubmitted += 1
    map.set(key, row)
  }

  if (review?.submissionRegister?.length) {
    for (const r of review.submissionRegister) {
      bump(r.departmentId || "", r.departmentName || "", r.status || "PENDING")
    }
  } else {
    for (const t of tasks) {
      bump(t.departmentId || "", t.departmentName || "", t.status, t.title)
    }
  }

  return Array.from(map.values()).map((r) => {
    const total = Math.max(1, r.submitted + r.inReview + r.inProgress + r.notSubmitted)
    const done = r.submitted + r.inReview
    return {
      ...r,
      total,
      percent: Math.round((done / total) * 100),
    }
  })
}

function stageRangeLabel(stage?: FpaWorkflowStage | null): string {
  if (!stage) return ""
  const start = stage.start ? formatShortDate(stage.start) : ""
  const end = stage.end ? formatShortDate(stage.end) : ""
  if (start && end) return `${start} – ${end}`
  if (start && !end) return `Starts ${start}`
  if (!start && end) return end
  return ""
}

/** Prefer API `stages[]`; fall back to cycle horizon dates. */
export function stepperDateHints(
  cycle: FpaBudgetCycle | null,
  stages?: FpaWorkflowStage[] | null,
): string[] {
  const fromApi = stages || cycle?.stages
  if (fromApi && fromApi.length > 0) {
    const byKey = new Map(fromApi.map((s) => [String(s.key || "").toUpperCase(), s]))
    const order = ["SETUP", "DEPT_INPUT", "FPA_REVIEW", "CFO_APPROVAL", "LOCKED"]
    return order.map((key) => stageRangeLabel(byKey.get(key) || null))
  }
  if (!cycle) return ["", "", "", "", ""]
  const start = cycle.startDate ? formatShortDate(cycle.startDate) : ""
  const end = cycle.endDate ? formatShortDate(cycle.endDate) : ""
  const due = cycle.submissionDeadline ? formatShortDate(cycle.submissionDeadline) : ""
  return [
    start,
    start && due ? `${start} – ${due}` : due || start,
    due,
    end,
    end,
  ]
}

export function workflowStagesFromApi(
  cycle: FpaBudgetCycle | null,
  review?: FpaReviewWorkspace | null,
): FpaWorkflowStage[] {
  return review?.stages || cycle?.stages || []
}
