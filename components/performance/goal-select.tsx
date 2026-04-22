"use client"

import { useEffect, useMemo, useState } from "react"
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
  /** Filter by goal type */
  type?: "company" | "department" | "individual"
  /**
   * Match goals whose `syncConfig.bscEntryKind` equals (one of) these values.
   * This is the most precise filter — a goal gets this tag after its first BSC submission.
   * Example: "CSR_PARTICIPATION_RATE", "RESOURCE_BUDGET_ALIGNMENT".
   */
  bscEntryKind?: string | string[]
  /**
   * Match goals whose `formulaType` equals (one of) these values.
   * Example: "EASE_OF_DOING_BUSINESS", "RATIO", "DIRECT".
   */
  formulaType?: string | string[]
  /** Case-insensitive match against goal title. Used as a fallback for goals with no sync tag yet. */
  titleMatch?: string | RegExp
  /** Match against goal.category ('governance' | 'strategic' | ...). */
  categoryMatch?: string | string[]
  /**
   * Custom predicate — fully overrides built-in filters if supplied.
   */
  match?: (goal: any) => boolean
  /** Override the empty-state message shown when no goals match the filter. */
  emptyMessage?: string
}

function toArray<T extends string>(v: T | T[] | undefined): T[] | undefined {
  if (v === undefined) return undefined
  return Array.isArray(v) ? v : [v]
}

function matchesString(value: string | undefined, pattern: string | RegExp): boolean {
  if (!value) return false
  if (pattern instanceof RegExp) return pattern.test(value)
  return value.toLowerCase().includes(pattern.toLowerCase())
}

export function GoalSelect({
  value,
  onChange,
  placeholder = "Select a goal",
  className,
  disabled,
  type,
  bscEntryKind,
  formulaType,
  titleMatch,
  categoryMatch,
  match,
  emptyMessage,
}: GoalSelectProps) {
  const dispatch = useAppDispatch()
  const { goals, goalsLoading } = useAppSelector((s) => s.performance)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    if (!goals || goals.length === 0) {
      dispatch(fetchGoals({}))
    }
  }, [dispatch, goals])

  const hasAnyFilter = Boolean(
    match || bscEntryKind || formulaType || titleMatch || categoryMatch
  )

  const bscKinds = toArray(bscEntryKind)
  const formulaTypes = toArray(formulaType)
  const categories = toArray(categoryMatch)

  const isMatch = (goal: any): boolean => {
    if (match) return match(goal)
    // OR-composition: any matcher that hits keeps the goal.
    if (bscKinds && goal?.syncConfig?.bscEntryKind && bscKinds.includes(goal.syncConfig.bscEntryKind)) return true
    if (formulaTypes && goal?.formulaType && formulaTypes.includes(goal.formulaType)) return true
    if (categories && goal?.category && categories.includes(goal.category)) return true
    if (titleMatch && matchesString(goal?.title, titleMatch)) return true
    return false
  }

  const filteredOptions = useMemo(() => {
    let list = Array.isArray(goals) ? goals : []
    if (type) list = list.filter((g: any) => g?.type === type)
    if (hasAnyFilter && !showAll) list = list.filter(isMatch)
    return list
  }, [goals, type, hasAnyFilter, showAll, bscEntryKind, formulaType, titleMatch, categoryMatch, match])

  const totalForType = useMemo(() => {
    const list = Array.isArray(goals) ? goals : []
    return type ? list.filter((g: any) => g?.type === type).length : list.length
  }, [goals, type])

  const selectedGoal = useMemo(
    () => (Array.isArray(goals) ? goals : []).find((g: any) => g.id === value),
    [goals, value]
  )

  const filteredAway = hasAnyFilter && !showAll && totalForType > filteredOptions.length
    ? totalForType - filteredOptions.length
    : 0

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || goalsLoading}>
      <SelectTrigger className={className}>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Target className="w-4 h-4 text-muted-foreground shrink-0" />
          {goalsLoading && !filteredOptions.length ? (
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
        {hasAnyFilter && (
          <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 border-b bg-muted/40 text-[11px]">
            <span className="text-muted-foreground">
              {showAll
                ? `All goals (${totalForType})`
                : `Matching goals (${filteredOptions.length}${filteredAway ? ` · ${filteredAway} hidden` : ""})`}
            </span>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowAll((v) => !v) }}
              className="font-medium text-blue-600 hover:text-blue-700"
            >
              {showAll ? "Apply filter" : "Show all"}
            </button>
          </div>
        )}
        {filteredOptions.length === 0 ? (
          <div className="px-3 py-2 text-xs text-muted-foreground">
            {emptyMessage || (hasAnyFilter
              ? "No matching goals. Click 'Show all' above to see every goal."
              : "No goals available. Create a goal first.")}
          </div>
        ) : (
          filteredOptions.map((goal: any) => {
            const kind: string | undefined = goal?.syncConfig?.bscEntryKind || goal?.formulaType
            const section = goal?.scorecardSection
            const meta = [
              kind ? kind.replace(/_/g, " ") : null,
              section ? `Section ${section}` : null,
              goal?.type,
            ].filter(Boolean).join(" · ")
            return (
              <SelectItem key={goal.id} value={goal.id}>
                <div className="flex flex-col">
                  <span className="truncate">
                    {goal.title || goal.name || goal.id}
                  </span>
                  {meta && (
                    <span className="text-xs text-muted-foreground">{meta}</span>
                  )}
                </div>
              </SelectItem>
            )
          })
        )}
      </SelectContent>
    </Select>
  )
}
