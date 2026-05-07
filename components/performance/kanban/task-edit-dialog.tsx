"use client"

import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { updateKanbanTask } from "@/lib/store/slices/performanceTasksSlice"
import { fetchAvailableDepartments } from "@/lib/store/slices/performanceSlice"
import { usersApi, AppUser } from "@/lib/api/users-api"
import {
  setUsers as setReduxUsers,
  setUsersLoading as setReduxUsersLoading,
} from "@/lib/store/slices/usersSlice"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import {
  PerformanceTask,
  TaskStage,
  TaskPriority,
  teamMemberIds,
  hydratedTeam,
} from "@/lib/api/performance-tasks-api"
import { Loader2, X, Users, Save } from "lucide-react"
import { toast } from "sonner"
import { extractApiError } from "@/lib/utils/api-error"

interface Props {
  open: boolean
  task: PerformanceTask
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}

export function TaskEditDialog({ open, task, onOpenChange, onSaved }: Props) {
  const dispatch = useAppDispatch()
  const { availableDepartments } = useAppSelector((s) => s.performance)

  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || "")
  const [stage, setStage] = useState<TaskStage>(task.stage)
  const [priority, setPriority] = useState<TaskPriority>(task.priority)
  const [date, setDate] = useState<Date | undefined>(
    task.date || task.dueDate
      ? new Date(task.date || (task.dueDate as string))
      : undefined
  )
  const [department, setDepartment] = useState<string>(task.department || "")
  const [team, setTeam] = useState<string[]>(teamMemberIds(task.team))
  const [teamSearch, setTeamSearch] = useState("")
  const reduxUsers = useAppSelector((s) => s.users.items)
  const [users, setLocalUsers] = useState<AppUser[]>(reduxUsers)
  const [usersLoading, setUsersLoadingLocal] = useState(false)
  const [usersError, setUsersError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Sync from redux if it's already populated
  useEffect(() => {
    if (reduxUsers.length > 0 && users.length === 0) {
      setLocalUsers(reduxUsers)
    }
  }, [reduxUsers, users.length])

  useEffect(() => {
    if (!open) return
    setTitle(task.title)
    setDescription(task.description || "")
    setStage(task.stage)
    setPriority(task.priority)
    setDate(
      task.date || task.dueDate
        ? new Date(task.date || (task.dueDate as string))
        : undefined
    )
    setDepartment(task.department || "")
    setTeam(teamMemberIds(task.team))
    if (availableDepartments.length === 0) {
      dispatch(fetchAvailableDepartments())
    }
  }, [open, task, dispatch, availableDepartments.length])

  const loadUsers = async () => {
    setUsersLoadingLocal(true)
    setUsersError(null)
    dispatch(setReduxUsersLoading(true))
    try {
      const res: any = await usersApi.getAll()
      const list: AppUser[] = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.users)
        ? res.users
        : Array.isArray(res)
        ? res
        : []
      setLocalUsers(list)
      dispatch(setReduxUsers(list))
      if (list.length === 0) {
        setUsersError("No users returned from /users endpoint")
      }
    } catch (e: any) {
      console.error("[task-edit-dialog] failed to load users", e)
      setUsersError(e?.message || "Failed to load users")
      setLocalUsers([])
    } finally {
      setUsersLoadingLocal(false)
      dispatch(setReduxUsersLoading(false))
    }
  }

  useEffect(() => {
    if (!open) return
    if (users.length > 0) return
    loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required")
      return
    }
    if (team.length === 0) {
      toast.error("Assign at least one team member")
      return
    }
    setSaving(true)
    try {
      await dispatch(
        updateKanbanTask({
          id: task.id,
          data: {
            title: title.trim(),
            description: description.trim() || undefined,
            stage,
            priority,
            team,
            ...(date ? { date: date.toISOString() } : {}),
            ...(department ? { department } : {}),
          } as any,
        })
      ).unwrap()
      toast.success("Task updated")
      onSaved?.()
    } catch (e: any) {
      toast.error(extractApiError(e, "Failed to update task"))
    } finally {
      setSaving(false)
    }
  }

  const filteredUsers = users.filter((u) => {
    const name = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase()
    const email = (u.email || "").toLowerCase()
    return (
      name.includes(teamSearch.toLowerCase()) ||
      email.includes(teamSearch.toLowerCase())
    )
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Update task fields. Reassigning notifies new team members and removes
            the task from removed users' boards.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Stage</Label>
              <Select value={stage} onValueChange={(v) => setStage(v as TaskStage)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                  <SelectItem value="completed">Complete</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as TaskPriority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Due Date</Label>
              <DatePicker
                value={date}
                onChange={setDate}
                placeholder="Select due date"
                allowFutureDates
              />
            </div>
          </div>

          <div>
            <Label>Department</Label>
            <Select value={department || "none"} onValueChange={(v) => setDepartment(v === "none" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="No department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No department</SelectItem>
                {availableDepartments.map((d: any) => (
                  <SelectItem key={d.name} value={d.name}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="flex items-center gap-2">
              <Users className="w-4 h-4" /> Team Assignees ({team.length})
            </Label>
            <Input
              placeholder="Search by name or email..."
              value={teamSearch}
              onChange={(e) => setTeamSearch(e.target.value)}
              className="mb-2"
            />
            {team.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {team.map((id) => {
                  const u =
                    users.find((u) => u.id === id) ||
                    hydratedTeam(task.team).find((t) => t.id === id)
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                    >
                      {u
                        ? `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email
                        : id}
                      <button
                        onClick={() => setTeam(team.filter((t) => t !== id))}
                        className="hover:bg-blue-200 rounded-full"
                        type="button"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )
                })}
              </div>
            )}
            <div className="border rounded-lg max-h-48 overflow-y-auto">
              {usersLoading ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />
                  <p className="text-xs">Loading users...</p>
                </div>
              ) : usersError ? (
                <div className="p-4 text-center text-sm">
                  <p className="text-red-600 mb-2">{usersError}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={loadUsers}
                    className="rounded-full"
                  >
                    Retry
                  </Button>
                </div>
              ) : filteredUsers.length === 0 ? (
                <p className="p-3 text-sm text-gray-500 text-center">
                  {teamSearch ? `No users match "${teamSearch}"` : "No users available"}
                </p>
              ) : (
                filteredUsers.slice(0, 20).map((u) => (
                  <label
                    key={u.id}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer text-sm border-b last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={team.includes(u.id)}
                      onChange={(e) => {
                        if (e.target.checked) setTeam([...team, u.id])
                        else setTeam(team.filter((t) => t !== u.id))
                      }}
                    />
                    <span>
                      {`${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email}
                      <span className="text-gray-500 ml-2 text-xs">{u.email}</span>
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="rounded-full gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
