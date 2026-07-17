"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import {
  Check,
  ChevronDown,
  Download,
  FileText,
  Inbox,
  Info,
  MoreVertical,
  Pin,
  RefreshCw,
  SquareCheck,
  TrendingUp,
} from "lucide-react"
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { toast } from "sonner"
import { FpaPageHeader } from "./fpa-page-header"
import { KpiSparkline } from "./kpi-sparkline"
import { cn } from "@/lib/utils"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import {
  fetchFpaDashboard,
  setSelectedScenarioId,
} from "@/lib/store/slices/fpaSlice"
import { asNumber, formatMoney, type FpaHomeDashboard } from "@/lib/api/fpa-api"
import { useFpaBootstrap } from "@/lib/hooks/useFpaBootstrap"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const CARD =
  "rounded-xl border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"

const BLUE = "#1d4ed8"
const BLUE_BRIGHT = "#2563eb"
const TEAL = "#0d9488"

const EMPTY = "—"

function optionalNumber(value: unknown): number | null {
  return value == null || value === "" ? null : asNumber(value)
}

function formatMetricValue(key: string, value: number, currency = "USD") {
  if (/runway/i.test(key)) return `${value.toFixed(1)} months`
  if (/accuracy|percent|margin|rate|pct/i.test(key)) return `${value.toFixed(1)}%`
  return formatMoney(value, currency)
}

function formatDate(value?: string | null) {
  if (!value) return EMPTY
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function formatDateTime(value?: string | null) {
  if (!value) return EMPTY
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

const WORKFLOW_COLORS: Record<string, string> = {
  submitted: "#1D4ED8",
  "in review": "#D97706",
  approved: "#16A34A",
  completed: "#16A34A",
}

function ActivityIcon({
  kind,
  className,
}: {
  kind: "file" | "trend" | "check"
  className?: string
}) {
  if (kind === "trend") return <TrendingUp className={className} />
  if (kind === "check") return <SquareCheck className={className} />
  return <FileText className={className} />
}

type ModalKind = "departments" | "activity" | "tasks" | "scenarios" | "workflow" | "cashflow" | null

function Avatar({ src, alt, className }: { src?: string | null; alt: string; className?: string }) {
  if (!src) {
    return (
      <span
        className={cn(
          "rounded-full bg-[#e2e8f0] text-[#475569] inline-flex items-center justify-center font-semibold",
          className,
        )}
        aria-label={alt}
      >
        {alt.trim().charAt(0).toUpperCase() || "?"}
      </span>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={cn("rounded-full object-cover bg-[#94a3b8]", className)}
      loading="lazy"
    />
  )
}

function EndValueLabel({
  x,
  y,
  value,
  color,
  index,
  lastIndex,
}: {
  x?: number | string
  y?: number | string
  value?: number | string
  color: string
  index?: number
  lastIndex: number
}) {
  if (index !== lastIndex || x == null || y == null || value == null) return null
  const cx = Number(x)
  const cy = Number(y)
  const text = typeof value === "number" ? `${value}M` : String(value)
  const w = Math.max(46, text.length * 7.2)
  const h = 18
  return (
    <g transform={`translate(${cx + 8}, ${cy - h / 2})`}>
      <rect width={w} height={h} rx={3} ry={3} fill={color} />
      <text
        x={w / 2}
        y={h / 2 + 0.5}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#ffffff"
        fontSize={10}
        fontWeight={700}
      >
        {text}
      </text>
    </g>
  )
}

function SeriesDot({ cx, cy, fill }: { cx?: number; cy?: number; fill: string }) {
  if (cx == null || cy == null) return null
  return <circle cx={cx} cy={cy} r={3.5} fill={fill} stroke="#ffffff" strokeWidth={1.5} />
}

/** Compact Arcus pill filter control. */
function FilterSelect({
  value,
  options,
  onChange,
}: {
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
        className="h-8 inline-flex items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-white px-2.5 text-[11px] font-medium text-[#475569] hover:bg-[#f8fafc]"
      >
        {value}
        <ChevronDown className={cn("w-3.5 h-3.5 text-[#94a3b8] transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div className="absolute right-0 top-[calc(100%+4px)] z-30 min-w-[160px] rounded-md border border-[#e2e8f0] bg-white py-1 shadow-lg">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt)
                setOpen(false)
                toast.message(`Filter: ${opt}`)
              }}
              className={cn(
                "w-full flex items-center justify-between gap-2 rounded-full px-3 py-2 text-left text-[12px] hover:bg-[#f8fafc]",
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

function CardMenu({
  items,
}: {
  items: Array<{ label: string; icon?: React.ReactNode; onClick: () => void }>
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
        className="text-[#64748b] hover:text-[#64748b] p-1 rounded-full hover:bg-[#f8fafc]"
        aria-label="More"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open ? (
        <div className="absolute right-0 top-[calc(100%+4px)] z-30 min-w-[150px] rounded-md border border-[#e2e8f0] bg-white py-1 shadow-lg">
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              onClick={() => {
                it.onClick()
                setOpen(false)
              }}
              className="w-full flex items-center gap-2 rounded-full px-3 py-2 text-left text-[12px] text-[#334155] hover:bg-[#f8fafc]"
            >
              {it.icon}
              {it.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function PriorityBadge({ level }: { level: string }) {
  const normalized = level.toLowerCase()
  return (
    <span
      className={cn(
        "inline-flex items-center h-5 px-2 rounded-[6px] text-[10px] font-semibold",
        normalized === "high" && "bg-[#fecaca] text-[#991b1b]",
        normalized === "medium" && "bg-[#fed7aa] text-[#9a3412]",
        normalized === "low" && "bg-[#bbf7d0] text-[#166534]",
        !["high", "medium", "low"].includes(normalized) && "bg-[#e5e7eb] text-[#4b5563]",
      )}
    >
      {level}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase().replace(/_/g, " ")
  return (
    <span
      className={cn(
        "inline-flex items-center h-5 px-2 rounded-[6px] text-[10px] font-semibold",
        /progress|review|submitted/.test(normalized) && "bg-[#bfdbfe] text-[#1d4ed8]",
        /approved|complete|done/.test(normalized) && "bg-[#bbf7d0] text-[#166534]",
        !/progress|review|submitted|approved|complete|done/.test(normalized) && "bg-[#e5e7eb] text-[#4b5563]",
      )}
    >
      {status}
    </span>
  )
}

function ScenarioTable({
  metrics,
  scenarios,
  compact,
  activeScenarioId,
}: {
  metrics: NonNullable<NonNullable<FpaHomeDashboard["scenarioCompare"]>["metrics"]>
  scenarios: NonNullable<NonNullable<FpaHomeDashboard["scenarioCompare"]>["scenarios"]>
  compact?: boolean
  activeScenarioId?: string | null
}) {
  const headers = compact ? scenarios.slice(0, 3) : scenarios

  return (
    <div className="rounded-md border border-[#e2e8f0] overflow-x-auto -mx-0.5">
      {metrics.length === 0 || headers.length === 0 ? (
        <p className="py-8 text-center text-[12px] text-[#64748b]">No scenario comparison data.</p>
      ) : (
      <table className="w-full text-[11px] border-collapse min-w-0">
        <thead>
          <tr className="bg-[#f8fafc]">
            <th className="py-2.5 px-2 text-left font-semibold text-[#1e293b] border-b border-[#e2e8f0] sticky left-0 bg-[#f8fafc] z-[1] whitespace-nowrap">
              Scenario
            </th>
            {headers.map((h) => (
              <th
                key={h.id}
                className={cn(
                  "py-2.5 px-1.5 text-center font-semibold text-[#1e293b] border-b border-l border-[#e2e8f0] whitespace-nowrap",
                  activeScenarioId === h.id && "bg-[#eff6ff] text-[#1d4ed8]",
                )}
              >
                {h.name}
                {h.scenarioType ? (
                  <span className="block text-[9px] font-normal text-[#94a3b8]">{h.scenarioType}</span>
                ) : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {metrics.map((r, i) => {
            return (
              <tr key={r.key}>
                <td
                  className={cn(
                    "py-3 px-2 font-semibold text-[#1e293b] sticky left-0 bg-white z-[1] whitespace-nowrap",
                    i < metrics.length - 1 && "border-b border-[#e2e8f0]",
                  )}
                >
                  {r.label}
                </td>
                {headers.map((header) => {
                  const cell = r.values.find((value) => value.scenarioId === header.id)
                  const variance = optionalNumber(cell?.variancePct)
                  const value = optionalNumber(cell?.value)
                  return (
                  <td
                    key={header.id}
                    className={cn(
                      "py-3 px-1.5 text-center border-l border-[#e2e8f0]",
                      i < metrics.length - 1 && "border-b border-[#e2e8f0]",
                      activeScenarioId === header.id && "bg-[#eff6ff]/70",
                    )}
                  >
                    <p className="font-bold text-[#1e293b] tabular-nums leading-tight whitespace-nowrap">
                      {value == null ? EMPTY : formatMetricValue(r.key, value)}
                    </p>
                    <p
                      className={cn(
                        "text-[10px] font-semibold mt-1 leading-none whitespace-nowrap",
                        variance == null ? "text-[#64748b]" : variance >= 0 ? "text-[#15803d]" : "text-[#b91c1c]",
                      )}
                    >
                      {variance == null ? EMPTY : `${variance >= 0 ? "▲" : "▼"} ${Math.abs(variance).toFixed(1)}%`}
                    </p>
                  </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
      )}
    </div>
  )
}

function DeptTable({
  rows,
  compact,
}: {
  rows: Array<{
    dept: string
    budget: string
    actual: string
    variance: string
    owner: string
    photo?: string | null
    period: string
  }>
  compact?: boolean
}) {
  return (
    <div className="rounded-md border border-[#e2e8f0] overflow-x-auto">
      <table
        className={cn(
          "w-full text-[11px] border-collapse",
          compact ? "min-w-[420px]" : "min-w-[560px]",
        )}
      >
        <thead>
          <tr className="bg-[#f7fafc]">
            <th className="py-2.5 px-2.5 text-left font-semibold text-[#1a202c] border-b border-[#e2e8f0]">
              Department
            </th>
            <th className="py-2.5 px-2.5 text-right font-semibold text-[#1a202c] border-b border-[#e2e8f0]">
              Budget
            </th>
            <th className="py-2.5 px-2.5 text-right font-semibold text-[#1a202c] border-b border-[#e2e8f0]">
              Actual
            </th>
            <th className="py-2.5 px-2.5 text-right font-semibold text-[#1a202c] border-b border-[#e2e8f0]">
              Variance
            </th>
            {!compact ? (
              <th className="py-2.5 px-2.5 text-left font-semibold text-[#1a202c] border-b border-[#e2e8f0]">
                Owner
              </th>
            ) : null}
            <th className="py-2.5 px-2.5 text-center font-semibold text-[#1a202c] border-b border-[#e2e8f0]">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={compact ? 5 : 6} className="py-8 text-center text-[#64748b]">
                No over-budget departments.
              </td>
            </tr>
          ) : null}
          {rows.map((r, i) => (
            <tr key={`${r.dept}-${r.period}-${i}`} className="bg-white hover:bg-[#fafbfc]">
              <td
                className={cn(
                  "py-2.5 px-2.5 text-[#2d3748] whitespace-nowrap",
                  i < rows.length - 1 && "border-b border-[#e2e8f0]",
                )}
              >
                {r.dept}
              </td>
              <td
                className={cn(
                  "py-2.5 px-2.5 text-right tabular-nums font-bold text-[#1a202c] whitespace-nowrap",
                  i < rows.length - 1 && "border-b border-[#e2e8f0]",
                )}
              >
                {r.budget}
              </td>
              <td
                className={cn(
                  "py-2.5 px-2.5 text-right tabular-nums font-bold text-[#1a202c] whitespace-nowrap",
                  i < rows.length - 1 && "border-b border-[#e2e8f0]",
                )}
              >
                {r.actual}
              </td>
              <td
                className={cn(
                  "py-2.5 px-2.5 text-right tabular-nums font-bold text-[#e53e3e] whitespace-nowrap",
                  i < rows.length - 1 && "border-b border-[#e2e8f0]",
                )}
              >
                {r.variance}
              </td>
              {!compact ? (
                <td
                  className={cn(
                    "py-2.5 px-2.5",
                    i < rows.length - 1 && "border-b border-[#e2e8f0]",
                  )}
                >
                  <span className="inline-flex items-center gap-2 min-w-0">
                    <Avatar src={r.photo} alt={r.owner} className="h-7 w-7" />
                    <span className="text-[#2d3748] truncate">{r.owner}</span>
                  </span>
                </td>
              ) : null}
              <td
                className={cn(
                  "py-2.5 px-2.5 text-center",
                  i < rows.length - 1 && "border-b border-[#e2e8f0]",
                )}
              >
                <span className="inline-flex items-center h-6 px-2.5 rounded-[6px] text-[10px] font-semibold bg-[#fecaca] text-[#991b1b] whitespace-nowrap">
                  Over Budget
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function HomeBoardSkeleton() {
  const block = "animate-pulse rounded-md bg-[#e2e8f0]"
  return (
    <div className="space-y-3" role="status" aria-label="Loading FP&A dashboard">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className={cn(CARD, "p-4 space-y-4")}>
            <div className={cn(block, "h-3 w-28")} />
            <div className={cn(block, "h-7 w-32")} />
            <div className={cn(block, "h-3 w-20")} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {["lg:col-span-5", "lg:col-span-4", "lg:col-span-3"].map((span, index) => (
          <div key={index} className={cn(CARD, span, "p-4 min-h-[280px] space-y-5")}>
            <div className={cn(block, "h-4 w-40")} />
            <div className={cn(block, "h-[210px] w-full")} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {["lg:col-span-5", "lg:col-span-4", "lg:col-span-3"].map((span, index) => (
          <div key={index} className={cn(CARD, span, "p-4 min-h-[250px] space-y-4")}>
            <div className={cn(block, "h-4 w-36")} />
            <div className={cn(block, "h-10 w-full")} />
            <div className={cn(block, "h-10 w-full")} />
            <div className={cn(block, "h-10 w-4/5")} />
          </div>
        ))}
      </div>
      <div className={cn(CARD, "p-4 space-y-3")}>
        <div className={cn(block, "h-4 w-24")} />
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className={cn(block, "h-10 w-full")} />
        ))}
      </div>
    </div>
  )
}

export function FpaHomeBoard() {
  const dispatch = useAppDispatch()
  const { selectModel } = useFpaBootstrap()
  const {
    dashboard,
    loadingModels,
    loadingDashboard,
    error: storeError,
    selectedModelId,
    selectedVersionId,
    selectedScenarioId,
    models,
    scenarios,
    versions,
    bootstrapped,
  } = useAppSelector((state) => state.fpa)
  const [trendRange, setTrendRange] = useState("Last 12 Months")
  const [modal, setModal] = useState<ModalKind>(null)
  const [dashboardError, setDashboardError] = useState<string | null>(null)

  const refreshDashboard = () => {
    setDashboardError(null)
    return dispatch(
      fetchFpaDashboard({
        modelId: selectedModelId || undefined,
        versionId: selectedVersionId || undefined,
        scenarioId: selectedScenarioId || undefined,
      }),
    )
      .unwrap()
      .catch((reason) => {
        setDashboardError(typeof reason === "string" ? reason : "Failed to load dashboard")
      })
  }

  useEffect(() => {
    if (!bootstrapped || loadingModels || !selectedModelId) return
    void refreshDashboard()
    // The selected IDs are the dashboard query identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootstrapped, dispatch, loadingModels, selectedModelId, selectedVersionId, selectedScenarioId])

  const liveDashboard = dashboardError && !dashboard ? null : dashboard
  const scenario = scenarios.find((item) => item.id === selectedScenarioId)
  const version = versions.find((item) => item.id === selectedVersionId)
  const model = models.find((item) => item.id === selectedModelId)
  const scenarioName = scenario?.name || EMPTY
  const versionName = version?.name || EMPTY
  const currency = model?.baseCurrency || liveDashboard?.model?.baseCurrency || "USD"

  const kpis = useMemo(() => {
    const source = liveDashboard?.kpis
    const values = [
      {
        id: "rev",
        label: "Revenue Forecast",
        raw: source?.revenue,
        delta: source?.revenueDeltaPct,
        spark: source?.sparklines?.revenue,
        money: true,
      },
      {
        id: "ebitda",
        label: "EBITDA",
        raw: source?.ebitda,
        delta: source?.ebitdaDeltaPct,
        spark: source?.sparklines?.ebitda,
        money: true,
      },
      {
        id: "cash",
        label: "Closing Cash",
        raw: source?.closingCash ?? source?.cash,
        delta: source?.closingCashDeltaPct,
        spark: source?.sparklines?.closingCash,
        money: true,
      },
      {
        id: "runway",
        label: "Cash Runway",
        raw: source?.runwayMonths,
        delta: null,
        spark: source?.sparklines?.runwayMonths,
        suffix: " months",
      },
      {
        id: "acc",
        label: "Forecast Accuracy",
        raw: source?.forecastAccuracy,
        delta: null,
        spark: source?.sparklines?.forecastAccuracy,
        suffix: "%",
        dashed: true,
      },
    ]
    return values.map((item) => {
      const value = optionalNumber(item.raw)
      const delta = optionalNumber(item.delta)
      return {
        id: item.id,
        label: item.label,
        value: value == null ? EMPTY : item.money ? formatMoney(value, currency) : `${value.toFixed(1)}${item.suffix}`,
        pct: delta == null ? EMPTY : `${Math.abs(delta).toFixed(1)}%`,
        vs: delta == null ? "" : "vs prior period",
        up: delta != null && delta >= 0,
        spark: (item.spark || []).map((point) => asNumber(point)),
        dashed: Boolean(item.dashed),
      }
    })
  }, [currency, liveDashboard])

  const trendData = useMemo(() => {
    const rows = (liveDashboard?.revenueExpenseTrend || []).map((row) => ({
      m: row.period,
      revenue:
        optionalNumber(row.revenue) == null ? null : asNumber(row.revenue) / 1_000_000,
      expenses:
        optionalNumber(row.expenses ?? row.expense) == null
          ? null
          : asNumber(row.expenses ?? row.expense) / 1_000_000,
    }))
    if (trendRange === "Last 6 Months") return rows.slice(-6)
    if (trendRange === "Last 3 Months") return rows.slice(-3)
    if (trendRange === "Year to date") {
      const year = rows.at(-1)?.m.match(/\b(20\d{2})\b/)?.[1]
      return year ? rows.filter((row) => row.m.includes(year)) : rows
    }
    return rows.slice(-12)
  }, [liveDashboard, trendRange])

  const lastTrend = trendData[trendData.length - 1]
  const dashboardPeriods = useMemo(
    () =>
      Array.from(
        new Set([
          ...(liveDashboard?.revenueExpenseTrend || []).map((row) => row.period),
          ...(liveDashboard?.cashRunway?.byMonth || []).map((row) => row.period),
        ].filter(Boolean)),
      ),
    [liveDashboard],
  )
  const dashboardPeriod = dashboardPeriods.at(-1) || EMPTY

  const deptRows = useMemo(
    () =>
      (liveDashboard?.overBudgetDepartments || []).map((row) => {
        const overBy = asNumber(row.overBy)
        const plan = asNumber(row.plan)
        return {
          dept: row.departmentName || row.departmentId || EMPTY,
          budget: formatMoney(plan, currency),
          actual: formatMoney(row.actual, currency),
          variance: `${formatMoney(overBy, currency)}${plan ? ` (${((overBy / plan) * 100).toFixed(1)}%)` : ""}`,
          owner: row.ownerName || EMPTY,
          photo: row.ownerAvatarUrl,
          period: dashboardPeriod,
        }
      }),
    [currency, dashboardPeriod, liveDashboard],
  )
  const modalDeptRows = deptRows

  const scenarioCompare = liveDashboard?.scenarioCompare
  const scenarioMetrics = scenarioCompare?.metrics || []
  const comparedScenarios = scenarioCompare?.scenarios || []

  const workflow = useMemo(() => {
    const slices = liveDashboard?.workflowStatusSlices || []
    const total = slices.reduce((sum, item) => sum + asNumber(item.count), 0)
    return slices.map((item, index) => {
      const count = asNumber(item.count)
      const key = item.status.toLowerCase().replace(/_/g, " ")
      return {
        name: item.status.replace(/_/g, " "),
        value: count,
        color: WORKFLOW_COLORS[key] || ["#1D4ED8", "#D97706", "#16A34A", "#7C3AED"][index % 4],
        pct: total ? `${Math.round((count / total) * 100)}%` : EMPTY,
        count: total ? `(${count} / ${total})` : `(${count})`,
        complete: key === "approved" || key === "completed",
      }
    })
  }, [liveDashboard])
  const workflowTotal = workflow.reduce((sum, item) => sum + item.value, 0)
  const workflowComplete = workflowTotal
    ? Math.round((workflow.filter((item) => item.complete).reduce((sum, item) => sum + item.value, 0) / workflowTotal) * 100)
    : null

  const cash = useMemo(() => {
    const runway = liveDashboard?.cashRunway
    return {
      value: runway?.runwayMonths == null ? EMPTY : asNumber(runway.runwayMonths).toFixed(1),
      unit: runway?.runwayMonths == null ? "" : "months",
      delta: EMPTY,
      up: false,
      bars: (runway?.byMonth || [])
        .map((row) => ({
          m: row.period,
          bal:
            optionalNumber(row.closingCash ?? row.balance) == null
              ? null
              : asNumber(row.closingCash ?? row.balance) / 1_000_000,
          tick: true,
        }))
        .filter((row): row is { m: string; bal: number; tick: boolean } => row.bal != null),
    }
  }, [liveDashboard])

  const activities = useMemo(
    () =>
      ((liveDashboard?.recentActivity?.length ? liveDashboard.recentActivity : liveDashboard?.activity) || []).map((item) => ({
        id: item.id || `${item.title}-${item.createdAt}`,
        title: item.title || EMPTY,
        who: item.actorName || EMPTY,
        when: formatDateTime(item.createdAt),
        detail: item.body || "",
        icon: (String(item.kind).toLowerCase().includes("complete") ? "check" : "file") as "check" | "file",
        iconBg: "bg-[#bfdbfe] text-[#1d4ed8]",
      })),
    [liveDashboard],
  )

  const modalTasks = useMemo(
    () =>
      (liveDashboard?.openTasks || []).map((item) => ({
        id: item.id,
        task: item.title || EMPTY,
        module: item.module || EMPTY,
        owner: item.assigneeName || EMPTY,
        photo: item.assigneeAvatarUrl,
        due: formatDate(item.dueDate),
        priority: item.priority || EMPTY,
        status: item.status || EMPTY,
      })),
    [liveDashboard],
  )
  const visibleTasks = modalTasks.slice(0, 5)
  const versionNote = version?.status || versionName

  const applyScenario = (s: string) => {
    const match = scenarios.find((item) => item.name === s)
    if (match) dispatch(setSelectedScenarioId(match.id))
  }

  const openModal = (kind: ModalKind) => {
    setModal(kind)
  }

  return (
    <div className="min-h-full bg-[#f1f5f9]">
      <FpaPageHeader
        title="FP&A Home"
        liveFilters
        actions={
          <FilterSelect
            value={model?.name || EMPTY}
            options={models.map((item) => item.name)}
            onChange={(name) => {
              const next = models.find((item) => item.name === name)
              if (next && next.id !== selectedModelId) void selectModel(next.id)
            }}
          />
        }
      />

      <div className="w-full max-w-full px-3 sm:px-4 py-3 space-y-3 overflow-x-hidden">
        {(loadingModels || loadingDashboard) && dashboard ? (
          <div className={cn(CARD, "px-4 py-3 text-[12px] text-[#475569]")} role="status">
            Refreshing dashboard…
          </div>
        ) : null}
        {dashboardError || (!dashboard && storeError) ? (
          <div className={cn(CARD, "px-4 py-3 flex items-center justify-between gap-3 border-[#fecaca]")} role="alert">
            <p className="text-[12px] text-[#b91c1c]">
              Dashboard data could not be loaded: {dashboardError || storeError}
            </p>
            <button
              type="button"
              onClick={() => void refreshDashboard()}
              className="h-8 rounded-full border border-[#fecaca] px-3 text-[11px] font-semibold text-[#b91c1c] hover:bg-[#fef2f2]"
            >
              Retry
            </button>
          </div>
        ) : null}
        {!dashboard && (loadingModels || loadingDashboard || !bootstrapped) ? <HomeBoardSkeleton /> : (
        <>
        {/* KPI strip — 5-up only on xl so values + sparklines never collide */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
          {kpis.map((kpi) => (
            <div key={kpi.id} className={cn(CARD, "px-4 pt-3.5 pb-3.5 min-w-0 overflow-hidden")}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13px] font-semibold text-[#0f172a] leading-snug pr-1">
                  {kpi.label}
                </p>
                <CardMenu
                  items={[
                    {
                      label: "Refresh",
                      icon: <RefreshCw className="w-3.5 h-3.5" />,
                      onClick: () => void refreshDashboard(),
                    },
                    {
                      label: "Export CSV",
                      icon: <Download className="w-3.5 h-3.5" />,
                      onClick: () =>
                        toast.message("Export from Reports", {
                          description: "Use the Reports tab to create a server-backed export.",
                        }),
                    },
                    {
                      label: "Pin to board",
                      icon: <Pin className="w-3.5 h-3.5" />,
                      onClick: () =>
                        toast.message("Pinning is not available yet", {
                          description: `${kpi.label} has not been changed.`,
                        }),
                    },
                  ]}
                />
              </div>
              <div className="mt-3 flex items-end justify-between gap-3 min-w-0">
                <div className="min-w-0 flex-1">
                  <p className="text-[22px] sm:text-[24px] font-bold text-[#0f172a] tabular-nums leading-tight tracking-tight whitespace-nowrap">
                    {kpi.value}
                  </p>
                  <p className="mt-1.5 text-[11px] sm:text-[12px] leading-snug">
                    <span
                      className={cn(
                        "font-semibold",
                        kpi.pct === EMPTY
                          ? "text-[#64748b]"
                          : kpi.up
                            ? "text-[#15803d]"
                            : "text-[#b91c1c]",
                      )}
                    >
                      {kpi.pct === EMPTY ? EMPTY : `${kpi.up ? "▲" : "▼"} ${kpi.pct}`}
                    </span>
                    <span className="text-[#64748b] font-normal"> {kpi.vs}</span>
                  </p>
                </div>
                <KpiSparkline values={kpi.spark} dashed={kpi.dashed} />
              </div>
            </div>
          ))}
        </div>

        {/* Trend · Scenarios · Workflow — stack until lg */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <section className={cn(CARD, "lg:col-span-5 flex flex-col min-h-[280px] sm:min-h-[320px] min-w-0")}>
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 pt-4 pb-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <h2 className="text-[14px] font-semibold text-[#0f172a] truncate">
                  Revenue vs Expense Trend
                </h2>
                <button
                  type="button"
                  title="Monthly revenue and total expenses"
                  className="rounded-full p-1 hover:bg-[#f8fafc]"
                  onClick={() => toast.message("Revenue vs Expense Trend", {
                    description: "Solid blue = Revenue · Dashed teal = Total Expenses",
                  })}
                >
                  <Info className="w-3.5 h-3.5 text-[#64748b]" />
                </button>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <FilterSelect
                  value={trendRange}
                  options={["Last 12 Months", "Last 6 Months", "Last 3 Months", "Year to date"]}
                  onChange={setTrendRange}
                />
                <CardMenu
                  items={[
                    {
                      label: "Export chart",
                      icon: <Download className="w-3.5 h-3.5" />,
                      onClick: () =>
                        toast.message("Export from Reports", {
                          description: "Chart export is not available on the Home dashboard.",
                        }),
                    },
                    {
                      label: "Refresh",
                      icon: <RefreshCw className="w-3.5 h-3.5" />,
                      onClick: () => void refreshDashboard(),
                    },
                  ]}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 px-5 pb-1">
              <p className="text-[11px] text-[#64748b]">$ in millions</p>
              <div className="flex items-center gap-4 text-[12px] text-[#334155]">
                <span className="inline-flex items-center gap-1.5">
                  <svg width="22" height="8" aria-hidden>
                    <line x1="0" y1="4" x2="16" y2="4" stroke={BLUE_BRIGHT} strokeWidth="3" />
                    <circle cx="18" cy="4" r={2.5} fill={BLUE_BRIGHT} />
                  </svg>
                  Revenue
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <svg width="26" height="8" aria-hidden>
                    <line
                      x1="0"
                      y1="4"
                      x2="18"
                      y2="4"
                      stroke={TEAL}
                      strokeWidth="3"
                      strokeDasharray="4 3"
                    />
                    <circle cx="22" cy="4" r={2.5} fill={TEAL} />
                  </svg>
                  Total Expenses
                </span>
              </div>
            </div>

            <div className="flex-1 min-h-[200px] sm:min-h-[240px] px-1 sm:px-2 pb-3 min-w-0 overflow-hidden">
              {trendData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[12px] text-[#64748b]">
                  No revenue or expense trend data.
                </div>
              ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={trendData}
                  margin={{ top: 10, right: 28, left: 0, bottom: 4 }}
                >
                  <defs>
                    <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={BLUE_BRIGHT} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={BLUE_BRIGHT} stopOpacity={0.08} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="0" vertical={false} stroke="#eef2f7" />
                  <XAxis
                    dataKey="m"
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                    minTickGap={28}
                    dy={4}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                    tickFormatter={(v) => (v === 0 ? "0" : `${v}M`)}
                    domain={[0, "auto"]}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 11 }}
                    formatter={(v: number, name: string) => [
                      `$${Number(v).toFixed(1)}M`,
                      name === "revenue" ? "Revenue" : "Total Expenses",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke={BLUE_BRIGHT}
                    strokeWidth={3}
                    fill="url(#revFill)"
                    dot={(props) => <SeriesDot {...props} fill={BLUE_BRIGHT} />}
                    activeDot={{ r: 4.5, fill: BLUE_BRIGHT, stroke: "#fff", strokeWidth: 2 }}
                    label={(props) => (
                      <EndValueLabel
                        {...props}
                        color={BLUE}
                        lastIndex={trendData.length - 1}
                        value={lastTrend?.revenue ?? undefined}
                      />
                    )}
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    stroke={TEAL}
                    strokeWidth={3}
                    strokeDasharray="6 4"
                    dot={(props) => <SeriesDot {...props} fill={TEAL} />}
                    activeDot={{ r: 4.5, fill: TEAL, stroke: "#fff", strokeWidth: 2 }}
                    label={(props) => (
                      <EndValueLabel
                        {...props}
                        color={TEAL}
                        lastIndex={trendData.length - 1}
                        value={lastTrend?.expenses ?? undefined}
                      />
                    )}
                  />
                </ComposedChart>
              </ResponsiveContainer>
              )}
            </div>
          </section>

          <section className={cn(CARD, "lg:col-span-4 flex flex-col min-w-0")}>
            <div className="flex items-center gap-1.5 px-4 pt-3.5 pb-3">
              <h2 className="text-[14px] font-semibold text-[#1e293b]">Scenario Comparison</h2>
              <button
                type="button"
                className="rounded-full p-1 hover:bg-[#f8fafc]"
                onClick={() =>
                  toast.message("Scenario Comparison", {
                    description:
                      comparedScenarios.length > 0
                        ? `${comparedScenarios.length} scenarios from the dashboard API`
                        : "No scenario comparison data returned.",
                  })
                }
              >
                <Info className="w-3.5 h-3.5 text-[#64748b]" />
              </button>
            </div>
            <div className="px-3 sm:px-4 pb-3 flex-1 flex flex-col min-w-0 overflow-x-auto">
              <ScenarioTable
                compact
                metrics={scenarioMetrics}
                scenarios={comparedScenarios}
                activeScenarioId={selectedScenarioId}
              />
              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[10px] text-[#94a3b8]">
                  Showing {scenarioName} · {versionNote} · {dashboardPeriod}
                </p>
                <button
                  type="button"
                  onClick={() => openModal("scenarios")}
                  className="rounded-full px-2 py-1 text-[11px] font-medium text-[#1d4ed8] hover:bg-[#eff6ff] shrink-0"
                >
                  View all
                </button>
              </div>
            </div>
          </section>

          <section className={cn(CARD, "lg:col-span-3 flex flex-col min-w-0")}>
            <div className="flex items-center gap-1.5 px-4 pt-3.5 pb-3">
              <h2 className="text-[14px] font-semibold text-[#1f2937]">Budget Workflow Progress</h2>
              <button
                type="button"
                className="rounded-full p-1 hover:bg-[#f8fafc]"
                onClick={() =>
                  toast.message("Workflow Progress", {
                    description:
                      workflowTotal > 0
                        ? `${workflowTotal} workflow items across ${workflow.length} statuses`
                        : "No workflow status data returned.",
                  })
                }
              >
                <Info className="w-3.5 h-3.5 text-[#4b5563]" />
              </button>
            </div>

            <div className="px-3 sm:px-4 flex-1 flex flex-col xl:flex-row items-center gap-4 min-h-[160px]">
              <div className="h-[132px] w-[132px] sm:h-[140px] sm:w-[140px] relative shrink-0">
                {workflow.length > 0 ? <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={workflow}
                      dataKey="value"
                      innerRadius={46}
                      outerRadius={66}
                      paddingAngle={1.5}
                      stroke="none"
                      startAngle={90}
                      endAngle={-270}
                    >
                      {workflow.map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer> : null}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-[26px] font-bold text-[#1f2937] leading-none">
                    {workflowComplete == null ? EMPTY : `${workflowComplete}%`}
                  </p>
                  <p className="text-[11px] text-[#4b5563] mt-1">Complete</p>
                </div>
              </div>

              <ul className="w-full space-y-3 min-w-0 flex-1">
                {workflow.length === 0 ? (
                  <li className="text-center text-[12px] text-[#64748b]">No workflow status data.</li>
                ) : null}
                {workflow.map((d) => (
                  <li key={d.name}>
                    <button
                      type="button"
                      onClick={() => {
                        toast.message(d.name, { description: `${d.pct} ${d.count}` })
                        openModal("workflow")
                      }}
                      className="w-full rounded-full grid grid-cols-[auto_1fr_auto] items-center gap-2 px-2 py-1 text-left hover:bg-[#f8fafc]"
                    >
                      <i
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: d.color }}
                      />
                      <span className="text-[12px] text-[#4b5563] truncate">{d.name}</span>
                      <span className="text-right whitespace-nowrap">
                        <span className="text-[12px] font-bold text-[#1f2937] tabular-nums">
                          {d.pct}
                        </span>{" "}
                        <span className="text-[11px] text-[#4b5563] tabular-nums">{d.count}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-3 border-t border-[#d1d5db] px-4 py-3 flex items-center gap-2">
              <Inbox className="w-4 h-4 text-[#4b5563] shrink-0" />
              <p className="text-[12px] text-[#4b5563]">
                {workflow.length ? `${workflowTotal} workflow items tracked` : "No workflow items available."}
              </p>
            </div>
          </section>
        </div>

        {/* Over budget · Cash · Activity — stack until lg */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <section className={cn(CARD, "lg:col-span-5 min-w-0")}>
            <div className="flex items-center justify-between gap-2 px-4 pt-3.5 pb-3">
              <div className="flex items-center gap-1.5 min-w-0">
                <h2 className="text-[14px] font-semibold text-[#1a202c]">Departments Over Budget</h2>
                <button
                  type="button"
                  className="rounded-full p-1 hover:bg-[#f8fafc]"
                  onClick={() =>
                    toast.message("Over Budget", {
                      description: "Departments where actual spend exceeds plan",
                    })
                  }
                >
                  <Info className="w-3.5 h-3.5 text-[#718096]" />
                </button>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <CardMenu
                  items={[
                    {
                      label: "Export CSV",
                      icon: <Download className="w-3.5 h-3.5" />,
                      onClick: () => toast.success("Departments exported"),
                    },
                    {
                      label: "View all",
                      onClick: () => openModal("departments"),
                    },
                  ]}
                />
              </div>
            </div>
            <div className="px-4 pb-3 overflow-x-auto">
              {deptRows.length === 0 ? (
                <p className="text-[12px] text-[#64748b] py-8 text-center">
                  No over-budget departments{dashboardPeriod === EMPTY ? "." : ` for ${dashboardPeriod}.`}
                </p>
              ) : (
                <DeptTable rows={deptRows} compact />
              )}
              <button
                type="button"
                onClick={() => openModal("departments")}
                className="rounded-full px-3 py-2 text-[12px] font-medium text-[#1d4ed8] hover:bg-[#eff6ff] mt-3 inline-block"
              >
                View all departments
              </button>
            </div>
          </section>

          <section className={cn(CARD, "lg:col-span-4 flex flex-col min-w-0")}>
            <div className="flex items-center justify-between gap-2 px-5 pt-4 pb-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <h2 className="text-[14px] font-semibold text-[#1a1a1a]">Cash Runway</h2>
                <button
                  type="button"
                  className="rounded-full p-1 hover:bg-[#f8fafc]"
                  onClick={() =>
                    toast.message("Cash Runway", {
                      description: "Projected months of cash remaining at current burn rate",
                    })
                  }
                >
                  <Info className="w-3.5 h-3.5 text-[#4b5563]" />
                </button>
              </div>
              <FilterSelect
                value={scenarioName}
                options={scenarios.map((item) => item.name)}
                onChange={applyScenario}
              />
            </div>

            <div className="px-5 flex-1 flex flex-col pb-4">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <p className="leading-none">
                  <span className="text-[32px] font-bold text-[#1a1a1a] tabular-nums tracking-tight">
                    {cash.value}
                  </span>
                  <span className="text-[18px] font-bold text-[#1a1a1a] ml-1.5">{cash.unit}</span>
                </p>
                <p className="text-[12px] leading-none whitespace-nowrap">
                  <span
                    className={cn(
                      "font-semibold",
                      cash.delta === EMPTY
                        ? "text-[#64748b]"
                        : cash.up
                          ? "text-[#047857]"
                          : "text-[#b91c1c]",
                    )}
                  >
                    {cash.delta === EMPTY ? EMPTY : `${cash.up ? "▲" : "▼"} ${cash.delta}`}
                  </span>
                  <span className="text-[#4b5563]"> vs prior period</span>
                </p>
              </div>

              <p className="text-[11px] text-[#4b5563] mt-4 mb-1">Cash Balance ($ in millions)</p>

              <div className="flex-1 min-h-[160px] sm:min-h-[180px] min-w-0 overflow-hidden">
                {cash.bars.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-[12px] text-[#64748b]">
                    No cash runway history.
                  </div>
                ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cash.bars} margin={{ top: 18, right: 8, left: 0, bottom: 0 }}>
                    <XAxis
                      dataKey="m"
                      tick={{ fontSize: 10, fill: "#4b5563" }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      tickFormatter={(_, i) => (cash.bars[i]?.tick ? cash.bars[i].m : "")}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#4b5563" }}
                      axisLine={false}
                      tickLine={false}
                      width={36}
                      ticks={[0, 20, 40, 60]}
                      tickFormatter={(v) => (v === 0 ? "0" : `${v}M`)}
                      domain={[0, 60]}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(37,99,235,0.12)" }}
                      contentStyle={{ borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 11 }}
                      formatter={(v: number) => [`$${v}M`, "Cash Balance"]}
                      labelFormatter={(l) => String(l)}
                    />
                    <Bar
                      dataKey="bal"
                      fill={BLUE_BRIGHT}
                      radius={[3, 3, 0, 0]}
                      maxBarSize={28}
                      activeBar={{ fill: BLUE }}
                    />
                  </BarChart>
                </ResponsiveContainer>
                )}
              </div>

              <button
                type="button"
                onClick={() => openModal("cashflow")}
                className="rounded-full px-3 py-2 text-[13px] font-medium text-[#1d4ed8] hover:bg-[#eff6ff] mt-2 self-start"
              >
                View cash flow
              </button>
            </div>
          </section>

          <section className={cn(CARD, "lg:col-span-3 flex flex-col min-w-0")}>
            <div className="flex items-center justify-between gap-2 px-5 pt-4 pb-3">
              <div className="flex items-center gap-1.5 min-w-0">
                <h2 className="text-[14px] font-semibold text-[#1f2937]">Recent Activity</h2>
                <button
                  type="button"
                  className="rounded-full p-1 hover:bg-[#f8fafc]"
                  onClick={() =>
                    toast.message("Recent Activity", {
                      description: "Latest model, forecast, and workflow events",
                    })
                  }
                >
                  <Info className="w-3.5 h-3.5 text-[#4b5563]" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => openModal("activity")}
                className="rounded-full px-2 py-1 text-[12px] font-medium text-[#1d4ed8] hover:bg-[#eff6ff] shrink-0"
              >
                View all
              </button>
            </div>

            <div className="mx-4 mb-4 flex-1 rounded-md border border-[#d1d5db] overflow-hidden">
              <ul>
                {activities.length === 0 ? (
                  <li className="py-8 text-center text-[12px] text-[#64748b]">No recent activity.</li>
                ) : null}
                {activities.slice(0, 5).map((a, i) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() =>
                        toast.message(a.title, {
                          description: `${a.who} · ${a.when} — ${a.detail}`,
                        })
                      }
                      className={cn(
                        "w-full rounded-full flex items-start gap-3 px-3 py-3 text-left hover:bg-[#f9fafb] transition-colors",
                        i < 4 && "border-b border-[#f3f4f6]",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 h-8 w-8 rounded-[6px] flex items-center justify-center shrink-0",
                          a.iconBg,
                        )}
                      >
                        <ActivityIcon kind={a.icon} className="w-3.5 h-3.5" />
                      </span>
                      <div className="min-w-0 pt-0.5">
                        <p className="text-[12px] font-semibold text-[#1f2937] leading-snug">
                          {a.title}
                        </p>
                        <p className="text-[11px] text-[#4b5563] mt-1 leading-none">
                          {a.who} • {a.when}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        {/* Open Tasks */}
        <section className={CARD}>
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 pt-4 pb-3">
            <div className="flex items-center gap-1.5 min-w-0">
              <h2 className="text-[14px] font-semibold text-[#1a1c1e]">Open Tasks</h2>
              <button
                type="button"
                className="rounded-full p-1 hover:bg-[#f8fafc]"
                onClick={() =>
                  toast.message("Open Tasks", {
                    description: "Outstanding planning and review tasks for this cycle",
                  })
                }
              >
                <Info className="w-3.5 h-3.5 text-[#4b5563]" />
              </button>
            </div>
          </div>

          <div className="px-5 pb-4 overflow-x-auto">
            {visibleTasks.length === 0 ? (
              <p className="text-[12px] text-[#4b5563] py-8 text-center">
                No open tasks.
              </p>
            ) : (
              <table className="w-full text-[12px] min-w-[780px]">
                <thead>
                  <tr className="text-left border-b border-[#d1d5db]">
                    <th className="pb-2.5 pr-3 font-semibold text-[#374151]">Task</th>
                    <th className="pb-2.5 px-3 font-semibold text-[#374151]">Module</th>
                    <th className="pb-2.5 px-3 font-semibold text-[#374151]">Owner</th>
                    <th className="pb-2.5 px-3 font-semibold text-[#374151]">Due Date</th>
                    <th className="pb-2.5 px-3 font-semibold text-[#374151]">Priority</th>
                    <th className="pb-2.5 pl-3 font-semibold text-[#374151]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTasks.map((t, i) => (
                    <tr
                      key={t.task}
                      className={cn(
                        "hover:bg-[#f9fafb] cursor-pointer transition-colors",
                        i < visibleTasks.length - 1 && "border-b border-[#f3f4f6]",
                      )}
                      onClick={() =>
                        toast.message(t.task, {
                          description: `${t.module} · ${t.owner} · Due ${t.due}`,
                        })
                      }
                    >
                      <td className="py-3 pr-3">
                        <span className="inline-flex items-center gap-2.5 font-medium text-[#1f2937]">
                          <FileText className="w-4 h-4 text-[#4b5563] shrink-0" />
                          {t.task}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#4b5563]">{t.module}</td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-2">
                          <Avatar src={t.photo} alt={t.owner} className="h-7 w-7" />
                          <span className="text-[#374151]">{t.owner}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#4b5563] tabular-nums whitespace-nowrap">
                        {t.due}
                      </td>
                      <td className="py-3 px-3">
                        <PriorityBadge level={t.priority} />
                      </td>
                      <td className="py-3 pl-3">
                        <StatusBadge status={t.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <button
              type="button"
              onClick={() => openModal("tasks")}
              className="rounded-full px-3 py-2 text-[13px] font-medium text-[#1d4ed8] hover:bg-[#eff6ff] mt-3 inline-block"
            >
              View all tasks
            </button>
          </div>
        </section>
        </>
        )}
      </div>

      {/* View-all dialogs */}
      <Dialog open={modal !== null} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent className="w-[calc(100%-1.5rem)] sm:max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden rounded-xl">
          <DialogHeader className="px-5 pt-5 pb-3 border-b border-[#e2e8f0] shrink-0">
            <DialogTitle className="text-[15px] text-[#0f172a]">
              {modal === "departments" && "All Departments Over Budget"}
              {modal === "activity" && "All Recent Activity"}
              {modal === "tasks" && "All Open Tasks"}
              {modal === "scenarios" && "Full Scenario Comparison"}
              {modal === "workflow" && "Budget Workflow Details"}
              {modal === "cashflow" && "Cash Flow Detail"}
            </DialogTitle>
            <DialogDescription className="text-[12px] text-[#64748b]">
              {modal === "departments" && `${modalDeptRows.length} departments · ${dashboardPeriod}`}
              {modal === "activity" && `${activities.length} events across the planning cycle`}
              {modal === "tasks" && `${modalTasks.length} open tasks`}
              {modal === "scenarios" &&
                `${scenarioName} · ${versionName} · ${dashboardPeriod} (all scenarios compared)`}
              {modal === "workflow" &&
                `${workflowTotal} items · ${workflowComplete == null ? EMPTY : `${workflowComplete}% complete`}`}
              {modal === "cashflow" &&
                `${scenarioName} · ${cash.value} ${cash.unit} runway`}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-auto px-5 py-4 space-y-3">
            {modal === "departments" && (
              <DeptTable rows={modalDeptRows} />
            )}

            {modal === "activity" && (
              <div className="rounded-md border border-[#d1d5db] overflow-hidden">
                <ul>
                  {activities.length === 0 ? (
                    <li className="py-8 text-center text-[12px] text-[#64748b]">No recent activity.</li>
                  ) : null}
                  {activities.map((a, i) => (
                    <li key={a.id}>
                      <button
                        type="button"
                        onClick={() =>
                          toast.message(a.title, {
                            description: `${a.who} · ${a.when} — ${a.detail}`,
                          })
                        }
                        className={cn(
                          "w-full rounded-full flex items-start gap-3 px-3 py-3.5 text-left hover:bg-[#f9fafb]",
                          i < activities.length - 1 && "border-b border-[#f3f4f6]",
                        )}
                      >
                        <span
                          className={cn(
                            "h-9 w-9 rounded-[6px] flex items-center justify-center shrink-0",
                            a.iconBg,
                          )}
                        >
                          <ActivityIcon kind={a.icon} className="w-4 h-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-[#1f2937]">{a.title}</p>
                          <p className="text-[12px] text-[#4b5563] mt-0.5">{a.detail}</p>
                          <p className="text-[11px] text-[#4b5563] mt-1">
                            {a.who} • {a.when}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {modal === "tasks" && (
              <>
                <div className="rounded-md border border-[#e2e8f0] overflow-hidden">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="bg-[#f8fafc] text-left">
                        <th className="py-2.5 px-3 font-semibold">Task</th>
                        <th className="py-2.5 px-3 font-semibold">Module</th>
                        <th className="py-2.5 px-3 font-semibold">Owner</th>
                        <th className="py-2.5 px-3 font-semibold">Due</th>
                        <th className="py-2.5 px-3 font-semibold">Priority</th>
                        <th className="py-2.5 px-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalTasks.map((t) => (
                        <tr key={t.task} className="border-t border-[#f1f5f9] hover:bg-[#f9fafb]">
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-2 font-medium text-[#1f2937]">
                              <FileText className="w-4 h-4 text-[#4b5563] shrink-0" />
                              {t.task}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-[#4b5563]">{t.module}</td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-2">
                              <Avatar src={t.photo} alt={t.owner} className="h-7 w-7" />
                              <span className="text-[#374151]">{t.owner}</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-[#4b5563]">{t.due}</td>
                          <td className="py-2.5 px-3">
                            <PriorityBadge level={t.priority} />
                          </td>
                          <td className="py-2.5 px-3">
                            <StatusBadge status={t.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {modal === "scenarios" && (
              <>
                <ScenarioTable
                  metrics={scenarioMetrics}
                  scenarios={comparedScenarios}
                  activeScenarioId={selectedScenarioId}
                />
                <p className="text-[11px] text-[#94a3b8]">
                  Active: {scenarioName} · {versionNote} · {dashboardPeriod}. Click Export in the card menu to
                  download.
                </p>
                <div className="flex gap-2">
                  <Link
                    href="/forecasting/scenarios"
                    className="h-9 inline-flex items-center rounded-full bg-[#2563eb] px-4 text-[12px] font-medium text-white hover:bg-[#1d4ed8]"
                  >
                    Open Scenarios module
                  </Link>
                </div>
              </>
            )}

            {modal === "workflow" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {workflow.length === 0 ? (
                    <p className="sm:col-span-3 py-8 text-center text-[12px] text-[#64748b]">
                      No workflow status data.
                    </p>
                  ) : null}
                  {workflow.map((d) => (
                    <div
                      key={d.name}
                      className="rounded-md border border-[#e2e8f0] p-3 text-center"
                    >
                      <i
                        className="inline-block h-3 w-3 rounded-full mb-2"
                        style={{ backgroundColor: d.color }}
                      />
                      <p className="text-[12px] text-[#64748b]">{d.name}</p>
                      <p className="text-[18px] font-bold text-[#0f172a] mt-1">{d.pct}</p>
                      <p className="text-[11px] text-[#64748b]">{d.count}</p>
                    </div>
                  ))}
                </div>
                <Link
                  href="/forecasting/workflow"
                  className="h-9 inline-flex items-center rounded-full bg-[#2563eb] px-4 text-[12px] font-medium text-white hover:bg-[#1d4ed8]"
                >
                  Open Workflow & Approvals
                </Link>
              </div>
            )}

            {modal === "cashflow" && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-[28px] font-bold text-[#1a1a1a] tabular-nums leading-none">
                      {cash.value}
                      <span className="text-[16px] ml-1.5">{cash.unit}</span>
                    </p>
                    <p className="text-[12px] mt-1.5">
                      <span
                        className={cn(
                          "font-semibold",
                          cash.delta === EMPTY
                            ? "text-[#64748b]"
                            : cash.up
                              ? "text-[#047857]"
                              : "text-[#b91c1c]",
                        )}
                      >
                        {cash.delta === EMPTY ? EMPTY : `${cash.up ? "▲" : "▼"} ${cash.delta}`}
                      </span>
                      <span className="text-[#4b5563]">
                        {" "}
                        vs prior period · {scenarioName}
                      </span>
                    </p>
                  </div>
                  <FilterSelect
                    value={scenarioName}
                    options={scenarios.map((item) => item.name)}
                    onChange={applyScenario}
                  />
                </div>

                <div className="h-[220px] rounded-md border border-[#d1d5db] p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cash.bars} margin={{ top: 20, right: 12, left: 0, bottom: 0 }}>
                      <XAxis
                        dataKey="m"
                        tick={{ fontSize: 10, fill: "#4b5563" }}
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                        tickFormatter={(_, i) => (cash.bars[i]?.tick ? cash.bars[i].m : "")}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "#4b5563" }}
                        axisLine={false}
                        tickLine={false}
                        width={36}
                        ticks={[0, 20, 40, 60]}
                        tickFormatter={(v) => (v === 0 ? "0" : `${v}M`)}
                        domain={[0, 60]}
                      />
                      <Tooltip
                        contentStyle={{ borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 11 }}
                        formatter={(v: number) => [`$${v}M`, "Cash Balance"]}
                      />
                      <Bar dataKey="bal" fill={BLUE_BRIGHT} radius={[3, 3, 0, 0]} maxBarSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="rounded-md border border-[#e2e8f0] overflow-hidden">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="bg-[#f8fafc] text-left">
                        <th className="py-2 px-3 font-semibold">Period</th>
                        <th className="py-2 px-3 font-semibold text-right">Cash Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cash.bars.map((b) => (
                        <tr key={b.m} className="border-t border-[#f1f5f9]">
                          <td className="py-2 px-3 text-[#334155]">{b.m}</td>
                          <td className="py-2 px-3 text-right tabular-nums font-semibold">
                            ${b.bal.toFixed(1)}M
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Link
                  href="/forecasting/cash-flow"
                  className="h-9 inline-flex items-center rounded-full bg-[#2563eb] px-4 text-[12px] font-medium text-white hover:bg-[#1d4ed8]"
                >
                  Open Cash Flow module
                </Link>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
