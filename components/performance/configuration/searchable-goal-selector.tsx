"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { apiClient } from "@/lib/api/api-client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Loader2, Search, X, Target, Plus } from "lucide-react"

export interface GoalOption {
  id: string
  title: string
  type?: string
  status?: string
  scorecardPillar?: string
  pillarId?: string
  strategicThemeId?: string | null
  departmentName?: string | null
}

interface Props {
  selectedGoals: GoalOption[]
  onChange: (goals: GoalOption[]) => void
  excludeGoalIds?: string[]
  placeholder?: string
  emptyHint?: string
  pillarId?: string
}

export function SearchableGoalSelector({
  selectedGoals,
  onChange,
  excludeGoalIds = [],
  placeholder = "Search goals by title...",
  emptyHint = "Start typing to search goals",
  pillarId,
}: Props) {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<GoalOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchGoals = useCallback(
    async (q: string) => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        if (q.trim()) params.append("search", q.trim())
        if (pillarId) params.append("pillarId", pillarId)
        const qs = params.toString()
        const res = await apiClient.get<any>(
          `/performance/goals${qs ? `?${qs}` : ""}`
        )
        const list: GoalOption[] = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.goals)
          ? res.goals
          : []
        setResults(list)
      } catch (e: any) {
        setError(e?.message || "Failed to load goals")
        setResults([])
      } finally {
        setLoading(false)
      }
    },
    [pillarId]
  )

  // Debounced search
  useEffect(() => {
    if (!open) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchGoals(query)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, open, fetchGoals])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const selectedIds = new Set(selectedGoals.map((g) => g.id))
  const excludedSet = new Set(excludeGoalIds)

  const toggleGoal = (g: GoalOption) => {
    if (selectedIds.has(g.id)) {
      onChange(selectedGoals.filter((s) => s.id !== g.id))
    } else {
      onChange([...selectedGoals, g])
    }
  }

  const removeGoal = (id: string) => {
    onChange(selectedGoals.filter((s) => s.id !== id))
  }

  return (
    <div ref={containerRef} className="space-y-2">
      {/* Selected chips */}
      {selectedGoals.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedGoals.map((g) => (
            <Badge
              key={g.id}
              variant="outline"
              className="bg-blue-50 border-blue-200 text-blue-800 pr-1 gap-1"
            >
              <Target className="w-3 h-3" />
              <span className="max-w-[200px] truncate">{g.title}</span>
              <button
                type="button"
                onClick={() => removeGoal(g.id)}
                className="ml-1 hover:bg-blue-100 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="pl-9 rounded-full"
        />

        {open && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-30 max-h-72 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-6 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Searching...
              </div>
            ) : error ? (
              <p className="p-3 text-sm text-red-600 text-center">{error}</p>
            ) : results.length === 0 ? (
              <p className="p-3 text-sm text-gray-500 text-center">
                {query ? `No goals match "${query}"` : emptyHint}
              </p>
            ) : (
              <ul>
                {results.map((g) => {
                  const isSelected = selectedIds.has(g.id)
                  const isExcluded = excludedSet.has(g.id)
                  if (isExcluded) return null
                  return (
                    <li key={g.id}>
                      <button
                        type="button"
                        onClick={() => toggleGoal(g)}
                        className={`w-full text-left px-3 py-2 hover:bg-blue-50 border-b last:border-b-0 flex items-center gap-3 transition-colors ${
                          isSelected ? "bg-blue-50" : ""
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                            isSelected
                              ? "bg-blue-500 border-blue-500"
                              : "bg-white border-gray-300"
                          }`}
                        >
                          {isSelected && (
                            <svg
                              className="w-3 h-3 text-white"
                              viewBox="0 0 16 16"
                              fill="currentColor"
                            >
                              <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {g.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 flex-wrap">
                            {g.type && (
                              <Badge variant="outline" className="text-[10px] px-1 py-0">
                                {g.type}
                              </Badge>
                            )}
                            {g.scorecardPillar && (
                              <span>{g.scorecardPillar}</span>
                            )}
                            {g.status && (
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1 py-0 ${
                                  g.status === "active"
                                    ? "border-green-300 text-green-700"
                                    : "border-gray-300 text-gray-600"
                                }`}
                              >
                                {g.status}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      {selectedGoals.length === 0 && (
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <Plus className="w-3 h-3" /> Click goals to select multiple
        </p>
      )}
    </div>
  )
}
