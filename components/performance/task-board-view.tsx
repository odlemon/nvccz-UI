"use client"

import { useState, useEffect, memo } from "react"
// Removed Card usage per new design
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import { Task } from "@/lib/store/slices/taskSlice"
import { format } from "date-fns"
import { TaskManagementSkeleton } from "@/components/ui/skeleton-loaders"
import { TaskActivityModal } from "@/components/applications/task-activity-modal"
import { useTaskStore } from "@/lib/store/slices/useTaskStore"
import { toast } from "sonner"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { TaskDrawerView } from "./task-drawer-view"

interface TaskBoardViewProps {
  tasks: Task[]
  loading: boolean
  onUpdateStage: (taskId: string, stage: string, notes?: string) => void
  onEditTask: (task: Task) => void
  onDeleteTask?: (taskId: string) => void
  onViewTask?: (task: Task) => void
}

interface TaskCardProps {
  task: Task
  onUpdateStage: (taskId: string, stage: string, notes?: string) => void
  onEditTask: (task: Task) => void
  onDeleteTask?: (taskId: string) => void
  onViewTask?: (task: Task) => void
}

const stages = [
  { id: "todo", title: "To Do", color: "bg-gray-100" },
  { id: "in_progress", title: "In Progress", color: "bg-blue-100" },
  { id: "completed", title: "Completed", color: "bg-green-100" },
  { id: "overdue", title: "Overdue", color: "bg-red-100" }
]

const TaskCard = memo(function TaskCard({ task, onUpdateStage, onEditTask, onDeleteTask, onViewTask }: TaskCardProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [showStageDialog, setShowStageDialog] = useState(false)
  const [newStage, setNewStage] = useState(task.stage)
  const [stageNotes, setStageNotes] = useState("")
  const [showActivityModal, setShowActivityModal] = useState(false)

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

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd")
    } catch {
      return "Invalid date"
    }
  }

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true)
    e.dataTransfer.setData("text/plain", task.id)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  const handleStageUpdate = async () => {
    try {
      await onUpdateStage(task.id, newStage, stageNotes)
      toast.success("Stage updated")
    } finally {
      setShowStageDialog(false)
      setStageNotes("")
    }
  }

  return (
    <>
      <div 
        className={`cursor-move transition-all ${
          isDragging ? "opacity-50 scale-95" : ""
        }`}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="p-4 rounded-lg border border-gray-200 bg-white">
          <div className="space-y-3">
            {/* Task Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                    <Flag className="h-3 w-3 mr-1" />
                    {task.priority}
                  </Badge>
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onViewTask?.(task)}>
                    <List className="h-3 w-3 mr-2" />
                    View Details
                  </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowActivityModal(true)}>
                  <Activity className="h-3 w-3 mr-2" />
                  Log Activity
                </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEditTask(task)}>
                    <Edit className="h-3 w-3 mr-2" />
                    Edit Task
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowStageDialog(true)}>
                    <Target className="h-3 w-3 mr-2" />
                    Change Stage
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Task Description */}
            {task.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            )}

            {/* Task Details */}
            <div className="space-y-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(task.date)}</span>
              </div>
              
              {task.goal && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Target className="h-3 w-3" />
                  <span className="truncate">{task.goal.title}</span>
                </div>
              )}
            </div>

            {/* Performance Metrics */}
          </div>
        </div>
      </div>

      {/* Stage Update Dialog */}
      <Dialog open={showStageDialog} onOpenChange={setShowStageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Task Stage</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">New Stage</label>
              <select 
                value={newStage} 
                onChange={(e) => setNewStage(e.target.value as any)}
                className="w-full mt-1 p-2 border rounded-md"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Notes (Optional)</label>
              <textarea
                placeholder="Add notes about the stage change..."
                value={stageNotes}
                onChange={(e) => setStageNotes(e.target.value)}
                className="w-full mt-1 p-2 border rounded-md"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowStageDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleStageUpdate}>
                Update Stage
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Task Activity Modal */}
      <TaskActivityModal
        isOpen={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        taskId={task.id}
        taskTitle={task.title}
        onSuccess={() => {
          setShowActivityModal(false)
          toast.success("Activity logged successfully")
        }}
      />
    </>
  )
})

export const TaskBoardView = memo(function TaskBoardView({ tasks, loading, onUpdateStage, onEditTask, onDeleteTask, onViewTask }: TaskBoardViewProps) {
  const [draggedOver, setDraggedOver] = useState<string | null>(null)
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks)
  const [selectedTaskForView, setSelectedTaskForView] = useState<Task | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    taskId: string
    taskTitle: string
    fromStage: string
    toStage: string
  }>({
    open: false,
    taskId: "",
    taskTitle: "",
    fromStage: "",
    toStage: ""
  })

  // Update local tasks when props change
  useEffect(() => {
    setLocalTasks(tasks)
  }, [tasks])

  const getStageTitle = (stageId: string) => {
    return stages.find(s => s.id === stageId)?.title || stageId
  }

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    setDraggedOver(stageId)
  }

  const handleDragLeave = () => {
    setDraggedOver(null)
  }

  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault()
    setDraggedOver(null)
    
    const taskId = e.dataTransfer.getData("text/plain")
    const task = localTasks.find(t => t.id === taskId)
    
    if (task && task.stage !== targetStage) {
      // Show confirmation dialog
      setConfirmDialog({
        open: true,
        taskId: task.id,
        taskTitle: task.title,
        fromStage: task.stage,
        toStage: targetStage
      })
    }
  }

  const handleConfirmStageChange = async () => {
    const taskId = confirmDialog.taskId
    const newStage = confirmDialog.toStage as Task['stage']
    
    // Optimistically update the local state
    setLocalTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? { ...task, stage: newStage } : task
      )
    )
    
    // Close the dialog immediately
    setConfirmDialog({ open: false, taskId: "", taskTitle: "", fromStage: "", toStage: "" })
    
    try {
      await onUpdateStage(
        taskId,
        newStage,
        `Moved from ${getStageTitle(confirmDialog.fromStage)} to ${getStageTitle(newStage)}`
      )
      toast.success("Task moved successfully")
    } catch (error) {
      // Revert the optimistic update on failure
      setLocalTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? { ...task, stage: confirmDialog.fromStage as Task['stage'] } : task
        )
      )
      toast.error("Failed to move task")
    }
  }

  const getTasksByStage = (stageId: string) => {
    return localTasks.filter(task => task.stage === stageId)
  }

  if (loading) {
    return <TaskManagementSkeleton />
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stages.map((stage) => {
        const stageTasks = getTasksByStage(stage.id)
        
        return (
          <div key={stage.id} className="space-y-4">
            {/* Stage Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                <h3 className="font-semibold">{stage.title}</h3>
                <Badge variant="secondary" className="ml-2">
                  {stageTasks.length}
                </Badge>
              </div>
            </div>

            {/* Stage Column */}
            <div
              className={`min-h-[400px] p-3 rounded-lg border-2 border-dashed transition-all duration-200 ${
                draggedOver === stage.id 
                  ? "border-blue-500 bg-blue-50 border-solid shadow-lg scale-[1.02]" 
                  : "border-gray-200 hover:border-gray-300 bg-gray-50/50"
              }`}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <div className="space-y-3">
                {stageTasks.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                  <div className="text-center">
                    <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No tasks</p>
                    <p className="text-xs mt-1">Drag tasks here</p>
                  </div>
                  </div>
                ) : (
                  stageTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onUpdateStage={onUpdateStage}
                  onEditTask={onEditTask}
                  onDeleteTask={onDeleteTask}
                  onViewTask={(task) => setSelectedTaskForView(task)}
                />
                  ))
                )}
              </div>
            </div>
          </div>
        )
      })}
      </div>

      {/* Drag & Drop Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ ...confirmDialog, open: false })}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              Confirm Task Move
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4 pt-2">
              <p className="text-sm">Are you sure you want to move this task?</p>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl space-y-3 border border-gray-200">
                <p className="font-medium text-gray-900 text-sm leading-relaxed">{confirmDialog.taskTitle}</p>
                <div className="flex items-center gap-3 text-sm">
                  <Badge variant="outline" className="bg-white shadow-sm border-gray-300">
                    {getStageTitle(confirmDialog.fromStage)}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <div className="h-px w-4 bg-gray-300"></div>
                    <span className="text-gray-400">→</span>
                    <div className="h-px w-4 bg-blue-300"></div>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 shadow-sm">
                    {getStageTitle(confirmDialog.toStage)}
                  </Badge>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmStageChange} className="bg-blue-600 hover:bg-blue-700 rounded-full">
              Confirm Move
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Task Details Drawer */}
      {selectedTaskForView && (
        <Sheet open={!!selectedTaskForView} onOpenChange={(open) => !open && setSelectedTaskForView(null)}>
          <SheetContent className="w-[800px] sm:max-w-[800px] overflow-y-auto">
            <TaskDrawerView 
              task={selectedTaskForView} 
              onClose={() => setSelectedTaskForView(null)}
            />
          </SheetContent>
        </Sheet>
      )}
    </>
  )
})
