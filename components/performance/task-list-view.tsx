"use client"

import { useState } from "react"
// Removed Card usage per new design
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Pencil,
  Trash2,
  Eye,
  MoreVertical,
  Calendar,
  User,
  Target,
  Flag,
  Clock,
  CheckCircle2,
  AlertCircle,
  List,
  Edit,
  Trash,
  Activity
} from "lucide-react"
import { Task, TaskFilters } from "@/lib/store/slices/taskSlice"
import { TaskActivityDialog } from "@/components/performance/task-activity-dialog"
import { useTaskStore } from "@/lib/store/slices/useTaskStore"
import { format } from "date-fns"
import { TaskListSkeleton } from "@/components/ui/skeleton-loaders"

interface TaskListViewProps {
  tasks: Task[]
  loading: boolean
  onEditTask: (task: Task) => void
  onDeleteTask: (taskId: string) => void
  onUpdateStage: (taskId: string, stage: string, notes?: string) => void
  filters: TaskFilters
  onFiltersChange: (filters: TaskFilters) => void
}

export function TaskListView({ 
  tasks, 
  loading, 
  onEditTask, 
  onDeleteTask, 
  onUpdateStage,
  filters,
  onFiltersChange
}: TaskListViewProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [priorityFilter, setPriorityFilter] = useState(filters.priority || "all")
  const [stageFilter, setStageFilter] = useState(filters.stage || "all")
  const [categoryFilter, setCategoryFilter] = useState(filters.category || "all")
  const [statusFilter, setStatusFilter] = useState(filters.status || "all")
  const [assignedToFilter, setAssignedToFilter] = useState(filters.assignedToId || "all")
  const [goalFilter, setGoalFilter] = useState(filters.goalId || "all")
  const [performanceTaskFilter, setPerformanceTaskFilter] = useState(filters.isPerformanceTask || "all")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showStageDialog, setShowStageDialog] = useState(false)
  const [newStage, setNewStage] = useState("")
  const [stageNotes, setStageNotes] = useState("")
  const [activityTask, setActivityTask] = useState<Task | null>(null)
  const { addTaskActivity } = useTaskStore()

  const itemsPerPage = 10

  // Handle filter changes and update backend filters
  const handlePriorityChange = (value: string) => {
    setPriorityFilter(value)
    onFiltersChange({
      ...filters,
      priority: value === "all" ? undefined : value
    })
  }

  const handleStageChange = (value: string) => {
    setStageFilter(value)
    onFiltersChange({
      ...filters,
      stage: value === "all" ? undefined : value
    })
  }

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value)
    onFiltersChange({
      ...filters,
      category: value === "all" ? undefined : value
    })
  }

  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
    onFiltersChange({
      ...filters,
      status: value === "all" ? undefined : value
    })
  }

  const handleAssignedToChange = (value: string) => {
    setAssignedToFilter(value)
    onFiltersChange({
      ...filters,
      assignedToId: value === "all" ? undefined : value
    })
  }

  const handleGoalChange = (value: string) => {
    setGoalFilter(value)
    onFiltersChange({
      ...filters,
      goalId: value === "all" ? undefined : value
    })
  }

  const handlePerformanceTaskChange = (value: string) => {
    setPerformanceTaskFilter(value)
    onFiltersChange({
      ...filters,
      isPerformanceTask: value === "all" ? undefined : value === "true"
    })
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    // Note: Search might need to be handled differently depending on backend API
    // For now, we'll keep it as frontend filtering for search
  }

  // Since we're using backend filtering, we don't need client-side filtering
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  // Paginate tasks
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedTasks = filteredTasks.slice(startIndex, endIndex)
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "overdue":
        return "bg-red-100 text-red-800 border-red-200"
      case "todo":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4" />
      case "in_progress":
        return <Clock className="h-4 w-4" />
      case "overdue":
        return <AlertCircle className="h-4 w-4" />
      case "todo":
        return <Target className="h-4 w-4" />
      default:
        return <Target className="h-4 w-4" />
    }
  }

  const handleStageUpdate = (taskId: string) => {
    onUpdateStage(taskId, newStage, stageNotes)
    setShowStageDialog(false)
    setNewStage("")
    setStageNotes("")
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy")
    } catch {
      return "Invalid date"
    }
  }

  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  if (loading) {
    return <TaskListSkeleton />
  }

  return (
    <div className="space-y-4">
      {/* Filters - No cards, direct div layout */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full"
              />
          </div>
            <Select value={priorityFilter} onValueChange={handlePriorityChange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={stageFilter} onValueChange={handleStageChange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="engineering">Engineering</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={assignedToFilter} onValueChange={handleAssignedToChange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Assigned To" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="user1">John Doe</SelectItem>
                <SelectItem value="user2">Jane Smith</SelectItem>
                <SelectItem value="user3">Bob Johnson</SelectItem>
              </SelectContent>
            </Select>
            <Select value={goalFilter} onValueChange={handleGoalChange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Goal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Goals</SelectItem>
                <SelectItem value="goal1">Q1 Sales Target</SelectItem>
                <SelectItem value="goal2">Marketing Campaign</SelectItem>
                <SelectItem value="goal3">Product Launch</SelectItem>
              </SelectContent>
            </Select>
            <Select value={performanceTaskFilter} onValueChange={handlePerformanceTaskChange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Performance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                <SelectItem value="true">Performance Tasks</SelectItem>
                <SelectItem value="false">Regular Tasks</SelectItem>
              </SelectContent>
            </Select>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {paginatedTasks.map((task) => (
          <div key={task.id} className="rounded-lg border border-gray-200 bg-white p-6 transition-all hover:border-gray-300">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  {/* Task Header */}
                  <div className="flex items-center gap-3">
                    <Badge className={getPriorityColor(task.priority)}>
                      <Flag className="h-3 w-3 mr-1" />
                      {task.priority}
                    </Badge>
                    <Badge className={getStageColor(task.stage)}>
                      {getStageIcon(task.stage)}
                      <span className="ml-1">{task.stage}</span>
                    </Badge>
                    {task.isOverdue && (
                      <Badge variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" />
                        Overdue
                      </Badge>
                    )}
                  </div>

                  {/* Task Title and Description */}
                  <div>
                    <h3 className="font-semibold text-lg">{task.title}</h3>
                    {task.description && (
                      <p className="text-muted-foreground mt-1">{task.description}</p>
                    )}
                  </div>

                  {/* Task Details */}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(task.date)}</span>
                    </div>
                    {task.goal && (
                      <div className="flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        <span>{task.goal.title}</span>
                      </div>
                    )}
                    {task.department && (
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{task.department}</span>
                      </div>
                    )}
                  </div>

                  {/* Team Members */}
                  {task.team && task.team.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Team:</span>
                      <div className="flex -space-x-2">
                        {task.team.slice(0, 3).map((memberId, index) => {
                          // Different background colors for each team member - darker for better contrast
                          const backgroundColors = [
                            "bg-blue-600",
                            "bg-green-600", 
                            "bg-purple-600",
                            "bg-orange-600",
                            "bg-pink-600",
                            "bg-indigo-600",
                            "bg-teal-600",
                            "bg-red-600"
                          ]
                          const bgColor = backgroundColors[index % backgroundColors.length]
                          
                          return (
                            <Avatar key={index} className={`h-8 w-8 border-2 border-white`}>
                              <AvatarImage src="" />
                              <AvatarFallback className={`text-xs text-white font-medium ${bgColor}`}>
                                {memberId.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )
                        })}
                        {task.team.length > 3 && (
                          <Avatar className="h-8 w-8 border-2 border-white">
                            <AvatarFallback className="text-xs text-white font-medium bg-gray-600">
                              +{task.team.length - 3}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Performance Metrics */}
                  {task.isPerformanceTask && (
                    <div className="flex gap-4 text-sm">
                      {task.monetaryValue && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Value:</span>
                          <span>${parseInt(task.monetaryValue).toLocaleString()}</span>
                        </div>
                      )}
                      {task.percentValue && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Progress:</span>
                          <span>{task.percentValue}%</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions - matching goals management style */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full w-10 h-10 p-0 bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    onClick={() => setActivityTask(task)}
                    title="Add Activity"
                  >
                    <Activity className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full w-10 h-10 p-0 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    onClick={() => setSelectedTask(task)}
                    title="View Details"
                  >
                    <List className="w-5 h-5" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full w-10 h-10 p-0 bg-gradient-to-br from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    onClick={() => onEditTask(task)}
                    title="Edit Task"
                  >
                    <Edit className="w-5 h-5" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full w-10 h-10 p-0 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    onClick={() => onDeleteTask(task.id)}
                    title="Delete Task"
                  >
                    <Trash className="w-5 h-5" />
                  </Button>
                </div>
              </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => setCurrentPage(page)}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Stage Update Dialog */}
      <Dialog open={showStageDialog} onOpenChange={setShowStageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Task Stage</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">New Stage</label>
              <Select value={newStage} onValueChange={setNewStage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Notes (Optional)</label>
              <Input
                placeholder="Add notes about the stage change..."
                value={stageNotes}
                onChange={(e) => setStageNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowStageDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => selectedTask && handleStageUpdate(selectedTask.id)}>
                Update Stage
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Task Details Dialog */}
      {selectedTask && (
        <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedTask.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedTask.description && (
                <div>
                  <h4 className="font-medium">Description</h4>
                  <p className="text-muted-foreground">{selectedTask.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium">Priority</h4>
                  <Badge className={getPriorityColor(selectedTask.priority)}>
                    {selectedTask.priority}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium">Stage</h4>
                  <Badge className={getStageColor(selectedTask.stage)}>
                    {selectedTask.stage}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium">Due Date</h4>
                  <p className="text-muted-foreground">{formatDate(selectedTask.date)}</p>
                </div>
                <div>
                  <h4 className="font-medium">Created By</h4>
                  <p className="text-muted-foreground">
                    {selectedTask.creator.firstName} {selectedTask.creator.lastName}
                  </p>
                </div>
              </div>

              {selectedTask.activities && selectedTask.activities.length > 0 && (
                <div>
                  <h4 className="font-medium">Recent Activities</h4>
                  <div className="space-y-2">
                    {selectedTask.activities.slice(0, 3).map((activity, index) => (
                      <div key={index} className="text-sm text-muted-foreground">
                        <p>{activity.activity}</p>
                        <p className="text-xs">{formatDate(activity.date)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Activity Dialog */}
      {activityTask && (
        <TaskActivityDialog
          isOpen={!!activityTask}
          onClose={() => setActivityTask(null)}
          onSubmit={async (payload) => {
            await addTaskActivity(activityTask.id, payload)
          }}
        />
      )}
    </div>
  )
}
