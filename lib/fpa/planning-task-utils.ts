import type { FpaCycleTask } from "@/lib/api/fpa-api"
import type { PlanningTask } from "@/components/fpa/planning/planning-collab-sidebar"

function formatTaskDue(dueDate?: string | null): string {
  if (!dueDate) return ""
  const d = new Date(dueDate)
  if (Number.isNaN(d.getTime())) return dueDate
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })
}

function isTaskDone(status?: string | null): boolean {
  const st = String(status || "").toUpperCase()
  return (
    st === "COMPLETED" ||
    st === "APPROVED" ||
    st === "CLOSED" ||
    st === "SUBMITTED"
  )
}

export function mapCycleTaskToPlanningTask(
  t: FpaCycleTask,
  kind: PlanningTask["kind"] = "planning",
): PlanningTask {
  const resolvedKind: PlanningTask["kind"] =
    t.isDeptPlan === true || String(t.taskKind || "").toUpperCase() === "OWNER_SLICE"
      ? "owner_slice"
      : kind
  return {
    id: t.id,
    title: t.title || "Planning task",
    assignee: t.assigneeName || t.departmentName || "Unassigned",
    due: formatTaskDue(t.dueDate),
    dueDate: t.dueDate || undefined,
    done: isTaskDone(t.status),
    departmentId: t.departmentId || undefined,
    departmentName: t.departmentName || undefined,
    assigneeId: t.assigneeId || undefined,
    status: String(t.status || ""),
    priority: t.priority || undefined,
    description: t.description || undefined,
    kind: resolvedKind,
  }
}

export function mapOwnerSliceToPlanningTask(owner: {
  departmentId: string
  departmentName?: string | null
  assigneeName?: string | null
  taskId?: string | null
  status?: string | null
  dueDate?: string | null
}): PlanningTask | null {
  if (!owner.taskId || !owner.departmentId) return null
  return {
    id: owner.taskId,
    title: `${owner.departmentName || "Department"} plan input`,
    assignee: owner.assigneeName || owner.departmentName || "Owner",
    due: formatTaskDue(owner.dueDate),
    dueDate: owner.dueDate || undefined,
    done: isTaskDone(owner.status),
    departmentId: owner.departmentId,
    departmentName: owner.departmentName || undefined,
    status: String(owner.status || ""),
    kind: "owner_slice",
  }
}
