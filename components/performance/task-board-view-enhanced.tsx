"use client"

import { useState, useMemo } from "react"
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
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
  Calendar,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Activity,
  Flag,
  GripVertical,
  Target,
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { Task } from "@/lib/api/task-api"
import { format, isPast } from "date-fns"
import { cn } from "@/lib/utils"
import { TaskActivityModal } from "@/components/applications/task-activity-modal"

interface TaskBoardViewEnhancedProps {
  tasks: Task[]
  loading: boolean
  onUpdateStage: (taskId: string, stage: string, notes?: string) => void
  onEditTask?: (task: Task) => void
  onDeleteTask?: (taskId: string) => void
  onViewTask?: (task: Task) => void
}

interface Column {
  id: string
  title: string
  icon: any
  gradient: string
  border: string
  count: string
}

const COLUMNS: Column[] = [
  {
    id: "todo",
    title: "To Do",
    icon: Clock,
    gradient: "from-slate-500 to-slate-600",
    border: "border-l-slate-400",
    count: "bg-slate-100 text-slate-700",
  },
  {
    id: "in_progress",
    title: "In Progress",
    icon: Activity,
    gradient: "from-blue-500 to-blue-600",
    border: "border-l-blue-500",
    count: "bg-blue-100 text-blue-700",
  },
  {
    id: "completed",
    title: "Completed",
    icon: CheckCircle2,
    gradient: "from-green-500 to-green-600",
    border: "border-l-green-500",
    count: "bg-green-100 text-green-700",
  },
  {
    id: "overdue",
    title: "Overdue",
    icon: AlertCircle,
    gradient: "from-red-500 to-rose-600",
    border: "border-l-red-500",
    count: "bg-red-100 text-red-700",
  },
]

const PRIORITY_STYLES: Record<string, { bg: string; text: string; ring: string }> = {
  critical: { bg: "bg-red-500", text: "text-red-700", ring: "ring-red-200" },
  high: { bg: "bg-orange-500", text: "text-orange-700", ring: "ring-orange-200" },
  medium: { bg: "bg-blue-500", text: "text-blue-700", ring: "ring-blue-200" },
  low: { bg: "bg-gray-400", text: "text-gray-600", ring: "ring-gray-200" },
}

const getInitials = (firstName?: string, lastName?: string, email?: string) => {
  if (firstName || lastName) {
    return `${(firstName || "")[0] || ""}${(lastName || "")[0] || ""}`.toUpperCase() || "?"
  }
  if (email) return email[0].toUpperCase()
  return "?"
}

function TaskCardItem({
  task,
  onView,
  onEdit,
  onDelete,
  onLogActivity,
}: {
  task: Task
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onLogActivity?: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const priority = (task.priority || "medium") as keyof typeof PRIORITY_STYLES
  const pStyle = PRIORITY_STYLES[priority] || PRIORITY_STYLES.medium

  const due = task.date
  const isOverdueDate =
    due && task.stage !== "completed" && isPast(new Date(due))

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-all cursor-default",
        isDragging && "shadow-2xl ring-2 ring-blue-400 rotate-1"
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-1.5">
        <button
          {...attributes}
          {...listeners}
          className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity mt-0.5"
          aria-label="Drag handle"
        >
          <GripVertical className="w-3.5 h-3.5 text-gray-400" />
        </button>

        <div className="flex-1 min-w-0">
          <p
            className="font-medium text-sm text-gray-900 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors"
            onClick={onView}
          >
            {task.title}
          </p>

          {task.description && (
            <p className="text-xs text-gray-500 line-clamp-2 mt-1">
              {task.description}
            </p>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {onView && (
              <DropdownMenuItem onClick={onView} className="gap-2">
                <Eye className="w-3.5 h-3.5" /> View Details
              </DropdownMenuItem>
            )}
            {onLogActivity && (
              <DropdownMenuItem onClick={onLogActivity} className="gap-2">
                <Activity className="w-3.5 h-3.5" /> Log Activity
              </DropdownMenuItem>
            )}
            {onEdit && (
              <DropdownMenuItem onClick={onEdit} className="gap-2">
                <Edit className="w-3.5 h-3.5" /> Edit
              </DropdownMenuItem>
            )}
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onDelete}
                  className="gap-2 text-red-600 focus:text-red-700 focus:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Pills */}
      <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
        <Badge
          variant="outline"
          className={cn("text-[10px] px-1.5 py-0 capitalize border", pStyle.text)}
        >
          <span className={cn("w-1.5 h-1.5 rounded-full mr-1", pStyle.bg)} />
          {priority}
        </Badge>
        {task.goal && (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 border-purple-200 text-purple-700"
            title={task.goal.title}
          >
            <Target className="w-2.5 h-2.5 mr-1" />
            <span className="truncate max-w-[80px]">{task.goal.title}</span>
          </Badge>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          {due && (
            <span
              className={cn(
                "flex items-center gap-1",
                isOverdueDate && "text-red-600 font-medium"
              )}
            >
              <Calendar className="w-3 h-3" />
              {format(new Date(due), "MMM d")}
            </span>
          )}
        </div>

        {task.creator && (
          <Avatar className="w-6 h-6 ring-2 ring-white">
            <AvatarFallback className="text-[10px] bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              {getInitials(
                task.creator.firstName,
                task.creator.lastName,
                task.creator.email
              )}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  )
}

function KanbanColumn({
  column,
  tasks,
  onView,
  onEdit,
  onDelete,
  onLogActivity,
}: {
  column: Column
  tasks: Task[]
  onView?: (t: Task) => void
  onEdit?: (t: Task) => void
  onDelete?: (id: string) => void
  onLogActivity?: (t: Task) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  const Icon = column.icon
  const taskIds = tasks.map((t) => t.id)

  return (
    <div className="flex-shrink-0 w-72 flex flex-col">
      {/* Column Header */}
      <div
        className={cn(
          "rounded-t-xl p-3 bg-gradient-to-r text-white shadow-sm",
          column.gradient
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4" />
            <h3 className="font-semibold text-sm">{column.title}</h3>
          </div>
          <Badge className={cn("text-xs font-semibold border-0", column.count)}>
            {tasks.length}
          </Badge>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 rounded-b-xl p-2 space-y-2 min-h-[400px] transition-all border-l-4",
          column.border,
          isOver
            ? "bg-blue-50 ring-2 ring-blue-300"
            : "bg-gray-50"
        )}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-300">
              <Icon className="w-8 h-8 mb-1" />
              <p className="text-xs text-gray-400">Drop tasks here</p>
            </div>
          ) : (
            tasks.map((t) => (
              <TaskCardItem
                key={t.id}
                task={t}
                onView={onView ? () => onView(t) : undefined}
                onEdit={onEdit ? () => onEdit(t) : undefined}
                onDelete={onDelete ? () => onDelete(t.id) : undefined}
                onLogActivity={onLogActivity ? () => onLogActivity(t) : undefined}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  )
}

export function TaskBoardViewEnhanced({
  tasks,
  loading,
  onUpdateStage,
  onEditTask,
  onDeleteTask,
  onViewTask,
}: TaskBoardViewEnhancedProps) {
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [activityModalTask, setActivityModalTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Group tasks by column. "overdue" is virtual: any non-completed task past due.
  const tasksByColumn = useMemo(() => {
    const map: Record<string, Task[]> = {
      todo: [],
      in_progress: [],
      completed: [],
      overdue: [],
    }
    tasks.forEach((t) => {
      const isOverdue =
        t.date && t.stage !== "completed" && isPast(new Date(t.date))
      if (isOverdue) {
        map.overdue.push(t)
      } else if (t.stage === "completed") {
        map.completed.push(t)
      } else if (t.stage === "in_progress") {
        map.in_progress.push(t)
      } else {
        map.todo.push(t)
      }
    })
    return map
  }, [tasks])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const taskId = String(active.id)
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    const overId = String(over.id)
    let targetStage: string | null = null

    // Did we drop on a column directly?
    if (COLUMNS.find((c) => c.id === overId)) {
      targetStage = overId
    } else {
      // Dropped on another card — figure out its column
      const overTask = tasks.find((t) => t.id === overId)
      if (overTask) {
        const isOverdue =
          overTask.date &&
          overTask.stage !== "completed" &&
          isPast(new Date(overTask.date))
        targetStage = isOverdue ? "overdue" : overTask.stage
      }
    }

    if (!targetStage) return

    // "overdue" is virtual — moving INTO overdue column means the user wants the
    // task to be revisited. We don't change the stage on backend, just keep it.
    // Moving OUT of overdue should set the stage to whatever target column.
    if (targetStage === "overdue") return

    // Don't update if already in this stage
    if (task.stage === targetStage) return

    onUpdateStage(taskId, targetStage)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="overflow-x-auto pb-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 min-w-max">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              tasks={tasksByColumn[col.id] || []}
              onView={onViewTask}
              onEdit={onEditTask}
              onDelete={onDeleteTask ? (id) => setPendingDelete(id) : undefined}
              onLogActivity={(t) => setActivityModalTask(t)}
            />
          ))}
        </div>
      </DndContext>

      {/* Delete confirm */}
      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete && onDeleteTask) onDeleteTask(pendingDelete)
                setPendingDelete(null)
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Log Activity Modal */}
      {activityModalTask && (
        <TaskActivityModal
          isOpen={activityModalTask !== null}
          onClose={() => setActivityModalTask(null)}
          task={activityModalTask as any}
        />
      )}
    </div>
  )
}
