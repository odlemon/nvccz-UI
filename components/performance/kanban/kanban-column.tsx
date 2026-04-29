"use client"

import { useDroppable } from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { Badge } from "@/components/ui/badge"
import { PerformanceTask, TaskStage } from "@/lib/api/performance-tasks-api"
import { KanbanCard } from "./kanban-card"
import { cn } from "@/lib/utils"

export interface ColumnConfig {
  id: TaskStage
  label: string
  gradient: string
  countColor: string
}

interface KanbanColumnProps {
  column: ColumnConfig
  tasks: PerformanceTask[]
  selectedTaskIds: string[]
  selectionMode: boolean
  onToggleSelect: (id: string) => void
  onCardClick: (id: string) => void
}

export function KanbanColumn({
  column,
  tasks,
  selectedTaskIds,
  selectionMode,
  onToggleSelect,
  onCardClick,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  const taskIds = tasks.map((t) => t.id)

  return (
    <div className="flex-shrink-0 w-72 flex flex-col">
      <div
        className={cn(
          "rounded-t-lg p-3 bg-gradient-to-r text-white sticky top-0 z-10",
          column.gradient
        )}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{column.label}</h3>
          <Badge className={cn("text-xs", column.countColor)}>{tasks.length}</Badge>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 bg-gray-50 rounded-b-lg p-2 space-y-2 min-h-[400px] transition-colors",
          isOver && "bg-blue-50 ring-2 ring-blue-400"
        )}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">
              Drop tasks here
            </p>
          ) : (
            tasks.map((t) => (
              <KanbanCard
                key={t.id}
                task={t}
                isSelected={selectedTaskIds.includes(t.id)}
                selectionMode={selectionMode}
                onToggleSelect={() => onToggleSelect(t.id)}
                onClick={() => onCardClick(t.id)}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  )
}

export const COLUMNS: ColumnConfig[] = [
  {
    id: "todo",
    label: "To Do",
    gradient: "from-gray-500 to-gray-600",
    countColor: "bg-white/20 text-white",
  },
  {
    id: "in_progress",
    label: "In Progress",
    gradient: "from-blue-500 to-blue-600",
    countColor: "bg-white/20 text-white",
  },
  {
    id: "overdue",
    label: "Overdue",
    gradient: "from-red-500 to-rose-600",
    countColor: "bg-white/20 text-white",
  },
  {
    id: "delayed",
    label: "Delayed",
    gradient: "from-orange-500 to-orange-600",
    countColor: "bg-white/20 text-white",
  },
  {
    id: "completed",
    label: "Complete",
    gradient: "from-green-500 to-green-600",
    countColor: "bg-white/20 text-white",
  },
  {
    id: "amber",
    label: "Amber",
    gradient: "from-amber-500 to-yellow-500",
    countColor: "bg-white/20 text-white",
  },
  {
    id: "red",
    label: "Red",
    gradient: "from-red-500 to-rose-600",
    countColor: "bg-white/20 text-white",
  },
]
