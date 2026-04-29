"use client"

import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import {
  fetchScorecardPillars,
  fetchThemes,
} from "@/lib/store/slices/performanceConfigSlice"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Layers, BarChart3 } from "lucide-react"

interface Props {
  pillarId: string
  themeId: string
  onPillarChange: (id: string) => void
  onThemeChange: (id: string) => void
}

export function GoalPillarThemeFilters({
  pillarId,
  themeId,
  onPillarChange,
  onThemeChange,
}: Props) {
  const dispatch = useAppDispatch()
  const { pillars, themes } = useAppSelector((s) => s.performanceConfig)

  useEffect(() => {
    if (pillars.length === 0) dispatch(fetchScorecardPillars())
    if (themes.length === 0) dispatch(fetchThemes())
  }, [dispatch, pillars.length, themes.length])

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-blue-600" />
        <Select value={pillarId} onValueChange={onPillarChange}>
          <SelectTrigger className="w-[200px] h-9 rounded-full">
            <SelectValue placeholder="All Pillars" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Pillars</SelectItem>
            {pillars.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Layers className="w-4 h-4 text-purple-600" />
        <Select value={themeId} onValueChange={onThemeChange}>
          <SelectTrigger className="w-[200px] h-9 rounded-full">
            <SelectValue placeholder="All Themes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Themes</SelectItem>
            {themes.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                <span className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: t.color || "#3b82f6" }}
                  />
                  {t.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(pillarId !== "all" || themeId !== "all") && (
        <Badge
          variant="outline"
          className="cursor-pointer"
          onClick={() => {
            onPillarChange("all")
            onThemeChange("all")
          }}
        >
          Clear filters
        </Badge>
      )}
    </div>
  )
}

/**
 * Helper: Status + Weight badge to show next to a goal title.
 */
export function GoalStatusWeightBadges({
  status,
  weight,
}: {
  status?: "active" | "inactive" | string
  weight?: number | null
}) {
  return (
    <div className="flex items-center gap-1.5">
      {status && (
        <Badge
          variant="outline"
          className={
            status === "active"
              ? "text-green-700 border-green-300 bg-green-50"
              : "text-gray-600 border-gray-300 bg-gray-50"
          }
        >
          {status}
        </Badge>
      )}
      {weight !== null && weight !== undefined && (
        <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50">
          {weight}%
        </Badge>
      )}
    </div>
  )
}
