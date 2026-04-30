"use client"

import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchGoals } from "@/lib/store/slices/performanceSlice"
import { apiClient } from "@/lib/api/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Target, Loader2, Search, X, ChevronDown, Check, Filter as FilterIcon } from "lucide-react"
import { cn } from "@/lib/utils"

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
   * Example: "CSR_PARTICIPATION_RATE", "RESOURCE_BUDGET_ALIGNMENT".
   */
  bscEntryKind?: string | string[]
  /**
   * Match goals whose `formulaType` equals (one of) these values.
   */
  formulaType?: string | string[]
  /** Case-insensitive match against goal title. */
  titleMatch?: string | RegExp
  /** Match against goal.category. */
  categoryMatch?: string | string[]
  /** Custom predicate — fully overrides built-in filters. */
  match?: (goal: any) => boolean
  /** Override the empty-state message. */
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

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [showAll, setShowAll] = useState(false)
  // Live search results (from /performance/goals?search=...)
  const [searchResults, setSearchResults] = useState<any[] | null>(null)
  const [searching, setSearching] = useState(false)
  // Resolved goal info for the currently selected id (when not in `goals` cache)
  const [resolvedGoal, setResolvedGoal] = useState<any | null>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Initial load from Redux cache (same behavior as before)
  useEffect(() => {
    if (!goals || goals.length === 0) {
      dispatch(fetchGoals({}))
    }
  }, [dispatch, goals])

  // Live search via API while typing
  useEffect(() => {
    if (!open) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      if (!query.trim()) {
        setSearchResults(null)
        return
      }
      setSearching(true)
      try {
        const params = new URLSearchParams({ search: query.trim() })
        if (type) params.append("type", type)
        const res: any = await apiClient.get(
          `/performance/goals?${params.toString()}`
        )
        const list = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.goals)
          ? res.goals
          : []
        setSearchResults(list)
      } catch {
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, open, type])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery("")
        setSearchResults(null)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const hasAnyFilter = Boolean(
    match || bscEntryKind || formulaType || titleMatch || categoryMatch
  )

  const bscKinds = toArray(bscEntryKind)
  const formulaTypes = toArray(formulaType)
  const categories = toArray(categoryMatch)

  const isMatch = useCallback(
    (goal: any): boolean => {
      if (match) return match(goal)
      if (bscKinds && goal?.syncConfig?.bscEntryKind && bscKinds.includes(goal.syncConfig.bscEntryKind))
        return true
      if (formulaTypes && goal?.formulaType && formulaTypes.includes(goal.formulaType)) return true
      if (categories && goal?.category && categories.includes(goal.category)) return true
      if (titleMatch && matchesString(goal?.title, titleMatch)) return true
      return false
    },
    [match, bscKinds, formulaTypes, categories, titleMatch]
  )

  // Source list: live search results when present, otherwise Redux cache
  const sourceList = useMemo(() => {
    if (searchResults !== null) return searchResults
    return Array.isArray(goals) ? goals : []
  }, [searchResults, goals])

  const filteredOptions = useMemo(() => {
    let list = sourceList
    if (type) list = list.filter((g: any) => g?.type === type)
    if (hasAnyFilter && !showAll) list = list.filter(isMatch)
    return list
  }, [sourceList, type, hasAnyFilter, showAll, isMatch])

  const totalForType = useMemo(() => {
    let list = sourceList
    if (type) list = list.filter((g: any) => g?.type === type)
    return list.length
  }, [sourceList, type])

  const filteredAway =
    hasAnyFilter && !showAll && totalForType > filteredOptions.length
      ? totalForType - filteredOptions.length
      : 0

  // Resolve the selected goal: prefer Redux cache, then search results, then fetch by id
  const cachedSelected = useMemo(
    () => (Array.isArray(goals) ? goals : []).find((g: any) => g.id === value),
    [goals, value]
  )

  useEffect(() => {
    if (!value) {
      setResolvedGoal(null)
      return
    }
    if (cachedSelected) {
      setResolvedGoal(null)
      return
    }
    // Not in cache — fetch by id once
    let cancelled = false
    apiClient
      .get<any>(`/performance/goals/${value}`)
      .then((res) => {
        if (cancelled) return
        const goal = res?.data || res?.goal || res
        if (goal?.id) setResolvedGoal(goal)
      })
      .catch(() => {
        if (!cancelled) setResolvedGoal({ id: value, title: value })
      })
    return () => {
      cancelled = true
    }
  }, [value, cachedSelected])

  const selectedGoal = cachedSelected || resolvedGoal
  const selectedTitle = selectedGoal?.title || selectedGoal?.name || (value ? value : "")

  const buttonLabel = goalsLoading && !value && !filteredOptions.length ? null : selectedGoal ? (
    <span className="truncate text-sm">{selectedTitle}</span>
  ) : null

  return (
    <div ref={containerRef} className={`relative ${className || ""}`}>
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "h-9 justify-between gap-2 font-normal w-full border-input bg-background",
          !value && "text-muted-foreground"
        )}
      >
        <span className="flex items-center gap-2 min-w-0 flex-1 text-left">
          <Target className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
          {goalsLoading && !value ? (
            <span className="flex items-center gap-1.5 text-muted-foreground text-sm">
              <Loader2 className="w-3 h-3 animate-spin" />
              Loading goals...
            </span>
          ) : selectedGoal ? (
            buttonLabel
          ) : (
            <span className="text-sm text-muted-foreground">{placeholder}</span>
          )}
        </span>
        {value ? (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation()
              onChange("")
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                e.stopPropagation()
                onChange("")
              }
            }}
            className="hover:bg-gray-100 rounded-full p-0.5 cursor-pointer"
          >
            <X className="w-3 h-3" />
          </span>
        ) : (
          <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
        )}
      </Button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-30 min-w-[320px]">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search goals by title..."
                className="pl-8 h-8 text-sm"
                autoFocus
              />
              {searching && (
                <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-gray-400" />
              )}
            </div>
          </div>

          {hasAnyFilter && (
            <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-b bg-muted/40 text-[11px]">
              <span className="text-muted-foreground flex items-center gap-1">
                <FilterIcon className="w-3 h-3" />
                {showAll
                  ? `All goals (${filteredOptions.length})`
                  : `Matching goals (${filteredOptions.length}${
                      filteredAway ? ` · ${filteredAway} hidden` : ""
                    })`}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowAll((v) => !v)
                }}
                className="font-medium text-blue-600 hover:text-blue-700"
              >
                {showAll ? "Apply filter" : "Show all"}
              </button>
            </div>
          )}

          <div className="max-h-72 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <p className="p-4 text-xs text-muted-foreground text-center">
                {query
                  ? `No goals match "${query}"`
                  : emptyMessage ||
                    (hasAnyFilter
                      ? "No matching goals. Click 'Show all' to see every goal."
                      : "No goals available. Create a goal first.")}
              </p>
            ) : (
              <ul>
                {filteredOptions.slice(0, 30).map((goal: any) => {
                  const kind: string | undefined =
                    goal?.syncConfig?.bscEntryKind || goal?.formulaType
                  const section = goal?.scorecardSection
                  const meta = [
                    kind ? kind.replace(/_/g, " ") : null,
                    section ? `Section ${section}` : null,
                    goal?.scorecardPillar,
                    goal?.type,
                  ]
                    .filter(Boolean)
                    .join(" · ")
                  const isSelected = goal.id === value
                  return (
                    <li key={goal.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onChange(goal.id)
                          setOpen(false)
                          setQuery("")
                          setSearchResults(null)
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 hover:bg-blue-50 text-sm border-b last:border-b-0 flex items-start gap-2",
                          isSelected && "bg-blue-50"
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-800 font-medium truncate">
                            {goal.title || goal.name || goal.id}
                          </p>
                          {meta && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                              {meta}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                        )}
                      </button>
                    </li>
                  )
                })}
                {filteredOptions.length > 30 && (
                  <li className="px-3 py-2 text-[11px] text-muted-foreground text-center border-t bg-muted/20">
                    Showing first 30 — type to narrow down
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
