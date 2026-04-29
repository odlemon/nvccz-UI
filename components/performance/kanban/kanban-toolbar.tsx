"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Search, CheckSquare, X, AlertTriangle, ListChecks } from "lucide-react"
import { MyTasksFilters } from "@/lib/api/performance-tasks-api"
import {
  SingleGoalPicker,
  PickedGoal,
} from "@/components/performance/configuration/single-goal-picker"
import { apiClient } from "@/lib/api/api-client"

interface Props {
  filters: MyTasksFilters
  departments: { name: string; description?: string }[]
  onFiltersChange: (next: MyTasksFilters) => void
  selectionMode: boolean
  onToggleSelection: () => void
  totalCount: number
  selectedCount: number
}

export function KanbanToolbar({
  filters,
  departments,
  onFiltersChange,
  selectionMode,
  onToggleSelection,
  totalCount,
  selectedCount,
}: Props) {
  const [pickedGoal, setPickedGoal] = useState<PickedGoal | null>(null)

  // When a goalId is set externally (e.g. from URL or initial filter), resolve its title once
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

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div className="flex-1" />

      <span className="text-xs text-gray-500">
        {totalCount} task{totalCount !== 1 ? "s" : ""}
      </span>

      <Button
        variant={selectionMode ? "default" : "outline"}
        size="sm"
        onClick={onToggleSelection}
        className="rounded-full gap-1"
      >
        {selectionMode ? (
          <>
            <X className="w-3.5 h-3.5" /> Cancel ({selectedCount})
          </>
        ) : (
          <>
            <CheckSquare className="w-3.5 h-3.5" /> Bulk Select
          </>
        )}
      </Button>

    </div>
  )
}
