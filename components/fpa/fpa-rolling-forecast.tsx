"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  Check,
  ChevronDown,
  Lock,
  Play,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from "lucide-react"
import { toast } from "sonner"
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { formatMoney } from "@/lib/api/fpa-api"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchFpaDashboard } from "@/lib/store/slices/fpaSlice"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { mockRollingForecastTrend } from "@/components/fpa/mock-data"

const R = "rounded-lg"

const MONTHS_2026 = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const

/** SRD §15 supported forecast methods */
const FORECAST_METHODS = [
  { id: "driver", label: "Driver-based", revenue: 128400000, ebitda: 55300000, cash: 14600000, runway: 14.6, confidence: "High" },
  { id: "runrate", label: "Run-rate", revenue: 123600000, ebitda: 51200000, cash: 14100000, runway: 13.9, confidence: "Medium" },
  { id: "growth", label: "Growth-rate", revenue: 126200000, ebitda: 52800000, cash: 14350000, runway: 14.1, confidence: "Medium" },
  { id: "pipeline", label: "Pipeline-weighted", revenue: 131200000, ebitda: 57100000, cash: 15200000, runway: 15.1, confidence: "Medium" },
  { id: "seasonality", label: "Seasonality", revenue: 127800000, ebitda: 54100000, cash: 14480000, runway: 14.4, confidence: "Medium" },
  { id: "carry", label: "Prior carry-forward", revenue: 124900000, ebitda: 51900000, cash: 14200000, runway: 14.0, confidence: "Low" },
  { id: "manual", label: "Manual", revenue: 126800000, ebitda: 53400000, cash: 14300000, runway: 14.2, confidence: "Low" },
  { id: "ai", label: "AI-assisted", revenue: 129600000, ebitda: 56200000, cash: 14900000, runway: 14.8, confidence: "High" },
  { id: "scenario", label: "Scenario-based", revenue: 125800000, ebitda: 52720000, cash: 13840000, runway: 14.2, confidence: "High" },
] as const

type MethodId = (typeof FORECAST_METHODS)[number]["id"]

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
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
        className={`h-10 min-w-[118px] inline-flex items-center ${R} border border-[#d0d5dd] bg-white pl-2.5 pr-7 text-left hover:bg-[#f9fafb]`}
      >
        <span className="flex flex-col justify-center min-w-0 py-1">
          <span className="text-[9px] font-medium uppercase tracking-wide text-[#98a2b3] leading-none">{label}</span>
          <span className="text-[12px] font-semibold text-[#101828] leading-tight mt-0.5 truncate">{value}</span>
        </span>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-4 text-[#98a2b3]" />
      </button>
      {open ? (
        <div className={`absolute left-0 top-[calc(100%+4px)] z-40 min-w-[180px] ${R} border border-[#e4e7ec] bg-white py-1 shadow-lg`}>
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false) }}
              className={cn(
                "w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-[12px] hover:bg-[#f9fafb]",
                opt === value ? "text-[#1570ef] font-semibold" : "text-[#344054]",
              )}
            >
              {opt}
              {opt === value ? <Check className="size-3.5 shrink-0" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function FpaRollingForecast() {
  const dispatch = useAppDispatch()
  const { selectedModelId, selectedVersionId, models } = useAppSelector((s) => s.fpa)
  const model = models.find((m) => m.id === selectedModelId)

  const [cutOff, setCutOff] = useState(5)
  const [activeMethod, setActiveMethod] = useState<MethodId>("driver")
  const [rollingBusy, setRollingBusy] = useState(false)
  const [entity, setEntity] = useState("All Entities")
  const [version, setVersion] = useState("Working")
  const [period, setPeriod] = useState("May 2025")
  const [horizonMonths, setHorizonMonths] = useState(12)

  useEffect(() => {
    if (selectedModelId) {
      void dispatch(fetchFpaDashboard({ modelId: selectedModelId, versionId: selectedVersionId || undefined }))
    }
  }, [dispatch, selectedModelId, selectedVersionId])

  const method = FORECAST_METHODS.find((m) => m.id === activeMethod) || FORECAST_METHODS[0]
  const entityFactor = entity === "All Entities" ? 1 : 0.42

  const kpis = useMemo(() => [
    { label: "Revenue Forecast", value: formatMoney(method.revenue * entityFactor), delta: "Full-year blend" },
    { label: "EBITDA", value: formatMoney(method.ebitda * entityFactor), delta: `${method.confidence} confidence` },
    { label: "Closing Cash", value: formatMoney(method.cash * entityFactor), delta: "▲ vs prior month" },
    { label: "Cash Runway", value: `${method.runway} mo`, delta: "Policy min 12 mo" },
    { label: "Forecast Accuracy", value: "94.2%", delta: "Rolling 3-period" },
  ], [method, entityFactor])

  const trendData = useMemo(() => {
    const monthIndex = cutOff - 1
    return mockRollingForecastTrend.slice(0, horizonMonths).map((d, i) => ({
      ...d,
      actualLine: i <= monthIndex ? d.actual : null,
      forecastLine: i >= monthIndex ? (d.forecast ?? d.budget) : null,
      cutoff: i === monthIndex,
    }))
  }, [cutOff, horizonMonths])

  const methodCompare = useMemo(() =>
    FORECAST_METHODS.slice(0, 6).map((m) => ({
      name: m.label.split("-")[0].trim(),
      revenue: (m.revenue * entityFactor) / 1e6,
    })),
  [entityFactor])

  const handleRollForward = () => {
    if (cutOff >= 11) {
      toast.warning("Forecast horizon is already at the maximum period.")
      return
    }
    setRollingBusy(true)
    setTimeout(() => {
      setCutOff((prev) => prev + 1)
      setRollingBusy(false)
      toast.success(
        `${MONTHS_2026[cutOff - 1]} actuals imported. ${MONTHS_2026[cutOff]} is now the forecast start month.`,
      )
    }, 800)
  }

  const resetFilters = () => {
    setEntity("All Entities")
    setVersion("Working")
    setPeriod("May 2025")
    setHorizonMonths(12)
    setCutOff(5)
    setActiveMethod("driver")
    toast.message("Filters reset")
  }

  const worksheetHref = selectedModelId
    ? `/forecasting/models/${selectedModelId}/worksheet`
    : "/forecasting/models"

  const closedCount = cutOff
  const openCount = horizonMonths - cutOff

  return (
    <div className="min-h-full bg-[#f1f5f9] flex flex-col w-full">
      <div className="bg-white border-b border-[#e4e7ec] w-full">
        <div className="px-4 sm:px-5 pt-4 pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-[18px] font-semibold text-[#101828]">Forecasts</h1>
              <p className="text-[12px] text-[#667085] mt-0.5">
                Rolling forecast · {closedCount} actual months + {openCount} forecast months
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="rounded-full h-9 px-4 text-xs" onClick={() => toast.message("Syncing actuals from Data Hub…")}>
                <RefreshCw className="size-3.5" />
                Sync Actuals
              </Button>
              <Button
                variant="gradient-info"
                className="rounded-full h-9 px-4 text-xs shadow-sm"
                disabled={rollingBusy}
                onClick={handleRollForward}
              >
                {rollingBusy ? <RefreshCw className="size-3.5 animate-spin" /> : <Play className="size-3.5 fill-white" />}
                Roll Forward
              </Button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-end gap-2">
            <FilterSelect label="Entity" value={entity} options={["All Entities", "North America", "EMEA", "APAC", "LATAM"]} onChange={setEntity} />
            <FilterSelect label="Version" value={version} options={["Working", "Locked", "Published"]} onChange={setVersion} />
            <FilterSelect label="Period" value={period} options={["May 2025", "Apr 2025", "Mar 2025", "FY2025", "FY2026"]} onChange={setPeriod} />
            <FilterSelect label="Horizon" value={`${horizonMonths} months`} options={["12 months", "18 months"]} onChange={(v) => setHorizonMonths(v.startsWith("18") ? 18 : 12)} />
            <button type="button" onClick={resetFilters} className="ml-auto mb-0.5 px-1 text-[12px] font-semibold text-[#1570ef] hover:underline">
              Reset Filters
            </button>
          </div>
        </div>

        <div className="px-4 sm:px-5 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            {kpis.map((k) => (
              <button
                key={k.label}
                type="button"
                onClick={() => toast.message(k.label, { description: `${k.value} · ${method.label} · ${period}` })}
                className={`${R} border border-[#e4e7ec] bg-white px-4 py-3 text-left hover:border-[#b2ddff] transition-colors shadow-[0_1px_2px_rgba(16,24,40,0.03)]`}
              >
                <p className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider">{k.label}</p>
                <p className="text-xl font-bold text-[#101828] mt-1 tabular-nums">{k.value}</p>
                <p className="text-[11px] text-[#12b76a] mt-1">{k.delta}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 sm:p-5 space-y-4 w-full">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <section className={`${R} border border-[#e4e7ec] bg-white p-4`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-semibold text-[#101828]">Actual vs Forecast Trend</h2>
                <p className="text-[11px] text-[#667085]">Revenue ($M) · cut-off at {MONTHS_2026[cutOff - 1]} 2026</p>
              </div>
              <span className="text-[11px] font-semibold text-[#079455] bg-[#edfcf2] px-2 py-0.5 rounded-full border border-[#abefc6]">
                SRD formula: Actuals + Forecast
              </span>
            </div>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f2f4f7" />
                  <XAxis dataKey="m" tick={{ fontSize: 10, fill: "#667085" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#667085" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <ReferenceLine x={MONTHS_2026[cutOff - 1]} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "Cut-off", fontSize: 10, fill: "#b54708" }} />
                  <Bar dataKey="budget" fill="#e0e7ff" name="Budget" radius={[3, 3, 0, 0]} />
                  <Line type="monotone" dataKey="actualLine" stroke="#12b76a" strokeWidth={2.5} dot={{ r: 3 }} name="Actual" connectNulls={false} />
                  <Line type="monotone" dataKey="forecastLine" stroke="#2563eb" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 3 }} name="Forecast" connectNulls={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className={`${R} border border-[#e4e7ec] bg-white p-4`}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[#101828]">Method Comparison</h2>
              <span className="text-[11px] text-[#667085]">Revenue ($M) by method</span>
            </div>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={methodCompare} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f2f4f7" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#667085" }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#344054" }} width={72} />
                  <Tooltip formatter={(v: number) => [`$${v.toFixed(1)}M`, "Revenue"]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar
                    dataKey="revenue"
                    fill="#2563eb"
                    radius={[0, 4, 4, 0]}
                    onClick={(d) => {
                      const hit = FORECAST_METHODS.find((m) => m.label.startsWith(String(d.name)))
                      if (hit) {
                        setActiveMethod(hit.id)
                        toast.message(hit.label, { description: `${hit.confidence} confidence method selected` })
                      }
                    }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        <section className={`${R} border border-[#e4e7ec] bg-white p-5 shadow-sm w-full`}>
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <div>
              <h2 className="text-[15px] font-semibold text-[#101828]">Rolling Horizon & Cut-off</h2>
              <p className="text-[12px] text-[#667085] mt-0.5">
                Model: {model?.name || "Consolidated FY26"} · Granularity: {model?.timeGranularity || "Monthly"}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#079455] bg-[#edfcf2] px-2 py-0.5 rounded-full border border-[#abefc6]">
              <TrendingUp className="w-3 h-3" />
              {horizonMonths}-month rolling window
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2 mb-6">
            {MONTHS_2026.map((m, idx) => {
              const isActual = idx < cutOff
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setCutOff(Math.max(1, Math.min(11, idx + 1)))}
                  className={cn(
                    `${R} p-2.5 text-center border transition-all flex flex-col justify-between items-center gap-1.5 hover:scale-[1.02]`,
                    isActual
                      ? "bg-[#edfcf2] border-[#abefc6] text-[#087443]"
                      : "bg-[#eff8ff] border-[#b2ddff] text-[#175cd3]",
                    idx === cutOff - 1 && "ring-2 ring-[#f59e0b] ring-offset-1",
                  )}
                >
                  <span className="text-[13px] font-bold">{m}</span>
                  <span className={cn(
                    "text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5",
                    isActual ? "bg-[#079455]/10 text-[#079455]" : "bg-[#1570ef]/10 text-[#1570ef]",
                  )}>
                    {isActual ? <Lock className="w-2.5 h-2.5" /> : null}
                    {isActual ? "Actual" : "Fcst"}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="space-y-2 border-t border-[#f2f4f7] pt-4">
            <div className="flex items-center justify-between text-[12px] font-semibold text-[#344054]">
              <span>Actuals cut-off month</span>
              <span className="text-[#2563eb]">{MONTHS_2026[cutOff - 1]} 2026</span>
            </div>
            <input
              type="range"
              min={1}
              max={11}
              value={cutOff}
              onChange={(e) => setCutOff(Number(e.target.value))}
              className="w-full h-1.5 bg-[#eaecf0] rounded-lg appearance-none cursor-pointer accent-[#2563eb]"
            />
            <p className="text-[11px] text-[#667085]">
              Closed periods become actuals from Data Hub; open periods recalculate using the selected forecast method.
            </p>
          </div>
        </section>

        <section className={`${R} border border-[#e4e7ec] bg-white p-4 w-full`}>
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <div>
              <h3 className="text-[14px] font-semibold text-[#101828]">Forecast Method</h3>
              <p className="text-[11px] text-[#667085]">SRD §15 · {method.confidence} confidence · {method.label}</p>
            </div>
            <Link href={worksheetHref}>
              <Button variant="gradient-info" className="rounded-full h-9 px-4 text-xs shadow-sm">
                Open Worksheet
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap gap-2">
            {FORECAST_METHODS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setActiveMethod(m.id)
                  toast.message(m.label, { description: `${m.confidence} confidence · Revenue ${formatMoney(m.revenue * entityFactor)}` })
                }}
                className={cn(
                  "h-9 inline-flex items-center rounded-full border px-4 text-xs font-semibold transition-all shadow-sm gap-1",
                  activeMethod === m.id
                    ? "border-[#2563eb] bg-[#eff8ff] text-[#175cd3]"
                    : "border-[#d0d5dd] bg-white text-[#344054] hover:bg-[#f9fafb]",
                  m.id === "ai" && "gap-1.5",
                )}
              >
                {m.id === "ai" ? <Sparkles className="w-3 h-3" /> : null}
                {m.label}
              </button>
            ))}
          </div>
        </section>

        <div className={`${R} border border-[#d1e9ff] bg-[#f5faff] p-4 flex items-start gap-3 w-full`}>
          <AlertCircle className="w-5 h-5 text-[#1570ef] shrink-0 mt-0.5" />
          <div className="text-[12.5px] leading-relaxed">
            <h4 className="font-semibold text-[#175cd3]">Data Hub & Actuals Cut-off Policy</h4>
            <p className="text-[#1e468f] mt-1">
              Historical actuals are locked and imported from Arcus Data Hub. Roll forward shifts the cut-off boundary — closed periods stay read-only; future periods recalculate from drivers and the active method.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
