"use client"

import { useEffect, useMemo, useState } from "react"
import { useAppSelector, useAppDispatch } from "@/lib/store"
import {
  fetchMyKanbanTasks,
  setFilters,
  setSelectedTaskId,
} from "@/lib/store/slices/performanceTasksSlice"
import { fetchAvailableDepartments } from "@/lib/store/slices/performanceSlice"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CiViewList as List, CiViewBoard as Kanban, CiSearch } from "react-icons/ci"
import { LayoutGrid, LayoutList, Calendar, Tag, Users, AlertTriangle, ListChecks } from "lucide-react"
import { toast } from "sonner"
import { GoalHierarchyInfo } from "./goal-hierarchy-info"
import { usePerformancePermissions } from "@/lib/hooks/usePerformancePermissions"
import { KanbanBoard } from "./kanban/kanban-board"
import { TaskDetailDialog } from "./kanban/task-detail-dialog"
import { TaskCreateDialog } from "./kanban/task-create-dialog"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import { format } from "date-fns"
import { PerformanceTask } from "@/lib/api/performance-tasks-api"
import {
  SingleGoalPicker,
  PickedGoal,
} from "./configuration/single-goal-picker"
import { apiClient } from "@/lib/api/api-client"

type TaskView = "my-tasks" | "department-tasks"
type ViewMode = "list" | "kanban"

const TaskPageSkeleton = () => (
  <div className="space-y-4">
    {[...Array(3)].map((_, i) => (
      <Card key={i} className="bg-white border border-gray-200 rounded-2xl shadow-none">
        <div className="p-6 space-y-4 animate-pulse">
          <div className="h-6 w-3/5 bg-gray-200 rounded" />
          <div className="flex gap-2">
            <div className="h-5 w-20 bg-gray-200 rounded-full" />
            <div className="h-5 w-16 bg-gray-200 rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded" />
            <div className="h-4 w-4/5 bg-gray-200 rounded" />
          </div>
          <div className="h-24 bg-gray-100 rounded-lg" />
        </div>
      </Card>
    ))}
  </div>
)

export function TaskManagement() {
  const dispatch = useAppDispatch()
  const { permissions } = usePerformancePermissions()
  const {
    tasks,
    loading: isLoading,
    error,
    filters,
    selectedTaskId,
  } = useAppSelector((state) => state.performanceTasks)
  const { availableDepartments } = useAppSelector((state) => state.performance)

  const [activeTab, setActiveTab] = useState<TaskView>("my-tasks")
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [pickedGoal, setPickedGoal] = useState<PickedGoal | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  // Resolve goal title when filters.goalId is set externally
  useEffect(() => {
    const id = filters.goalId
    if (!id) {
      if (pickedGoal) setPickedGoal(null)
      return
    }
    if (pickedGoal && pickedGoal.id === id) return
    let cancelled = false
    apiClient
      .get<any>(`/performance/goals/${id}`)
      .then((res) => {
        if (cancelled) return
        const goal = res?.data || res?.goal || res
        if (goal?.id && goal?.title) {
          setPickedGoal({ id: goal.id, title: goal.title })
        }
      })
      .catch(() => {
        if (!cancelled) setPickedGoal({ id, title: id })
      })
    return () => {
      cancelled = true
    }
  }, [filters.goalId, pickedGoal])

  useEffect(() => {
    dispatch(fetchAvailableDepartments())
  }, [dispatch])

  useEffect(() => {
    dispatch(fetchMyKanbanTasks(filters))
  }, [dispatch, filters])

  useEffect(() => {
    if (error) {
      toast.error(error)
    }
  }, [error])

  useEffect(() => {
    if (activeTab === "my-tasks" && filters.department) {
      dispatch(setFilters({ ...filters, department: undefined }))
    }
  }, [activeTab, dispatch, filters])

  const listTasks = useMemo(() => tasks || [], [tasks])

  const dueLabel = (task: PerformanceTask) => {
    const due = task.dueDate || task.date
    if (!due) return null
    try {
      return format(new Date(due), "MMM d, yyyy")
    } catch {
      return null
    }
  }

  const stageBadgeClass = (stage?: string) => {
    switch (stage) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in_progress":
        return "bg-blue-100 text-blue-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      case "delayed":
        return "bg-orange-100 text-orange-800"
      case "amber":
        return "bg-amber-100 text-amber-800"
      case "red":
        return "bg-red-100 text-red-800"
      case "todo":
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const priorityBadgeClass = (priority?: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      case "urgent":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900">Task Management</h1>
          <p className="text-gray-600 font-normal">
            Create, track, and manage performance tasks linked to individual goals
          </p>
        </div>
        <Button 
          onClick={() => setCreateOpen(true)}
          className="rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg transition-all duration-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Task
        </Button>
      </div>

      {/* Goal Hierarchy Info */}
      <GoalHierarchyInfo tasks={tasks || []} />

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab("my-tasks")}
            className={`relative flex items-center gap-2 py-3 px-1 text-sm font-normal transition-colors cursor-pointer ${
              activeTab === "my-tasks"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <List className="w-4 h-4" />
            Your Tasks
          </button>
          {permissions.canViewDepartmentTasks && (
          <button
            onClick={() => setActiveTab("department-tasks")}
            className={`relative flex items-center gap-2 py-3 px-1 text-sm font-normal transition-colors cursor-pointer ${
              activeTab === "department-tasks"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Kanban className="w-4 h-4" />
            Department Tasks
          </button>
          )}
        </nav>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-sm">
            <CiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search tasks..."
              value={filters.search || ""}
              onChange={(e) =>
                dispatch(
                  setFilters({
                    ...filters,
                    search: e.target.value || undefined,
                  })
                )
              }
              className="pl-10 rounded-full"
            />
          </div>

          <Select
            value={filters.stage || "all"}
            onValueChange={(value) =>
              dispatch(
                setFilters({
                  ...filters,
                  stage: value === "all" ? undefined : (value as any),
                })
              )
            }
          >
            <SelectTrigger className="w-[150px] rounded-full">
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages</SelectItem>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="delayed">Delayed</SelectItem>
              <SelectItem value="amber">Amber</SelectItem>
              <SelectItem value="red">Red</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.priority || "all"}
            onValueChange={(value) =>
              dispatch(
                setFilters({
                  ...filters,
                  priority: value === "all" ? undefined : (value as any),
                })
              )
            }
          >
            <SelectTrigger className="w-[160px] rounded-full">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>

          {activeTab === "department-tasks" && (
            <Select
              value={filters.department || ""}
              onValueChange={(value) =>
                dispatch(
                  setFilters({
                    ...filters,
                    department: value || undefined,
                  })
                )
              }
            >
              <SelectTrigger className="w-[200px] rounded-full">
                <SelectValue placeholder="Select Department" />
              </SelectTrigger>
              <SelectContent>
                {availableDepartments?.map((dept: any) => (
                  <SelectItem key={dept.name} value={dept.name}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Input
            value={filters.performanceCategory || ""}
            onChange={(e) =>
              dispatch(
                setFilters({
                  ...filters,
                  performanceCategory: e.target.value || undefined,
                })
              )
            }
            placeholder="Category"
            className="rounded-full w-[160px]"
          />

          <SingleGoalPicker
            value={pickedGoal}
            onChange={(g) => {
              setPickedGoal(g)
              dispatch(
                setFilters({
                  ...filters,
                  goalId: g?.id || undefined,
                })
              )
            }}
            placeholder="Filter by goal..."
            className="w-[200px]"
          />

          <Button
            variant={filters.isOverdue ? "default" : "outline"}
            size="sm"
            className="rounded-full gap-1"
            onClick={() =>
              dispatch(
                setFilters({
                  ...filters,
                  isOverdue: filters.isOverdue ? undefined : true,
                })
              )
            }
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Overdue
          </Button>

          <Button
            variant={filters.isPerformanceTask ? "default" : "outline"}
            size="sm"
            className="rounded-full gap-1"
            onClick={() =>
              dispatch(
                setFilters({
                  ...filters,
                  isPerformanceTask: filters.isPerformanceTask ? undefined : true,
                })
              )
            }
          >
            <ListChecks className="w-3.5 h-3.5" />
            Performance
          </Button>
        </div>

      {/* View Toggle Buttons */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1 self-start">
        <Button
          variant={viewMode === "list" ? "default" : "ghost"}
          size="sm"
          onClick={() => setViewMode("list")}
          className={`rounded-full px-4 ${
            viewMode === "list"
              ? "bg-white text-blue-600 shadow-sm hover:bg-white"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
          }`}
        >
          <LayoutList className="w-4 h-4 mr-2" />
          List
        </Button>
        <Button
          variant={viewMode === "kanban" ? "default" : "ghost"}
          size="sm"
          onClick={() => setViewMode("kanban")}
          className={`rounded-full px-4 ${
            viewMode === "kanban"
              ? "bg-white text-blue-600 shadow-sm hover:bg-white"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
          }`}
        >
          <LayoutGrid className="w-4 h-4 mr-2" />
          Kanban
        </Button>
      </div>

      {/* Tasks Display */}
      {isLoading ? (
        <TaskPageSkeleton />
      ) : activeTab === "department-tasks" && !filters.department ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Please select a department to view tasks.</p>
        </div>
      ) : viewMode === "list" ? (
        <div className="space-y-4">
          {listTasks.length > 0 ? (
            listTasks.map((task) => (
              <Card
                key={task.id}
                className="bg-white border border-gray-200 rounded-2xl shadow-none hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                onClick={() => dispatch(setSelectedTaskId(task.id))}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-medium text-gray-900">
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={stageBadgeClass(task.stage)}>
                      {task.stage?.replace("_", " ")}
                    </Badge>
                    <Badge className={priorityBadgeClass(task.priority)}>
                      {task.priority}
                    </Badge>
                    {task.isPerformanceTask && (
                      <Badge variant="outline" className="border-purple-300 text-purple-700">
                        Performance
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                    {dueLabel(task) && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {dueLabel(task)}
                      </span>
                    )}
                    {task.department && (
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3" /> {task.department}
                      </span>
                    )}
                    {task.team && task.team.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {task.team.length} assignee
                        {task.team.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-4">
                <List className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tasks Found</h3>
              <p className="text-gray-600 mb-6">
                {filters.search
                  ? "No tasks match your current search."
                  : activeTab === "department-tasks"
                    ? "No tasks found for the selected department."
                    : "You have no tasks assigned to you."}
              </p>
            </div>
          )}
        </div>
      ) : (
        <KanbanBoard />
      )}

      <TaskDetailDialog
        taskId={selectedTaskId}
        onClose={() => dispatch(setSelectedTaskId(null))}
      />

      <TaskCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  )
}
