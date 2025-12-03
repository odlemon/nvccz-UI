"use client"

import { useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { 
  addTask, 
  updateTask, 
  removeTask,
  setSelectedPriority,
  setSelectedStatus,
  setSearchTerm 
} from "@/lib/store/slices/performanceSlice"
import { performanceAPI } from "@/lib/api/performance-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  CiEdit, 
  CiTrash, 
  CiSearch,
  CiCalendar,
  CiDollar,
  CiCircleCheck as CiTarget,
  CiUser as CiUsers,
  CiCircleCheck as CiCheckmark,
  CiCirclePlus as CiPlus,
  CiFlag1 as CiFlag
} from "react-icons/ci"
import { toast } from "sonner"
import { TaskFormModal } from "./task-form-modal"

export function TasksManagement() {
  const dispatch = useAppDispatch()
  const { tasks, goals, selectedPriority, selectedStatus, searchTerm } = useAppSelector((state) => state.performance)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<any>(null)

  const filteredTasks = tasks.filter(task => {
    const matchesPriority = selectedPriority === "all" || task.priority === selectedPriority
    const matchesStatus = selectedStatus === "all" || task.status === selectedStatus
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesPriority && matchesStatus && matchesSearch
  })

  const handleCreateTask = async (taskData: any) => {
    try {
      const newTask = await performanceAPI.createTask(taskData)
      dispatch(addTask(newTask))
      toast.success("Task created successfully")
      setIsDialogOpen(false)
    } catch (error) {
      toast.error("Failed to create task")
    }
  }

  const handleUpdateTask = async (id: string, updates: any) => {
    try {
      const updatedTask = await performanceAPI.updateKPI(id, updates)
      dispatch(updateTask({ id, updates: updatedTask }))
      toast.success("Task updated successfully")
      setIsDialogOpen(false)
      setEditingTask(null)
    } catch (error) {
      toast.error("Failed to update task")
    }
  }

  const handleDeleteTask = async (id: string) => {
    try {
      await performanceAPI.deleteKPI(id)
      dispatch(removeTask(id))
      toast.success("Task deleted successfully")
    } catch (error) {
      toast.error("Failed to delete task")
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'not_started': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'investment': return 'bg-blue-100 text-blue-800'
      case 'operational': return 'bg-green-100 text-green-800'
      case 'strategic': return 'bg-purple-100 text-purple-800'
      case 'compliance': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-500"
    if (progress >= 60) return "bg-blue-500"
    if (progress >= 40) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900">Tasks Management</h1>
          <p className="text-gray-600 font-normal">Create and track performance tasks</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full gradient-primary text-white">
              <CiPlus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl md:max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                {editingTask ? "Edit Task" : "Create New Task"}
              </DialogTitle>
            </DialogHeader>
            <TaskFormModal 
              task={editingTask}
              goals={goals}
              onSave={editingTask ? 
                (updates) => handleUpdateTask(editingTask.id, updates) : 
                handleCreateTask
              }
              onClose={() => {
                setIsDialogOpen(false)
                setEditingTask(null)
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <CiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => dispatch(setSearchTerm(e.target.value))}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={selectedPriority} onValueChange={(value) => dispatch(setSelectedPriority(value))}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedStatus} onValueChange={(value) => dispatch(setSelectedStatus(value))}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="not_started">Not Started</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tasks Grid */}
      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <Card key={task.id} className="bg-white border border-gray-200 rounded-2xl shadow-none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{task.title}</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="rounded-full w-9 h-9 p-0 gradient-primary text-white" onClick={() => setEditingTask(task)}>
                    <CiEdit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-full w-9 h-9 p-0 gradient-primary text-white" onClick={() => handleDeleteTask(task.id)}>
                    <CiTrash className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={getPriorityColor(task.priority)}>
                  {task.priority}
                </Badge>
                <Badge className={getStatusColor(task.status)}>
                  {task.status.replace('_', ' ')}
                </Badge>
                <Badge className={getCategoryColor(task.category)}>
                  {task.category}
                </Badge>
                {task.isPerformanceTask && (
                  <Badge variant="outline" className="text-blue-600 border-blue-600">
                    <CiTarget className="w-3 h-3 mr-1" />
                    Performance
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">{task.description}</p>
              
              <div className="space-y-4">
                {/* Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progress: {task.progress}%</span>
                    <span className="text-gray-500">
                      {task.startDate} - {task.endDate}
                    </span>
                  </div>
                  <div className="relative h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                </div>

                {/* Value Information */}
                <div className="grid grid-cols-2 gap-4">
                  {task.monetaryValue && (
                    <div className="flex items-center gap-2 text-sm">
                      <CiDollar className="w-4 h-4 text-green-600" />
                      <span>Value: ${task.monetaryValue.toLocaleString()}</span>
                    </div>
                  )}
                  {task.percentValue && (
                    <div className="flex items-center gap-2 text-sm">
                      <CiTarget className="w-4 h-4 text-blue-600" />
                      <span>Target: {task.percentValue}%</span>
                    </div>
                  )}
                </div>

                {/* Team and Goal Information */}
                <div className="grid grid-cols-2 gap-4">
                  {task.team.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CiUsers className="w-4 h-4" />
                      <span>Team: {task.team.length} members</span>
                    </div>
                  )}
                  {task.goalId && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CiFlag className="w-4 h-4" />
                      <span>
                        Goal: {goals.find(g => g.id === task.goalId)?.title || 'Unknown Goal'}
                      </span>
                    </div>
                  )}
                </div>

                {/* KPI Information */}
                {task.kpi && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                      <CiTarget className="w-4 h-4" />
                      KPI Target
                    </div>
                    <div className="text-sm text-gray-600">
                      {task.kpi.type}: {task.kpi.target} {task.kpi.unit}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <CiCheckmark className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedPriority !== "all" || selectedStatus !== "all"
              ? "Try adjusting your search or filter criteria"
              : "Get started by creating your first task"
            }
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <CiPlus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>
      )}
    </div>
  )
}
