"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { AppUser } from "@/lib/api/users-api"
import type { FpaModelPlanningTaskCreateRequest } from "@/lib/api/fpa-api"
import { planningUserLabel, planningUserMatchesDept } from "@/lib/fpa/planning-user-utils"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const FIELD =
  "mt-1 w-full h-9 rounded-full border border-[#e2e8f0] px-3 text-sm text-[#0f172a] bg-white"
const SELECT_TRIGGER =
  "mt-1 w-full h-9 rounded-full border border-[#e2e8f0] bg-white px-3 text-sm text-[#0f172a] shadow-none focus:ring-2 focus:ring-[#2563eb]/30"

export type PlanningAssignDept = { id: string; name: string; assigneeId?: string | null }

export function PlanningAssignTaskDialog({
  open,
  onOpenChange,
  departments,
  users,
  defaultDepartmentId,
  busy,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  departments: PlanningAssignDept[]
  users: AppUser[]
  defaultDepartmentId?: string | null
  busy?: boolean
  onSubmit: (body: FpaModelPlanningTaskCreateRequest) => Promise<void>
}) {
  const [title, setTitle] = useState("")
  const [departmentId, setDepartmentId] = useState("")
  const [assigneeId, setAssigneeId] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [priority, setPriority] = useState("MEDIUM")
  const [description, setDescription] = useState("")

  useEffect(() => {
    if (!open) return
    setTitle("")
    setDueDate("")
    setPriority("MEDIUM")
    setDescription("")
    const dept =
      defaultDepartmentId && departments.some((d) => d.id === defaultDepartmentId)
        ? defaultDepartmentId
        : departments[0]?.id || ""
    setDepartmentId(dept)
    const owner = departments.find((d) => d.id === dept)
    setAssigneeId(owner?.assigneeId || "")
  }, [open, defaultDepartmentId, departments])

  const assigneeOptions = useMemo(() => {
    if (!departmentId) return [] as AppUser[]
    const dept = departments.find((d) => d.id === departmentId)
    return users.filter((u) => planningUserMatchesDept(u, dept))
  }, [users, departmentId, departments])

  useEffect(() => {
    if (!departmentId) {
      setAssigneeId("")
      return
    }
    if (assigneeId && assigneeOptions.some((u) => u.id === assigneeId)) return
    const owner = departments.find((d) => d.id === departmentId)
    if (owner?.assigneeId && assigneeOptions.some((u) => u.id === owner.assigneeId)) {
      setAssigneeId(owner.assigneeId)
      return
    }
    setAssigneeId(assigneeOptions[0]?.id || "")
  }, [departmentId, assigneeOptions, assigneeId, departments])

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Task title is required")
      return
    }
    if (!assigneeId) {
      toast.error("Select an assignee")
      return
    }
    try {
      await onSubmit({
        title: title.trim(),
        assigneeId,
        departmentId: departmentId || null,
        dueDate: dueDate || null,
        priority: priority || null,
        description: description.trim() || null,
      })
      onOpenChange(false)
    } catch {
      /* parent toasts */
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-xl border-[#e2e8f0] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 py-4 border-b border-[#eaecf0] space-y-0">
          <DialogTitle className="text-[16px] font-semibold text-[#101828]">
            Assign planning task
          </DialogTitle>
          <p className="text-[12px] text-[#667085] mt-1 font-normal">
            e.g. Review Marketing Plan — notifies the assignee for this cycle.
          </p>
        </DialogHeader>
        <div className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="text-[11px] font-medium text-[#0f172a]">Task title</label>
            <input
              className={FIELD}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Review Marketing Plan"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-[#0f172a]">Department</label>
            <Select
              value={departmentId || undefined}
              onValueChange={(v) => {
                setDepartmentId(v)
                setAssigneeId("")
              }}
              disabled={!departments.length}
            >
              <SelectTrigger className={SELECT_TRIGGER}>
                <SelectValue
                  placeholder={
                    departments.length ? "Select department…" : "No departments available"
                  }
                />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-[#e2e8f0]">
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id} className="rounded-lg text-sm">
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[11px] font-medium text-[#0f172a]">Assignee</label>
            <Select
              value={assigneeId || undefined}
              onValueChange={setAssigneeId}
              disabled={!departmentId}
            >
              <SelectTrigger className={SELECT_TRIGGER}>
                <SelectValue
                  placeholder={
                    !departmentId
                      ? "Pick department first"
                      : assigneeOptions.length
                        ? "Select user…"
                        : "No users in this department"
                  }
                />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-[#e2e8f0]">
                {assigneeOptions.map((u) => (
                  <SelectItem key={u.id} value={u.id} className="rounded-lg text-sm">
                    {planningUserLabel(u)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-[#0f172a]">Due date</label>
              <input
                type="date"
                className={FIELD}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-[#0f172a]">Priority</label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className={SELECT_TRIGGER}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-[#e2e8f0]">
                  {["HIGH", "MEDIUM", "LOW"].map((p) => (
                    <SelectItem key={p} value={p} className="rounded-lg text-sm">
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-medium text-[#0f172a]">Notes (optional)</label>
            <textarea
              className="mt-1 w-full min-h-[72px] rounded-xl border border-[#e2e8f0] px-3 py-2 text-sm text-[#0f172a] bg-white"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What should they review or update?"
            />
          </div>
        </div>
        <DialogFooter className="px-5 py-3 border-t border-[#eaecf0] gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => onOpenChange(false)}
            className="h-9 rounded-full border border-[#e2e8f0] bg-white px-4 text-xs font-medium text-[#0f172a]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy || !departments.length}
            onClick={() => void handleSubmit()}
            className="h-9 inline-flex items-center gap-1.5 rounded-full bg-[#2563eb] px-4 text-xs font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            Assign task
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
