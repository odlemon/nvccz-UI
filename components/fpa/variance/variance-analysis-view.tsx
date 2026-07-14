"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  Info,
  Loader2,
  MoreHorizontal,
  X,
} from "lucide-react"
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { cn } from "@/lib/utils"
import { KpiSparkline } from "@/components/fpa/kpi-sparkline"
import {
  planningAvatarTone,
  planningInitials,
} from "@/components/fpa/planning/planning-collab-sidebar"
import {
  mockCommentaryReqs,
  mockVarDeptRows,
  mockVarKpis,
  mockVarTrend,
  mockVarTornado,
} from "@/components/fpa/mock-data"
import { CommentaryAllDialog, InfoDialog } from "@/components/fpa/variance/variance-dialogs"

const R = "rounded-lg"

const DEPT_ENTITIES: Record<string, string> = {
  Marketing: "North America",
  Sales: "North America",
  "Product Development": "North America",
  "Customer Success": "North America",
  IT: "EMEA",
  Finance: "EMEA",
  "People & Culture": "EMEA",
  Legal: "EMEA",
  Operations: "APAC",
  "R&D": "APAC",
  "Shared Services": "LATAM",
}

const VERSION_SCALE: Record<string, number> = {
  Working: 1,
  Locked: 0.99,
  Published: 0.97,
}

function scaleRow(row: VarDeptRow, factor: number): VarDeptRow {
  if (factor === 1 || row.isSummary) return row
  return {
    ...row,
    actual: row.actual * factor,
    budget: row.budget * factor,
    forecast: row.forecast * factor,
    varB: row.varB * factor,
    varF: row.varF * factor,
  }
}

function aggregateEntityRows(rows: VarDeptRow[]): VarDeptRow[] {
  const total = rows.find((r) => r.isSummary || r.dept === "Total Company")
  const byEntity = new Map<string, VarDeptRow>()
  for (const row of rows.filter((r) => !r.isSummary && r.dept !== "Total Company")) {
    const ent = DEPT_ENTITIES[row.dept] || "Other"
    const hit = byEntity.get(ent)
    if (!hit) {
      byEntity.set(ent, { ...row, dept: ent, isSummary: false })
    } else {
      byEntity.set(ent, {
        ...hit,
        actual: hit.actual + row.actual,
        budget: hit.budget + row.budget,
        forecast: hit.forecast + row.forecast,
        varB: hit.varB + row.varB,
        varF: hit.varF + row.varF,
        varBp: hit.budget + row.budget ? ((hit.varB + row.varB) / (hit.budget + row.budget)) * 100 : 0,
        commentary: row.commentary === "red" || hit.commentary === "red" ? "red" : row.commentary === "yellow" || hit.commentary === "yellow" ? "yellow" : "green",
      })
    }
  }
  const entityRows = [...byEntity.values()].sort((a, b) => a.dept.localeCompare(b.dept))
  return total ? [total, ...entityRows] : entityRows
}

function toLineItemRows(rows: VarDeptRow[]): VarDeptRow[] {
  const total = rows.find((r) => r.isSummary || r.dept === "Total Company")
  const out: VarDeptRow[] = total ? [total] : []
  for (const row of rows.filter((r) => !r.isSummary && r.dept !== "Total Company")) {
    for (const suffix of ["Revenue", "Opex"] as const) {
      const share = suffix === "Revenue" ? 0.62 : 0.38
      out.push({
        ...row,
        dept: `${row.dept} · ${suffix}`,
        actual: row.actual * share,
        budget: row.budget * share,
        forecast: row.forecast * share,
        varB: row.varB * share,
        varF: row.varF * share,
        varBp: row.varBp,
        commentary: row.commentary,
      })
    }
  }
  return out
}

export type VarDeptRow = {
  dept: string
  actual: number
  budget: number
  forecast: number
  varB: number
  varBp: number
  varF: number
  commentary: "green" | "yellow" | "red"
  commentaryDone?: number
  commentaryTotal?: number
  isSummary?: boolean
}

export type VarCommentaryReq = {
  id: string
  dept: string
  area: string
  owner: string
  due: string
  variance: string
  status: "Overdue" | "In Progress" | "Submitted"
}

export type VarKpi = {
  label: string
  value: string
  delta?: string
  deltaTone?: "up" | "down" | "neutral"
  spark?: number[]
  sparkColor?: string
  /** Revenue / Opex / EBITDA variance cards — circle arrow on the right */
  showTrendIcon?: boolean
  trendArrow?: "up" | "down"
}

export type VarDetail = {
  id: string
  dept: string
  area: string
  period: string
  headline: string
  headlineTone: "up" | "down"
  pctLabel: string
  explanation: string
  correctiveAction: string
  supporting: Array<{ label: string; value: string }>
  owner: string
  due: string
  status: "Overdue" | "In Progress" | "Submitted"
}

function fmtMoneyM(n: number, summary = false): string {
  if (n === 0) return "$0.00M"
  const decimals = summary ? 1 : 2
  const abs = Math.abs(n).toFixed(decimals)
  if (n < 0) return `($${abs}M)`
  return `$${abs}M`
}

function fmtPct(n: number): string {
  if (n === 0) return "0.0%"
  return `${n.toFixed(1)}%`
}

function varTone(n: number): string {
  if (n === 0) return "text-[#101828]"
  return n > 0 ? "text-[#12b76a]" : "text-[#f04438]"
}

export function mapMockDeptRows(): VarDeptRow[] {
  return mockVarDeptRows.map((r) => ({
    ...r,
    commentaryDone: r.commentaryDone,
    commentaryTotal: r.commentaryTotal,
    isSummary: "isSummary" in r ? Boolean(r.isSummary) : r.dept === "Total Company",
  }))
}

export function mapMockCommentary(): VarCommentaryReq[] {
  return mockCommentaryReqs.map((r, i) => ({
    id: `cr-${i}`,
    ...r,
  }))
}

export function mapMockKpis(): VarKpi[] {
  const [actual, budget, revVar, opexVar, ebitdaVar] = mockVarKpis
  return [
    {
      label: actual.label,
      value: actual.value,
      delta: "▲ 4.2% vs Budget",
      deltaTone: "up",
      spark: actual.spark,
      sparkColor: "#3b82f6",
    },
    {
      label: budget.label,
      value: budget.value,
      deltaTone: "neutral",
      spark: budget.spark,
      sparkColor: "#3b82f6",
    },
    {
      label: revVar.label,
      value: revVar.value,
      delta: "▲ 3.6% vs Budget",
      deltaTone: "up",
      showTrendIcon: true,
      trendArrow: "up",
    },
    {
      label: opexVar.label,
      value: opexVar.value,
      delta: "▼ -2.1% vs Budget",
      deltaTone: "up",
      showTrendIcon: true,
      trendArrow: "down",
    },
    {
      label: ebitdaVar.label,
      value: ebitdaVar.value,
      delta: "▲ 8.7% vs Budget",
      deltaTone: "up",
      showTrendIcon: true,
      trendArrow: "up",
    },
  ]
}

const DEMO_DETAILS: Record<string, VarDetail> = {
  "Product Development|Headcount": {
    id: "pd-hc",
    dept: "Product Development",
    area: "Headcount",
    period: "May 2025",
    headline: "$(0.80M)",
    headlineTone: "down",
    pctLabel: "-7.4% vs Budget",
    explanation:
      "Headcount variance driven by delayed hiring in engineering roles. Three senior engineer positions remain unfilled due to extended interview cycles and competing offers in the market.",
    correctiveAction:
      "Accelerate hiring pipeline with agency support for Q2 backfill. Revised offer bands approved for senior engineering roles effective June 1.",
    supporting: [
      { label: "Actual", value: "$15.00M" },
      { label: "Budget", value: "$16.20M" },
      { label: "Forecast", value: "$15.50M" },
      { label: "Var to Budget $", value: "$(0.80M)" },
      { label: "Var %", value: "-7.4%" },
      { label: "Var to Forecast $", value: "$(0.50M)" },
    ],
    owner: "Devon Lane",
    due: "May 30, 2025",
    status: "Overdue",
  },
}

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
          <span className="text-[9px] font-medium uppercase tracking-wide text-[#98a2b3] leading-none">
            {label}
          </span>
          <span className="text-[12px] font-semibold text-[#101828] leading-tight mt-0.5 truncate">
            {value}
          </span>
        </span>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-4 text-[#98a2b3]" />
      </button>
      {open ? (
        <div
          className={`absolute left-0 top-[calc(100%+4px)] z-40 min-w-[180px] ${R} border border-[#e4e7ec] bg-white py-1 shadow-lg`}
        >
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt)
                setOpen(false)
              }}
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


function VarKpiCard({ kpi, onClick }: { kpi: VarKpi; onClick?: () => void }) {
  const isBaseline = kpi.label === "Budget Revenue"
  const showSpark = Boolean(!kpi.showTrendIcon && kpi.spark && kpi.spark.length > 1)

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${R} border border-[#e4e7ec] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(16,24,40,0.03)] flex items-center justify-between gap-3 min-h-[92px] w-full text-left hover:border-[#b2ddff] transition-colors`}
    >
      <div className="min-w-0 flex flex-col justify-center">
        <p className="text-[13px] font-semibold text-[#344054] leading-tight">{kpi.label}</p>
        <p className="mt-1.5 text-[26px] font-semibold text-[#101828] tabular-nums leading-none tracking-tight">
          {kpi.value}
        </p>
        {isBaseline || !kpi.delta ? (
          <p className="mt-1.5 text-[12px] text-[#98a2b3]">—</p>
        ) : (
          <p className="mt-1.5 text-[12px] font-medium text-[#12b76a] leading-tight">{kpi.delta}</p>
        )}
      </div>
      <div className="shrink-0 flex items-center justify-end">
        {showSpark ? (
          <KpiSparkline values={kpi.spark!} color={kpi.sparkColor || "#3b82f6"} />
        ) : kpi.showTrendIcon ? (
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#ecfdf3] text-[#12b76a]">
            {kpi.trendArrow === "down" ? (
              <ArrowDown className="size-4" strokeWidth={2.5} />
            ) : (
              <ArrowUp className="size-4" strokeWidth={2.5} />
            )}
          </span>
        ) : null}
      </div>
    </button>
  )
}

function CommentaryDot({ tone }: { tone: "green" | "yellow" | "red" }) {
  const color =
    tone === "green" ? "#12b76a" : tone === "yellow" ? "#f79009" : "#f04438"
  return (
    <span
      className="inline-block size-2 rounded-full shrink-0"
      style={{ backgroundColor: color }}
      aria-hidden
    />
  )
}

function varianceTone(value: string): string {
  if (value.includes("(")) return "text-[#f04438]"
  if (value.startsWith("$") && !value.includes("(")) return "text-[#12b76a]"
  return "text-[#101828]"
}

function StatusBadge({ status }: { status: VarCommentaryReq["status"] }) {
  const styles =
    status === "Overdue"
      ? "bg-[#fef3f2] text-[#d92d20] border-[#fecdca]"
      : status === "Submitted"
        ? "bg-[#ecfdf3] text-[#079455] border-[#abefc6]"
        : "bg-[#eff8ff] text-[#1570ef] border-[#b2ddff]"
  return (
    <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium", styles)}>
      {status}
    </span>
  )
}

function VarianceDetailPanel({
  detail,
  onClose,
  canAddCommentary,
  onSaveComment,
  busy,
}: {
  detail: VarDetail | null
  onClose: () => void
  canAddCommentary?: boolean
  onSaveComment?: (body: string) => void
  busy?: boolean
}) {
  const [tab, setTab] = useState<"details" | "history">("details")
  const [comment, setComment] = useState("")

  useEffect(() => {
    setTab("details")
    setComment("")
  }, [detail?.id])

  if (!detail) return null

  return (
    <aside className="w-full xl:w-[300px] shrink-0 border-t xl:border-t-0 xl:border-l border-[#e4e7ec] bg-white flex flex-col min-h-[420px] xl:min-h-0">
      <div className="flex items-start justify-between gap-2 px-4 py-3 border-b border-[#e4e7ec] shrink-0">
        <div className="min-w-0">
          <h2 className="text-[14px] font-semibold text-[#101828]">Variance Detail</h2>
          <p className="text-[11px] text-[#667085] mt-0.5 truncate">
            {detail.dept} · {detail.area} · {detail.period}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-[#98a2b3] hover:text-[#667085] p-1"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="px-4 pt-3 pb-2 border-b border-[#f2f4f7]">
        <p
          className={cn(
            "text-[28px] font-semibold tabular-nums leading-none",
            detail.headlineTone === "down" ? "text-[#f04438]" : "text-[#12b76a]",
          )}
        >
          {detail.headline}
        </p>
        <p className="text-[12px] text-[#667085] mt-1">{detail.pctLabel}</p>
      </div>

      <div className="flex border-b border-[#e4e7ec] px-4">
        {(["details", "history"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "relative py-2.5 px-1 mr-4 text-[12px] font-medium capitalize",
              tab === t ? "text-[#1570ef]" : "text-[#667085] hover:text-[#344054]",
            )}
          >
            {t}
            {tab === t ? (
              <span className="absolute inset-x-0 bottom-0 h-[2px] bg-[#1570ef]" />
            ) : null}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-[12px]">
        {tab === "details" ? (
          <>
            <div>
              <p className="text-[11px] font-semibold text-[#344054] mb-1">Explanation</p>
              <p className="text-[#475467] leading-relaxed">{detail.explanation}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#344054] mb-1">Corrective Action</p>
              <p className="text-[#475467] leading-relaxed">{detail.correctiveAction}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#344054] mb-2">Supporting Details</p>
              <dl className="space-y-1.5">
                {detail.supporting.map((row) => (
                  <div key={row.label} className="flex justify-between gap-3">
                    <dt className="text-[#667085]">{row.label}</dt>
                    <dd className="font-medium text-[#101828] tabular-nums text-right">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className={`${R} border border-[#e4e7ec] p-3 space-y-2`}>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold text-white",
                    planningAvatarTone(detail.owner),
                  )}
                >
                  {planningInitials(detail.owner)}
                </span>
                <div>
                  <p className="font-medium text-[#101828]">{detail.owner}</p>
                  <p className="text-[11px] text-[#667085]">Due {detail.due}</p>
                </div>
                <StatusBadge status={detail.status} />
              </div>
            </div>
            {canAddCommentary ? (
              <div>
                <textarea
                  className={`w-full ${R} border border-[#d0d5dd] px-3 py-2 text-[12px] min-h-[72px]`}
                  placeholder="Add a comment…"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <button
                  type="button"
                  disabled={busy || !comment.trim()}
                  onClick={() => {
                    onSaveComment?.(comment.trim())
                    setComment("")
                  }}
                  className="mt-2 h-9 rounded-full bg-[#1570ef] px-4 text-[12px] font-medium text-white disabled:opacity-50"
                >
                  Add Comment
                </button>
              </div>
            ) : (
              <button type="button" className="text-[12px] font-medium text-[#1570ef] hover:underline">
                Add Comment
              </button>
            )}
          </>
        ) : (
          <p className="text-[#98a2b3] text-center py-8">No prior commentary history for this variance.</p>
        )}
      </div>
    </aside>
  )
}

export type VarianceAnalysisViewProps = {
  loading?: boolean
  busy?: boolean
  kpis?: VarKpi[]
  deptRows?: VarDeptRow[]
  commentaryReqs?: VarCommentaryReq[]
  trend?: typeof mockVarTrend
  breakdown?: typeof mockVarTornado
  selectedDetail?: VarDetail | null
  detailOpen?: boolean
  periodLabel?: string
  canAddCommentary?: boolean
  onResetFilters?: () => void
  onSelectDept?: (dept: string, period: string) => void
  onSelectCommentary?: (req: VarCommentaryReq, period: string) => void
  onCloseDetail?: () => void
  onSaveComment?: (body: string) => void
  onRefresh?: () => void
}

export function VarianceAnalysisView({
  loading = false,
  busy = false,
  kpis = mapMockKpis(),
  deptRows = mapMockDeptRows(),
  commentaryReqs = mapMockCommentary(),
  trend = mockVarTrend,
  breakdown = mockVarTornado,
  selectedDetail = DEMO_DETAILS["Product Development|Headcount"],
  detailOpen = true,
  periodLabel = "May 2025",
  canAddCommentary,
  onResetFilters,
  onSelectDept,
  onSelectCommentary,
  onCloseDetail,
  onSaveComment,
  onRefresh,
}: VarianceAnalysisViewProps) {
  const [entity, setEntity] = useState("All Entities (4)")
  const [department, setDepartment] = useState("All Departments")
  const [version, setVersion] = useState("Working")
  const [period, setPeriod] = useState(periodLabel)
  const [view, setView] = useState("Department View")
  const [commentaryOpen, setCommentaryOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState<string | null>(null)
  const [tableMenuOpen, setTableMenuOpen] = useState(false)
  const tableMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!tableMenuRef.current?.contains(e.target as Node)) setTableMenuOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [])

  useEffect(() => {
    if (department === "All Departments") return
    if (entity === "All Entities (4)") return
    if (DEPT_ENTITIES[department] !== entity) setDepartment("All Departments")
  }, [entity, department])

  const versionFactor = VERSION_SCALE[version] ?? 1

  const entityFilteredRows = useMemo(() => {
    let rows = deptRows.map((r) => scaleRow(r, versionFactor))
    if (entity !== "All Entities (4)") {
      rows = rows.filter(
        (r) =>
          r.isSummary ||
          r.dept === "Total Company" ||
          DEPT_ENTITIES[r.dept] === entity ||
          (view !== "Department View" && r.dept === entity),
      )
    }
    return rows
  }, [deptRows, entity, versionFactor, view])

  const filteredRows = useMemo(() => {
    let rows = entityFilteredRows
    if (department !== "All Departments") {
      rows = rows.filter(
        (r) =>
          r.isSummary ||
          r.dept === "Total Company" ||
          r.dept === department ||
          r.dept.startsWith(`${department} ·`),
      )
    }

    if (view === "Entity View") return aggregateEntityRows(rows)
    if (view === "Line Item View") return toLineItemRows(rows)
    return rows
  }, [entityFilteredRows, department, view])

  const filteredCommentary = useMemo(() => {
    return commentaryReqs.filter((req) => {
      if (department !== "All Departments" && req.dept !== department) return false
      if (entity !== "All Entities (4)" && DEPT_ENTITIES[req.dept] !== entity) return false
      return true
    })
  }, [commentaryReqs, department, entity])

  const filteredBreakdown = useMemo(() => {
    const allowed = new Set(
      filteredRows.filter((r) => !r.isSummary && r.dept !== "Total Company").map((r) => r.dept.split(" · ")[0]),
    )
    if (!allowed.size) return breakdown
    return breakdown.filter((b) => allowed.has(b.dept))
  }, [breakdown, filteredRows])

  const resetFilters = () => {
    setEntity("All Entities (4)")
    setDepartment("All Departments")
    setVersion("Working")
    setPeriod(periodLabel)
    setView("Department View")
    toast.message("Filters reset")
    onResetFilters?.()
  }

  const pickDept = (dept: string) => {
    if (dept === "Total Company") return
    const key =
      view === "Entity View"
        ? mockVarDeptRows.find((r) => DEPT_ENTITIES[r.dept] === dept)?.dept ?? dept
        : dept.split(" · ")[0]
    onSelectDept?.(key, period)
  }

  const pickBreakdownDept = (dept: string) => {
    pickDept(dept)
  }

  const infoCopy: Record<string, { title: string; body: string }> = {
    table:
      {
        title: "Actual vs Budget vs Forecast",
        body: "Compare actuals, budget, and forecast by department for the selected period. Click a row to open variance detail in the sidebar.",
      },
    commentary:
      {
        title: "Commentary Requests",
        body: "Budget owners must explain material variances. Status shows overdue, in progress, or submitted commentary.",
      },
  }

  return (
    <div className="min-h-full bg-[#f1f5f9] flex flex-col">
      <div className="bg-white border-b border-[#e4e7ec]">
        <div className="px-4 sm:px-5 pt-4 pb-3">
          <h1 className="text-[18px] font-semibold text-[#101828]">Variance Analysis</h1>
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <FilterSelect
              label="Entity"
              value={entity}
              options={["All Entities (4)", "North America", "EMEA", "APAC", "LATAM"]}
              onChange={setEntity}
            />
            <FilterSelect
              label="Department"
              value={department}
              options={[
                "All Departments",
                "Marketing",
                "Sales",
                "Product Development",
                "Customer Success",
                "IT",
                "Finance",
                "People & Culture",
                "Legal",
                "Operations",
                "R&D",
                "Shared Services",
              ]}
              onChange={setDepartment}
            />
            <FilterSelect
              label="Version"
              value={version}
              options={["Working", "Locked", "Published"]}
              onChange={setVersion}
            />
            <FilterSelect
              label="Period"
              value={period}
              options={["May 2025", "Apr 2025", "Mar 2025", "FY2025", "FY2026"]}
              onChange={setPeriod}
            />
            <FilterSelect
              label="View"
              value={view}
              options={["Department View", "Entity View", "Line Item View"]}
              onChange={setView}
            />
            <button
              type="button"
              onClick={resetFilters}
              className="ml-auto mb-0.5 px-1 text-[12px] font-semibold text-[#1570ef] hover:underline"
            >
              Reset Filters
            </button>
          </div>
        </div>

        <div className="px-4 sm:px-5 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            {kpis.map((k) => (
              <VarKpiCard
                key={k.label}
                kpi={k}
                onClick={() => toast.message(k.label, { description: `${k.value} · ${period} · ${version}` })}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row flex-1 min-h-0">
        <div className="flex-1 min-w-0 p-4 sm:p-5 space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 py-16 text-[#667085]">
              <Loader2 className="size-5 animate-spin" /> Loading variance…
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:items-stretch">
                <div className="lg:col-span-7 flex flex-col gap-4 min-w-0">
                  <section className={`${R} border border-[#e4e7ec] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden`}>
                    <div className="px-4 py-3 border-b border-[#e4e7ec] flex items-center justify-between gap-2">
                      <div className="inline-flex items-center gap-1.5 min-w-0">
                        <h2 className="text-[13px] font-semibold text-[#101828]">
                          Actual vs Budget vs Forecast
                        </h2>
                        <button
                          type="button"
                          onClick={() => setInfoOpen("table")}
                          className={`inline-flex h-5 w-5 items-center justify-center ${R} text-[#98a2b3] hover:text-[#667085] hover:bg-[#f9fafb]`}
                          aria-label="About this table"
                        >
                          <Info className="size-3.5" />
                        </button>
                      </div>
                      <div className="relative" ref={tableMenuRef}>
                        <button
                          type="button"
                          onClick={() => setTableMenuOpen((o) => !o)}
                          className={`inline-flex h-8 w-8 items-center justify-center ${R} text-[#667085] hover:bg-[#f9fafb]`}
                          aria-label="Table options"
                        >
                          <MoreHorizontal className="size-4" />
                        </button>
                        {tableMenuOpen ? (
                          <div className={`absolute right-0 top-full z-20 mt-1 w-44 ${R} border border-[#e4e7ec] bg-white py-1 shadow-lg`}>
                            <button
                              type="button"
                              className="w-full px-3 py-2 text-left text-[12px] hover:bg-[#f9fafb] text-[#344054]"
                              onClick={() => {
                                toast.success("Table exported to CSV")
                                setTableMenuOpen(false)
                              }}
                            >
                              Export CSV
                            </button>
                            <button
                              type="button"
                              className="w-full px-3 py-2 text-left text-[12px] hover:bg-[#f9fafb] text-[#344054]"
                              onClick={() => {
                                onRefresh?.()
                                setTableMenuOpen(false)
                              }}
                            >
                              Refresh data
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-[12px] min-w-[860px]">
                        <thead>
                          <tr className="border-b border-[#e4e7ec]">
                            <th className="text-left px-4 py-2 font-semibold text-[#344054]">Department</th>
                            <th className="px-3 py-2 text-right font-semibold text-[#344054]">Actual</th>
                            <th className="px-3 py-2 text-right font-semibold text-[#344054]">Budget</th>
                            <th className="px-3 py-2 text-right font-semibold text-[#344054]">Forecast</th>
                            <th className="px-3 py-2 text-right font-semibold text-[#344054] whitespace-nowrap">
                              Var to Budget
                            </th>
                            <th className="px-3 py-2 text-right font-semibold text-[#344054]">Var %</th>
                            <th className="px-3 py-2 text-right font-semibold text-[#344054] whitespace-nowrap">
                              Var to Forecast
                            </th>
                            <th className="px-4 py-2 text-right font-semibold text-[#344054]">Commentary</th>
                          </tr>
                          <tr className="border-b border-[#e4e7ec]">
                            <th className="px-4 py-1" />
                            <th className="px-3 py-1 text-right text-[10px] font-normal text-[#98a2b3]">{period}</th>
                            <th className="px-3 py-1 text-right text-[10px] font-normal text-[#98a2b3]">{period}</th>
                            <th className="px-3 py-1 text-right text-[10px] font-normal text-[#98a2b3]">{period}</th>
                            <th className="px-3 py-1 text-right text-[10px] font-normal text-[#98a2b3]">$</th>
                            <th className="px-3 py-1 text-right text-[10px] font-normal text-[#98a2b3]">%</th>
                            <th className="px-3 py-1 text-right text-[10px] font-normal text-[#98a2b3]">$</th>
                            <th className="px-4 py-1" />
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRows.map((row) => {
                            const summary = row.isSummary || row.dept === "Total Company"
                            return (
                              <tr
                                key={row.dept}
                                onClick={() => pickDept(row.dept)}
                                className="border-b border-[#f2f4f7] cursor-pointer hover:bg-[#fcfcfd] last:border-b-0"
                              >
                                <td
                                  className={cn(
                                    "px-4 py-2.5",
                                    summary
                                      ? "font-semibold text-[#101828]"
                                      : "font-medium text-[#1570ef]",
                                  )}
                                >
                                  {row.dept}
                                </td>
                                <td
                                  className={cn(
                                    "px-3 py-2.5 text-right tabular-nums text-[#101828]",
                                    summary && "font-semibold",
                                  )}
                                >
                                  {fmtMoneyM(row.actual, summary)}
                                </td>
                                <td
                                  className={cn(
                                    "px-3 py-2.5 text-right tabular-nums text-[#101828]",
                                    summary && "font-semibold",
                                  )}
                                >
                                  {fmtMoneyM(row.budget, summary)}
                                </td>
                                <td
                                  className={cn(
                                    "px-3 py-2.5 text-right tabular-nums text-[#101828]",
                                    summary && "font-semibold",
                                  )}
                                >
                                  {fmtMoneyM(row.forecast, summary)}
                                </td>
                                <td
                                  className={cn(
                                    "px-3 py-2.5 text-right tabular-nums font-medium",
                                    varTone(row.varB),
                                    summary && "font-semibold",
                                  )}
                                >
                                  {fmtMoneyM(row.varB, summary)}
                                </td>
                                <td
                                  className={cn(
                                    "px-3 py-2.5 text-right tabular-nums font-medium",
                                    varTone(row.varBp),
                                    summary && "font-semibold",
                                  )}
                                >
                                  {fmtPct(row.varBp)}
                                </td>
                                <td
                                  className={cn(
                                    "px-3 py-2.5 text-right tabular-nums font-medium",
                                    varTone(row.varF),
                                    summary && "font-semibold",
                                  )}
                                >
                                  {fmtMoneyM(row.varF, summary)}
                                </td>
                                <td className="px-4 py-2.5">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <CommentaryDot tone={row.commentary} />
                                    {row.commentaryDone != null && row.commentaryTotal != null ? (
                                      <span className="text-[11px] text-[#667085] tabular-nums">
                                        {row.commentaryDone}/{row.commentaryTotal}
                                      </span>
                                    ) : null}
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <section className={`${R} border border-[#e4e7ec] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden`}>
                    <div className="px-4 py-3 border-b border-[#e4e7ec] flex items-center gap-1.5">
                      <h2 className="text-[13px] font-semibold text-[#101828]">Commentary Requests</h2>
                      <button
                        type="button"
                        onClick={() => setInfoOpen("commentary")}
                        className={`inline-flex h-5 w-5 items-center justify-center ${R} text-[#98a2b3] hover:text-[#667085] hover:bg-[#f9fafb]`}
                        aria-label="About commentary requests"
                      >
                        <Info className="size-3.5" />
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-[12px] min-w-[700px]">
                        <thead>
                          <tr className="border-b border-[#e4e7ec]">
                            <th className="text-left px-4 py-2 font-semibold text-[#344054]">Department</th>
                            <th className="text-left px-3 py-2 font-semibold text-[#344054]">Variance Area</th>
                            <th className="text-left px-3 py-2 font-semibold text-[#344054]">Owner</th>
                            <th className="px-3 py-2 text-right font-semibold text-[#344054]">Variance $</th>
                            <th className="px-3 py-2 text-right font-semibold text-[#344054]">Due Date</th>
                            <th className="px-4 py-2 text-right font-semibold text-[#344054]">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCommentary.length ? (
                            filteredCommentary.map((req) => (
                            <tr
                              key={req.id}
                              onClick={() => onSelectCommentary?.(req, period)}
                              className="border-b border-[#f2f4f7] cursor-pointer hover:bg-[#fcfcfd] last:border-b-0"
                            >
                              <td className="px-4 py-2.5 font-medium text-[#101828]">{req.dept}</td>
                              <td className="px-3 py-2.5 text-[#475467]">{req.area}</td>
                              <td className="px-3 py-2.5">
                                <div className="inline-flex items-center gap-2">
                                  <span
                                    className={cn(
                                      "inline-flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold text-white shrink-0",
                                      planningAvatarTone(req.owner),
                                    )}
                                  >
                                    {planningInitials(req.owner)}
                                  </span>
                                  <span className="font-medium text-[#344054]">{req.owner}</span>
                                </div>
                              </td>
                              <td
                                className={cn(
                                  "px-3 py-2.5 text-right tabular-nums font-medium",
                                  varianceTone(req.variance),
                                )}
                              >
                                {req.variance}
                              </td>
                              <td className="px-3 py-2.5 text-right text-[#667085]">{req.due}</td>
                              <td className="px-4 py-2.5 text-right">
                                <StatusBadge status={req.status} />
                              </td>
                            </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="px-4 py-8 text-center text-[12px] text-[#98a2b3]">
                                No commentary requests match the current filters.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div className="px-4 py-3 border-t border-[#f2f4f7]">
                      <button
                        type="button"
                        onClick={() => setCommentaryOpen(true)}
                        className="text-[12px] font-medium text-[#1570ef] hover:underline"
                      >
                        View all commentary requests
                      </button>
                    </div>
                  </section>
                </div>

                <div className="lg:col-span-5 flex flex-col gap-4 min-w-0 min-h-full">
                  <section className={`${R} border border-[#e4e7ec] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] flex-1 flex flex-col min-h-0`}>
                    <h2 className="text-[13px] font-semibold text-[#101828] shrink-0">Variance Trend (Total Company)</h2>
                    <p className="text-[11px] text-[#667085] mb-3 shrink-0">{period} · {version}</p>
                    <div className="flex-1 min-h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f2f4f7" vertical={false} />
                          <XAxis
                            dataKey="m"
                            tick={{ fontSize: 10, fill: "#667085" }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 10, fill: "#667085" }}
                            axisLine={false}
                            tickLine={false}
                            width={28}
                          />
                          <Tooltip
                            contentStyle={{
                              fontSize: 12,
                              borderRadius: 8,
                              border: "1px solid #e4e7ec",
                            }}
                          />
                          <Bar dataKey="budget" fill="#93c5fd" radius={[3, 3, 0, 0]} barSize={14} name="Var to Budget" />
                          <Line
                            type="monotone"
                            dataKey="forecast"
                            stroke="#12b76a"
                            strokeWidth={2}
                            dot={{ r: 3, fill: "#12b76a", strokeWidth: 0 }}
                            name="Var to Forecast"
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-[#667085] shrink-0">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`size-2.5 ${R} bg-[#93c5fd]`} /> Var to Budget ($M)
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="size-2.5 rounded-full bg-[#12b76a]" /> Var to Forecast ($M)
                      </span>
                    </div>
                  </section>

                  <section className={`${R} border border-[#e4e7ec] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] flex-1 flex flex-col min-h-0`}>
                    <h2 className="text-[13px] font-semibold text-[#101828] shrink-0">Variance Breakdown by Department</h2>
                    <p className="text-[11px] text-[#667085] mb-3 shrink-0">Var to Budget ($M) · click a bar</p>
                    <div className="flex-1 min-h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                          layout="vertical"
                          data={filteredBreakdown}
                          margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
                          onClick={(state) => {
                            const dept = (state?.activeLabel as string) || ""
                            if (dept) pickBreakdownDept(dept)
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f2f4f7" horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 10, fill: "#667085" }} axisLine={false} tickLine={false} />
                          <YAxis
                            type="category"
                            dataKey="dept"
                            tick={{ fontSize: 10, fill: "#344054" }}
                            width={108}
                            axisLine={false}
                            tickLine={false}
                          />
                          <ReferenceLine x={0} stroke="#d0d5dd" />
                          <Tooltip
                            contentStyle={{
                              fontSize: 12,
                              borderRadius: 8,
                              border: "1px solid #e4e7ec",
                            }}
                          />
                          <Bar dataKey="value" radius={[0, 3, 3, 0]} barSize={16} className="cursor-pointer">
                            {filteredBreakdown.map((entry, i) => (
                              <Cell key={i} fill={entry.value >= 0 ? "#12b76a" : "#f04438"} />
                            ))}
                          </Bar>
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                </div>
              </div>
            </>
          )}
        </div>

        {detailOpen && selectedDetail ? (
          <VarianceDetailPanel
            detail={selectedDetail}
            onClose={() => onCloseDetail?.()}
            canAddCommentary={canAddCommentary}
            onSaveComment={onSaveComment}
            busy={busy}
          />
        ) : null}
      </div>

      <InfoDialog
        open={infoOpen !== null}
        onOpenChange={(v) => !v && setInfoOpen(null)}
        title={infoOpen ? infoCopy[infoOpen]?.title ?? "" : ""}
        body={infoOpen ? infoCopy[infoOpen]?.body ?? "" : ""}
      />

      <CommentaryAllDialog
        open={commentaryOpen}
        onOpenChange={setCommentaryOpen}
        requests={commentaryReqs}
        onSelect={(req) => onSelectCommentary?.(req, period)}
        buildDetail={(req) => detailForCommentary(req, period)}
      />
    </div>
  )
}

export function detailForCommentary(req: VarCommentaryReq, period = "May 2025"): VarDetail {
  const key = `${req.dept}|${req.area}`
  if (DEMO_DETAILS[key]) return DEMO_DETAILS[key]
  const neg = req.variance.includes("(")
  return {
    id: req.id,
    dept: req.dept,
    area: req.area,
    period,
    headline: req.variance,
    headlineTone: neg ? "down" : "up",
    pctLabel: neg ? "Unfavourable vs Budget" : "Favourable vs Budget",
    explanation: `Variance in ${req.area.toLowerCase()} requires budget owner commentary for ${period}.`,
    correctiveAction: "Owner to provide updated forecast and remediation plan in the commentary workflow.",
    supporting: [
      { label: "Variance $", value: req.variance },
      { label: "Due", value: req.due },
      { label: "Status", value: req.status },
    ],
    owner: req.owner,
    due: req.due,
    status: req.status,
  }
}

export function detailForDept(dept: string, period = "May 2025"): VarDetail | null {
  if (dept === "Product Development") return DEMO_DETAILS["Product Development|Headcount"]
  const row = mockVarDeptRows.find((r) => r.dept === dept)
  if (!row) return null
  const summary = row.dept === "Total Company"
  return {
    id: `dept-${dept}`,
    dept,
    area: "Revenue",
    period,
    headline: fmtMoneyM(row.varB, summary),
    headlineTone: row.varB >= 0 ? "up" : "down",
    pctLabel: `${fmtPct(row.varBp)} vs Budget`,
    explanation: `${dept} variance for ${period} is driven by actual performance vs budget baseline.`,
    correctiveAction: "Review with department owner during the monthly variance close.",
    supporting: [
      { label: "Actual", value: fmtMoneyM(row.actual, summary) },
      { label: "Budget", value: fmtMoneyM(row.budget, summary) },
      { label: "Forecast", value: fmtMoneyM(row.forecast, summary) },
      { label: "Var to Budget $", value: fmtMoneyM(row.varB, summary) },
      { label: "Var %", value: fmtPct(row.varBp) },
      { label: "Var to Forecast $", value: fmtMoneyM(row.varF, summary) },
    ],
    owner: "Budget Owner",
    due: "—",
    status: row.commentary === "red" ? "Overdue" : row.commentary === "yellow" ? "In Progress" : "Submitted",
  }
}
