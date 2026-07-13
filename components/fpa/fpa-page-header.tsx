"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Star, Search, Calendar, ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { setSelectedScenarioId, setSelectedVersionId } from "@/lib/store/slices/fpaSlice"

export type FpaFilterChip = { label: string; value: string; icon?: "calendar" }

/** Demo / empty-API fallback scenarios for FP&A chrome */
export const FPA_HEADER_SCENARIOS = [
  { id: "base-case", name: "Base Case" },
  { id: "upside", name: "Upside" },
  { id: "downside", name: "Downside" },
  { id: "fx-shock", name: "FX Shock" },
  { id: "hiring-freeze", name: "Hiring Freeze" },
] as const

export const FPA_HEADER_VERSIONS = [
  { id: "working", name: "Working" },
  { id: "locked", name: "Locked" },
  { id: "published", name: "Published" },
] as const

export const FPA_HEADER_PERIODS = [
  "May 2025",
  "Apr 2025",
  "Mar 2025",
  "FY2025",
  "FY2026",
] as const

interface FpaPageHeaderProps {
  title: string
  /** When false, hide live scenario/version selects and use static filters prop */
  liveFilters?: boolean
  /** When true, hide scenario/version/period chips entirely (e.g. Model Builder A.3) */
  hideFilters?: boolean
  /** When true, hide the search field */
  hideSearch?: boolean
  filters?: FpaFilterChip[]
  className?: string
  actions?: React.ReactNode
  periodLabel?: string
  searchPlaceholder?: string
  /** Prefer hardcoded scenario list (Home demo) over API list when set */
  demoScenarios?: boolean
  /** Controlled demo filter values (names) */
  scenario?: string
  version?: string
  period?: string
  onScenarioChange?: (name: string) => void
  onVersionChange?: (name: string) => void
  onPeriodChange?: (period: string) => void
}

/** Stacked label + value shell with custom menu (same pattern as board FilterSelect) */
function HeaderFilter({
  label,
  value,
  options,
  onChange,
  trailing,
}: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
  trailing: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="h-10 min-w-[118px] inline-flex items-center rounded-md border border-[#e2e8f0] bg-white pl-2.5 pr-7 text-left hover:bg-[#f8fafc]"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="flex flex-col justify-center min-w-0 py-1">
          <span className="text-[9px] font-medium uppercase tracking-wide text-[#94a3b8] leading-none">
            {label}
          </span>
          <span className="text-[12px] font-semibold text-[#0f172a] leading-tight mt-0.5 truncate">
            {value}
          </span>
        </span>
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94a3b8]">{trailing}</span>
      </button>
      {open ? (
        <div
          role="listbox"
          className="absolute right-0 top-[calc(100%+4px)] z-40 min-w-[180px] rounded-md border border-[#e2e8f0] bg-white py-1 shadow-lg"
        >
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              role="option"
              aria-selected={opt === value}
              onClick={() => {
                onChange(opt)
                setOpen(false)
              }}
              className={cn(
                "w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-[12px] hover:bg-[#f8fafc]",
                opt === value ? "text-[#2563eb] font-semibold" : "text-[#334155]",
              )}
            >
              {opt}
              {opt === value ? <Check className="w-3.5 h-3.5" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function FpaPageHeader({
  title,
  liveFilters = true,
  hideFilters = false,
  hideSearch = false,
  filters,
  className,
  actions,
  periodLabel,
  searchPlaceholder = "Search models, reports, sheets...",
  demoScenarios = false,
  scenario: controlledScenario,
  version: controlledVersion,
  period: controlledPeriod,
  onScenarioChange,
  onVersionChange,
  onPeriodChange,
}: FpaPageHeaderProps) {
  const dispatch = useAppDispatch()
  const { scenarios, versions, selectedScenarioId, selectedVersionId, models, selectedModelId } =
    useAppSelector((s) => s.fpa)

  const model = models.find((m) => m.id === selectedModelId)
  const defaultPeriod =
    periodLabel ||
    (model?.startPeriod
      ? new Date(model.startPeriod).toLocaleDateString("en-US", { month: "short", year: "numeric" })
      : "May 2025")

  const [localPeriod, setLocalPeriod] = useState(defaultPeriod)
  const [localScenario, setLocalScenario] = useState(FPA_HEADER_SCENARIOS[0].name)
  const [localVersion, setLocalVersion] = useState(FPA_HEADER_VERSIONS[0].name)

  const scenarioOptions = useMemo(() => {
    if (demoScenarios || scenarios.length === 0) {
      return FPA_HEADER_SCENARIOS.map((s) => s.name)
    }
    return scenarios.map((s) => s.name)
  }, [demoScenarios, scenarios])

  const versionOptions = useMemo(() => {
    if (demoScenarios || versions.length === 0) {
      return FPA_HEADER_VERSIONS.map((v) => v.name)
    }
    return versions.map((v) => v.name)
  }, [demoScenarios, versions])

  const periodOptions = useMemo(() => [...FPA_HEADER_PERIODS], [])

  const scenarioName =
    controlledScenario ??
    (demoScenarios || scenarios.length === 0
      ? localScenario
      : scenarios.find((s) => s.id === selectedScenarioId)?.name || scenarioOptions[0] || "—")

  const versionName =
    controlledVersion ??
    (demoScenarios || versions.length === 0
      ? localVersion
      : versions.find((v) => v.id === selectedVersionId)?.name || versionOptions[0] || "—")

  const periodValue = controlledPeriod ?? localPeriod

  const setScenario = (name: string) => {
    onScenarioChange?.(name)
    if (demoScenarios || scenarios.length === 0) {
      setLocalScenario(name)
      return
    }
    const match = scenarios.find((s) => s.name === name)
    if (match) dispatch(setSelectedScenarioId(match.id))
  }

  const setVersion = (name: string) => {
    onVersionChange?.(name)
    if (demoScenarios || versions.length === 0) {
      setLocalVersion(name)
      return
    }
    const match = versions.find((v) => v.name === name)
    if (match) dispatch(setSelectedVersionId(match.id))
  }

  const setPeriod = (p: string) => {
    onPeriodChange?.(p)
    setLocalPeriod(p)
  }

  const staticFilters =
    filters ??
    ([
      { label: "Scenario", value: "Base Case" },
      { label: "Version", value: "Working" },
      { label: "Period", value: periodValue, icon: "calendar" as const },
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
        <Star className="w-4 h-4 text-[#cbd5e1]" strokeWidth={1.75} />
      </div>

      {!hideSearch ? (
        <div className="flex-1 min-w-[160px] max-w-md relative order-last sm:order-none w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
          <input
            className="w-full h-10 rounded-md border border-[#e2e8f0] bg-white pl-9 pr-14 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30"
            placeholder={searchPlaceholder}
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#94a3b8] border border-[#e2e8f0] rounded-[4px] bg-[#f8fafc] px-1.5 py-0.5 hidden sm:inline">
            ⌘ K
          </span>
        </div>
      ) : (
        <div className="flex-1" />
      )}

      <div className="flex items-center gap-2 ml-auto flex-wrap">
        {hideFilters ? null : liveFilters ? (
          <>
            <HeaderFilter
              label="Scenario"
              value={scenarioName}
              options={scenarioOptions}
              onChange={setScenario}
              trailing={<ChevronDown className="w-3.5 h-3.5" />}
            />
            <HeaderFilter
              label="Version"
              value={versionName}
              options={versionOptions}
              onChange={setVersion}
              trailing={<ChevronDown className="w-3.5 h-3.5" />}
            />
            <HeaderFilter
              label="Period"
              value={periodValue}
              options={periodOptions}
              onChange={setPeriod}
              trailing={<Calendar className="w-3.5 h-3.5" />}
            />
          </>
        ) : (
          staticFilters.map((f) => (
            <div
              key={f.label + f.value}
              className="h-10 min-w-[108px] inline-flex flex-col justify-center rounded-md border border-[#e2e8f0] bg-white px-2.5 text-left"
            >
              <span className="text-[9px] font-medium uppercase tracking-wide text-[#94a3b8] leading-none">
                {f.label}
              </span>
              <span className="text-[12px] font-semibold text-[#0f172a] leading-tight mt-0.5 inline-flex items-center gap-1.5">
                {f.icon === "calendar" ? <Calendar className="w-3.5 h-3.5 text-[#94a3b8]" /> : null}
                {f.value}
              </span>
            </div>
          ))
        )}
        {actions}
      </div>
    </header>
  )
}
