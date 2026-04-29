"use client"

import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { createKanbanTask } from "@/lib/store/slices/performanceTasksSlice"
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
import { TaskStage, TaskPriority } from "@/lib/api/performance-tasks-api"
import { Loader2, X, Users, Target, BarChart3 } from "lucide-react"
import { toast } from "sonner"
import { SingleGoalPicker, PickedGoal } from "@/components/performance/configuration/single-goal-picker"
import { RichTextEditor } from "@/components/ui/rich-text-editor"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaskCreateDialog({ open, onOpenChange }: Props) {
  const dispatch = useAppDispatch()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [stage, setStage] = useState<TaskStage>("todo")
  const [priority, setPriority] = useState<TaskPriority>("medium")
  const [date, setDate] = useState("")
  const [team, setTeam] = useState<string[]>([])
  const [department, setDepartment] = useState("")
  const [isPerformance, setIsPerformance] = useState(false)
  const [goalId, setGoalId] = useState<string | null>(null)
  const [pickedGoal, setPickedGoal] = useState<PickedGoal | null>(null)
  const [targetValue, setTargetValue] = useState<number>(0)
  const [performanceCategory, setPerformanceCategory] = useState("business")
  const [kpiName, setKpiName] = useState("")
  const [kpiTarget, setKpiTarget] = useState("")
  const [creating, setCreating] = useState(false)

  const [teamSearch, setTeamSearch] = useState("")
  const reduxUsers = useAppSelector((s) => s.users.items)
  const [users, setLocalUsers] = useState<AppUser[]>(reduxUsers)
  const [usersLoading, setUsersLoadingLocal] = useState(false)
  const [usersError, setUsersError] = useState<string | null>(null)

  // Sync local users from redux when redux gets populated
  useEffect(() => {
    if (reduxUsers.length > 0 && users.length === 0) {
      setLocalUsers(reduxUsers)
    }
  }, [reduxUsers, users.length])

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
      console.error("[task-create-dialog] failed to load users", e)
      setUsersError(e?.message || "Failed to load users")
      setLocalUsers([])
    } finally {
      setUsersLoadingLocal(false)
      dispatch(setReduxUsersLoading(false))
    }
  }

  // Fetch on open if not already loaded
  useEffect(() => {
    if (!open) return
    if (users.length > 0) return
    loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const reset = () => {
    setTitle("")
    setDescription("")
    setStage("todo")
    setPriority("medium")
    setDate("")
    setTeam([])
    setDepartment("")
    setIsPerformance(false)
    setGoalId(null)
    setPickedGoal(null)
    setTargetValue(0)
    setPerformanceCategory("business")
    setKpiName("")
    setKpiTarget("")
  }

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error("Title is required")
      return
    }
    if (team.length === 0) {
      toast.error("Assign at least one team member")
      return
    }
    setCreating(true)
    try {
      await dispatch(
        createKanbanTask({
          title: title.trim(),
          description: description.trim() || undefined,
          stage,
          priority,
          team,
          ...(date ? { date: new Date(date).toISOString() } : {}),
          ...(department ? { department } : {}),
          isPerformanceTask: isPerformance,
          ...(isPerformance ? {
            goalId,
            targetValue,
            performanceCategory,
            kpi: kpiName ? { title: kpiName, target: kpiTarget } : {},
          } : {})
        } as any)
      ).unwrap()
      toast.success("Task created")
      reset()
      onOpenChange(false)
    } catch (e: any) {
      toast.error(e?.message || "Failed to create task")
    } finally {
      setCreating(false)
    }
  }

  const filteredUsers = users.filter((u) => {
    const name = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase()
    const email = (u.email || "").toLowerCase()
    return name.includes(teamSearch.toLowerCase()) || email.includes(teamSearch.toLowerCase())
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset()
        onOpenChange(o)
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
          <DialogDescription>
            Assign a task to one or more team members. Assignees receive a
            TASK_ASSIGNED notification.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Compile April KPI pack"
            />
          </div>

          <div>
            <Label>Description</Label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Enter task details. Use @ to mention team members."
              mentions={users.map(u => ({
                id: u.id,
                label: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email
              }))}
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
                  <SelectItem value="amber">Amber</SelectItem>
                  <SelectItem value="red">Red</SelectItem>
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
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
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
                  const u = users.find((u) => u.id === id)
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

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="perfTask"
              checked={isPerformance}
              onChange={(e) => setIsPerformance(e.target.checked)}
            />
            <Label htmlFor="perfTask" className="cursor-pointer">
              This is a performance task (links to a goal)
            </Label>
          </div>

          {isPerformance && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-blue-700">
                    <Target className="w-4 h-4" /> Link to Goal
                  </Label>
                  <SingleGoalPicker
                    value={pickedGoal}
                    onChange={(g) => {
                      setPickedGoal(g)
                      setGoalId(g?.id || null)
                    }}
                    placeholder="Search goals..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-blue-700">Performance Category</Label>
                  <Select value={performanceCategory} onValueChange={setPerformanceCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="departmental">Departmental</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div className="space-y-2">
                  <Label className="text-emerald-700">Target Monetary Value</Label>
                  <Input
                    type="number"
                    value={targetValue}
                    onChange={(e) => setTargetValue(Number(e.target.value))}
                    placeholder="e.g. 5000"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-purple-700">
                    <BarChart3 className="w-4 h-4" /> KPI Metric
                  </Label>
                  <div className="space-y-2">
                    <Input
                      value={kpiName}
                      onChange={(e) => setKpiName(e.target.value)}
                      placeholder="KPI Name (e.g. Revenue)"
                      className="h-8 text-xs"
                    />
                    <Input
                      value={kpiTarget}
                      onChange={(e) => setKpiTarget(e.target.value)}
                      placeholder="KPI Target (e.g. 100%)"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={creating || !title.trim()}>
            {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Create Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
