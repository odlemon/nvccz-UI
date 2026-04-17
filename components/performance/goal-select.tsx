"use client"

import { useEffect, useMemo } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchGoals } from "@/lib/store/slices/performanceSlice"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Target, Loader2 } from "lucide-react"

interface GoalSelectProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  /** Optional: filter by goal type from state */
  type?: "company" | "department" | "individual"
}

export function GoalSelect({
  value,
  onChange,
  placeholder = "Select a goal",
  className,
  disabled,
  type,
}: GoalSelectProps) {
  const dispatch = useAppDispatch()
  const { goals, goalsLoading } = useAppSelector((s) => s.performance)

  useEffect(() => {
    if (!goals || goals.length === 0) {
      dispatch(fetchGoals({}))
    }
  }, [dispatch, goals])

  const options = useMemo(() => {
    const list = Array.isArray(goals) ? goals : []
    if (!type) return list
    return list.filter((g: any) => g?.type === type)
  }, [goals, type])

  const selectedGoal = useMemo(
    () => options.find((g: any) => g.id === value),
    [options, value]
  )

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || goalsLoading}>
      <SelectTrigger className={className}>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Target className="w-4 h-4 text-muted-foreground shrink-0" />
          {goalsLoading && !options.length ? (
            <span className="flex items-center gap-1.5 text-muted-foreground text-sm">
              <Loader2 className="w-3 h-3 animate-spin" />
              Loading goals...
            </span>
          ) : selectedGoal ? (
            <span className="truncate text-sm">{selectedGoal.title || selectedGoal.name || value}</span>
          ) : (
            <SelectValue placeholder={placeholder} />
          )}
        </div>
      </SelectTrigger>
      <SelectContent>
        {options.length === 0 ? (
          <div className="px-3 py-2 text-xs text-muted-foreground">
            No goals available. Create a goal first.
          </div>
        ) : (
          options.map((goal: any) => (
            <SelectItem key={goal.id} value={goal.id}>
              <div className="flex flex-col">
                <span className="truncate">
                  {goal.title || goal.name || goal.id}
                </span>
                {(goal.department || goal.type) && (
                  <span className="text-xs text-muted-foreground">
                    {[goal.type, goal.department].filter(Boolean).join(" · ")}
                  </span>
                )}
              </div>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  )
}
