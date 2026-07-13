"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
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
  AlertTriangle,
  AlertCircle,
  Lock,
  Calculator,
  Pencil,
  Import,
} from "lucide-react"
import { toast } from "sonner"
import { FpaPageHeader } from "./fpa-page-header"
import { FpaExportDownloadModal } from "@/components/fpa/fpa-export-download-modal"
import { boardPackPayloadToCsv, extractFpaExportId } from "@/lib/fpa/download-export"
import {
  asNumber,
  fpaApi,
  formatMoney,
  type FpaCell,
  type FpaCellComment,
  type FpaDriver,
  type FpaGridPeriod,
  type FpaGridValidation,
  type FpaLineItem,
  type FpaModel,
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
} from "@/components/fpa/planning/planning-workspace-chrome"
import { PlanningWorkspaceBoard } from "@/components/fpa/planning/planning-workspace-board"
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

/** Small radius (~6px) for cards + secondary toolbar — Submit is the only pill. */
const CARD = "rounded-md border border-[#e2e8f0] bg-white shadow-sm"
const TOOL_BTN =
  "h-8 inline-flex items-center gap-1.5 rounded-md border border-[#e2e8f0] bg-white px-2.5 text-xs text-[#475569] hover:bg-[#f8fafc] disabled:opacity-50"
const TOOL_BTN_PRIMARY =
  "h-8 inline-flex items-center gap-1.5 rounded-full bg-[#2563eb] px-4 text-xs font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-50"
const SELECT_TRIGGER =
  "h-8 w-[9.5rem] rounded-md border border-[#e2e8f0] bg-white text-xs shadow-none"

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
  const dispatch = useAppDispatch()
  const budgetCycleId = searchParams.get("cycleId")
  const budgetTaskId = searchParams.get("taskId")
  const budgetDepartmentId = searchParams.get("departmentId")
  const budgetCycleName = searchParams.get("cycleName")
  const budgetDepartmentName = searchParams.get("departmentName")
  const budgetDueDate = searchParams.get("dueDate")
  const queryVersionId = searchParams.get("versionId")
  const queryScenarioId = searchParams.get("scenarioId")
  const inBudgetContext = Boolean(budgetCycleId)
  const { selectedScenarioId, selectedVersionId, tasks, dashboard, models, versions, scenarios } =
    useAppSelector((s) => s.fpa)
  const { canEditGrid, canSubmitTask, canExportBoardPack } = useFpaPermissions()
  const [planningDrivers, setPlanningDrivers] = useState<FpaDriver[]>([])

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
  const [detailsOpen, setDetailsOpen] = useState(true)
  const [modelDetailsOpen, setModelDetailsOpen] = useState(false)
  const [validationOpen, setValidationOpen] = useState(true)
  const [validationErrors, setValidationErrors] = useState<FpaGridValidation[]>([])
  const [deptById, setDeptById] = useState<Map<string, string>>(new Map())
  const validationSectionRef = useRef<HTMLDivElement>(null)
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

  const focusValidationMessages = useCallback(() => {
    setValidationOpen(true)
    requestAnimationFrame(() => {
      validationSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }, [])

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

  const planningKpis = useMemo(() => {
    const k = dashboard?.kpis
    if (!k) return []
    const runway = asNumber(k.runwayMonths)
    return [
      {
        label: "Revenue",
        value: formatMoney(k.revenue),
        delta: undefined as string | undefined,
        spark: k.sparklines?.revenue,
        sparkColor: "#2563eb",
      },
      {
        label: "Opex",
        value: formatMoney(
          (k as { opex?: number }).opex ??
            Math.max(0, asNumber(k.revenue) - asNumber(k.ebitda)),
        ),
        spark: k.sparklines?.closingCash,
        sparkColor: "#7c3aed",
      },
      {
        label: "EBITDA",
        value: formatMoney(k.ebitda),
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
        value: "—",
        sparkColor: "#16a34a",
      },
    ]
  }, [dashboard?.kpis])

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
    if (inBudgetContext || !modelId) return
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
  }, [inBudgetContext, modelId, selectedVersionId, selectedScenarioId, dispatch])

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
      .map(([y, keys]) => ({ key: `FY${y}`, label: `FY${y}`, periodKeys: keys }))
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
    displayMode === "quarterly" ? [...quarterCols, ...fyCols] : [...quarterCols, ...fyCols]

  const displayValue = (lineId: string, periodKey: string, value: number) =>
    formatViewValue(value, viewMode, priorFor(lineId, periodKey))

  const renderMonthCell = (row: FpaLineItem, p: PeriodCol) => {
    const cell = cellMap.get(`${row.id}|${p.key}`)
    const value = asNumber(cell?.value)
    const ro = isReadOnly(cell)
    const isSel = selected?.id === cell?.id
    const isEditing = cell && editingCellId === cell.id
    const bandBg = p.band === "ACTUAL" ? "bg-[#f8fafc]" : "bg-[#eff6ff]/40"

    if (!cell) {
      return (
        <td key={p.key} className={cn("px-0.5 py-0.5 border-b border-[#f1f5f9]", bandBg)}>
          <span className="block text-right text-[#cbd5e1] px-2 py-1.5">—</span>
        </td>
      )
    }

    return (
      <td key={p.key} className={cn("px-0.5 py-0.5 border-b border-[#f1f5f9]", bandBg)}>
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
            className="w-full min-w-[4.5rem] text-right tabular-nums px-2 py-1.5 rounded-[3px] border-2 border-[#2563eb] outline-none"
          />
        ) : (
          <button
            type="button"
            className={cn(
              "w-full text-right tabular-nums px-2 py-1.5 rounded-[3px] border-2 border-transparent",
              ro ? "text-[#64748b]" : "text-[#0f172a] hover:border-[#93c5fd] cursor-text",
              isSel && "border-[#2563eb] bg-white",
            )}
            onClick={() => void selectCell(cell, !ro && canEditGrid)}
            title={ro ? cellStateMeta(cellState(cell)).hint : "Click to edit"}
          >
            <span className="inline-flex items-center justify-end gap-1 w-full">
              {(() => {
                const st = cellState(cell)
                if (st === "INPUT") return null
                const { Icon } = cellStateMeta(st)
                return <Icon className="w-3 h-3 text-[#94a3b8] shrink-0" aria-hidden />
              })()}
              {displayValue(row.id, p.key, value)}
            </span>
          </button>
        )}
      </td>
    )
  }

  if (!inBudgetContext) {
    return <PlanningWorkspaceBoard modelId={modelId} />
  }

  return (
    <div className="min-h-full bg-[#f1f5f9] flex flex-col">
      <FpaPageHeader
        title="Planning Worksheet"
      />

      <div className="flex-1 p-3 sm:p-4 space-y-3">
        <div className="space-y-3 min-w-0">
        {/* Header card */}
        <div className={cn(CARD, "px-4 py-3.5")}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-[17px] font-semibold text-[#0f172a] tracking-tight truncate">
                {displayName}
              </h2>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl">
                <div>
                  <p className="text-[11px] font-medium text-[#94a3b8]">
                    Owner
                  </p>
                  <div className="mt-1.5 inline-flex items-center gap-2 text-[13px] font-medium text-[#0f172a]">
                    {ownerAvatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={ownerAvatarUrl}
                        alt=""
                        className="h-6 w-6 shrink-0 rounded-full object-cover bg-[#e2e8f0]"
                      />
                    ) : (
                      <span className="h-6 w-6 shrink-0 rounded-full bg-[#e2e8f0] text-[10px] font-semibold flex items-center justify-center text-[#475569]">
                        {initials(ownerName === "—" ? "?" : ownerName)}
                      </span>
                    )}
                    <span className="truncate">{ownerName}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-[#94a3b8]">
                    Status
                  </p>
                  <div className="mt-1.5 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#0f172a]">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        String(statusLabel).toUpperCase().includes("LOCK") ||
                          String(statusLabel).toUpperCase() === "APPROVED"
                          ? "bg-[#16a34a]"
                          : String(statusLabel).toUpperCase().includes("PROGRESS") ||
                              String(statusLabel).toUpperCase().includes("WORKING")
                            ? "bg-[#16a34a]"
                            : "bg-[#2563eb]",
                      )}
                    />
                    {String(statusLabel).replace(/_/g, " ")}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-[#94a3b8]">
                    Currency
                  </p>
                  <p className="mt-1.5 text-[13px] font-medium text-[#0f172a]">{currency}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-[#94a3b8]">
                    Last Updated
                  </p>
                  <p className="mt-1.5 text-[13px] font-medium text-[#0f172a]">
                    {formatWhen(lastUpdated)}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setModelDetailsOpen((v) => !v)}
                className={TOOL_BTN}
              >
                <Info className="w-3.5 h-3.5" />
                Model Details
              </button>
              <button type="button" className={cn(TOOL_BTN, "px-2")} aria-label="More">
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          {modelDetailsOpen && (
            <div className="mt-3 rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 text-[12px] text-[#475569] grid sm:grid-cols-2 gap-2">
              <p>
                <span className="text-[#94a3b8]">Type</span> {model?.modelType || "—"}
              </p>
              <p>
                <span className="text-[#94a3b8]">Granularity</span> {model?.timeGranularity || "—"}
              </p>
              <p>
                <span className="text-[#94a3b8]">Start</span>{" "}
                {model?.startPeriod ? monthLabel(model.startPeriod) : "—"}
              </p>
              <p>
                <span className="text-[#94a3b8]">End</span>{" "}
                {model?.endPeriod ? monthLabel(model.endPeriod) : "—"}
              </p>
              {model?.description ? (
                <p className="sm:col-span-2">
                  <span className="text-[#94a3b8]">Description</span> {model.description}
                </p>
              ) : null}
            </div>
          )}
        </div>

        {inBudgetContext && (
          <div className={cn(CARD, "px-4 py-3")}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 space-y-1.5">
                <p className="text-[11px] font-medium uppercase tracking-wide text-[#94a3b8]">
                  Budget owner workspace
                </p>
                <h3 className="text-sm font-semibold text-[#0f172a] truncate">
                  {budgetCycleName || "Planning cycle"}
                  {budgetDepartmentName ? (
                    <span className="font-normal text-[#64748b]">
                      {" "}
                      · {budgetDepartmentName}
                    </span>
                  ) : null}
                </h3>
                <p className="text-[11px] text-[#64748b]">
                  {assignedDepartmentIds.length
                    ? `Scoped to ${assignedDepartmentIds.length} assigned department${
                        assignedDepartmentIds.length === 1 ? "" : "s"
                      } for this cycle.`
                    : budgetDepartmentName
                      ? `Department scope: ${budgetDepartmentName}.`
                      : "Loaded with cycle context — department rows follow assignment."}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[#475569]">
                  <span>
                    Due{" "}
                    <span className="font-medium text-[#0f172a]">
                      {budgetDueDate
                        ? new Date(budgetDueDate + "T12:00:00Z").toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            timeZone: "UTC",
                          })
                        : "Due date pending"}
                    </span>
                  </span>
                  <span>
                    Validation{" "}
                    <span
                      className={cn(
                        "font-medium",
                        validationPanelItems.length ? "text-[#b45309]" : "text-[#0f172a]",
                      )}
                    >
                      {validationPanelItems.length}
                    </span>
                  </span>
                </div>
                {budgetSubmitUnmet.length > 0 && (
                  <div className="mt-2 rounded-md border border-[#fed7aa] bg-[#fff7ed] px-3 py-2">
                    <p className="text-[11px] text-[#9a3412]">
                      Cannot submit. {budgetSubmitUnmet.length}{" "}
                      {budgetSubmitUnmet.length === 1
                        ? "requirement remains"
                        : "requirements remain"}
                      .{" "}
                      <button
                        type="button"
                        className="font-semibold text-[#c2410c] underline underline-offset-2"
                        onClick={focusValidationMessages}
                      >
                        View in Validation Messages
                      </button>
                    </p>
                  </div>
                )}
                {canSubmitTask && submitTaskId ? (
                  <textarea
                    className="mt-2 w-full min-h-[52px] rounded-md border border-[#e2e8f0] px-2.5 py-2 text-[11px] text-[#0f172a] placeholder:text-[#94a3b8]"
                    placeholder="Change notes (what changed vs prior)…"
                    value={changeNotesDraft}
                    onChange={(e) => setChangeNotesDraft(e.target.value)}
                  />
                ) : null}
              </div>
              <button
                type="button"
                className={TOOL_BTN_PRIMARY}
                disabled={
                  anyBusy ||
                  loading ||
                  !submitTaskId ||
                  !canSubmitTask ||
                  budgetSubmitUnmet.length > 0
                }
                title={
                  budgetSubmitUnmet.length
                    ? `${budgetSubmitUnmet.length} requirements remain`
                    : submitTaskId
                      ? "Submit owner task"
                      : "No open workflow task"
                }
                onClick={async () => {
                  if (!submitTaskId || budgetSubmitUnmet.length) {
                    if (budgetSubmitUnmet.length) focusValidationMessages()
                    return
                  }
                  setBusyKey("submit")
                  try {
                    const res = await fpaApi.submitTask(submitTaskId, {
                      changeNotes: changeNotesDraft.trim() || undefined,
                    })
                    if (!res.success) throw new Error(res.message || "Submit failed")
                    toast.success("Task submitted")
                    setChangeNotesDraft("")
                    setBoundTaskId(null)
                    setOwnerCanSubmit(false)
                    setOwnerUnmet([])
                  } catch (err) {
                    const code = (err as { response?: { code?: string } })?.response?.code
                    const apiErrs = (
                      err as { response?: { errors?: Array<{ message?: string }> } }
                    )?.response?.errors
                    if (code === "SUBMISSION_BLOCKED" && Array.isArray(apiErrs) && apiErrs.length) {
                      setOwnerUnmet(apiErrs.map((e) => e.message || "Requirement unmet"))
                      setOwnerCanSubmit(false)
                      focusValidationMessages()
                      toast.error(
                        `Cannot submit. ${apiErrs.length} requirement${
                          apiErrs.length === 1 ? "" : "s"
                        } remain.`,
                      )
                    } else {
                      toast.error(errorMessage(err))
                    }
                  } finally {
                    setBusyKey(null)
                  }
                }}
              >
                {isBusy("submit") ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                Submit
              </button>
            </div>
          </div>
        )}

        {/* Toolbar — not a card */}
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={TOOL_BTN}
              disabled={anyBusy || loading || !canEditGrid}
              title="Import prior-year GL/actual figures into this sheet"
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
              className={TOOL_BTN}
              disabled={anyBusy || loading || !canExportBoardPack}
              title="Queue a management report export"
              onClick={() => void onExport()}
            >
              {isBusy("export") ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              Export
            </button>
            <button
              type="button"
              className={TOOL_BTN}
              disabled={anyBusy || loading || !canEditGrid}
              title="Copy prior period into later months"
              onClick={() => void runTool("copy")}
            >
              {isBusy("copy") ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              Copy Forward
            </button>
            <button
              type="button"
              className={TOOL_BTN}
              disabled={anyBusy || loading || !canEditGrid}
              title="Spread annual total evenly across periods"
              onClick={() => void runTool("spread")}
            >
              {isBusy("spread") ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LayoutGrid className="w-3.5 h-3.5" />
              )}
              Spread
              <ChevronDown className="w-3 h-3 text-[#94a3b8]" />
            </button>
            <div className="relative">
              <button
                type="button"
                className={TOOL_BTN}
                disabled={anyBusy || loading || !canEditGrid || !selected}
                title="Percentage increase from the selected period forward"
                onClick={() => {
                  setBulkOpen(false)
                  setGrowthOpen((v) => !v)
                }}
              >
                {isBusy("growth") ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <TrendingUp className="w-3.5 h-3.5" />
                )}
                Apply Growth
                <ChevronDown className="w-3 h-3 text-[#94a3b8]" />
              </button>
              {growthOpen && (
                <div className="absolute left-0 top-full z-20 mt-1 w-56 rounded-md border border-[#e2e8f0] bg-white p-2 shadow-md">
                  <label className="text-[11px] text-[#64748b]">Rate %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={growthRate}
                    onChange={(e) => setGrowthRate(e.target.value)}
                    className="mt-1 h-8 w-full rounded-md border border-[#e2e8f0] px-2 text-xs"
                  />
                  <button
                    type="button"
                    className="mt-2 h-8 w-full rounded-md bg-[#2563eb] text-xs font-medium text-white disabled:opacity-50"
                    disabled={anyBusy || !selected}
                    onClick={() => void runTool("growth")}
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                className={TOOL_BTN}
                disabled={anyBusy || loading || !canEditGrid || !selected}
                title="Server-validated bulk cell operations"
                onClick={() => {
                  setGrowthOpen(false)
                  setBulkOpen((v) => !v)
                }}
              >
                {busyKey?.startsWith("bulk:") ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <MoreVertical className="w-3.5 h-3.5" />
                )}
                Bulk
                <ChevronDown className="w-3 h-3 text-[#94a3b8]" />
              </button>
              {bulkOpen && (
                <div className="absolute left-0 top-full z-20 mt-1 w-56 rounded-md border border-[#e2e8f0] bg-white py-1 shadow-md">
                  {(
                    [
                      ["FILL_RIGHT", "Fill right"],
                      ["FILL_DOWN", "Fill down"],
                      ["COPY_PRIOR_PERIOD", "Copy prior period"],
                      ["COPY_PRIOR_YEAR", "Copy prior year"],
                      ["PERCENT_INCREASE", `% increase (${growthRate}%)`],
                      ["PERCENT_DECREASE", `% decrease (${growthRate}%)`],
                      ["CLEAR_EDITABLE", "Clear editable"],
                    ] as const
                  ).map(([op, label]) => (
                    <button
                      key={op}
                      type="button"
                      className="w-full px-3 py-1.5 text-left text-xs text-[#0f172a] hover:bg-[#f8fafc]"
                      onClick={() => void runBulkOp(op)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {inBudgetContext && (
            <button
              type="button"
              className={TOOL_BTN_PRIMARY}
              disabled={
                anyBusy ||
                loading ||
                !submitTaskId ||
                !canSubmitTask ||
                (inBudgetContext && budgetSubmitUnmet.length > 0)
              }
              title={
                inBudgetContext && budgetSubmitUnmet.length
                  ? `Cannot submit — ${budgetSubmitUnmet.length} requirements remain`
                  : submitTaskId
                    ? "Submit open workflow task"
                    : "No open workflow task for this model"
              }
              onClick={async () => {
                if (!submitTaskId) return
                if (inBudgetContext && budgetSubmitUnmet.length) {
                  focusValidationMessages()
                  toast.error(
                    `Cannot submit. ${budgetSubmitUnmet.length} requirements remain.`,
                  )
                  return
                }
                setBusyKey("submit")
                try {
                  const res = await fpaApi.submitTask(submitTaskId, {
                    changeNotes: changeNotesDraft.trim() || undefined,
                  })
                  if (!res.success) throw new Error(res.message || "Submit failed")
                  toast.success("Task submitted")
                  setChangeNotesDraft("")
                  setBoundTaskId(null)
                  if (inBudgetContext) {
                    setOwnerCanSubmit(false)
                    setOwnerUnmet([])
                  }
                } catch (err) {
                  const code = (err as { response?: { code?: string } })?.response?.code
                  const apiErrs = (
                    err as { response?: { errors?: Array<{ message?: string }> } }
                  )?.response?.errors
                  if (code === "SUBMISSION_BLOCKED" && Array.isArray(apiErrs) && apiErrs.length) {
                    setOwnerUnmet(apiErrs.map((e) => e.message || "Requirement unmet"))
                    setOwnerCanSubmit(false)
                    toast.error(
                      `Cannot submit. ${apiErrs.length} requirement${
                        apiErrs.length === 1 ? "" : "s"
                      } remain.`,
                    )
                  } else {
                    toast.error(errorMessage(err))
                  }
                } finally {
                  setBusyKey(null)
                }
              }}
            >
              {isBusy("submit") ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              Submit
            </button>
            )}
            <div className="relative">
              <button
                type="button"
                className={TOOL_BTN}
                disabled={!selected}
                title="Add a comment on the selected cell"
                onClick={() => {
                  setCommentOpen((v) => !v)
                  setDetailsOpen(true)
                }}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Add Comment
              </button>
              {commentOpen && selected && (
                <div className="absolute left-0 top-full z-20 mt-1 w-64 rounded-md border border-[#e2e8f0] bg-white p-2 shadow-md">
                  <textarea
                    value={commentDraft}
                    onChange={(e) => setCommentDraft(e.target.value)}
                    rows={3}
                    placeholder="Write a comment…"
                    className="w-full rounded-md border border-[#e2e8f0] px-2 py-1.5 text-xs"
                  />
                  <button
                    type="button"
                    className="mt-2 h-8 w-full rounded-md bg-[#2563eb] text-xs font-medium text-white disabled:opacity-50"
                    disabled={anyBusy || !commentDraft.trim()}
                    onClick={() => void submitComment()}
                  >
                    {isBusy("comment") ? "Saving…" : "Post comment"}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-[#64748b]">View</span>
              <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                <SelectTrigger className={SELECT_TRIGGER}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-md">
                  <SelectItem value="amounts" className="text-xs">
                    $ Amounts
                  </SelectItem>
                  <SelectItem value="thousands" className="text-xs">
                    $ Thousands
                  </SelectItem>
                  <SelectItem value="pct_change" className="text-xs">
                    % MoM Change
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-[#64748b]">Display</span>
              <Select value={displayMode} onValueChange={(v) => setDisplayMode(v as DisplayMode)}>
                <SelectTrigger className={cn(SELECT_TRIGGER, "w-[8.5rem]")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-md">
                  <SelectItem value="monthly" className="text-xs">
                    Monthly
                  </SelectItem>
                  <SelectItem value="quarterly" className="text-xs">
                    Quarterly
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <button
              type="button"
              className={cn(TOOL_BTN, "px-2")}
              title={detailsOpen ? "Hide cell details" : "Show cell details"}
              onClick={() => setDetailsOpen((v) => !v)}
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {!selectedVersionId || !selectedScenarioId ? (
          <div className={cn(CARD, "p-8 text-sm text-[#64748b]")}>
            Select a version and scenario in the header, or open a model that has defaults.
          </div>
        ) : loading ? (
          <div className={cn(CARD, "flex items-center justify-center gap-2 py-16 text-[#64748b]")}>
            <Loader2 className="w-5 h-5 animate-spin" /> Loading grid…
          </div>
        ) : (
          <>
            {/* Grid + details side-by-side; validation under grid — cards never touch */}
            <div className="flex flex-col sm:flex-row gap-3 items-start min-h-0">
              <div className="flex-1 min-w-0 w-full flex flex-col gap-3">
                <div className={cn(CARD, "overflow-hidden")}>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-[#e2e8f0] bg-[#f8fafc] px-3 py-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-[#94a3b8]">
                      Cell states
                    </span>
                    {(
                      [
                        "INPUT",
                        "ACTUAL",
                        "CALCULATED",
                        "LOCKED",
                        "IMPORTED",
                      ] as CellState[]
                    ).map((st) => {
                      const { label, Icon, hint } = cellStateMeta(st)
                      const editable = st === "INPUT"
                      return (
                        <span
                          key={st}
                          className="inline-flex items-center gap-1 text-[11px] text-[#475569]"
                          title={hint}
                        >
                          <Icon className="h-3 w-3 shrink-0 text-[#64748b]" aria-hidden />
                          <span className="font-medium text-[#0f172a]">{label}</span>
                          <span className="text-[#94a3b8]">
                            {editable ? "editable" : "read-only"}
                          </span>
                        </span>
                      )
                    })}
                  </div>
                  <div className="overflow-x-auto max-h-[min(520px,55vh)] overflow-y-auto">
                    <table className="w-full text-xs min-w-[960px] border-collapse">
                      <thead>
                        <tr>
                          <th
                            rowSpan={2}
                            className="sticky left-0 top-0 z-[3] bg-white text-left px-3 py-2 font-medium text-[#64748b] min-w-[200px] border-b border-[#e2e8f0]"
                          >
                            Line item
                          </th>
                          {displayMode === "monthly" && actualPeriods.length > 0 && (
                            <th
                              colSpan={actualPeriods.length}
                              className="sticky top-0 z-[2] px-2 py-1.5 text-center text-[10px] font-semibold tracking-wider text-[#64748b] bg-[#f1f5f9] border-b border-[#e2e8f0]"
                            >
                              ACTUALS
                            </th>
                          )}
                          {displayMode === "monthly" && forecastPeriods.length > 0 && (
                            <th
                              colSpan={forecastPeriods.length}
                              className="sticky top-0 z-[2] px-2 py-1.5 text-center text-[10px] font-semibold tracking-wider text-[#2563eb] bg-[#dbeafe]/70 border-b border-[#e2e8f0]"
                            >
                              FORECAST
                            </th>
                          )}
                          {visibleAggCols.map((c) => (
                            <th
                              key={c.key}
                              rowSpan={2}
                              className="sticky top-0 z-[2] px-2 py-2 font-medium text-right text-[#64748b] whitespace-nowrap border-b border-l border-[#e2e8f0] bg-[#f8fafc]"
                            >
                              {c.label}
                            </th>
                          ))}
                        </tr>
                        {displayMode === "monthly" && (
                          <tr className="border-b border-[#e2e8f0]">
                            {visibleMonthCols.map((p) => (
                              <th
                                key={p.key}
                                className={cn(
                                  "sticky top-[28px] z-[2] px-2 py-2 font-medium text-right whitespace-nowrap",
                                  p.band === "ACTUAL"
                                    ? "text-[#64748b] bg-[#f8fafc]"
                                    : "text-[#2563eb] bg-[#eff6ff]/60",
                                )}
                              >
                                {p.label}
                              </th>
                            ))}
                          </tr>
                        )}
                      </thead>
                      <tbody>
                        {visibleRows.map(({ row, depth, hasChildren }) => {
                          const expanded = !collapsedIds.has(row.id)
                          return (
                            <tr
                              key={row.id}
                              ref={(el) => {
                                if (el) rowRefs.current.set(row.id, el)
                                else rowRefs.current.delete(row.id)
                              }}
                              className={cn(focusLineId === row.id && "bg-[#eff6ff]/60")}
                            >
                              <td className="sticky left-0 z-[1] bg-white px-2 py-1.5 border-b border-[#f1f5f9]">
                                <div
                                  className="flex items-start gap-1"
                                  style={{ paddingLeft: depth * 12 }}
                                >
                                  <button
                                    type="button"
                                    className="mt-0.5 h-5 w-5 shrink-0 inline-flex items-center justify-center text-[#94a3b8] hover:text-[#475569]"
                                    aria-label={expanded ? "Collapse" : "Expand"}
                                    onClick={() => {
                                      if (hasChildren) toggleRow(row.id)
                                    }}
                                  >
                                    {hasChildren && expanded ? (
                                      <ChevronDown className="w-3.5 h-3.5" />
                                    ) : (
                                      <ChevronRight className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                  <div className="min-w-0">
                                    <div className="font-medium text-[#0f172a] leading-tight">
                                      {row.name}
                                    </div>
                                    <div className="text-[10px] text-[#94a3b8] mt-0.5">
                                      {unitSubtitle(row)}
                                    </div>
                                  </div>
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
                                    className="px-2 py-2 text-right tabular-nums text-[#0f172a] font-medium border-b border-l border-[#f1f5f9] bg-[#fafafa]"
                                  >
                                    {formatViewValue(sum, viewMode, priorSum)}
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

                {/* Validation under grid */}
                <div className={CARD} ref={validationSectionRef}>
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-4 py-3 text-left"
                    onClick={() => setValidationOpen((v) => !v)}
                  >
                    <span className="text-sm font-semibold text-[#0f172a]">
                      Validation Messages
                    </span>
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#2563eb] px-1.5 text-[10px] font-semibold text-white">
                      {validationPanelItems.length}
                    </span>
                    <span className="ml-auto text-[#94a3b8]">
                      {validationOpen ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </span>
                  </button>
                  {validationOpen && (
                    <div className="px-4 pb-3">
                      {validationPanelItems.length === 0 ? (
                        <p className="text-[12px] text-[#94a3b8] py-2 border-t border-[#f1f5f9]">
                          No validation messages from the API.
                        </p>
                      ) : (
                        <ul className="divide-y divide-[#f1f5f9] border-t border-[#f1f5f9]">
                          {validationPanelItems.map((item) => {
                            const tone = item.tone
                            return (
                              <li
                                key={item.key}
                                className="flex flex-wrap items-center gap-3 py-2.5 text-[12px]"
                              >
                                {tone === "warning" ? (
                                  <AlertTriangle className="w-4 h-4 text-[#d97706] shrink-0" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-[#dc2626] shrink-0" />
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-[#0f172a]">{item.title}</p>
                                  <p className="text-[#64748b] mt-0.5">{item.message}</p>
                                </div>
                                <span
                                  className={cn(
                                    "font-medium shrink-0",
                                    tone === "warning" ? "text-[#d97706]" : "text-[#dc2626]",
                                  )}
                                >
                                  {tone === "warning" ? "Warning" : "Error"}
                                </span>
                                {(item.field || item.lineItemId) && (
                                  <button
                                    type="button"
                                    className="text-[#2563eb] font-medium shrink-0"
                                    onClick={() => {
                                      const key = String(item.field || item.lineItemId)
                                      const match = rows.find(
                                        (r) =>
                                          r.code === key ||
                                          r.id === key ||
                                          r.name.toLowerCase() === key.toLowerCase(),
                                      )
                                      if (match) setFocusLineId(match.id)
                                    }}
                                  >
                                    Go to row
                                  </button>
                                )}
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {detailsOpen && (
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
                      className="text-[#94a3b8] p-1 rounded-md hover:bg-[#f1f5f9]"
                      aria-label="Close"
                      onClick={() => setDetailsOpen(false)}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {selected ? (
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
                  ) : (
                    <p className="p-4 text-xs text-[#94a3b8]">Select a cell to see details.</p>
                  )}
                </aside>
              )}
            </div>
          </>
        )}
          </div>
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
