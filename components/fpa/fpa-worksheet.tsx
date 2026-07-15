"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  Loader2,
  Upload,
  Download,
  Copy,
  LayoutGrid,
  TrendingUp,
  Send,
  MessageSquare,
  Info,
  Maximize2,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  MoreVertical,
  AlertCircle,
  Lock,
  Calculator,
  Pencil,
  Import,
  Columns2,
  Percent,
} from "lucide-react"
import { toast } from "sonner"
import { FpaPageHeader } from "./fpa-page-header"
import { FpaExportDownloadModal } from "@/components/fpa/fpa-export-download-modal"
import { boardPackPayloadToCsv, extractFpaExportId } from "@/lib/fpa/download-export"
import {
  asNumber,
  fpaApi,
  formatMoney,
  type FpaBudgetCycle,
  type FpaCell,
  type FpaCellComment,
  type FpaDriver,
  type FpaGridPeriod,
  type FpaGridValidation,
  type FpaLineItem,
  type FpaModel,
  type FpaPlanningSummary,
} from "@/lib/api/fpa-api"
import { usersApi, type AppUser } from "@/lib/api/users-api"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import {
  bootstrapFpaSelection,
  fetchFpaDashboard,
  setSelectedScenarioId,
  setSelectedVersionId,
} from "@/lib/store/slices/fpaSlice"
import { errorMessage, logFpaGap } from "@/lib/fpa/fpa-api-gaps"
import { humanizeDeptIdsInText } from "@/lib/fpa/humanize-dept-message"
import { useFpaPermissions } from "@/lib/hooks/useFpaPermissions"
import { departmentApiService } from "@/lib/api/department-api"
import {
  formatCashRunway,
  PlanningWorkspaceChrome,
  PlanningWorkspaceInsights,
  PlanningWorkspaceKpiStrip,
  type PlanningCycleOption,
  type PlanningDriverRow,
  type PlanningKpi,
  type PlanningTrendPoint,
  type PlanningWorkflowStep,
  type PlanningWorkspaceView,
} from "@/components/fpa/planning/planning-workspace-chrome"
import {
  PlanningCollabSidebar,
  PlanningTasksCard,
  planningAvatarTone,
  planningInitials,
  type PlanningActivity,
  type PlanningApproval,
  type PlanningComment,
  type PlanningTask,
} from "@/components/fpa/planning/planning-collab-sidebar"
import { PlanningScenarioCompareView } from "@/components/fpa/planning/planning-scenario-compare-view"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type DisplayMode = "monthly" | "quarterly"
type ViewMode = "amounts" | "thousands" | "pct_change"
type PeriodCol = { key: string; iso: string; label: string; band: "ACTUAL" | "FORECAST" }
type AggCol = { key: string; label: string; periodKeys: string[] }

/** Shared ~8px radius across the planning worksheet (matches workspace chrome). */
const R = "rounded-lg"
const CARD = `${R} border border-[#e4e7ec] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.05)]`
const TOOL_BTN =
  `h-8 inline-flex items-center gap-1.5 ${R} border border-[#d0d5dd] bg-white px-2.5 text-xs text-[#475569] hover:bg-[#f9fafb] disabled:opacity-50`
const TOOL_BTN_PRIMARY =
  `h-8 inline-flex items-center gap-1.5 ${R} bg-[#1570ef] px-4 text-xs font-medium text-white hover:bg-[#175cd3] disabled:opacity-50`
const GRID_TOOL =
  `h-8 inline-flex items-center justify-center gap-1.5 ${R} border border-[#d0d5dd] bg-white px-2.5 text-[12px] font-medium text-[#344054] hover:bg-[#f9fafb] disabled:opacity-50`
const SELECT_TRIGGER =
  `h-8 w-[9.5rem] ${R} border border-[#d0d5dd] bg-white text-xs shadow-none`

function mapCycleWorkflow(cycle: FpaBudgetCycle | null): PlanningWorkflowStep[] {
  if (!cycle) return []
  const status = String(cycle.status || "").toUpperCase()
  const stage = String(cycle.currentStage || "").toUpperCase()
  let active = 0
  if (
    status === "APPROVED" ||
    status === "LOCKED" ||
    stage === "LOCK" ||
    stage === "REPORTS"
  ) {
    active = 3
  } else if (
    status === "PENDING_FPA_REVIEW" ||
    status === "PENDING_CFO_REVIEW" ||
    status === "RETURNED_FOR_CORRECTION" ||
    stage === "FPA_REVIEW" ||
    stage === "CFO_REVIEW" ||
    stage === "VALIDATE"
  ) {
    active = 2
  } else if (status === "PENDING_VALIDATION" || stage === "OWNER_INPUT") {
    active = 1
  } else {
    active = 0
  }
  const labels = ["Draft", "Submitted", "Under Review", "Approved"] as const
  return labels.map((label, i) => ({
    id: `wf-${i}`,
    label,
    status: i < active ? "done" : i === active ? "active" : "pending",
    actor: cycle.name || "Planning cycle",
    when: status.replace(/_/g, " "),
  }))
}

function formatRelativeWhen(iso?: string | null): string {
  if (!iso) return ""
  const t = new Date(iso).getTime()
  if (!Number.isFinite(t)) return ""
  const diff = Date.now() - t
  const mins = Math.round(diff / 60000)
  if (mins < 60) return `${Math.max(1, mins)}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 48) return `${hrs}h ago`
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  })
}

function monthKey(iso: string) {
  const d = new Date(iso)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`
}

function monthLabel(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" })
}

function formatCell(value: number): string {
  const abs = Math.abs(value)
  const formatted = abs.toLocaleString("en-US", { maximumFractionDigits: 0 })
  return value < 0 ? `(${formatted})` : formatted
}

function formatViewValue(value: number, mode: ViewMode, prior?: number): string {
  if (mode === "thousands") {
    const v = value / 1000
    const abs = Math.abs(v)
    const formatted = abs.toLocaleString("en-US", {
      maximumFractionDigits: abs >= 100 ? 0 : 1,
    })
    return value < 0 ? `(${formatted})` : formatted
  }
  if (mode === "pct_change") {
    if (prior == null || prior === 0) return "—"
    const pct = ((value - prior) / Math.abs(prior)) * 100
    const abs = Math.abs(pct)
    const formatted = abs.toLocaleString("en-US", { maximumFractionDigits: 1 })
    return `${pct < 0 ? "−" : "+"}${formatted}%`
  }
  return formatCell(value)
}

function parseCellInput(raw: string): number | null {
  const cleaned = raw.replace(/[(),\s]/g, (m) => (m === "(" || m === ")" ? "" : ""))
  if (cleaned === "" || cleaned === "-") return null
  const value = Number(cleaned)
  return Number.isFinite(value) ? value : null
}

function userLabel(u?: AppUser | null) {
  if (!u) return null
  return [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email || u.id
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return "?"
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("")
}

function unitSubtitle(row: FpaLineItem): string {
  if (row.format) return String(row.format)
  const dt = String(row.dataType || "").toUpperCase()
  if (dt.includes("PERCENT") || dt === "PCT") return "% of Revenue"
  if (dt.includes("COUNT") || dt.includes("HEAD") || /headcount/i.test(row.code + row.name)) {
    return "# of FTEs"
  }
  if (row.category === "REVENUE" || row.lineItemType === "INPUT") return "$ in thousands"
  return "$ in thousands"
}

function formatWhen(iso?: string | null) {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}

function historyEntry(h: unknown, usersById: Map<string, AppUser>) {
  const row = (h || {}) as Record<string, unknown>
  const value = asNumber(row.value ?? row.newValue ?? row.toValue)
  const at = String(row.createdAt || row.updatedAt || row.at || "")
  const userId = String(row.userId || row.changedById || row.lastUpdatedById || "")
  const name =
    String(row.userName || row.authorName || "") ||
    userLabel(usersById.get(userId)) ||
    (userId ? userId.slice(0, 8) : "User")
  return { at, name, value, raw: row }
}

function quarterKey(iso: string) {
  const d = new Date(iso)
  const y = d.getUTCFullYear()
  const q = Math.floor(d.getUTCMonth() / 3) + 1
  return { key: `${y}-Q${q}`, label: `Q${q} FY${y}`, year: y, q }
}

type CellState =
  | "ACTUAL"
  | "INPUT"
  | "CALCULATED"
  | "IMPORTED"
  | "LOCKED"
  | "OVERRIDE"
  | "ERROR"
  | "PENDING_CALCULATION"

function cellState(cell?: FpaCell | null): CellState {
  if (!cell) return "INPUT"
  const api = String(cell.cellStatus || "").toUpperCase()
  if (
    api === "ACTUAL" ||
    api === "INPUT" ||
    api === "CALCULATED" ||
    api === "IMPORTED" ||
    api === "LOCKED" ||
    api === "OVERRIDE" ||
    api === "ERROR" ||
    api === "PENDING_CALCULATION"
  ) {
    return api as CellState
  }
  if (cell.isLocked) return "LOCKED"
  const src = String(cell.sourceType || "").toUpperCase()
  if (src === "ACTUAL") return "ACTUAL"
  if (src.includes("IMPORT") || src === "SYNC") return "IMPORTED"
  if (src.includes("OVERRIDE")) return "OVERRIDE"
  if (cell.formulaId) return "CALCULATED"
  if (cell.isEditable === false) return "LOCKED"
  return "INPUT"
}

function cellStateMeta(state: CellState) {
  switch (state) {
    case "ACTUAL":
      return { label: "Actual", Icon: Lock, hint: "Closed actual — read-only" }
    case "CALCULATED":
      return { label: "Calculated", Icon: Calculator, hint: "Formula-driven — not directly editable" }
    case "IMPORTED":
      return { label: "Imported", Icon: Import, hint: "Imported from source system" }
    case "LOCKED":
      return { label: "Locked", Icon: Lock, hint: "Locked — writes rejected" }
    case "OVERRIDE":
      return { label: "Override", Icon: Pencil, hint: "Manual override" }
    case "ERROR":
      return { label: "Error", Icon: AlertCircle, hint: "Validation error" }
    case "PENDING_CALCULATION":
      return { label: "Pending calc", Icon: Loader2, hint: "Awaiting recalculation" }
    default:
      return { label: "Input", Icon: Pencil, hint: "Editable input" }
  }
}

export function FpaWorksheet({ modelId }: { modelId: string }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const dispatch = useAppDispatch()
  const budgetCycleId = searchParams.get("cycleId")
  const budgetTaskId = searchParams.get("taskId")
  const budgetDepartmentId = searchParams.get("departmentId")
  const budgetCycleName = searchParams.get("cycleName")
  const budgetDepartmentName = searchParams.get("departmentName")
  const budgetDueDate = searchParams.get("dueDate")
  const queryVersionId = searchParams.get("versionId")
  const queryScenarioId = searchParams.get("scenarioId")
  const workspaceView: PlanningWorkspaceView =
    searchParams.get("view") === "compare" ? "compare" : "planning"
  const inBudgetContext = Boolean(budgetCycleId)
  const { selectedScenarioId, selectedVersionId, tasks, dashboard, models, versions, scenarios } =
    useAppSelector((s) => s.fpa)
  const { canEditGrid, canSubmitTask, canExportBoardPack } = useFpaPermissions()
  const [planningDrivers, setPlanningDrivers] = useState<FpaDriver[]>([])
  const [planningCycles, setPlanningCycles] = useState<PlanningCycleOption[]>([])
  const [activeCycleDetail, setActiveCycleDetail] = useState<FpaBudgetCycle | null>(null)
  const [collabComments, setCollabComments] = useState<PlanningComment[]>([])
  const [collabTasks, setCollabTasks] = useState<PlanningTask[]>([])
  const [collabActivity, setCollabActivity] = useState<PlanningActivity[]>([])
  const [collabReloadKey, setCollabReloadKey] = useState(0)
  const [compareScenarioIds, setCompareScenarioIds] = useState<string[]>([])
  const [compareKpis, setCompareKpis] = useState<PlanningKpi[]>([])
  const [planningSummary, setPlanningSummary] = useState<FpaPlanningSummary | null>(null)

  const [loading, setLoading] = useState(true)
  const [model, setModel] = useState<FpaModel | null>(null)
  const [users, setUsers] = useState<AppUser[]>([])
  const [lineItems, setLineItems] = useState<FpaLineItem[]>([])
  const [cells, setCells] = useState<FpaCell[]>([])
  const [selected, setSelected] = useState<FpaCell | null>(null)
  const [history, setHistory] = useState<unknown[]>([])
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [editingCellId, setEditingCellId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState("")
  const [displayMode, setDisplayMode] = useState<DisplayMode>("monthly")
  const [viewMode, setViewMode] = useState<ViewMode>("amounts")
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [modelDetailsOpen, setModelDetailsOpen] = useState(false)
  const [validationErrors, setValidationErrors] = useState<FpaGridValidation[]>([])
  const [deptById, setDeptById] = useState<Map<string, string>>(new Map())
  const [focusLineId, setFocusLineId] = useState<string | null>(null)
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set())
  const [gridPeriods, setGridPeriods] = useState<FpaGridPeriod[]>([])
  const [actualCutoff, setActualCutoff] = useState<string | null>(null)
  const [gridOwnerName, setGridOwnerName] = useState<string | null>(null)
  const [gridOwnerAvatar, setGridOwnerAvatar] = useState<string | null>(null)
  const [boundTaskId, setBoundTaskId] = useState<string | null>(null)
  const [cellComments, setCellComments] = useState<FpaCellComment[]>([])
  const [commentDraft, setCommentDraft] = useState("")
  const [changeNotesDraft, setChangeNotesDraft] = useState("")
  const [commentOpen, setCommentOpen] = useState(false)
  const [growthOpen, setGrowthOpen] = useState(false)
  const [growthRate, setGrowthRate] = useState("5")
  const [bulkOpen, setBulkOpen] = useState(false)
  const [columnsMenuOpen, setColumnsMenuOpen] = useState(false)
  const [gridMoreOpen, setGridMoreOpen] = useState(false)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [exportTarget, setExportTarget] = useState<{
    url?: string | null
    exportId?: string | null
  } | null>(null)
  const [cellDetail, setCellDetail] = useState<{
    formula?: string | null
    drivers?: Array<{ id?: string; name?: string; value?: number | string; unit?: string }>
    cellStatus?: string
  } | null>(null)
  const [traceOpen, setTraceOpen] = useState(false)
  const [cellTrace, setCellTrace] = useState<{
    root?: { cellId?: string; expression?: string; value?: number | string }
    nodes?: Array<{
      id?: string
      label?: string
      kind?: string
      value?: number | string
      expression?: string
    }>
  } | null>(null)
  const [assignedDepartmentIds, setAssignedDepartmentIds] = useState<string[]>([])
  const [ownerUnmet, setOwnerUnmet] = useState<string[]>([])
  const [ownerCanSubmit, setOwnerCanSubmit] = useState<boolean | null>(null)
  const editInputRef = useRef<HTMLInputElement>(null)
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map())

  const resolveDeptMessage = useCallback(
    (message: string) => {
      const map = new Map(deptById)
      if (budgetDepartmentId && budgetDepartmentName) {
        map.set(budgetDepartmentId, budgetDepartmentName)
      }
      return humanizeDeptIdsInText(message, map)
    },
    [deptById, budgetDepartmentId, budgetDepartmentName],
  )

  const modelFromStore = models.find((m) => m.id === modelId)
  const version = versions.find((v) => v.id === selectedVersionId)
  const normalizeCurrency = (raw?: string | null) => {
    const c = String(raw || "USD").trim().toUpperCase()
    if (c === "US") return "USD"
    if (c === "EU") return "EUR"
    if (c === "GB" || c === "UK") return "GBP"
    return c || "USD"
  }
  const displayName = model?.name || modelFromStore?.name || "Model"
  const currency = normalizeCurrency(model?.baseCurrency || modelFromStore?.baseCurrency)
  const statusLabel = version?.status || model?.status || "—"

  const usersById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users])
  const owner = model?.ownerUserId ? usersById.get(model.ownerUserId) : null
  const ownerName =
    gridOwnerName ||
    model?.ownerName ||
    modelFromStore?.ownerName ||
    userLabel(owner) ||
    (model?.ownerUserId ? "Owner" : "—")
  const ownerAvatarUrl =
    gridOwnerAvatar || model?.ownerAvatarUrl || modelFromStore?.ownerAvatarUrl || null

  const lastUpdated = useMemo(() => {
    const times = cells
      .map((c) => c.lastUpdatedAt)
      .filter(Boolean)
      .map((t) => new Date(String(t)).getTime())
      .filter((n) => Number.isFinite(n))
    if (times.length) return new Date(Math.max(...times)).toISOString()
    return model?.updatedAt || null
  }, [cells, model?.updatedAt])

  const submitTaskId = useMemo(() => {
    if (!inBudgetContext) return null
    if (budgetTaskId) return budgetTaskId
    if (boundTaskId) return boundTaskId
    const pool = [...(dashboard?.openTasks || []), ...tasks]
    const open = pool.find((t) => {
      const st = String(t.status).toUpperCase()
      const modelOk = !t.modelId || t.modelId === modelId
      const versionOk = !t.versionId || !selectedVersionId || t.versionId === selectedVersionId
      return (
        modelOk &&
        versionOk &&
        (st === "PENDING" || st === "IN_PROGRESS" || st === "OPEN" || st === "RETURNED")
      )
    })
    return open?.id || null
  }, [
    inBudgetContext,
    budgetTaskId,
    boundTaskId,
    dashboard?.openTasks,
    tasks,
    modelId,
    selectedVersionId,
  ])

  const planningKpis = useMemo((): PlanningKpi[] => {
    if (planningSummary?.kpis?.length) {
      return planningSummary.kpis.map((k) => ({
        label: k.label,
        value: k.displayValue || (k.unit === "PERCENT"
          ? `${asNumber(k.value).toFixed(1)}%`
          : k.unit === "MONTHS"
            ? formatCashRunway(asNumber(k.value))
            : formatMoney(k.value) || "—"),
        delta:
          k.deltaPct != null
            ? `${k.up === false ? "▼" : "▲"} ${Math.abs(asNumber(k.deltaPct)).toFixed(1)}%${k.deltaLabel ? ` ${k.deltaLabel}` : ""}`
            : undefined,
        deltaTone: k.up === false ? "down" : k.up ? "up" : "neutral",
        spark: k.sparkline,
        sparkColor: "#2563eb",
      }))
    }
    const k = dashboard?.kpis as
      | {
          revenue?: number
          ebitda?: number
          runwayMonths?: number
          opex?: number
          varianceToPlan?: number
          sparklines?: {
            revenue?: number[]
            ebitda?: number[]
            runwayMonths?: number[]
            closingCash?: number[]
          }
        }
      | undefined
    if (!k) {
      return [
        { label: "Revenue", value: "—" },
        { label: "Opex", value: "—" },
        { label: "EBITDA", value: "—" },
        { label: "Cash Runway", value: "—" },
        { label: "Variance to Plan", value: "—" },
      ]
    }
    const runway = asNumber(k.runwayMonths)
    const opex =
      k.opex != null
        ? k.opex
        : Math.max(0, asNumber(k.revenue) - asNumber(k.ebitda))
    return [
      {
        label: "Revenue",
        value: formatMoney(k.revenue) || "—",
        spark: k.sparklines?.revenue,
        sparkColor: "#2563eb",
      },
      {
        label: "Opex",
        value: formatMoney(opex) || "—",
        spark: k.sparklines?.closingCash,
        sparkColor: "#7c3aed",
      },
      {
        label: "EBITDA",
        value: formatMoney(k.ebitda) || "—",
        spark: k.sparklines?.ebitda,
        sparkColor: "#0d9488",
      },
      {
        label: "Cash Runway",
        value: formatCashRunway(runway),
        spark: k.sparklines?.runwayMonths,
        sparkColor: "#2563eb",
      },
      {
        label: "Variance to Plan",
        value: k.varianceToPlan != null ? formatMoney(k.varianceToPlan) : "—",
        sparkColor: "#16a34a",
      },
    ]
  }, [planningSummary, dashboard?.kpis])

  const driverRows = useMemo((): PlanningDriverRow[] => {
    return planningDrivers.map((d) => ({
      id: d.id,
      name: d.name || d.code,
      value: d.value,
      unit: d.unit,
      prior: null,
    }))
  }, [planningDrivers])

  const trendPoints = useMemo((): PlanningTrendPoint[] => {
    if (planningSummary?.trend?.length) {
      return planningSummary.trend.map((t) => ({
        label: t.label || t.period,
        revenueActual: t.actual ?? undefined,
        revenuePlan: t.plan ?? undefined,
      }))
    }
    if (!lineItems.length || !cells.length || !gridPeriods.length) return []
    const findLi = (re: RegExp) =>
      lineItems.find((li) => re.test(li.name) || re.test(li.code || ""))
    const rev = findLi(/^revenue$/i) || findLi(/total\s*revenue/i) || findLi(/revenue/i)
    const opex =
      findLi(/operating\s*expense/i) || findLi(/\bopex\b/i) || findLi(/op\s*ex/i)
    if (!rev && !opex) return []
    const byKey = new Map<string, FpaCell>()
    for (const c of cells) {
      const pk = c.periodDate ? monthKey(c.periodDate) : ""
      if (!pk || !c.lineItemId) continue
      byKey.set(`${c.lineItemId}|${pk}`, c)
    }

    let cutoffKey = actualCutoff ? monthKey(actualCutoff) : ""
    if (!cutoffKey) {
      for (const p of gridPeriods) {
        const key = p.key || (p.periodDate ? monthKey(p.periodDate) : "")
        if (!key) continue
        if (String(p.periodRole || "").toUpperCase() === "ACTUAL" && key > cutoffKey) {
          cutoffKey = key
        }
      }
    }
    if (!cutoffKey) {
      for (const c of cells) {
        if (String(c.sourceType || "").toUpperCase() === "ACTUAL") {
          const k = monthKey(c.periodDate)
          if (k > cutoffKey) cutoffKey = k
        }
      }
    }

    return gridPeriods.slice(0, 12).map((p) => {
      const iso = p.periodDate || ""
      const key = p.key || (iso ? monthKey(iso) : "")
      const label =
        p.label ||
        (iso
          ? new Date(iso).toLocaleDateString("en-US", {
              month: "short",
              timeZone: "UTC",
            })
          : key)
      const band = String(p.periodRole || "").toUpperCase()
      const isActual =
        band === "ACTUAL" || (cutoffKey ? key <= cutoffKey : false)
      const revCell = rev ? byKey.get(`${rev.id}|${key}`) : undefined
      const opexCell = opex ? byKey.get(`${opex.id}|${key}`) : undefined
      const revVal = revCell != null ? asNumber(revCell.value) : undefined
      const opexVal = opexCell != null ? asNumber(opexCell.value) : undefined
      const scale = (n: number | undefined) =>
        n != null && Number.isFinite(n) ? n / 1_000_000 : undefined
      const revScaled = scale(revVal)
      const opexScaled = scale(opexVal)
      return {
        label,
        revenueActual: isActual ? revScaled : undefined,
        revenuePlan: revScaled,
        opexActual: isActual ? opexScaled : undefined,
        opexPlan: opexScaled,
      }
    })
  }, [planningSummary, lineItems, cells, gridPeriods, actualCutoff])

  const workflowSteps = useMemo((): PlanningWorkflowStep[] => {
    if (planningSummary?.workflowSteps?.length) {
      return planningSummary.workflowSteps.map((s) => {
        const st = String(s.status || "").toUpperCase()
        const status: PlanningWorkflowStep["status"] =
          st === "COMPLETE" || st === "DONE"
            ? "done"
            : st === "IN_PROGRESS" || st === "ACTIVE"
              ? "active"
              : "pending"
        return {
          id: s.id,
          label: s.name,
          status,
          actor: s.stage || "",
          when: s.percent != null ? `${s.percent}%` : "",
        }
      })
    }
    return mapCycleWorkflow(activeCycleDetail)
  }, [planningSummary, activeCycleDetail])

  const viewByLabel = useMemo(() => {
    if (budgetDepartmentName) return budgetDepartmentName
    if (assignedDepartmentIds.length === 1) {
      return deptById.get(assignedDepartmentIds[0]) || "Assigned department"
    }
    if (assignedDepartmentIds.length > 1) {
      return `${assignedDepartmentIds.length} departments`
    }
    return "Total Company"
  }, [budgetDepartmentName, assignedDepartmentIds, deptById])

  const viewByOptions = useMemo(() => {
    const opts = [{ id: "total", label: "Total Company" }]
    if (budgetDepartmentId && budgetDepartmentName) {
      opts.push({ id: budgetDepartmentId, label: budgetDepartmentName })
    }
    for (const id of assignedDepartmentIds) {
      if (opts.some((o) => o.id === id)) continue
      opts.push({ id, label: deptById.get(id) || id })
    }
    return opts
  }, [
    assignedDepartmentIds,
    budgetDepartmentId,
    budgetDepartmentName,
    deptById,
  ])

  const modelScenarios = useMemo(() => {
    const fromStore = scenarios.filter((s) => !s.modelId || s.modelId === modelId)
    if (fromStore.length) return fromStore
    return model?.scenarios || []
  }, [scenarios, model?.scenarios, modelId])

  const modelVersions = useMemo(() => {
    const fromStore = versions.filter((v) => !v.modelId || v.modelId === modelId)
    if (fromStore.length) return fromStore
    return (model?.versions || []) as typeof versions
  }, [versions, model?.versions, modelId])

  useEffect(() => {
    void dispatch(
      fetchFpaDashboard({
        modelId,
        versionId: selectedVersionId || undefined,
      }),
    )
    void fpaApi
      .listDrivers({
        modelId,
        versionId: selectedVersionId || undefined,
        scenarioId: selectedScenarioId || undefined,
      })
      .then((res) => {
        if (res.success) setPlanningDrivers(res.data || [])
        else setPlanningDrivers([])
      })
      .catch(() => setPlanningDrivers([]))

    if (!selectedVersionId || !selectedScenarioId) {
      setPlanningSummary(null)
      return
    }
    let cancelled = false
    void fpaApi
      .getPlanningSummary(modelId, {
        versionId: selectedVersionId,
        scenarioId: selectedScenarioId,
      })
      .then((res) => {
        if (cancelled) return
        if (res.success && res.data) setPlanningSummary(res.data)
        else {
          setPlanningSummary(null)
          if (!res.success) {
            logFpaGap({
              category: "missing",
              path: `/v1/fpa/models/${modelId}/planning-summary`,
              method: "GET",
              message: res.message || "Planning summary unavailable",
              impact: "KPI strip falls back to home dashboard",
            })
          }
        }
      })
      .catch((err) => {
        if (cancelled) return
        setPlanningSummary(null)
        logFpaGap({
          category: "broken",
          path: `/v1/fpa/models/${modelId}/planning-summary`,
          method: "GET",
          message: errorMessage(err),
          impact: "KPI strip falls back to home dashboard",
          response: err,
        })
      })
    return () => {
      cancelled = true
    }
  }, [modelId, selectedVersionId, selectedScenarioId, dispatch])

  const reloadPlanningShell = useCallback(() => {
    void dispatch(bootstrapFpaSelection(modelId))
    void dispatch(
      fetchFpaDashboard({
        modelId,
        versionId: selectedVersionId || undefined,
      }),
    )
    void fpaApi
      .listDrivers({
        modelId,
        versionId: selectedVersionId || undefined,
        scenarioId: selectedScenarioId || undefined,
      })
      .then((res) => {
        if (res.success) setPlanningDrivers(res.data || [])
      })
      .catch(() => {})
    if (selectedVersionId && selectedScenarioId) {
      void fpaApi
        .getPlanningSummary(modelId, {
          versionId: selectedVersionId,
          scenarioId: selectedScenarioId,
        })
        .then((res) => {
          if (res.success && res.data) setPlanningSummary(res.data)
        })
        .catch(() => {})
    }
    setCollabReloadKey((k) => k + 1)
  }, [dispatch, modelId, selectedVersionId, selectedScenarioId])
  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fpaApi.listBudgetCycles({ modelId })
        const rows = res.success && Array.isArray(res.data) ? res.data : []
        const filtered = rows.filter((c) => !c.modelId || c.modelId === modelId)
        if (!cancelled) {
          setPlanningCycles(
            filtered.map((c) => ({
              id: c.id,
              name: c.name || `FY${c.fiscalYear} cycle`,
            })),
          )
        }
      } catch {
        if (!cancelled) setPlanningCycles([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [modelId])

  useEffect(() => {
    if (!budgetCycleId) {
      setActiveCycleDetail(null)
      return
    }
    let cancelled = false
    void fpaApi
      .getBudgetCycle(budgetCycleId)
      .then((res) => {
        if (!cancelled && res.success && res.data) setActiveCycleDetail(res.data)
      })
      .catch(() => {
        if (!cancelled) setActiveCycleDetail(null)
      })
    return () => {
      cancelled = true
    }
  }, [budgetCycleId])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const comments: PlanningComment[] = []
      const tasks: PlanningTask[] = []
      const activity: PlanningActivity[] = []

      if (budgetCycleId) {
        try {
          const [cRes, tRes, aRes] = await Promise.all([
            fpaApi.listBudgetCycleComments(budgetCycleId),
            fpaApi.listBudgetCycleTasks(budgetCycleId),
            fpaApi.listBudgetApprovalEvents(budgetCycleId),
          ])
          if (cRes.success && Array.isArray(cRes.data)) {
            for (const c of cRes.data) {
              const author = c.authorName || "User"
              comments.push({
                id: c.id,
                author,
                initials: planningInitials(author),
                avatarTone: planningAvatarTone(author),
                when: formatRelativeWhen(c.createdAt),
                body: c.body || "",
              })
            }
          }
          if (tRes.success && Array.isArray(tRes.data)) {
            for (const t of tRes.data) {
              const st = String(t.status || "").toUpperCase()
              tasks.push({
                id: t.id,
                title: t.title || "Planning task",
                assignee: t.assigneeName || t.departmentName || "Unassigned",
                due: t.dueDate
                  ? new Date(t.dueDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      timeZone: "UTC",
                    })
                  : "",
                done: st === "COMPLETED" || st === "APPROVED" || st === "CLOSED",
              })
            }
          }
          if (aRes.success && Array.isArray(aRes.data)) {
            for (const e of aRes.data.slice(0, 12)) {
              activity.push({
                id: String(e.id || `${e.action}-${e.createdAt}`),
                when: formatRelativeWhen(e.createdAt),
                text: `${e.actorName || "User"} · ${String(e.action || e.rawAction || "Update").replace(/_/g, " ")}`,
              })
            }
          }
        } catch {
          /* keep empty */
        }
      }

      if (selected?.id) {
        try {
          const res = await fpaApi.listCellComments(modelId, selected.id)
          if (res.success && Array.isArray(res.data)) {
            for (const c of res.data) {
              const author =
                (c as { authorName?: string; userName?: string }).authorName ||
                (c as { userName?: string }).userName ||
                "User"
              comments.unshift({
                id: `cell-${c.id}`,
                author,
                initials: planningInitials(author),
                avatarTone: planningAvatarTone(author),
                when: formatRelativeWhen(
                  (c as { createdAt?: string }).createdAt || null,
                ),
                body: `[Cell] ${(c as { body?: string; text?: string }).body || (c as { text?: string }).text || ""}`,
              })
            }
          }
        } catch {
          /* ignore */
        }
      }

      if (!cancelled) {
        setCollabComments(comments)
        setCollabTasks(tasks)
        setCollabActivity(activity)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [budgetCycleId, selected?.id, modelId, collabReloadKey])

  const onCycleChange = useCallback(
    (id: string) => {
      const sp = new URLSearchParams(searchParams.toString())
      if (id) sp.set("cycleId", id)
      else sp.delete("cycleId")
      const q = sp.toString()
      router.replace(q ? `${pathname}?${q}` : pathname)
    },
    [searchParams, router, pathname],
  )

  const onWorkspaceViewChange = useCallback(
    (view: PlanningWorkspaceView) => {
      const sp = new URLSearchParams(searchParams.toString())
      if (view === "compare") sp.set("view", "compare")
      else sp.delete("view")
      const q = sp.toString()
      router.replace(q ? `${pathname}?${q}` : pathname)
    },
    [searchParams, router, pathname],
  )

  // Seed compare selection when entering compare mode or when scenarios load.
  useEffect(() => {
    if (workspaceView !== "compare") return
    setCompareScenarioIds((prev) => {
      const valid = prev.filter((id) => modelScenarios.some((s) => s.id === id))
      if (valid.length >= 2) return valid
      const seed = new Set<string>()
      const prefer = (re: RegExp) =>
        modelScenarios.find((s) => re.test(s.name) || re.test(s.scenarioType || ""))
      const budget = prefer(/budget/i)
      if (budget) seed.add(budget.id)
      if (selectedScenarioId && modelScenarios.some((s) => s.id === selectedScenarioId)) {
        seed.add(selectedScenarioId)
      }
      for (const s of modelScenarios) {
        if (seed.size >= Math.min(5, modelScenarios.length)) break
        seed.add(s.id)
      }
      return Array.from(seed)
    })
  }, [workspaceView, modelScenarios, selectedScenarioId])

  const collabApprovals = useMemo((): PlanningApproval[] => {
    return collabActivity.map((a) => {
      const t = a.text.toLowerCase()
      let status: PlanningApproval["status"] = "pending"
      if (/approv/.test(t)) status = "approved"
      else if (/return/.test(t)) status = "returned"
      else if (/submit/.test(t)) status = "submitted"
      return { id: a.id, when: a.when, text: a.text, status }
    })
  }, [collabActivity])

  const onDriverSave = useCallback(
    async (id: string, value: number) => {
      try {
        const res = await fpaApi.updateDriver(id, { value })
        if (!res.success) throw new Error(res.message || "Driver update failed")
        setPlanningDrivers((prev) =>
          prev.map((d) => (d.id === id ? { ...d, value } : d)),
        )
        toast.success("Driver updated")
      } catch (err) {
        toast.error(errorMessage(err))
      }
    },
    [],
  )

  const onAddCollabComment = useCallback(
    async (body: string) => {
      try {
        if (budgetCycleId) {
          const res = await fpaApi.postBudgetCycleComment(budgetCycleId, { body })
          if (!res.success) throw new Error(res.message || "Comment failed")
          toast.success("Comment posted")
          setCollabReloadKey((k) => k + 1)
          return
        }
        if (selected?.id) {
          const res = await fpaApi.addCellComment(modelId, selected.id, { body })
          if (!res.success) throw new Error(res.message || "Comment failed")
          toast.success("Cell comment posted")
          setCollabReloadKey((k) => k + 1)
          return
        }
        toast.message("Select a planning cycle or a grid cell to comment")
      } catch (err) {
        toast.error(errorMessage(err))
      }
    },
    [budgetCycleId, selected?.id, modelId],
  )

  const budgetSubmitUnmet = useMemo(() => {
    if (!inBudgetContext) return [] as string[]
    if (ownerUnmet.length) return ownerUnmet.map(resolveDeptMessage)
    const unmet: string[] = []
    if (!submitTaskId) unmet.push("No open owner task is bound for this cycle.")
    if (ownerCanSubmit === false && !ownerUnmet.length) {
      unmet.push("Owner submit gates are not met for this cycle.")
    }
    if (validationErrors.length) {
      unmet.push(
        ...validationErrors.map((e) =>
          resolveDeptMessage(e.message || e.code || "Validation issue"),
        ),
      )
    }
    return unmet
  }, [
    inBudgetContext,
    submitTaskId,
    validationErrors,
    ownerUnmet,
    ownerCanSubmit,
    resolveDeptMessage,
  ])

  const validationPanelItems = useMemo(() => {
    const fromOwner = ownerUnmet.map((message, i) => ({
      key: `owner-${i}-${message.slice(0, 24)}`,
      title: "Submit requirement",
      message: resolveDeptMessage(message),
      tone: "error" as const,
    }))
    const fromGrid = validationErrors.map((e, i) => ({
      key: `grid-${e.code}-${e.lineItemId}-${e.periodDate}-${i}`,
      title:
        e.field ||
        (e.lineItemId && e.periodDate
          ? `${e.lineItemId} — ${monthLabel(e.periodDate)}`
          : e.code) ||
        "Issue",
      message: resolveDeptMessage(e.message || e.code || "Validation issue"),
      tone: (String(e.severity || "").toUpperCase().includes("WARN")
        ? "warning"
        : "error") as "warning" | "error",
      field: e.field,
      lineItemId: e.lineItemId,
    }))
    // Prefer owner submit gates when present; still show grid issues that aren't duplicates
    if (fromOwner.length) {
      const ownerText = new Set(fromOwner.map((x) => x.message))
      return [...fromOwner, ...fromGrid.filter((g) => !ownerText.has(g.message))]
    }
    return fromGrid
  }, [ownerUnmet, validationErrors, resolveDeptMessage])

  useEffect(() => {
    let cancelled = false
    void departmentApiService
      .getDepartments()
      .then((res) => {
        if (cancelled) return
        const rows = Array.isArray(res?.data)
          ? res.data
          : Array.isArray((res as { departments?: unknown[] })?.departments)
            ? (res as { departments: unknown[] }).departments
            : []
        const map = new Map<string, string>()
        for (const raw of rows) {
          const row = raw as { id?: string; departmentId?: string; name?: string; departmentName?: string }
          const id = String(row.id || row.departmentId || "")
          const name = String(row.name || row.departmentName || "")
          if (id && name) map.set(id, name)
        }
        setDeptById(map)
      })
      .catch(() => {
        /* humanize falls back to "this department" */
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!budgetCycleId) {
      setOwnerUnmet([])
      setOwnerCanSubmit(null)
      return
    }
    let cancelled = false
    void fpaApi
      .getOwnerWorkspace(budgetCycleId)
      .then((res) => {
        if (cancelled || !res.success || !res.data) return
        setOwnerCanSubmit(res.data.canSubmit ?? null)
        setOwnerUnmet((res.data.unmetRequirements || []).map((u) => u.message))
        setDeptById((prev) => {
          const next = new Map(prev)
          for (const row of res.data.departmentBudgetRegister || []) {
            const id = String(row.departmentId || "")
            const name = String(row.departmentName || "")
            if (id && name) next.set(id, name)
          }
          const cycleOwners = (res.data.cycle as { owners?: Array<{ departmentId?: string; departmentName?: string }> } | undefined)
            ?.owners
          for (const o of cycleOwners || []) {
            const id = String(o.departmentId || "")
            const name = String(o.departmentName || "")
            if (id && name) next.set(id, name)
          }
          return next
        })
      })
      .catch(() => {
        if (!cancelled) {
          setOwnerUnmet([])
          setOwnerCanSubmit(null)
        }
      })
    return () => {
      cancelled = true
    }
  }, [budgetCycleId])

  /** Load model scenarios/versions into the header, then pin cycle/query selection. */
  useEffect(() => {
    let cancelled = false
    void (async () => {
      await dispatch(bootstrapFpaSelection(modelId))
      if (cancelled) return

      let scenarioId = queryScenarioId
      let versionId = queryVersionId
      if ((!scenarioId || !versionId) && budgetCycleId) {
        try {
          const cycleRes = await fpaApi.getBudgetCycle(budgetCycleId)
          if (cycleRes.success && cycleRes.data) {
            scenarioId = scenarioId || cycleRes.data.scenarioId || null
            versionId = versionId || cycleRes.data.versionId || null
          }
        } catch {
          /* keep bootstrap defaults */
        }
      }
      if (cancelled) return
      if (scenarioId) dispatch(setSelectedScenarioId(scenarioId))
      if (versionId) dispatch(setSelectedVersionId(versionId))
    })()
    return () => {
      cancelled = true
    }
  }, [modelId, budgetCycleId, queryScenarioId, queryVersionId, dispatch])

  useEffect(() => {
    let cancelled = false
    void Promise.all([
      fpaApi.getModel(modelId).catch(() => null),
      usersApi.getAll().catch(() => null),
    ]).then(([modelRes, userRes]) => {
      if (cancelled) return
      if (modelRes?.success && modelRes.data) setModel(modelRes.data)
      else if (modelFromStore) setModel(modelFromStore)
      const list = Array.isArray(userRes?.data)
        ? userRes!.data
        : Array.isArray((userRes as { users?: AppUser[] } | null)?.users)
          ? (userRes as { users: AppUser[] }).users
          : []
      setUsers(list)
    })
    return () => {
      cancelled = true
    }
  }, [modelId, modelFromStore])

  useEffect(() => {
    let cancelled = false
    void fpaApi
      .myTasks({ modelId, versionId: selectedVersionId || undefined })
      .then((res) => {
        if (cancelled || !res.success) return
        const open = (res.data || []).find((t) => {
          const st = String(t.status).toUpperCase()
          return st === "PENDING" || st === "IN_PROGRESS" || st === "OPEN" || st === "RETURNED"
        })
        setBoundTaskId(open?.id || null)
      })
      .catch(() => {
        if (!cancelled) setBoundTaskId(null)
      })
    return () => {
      cancelled = true
    }
  }, [modelId, selectedVersionId])

  const load = useCallback(async () => {
    if (!selectedVersionId || !selectedScenarioId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const [gridRes, valRes] = await Promise.all([
        fpaApi.getGrid(modelId, {
          versionId: selectedVersionId,
          scenarioId: selectedScenarioId,
          cycleId: budgetCycleId || undefined,
          pageSize: 500,
        }),
        fpaApi
          .getGridValidations(modelId, {
            versionId: selectedVersionId,
            scenarioId: selectedScenarioId,
            cycleId: budgetCycleId || undefined,
          })
          .catch(() => null),
      ])
      if (!gridRes.success || !gridRes.data) throw new Error(gridRes.message || "Grid failed")
      setLineItems(gridRes.data.lineItems || [])
      setCells(gridRes.data.cells || [])
      setGridPeriods(gridRes.data.periods || [])
      setActualCutoff(gridRes.data.actualCutoff || null)
      setGridOwnerName(gridRes.data.ownerName || null)
      setGridOwnerAvatar(gridRes.data.ownerAvatarUrl || null)
      setAssignedDepartmentIds(gridRes.data.assignedDepartmentIds || [])

      const rawVal = valRes?.success ? valRes.data : null
      const list = Array.isArray(rawVal)
        ? rawVal
        : Array.isArray((rawVal as { errors?: FpaGridValidation[] } | null)?.errors)
          ? (rawVal as { errors: FpaGridValidation[] }).errors
          : Array.isArray((rawVal as { items?: FpaGridValidation[] } | null)?.items)
            ? (rawVal as { items: FpaGridValidation[] }).items
            : []
      if (list.length) {
        setValidationErrors(list)
      } else {
        const fallback = await fpaApi.validateModel(modelId).catch(() => null)
        setValidationErrors(
          fallback?.success && fallback.data?.errors
            ? fallback.data.errors.map((e) => ({
                code: e.code,
                message: e.message,
                field: e.field,
                severity: "ERROR",
              }))
            : [],
        )
      }
    } catch (err) {
      logFpaGap({
        category: "broken",
        path: `/v1/fpa/models/${modelId}/grid`,
        method: "GET",
        message: errorMessage(err),
        impact: "Worksheet empty",
        request: {
          versionId: selectedVersionId,
          scenarioId: selectedScenarioId,
          cycleId: budgetCycleId || undefined,
        },
        response: err,
      })
      toast.error(errorMessage(err, "Failed to load grid"))
      setLineItems([])
      setCells([])
      setGridPeriods([])
      setValidationErrors([])
      setAssignedDepartmentIds([])
    } finally {
      setLoading(false)
    }
  }, [modelId, selectedVersionId, selectedScenarioId, budgetCycleId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (editingCellId) editInputRef.current?.focus()
  }, [editingCellId])

  useEffect(() => {
    if (!focusLineId) return
    const el = rowRefs.current.get(focusLineId)
    el?.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [focusLineId])

  const periods: PeriodCol[] = useMemo(() => {
    const fromApi = new Map<string, PeriodCol>()
    for (const p of gridPeriods) {
      const iso = p.periodDate || p.key
      if (!iso) continue
      const key = monthKey(iso)
      const role = String(p.periodRole || "").toUpperCase()
      fromApi.set(key, {
        key,
        iso,
        label: p.label || monthLabel(iso),
        band: role === "ACTUAL" ? "ACTUAL" : "FORECAST",
      })
    }

    const set = new Map<string, string>()
    cells.forEach((c) => set.set(monthKey(c.periodDate), c.periodDate))
    for (const [key, iso] of set) {
      if (fromApi.has(key)) continue
      const cellRole = cells.find((c) => monthKey(c.periodDate) === key)?.periodRole
      if (cellRole) {
        fromApi.set(key, {
          key,
          iso,
          label: monthLabel(iso),
          band: String(cellRole).toUpperCase() === "ACTUAL" ? "ACTUAL" : "FORECAST",
        })
      }
    }

    if (fromApi.size) {
      return [...fromApi.values()].sort((a, b) => a.key.localeCompare(b.key))
    }

    const sorted = [...set.entries()].sort((a, b) => a[0].localeCompare(b[0]))
    let cutoffKey = actualCutoff ? monthKey(actualCutoff) : ""
    if (!cutoffKey) {
      for (const c of cells) {
        if (String(c.sourceType || "").toUpperCase() === "ACTUAL") {
          const k = monthKey(c.periodDate)
          if (k > cutoffKey) cutoffKey = k
        }
      }
    }
    if (!cutoffKey && sorted.length) {
      const today = new Date()
      const todayKey = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, "0")}`
      const past = sorted.filter(([k]) => k <= todayKey)
      cutoffKey = past.length ? past[past.length - 1][0] : ""
    }

    return sorted.map(([key, iso]) => ({
      key,
      iso,
      label: monthLabel(iso),
      band: cutoffKey && key <= cutoffKey ? ("ACTUAL" as const) : ("FORECAST" as const),
    }))
  }, [cells, gridPeriods, actualCutoff])

  const actualPeriods = useMemo(() => periods.filter((p) => p.band === "ACTUAL"), [periods])
  const forecastPeriods = useMemo(() => periods.filter((p) => p.band === "FORECAST"), [periods])

  const quarterCols: AggCol[] = useMemo(() => {
    const map = new Map<string, AggCol>()
    for (const p of periods) {
      const q = quarterKey(p.iso)
      const existing = map.get(q.key)
      if (existing) existing.periodKeys.push(p.key)
      else map.set(q.key, { key: q.key, label: q.label, periodKeys: [p.key] })
    }
    return [...map.values()]
  }, [periods])

  const fyCols: AggCol[] = useMemo(() => {
    const byYear = new Map<number, string[]>()
    for (const p of periods) {
      const y = new Date(p.iso).getUTCFullYear()
      const list = byYear.get(y) || []
      list.push(p.key)
      byYear.set(y, list)
    }
    return [...byYear.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([y, keys]) => ({
        key: `FY${y}`,
        label: `FY${y} Total`,
        periodKeys: keys,
      }))
  }, [periods])

  const cellMap = useMemo(() => {
    const m = new Map<string, FpaCell>()
    cells.forEach((c) => m.set(`${c.lineItemId}|${monthKey(c.periodDate)}`, c))
    return m
  }, [cells])

  const rows = useMemo(() => {
    if (lineItems.length) return [...lineItems].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    const fromCells = new Map<string, FpaLineItem>()
    cells.forEach((c) => {
      if (c.lineItem?.id) {
        fromCells.set(c.lineItem.id, {
          id: c.lineItem.id,
          modelId,
          code: c.lineItem.code || "",
          name: c.lineItem.name || c.lineItem.code || "Line",
          lineItemType: c.lineItem.lineItemType || "OTHER",
          category: c.lineItem.category || "GENERAL",
          sortOrder: 0,
          dataType: c.lineItem.dataType,
          format: c.lineItem.format,
          parentId: null,
        })
      }
    })
    return [...fromCells.values()]
  }, [lineItems, cells, modelId])

  const childrenByParent = useMemo(() => {
    const map = new Map<string, FpaLineItem[]>()
    for (const row of rows) {
      const pid = row.parentId || ""
      if (!pid) continue
      const list = map.get(pid) || []
      list.push(row)
      map.set(pid, list)
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    }
    return map
  }, [rows])

  const visibleRows = useMemo(() => {
    const idSet = new Set(rows.map((r) => r.id))
    const roots = rows.filter((r) => !r.parentId || !idSet.has(r.parentId))
    const out: { row: FpaLineItem; depth: number; hasChildren: boolean }[] = []
    const walk = (items: FpaLineItem[], depth: number) => {
      for (const row of items) {
        const kids = childrenByParent.get(row.id) || []
        out.push({ row, depth, hasChildren: kids.length > 0 })
        if (kids.length && !collapsedIds.has(row.id)) walk(kids, depth + 1)
      }
    }
    walk(roots, 0)
    return out
  }, [rows, childrenByParent, collapsedIds])

  const toggleRow = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const firstPeriodKey = periods[0]?.key

  const priorFor = useCallback(
    (lineId: string, periodKey: string) => {
      const idx = periods.findIndex((p) => p.key === periodKey)
      if (idx <= 0) return undefined
      return asNumber(cellMap.get(`${lineId}|${periods[idx - 1].key}`)?.value)
    },
    [periods, cellMap],
  )

  const sumKeys = useCallback(
    (lineId: string, keys: string[]) =>
      keys.reduce((sum, k) => sum + asNumber(cellMap.get(`${lineId}|${k}`)?.value), 0),
    [cellMap],
  )

  const isReadOnly = (cell?: FpaCell) => {
    if (!cell) return true
    const state = cellState(cell)
    if (state === "INPUT" || state === "OVERRIDE") return false
    return state === "ACTUAL" || state === "LOCKED" || state === "CALCULATED" || state === "IMPORTED" || state === "ERROR" || state === "PENDING_CALCULATION" || cell.isEditable === false
  }

  const selectCell = async (cell: FpaCell, edit: boolean) => {
    setSelected(cell)
    setDetailsOpen(true)
    setCommentOpen(false)
    setCommentDraft("")
    setCellDetail(null)
    setTraceOpen(false)
    setCellTrace(null)
    if (edit && !isReadOnly(cell) && canEditGrid) {
      setEditingCellId(cell.id)
      setEditDraft(String(asNumber(cell.value)))
    } else {
      setEditingCellId(null)
    }
    try {
      const [histRes, commentsRes, detailRes] = await Promise.all([
        fpaApi.cellHistory(modelId, cell.id),
        fpaApi.listCellComments(modelId, cell.id).catch(() => null),
        fpaApi.getCellDetail(modelId, cell.id).catch(() => null),
      ])
      setHistory(histRes.success ? histRes.data || [] : [])
      setCellComments(commentsRes?.success ? commentsRes.data || [] : [])
      if (detailRes?.success && detailRes.data) {
        const d = detailRes.data
        const formulaRaw = d.formula
        const formulaText =
          typeof formulaRaw === "string"
            ? formulaRaw
            : formulaRaw && typeof formulaRaw === "object"
              ? formulaRaw.expression || formulaRaw.id || null
              : null
        setCellDetail({
          formula: formulaText,
          drivers: d.currentDrivers || [],
          cellStatus: d.cellStatus || d.cell?.cellStatus,
        })
        if (Array.isArray(d.history) && d.history.length && !(histRes.success && histRes.data?.length)) {
          setHistory(d.history)
        }
        if (Array.isArray(d.comments) && d.comments.length && !(commentsRes?.success && commentsRes.data?.length)) {
          setCellComments(d.comments)
        }
        if (d.cell) {
          setSelected((prev) => (prev?.id === cell.id ? { ...prev, ...d.cell } : prev))
        }
      }
    } catch (err) {
      setHistory([])
      setCellComments([])
      logFpaGap({
        category: "broken",
        path: `/v1/fpa/models/${modelId}/cells/${cell.id}/history`,
        method: "GET",
        message: errorMessage(err),
        impact: "Cell history drawer empty",
        response: err,
      })
    }
  }

  const loadCellTrace = async (cellId: string) => {
    setBusyKey(`trace:${cellId}`)
    try {
      const res = await fpaApi.getCellTrace(modelId, cellId)
      if (!res.success || !res.data) throw new Error(res.message || "Trace failed")
      setCellTrace(res.data)
      setTraceOpen(true)
    } catch (err) {
      toast.error(errorMessage(err, "Could not load formula trace"))
    } finally {
      setBusyKey(null)
    }
  }

  const cancelEdit = () => {
    setEditingCellId(null)
    setEditDraft("")
  }

  const mergeCells = (updates: FpaCell[]) => {
    if (!updates.length) return
    const byId = new Map(updates.map((c) => [c.id, c]))
    setCells((prev) => prev.map((c) => byId.get(c.id) || c))
    setSelected((prev) => (prev && byId.get(prev.id) ? { ...prev, ...byId.get(prev.id)! } : prev))
  }

  const saveCell = async (cell: FpaCell, raw: string) => {
    if (!canEditGrid) {
      toast.error("You do not have permission to edit cells")
      return
    }
    const value = parseCellInput(raw)
    if (value === null) {
      toast.error("Enter a valid number")
      return
    }
    if (value === asNumber(cell.value)) {
      cancelEdit()
      return
    }
    setBusyKey(`cell:${cell.id}`)
    try {
      const res = await fpaApi.updateCell(modelId, {
        cellId: cell.id,
        value,
        recordVersion: cell.recordVersion ?? undefined,
        cycleId: budgetCycleId || undefined,
        departmentId: budgetDepartmentId || cell.departmentId || undefined,
      })
      if (!res.success) throw new Error(res.message || "Update failed")
      const payload = res.data as (FpaCell & { updatedCells?: FpaCell[] }) | undefined
      const dependents = payload?.updatedCells || []
      const next: FpaCell = payload
        ? {
            ...cell,
            ...payload,
            value: payload.value ?? value,
          }
        : { ...cell, value }
      // Drop nested array off the cell shape if present
      delete (next as FpaCell & { updatedCells?: unknown }).updatedCells
      if (dependents.length) {
        mergeCells([next, ...dependents])
      } else {
        setCells((prev) => prev.map((c) => (c.id === cell.id ? next : c)))
        setSelected((prev) => (prev?.id === cell.id ? next : prev))
      }
      cancelEdit()
    } catch (err) {
      const status = (err as { status?: number })?.status
      const code = (err as { response?: { code?: string } })?.response?.code
      const conflict = (
        err as {
          response?: {
            errors?: Array<{
              currentValue?: number
              recordVersion?: number
              changedBy?: string
              changedAt?: string
            }>
          }
        }
      )?.response?.errors?.[0]
      logFpaGap({
        category: "broken",
        path: `/v1/fpa/models/${modelId}/cells/update`,
        method: "POST",
        message: errorMessage(err),
        impact: "Cannot edit worksheet cells",
        request: { cellId: cell.id, value, recordVersion: cell.recordVersion },
        response: err,
      })
      if (status === 409 || code === "CONFLICT") {
        const who = conflict?.changedBy ? ` by ${conflict.changedBy}` : ""
        const cur =
          conflict?.currentValue != null
            ? ` Current value: ${formatCell(asNumber(conflict.currentValue))}.`
            : ""
        const yours = formatCell(value)
        toast.error("This value changed after you opened the worksheet.", {
          description: `${who ? `Last change${who}.` : ""}${cur} Your edit: ${yours}.`,
          action: {
            label: "Compare",
            onClick: () => {
              const server = conflict?.currentValue
              toast.message("Value compare", {
                description:
                  server != null
                    ? `Yours: ${yours} · Current: ${formatCell(asNumber(server))}${
                        conflict?.changedBy ? ` (${conflict.changedBy})` : ""
                      }${conflict?.changedAt ? ` · ${conflict.changedAt}` : ""}`
                    : "Reload the sheet to see the latest value.",
                action: {
                  label: "Reload",
                  onClick: () => void load(),
                },
              })
            },
          },
        })
      } else if (code === "CELL_NOT_EDITABLE" || (status === 403 && code !== "LOCKED_VERSION")) {
        toast.error(errorMessage(err, "This cell is not editable (CELL_NOT_EDITABLE)"))
      } else if (code === "LOCKED_VERSION" || status === 403) {
        toast.error(
          code === "LOCKED_VERSION"
            ? errorMessage(err, "Version is locked — request reopen for a working copy")
            : errorMessage(err, "This cell is not editable"),
        )
      } else {
        toast.error(errorMessage(err, "Update failed"))
      }
    } finally {
      setBusyKey(null)
    }
  }

  const commitEdit = () => {
    if (!editingCellId) return
    const cell = cells.find((c) => c.id === editingCellId) || selected
    if (!cell) {
      cancelEdit()
      return
    }
    void saveCell(cell, editDraft)
  }

  const runTool = async (tool: "spread" | "copy" | "sync" | "growth") => {
    if (!selectedVersionId || !selectedScenarioId) {
      toast.error("Select version and scenario first")
      return
    }
    if (!selected && (tool === "spread" || tool === "copy" || tool === "growth")) {
      toast.error("Click a cell on the line you want to fill first")
      return
    }
    setBusyKey(tool)
    try {
      if (tool === "spread" && selected) {
        const monthCount = Math.max(periods.length, 1)
        const total = asNumber(selected.value) * monthCount
        const res = await fpaApi.spreadCells(modelId, {
          versionId: selectedVersionId,
          scenarioId: selectedScenarioId,
          lineItemId: selected.lineItemId,
          value: total,
          cycleId: budgetCycleId || undefined,
        })
        if (!res.success) throw new Error(res.message || "Spread failed")
        const n = res.data?.spreadAcross ?? 0
        if (n <= 0) {
          toast.message("Nothing to spread", {
            description: "Line may be empty, locked, or already even.",
          })
        } else toast.success(`Spread across ${n} months`)
        if (res.data?.cells?.length) {
          const byId = new Map(res.data.cells.map((c) => [c.id, c]))
          setCells((prev) => prev.map((c) => byId.get(c.id) || c))
        } else await load()
      } else if (tool === "copy" && selected) {
        const res = await fpaApi.copyForward(modelId, {
          versionId: selectedVersionId,
          scenarioId: selectedScenarioId,
          lineItemId: selected.lineItemId,
          fromPeriodDate: selected.periodDate.slice(0, 10),
          cycleId: budgetCycleId || undefined,
        })
        if (!res.success) throw new Error(res.message || "Copy forward failed")
        const n = res.data?.copied ?? 0
        if (n <= 0) {
          toast.message("Nothing copied", {
            description: "No later months to fill, or cells are locked.",
          })
        } else toast.success(`Copied into ${n} later months`)
        if (res.data?.cells?.length) {
          const byId = new Map(res.data.cells.map((c) => [c.id, c]))
          setCells((prev) => prev.map((c) => byId.get(c.id) || c))
        } else await load()
      } else if (tool === "growth" && selected) {
        const ratePct = Number(growthRate)
        if (!Number.isFinite(ratePct)) {
          toast.error("Enter a valid growth rate")
          return
        }
        const res = await fpaApi.applyGrowth(modelId, {
          versionId: selectedVersionId,
          scenarioId: selectedScenarioId,
          lineItemId: selected.lineItemId,
          fromPeriodDate: selected.periodDate.slice(0, 10),
          ratePct,
          mode: "COMPOUND",
          cycleId: budgetCycleId || undefined,
        })
        if (!res.success) throw new Error(res.message || "Apply growth failed")
        const n = res.data?.updated ?? res.data?.applied ?? res.data?.cells?.length ?? 0
        toast.success(n > 0 ? `Applied ${ratePct}% growth to ${n} cells` : `Applied ${ratePct}% growth`)
        setGrowthOpen(false)
        if (res.data?.cells?.length) {
          const byId = new Map(res.data.cells.map((c) => [c.id, c]))
          setCells((prev) => prev.map((c) => byId.get(c.id) || c))
        } else await load()
      } else if (tool === "sync") {
        const res = await fpaApi.syncActuals({
          modelId,
          versionId: selectedVersionId,
          scenarioId: selectedScenarioId,
        })
        if (!res.success) throw new Error(res.message || "Import actuals failed")
        const data = res.data as { rowCount?: number; synced?: number; count?: number } | null
        const n = data?.rowCount ?? data?.synced ?? data?.count
        await load()
        if (typeof n === "number") {
          toast.success(n > 0 ? `Imported ${n} actuals` : "No GL actuals found for this period")
        } else {
          toast.success("Sheet refreshed with latest actuals")
        }
      }
    } catch (err) {
      logFpaGap({
        category: "broken",
        path: `/v1/fpa/models/${modelId}/cells/${tool}`,
        method: "POST",
        message: errorMessage(err),
        impact: `Worksheet ${tool} action failed`,
        response: err,
      })
      toast.error(errorMessage(err))
    } finally {
      setBusyKey(null)
    }
  }

  const runBulkOp = async (
    operation:
      | "FILL_RIGHT"
      | "FILL_DOWN"
      | "COPY_PRIOR_PERIOD"
      | "COPY_PRIOR_YEAR"
      | "PERCENT_INCREASE"
      | "PERCENT_DECREASE"
      | "CLEAR_EDITABLE",
  ) => {
    if (!selectedVersionId || !selectedScenarioId) {
      toast.error("Select version and scenario first")
      return
    }
    if (!selected) {
      toast.error("Select a cell first")
      return
    }
    setBusyKey(`bulk:${operation}`)
    setBulkOpen(false)
    try {
      const ratePct = Number(growthRate)
      const res = await fpaApi.bulkCellOperation(modelId, {
        operation,
        versionId: selectedVersionId,
        scenarioId: selectedScenarioId,
        lineItemId: selected.lineItemId,
        fromPeriodDate: selected.periodDate.slice(0, 10),
        cycleId: budgetCycleId || undefined,
        ratePct:
          operation === "PERCENT_INCREASE" || operation === "PERCENT_DECREASE"
            ? Number.isFinite(ratePct)
              ? ratePct
              : 5
            : undefined,
      })
      if (!res.success) throw new Error(res.message || "Bulk operation failed")
      const n = res.data?.updated ?? res.data?.cells?.length ?? 0
      toast.success(n > 0 ? `${operation.replace(/_/g, " ")} · ${n} cells` : operation.replace(/_/g, " "))
      if (res.data?.cells?.length) mergeCells(res.data.cells)
      else await load()
    } catch (err) {
      const code = (err as { response?: { code?: string } })?.response?.code
      if (code === "CELL_NOT_EDITABLE" || code === "LOCKED_VERSION") {
        toast.error(errorMessage(err, code))
      } else {
        toast.error(errorMessage(err, "Bulk operation failed"))
      }
    } finally {
      setBusyKey(null)
    }
  }

  const onExport = async () => {
    if (!canExportBoardPack) {
      toast.error("You do not have permission to export")
      return
    }
    setBusyKey("export")
    try {
      const baseName = String(displayName || "worksheet").replace(/[^\w\-]+/g, "_")
      const csvFromGrid = boardPackPayloadToCsv({
        cells,
        lineItems,
        periods: gridPeriods.map((p) => ({
          periodDate: p.periodDate || p.key,
          key: p.key,
          label: p.label,
        })),
      })
      if (csvFromGrid) {
        const blob = new Blob([csvFromGrid], { type: "text/csv;charset=utf-8" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${baseName}-export.csv`
        a.click()
        URL.revokeObjectURL(url)
        toast.success("Exported worksheet CSV")
        return
      }

      const res = await fpaApi.createExport({
        modelId,
        versionId: selectedVersionId || undefined,
        exportType: "MANAGEMENT_REPORT",
        meta: { title: displayName },
      })
      if (!res.success || !res.data) throw new Error(res.message || "Export failed")
      const url = await fpaApi.resolveExportDownloadUrl(res.data)
      const exportId = res.data.id || (url ? extractFpaExportId(url) : null)
      if (url || exportId) {
        setExportTarget({ url, exportId })
        setExportModalOpen(true)
      } else {
        toast.message("Export queued", {
          description: "The file is not ready yet. Try Export again in a moment.",
        })
      }
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusyKey(null)
    }
  }

  const submitComment = async () => {
    if (!selected || !commentDraft.trim()) return
    setBusyKey("comment")
    try {
      const res = await fpaApi.addCellComment(modelId, selected.id, { body: commentDraft.trim() })
      if (!res.success || !res.data) throw new Error(res.message || "Comment failed")
      setCellComments((prev) => [res.data!, ...prev])
      setCommentDraft("")
      setCommentOpen(false)
      toast.success("Comment added")
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusyKey(null)
    }
  }

  const anyBusy = busyKey != null
  const isBusy = (key: string) => busyKey === key

  const selectedLineName =
    selected?.lineItem?.name ||
    rows.find((r) => r.id === selected?.lineItemId)?.name ||
    selected?.lineItemId ||
    ""

  const cellEditorName =
    (selected?.lastUpdatedById && userLabel(usersById.get(selected.lastUpdatedById))) ||
    ownerName

  const visibleMonthCols = displayMode === "monthly" ? periods : []
  const visibleAggCols =
    displayMode === "quarterly" ? [...quarterCols, ...fyCols] : [...fyCols]

  const displayValue = (lineId: string, periodKey: string, value: number) =>
    formatViewValue(value, viewMode, priorFor(lineId, periodKey))

  const renderMonthCell = (row: FpaLineItem, p: PeriodCol) => {
    const cell = cellMap.get(`${row.id}|${p.key}`)
    const value = asNumber(cell?.value)
    const ro = isReadOnly(cell)
    const isSel = selected?.id === cell?.id
    const isEditing = cell && editingCellId === cell.id
    const isRoot = !row.parentId || !rows.some((r) => r.id === row.parentId)

    if (!cell) {
      return (
        <td
          key={p.key}
          className={cn(
            "px-3 py-2.5 border-b border-r border-[#eaecf0] text-right text-[#98a2b3]",
            isRoot && "bg-[#f5f8ff]",
          )}
        >
          —
        </td>
      )
    }

    const shown =
      viewMode === "amounts" && value === 0
        ? "—"
        : displayValue(row.id, p.key, value)

    return (
      <td
        key={p.key}
        className={cn(
          "px-1 py-1 border-b border-r border-[#eaecf0]",
          isRoot && "bg-[#f5f8ff]",
        )}
      >
        {isEditing ? (
          <input
            ref={editInputRef}
            type="text"
            inputMode="decimal"
            value={editDraft}
            disabled={isBusy(`cell:${cell.id}`)}
            onChange={(e) => setEditDraft(e.target.value)}
            onBlur={() => commitEdit()}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                commitEdit()
              } else if (e.key === "Escape") {
                e.preventDefault()
                cancelEdit()
              }
            }}
            className="w-full min-w-[4.5rem] text-right tabular-nums px-2 py-1.5 rounded-md border border-[#2563eb] outline-none"
          />
        ) : (
          <button
            type="button"
            className={cn(
              "w-full text-right tabular-nums px-2 py-1.5 rounded-md border border-transparent",
              isRoot ? "font-semibold text-[#1d4ed8]" : ro ? "text-[#475467]" : "text-[#101828]",
              !ro && canEditGrid && "hover:border-[#b2ddff] cursor-text",
              isSel && "border-[#2563eb] bg-white",
            )}
            onClick={() => void selectCell(cell, !ro && canEditGrid)}
            title={ro ? cellStateMeta(cellState(cell)).hint : "Click to edit"}
          >
            {shown}
          </button>
        )}
      </td>
    )
  }

  return (
    <div className="min-h-full bg-[#f1f5f9] flex flex-col">
      <FpaPageHeader
        title={
          workspaceView === "compare"
            ? "Scenario Comparison"
            : inBudgetContext
              ? "Planning Worksheet"
              : "Model Planning"
        }
        hideFilters
        hideSearch
      />

      <div className="flex-1 p-3 sm:p-4 space-y-3">
        <PlanningWorkspaceChrome
          versions={modelVersions}
          versionId={selectedVersionId}
          scenarios={modelScenarios}
          scenarioId={selectedScenarioId}
          modelId={modelId}
          kpis={planningKpis}
          currency={currency}
          cycles={planningCycles}
          cycleId={budgetCycleId}
          onCycleChange={onCycleChange}
          drivers={driverRows}
          canEditDrivers={canEditGrid}
          onVersionChange={(id) => {
            dispatch(setSelectedVersionId(id))
            const sp = new URLSearchParams(searchParams.toString())
            sp.set("versionId", id)
            const q = sp.toString()
            router.replace(q ? `${pathname}?${q}` : pathname)
          }}
          onScenarioChange={(id) => {
            dispatch(setSelectedScenarioId(id))
            const sp = new URLSearchParams(searchParams.toString())
            sp.set("scenarioId", id)
            const q = sp.toString()
            router.replace(q ? `${pathname}?${q}` : pathname)
          }}
          onRefresh={reloadPlanningShell}
          onDriverSave={onDriverSave}
          viewByLabel={viewByLabel}
          viewByOptions={viewByOptions}
          workspaceView={workspaceView}
          onWorkspaceViewChange={onWorkspaceViewChange}
          compareScenarioIds={compareScenarioIds}
          onCompareScenarioIdsChange={setCompareScenarioIds}
          hideKpis
        />

        {workspaceView === "compare" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
            <div className="lg:col-span-9 min-w-0 space-y-3">
              <PlanningWorkspaceKpiStrip
                kpis={compareKpis}
                currency={currency}
                showFooter={false}
                onRefresh={reloadPlanningShell}
              />
              <PlanningScenarioCompareView
                modelId={modelId}
                versionId={selectedVersionId}
                scenarios={modelScenarios}
                scenarioId={selectedScenarioId}
                currency={currency}
                selectedIds={compareScenarioIds}
                onSelectedIdsChange={setCompareScenarioIds}
                onKpisChange={setCompareKpis}
              />
            </div>
            <div
              className="lg:col-span-3 flex flex-col gap-3 min-h-[480px] lg:sticky lg:top-3"
              style={{ height: "calc(100vh - 6.5rem)" }}
            >
              <PlanningCollabSidebar
                className="flex-1 min-h-0"
                mode="compare"
                comments={collabComments}
                activity={collabActivity}
                approvals={collabApprovals}
                onAddComment={(body) => void onAddCollabComment(body)}
                commentPlaceholder="Add a comment..."
              />
            </div>
          </div>
        ) : (
        <>
        <div className="space-y-3">
        <PlanningWorkspaceKpiStrip
          kpis={planningKpis}
          currency={currency}
          viewByLabel={viewByLabel}
          viewByOptions={viewByOptions}
          onRefresh={reloadPlanningShell}
        />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
          <div className="lg:col-span-9 space-y-3 min-w-0">
        <div className={cn(CARD, "overflow-hidden")}>
          {/* Design header: title + primary grid controls */}
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e2e8f0] px-4 py-3">
            <div className="min-w-0">
              <h3 className="text-[15px] font-semibold text-[#101828] tracking-tight">
                Planning Grid
              </h3>
              <p className="text-[12px] text-[#667085] mt-0.5">All values in {currency}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                className={cn(
                  GRID_TOOL,
                  "min-w-8 px-2",
                  viewMode === "pct_change" && "border-[#2563eb] bg-[#eff6ff] text-[#2563eb]",
                )}
                title="Toggle % change view"
                onClick={() =>
                  setViewMode((m) => (m === "pct_change" ? "amounts" : "pct_change"))
                }
              >
                <Percent className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                className={GRID_TOOL}
                title="Auto-fit columns to content"
                onClick={() => {
                  setDisplayMode("monthly")
                  setViewMode("amounts")
                  toast.success("Columns auto-fitted")
                }}
              >
                Auto-fit
              </button>
              <div className="relative">
                <button
                  type="button"
                  className={GRID_TOOL}
                  title="Column layout"
                  onClick={() => setColumnsMenuOpen((v) => !v)}
                >
                  <Columns2 className="w-3.5 h-3.5" />
                  Columns
                </button>
                {columnsMenuOpen ? (
                  <>
                    <button
                      type="button"
                      className="fixed inset-0 z-10 cursor-default"
                      aria-label="Close columns"
                      onClick={() => setColumnsMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-md border border-[#e2e8f0] bg-white py-1 shadow-md">
                      <button
                        type="button"
                        className="w-full px-3 py-1.5 text-left text-[12px] hover:bg-[#f8fafc]"
                        onClick={() => {
                          setDisplayMode("monthly")
                          setColumnsMenuOpen(false)
                        }}
                      >
                        Monthly periods
                      </button>
                      <button
                        type="button"
                        className="w-full px-3 py-1.5 text-left text-[12px] hover:bg-[#f8fafc]"
                        onClick={() => {
                          setDisplayMode("quarterly")
                          setColumnsMenuOpen(false)
                        }}
                      >
                        Quarterly roll-up
                      </button>
                      <button
                        type="button"
                        className="w-full px-3 py-1.5 text-left text-[12px] hover:bg-[#f8fafc]"
                        onClick={() => {
                          setViewMode("thousands")
                          setColumnsMenuOpen(false)
                        }}
                      >
                        Values in thousands
                      </button>
                      <button
                        type="button"
                        className="w-full px-3 py-1.5 text-left text-[12px] hover:bg-[#f8fafc]"
                        onClick={() => {
                          setViewMode("amounts")
                          setColumnsMenuOpen(false)
                        }}
                      >
                        Full amounts
                      </button>
                    </div>
                  </>
                ) : null}
              </div>

              <span className="hidden sm:inline-block h-5 w-px bg-[#e2e8f0] mx-0.5" aria-hidden />

              <button
                type="button"
                className={GRID_TOOL}
                title="Import actuals from GL"
                disabled={anyBusy || loading || !canEditGrid}
                onClick={() => void runTool("sync")}
              >
                {isBusy("sync") ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                Import
              </button>
              <button
                type="button"
                className={GRID_TOOL}
                title="Copy selected value into later months"
                disabled={anyBusy || loading || !canEditGrid || !selected}
                onClick={() => void runTool("copy")}
              >
                {isBusy("copy") ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                Copy
              </button>
              <button
                type="button"
                className={GRID_TOOL}
                title="Spread selected value evenly across months"
                disabled={anyBusy || loading || !canEditGrid || !selected}
                onClick={() => void runTool("spread")}
              >
                {isBusy("spread") ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <LayoutGrid className="w-3.5 h-3.5" />
                )}
                Spread
              </button>
              <button
                type="button"
                className={cn(GRID_TOOL, growthOpen && "border-[#2563eb] bg-[#eff6ff] text-[#2563eb]")}
                title="Apply growth % along the line"
                disabled={anyBusy || loading || !canEditGrid || !selected}
                onClick={() => {
                  setBulkOpen(false)
                  setCommentOpen(false)
                  setGrowthOpen((v) => !v)
                }}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Growth
              </button>
              <button
                type="button"
                className={cn(GRID_TOOL, bulkOpen && "border-[#2563eb] bg-[#eff6ff] text-[#2563eb]")}
                title="Bulk fill / calculated operations"
                disabled={anyBusy || loading || !canEditGrid || !selected}
                onClick={() => {
                  setGrowthOpen(false)
                  setCommentOpen(false)
                  setBulkOpen((v) => !v)
                }}
              >
                <Calculator className="w-3.5 h-3.5" />
                Bulk
              </button>
              <button
                type="button"
                className={cn(GRID_TOOL, commentOpen && "border-[#2563eb] bg-[#eff6ff] text-[#2563eb]")}
                title="Comment on selected cell"
                disabled={!selected}
                onClick={() => {
                  setGrowthOpen(false)
                  setBulkOpen(false)
                  setCommentOpen((v) => !v)
                  setDetailsOpen(true)
                }}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Comment
              </button>

              <div className="relative">
                <button
                  type="button"
                  className={cn(GRID_TOOL, "min-w-8 px-2")}
                  title="More actions"
                  onClick={() => setGridMoreOpen((v) => !v)}
                  aria-label="More"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {gridMoreOpen ? (
                  <>
                    <button
                      type="button"
                      className="fixed inset-0 z-10 cursor-default"
                      aria-label="Close more"
                      onClick={() => setGridMoreOpen(false)}
                    />
                    <div className="absolute right-0 top-full z-20 mt-1 w-52 rounded-lg border border-[#e2e8f0] bg-white py-1 shadow-md">
                      <button
                        type="button"
                        className="w-full px-3 py-1.5 text-left text-[12px] hover:bg-[#f8fafc] inline-flex items-center gap-2 disabled:opacity-50"
                        disabled={anyBusy || loading || !canExportBoardPack}
                        onClick={() => {
                          setGridMoreOpen(false)
                          void onExport()
                        }}
                      >
                        <Upload className="w-3.5 h-3.5 text-[#64748b]" /> Export
                      </button>
                      <button
                        type="button"
                        className="w-full px-3 py-1.5 text-left text-[12px] hover:bg-[#f8fafc] inline-flex items-center gap-2 disabled:opacity-50"
                        disabled={!selected}
                        onClick={() => {
                          setGridMoreOpen(false)
                          setDetailsOpen(true)
                        }}
                      >
                        <Maximize2 className="w-3.5 h-3.5 text-[#64748b]" /> Cell details
                      </button>
                      {inBudgetContext && canSubmitTask ? (
                        <button
                          type="button"
                          className="w-full px-3 py-1.5 text-left text-[12px] hover:bg-[#f8fafc] inline-flex items-center gap-2 text-[#2563eb] font-medium disabled:opacity-50"
                          disabled={
                            anyBusy ||
                            loading ||
                            !submitTaskId ||
                            budgetSubmitUnmet.length > 0
                          }
                          onClick={() => {
                            setGridMoreOpen(false)
                            toast.message("Use Submit on the budget banner above the grid")
                          }}
                        >
                          <Send className="w-3.5 h-3.5" /> Submit plan
                        </button>
                      ) : null}
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          {/* Inline popovers for growth / bulk / comment when opened from More */}
          {(growthOpen || bulkOpen || commentOpen) && (
            <div className="border-b border-[#e2e8f0] bg-[#f8fafc] px-4 py-2 flex flex-wrap gap-3">
              {growthOpen && (
                <div className="inline-flex items-end gap-2 rounded-md border border-[#e2e8f0] bg-white p-2">
                  <label className="text-[11px] text-[#64748b]">
                    Growth %
                    <input
                      type="number"
                      step="0.1"
                      value={growthRate}
                      onChange={(e) => setGrowthRate(e.target.value)}
                      className="mt-0.5 block h-8 w-20 rounded-md border border-[#e2e8f0] px-2 text-[12px]"
                    />
                  </label>
                  <button
                    type="button"
                    className={GRID_TOOL}
                    disabled={!selected || anyBusy}
                    onClick={() => void runTool("growth")}
                  >
                    Apply
                  </button>
                  <button type="button" className={GRID_TOOL} onClick={() => setGrowthOpen(false)}>
                    Close
                  </button>
                </div>
              )}
              {bulkOpen && (
                <div className="inline-flex flex-wrap items-center gap-1 rounded-md border border-[#e2e8f0] bg-white p-2">
                  {(
                    [
                      ["FILL_RIGHT", "Fill right"],
                      ["FILL_DOWN", "Fill down"],
                      ["COPY_PRIOR_PERIOD", "Copy prior"],
                      ["CLEAR_EDITABLE", "Clear"],
                    ] as const
                  ).map(([op, label]) => (
                    <button
                      key={op}
                      type="button"
                      className={GRID_TOOL}
                      onClick={() => void runBulkOp(op)}
                    >
                      {label}
                    </button>
                  ))}
                  <button type="button" className={GRID_TOOL} onClick={() => setBulkOpen(false)}>
                    Close
                  </button>
                </div>
              )}
              {commentOpen && selected && (
                <div className="flex w-full max-w-md flex-col gap-1 rounded-md border border-[#e2e8f0] bg-white p-2">
                  <textarea
                    className="min-h-[52px] w-full rounded-md border border-[#e2e8f0] px-2 py-1.5 text-[12px]"
                    placeholder="Comment on selected cell…"
                    value={commentDraft}
                    onChange={(e) => setCommentDraft(e.target.value)}
                  />
                  <div className="flex gap-2 justify-end">
                    <button type="button" className={GRID_TOOL} onClick={() => setCommentOpen(false)}>
                      Cancel
                    </button>
                    <button
                      type="button"
                      className={cn(GRID_TOOL, "bg-[#2563eb] text-white border-[#2563eb]")}
                      disabled={!commentDraft.trim()}
                      onClick={() => void onAddCollabComment(commentDraft.trim())}
                    >
                      Post
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        {!selectedVersionId || !selectedScenarioId ? (
          <div className="p-8 text-sm text-[#64748b]">
            Select a version and scenario in the header, or open a model that has defaults.
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-[#64748b]">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading grid…
          </div>
        ) : (
          <>
            {/* Grid + details side-by-side; validation under grid — cards never touch */}
            <div className="flex flex-col sm:flex-row gap-3 items-start min-h-0 max-h-[min(480px,52vh)]">
              <div className="flex-1 min-w-0 w-full flex flex-col gap-3 min-h-0 overflow-auto">
                <div className="overflow-hidden">
                  <div className="overflow-x-auto max-h-[min(420px,48vh)] overflow-y-auto">
                    <table className="w-full text-[12px] min-w-[960px] border-collapse">
                      <thead>
                        <tr className="border-b border-[#eaecf0]">
                          <th className="sticky left-0 top-0 z-[3] bg-white text-left px-4 py-2.5 font-medium text-[#667085] min-w-[200px] border-r border-[#eaecf0]">
                            Department
                          </th>
                          {displayMode === "monthly"
                            ? visibleMonthCols.map((p) => (
                                <th
                                  key={p.key}
                                  className="sticky top-0 z-[2] bg-white px-3 py-2.5 font-medium text-center text-[#667085] whitespace-nowrap border-r border-[#eaecf0]"
                                >
                                  {p.label.replace(/\s+\d{4}$/, "") || p.label}
                                </th>
                              ))
                            : null}
                          {visibleAggCols.map((c) => (
                            <th
                              key={c.key}
                              className="sticky top-0 z-[2] px-3 py-2.5 font-medium text-right text-[#667085] whitespace-nowrap bg-[#f9fafb] border-l border-[#eaecf0]"
                            >
                              {c.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {visibleRows.map(({ row, depth, hasChildren }) => {
                          const expanded = !collapsedIds.has(row.id)
                          const isRoot = depth === 0
                          return (
                            <tr
                              key={row.id}
                              ref={(el) => {
                                if (el) rowRefs.current.set(row.id, el)
                                else rowRefs.current.delete(row.id)
                              }}
                              className={cn(
                                isRoot && "bg-[#f5f8ff]",
                                focusLineId === row.id && !isRoot && "bg-[#eff6ff]/60",
                              )}
                            >
                              <td
                                className={cn(
                                  "sticky left-0 z-[1] px-3 py-2.5 border-b border-r border-[#eaecf0]",
                                  isRoot ? "bg-[#f5f8ff]" : "bg-white",
                                )}
                              >
                                <div
                                  className="flex items-center gap-1.5"
                                  style={{ paddingLeft: Math.max(0, depth) * 14 }}
                                >
                                  <button
                                    type="button"
                                    className={cn(
                                      "h-5 w-5 shrink-0 inline-flex items-center justify-center",
                                      hasChildren
                                        ? "text-[#667085] hover:text-[#101828]"
                                        : "text-transparent pointer-events-none",
                                    )}
                                    aria-label={expanded ? "Collapse" : "Expand"}
                                    onClick={() => {
                                      if (hasChildren) toggleRow(row.id)
                                    }}
                                  >
                                    {hasChildren ? (
                                      expanded ? (
                                        <ChevronDown className="w-3.5 h-3.5" />
                                      ) : (
                                        <ChevronRight className="w-3.5 h-3.5" />
                                      )
                                    ) : (
                                      <span className="w-3.5" />
                                    )}
                                  </button>
                                  <span
                                    className={cn(
                                      "leading-tight truncate",
                                      isRoot
                                        ? "font-semibold text-[#1d4ed8]"
                                        : "font-medium text-[#101828]",
                                    )}
                                  >
                                    {row.name}
                                  </span>
                                </div>
                              </td>
                              {displayMode === "monthly" &&
                                visibleMonthCols.map((p) => renderMonthCell(row, p))}
                              {visibleAggCols.map((col) => {
                                const sum = sumKeys(row.id, col.periodKeys)
                                const priorSum =
                                  viewMode === "pct_change" && firstPeriodKey
                                    ? asNumber(cellMap.get(`${row.id}|${firstPeriodKey}`)?.value)
                                    : undefined
                                return (
                                  <td
                                    key={col.key}
                                    className="px-3 py-2.5 text-right tabular-nums text-[#101828] font-semibold border-b border-l border-[#eaecf0] bg-[#f9fafb]"
                                  >
                                    {sum === 0 && viewMode === "amounts"
                                      ? "—"
                                      : formatViewValue(sum, viewMode, priorSum)}
                                  </td>
                                )
                              })}
                            </tr>
                          )
                        })}
                        {visibleRows.length === 0 && (
                          <tr>
                            <td
                              colSpan={
                                1 +
                                (displayMode === "monthly" ? periods.length : 0) +
                                visibleAggCols.length
                              }
                              className="px-4 py-10 text-center text-[#94a3b8]"
                            >
                              No cells returned for this version/scenario.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {selected && detailsOpen ? (
                <aside
                  className={cn(
                    CARD,
                    "w-full sm:w-[280px] shrink-0 flex flex-col sm:sticky sm:top-3 max-h-[min(640px,70vh)]",
                  )}
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#e2e8f0]">
                    <h3 className="text-sm font-semibold text-[#0f172a]">Cell Details</h3>
                    <button
                      type="button"
                      className="text-[#94a3b8] p-1 rounded-full hover:bg-[#f1f5f9]"
                      aria-label="Close cell details"
                      onClick={() => {
                        setDetailsOpen(false)
                        setSelected(null)
                        setEditingCellId(null)
                        setCommentOpen(false)
                      }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
                      <div>
                        <p className="text-[13px] font-semibold text-[#0f172a]">
                          {selectedLineName} — {monthLabel(selected.periodDate)}
                        </p>
                        <p className="text-xl font-semibold tabular-nums text-[#0f172a] mt-1">
                          {formatViewValue(
                            asNumber(selected.value),
                            viewMode === "pct_change" ? "amounts" : viewMode,
                          )}{" "}
                          <span className="text-xs font-normal text-[#94a3b8]">
                            {viewMode === "thousands"
                              ? "thousands"
                              : normalizeCurrency(selected.currencyCode || currency)}
                          </span>
                        </p>
                      </div>
                      <dl className="space-y-3 text-[12px]">
                        <div className="flex justify-between gap-2 items-center">
                          <dt className="text-[#94a3b8]">Status</dt>
                          <dd>
                            {(() => {
                              const st = cellState(selected)
                              const { label, Icon, hint } = cellStateMeta(st)
                              return (
                                <span
                                  className="inline-flex items-center gap-1 rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-1.5 py-0.5 text-[11px] font-medium text-[#0f172a]"
                                  title={hint}
                                >
                                  <Icon className="h-3 w-3 text-[#64748b]" aria-hidden />
                                  {label}
                                </span>
                              )
                            })()}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt className="text-[#94a3b8]">Source Type</dt>
                          <dd className="text-[#0f172a] font-medium">
                            {selected.sourceType === "ACTUAL"
                              ? "Actual"
                              : !selected.sourceType ||
                                  String(selected.sourceType).toUpperCase() === "INPUT" ||
                                  String(selected.sourceType).toUpperCase() === "MANUAL"
                                ? "Manual Entry"
                                : selected.sourceType}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt className="text-[#94a3b8]">Formula</dt>
                          <dd className="text-[#0f172a] font-medium text-right max-w-[60%] truncate">
                            {cellDetail?.formula ||
                              (selected.formulaId
                                ? selected.formulaId.slice(0, 10) + "…"
                                : "—")}
                          </dd>
                        </div>
                        {cellDetail?.drivers && cellDetail.drivers.length > 0 && (
                          <div>
                            <p className="text-[#94a3b8] mb-1">Current drivers</p>
                            <ul className="space-y-0.5">
                              {cellDetail.drivers.slice(0, 4).map((d, i) => (
                                <li
                                  key={d.id || `${d.name}-${i}`}
                                  className="text-[11px] text-[#0f172a] flex justify-between gap-2"
                                >
                                  <span className="truncate">{d.name || d.id || "Driver"}</span>
                                  <span className="tabular-nums shrink-0">
                                    {d.value != null ? String(d.value) : "—"}
                                    {d.unit ? ` ${d.unit}` : ""}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <button
                          type="button"
                          className="h-8 w-full rounded-md border border-[#e2e8f0] text-[11px] font-medium text-[#0f172a] hover:bg-[#f8fafc] disabled:opacity-50"
                          disabled={anyBusy || !selected}
                          onClick={() => void loadCellTrace(selected.id)}
                        >
                          {isBusy(`trace:${selected.id}`) ? (
                            <span className="inline-flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" /> Loading trace…
                            </span>
                          ) : (
                            "View Formula Trace"
                          )}
                        </button>
                        {traceOpen && cellTrace && (
                          <div className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-2 py-2 space-y-1.5 max-h-40 overflow-y-auto">
                            {cellTrace.root?.expression && (
                              <p className="text-[11px] text-[#0f172a] font-medium break-all">
                                {cellTrace.root.expression}
                              </p>
                            )}
                            {(cellTrace.nodes || []).slice(0, 12).map((n, i) => (
                              <p
                                key={n.id || i}
                                className="text-[10px] text-[#64748b] flex justify-between gap-2"
                              >
                                <span className="truncate">
                                  {n.label || n.kind || n.id || "node"}
                                  {n.expression ? ` · ${n.expression}` : ""}
                                </span>
                                <span className="tabular-nums shrink-0">
                                  {n.value != null ? String(n.value) : ""}
                                </span>
                              </p>
                            ))}
                            {!(cellTrace.nodes?.length) && !cellTrace.root?.expression && (
                              <p className="text-[10px] text-[#94a3b8]">No dependency nodes returned</p>
                            )}
                          </div>
                        )}
                        <div className="flex justify-between gap-2 items-center">
                          <dt className="text-[#94a3b8]">Comments</dt>
                          <dd className="inline-flex items-center gap-1 text-[#0f172a] font-medium">
                            <MessageSquare className="w-3.5 h-3.5 text-[#94a3b8]" />
                            {cellComments.length}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-2 items-center">
                          <dt className="text-[#94a3b8]">Owner</dt>
                          <dd className="inline-flex items-center gap-1.5 text-[#0f172a] font-medium">
                            <span className="h-5 w-5 rounded-full bg-[#e2e8f0] text-[9px] flex items-center justify-center">
                              {initials(cellEditorName)}
                            </span>
                            {cellEditorName}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-2 items-center">
                          <dt className="text-[#94a3b8]">Validation</dt>
                          <dd className="inline-flex items-center gap-1 text-[#166534] font-medium">
                            {isReadOnly(selected) ? (
                              "Read-only"
                            ) : (
                              <>
                                <Check className="w-3.5 h-3.5" /> Valid
                              </>
                            )}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt className="text-[#94a3b8]">Last Updated</dt>
                          <dd className="text-[#0f172a] font-medium text-right">
                            {formatWhen(selected.lastUpdatedAt)}
                          </dd>
                        </div>
                      </dl>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-[#0f172a]">History</p>
                          {history.length > 5 ? (
                            <button type="button" className="text-[11px] text-[#2563eb] font-medium">
                              View all
                            </button>
                          ) : null}
                        </div>
                        {cellComments.length > 0 && (
                          <ul className="mb-3 space-y-1.5">
                            {cellComments.slice(0, 4).map((c) => (
                              <li
                                key={c.id}
                                className="rounded-md border border-[#f1f5f9] bg-[#f8fafc] px-2 py-1.5 text-[11px]"
                              >
                                <p className="text-[#0f172a]">{c.body}</p>
                                <p className="text-[#94a3b8] mt-0.5">
                                  {c.authorName || "User"}
                                  {c.createdAt ? ` · ${formatWhen(c.createdAt)}` : ""}
                                </p>
                              </li>
                            ))}
                          </ul>
                        )}
                        {history.length === 0 ? (
                          <p className="text-[11px] text-[#94a3b8]">No history entries</p>
                        ) : (
                          <ul className="space-y-0">
                            {history.slice(0, 8).map((h, i) => {
                              const e = historyEntry(h, usersById)
                              return (
                                <li
                                  key={i}
                                  className="text-[11px] flex justify-between gap-2 border-b border-[#f1f5f9] py-2"
                                >
                                  <span className="text-[#64748b] truncate">
                                    {e.at ? formatWhen(e.at) : "—"} · {e.name}
                                  </span>
                                  <span className="tabular-nums font-medium text-[#0f172a]">
                                    {formatCell(e.value)}
                                  </span>
                                </li>
                              )
                            })}
                          </ul>
                        )}
                      </div>
                    </div>
                </aside>
              ) : null}
            </div>
          </>
        )}
          </div>

        <PlanningWorkspaceInsights
          drivers={driverRows}
          canEditDrivers={canEditGrid}
          onDriverSave={onDriverSave}
          trendPoints={trendPoints}
          workflowSteps={workflowSteps}
        />
          </div>

          <div
            className="lg:col-span-3 flex flex-col gap-3 min-h-[480px] lg:sticky lg:top-3"
            style={{ height: "calc(100vh - 6.5rem)" }}
          >
            <PlanningCollabSidebar
              className="flex-1 min-h-0"
              comments={collabComments}
              tasks={collabTasks}
              activity={collabActivity}
              onAddComment={(body) => void onAddCollabComment(body)}
              commentPlaceholder="Add a comment..."
            />
            <PlanningTasksCard tasks={collabTasks} />
          </div>
        </div>
        </div>
        </>
        )}
      </div>

      <FpaExportDownloadModal
        open={exportModalOpen}
        onOpenChange={(open) => {
          setExportModalOpen(open)
          if (!open) setExportTarget(null)
        }}
        title="Worksheet export"
        description={`Download a CSV of the worksheet for ${displayName}.`}
        url={exportTarget?.url}
        exportId={exportTarget?.exportId}
        filename={`${String(displayName || "worksheet").replace(/[^\w\-]+/g, "_")}-export.csv`}
      />
    </div>
  )
}
