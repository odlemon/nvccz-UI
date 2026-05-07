"use client"

import { useEffect, useMemo, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import {
  setFilters,
  setSelectedTaskId,
  toggleTaskSelection,
  clearTaskSelection,
  optimisticMoveStage,
  moveKanbanTaskStage,
} from "@/lib/store/slices/performanceTasksSlice"
import { recalculateGoalRollup } from "@/lib/store/slices/performanceSlice"
import { fetchAvailableDepartments } from "@/lib/store/slices/performanceSlice"
import { usersApi } from "@/lib/api/users-api"
import { setUsers as setReduxUsers } from "@/lib/store/slices/usersSlice"
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core"
import {
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable"
import { KanbanColumn, COLUMNS } from "./kanban-column"
import { KanbanToolbar } from "./kanban-toolbar"
import { TaskBulkActionsBar } from "./task-bulk-actions-bar"
import { TaskStage } from "@/lib/api/performance-tasks-api"
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
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

export function KanbanBoard() {
  const dispatch = useAppDispatch()
  const { tasks, filters, selectedTaskIds, loading } =
    useAppSelector((s) => s.performanceTasks)
  const { availableDepartments } = useAppSelector((s) => s.performance)
  const cachedUsers = useAppSelector((s) => s.users.items)

  const [selectionMode, setSelectionMode] = useState(false)
  const [pendingMove, setPendingMove] = useState<{
    taskId: string
    from: TaskStage
    to: TaskStage
  } | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    if (availableDepartments.length === 0) {
      dispatch(fetchAvailableDepartments())
    }
  }, [dispatch, availableDepartments.length])

  // Prefetch users once so kanban card avatars resolve to real names
  useEffect(() => {
    if (cachedUsers.length > 0) return
    let cancelled = false
    usersApi
      .getAll()
      .then((res: any) => {
        if (cancelled) return
        const list = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.users)
          ? res.users
          : Array.isArray(res)
          ? res
          : []
        if (list.length > 0) dispatch(setReduxUsers(list))
      })
      .catch((e) => {
        console.error("[kanban-board] failed to prefetch users", e)
      })
    return () => {
      cancelled = true
    }
  }, [dispatch, cachedUsers.length])

  const tasksByStage = useMemo(() => {
    const map: Record<TaskStage, typeof tasks> = {
      todo: [],
      in_progress: [],
      overdue: [],
      delayed: [],
      completed: [],
      // Amber/Red retained as keys to satisfy the TaskStage type but are
      // never displayed as columns or stage filters.
      amber: [],
      red: [],
    }
    tasks.forEach((t) => {
      const stage = (t.stage || "todo") as TaskStage
      if (map[stage]) map[stage].push(t)
      else map.todo.push(t)
    })
    return map
  }, [tasks])

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const taskId = String(active.id)
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    // The over.id is either a column id (TaskStage) or another card id (within same column)
    const overId = String(over.id)
    let targetStage: TaskStage | null = null

    // Check if dropped on a column directly
    if (COLUMNS.find((c) => c.id === overId)) {
      targetStage = overId as TaskStage
    } else {
      // Dropped on a card — find that card's column
      const overTask = tasks.find((t) => t.id === overId)
      if (overTask) targetStage = (overTask.stage || "todo") as TaskStage
    }

    if (!targetStage || targetStage === task.stage) return

    setPendingMove({
      taskId,
      from: (task.stage || "todo") as TaskStage,
      to: targetStage,
    })
  }

  const confirmMove = async () => {
    if (!pendingMove) return
    const { taskId, from, to } = pendingMove
    setPendingMove(null)

    dispatch(optimisticMoveStage({ id: taskId, stage: to }))

    try {
      await dispatch(moveKanbanTaskStage({ id: taskId, stage: to })).unwrap()
      toast.success(`Moved to ${to.replace("_", " ")}`)
      const movedTask = tasks.find((t) => t.id === taskId)
      if (movedTask?.goalId) {
        dispatch(recalculateGoalRollup(movedTask.goalId))
      }
    } catch (e: any) {
      dispatch(optimisticMoveStage({ id: taskId, stage: from }))
      toast.error(e?.message || "Failed to move task")
    }
  }

  return (
    <div className="space-y-4">
      <KanbanToolbar
        filters={filters}
        departments={availableDepartments}
        onFiltersChange={(next) => dispatch(setFilters(next))}
        selectionMode={selectionMode}
        onToggleSelection={() => {
          if (selectionMode) {
            dispatch(clearTaskSelection())
          }
          setSelectionMode((prev) => !prev)
        }}
        totalCount={tasks.length}
        selectedCount={selectedTaskIds.length}
      />

      {loading && tasks.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
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
                  tasks={tasksByStage[col.id]}
                  selectedTaskIds={selectedTaskIds}
                  selectionMode={selectionMode}
                  onToggleSelect={(id) => dispatch(toggleTaskSelection(id))}
                  onCardClick={(id) => {
                    if (selectionMode) {
                      dispatch(toggleTaskSelection(id))
                    } else {
                      dispatch(setSelectedTaskId(id))
                    }
                  }}
                />
              ))}
            </div>
          </DndContext>
        </div>
      )}

      <TaskBulkActionsBar
        selectedIds={selectedTaskIds}
        onClear={() => {
          dispatch(clearTaskSelection())
          setSelectionMode(false)
        }}
      />

      <AlertDialog
        open={pendingMove !== null}
        onOpenChange={(open) => !open && setPendingMove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move task?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingMove
                ? `Move from ${pendingMove.from.replace("_", " ")} to ${pendingMove.to.replace(
                    "_",
                    " "
                  )}?`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmMove}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
