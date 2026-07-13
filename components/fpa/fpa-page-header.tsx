"use client"

import { Star, Search, Calendar, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { setSelectedScenarioId, setSelectedVersionId } from "@/lib/store/slices/fpaSlice"

export type FpaFilterChip = { label: string; value: string; icon?: "calendar" }

interface FpaPageHeaderProps {
  title: string
  /** When false, hide live scenario/version selects and use static filters prop */
  liveFilters?: boolean
  /** When true, hide scenario/version/period chips entirely (e.g. Model Builder A.3) */
  hideFilters?: boolean
  filters?: FpaFilterChip[]
  className?: string
  actions?: React.ReactNode
  periodLabel?: string
  searchPlaceholder?: string
}

export function FpaPageHeader({
  title,
  liveFilters = true,
  hideFilters = false,
  filters,
  className,
  actions,
  periodLabel,
  searchPlaceholder = "Search models, reports, sheets...",
}: FpaPageHeaderProps) {
  const dispatch = useAppDispatch()
  const { scenarios, versions, selectedScenarioId, selectedVersionId, models, selectedModelId } =
    useAppSelector((s) => s.fpa)

  const model = models.find((m) => m.id === selectedModelId)
  const period =
    periodLabel ||
    (model?.startPeriod
      ? new Date(model.startPeriod).toLocaleDateString("en-US", { month: "short", year: "numeric" })
      : "—")

  const staticFilters =
    filters ??
    ([
      { label: "Scenario", value: "—" },
      { label: "Version", value: "—" },
      { label: "Period", value: period, icon: "calendar" as const },
    ] satisfies FpaFilterChip[])

  return (
    <header
      className={cn(
        "sticky top-0 z-10 bg-white border-b border-[#e2e8f0] px-4 sm:px-5 py-3 flex flex-wrap items-center gap-3",
        className,
      )}
    >
      <div className="flex items-center gap-2 shrink-0">
        <h1 className="text-base font-semibold text-[#0f172a]">{title}</h1>
        <Star className="w-4 h-4 text-[#cbd5e1]" />
      </div>

      <div className="flex-1 min-w-[160px] max-w-md relative order-last sm:order-none w-full sm:w-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
        <input
          className="w-full h-9 rounded-full border border-[#e2e8f0] bg-[#f8fafc] pl-9 pr-14 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30"
          placeholder={searchPlaceholder}
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#94a3b8] border border-[#e2e8f0] rounded px-1.5 py-0.5 hidden sm:inline">
          ⌘ K
        </span>
      </div>

      <div className="flex items-center gap-2 ml-auto flex-wrap">
        {hideFilters ? null : liveFilters ? (
          <>
            <label className="h-9 inline-flex items-center gap-2 rounded-full border border-[#e2e8f0] bg-white px-2.5 text-xs text-[#475569]">
              <span className="text-[#94a3b8] hidden md:inline">Scenario</span>
              <select
                className="bg-transparent font-medium text-[#0f172a] focus:outline-none max-w-[140px]"
                value={selectedScenarioId || ""}
                onChange={(e) => dispatch(setSelectedScenarioId(e.target.value || null))}
              >
                {scenarios.length === 0 && <option value="">—</option>}
                {scenarios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-[#94a3b8]" />
            </label>
            <label className="h-9 inline-flex items-center gap-2 rounded-full border border-[#e2e8f0] bg-white px-2.5 text-xs text-[#475569]">
              <span className="text-[#94a3b8] hidden md:inline">Version</span>
              <select
                className="bg-transparent font-medium text-[#0f172a] focus:outline-none max-w-[140px]"
                value={selectedVersionId || ""}
                onChange={(e) => dispatch(setSelectedVersionId(e.target.value || null))}
              >
                {versions.length === 0 && <option value="">—</option>}
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-[#94a3b8]" />
            </label>
            <div className="h-9 inline-flex items-center gap-2 rounded-full border border-[#e2e8f0] bg-white px-3 text-xs text-[#0f172a] font-medium">
              <Calendar className="w-3.5 h-3.5 text-[#94a3b8]" />
              {period}
            </div>
          </>
        ) : (
          staticFilters.map((f) => (
            <div
              key={f.label + f.value}
              className="h-9 inline-flex items-center gap-2 rounded-full border border-[#e2e8f0] bg-white px-2.5 sm:px-3 text-xs text-[#475569]"
            >
              {f.icon === "calendar" ? (
                <>
                  <Calendar className="w-3.5 h-3.5 text-[#94a3b8]" />
                  <span className="font-medium text-[#0f172a]">{f.value}</span>
                </>
              ) : (
                <>
                  <span className="text-[#94a3b8] hidden md:inline">{f.label}</span>
                  <span className="font-medium text-[#0f172a]">{f.value}</span>
                </>
              )}
            </div>
          ))
        )}
        {actions}
      </div>
    </header>
  )
}
