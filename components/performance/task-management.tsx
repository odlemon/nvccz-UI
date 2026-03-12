"use client"

import { useEffect, useState } from "react"
import { useAppSelector, useAppDispatch } from "@/lib/store"
import { fetchMyTasks, fetchDepartmentTasks, updateTaskStage } from "@/lib/store/slices/taskSlice"
import { fetchAvailableDepartments } from "@/lib/store/slices/performanceSlice"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CiViewList as List, CiViewBoard as Kanban, CiSearch } from "react-icons/ci"
import { LayoutGrid, LayoutList } from "lucide-react"
import { toast } from "sonner"
import { TaskCard } from "./task-card"
import { TaskDrawerView } from "./task-drawer-view"
import { GoalHierarchyInfo } from "./goal-hierarchy-info"
import { TaskBoardView } from "./task-board-view"
import { usePerformancePermissions } from "@/lib/hooks/usePerformancePermissions"

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
  const { tasks, loading: isLoading, error } = useAppSelector((state) => state.tasks)
  const { availableDepartments } = useAppSelector((state) => state.performance)

  const [activeTab, setActiveTab] = useState<TaskView>("my-tasks")
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null)

  useEffect(() => {
    dispatch(fetchAvailableDepartments())
  }, [dispatch])

  useEffect(() => {
    if (activeTab === "my-tasks") {
      dispatch(fetchMyTasks())
    } else if (activeTab === "department-tasks" && selectedDepartment) {
      dispatch(fetchDepartmentTasks(selectedDepartment))
    }
  }, [activeTab, selectedDepartment, dispatch])

  useEffect(() => {
    if (error) {
      toast.error(error)
    }
  }, [error])

  const filteredTasks = (tasks || []).filter(
    (task) =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleUpdateStage = async (taskId: string, stage: string, notes?: string) => {
    try {
      await dispatch(updateTaskStage({ taskId, stage, notes })).unwrap()
      toast.success("Task stage updated successfully")
      // Refresh tasks
      if (activeTab === "my-tasks") {
        dispatch(fetchMyTasks())
      } else if (selectedDepartment) {
        dispatch(fetchDepartmentTasks(selectedDepartment))
      }
    } catch (error) {
      toast.error("Failed to update task stage")
    }
  }

  const handleEditTask = (task: any) => {
    setSelectedTaskId(task.id)
  }

  const handleDeleteTask = async (taskId: string) => {
    // Implement delete functionality if needed
    toast.info("Delete functionality to be implemented")
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
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <CiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-full"
          />
        </div>
        {activeTab === "department-tasks" && (
          <Select
            onValueChange={(value) => {
              setSelectedDepartment(value)
              if (value) {
                dispatch(fetchDepartmentTasks(value))
              }
            }}
            value={selectedDepartment || ""}
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
        
        {/* View Toggle Buttons */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
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
      </div>

      {/* Tasks Display */}
      {isLoading ? (
        <TaskPageSkeleton />
      ) : activeTab === "my-tasks" || (activeTab === "department-tasks" && selectedDepartment) ? (
        viewMode === "list" ? (
          <div className="space-y-4">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <TaskCard key={task.id} task={task} onClick={setSelectedTaskId} />
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-4">
                  <List className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tasks Found</h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm
                    ? "No tasks match your current search."
                    : activeTab === "department-tasks"
                      ? "No tasks found for the selected department."
                      : "You have no tasks assigned to you."}
                </p>
              </div>
            )}
          </div>
        ) : (
          <TaskBoardView
            tasks={filteredTasks}
            loading={isLoading}
            onUpdateStage={handleUpdateStage}
            onEditTask={permissions.canUpdateDepartmentTask || permissions.canUpdateAnyTask ? handleEditTask : undefined}
            onDeleteTask={permissions.canDeleteDepartmentTask || permissions.canDeleteAnyTask ? handleDeleteTask : undefined}
            onViewTask={(task) => setSelectedTaskId(task.id)}
          />
        )
      ) : activeTab === "department-tasks" && !selectedDepartment ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Please select a department to view tasks.</p>
        </div>
      ) : null}

      {/* View Drawer */}
      {selectedTaskId && (
        <Sheet open={!!selectedTaskId} onOpenChange={(open) => !open && setSelectedTaskId(null)}>
          <SheetContent className="w-[800px] sm:max-w-[800px] overflow-y-auto">
            <TaskDrawerView 
              task={(tasks || []).find((task) => task.id === selectedTaskId)} 
              onClose={() => setSelectedTaskId(null)}
            />
          </SheetContent>
        </Sheet>
      )}
    </div>
  )
}
