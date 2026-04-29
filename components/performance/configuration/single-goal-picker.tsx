"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { apiClient } from "@/lib/api/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Search, Target, X, ChevronDown } from "lucide-react"

export interface PickedGoal {
  id: string
  title: string
}

interface Props {
  value?: PickedGoal | null
  onChange: (goal: PickedGoal | null) => void
  placeholder?: string
  className?: string
  pillarId?: string
}

export function SingleGoalPicker({
  value,
  onChange,
  placeholder = "Filter by goal...",
  className,
  pillarId,
}: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<PickedGoal[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchGoals = useCallback(
    async (q: string) => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (q.trim()) params.append("search", q.trim())
        if (pillarId) params.append("pillarId", pillarId)
        const qs = params.toString()
        const res: any = await apiClient.get(
          `/performance/goals${qs ? `?${qs}` : ""}`
        )
        const list = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.goals)
          ? res.goals
          : []
        setResults(
          list.map((g: any) => ({ id: g.id, title: g.title }))
        )
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    },
    [pillarId]
  )

  useEffect(() => {
    if (!open) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchGoals(query), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, open, fetchGoals])

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

  return (
    <div ref={containerRef} className={`relative ${className || ""}`}>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen((o) => !o)}
        className="rounded-full h-9 justify-between gap-2 font-normal w-full"
      >
        <span className="flex items-center gap-2 min-w-0 flex-1 text-left">
          <Target className="w-3.5 h-3.5 flex-shrink-0 text-gray-500" />
          <span className="truncate">
            {value ? value.title : <span className="text-gray-500">{placeholder}</span>}
          </span>
        </span>
        {value ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onChange(null)
            }}
            className="hover:bg-gray-100 rounded-full p-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        ) : (
          <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 text-gray-500" />
        )}
      </Button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-30 min-w-[280px] max-w-[400px]">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search goals..."
                className="pl-8 h-8 text-sm"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-4 text-xs text-gray-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                Searching...
              </div>
            ) : results.length === 0 ? (
              <p className="p-3 text-xs text-gray-500 text-center">
                {query ? `No goals match "${query}"` : "Type to search goals"}
              </p>
            ) : (
              <ul>
                {results.slice(0, 20).map((g) => (
                  <li key={g.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(g)
                        setOpen(false)
                        setQuery("")
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm border-b last:border-b-0"
                    >
                      <p className="text-gray-800 font-medium truncate">
                        {g.title}
                      </p>
                      <p className="text-[10px] text-gray-400 font-mono truncate">
                        {g.id}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
