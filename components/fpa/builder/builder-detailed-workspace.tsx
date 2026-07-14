"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Columns3,
  Database,
  Filter,
  Grid3X3,
  History,
  Info,
  Pencil,
  Play,
  Plus,
  Search,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type {
  FpaBuilderModule,
  FpaFormulaImpactNode,
  FpaLineItem,
  FpaModel,
} from "@/lib/api/fpa-api"
import {
  apiModulesToFolders,
  HARDCODED_MODULE_FOLDERS,
  type SelectedModuleLeaf,
} from "./builder-modules-tree"
import type { BuilderValidationState } from "./builder-header"
import {
  buildDetailedRows,
  impactNodeNames,
  type DetailedAuditRow,
  type DetailedCellMeta,
  type DetailedExceptionRow,
  type DetailedMappingRow,
  type DetailedSensitivityView,
  type DetailedTraceView,
  type DetailedValidationCheck,
  type DetailedWorkspaceRow,
} from "@/lib/fpa/detailed-workspace-adapters"
import { logFpaGap } from "@/lib/fpa/fpa-api-gaps"

type WorkspaceRow = DetailedWorkspaceRow

const MONTHS = [
  "Jan '26",
  "Feb '26",
  "Mar '26",
  "Apr '26",
  "May '26",
  "Jun '26",
  "Jul '26",
  "Aug '26",
  "Sep '26",
  "Oct '26",
  "Nov '26",
  "Dec '26",
]

/** Exact SRD Line Item Builder mock — always shown in Detailed workspace. */
const PNL_FORECAST: WorkspaceRow[] = [
  {
    id: "starting-arr",
    name: "Starting ARR",
    kind: "INPUT",
    formula: "—",
    values: [
      125000, 126180, 127380, 128600, 129840, 131100, 132380, 133680, 135000, 136200, 137500, 139459,
    ],
    fy: 1581319,
    format: "currency",
  },
  {
    id: "new-bookings",
    name: "New Bookings",
    kind: "INPUT",
    formula: "—",
    values: [8500, 9000, 9500, 10000, 10500, 11000, 11500, 12000, 12500, 13000, 14500, 15500],
    fy: 138500,
    format: "currency",
  },
  {
    id: "churn",
    name: "Churn",
    kind: "INPUT",
    formula: "—",
    values: [-1250, -1300, -1350, -1400, -1450, -1500, -1550, -1600, -1650, -1700, -1750, -2014],
    fy: -18514,
    format: "currency",
  },
  {
    id: "net-arr",
    name: "Net ARR",
    kind: "CALCULATED",
    formula: "=[Starting ARR] + [New Bookings] + [Churn]",
    values: [
      132250, 133880, 135530, 137200, 138890, 140600, 142330, 144080, 145850, 147500, 150250, 152945,
    ],
    fy: 1699310,
    format: "currency",
  },
  {
    id: "payroll-expense",
    name: "Payroll Expense",
    kind: "CALCULATED",
    formula: "=[Headcount] * [Avg Fully Burdened Cost]",
    values: [3492, 3550, 3600, 3650, 3700, 3750, 3800, 3850, 3900, 3950, 4000, 3481],
    fy: 44723,
    format: "currency",
  },
  {
    id: "marketing-spend",
    name: "Marketing Spend",
    kind: "INPUT",
    formula: "—",
    values: [1250, 1300, 1350, 1400, 1450, 1500, 1550, 1600, 1650, 1450, 1520, 1530],
    fy: 17550,
    format: "currency",
  },
  {
    id: "ebitda",
    name: "EBITDA",
    kind: "CALCULATED",
    formula: "=[Net ARR] - [Payroll Expense] - [Marketing Spend]",
    values: [
      127508, 129030, 130580, 132150, 133740, 135350, 136980, 138630, 140300, 142100, 144730, 147934,
    ],
    fy: 1637037,
    format: "currency",
  },
  {
    id: "cash-balance",
    name: "Cash Balance",
    kind: "CALCULATED",
    formula: "= PREV([Cash Balance]) + [EBITDA] - [CapEx]",
    values: [52340, 68520, 86200, 105400, 126200, 148600, 172700, 198500, 226000, 255400, 286900, 320774],
    fy: 692734,
    format: "currency",
  },
]

function rowsForWorkspace(_leafId?: string | null): WorkspaceRow[] {
  return PNL_FORECAST.map((r) => ({ ...r, values: [...r.values] }))
}

function formatCell(v: number, format?: WorkspaceRow["format"]) {
  if (format === "percent") return `${(v * 100).toFixed(1)}%`
  const neg = v < 0
  const abs = Math.abs(v)
  const s = abs.toLocaleString("en-US", { maximumFractionDigits: 0 })
  return neg ? `(${s})` : s
}

function FormulaHighlight({
  formula,
  accent = "blue",
}: {
  formula: string
  accent?: "blue" | "purple"
}) {
  if (!formula || formula === "Input" || formula === "—") {
    return <span className="text-[#94a3b8]">—</span>
  }
  const refClass = accent === "purple" ? "text-[#7c3aed] font-medium" : "text-[#475569]"
  const parts = formula.split(/(\[[^\]]+\])/g)
  return (
    <span className="font-mono text-[12px] text-[#334155]">
      {parts.map((p, i) =>
        p.startsWith("[") ? (
          <span key={i} className={refClass}>
            {p}
          </span>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </span>
  )
}

const DEMO_MAPPINGS = [
  { source: "CSV.PAYROLL_EXPENSE", system: "Custom / CSV", target: "Payroll Expense", ok: true },
  { source: "GL_ACCOUNT.6100", system: "Accounting GL", target: "Marketing Spend", ok: true },
  { source: "CRM.NEW_BOOKINGS", system: "CRM", target: "New Bookings", ok: true },
  { source: "PR.HEADCOUNT", system: "Payroll", target: "Headcount", ok: true },
  { source: "BANK.CASH_BALANCE", system: "Banking", target: "Cash Balance", ok: true },
  { source: "PROC.PO_AMOUNT", system: "Procurement", target: "Other Operating Expense", ok: false },
  { source: "MANUAL.RD_DRIVER", system: "Manual", target: "R&D Expense", ok: false },
]

const DEMO_AUDIT = [
  { id: "a1", time: "May 12, 2026 9:12 AM", user: "Michael Chen", action: "Updated Formula", details: "EBITDA" },
  { id: "a2", time: "May 12, 2026 8:47 AM", user: "Sarah Delgado", action: "Updated Mapping", details: "Payroll Expense" },
  { id: "a3", time: "May 11, 2026 4:22 PM", user: "James Okonkwo", action: "Added Line Item", details: "Cash Balance" },
  { id: "a4", time: "May 11, 2026 11:05 AM", user: "Priya Shah", action: "Updated Driver", details: "Churn" },
  { id: "a5", time: "May 10, 2026 2:38 PM", user: "Michael Chen", action: "Validated Module", details: "Revenue & P&L" },
  { id: "a6", time: "May 9, 2026 10:15 AM", user: "Sarah Delgado", action: "Imported Data", details: "Custom / CSV" },
]

const AUDIT_AVATAR_COLORS: Record<string, { bg: string; text: string }> = {
  MC: { bg: "#dbeafe", text: "#1d4ed8" },
  SD: { bg: "#dcfce7", text: "#15803d" },
  JO: { bg: "#ede9fe", text: "#6d28d9" },
  PS: { bg: "#fce7f3", text: "#be185d" },
}

function auditInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

const DEMO_EXCEPTIONS = [
  { id: "e1", sev: "error" as const, lineItem: "R&D Expense", issue: "Missing required mapping", impact: "High" as const },
  { id: "e2", sev: "error" as const, lineItem: "Other Operating Expense", issue: "Source field not found in source system", impact: "High" as const },
  { id: "w1", sev: "warning" as const, lineItem: "Churn", issue: "Driver has no data for Dec '26", impact: "Medium" as const },
  { id: "w2", sev: "warning" as const, lineItem: "CapEx", issue: "Formula references missing precedent", impact: "Medium" as const },
  { id: "w3", sev: "warning" as const, lineItem: "Marketing Spend", issue: "Stale driver — not updated in 45 days", impact: "Medium" as const },
  { id: "w4", sev: "warning" as const, lineItem: "Payroll Expense", issue: "Negative value detected in Apr '26", impact: "Low" as const },
  { id: "w5", sev: "warning" as const, lineItem: "Gross Margin", issue: "Division risk when Net Revenue = 0", impact: "Medium" as const },
  { id: "w6", sev: "warning" as const, lineItem: "FX Rate", issue: "Fallback FX rate applied (EUR→USD)", impact: "Low" as const },
  { id: "w7", sev: "warning" as const, lineItem: "Avg Fully Burdened Cost", issue: "Mapping type mismatch (Currency vs Number)", impact: "Low" as const },
  { id: "i1", sev: "info" as const, lineItem: "Cash Balance", issue: "Circular reference detected", impact: "Low" as const },
  { id: "i2", sev: "info" as const, lineItem: "Units & Pricing", issue: "Template applied — SaaS Revenue Pack", impact: "Low" as const },
  { id: "i3", sev: "info" as const, lineItem: "Net ARR", issue: "Last calculated May 12, 2026 9:12 AM", impact: "Low" as const },
  { id: "i4", sev: "info" as const, lineItem: "Model", issue: "Calc queue idle — no pending jobs", impact: "Low" as const },
]

type ExcTab = "errors" | "warnings" | "info" | null

const VALIDATION_SUMMARY = { total: 13, passed: 9, warnings: 3, errors: 1 }

const DEMO_VALIDATION_CHECKS = [
  { id: "v1", check: "Formula syntax validation", status: "passed" as const, module: "Revenue & P&L" },
  { id: "v2", check: "Circular reference scan", status: "passed" as const, module: "Cash Balance" },
  { id: "v3", check: "Driver data completeness", status: "passed" as const, module: "Units & Pricing" },
  { id: "v4", check: "Period alignment", status: "passed" as const, module: "Model" },
  { id: "v5", check: "FX rate availability", status: "passed" as const, module: "Treasury" },
  { id: "v6", check: "Module dependency graph", status: "passed" as const, module: "Revenue & P&L" },
  { id: "v7", check: "Aggregation consistency", status: "passed" as const, module: "Payroll" },
  { id: "v8", check: "Template version match", status: "passed" as const, module: "Units & Pricing" },
  { id: "v9", check: "Calc engine readiness", status: "passed" as const, module: "Model" },
  { id: "v10", check: "Missing required mapping", status: "error" as const, module: "R&D Expense" },
  { id: "v11", check: "Stale driver data", status: "warning" as const, module: "Marketing Spend" },
  { id: "v12", check: "Negative value detected", status: "warning" as const, module: "Churn" },
  { id: "v13", check: "Mapping type mismatch", status: "warning" as const, module: "Avg Fully Burdened Cost" },
]

type DetailModalKind = "mappings" | "audit" | "exceptions" | "validation" | null

type Props = {
  model: FpaModel | null
  leaf: SelectedModuleLeaf | null
  validation: BuilderValidationState
  canEdit: boolean
  onBack: () => void
  onOpenHistory: () => void
  onOpenModelSettings?: () => void
  onTestCalc: () => void
  onPublish?: () => void
  /** True when model/version is already published — keep Publish disabled. */
  publishDisabled?: boolean
  modelPublished?: boolean
  onLeafChange: (leaf: SelectedModuleLeaf) => void
  onSelectRow?: (row: { id: string; name: string; formula: string; kind: "INPUT" | "CALCULATED" }) => void
  lineItems?: FpaLineItem[]
  apiModules?: FpaBuilderModule[]
  periodLabels?: string[]
  periodKeys?: string[]
  previewByLine?: Record<string, Array<number | null>>
  fyTotals?: Record<string, number> | null
  gridGrain?: "monthly" | "quarterly" | "annual"
  onGridGrainChange?: (grain: "monthly" | "quarterly" | "annual") => void
  selectedLineItemId?: string | null
  auditRows?: DetailedAuditRow[]
  exceptionRows?: DetailedExceptionRow[]
  validationSummary?: { total: number; passed: number; warnings: number; errors: number }
  validationChecks?: DetailedValidationCheck[]
  mappingRows?: DetailedMappingRow[]
  mappedPct?: number
  mappingsInferred?: boolean
  sensitivity?: DetailedSensitivityView | null
  cellMeta?: DetailedCellMeta | null
  cellTrace?: DetailedTraceView | null
  formulaImpact?: {
    precedents?: FpaFormulaImpactNode[]
    dependents?: FpaFormulaImpactNode[]
  } | null
  onCellCommit?: (lineItemId: string, periodIndex: number, value: number) => void
  onFormulaCommit?: (lineItemId: string, expression: string) => void
  onAddLineItem?: () => void
  onOpenCreateMapping?: (defaults?: { targetLineItemId?: string }) => void
  onEditMapping?: (row: DetailedMappingRow) => void
  onRefreshMappings?: () => void
  onSeedMappingCatalog?: () => void
  onImportSourceFile?: () => void
  onRunSensitivity?: (driverLineItemId: string, shockPct: number) => void
  onValidate?: () => void
}

export function BuilderDetailedWorkspace({
  model,
  leaf,
  validation,
  canEdit,
  onBack,
  onOpenHistory,
  onOpenModelSettings,
  onTestCalc,
  onPublish,
  publishDisabled = false,
  modelPublished = false,
  onLeafChange,
  onSelectRow,
  lineItems = [],
  apiModules = [],
  periodLabels = [],
  periodKeys = [],
  previewByLine = {},
  fyTotals = null,
  gridGrain,
  onGridGrainChange,
  selectedLineItemId,
  auditRows,
  exceptionRows,
  validationSummary,
  validationChecks,
  mappingRows,
  mappedPct: mappedPctProp,
  mappingsInferred = false,
  sensitivity,
  cellMeta = null,
  cellTrace = null,
  formulaImpact,
  onCellCommit,
  onFormulaCommit,
  onAddLineItem,
  onOpenCreateMapping,
  onEditMapping,
  onRefreshMappings,
  onSeedMappingCatalog,
  onImportSourceFile,
  onRunSensitivity,
  onValidate,
}: Props) {
  const useLiveGrid = lineItems.length > 0 && periodLabels.length > 0
  const monthHeaders = useLiveGrid ? periodLabels : MONTHS

  const liveRows = useMemo(
    () =>
      useLiveGrid
        ? buildDetailedRows(lineItems, monthHeaders.length, previewByLine, fyTotals)
        : rowsForWorkspace(leaf?.leafId),
    [useLiveGrid, lineItems, monthHeaders.length, previewByLine, fyTotals, leaf?.leafId],
  )

  const [rows, setRows] = useState<WorkspaceRow[]>(() => liveRows)
  const [selectedId, setSelectedId] = useState<string>(() => {
    if (selectedLineItemId) return selectedLineItemId
    const prefer = liveRows.find((r) => r.kind === "CALCULATED") || liveRows[0]
    return prefer?.id || "ebitda"
  })
  const [showHidden, setShowHidden] = useState(false)
  const grainFromProp =
    gridGrain === "quarterly" ? "Quarterly" : gridGrain === "annual" ? "Annual" : "Monthly"
  const [grain, setGrain] = useState<"Monthly" | "Quarterly" | "Annual">(grainFromProp)
  const [gridView, setGridView] = useState<"grid" | "columns" | "filter">("grid")
  const [editing, setEditing] = useState<{ rowId: string; col: number | "formula" } | null>(null)
  const [draft, setDraft] = useState("")
  const [excTab, setExcTab] = useState<ExcTab>(null)
  const [excSelectedId, setExcSelectedId] = useState<string | null>(null)
  const [mapSystem, setMapSystem] = useState("All Sources")
  const [mapQ, setMapQ] = useState("")
  const [mapUnmappedOnly, setMapUnmappedOnly] = useState(false)
  const [mapSelectedSource, setMapSelectedSource] = useState<string | null>(null)
  const [auditSelectedId, setAuditSelectedId] = useState<string | null>(null)
  const [traceOpen, setTraceOpen] = useState(true)
  const [traceTab, setTraceTab] = useState<"summary" | "precedents" | "dependents" | "chain">(
    "summary",
  )
  const [focusExceptions, setFocusExceptions] = useState(false)
  const [detailModal, setDetailModal] = useState<DetailModalKind>(null)
  const [shockPct, setShockPct] = useState(5)

  useEffect(() => {
    if (gridGrain) {
      setGrain(
        gridGrain === "quarterly" ? "Quarterly" : gridGrain === "annual" ? "Annual" : "Monthly",
      )
    }
  }, [gridGrain])

  useEffect(() => {
    setRows(liveRows)
  }, [liveRows])

  useEffect(() => {
    if (!useLiveGrid) {
      logFpaGap({
        category: "missing",
        path: "/v1/fpa/models/:id/grid?moduleId=",
        method: "GET",
        message: "Detailed grid using demo P&L — no live line items or periods",
        impact: "Line Item Builder shows SRD mock instead of API values",
      })
    }
  }, [useLiveGrid])

  useEffect(() => {
    if (selectedLineItemId) setSelectedId(selectedLineItemId)
  }, [selectedLineItemId])

  useEffect(() => {
    if (selectedLineItemId) return
    const prefer =
      rows.find((r) => r.kind === "CALCULATED") ||
      rows[0]
    if (prefer && prefer.id !== selectedId) {
      setSelectedId(prefer.id)
      onSelectRow?.({
        id: prefer.id,
        name: prefer.name,
        formula: prefer.formula === "—" ? "" : prefer.formula,
        kind: prefer.kind,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed when rows first load
  }, [rows.length, useLiveGrid])

  const selected = rows.find((r) => r.id === selectedId) || rows[0]

  const moduleFolders = useMemo(
    () => (apiModules.length ? apiModulesToFolders(apiModules) : HARDCODED_MODULE_FOLDERS),
    [apiModules],
  )

  const leafOptions = useMemo(
    () =>
      moduleFolders.flatMap((f) =>
        f.children.map((c) => ({
          folderId: f.id,
          folderName: f.name,
          leafId: c.id,
          leafName: c.name,
          label: `${f.name} / ${c.name}`,
        })),
      ),
    [moduleFolders],
  )

  const auditData = auditRows ?? DEMO_AUDIT
  const exceptionData = exceptionRows ?? DEMO_EXCEPTIONS
  const valSummary = validationSummary ?? VALIDATION_SUMMARY
  const valChecks = validationChecks ?? DEMO_VALIDATION_CHECKS
  const mappingData: DetailedMappingRow[] =
    mappingRows ??
    DEMO_MAPPINGS.map((m, i) => ({
      id: `demo-${i}`,
      source: m.source,
      system: m.system,
      target: m.target,
      targetLineItemId: null,
      ok: m.ok,
      status: m.ok ? "MAPPED" : "UNMAPPED",
    }))

  const filteredMaps = mappingData.filter((m) => {
    if (mapSystem !== "All Sources" && m.system !== mapSystem) return false
    if (mapUnmappedOnly && m.ok) return false
    const q = mapQ.trim().toLowerCase()
    if (!q) return true
    return (
      m.source.toLowerCase().includes(q) ||
      m.target.toLowerCase().includes(q) ||
      m.system.toLowerCase().includes(q)
    )
  })
  const mappedPct =
    typeof mappedPctProp === "number"
      ? mappedPctProp
      : mappingData.length
        ? Math.round((mappingData.filter((m) => m.ok).length / mappingData.length) * 100)
        : 0

  const exceptions = exceptionData
  const excFiltered = (() => {
    if (excTab === "errors") return exceptions.filter((e) => e.sev === "error")
    if (excTab === "warnings") return exceptions.filter((e) => e.sev === "warning")
    if (excTab === "info") return exceptions.filter((e) => e.sev === "info")
    return exceptions.slice(0, 6)
  })()
  const errN = exceptions.filter((e) => e.sev === "error").length
  const warnN = exceptions.filter((e) => e.sev === "warning").length
  const infoN = exceptions.filter((e) => e.sev === "info").length
  const { total: totalChecks, passed, warnings: valWarnings, errors: valErrors } = valSummary

  const tracePrecedents = formulaImpact?.precedents?.length
    ? impactNodeNames(formulaImpact.precedents)
    : undefined
  const traceDependents = formulaImpact?.dependents?.length
    ? impactNodeNames(formulaImpact.dependents)
    : undefined

  const selectMappedRow = (row: DetailedMappingRow) => {
    setMapSelectedSource(row.source)
    const match =
      (row.targetLineItemId && rows.find((r) => r.id === row.targetLineItemId)) ||
      rows.find((r) => r.name === row.target)
    if (match) {
      selectRow(match)
    }
    if (canEdit && onEditMapping && !String(row.id).startsWith("suggested-")) {
      onEditMapping(row)
      return
    }
    if (match) {
      toast.message(`Selected ${row.target}`, {
        description: `${row.source} · ${row.system}`,
      })
    } else if (!row.ok) {
      toast.message(`${row.target} needs mapping`, {
        description: `${row.source} · ${row.system}`,
      })
    } else {
      toast.message(`Mapped: ${row.source} → ${row.target}`)
    }
  }

  const selectException = (entry: DetailedExceptionRow) => {
    setExcSelectedId(entry.id)
    const match =
      (entry.lineItemId && rows.find((r) => r.id === entry.lineItemId)) ||
      rows.find((r) => r.name === entry.lineItem)
    if (match) {
      selectRow(match)
      setTraceOpen(true)
    }
    toast.message(`${entry.lineItem}: ${entry.issue}`, {
      description: `${entry.impact} impact · ${entry.sev}`,
    })
  }

  const validatedLabel =
    validation.valid === true
      ? validation.warningCount
        ? `Validated · ${validation.warningCount} warn`
        : "Validated"
      : validation.valid === false
        ? `${validation.errorCount} errors`
        : "Validated"

  const publishBlocked =
    !onPublish || validation.valid === false || !canEdit || publishDisabled
  const publishTitle = !onPublish
    ? "Publish unavailable"
    : publishDisabled
      ? modelPublished
        ? "This model is already published"
        : "This version is already published or locked"
      : validation.valid === false
        ? "Fix validation errors before publish"
        : "Publish workspace version"

  const selectRow = (row: WorkspaceRow) => {
    setSelectedId(row.id)
    onSelectRow?.({
      id: row.id,
      name: row.name,
      formula: row.formula === "—" ? "" : row.formula,
      kind: row.kind,
    })
  }

  const startEditValue = (row: WorkspaceRow, col: number) => {
    if (!canEdit) return
    if (grain !== "Monthly") {
      toast.message("Switch to Monthly to edit period cells")
      return
    }
    selectRow(row)
    setEditing({ rowId: row.id, col })
    const v = row.values[col]
    setDraft(v == null ? "" : String(v))
  }

  const startEditFormula = (row: WorkspaceRow) => {
    if (!canEdit || row.kind !== "CALCULATED") return
    selectRow(row)
    setEditing({ rowId: row.id, col: "formula" })
    setDraft(row.formula === "—" ? "=" : row.formula)
  }

  const commitEdit = (rawValue?: string) => {
    if (!editing) return
    const { rowId, col } = editing
    if (col === "formula") {
      const next = String(rawValue ?? draft).trim() || "—"
      setRows((prev) =>
        prev.map((r) => (r.id === rowId ? { ...r, formula: next } : r)),
      )
      const row = rows.find((r) => r.id === rowId)
      if (row) {
        onSelectRow?.({
          id: row.id,
          name: row.name,
          formula: next === "—" ? "" : next,
          kind: row.kind,
        })
      }
      if (useLiveGrid && onFormulaCommit && next !== "—") {
        onFormulaCommit(rowId, next.startsWith("=") ? next : `=${next}`)
      }
      setEditing(null)
      return
    }
    const raw = String(rawValue ?? draft).trim()
    let value: number
    if (/^\(.*\)$/.test(raw)) {
      value = -Number(raw.slice(1, -1).replace(/,/g, ""))
    } else {
      value = Number(raw.replace(/,/g, ""))
    }
    if (!Number.isFinite(value)) {
      setEditing(null)
      return
    }
    const colIndex = typeof col === "number" ? col : -1
    if (useLiveGrid && onCellCommit && colIndex >= 0) {
      onCellCommit(rowId, colIndex, value)
    }
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r
        const values = [...r.values]
        values[colIndex] = value
        const fy = values.reduce((acc, v) => acc + (Number.isFinite(v) ? v : 0), 0)
        return { ...r, values, fy }
      }),
    )
    setEditing(null)
  }

  const cellBorder = "border-r border-[#e2e8f0]"

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#f8fafc] overflow-hidden">
      {/* Toolbar */}
      <div className="shrink-0 border-b border-[#e2e8f0] bg-white px-4 py-2.5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="h-8 inline-flex items-center gap-1.5 rounded-md border border-[#e2e8f0] bg-white px-2.5 text-[12px] font-medium text-[#475569] hover:bg-[#f8fafc]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Structure
        </button>

        <label className="relative inline-flex items-center gap-1.5 text-[12px] text-[#64748b]">
          <span className="sr-only">Module</span>
          <select
            className="h-8 appearance-none rounded-md border border-[#e2e8f0] bg-white pl-3 pr-8 text-[13px] font-semibold text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
            value={leaf?.leafId || ""}
            onChange={(e) => {
              const opt = leafOptions.find((o) => o.leafId === e.target.value)
              if (opt) {
                onLeafChange({
                  folderId: opt.folderId,
                  folderName: opt.folderName,
                  leafId: opt.leafId,
                  leafName: opt.leafName,
                })
              }
            }}
          >
            {leafOptions.map((o) => (
              <option key={o.leafId} value={o.leafId}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 w-3.5 h-3.5 text-[#94a3b8]" />
        </label>

        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#ecfdf5] px-2.5 py-1 text-[11px] font-medium text-[#166534]">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {validatedLabel}
          <span className="font-normal text-[#64748b]">as of May 12, 2026 9:12 AM</span>
        </div>

        <div className="flex-1" />

        <button
          type="button"
          onClick={() => {
            onTestCalc()
            toast.success("Calculation preview refreshed")
          }}
          className="h-8 inline-flex items-center gap-1.5 rounded-md border border-[#e2e8f0] bg-white px-3 text-[12px] font-medium text-[#2563eb] hover:bg-[#f8fafc]"
        >
          <Play className="w-3.5 h-3.5" />
          Test Calculation
        </button>
        <button
          type="button"
          onClick={onOpenHistory}
          className="h-8 inline-flex items-center gap-1.5 rounded-md border border-[#e2e8f0] bg-white px-3 text-[12px] font-medium text-[#2563eb] hover:bg-[#f8fafc]"
        >
          <History className="w-3.5 h-3.5" />
          Change History
        </button>
        {onOpenModelSettings ? (
          <button
            type="button"
            onClick={onOpenModelSettings}
            className="h-8 rounded-full border border-[#e2e8f0] bg-white px-3 text-[12px] font-medium text-[#334155] hover:bg-[#f8fafc]"
            title="Edit calendar and base currency"
          >
            Calendar
          </button>
        ) : null}
        <button
          type="button"
          disabled={publishBlocked}
          title={publishTitle}
          onClick={() => onPublish?.()}
          className="h-8 inline-flex items-center gap-1 rounded-full bg-[#2563eb] px-3 text-[12px] font-medium text-white shadow-sm hover:bg-[#1d4ed8] disabled:opacity-50"
        >
          Publish
          <ChevronDown className="w-3.5 h-3.5 opacity-80" />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto fpa-thin-scroll p-3 space-y-3">
        {/* Line Item Builder — hardcoded to SRD screenshot */}
        <section className="rounded-lg border border-[#e2e8f0] bg-white overflow-hidden">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[#e2e8f0] px-4 py-3">
            <div className="flex items-center gap-1.5 shrink-0">
              <h2 className="text-[15px] font-semibold text-[#0f172a] tracking-tight">
                Line Item Builder
              </h2>
              <button
                type="button"
                className="h-6 w-6 inline-flex items-center justify-center rounded text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#64748b]"
                aria-label="Edit builder title"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>

            <label className="inline-flex items-center gap-1.5 text-[12px] text-[#64748b]">
              View
              <select
                value={grain}
                onChange={(e) => {
                  const next = e.target.value as typeof grain
                  setGrain(next)
                  const apiGrain =
                    next === "Quarterly" ? "quarterly" : next === "Annual" ? "annual" : "monthly"
                  onGridGrainChange?.(apiGrain)
                }}
                className="h-8 rounded-md border border-[#e2e8f0] bg-white pl-2.5 pr-7 text-[12px] font-medium text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
              >
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Annual">Annual</option>
              </select>
            </label>

            <label className="inline-flex items-center gap-2 text-[12px] text-[#64748b] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showHidden}
                onChange={(e) => setShowHidden(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-[#cbd5e1] text-[#2563eb] focus:ring-[#2563eb]/30"
              />
              Show hidden
            </label>

            <div className="flex-1 min-w-[8px]" />

            <button
              type="button"
              disabled={!canEdit || !onAddLineItem}
              onClick={() => onAddLineItem?.()}
              className="h-8 inline-flex items-center gap-1.5 rounded-full bg-[#2563eb] px-3 text-[12px] font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-50 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Line Item
            </button>

            <div className="inline-flex items-center rounded-md border border-[#e2e8f0] overflow-hidden">
              <button
                type="button"
                onClick={() => setGridView("grid")}
                className={cn(
                  "h-8 w-8 inline-flex items-center justify-center",
                  gridView === "grid"
                    ? "bg-[#eff6ff] text-[#2563eb] ring-1 ring-inset ring-[#2563eb]"
                    : "text-[#64748b] hover:bg-[#f8fafc]",
                )}
                aria-label="Grid view"
                title="Grid view"
              >
                <Grid3X3 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setGridView("columns")}
                className={cn(
                  "h-8 w-8 inline-flex items-center justify-center border-l border-[#e2e8f0]",
                  gridView === "columns"
                    ? "bg-[#eff6ff] text-[#2563eb]"
                    : "text-[#64748b] hover:bg-[#f8fafc]",
                )}
                aria-label="Column layout"
                title="Column layout"
              >
                <Columns3 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setGridView("filter")}
                className={cn(
                  "h-8 w-8 inline-flex items-center justify-center border-l border-[#e2e8f0]",
                  gridView === "filter"
                    ? "bg-[#eff6ff] text-[#2563eb]"
                    : "text-[#64748b] hover:bg-[#f8fafc]",
                )}
                aria-label="Filter"
                title="Filter"
              >
                <Filter className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1280px] text-left border-collapse">
              <thead>
                <tr className="bg-[#f8fafc] text-[11px] text-[#64748b] border-b border-[#e2e8f0]">
                  <th
                    className={cn(
                      "sticky left-0 z-10 bg-[#f8fafc] px-3 py-2.5 font-medium min-w-[200px]",
                      cellBorder,
                    )}
                  >
                    Line Item
                  </th>
                  <th className={cn("px-3 py-2.5 font-medium w-[110px]", cellBorder)}>Type</th>
                  <th className={cn("px-3 py-2.5 font-medium min-w-[260px]", cellBorder)}>
                    Formula
                  </th>
                  {monthHeaders.map((m) => (
                    <th
                      key={m}
                      className={cn(
                        "px-2.5 py-2.5 font-medium text-right whitespace-nowrap",
                        cellBorder,
                      )}
                    >
                      {m}
                    </th>
                  ))}
                  <th className="px-3 py-2.5 font-semibold text-right whitespace-nowrap text-[#0f172a]">
                    FY2026
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const sel = row.id === selectedId
                  const isCalc = row.kind === "CALCULATED"
                  const editingFormula =
                    editing?.rowId === row.id && editing.col === "formula"
                  return (
                    <tr
                      key={row.id}
                      onClick={() => selectRow(row)}
                      className={cn(
                        "border-b border-[#e2e8f0] cursor-pointer text-[12px]",
                        sel ? "bg-[#f8fbff]" : "bg-white hover:bg-[#fafbfc]",
                      )}
                    >
                      <td
                        className={cn(
                          "sticky left-0 z-10 px-2 py-2",
                          cellBorder,
                          sel ? "bg-[#f8fbff]" : "bg-white",
                        )}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <ChevronRight className="w-3.5 h-3.5 text-[#cbd5e1] shrink-0" />
                          {isCalc ? (
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[#f3e8ff] text-[11px] font-bold text-[#7c3aed]">
                              Σ
                            </span>
                          ) : (
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[#eff6ff] text-[#2563eb]">
                              <BarChart3 className="w-3 h-3" />
                            </span>
                          )}
                          <span className="truncate font-medium text-[#0f172a]">{row.name}</span>
                        </div>
                      </td>
                      <td className={cn("px-3 py-2", cellBorder)}>
                        {isCalc ? (
                          <span className="inline-flex rounded-full bg-[#f3e8ff] px-2 py-0.5 text-[10px] font-medium text-[#6d28d9]">
                            Calculated
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-[#eff6ff] px-2 py-0.5 text-[10px] font-medium text-[#2563eb]">
                            Driver
                          </span>
                        )}
                      </td>
                      <td
                        className={cn("px-2 py-1 max-w-[280px]", cellBorder)}
                        onDoubleClick={(e) => {
                          e.stopPropagation()
                          startEditFormula(row)
                        }}
                      >
                        {editingFormula ? (
                          <input
                            autoFocus
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onBlur={(e) => commitEdit(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitEdit((e.target as HTMLInputElement).value)
                              if (e.key === "Escape") setEditing(null)
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full h-8 rounded border-2 border-[#2563eb] px-2 text-[11px] font-mono outline-none"
                          />
                        ) : (
                          <div
                            className={cn(
                              "truncate rounded px-1 py-1 min-h-[28px]",
                              isCalc && canEdit && "hover:bg-white cursor-text",
                            )}
                            title={isCalc && canEdit ? "Double-click to edit formula" : undefined}
                          >
                            <FormulaHighlight formula={row.formula} />
                          </div>
                        )}
                      </td>
                      {row.values.map((v, i) => {
                        const isEditing =
                          editing?.rowId === row.id && editing.col === i
                        const editable = canEdit && grain === "Monthly"
                        return (
                          <td
                            key={i}
                            className={cn(
                              "px-1.5 py-1 text-right tabular-nums whitespace-nowrap",
                              cellBorder,
                              !isEditing && (v < 0 ? "text-[#dc2626]" : "text-[#0f172a]"),
                              editable && "hover:bg-white/90",
                            )}
                            onDoubleClick={(e) => {
                              e.stopPropagation()
                              if (!editable) {
                                if (grain !== "Monthly") {
                                  toast.message("Switch to Monthly to edit period cells")
                                }
                                return
                              }
                              startEditValue(row, i)
                            }}
                          >
                            {isEditing ? (
                              <input
                                autoFocus
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                onBlur={(e) => commitEdit(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter")
                                    commitEdit((e.target as HTMLInputElement).value)
                                  if (e.key === "Escape") setEditing(null)
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full min-w-[4.5rem] h-8 rounded border-2 border-[#2563eb] px-1.5 text-right text-[12px] tabular-nums outline-none"
                              />
                            ) : (
                              <span
                                className={cn(
                                  "inline-block w-full min-h-[28px] px-1 py-1 rounded",
                                  editable && "cursor-text",
                                )}
                                title={editable ? "Double-click to edit" : undefined}
                              >
                                {formatCell(v, row.format)}
                              </span>
                            )}
                          </td>
                        )
                      })}
                      <td
                        className={cn(
                          "px-3 py-2 text-right tabular-nums font-semibold whitespace-nowrap",
                          row.fy < 0 ? "text-[#dc2626]" : "text-[#0f172a]",
                        )}
                        title="FY total (read-only in demo)"
                      >
                        {formatCell(row.fy, row.format)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {showHidden ? (
            <p className="border-t border-[#f1f5f9] px-4 py-2 text-[11px] text-[#94a3b8]">
              No hidden line items in this module.
            </p>
          ) : null}
        </section>

        {/* 2×3 analytics grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          <FormulaTracePanel
            row={selected}
            rows={rows}
            tab={traceTab}
            onTab={setTraceTab}
            open={traceOpen}
            onOpen={() => setTraceOpen(true)}
            onClose={() => setTraceOpen(false)}
            precedents={tracePrecedents}
            dependents={traceDependents}
            cellMeta={cellMeta}
            cellTrace={cellTrace}
            preferLiveChain={useLiveGrid}
            onNavigate={(name) => {
              const match =
                rows.find((r) => r.name === name) ||
                rows.find((r) => r.id === name) ||
                rows.find((r) => name.includes(r.name))
              if (match) {
                selectRow(match)
                setTraceOpen(true)
                setTraceTab("summary")
              } else {
                toast.message(`${name} is outside this module view`)
              }
            }}
          />
          <DataMappingPanel
            mappedPct={mappedPct}
            rows={filteredMaps}
            allCount={mappingData.length}
            inferred={mappingsInferred}
            canEdit={canEdit}
            systems={[
              "All Sources",
              ...Array.from(new Set(mappingData.map((m) => m.system).filter(Boolean))),
            ]}
            system={mapSystem}
            onSystem={setMapSystem}
            query={mapQ}
            onQuery={setMapQ}
            unmappedOnly={mapUnmappedOnly}
            onUnmappedOnly={setMapUnmappedOnly}
            selectedSource={mapSelectedSource}
            onSelectRow={selectMappedRow}
            onViewAll={() => setDetailModal("mappings")}
            onAddMapping={() =>
              onOpenCreateMapping?.({ targetLineItemId: selectedId || undefined })
            }
            onRefresh={onRefreshMappings}
            onSeedCatalog={onSeedMappingCatalog}
            onImportFile={onImportSourceFile}
          />
          <AuditLogPanel
            rows={auditData}
            selectedId={auditSelectedId}
            onSelectRow={(entry) => {
              setAuditSelectedId(entry.id)
              const detailNames = entry.details
                .split(/\s*→\s*/)
                .map((s) => s.trim())
                .filter(Boolean)
              const match =
                rows.find((r) => r.id === entry.lineItemId) ||
                rows.find((r) => r.name === entry.details) ||
                rows.find((r) => detailNames.includes(r.name)) ||
                rows.find((r) => entry.details.includes(r.name))
              if (match) {
                selectRow(match)
              }
              toast.message(`${entry.action}: ${entry.details}`, {
                description: `${entry.user} · ${entry.time}`,
              })
            }}
            onViewAll={() => setDetailModal("audit")}
          />
          <ExceptionsCard
            tab={excTab}
            onTab={(t) => setExcTab(t)}
            rows={excFiltered}
            selectedId={excSelectedId}
            onSelectRow={selectException}
            errN={errN}
            warnN={warnN}
            infoN={infoN}
            highlight={focusExceptions}
            onViewAll={() => setDetailModal("exceptions")}
          />
          <ValidationSummaryCard
            passed={passed}
            warnings={valWarnings}
            errors={valErrors}
            total={totalChecks}
            onViewReport={() => setDetailModal("validation")}
          />
          <ImpactAnalysisPanel
            row={selected}
            sensitivity={sensitivity ?? null}
            lineItems={lineItems}
            shockPct={shockPct}
            onShockPct={setShockPct}
            canRun={Boolean(onRunSensitivity)}
            onRun={(driverId, pct) => onRunSensitivity?.(driverId, pct)}
          />
        </div>
      </div>

      <AnalyticsDetailModal
        kind={detailModal}
        onClose={() => setDetailModal(null)}
        mappingRows={mappingData}
        auditRows={auditData}
        exceptionRows={exceptions}
        validationChecks={valChecks}
        onSelectMapping={(row) => {
          setDetailModal(null)
          selectMappedRow(row)
        }}
        onSelectAudit={(entry) => {
          setDetailModal(null)
          setAuditSelectedId(entry.id)
          const detailNames = entry.details
            .split(/\s*→\s*/)
            .map((s) => s.trim())
            .filter(Boolean)
          const match =
            rows.find((r) => r.id === entry.lineItemId) ||
            rows.find((r) => r.name === entry.details) ||
            rows.find((r) => detailNames.includes(r.name)) ||
            rows.find((r) => entry.details.includes(r.name))
          if (match) selectRow(match)
          toast.message(`${entry.action}: ${entry.details}`, {
            description: `${entry.user} · ${entry.time}`,
          })
        }}
        onSelectException={(entry) => {
          setDetailModal(null)
          selectException(entry)
        }}
        onSelectValidation={(check) => {
          const match =
            (check.lineItemId && rows.find((r) => r.id === check.lineItemId)) ||
            rows.find((r) => r.name === check.module) ||
            rows[0]
          if (match) selectRow(match)
        }}
      />
    </div>
  )
}

function PanelShell({
  title,
  action,
  children,
  className,
  highlight,
  headerClassName,
}: {
  title: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  highlight?: boolean
  headerClassName?: string
}) {
  return (
    <section
      className={cn(
        "rounded-xl border bg-white shadow-sm flex flex-col min-h-[320px] overflow-hidden",
        highlight ? "border-[#2563eb] ring-1 ring-[#2563eb]/30" : "border-[#e2e8f0]",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between border-b border-[#e2e8f0] px-3 py-2 shrink-0",
          headerClassName,
        )}
      >
        <h3 className="text-[12px] font-semibold text-[#0f172a]">{title}</h3>
        {action}
      </div>
      <div className="flex-1 min-h-0 p-3 overflow-auto">{children}</div>
    </section>
  )
}

function FormulaTracePanel({
  row,
  rows,
  tab,
  onTab,
  open,
  onOpen,
  onClose,
  onNavigate,
  precedents: precedentsOverride,
  dependents: dependentsOverride,
  cellMeta,
  cellTrace,
  preferLiveChain,
}: {
  row: WorkspaceRow | undefined
  rows: WorkspaceRow[]
  tab: "summary" | "precedents" | "dependents" | "chain"
  onTab: (t: "summary" | "precedents" | "dependents" | "chain") => void
  open: boolean
  onOpen: () => void
  onClose: () => void
  onNavigate: (name: string) => void
  precedents?: string[]
  dependents?: string[]
  cellMeta?: DetailedCellMeta | null
  cellTrace?: DetailedTraceView | null
  preferLiveChain?: boolean
}) {
  const name = row?.name || "—"
  const formula = row?.formula && row.formula !== "—" ? row.formula : ""
  const isCalc = row?.kind === "CALCULATED"
  const byName = useMemo(() => {
    const m = new Map<string, WorkspaceRow>()
    for (const r of rows) m.set(r.name, r)
    return m
  }, [rows])

  const precedents = useMemo(() => {
    if (precedentsOverride?.length) return precedentsOverride
    if (!preferLiveChain) {
      if (name === "EBITDA") return ["Net ARR", "Payroll Expense", "Marketing Spend"]
      if (name === "Net ARR") return ["Starting ARR", "New Bookings", "Churn"]
      if (name === "Cash Balance") return ["Cash Balance", "EBITDA", "CapEx"]
      if (name === "Payroll Expense") return ["Headcount", "Avg Fully Burdened Cost"]
    }
    if (isCalc) return extractRefs(formula)
    return []
  }, [precedentsOverride, name, isCalc, formula, preferLiveChain])

  const dependents = useMemo(() => {
    if (dependentsOverride?.length) return dependentsOverride
    if (!preferLiveChain) {
      if (name === "EBITDA") return ["Cash Balance", "Free Cash Flow"]
      if (name === "Net ARR") return ["EBITDA", "Cash Balance"]
      if (name === "Starting ARR" || name === "New Bookings" || name === "Churn") return ["Net ARR"]
      if (name === "Payroll Expense" || name === "Marketing Spend") return ["EBITDA"]
    }
    return []
  }, [dependentsOverride, name, preferLiveChain])

  const fmtWhen = (iso?: string | null) => {
    if (!iso) return "—"
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  const statusRaw = String(cellMeta?.validationStatus || "").toUpperCase()
  const statusOk = !statusRaw || statusRaw === "VALID" || statusRaw === "PASSED" || statusRaw === "OK"

  const tabs = [
    { id: "summary" as const, label: "Summary" },
    { id: "precedents" as const, label: `Precedents (${precedents.length})` },
    { id: "dependents" as const, label: `Dependents (${dependents.length})` },
    { id: "chain" as const, label: "Calculation Chain" },
  ]

  if (!open) {
    return (
      <PanelShell
        title={
          <>
            Formula Trace: <span className="text-[#2563eb]">{name}</span>
          </>
        }
        action={
          <button
            type="button"
            onClick={onOpen}
            className="text-[11px] font-medium text-[#2563eb] hover:underline"
          >
            Open
          </button>
        }
      >
        <p className="text-[11px] text-[#94a3b8]">Closed — reopen to inspect precedents and chain.</p>
      </PanelShell>
    )
  }

  return (
    <section className="rounded-xl border border-[#e2e8f0] bg-white shadow-sm flex flex-col min-h-[320px] overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#e2e8f0] px-3 py-2 shrink-0">
        <h3 className="text-[12px] font-semibold text-[#0f172a]">
          Formula Trace: <span className="text-[#2563eb]">{name}</span>
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="h-7 w-7 inline-flex items-center justify-center rounded text-[#94a3b8] hover:bg-[#f1f5f9]"
          aria-label="Close formula trace"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="px-3 pt-2 pb-2 shrink-0">
        <p className="text-[10px] font-medium text-[#64748b] mb-1">Formula</p>
        <div className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-2 py-1.5">
          {isCalc && formula ? (
            <FormulaHighlight formula={formula} accent="purple" />
          ) : (
            <span className="text-[11px] text-[#94a3b8]">—</span>
          )}
        </div>
      </div>

      <div className="px-3 border-b border-[#e2e8f0] shrink-0">
        <div className="flex flex-wrap gap-3 -mb-px">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onTab(t.id)}
              className={cn(
                "pb-2 text-[10px] font-medium border-b-2 whitespace-nowrap",
                tab === t.id
                  ? "border-[#2563eb] text-[#2563eb]"
                  : "border-transparent text-[#64748b] hover:text-[#0f172a]",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 p-3 overflow-auto">
        {tab === "summary" && (
          <div className="grid grid-cols-2 gap-2 min-w-0">
            <dl className="space-y-1.5 text-[10px] min-w-0">
              <MetaRow label="Line Item Type" value={isCalc ? "Calculated" : "Driver"} />
              <MetaRow label="Data Type" value="USD" />
              <MetaRow label="Aggregation" value="Monthly" />
              <MetaRow label="Format" value="#,##0" mono />
              <MetaRow label="Last Calculated" value={fmtWhen(cellMeta?.lastCalculatedAt)} />
              <div>
                <dt className="text-[#94a3b8]">Status</dt>
                <dd className="mt-0.5">
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-medium",
                      statusOk
                        ? "bg-[#dcfce7] text-[#166534]"
                        : "bg-[#fef2f2] text-[#b91c1c]",
                    )}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    {cellMeta?.validationStatus || (statusOk ? "Valid" : "Issue")}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-[#94a3b8]">Formula Updated</dt>
                <dd className="font-medium text-[#0f172a] mt-0.5 leading-tight text-[9px]">
                  {cellMeta?.formulaUpdatedAt
                    ? `${fmtWhen(cellMeta.formulaUpdatedAt)}${
                        cellMeta.formulaUpdatedByName
                          ? ` by ${cellMeta.formulaUpdatedByName}`
                          : ""
                      }`
                    : "—"}
                </dd>
              </div>
            </dl>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-[#0f172a] mb-1">Calculation Chain</p>
              <CalcChainFlow
                byName={byName}
                onNavigate={onNavigate}
                focusName={name}
                liveTrace={preferLiveChain ? cellTrace : null}
                preferLive={preferLiveChain}
              />
            </div>
          </div>
        )}

        {tab === "precedents" && (
          <RefList
            empty="No precedents — this is an input driver."
            names={precedents}
            byName={byName}
            onNavigate={onNavigate}
            tone="driver"
          />
        )}

        {tab === "dependents" && (
          <RefList
            empty="No dependents — nothing references this line item."
            names={dependents}
            byName={byName}
            onNavigate={onNavigate}
            tone="calc"
          />
        )}

        {tab === "chain" && (
          <div>
            <p className="text-[10px] font-semibold text-[#0f172a] mb-2">Calculation Chain</p>
            <CalcChainFlow
              byName={byName}
              onNavigate={onNavigate}
              focusName={name}
              wide
              liveTrace={preferLiveChain ? cellTrace : null}
              preferLive={preferLiveChain}
            />
          </div>
        )}
      </div>
    </section>
  )
}

function MetaRow({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div>
      <dt className="text-[#94a3b8]">{label}</dt>
      <dd className={cn("font-medium text-[#0f172a] mt-0.5", mono && "font-mono text-[11px]")}>
        {value}
      </dd>
    </div>
  )
}

function RefList({
  names,
  byName,
  onNavigate,
  empty,
  tone,
}: {
  names: string[]
  byName: Map<string, WorkspaceRow>
  onNavigate: (name: string) => void
  empty: string
  tone: "driver" | "calc"
}) {
  if (!names.length) {
    return <p className="text-[12px] text-[#94a3b8] py-6 text-center">{empty}</p>
  }
  return (
    <ul className="space-y-2 max-w-lg">
      {names.map((n) => {
        const row = byName.get(n)
        const fy = row?.fy
        return (
          <li key={n}>
            <button
              type="button"
              onClick={() => onNavigate(n)}
              className={cn(
                "w-full flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors hover:bg-[#f8fafc]",
                tone === "driver" ? "border-[#bfdbfe]" : "border-[#e9d5ff]",
              )}
            >
              <span className="flex items-center gap-2 min-w-0">
                {row?.kind === "CALCULATED" || (!row && tone === "calc") ? (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#f3e8ff] text-[11px] font-bold text-[#7c3aed]">
                    Σ
                  </span>
                ) : (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#eff6ff] text-[#2563eb]">
                    <BarChart3 className="w-3.5 h-3.5" />
                  </span>
                )}
                <span className="text-[13px] font-medium text-[#0f172a] truncate">{n}</span>
              </span>
              <span
                className={cn(
                  "text-[12px] tabular-nums font-medium shrink-0",
                  fy != null && fy < 0 ? "text-[#dc2626]" : "text-[#64748b]",
                )}
              >
                {fy != null ? formatCell(fy, "currency") : "—"}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function extractRefs(formula: string) {
  return Array.from(formula.matchAll(/\[([^\]]+)\]/g)).map((m) => m[1])
}

type ChainNodeKind = "driver" | "calculated" | "result"

type ChainNodeDef = {
  id: string
  label: string
  x: number
  y: number
  w: number
  h: number
  kind: ChainNodeKind
}

const CHAIN_LAYOUT: ChainNodeDef[] = [
  { id: "starting-arr", label: "Starting ARR", x: 6, y: 4, w: 78, h: 36, kind: "driver" },
  { id: "new-bookings", label: "New Bookings", x: 101, y: 4, w: 78, h: 36, kind: "driver" },
  { id: "churn", label: "Churn", x: 196, y: 4, w: 78, h: 36, kind: "driver" },
  { id: "net-arr", label: "Net ARR", x: 101, y: 52, w: 78, h: 36, kind: "calculated" },
  { id: "payroll", label: "Payroll Expense", x: 36, y: 100, w: 78, h: 36, kind: "driver" },
  { id: "marketing", label: "Marketing Spend", x: 166, y: 100, w: 78, h: 36, kind: "driver" },
  { id: "ebitda", label: "EBITDA", x: 101, y: 148, w: 78, h: 36, kind: "result" },
]

const CHAIN_EDGES: Array<[string, string]> = [
  ["starting-arr", "net-arr"],
  ["new-bookings", "net-arr"],
  ["churn", "net-arr"],
  ["net-arr", "ebitda"],
  ["payroll", "ebitda"],
  ["marketing", "ebitda"],
]

const CASH_NODE: ChainNodeDef = {
  id: "cash-balance",
  label: "Cash Balance",
  x: 101,
  y: 196,
  w: 78,
  h: 36,
  kind: "result",
}

function chainAnchor(node: ChainNodeDef, side: "top" | "bottom") {
  const cx = node.x + node.w / 2
  const cy = side === "top" ? node.y : node.y + node.h
  return { x: cx, y: cy }
}

function chainEdgePath(from: ChainNodeDef, to: ChainNodeDef) {
  const a = chainAnchor(from, "bottom")
  const b = chainAnchor(to, "top")
  const mid = a.y + (b.y - a.y) * 0.55
  return `M ${a.x} ${a.y} C ${a.x} ${mid}, ${b.x} ${mid}, ${b.x} ${b.y}`
}

function layoutLiveTrace(trace: DetailedTraceView): {
  nodes: ChainNodeDef[]
  edges: Array<[string, string]>
} {
  const cols = Math.min(3, Math.max(1, Math.ceil(Math.sqrt(trace.nodes.length))))
  const nodeW = 78
  const nodeH = 36
  const gapX = 14
  const gapY = 28
  const startX = 12
  const startY = 12
  const nodes: ChainNodeDef[] = trace.nodes.map((n, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    return {
      id: n.id,
      label: n.label,
      x: startX + col * (nodeW + gapX),
      y: startY + row * (nodeH + gapY),
      w: nodeW,
      h: nodeH,
      kind: n.kind,
    }
  })
  const idSet = new Set(nodes.map((n) => n.id))
  const edges: Array<[string, string]> = trace.edges
    .filter((e) => idSet.has(e.from) && idSet.has(e.to))
    .map((e) => [e.from, e.to])
  return { nodes, edges }
}

function CalcChainFlow({
  byName,
  onNavigate,
  focusName,
  wide,
  liveTrace,
  preferLive,
}: {
  byName: Map<string, WorkspaceRow>
  onNavigate: (name: string) => void
  focusName: string
  wide?: boolean
  liveTrace?: DetailedTraceView | null
  preferLive?: boolean
}) {
  const live = preferLive ? liveTrace : null
  if (preferLive && (!live || live.nodes.length === 0)) {
    return (
      <div className="rounded-lg border border-[#e2e8f0] bg-[#fafbfc] px-3 py-4 text-[10px] text-[#64748b] leading-snug">
        No calculation chain for this cell yet. Run Test Calculation, or select a CALCULATED line
        item that has cell values.
      </div>
    )
  }
  if (preferLive && live && live.nodes.length === 1 && live.edges.length === 0) {
    const only = live.nodes[0]
    return (
      <div className="rounded-lg border border-[#e2e8f0] bg-[#fafbfc] px-3 py-3 text-[10px] text-[#64748b] leading-snug space-y-1">
        <p className="font-medium text-[#0f172a]">{only.label}</p>
        <p>
          Single-node trace
          {only.value != null ? ` · ${only.value}` : ""} — typical for INPUT drivers. Pick a
          CALCULATED row to see precedents → result.
        </p>
      </div>
    )
  }

  const showCash = focusName === "Cash Balance"
  const laidOut = live ? layoutLiveTrace(live) : null
  const nodes = laidOut
    ? laidOut.nodes
    : showCash
      ? [...CHAIN_LAYOUT, CASH_NODE]
      : CHAIN_LAYOUT
  const edges = laidOut
    ? laidOut.edges
    : showCash
      ? [...CHAIN_EDGES, ["ebitda", "cash-balance"] as [string, string]]
      : CHAIN_EDGES

  const nodeById = new Map(nodes.map((n) => [n.id, n]))
  const liveVal = (id: string) => live?.nodes.find((n) => n.id === id)?.value
  const val = (label: string) => byName.get(label)?.fy

  const kindStyles: Record<ChainNodeKind, { stroke: string; bar: string }> = {
    driver: { stroke: "#93c5fd", bar: "#2563eb" },
    calculated: { stroke: "#c4b5fd", bar: "#7c3aed" },
    result: { stroke: "#86efac", bar: "#16a34a" },
  }

  const maxY = nodes.reduce((m, n) => Math.max(m, n.y + n.h), 0)
  const vbH = Math.max(live ? maxY + 24 : showCash ? 240 : 200, 120)
  const vbW = live
    ? Math.max(
        280,
        nodes.reduce((m, n) => Math.max(m, n.x + n.w), 0) + 16,
      )
    : 280

  return (
    <div
      className={cn(
        "rounded-lg border border-[#e2e8f0] bg-[#fafbfc] overflow-hidden",
        wide ? "p-2" : "p-1",
      )}
    >
      <svg
        viewBox={`0 0 ${vbW} ${vbH}`}
        className="w-full h-auto block"
        role="img"
        aria-label="Calculation chain flow"
      >
        <defs>
          <marker
            id="chain-arrow"
            markerWidth="8"
            markerHeight="8"
            refX="7"
            refY="4"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L8,4 L0,8 Z" fill="#2563eb" />
          </marker>
        </defs>

        {edges.map(([fromId, toId]) => {
          const from = nodeById.get(fromId)
          const to = nodeById.get(toId)
          if (!from || !to) return null
          return (
            <path
              key={`${fromId}-${toId}`}
              d={chainEdgePath(from, to)}
              fill="none"
              stroke="#2563eb"
              strokeWidth="1.5"
              markerEnd="url(#chain-arrow)"
            />
          )
        })}

        {nodes.map((node) => {
          const styles = kindStyles[node.kind]
          const liveV = liveVal(node.id)
          const demoV = val(node.label)
          const value =
            liveV != null
              ? typeof liveV === "number"
                ? liveV
                : Number(liveV)
              : demoV
          const isFocus = node.label === focusName || live?.nodes.some(
            (n) => n.id === node.id && n.label === focusName,
          )
          const valueColor =
            typeof value === "number" && Number.isFinite(value) && value < 0
              ? "#dc2626"
              : "#334155"

          return (
            <g
              key={node.id}
              className="cursor-pointer"
              onClick={() => onNavigate(node.label)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  onNavigate(node.label)
                }
              }}
            >
              <rect
                x={node.x}
                y={node.y}
                width={node.w}
                height={node.h}
                rx={6}
                fill="#ffffff"
                stroke={isFocus ? "#2563eb" : styles.stroke}
                strokeWidth={isFocus ? 2 : 1}
              />
              <rect
                x={node.x + 1}
                y={node.y + 6}
                width={3}
                height={node.h - 12}
                rx={1.5}
                fill={styles.bar}
              />
              <text
                x={node.x + 8}
                y={node.y + 14}
                fontSize="9"
                fontWeight="600"
                fill="#0f172a"
              >
                {node.label.length > 14 ? `${node.label.slice(0, 13)}…` : node.label}
              </text>
              <text
                x={node.x + 8}
                y={node.y + 28}
                fontSize="9"
                fontWeight="500"
                fill={valueColor}
              >
                {typeof value === "number" && Number.isFinite(value)
                  ? formatCell(value, "currency")
                  : liveV != null
                    ? String(liveV)
                    : "—"}
              </text>
            </g>
          )
        })}
      </svg>

      <div className="flex flex-wrap items-center justify-center gap-2 px-1 py-1.5 border-t border-[#e2e8f0] text-[9px] text-[#64748b]">
        <span className="inline-flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-[#2563eb]" /> Drivers
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-[#7c3aed]" /> Calculated
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-[#16a34a]" /> Result
        </span>
      </div>
    </div>
  )
}

function DataMappingPanel({
  mappedPct,
  rows,
  allCount,
  inferred,
  canEdit,
  systems,
  system,
  onSystem,
  query,
  onQuery,
  unmappedOnly,
  onUnmappedOnly,
  selectedSource,
  onSelectRow,
  onViewAll,
  onAddMapping,
  onRefresh,
  onSeedCatalog,
  onImportFile,
}: {
  mappedPct: number
  rows: DetailedMappingRow[]
  allCount: number
  inferred?: boolean
  canEdit?: boolean
  systems: string[]
  system: string
  onSystem: (s: string) => void
  query: string
  onQuery: (q: string) => void
  unmappedOnly: boolean
  onUnmappedOnly: (v: boolean) => void
  selectedSource: string | null
  onSelectRow: (row: DetailedMappingRow) => void
  onViewAll: () => void
  onAddMapping?: () => void
  onRefresh?: () => void
  onSeedCatalog?: () => void
  onImportFile?: () => void
}) {
  const systemOptions = systems.length > 1 ? systems : ["All Sources"]

  return (
    <section className="rounded-xl border border-[#e2e8f0] bg-white shadow-sm flex flex-col min-h-[320px] overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#e2e8f0] px-3 py-2.5 shrink-0 gap-2">
        <h3 className="text-[12px] font-semibold text-[#0f172a] inline-flex items-center gap-1.5 min-w-0">
          <Database className="w-3.5 h-3.5 text-[#64748b] shrink-0" />
          Data Mapping
        </h3>
        <div className="flex items-center gap-1.5 shrink-0">
          {inferred ? (
            <span className="inline-flex items-center rounded-full bg-[#eff6ff] px-2 py-0.5 text-[10px] font-semibold text-[#1d4ed8]">
              {allCount} suggested
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-[#dcfce7] px-2 py-0.5 text-[10px] font-semibold text-[#166534]">
              {mappedPct}% Mapped
            </span>
          )}
          {canEdit && onAddMapping ? (
            <button
              type="button"
              onClick={onAddMapping}
              className="h-7 inline-flex items-center gap-1 rounded-full bg-[#2563eb] px-2.5 text-[10px] font-medium text-white shadow-sm hover:bg-[#1d4ed8]"
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex-1 min-h-0 p-3 flex flex-col gap-2.5">
        {inferred ? (
          <p className="text-[10px] text-[#64748b] leading-snug -mt-0.5">
            No connector seed on this model yet — add mappings below, or seed the catalog from
            backend. Suggested rows are derived from line items until real mappings exist.
          </p>
        ) : null}
        {(onRefresh || onSeedCatalog || onImportFile) && (
          <div className="flex flex-wrap gap-1.5 shrink-0 -mt-0.5">
            {onRefresh ? (
              <button
                type="button"
                onClick={onRefresh}
                className="h-7 rounded-full border border-[#e2e8f0] px-2.5 text-[10px] font-medium text-[#475569] hover:bg-[#f8fafc]"
              >
                Refresh from connectors
              </button>
            ) : null}
            {canEdit && onSeedCatalog ? (
              <button
                type="button"
                onClick={onSeedCatalog}
                className="h-7 rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-2.5 text-[10px] font-medium text-[#1d4ed8] hover:bg-[#dbeafe]"
              >
                Seed catalog
              </button>
            ) : null}
            {canEdit && onImportFile ? (
              <button
                type="button"
                onClick={onImportFile}
                className="h-7 rounded-full border border-[#bbf7d0] bg-[#f0fdf4] px-2.5 text-[10px] font-medium text-[#15803d] hover:bg-[#dcfce7]"
              >
                Import CSV / Excel
              </button>
            ) : null}
          </div>
        )}
        <div className="flex gap-2 shrink-0">
          <div className="relative">
            <select
              value={system}
              onChange={(e) => onSystem(e.target.value)}
              aria-label="Source System"
              className="h-8 appearance-none rounded-md border border-[#e2e8f0] bg-white pl-2.5 pr-7 text-[11px] text-[#0f172a] min-w-[118px]"
            >
              {systemOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#94a3b8]" />
          </div>
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94a3b8]" />
            <input
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="Search mappings..."
              className="h-8 w-full rounded-md border border-[#e2e8f0] bg-white pl-8 pr-2 text-[11px] text-[#0f172a] placeholder:text-[#94a3b8]"
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-auto -mx-1 px-1">
          <table className="w-full text-[10px]">
            <thead className="sticky top-0 bg-white">
              <tr className="text-[#94a3b8] text-left border-b border-[#e2e8f0]">
                <th className="pb-1.5 pr-2 font-medium">Source Field</th>
                <th className="pb-1.5 pr-2 font-medium">Source System</th>
                <th className="pb-1.5 w-5 font-medium text-center" aria-hidden />
                <th className="pb-1.5 pr-2 font-medium">Target Line Item</th>
                <th className="pb-1.5 w-8 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-[11px] text-[#94a3b8]">
                    {allCount === 0
                      ? "Add line items to suggest source mappings, or seed connectors on the backend."
                      : "No mappings match your filters."}
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const selected = selectedSource === r.source
                  const suggested = String(r.status).toUpperCase() === "SUGGESTED"
                  return (
                    <tr
                      key={r.id}
                      tabIndex={0}
                      role="button"
                      onClick={() => onSelectRow(r)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          onSelectRow(r)
                        }
                      }}
                      className={cn(
                        "border-b border-[#f1f5f9] cursor-pointer transition-colors",
                        selected ? "bg-[#eff6ff]" : "hover:bg-[#f8fafc]",
                      )}
                    >
                      <td className="py-2 pr-2 font-medium text-[#0f172a] whitespace-nowrap">
                        {r.source}
                      </td>
                      <td className="py-2 pr-2 text-[#64748b] whitespace-nowrap">{r.system}</td>
                      <td className="py-2 text-center text-[#94a3b8]">
                        <ArrowRight className="w-3 h-3 mx-auto" />
                      </td>
                      <td className="py-2 pr-2 text-[#334155] whitespace-nowrap">{r.target}</td>
                      <td className="py-2 text-center">
                        {r.ok ? (
                          suggested ? (
                            <Info
                              className="w-4 h-4 text-[#2563eb] mx-auto"
                              aria-label="Suggested from structure"
                            />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-[#16a34a] mx-auto" aria-label="Mapped" />
                          )
                        ) : (
                          <AlertTriangle
                            className="w-4 h-4 text-[#d97706] mx-auto"
                            aria-label="Needs attention"
                          />
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1 shrink-0 border-t border-[#f1f5f9]">
          <label className="inline-flex items-center gap-1.5 text-[10px] text-[#64748b] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={unmappedOnly}
              onChange={(e) => onUnmappedOnly(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-[#cbd5e1] text-[#2563eb] focus:ring-[#2563eb]"
            />
            Show unmapped only
          </label>
          <button
            type="button"
            onClick={onViewAll}
            className="inline-flex items-center gap-1 text-[10px] font-medium text-[#2563eb] hover:underline"
          >
            View all mappings
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <p className="text-[9px] text-[#94a3b8] -mt-1">
          Showing {rows.length} of {allCount}
          {inferred ? " · suggested" : ""}
          {unmappedOnly ? " · unmapped" : ""}
          {system !== "All Sources" ? ` · ${system}` : ""}
        </p>
      </div>
    </section>
  )
}

function AuditLogPanel({
  rows,
  selectedId,
  onSelectRow,
  onViewAll,
}: {
  rows: DetailedAuditRow[]
  selectedId: string | null
  onSelectRow: (entry: DetailedAuditRow) => void
  onViewAll: () => void
}) {
  return (
    <section className="rounded-xl border border-[#e2e8f0] bg-white shadow-sm flex flex-col min-h-[320px] max-h-[420px] overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#e2e8f0] px-3 py-2.5 shrink-0">
        <h3 className="text-[12px] font-semibold text-[#0f172a]">Model Audit Log</h3>
        <button
          type="button"
          onClick={onViewAll}
          className="text-[11px] font-medium text-[#2563eb] hover:underline"
        >
          View all
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-auto fpa-thin-scroll">
        <table className="w-full text-[10px] table-fixed">
          <thead className="sticky top-0 z-[1] bg-white shadow-[0_1px_0_#e2e8f0]">
            <tr className="text-[#94a3b8] text-left">
              <th className="px-3 py-2 font-medium w-[22%]">Time</th>
              <th className="px-2 py-2 font-medium w-[22%]">User</th>
              <th className="px-2 py-2 font-medium w-[22%]">Action</th>
              <th className="px-3 py-2 font-medium w-[34%]">Details</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-[11px] text-[#94a3b8]">
                  No audit entries yet.
                </td>
              </tr>
            ) : (
              rows.map((e) => {
                const initials = auditInitials(e.user)
                const avatar = AUDIT_AVATAR_COLORS[initials] || { bg: "#e2e8f0", text: "#475569" }
                const selected = selectedId === e.id

                return (
                  <tr
                    key={e.id}
                    tabIndex={0}
                    role="button"
                    onClick={() => onSelectRow(e)}
                    onKeyDown={(ev) => {
                      if (ev.key === "Enter" || ev.key === " ") {
                        ev.preventDefault()
                        onSelectRow(e)
                      }
                    }}
                    className={cn(
                      "border-b border-[#f1f5f9] cursor-pointer transition-colors",
                      selected ? "bg-[#eff6ff]" : "hover:bg-[#f8fafc]",
                    )}
                  >
                    <td className="px-3 py-2.5 text-[#64748b] align-top whitespace-nowrap">
                      {e.time}
                    </td>
                    <td className="px-2 py-2.5 align-top">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div
                          className="h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-semibold shrink-0"
                          style={{ backgroundColor: avatar.bg, color: avatar.text }}
                        >
                          {initials}
                        </div>
                        <span className="text-[#0f172a] font-medium truncate" title={e.user}>
                          {e.user}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-2.5 text-[#0f172a] font-medium align-top">
                      <span className="line-clamp-2 break-words" title={e.action}>
                        {e.action}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-[#64748b] align-top">
                      <span className="line-clamp-2 break-words" title={e.details}>
                        {e.details || "—"}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function ExceptionsCard({
  tab,
  onTab,
  rows,
  selectedId,
  onSelectRow,
  errN,
  warnN,
  infoN,
  highlight,
  onViewAll,
}: {
  tab: ExcTab
  onTab: (t: ExcTab) => void
  rows: DetailedExceptionRow[]
  selectedId: string | null
  onSelectRow: (entry: DetailedExceptionRow) => void
  errN: number
  warnN: number
  infoN: number
  highlight?: boolean
  onViewAll: () => void
}) {
  const tabs = [
    { id: "errors" as const, label: "Errors", count: errN, icon: AlertCircle, activeBg: "bg-[#fef2f2]", activeText: "text-[#dc2626]", iconColor: "text-[#dc2626]" },
    { id: "warnings" as const, label: "Warnings", count: warnN, icon: AlertTriangle, activeBg: "bg-[#fff7ed]", activeText: "text-[#d97706]", iconColor: "text-[#d97706]" },
    { id: "info" as const, label: "Info", count: infoN, icon: Info, activeBg: "bg-[#eff6ff]", activeText: "text-[#2563eb]", iconColor: "text-[#2563eb]" },
  ]

  return (
    <section
      className={cn(
        "rounded-xl border bg-white shadow-sm flex flex-col min-h-[320px] overflow-hidden",
        highlight ? "border-[#2563eb] ring-1 ring-[#2563eb]/30" : "border-[#e2e8f0]",
      )}
    >
      <div className="border-b border-[#e2e8f0] px-3 py-2.5 shrink-0">
        <h3 className="text-[12px] font-semibold text-[#0f172a] inline-flex items-center gap-1.5 mb-2">
          <AlertTriangle className="w-3.5 h-3.5 text-[#d97706]" />
          Exceptions
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {tabs.map((t) => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  onTab(active ? null : t.id)
                }}
                className={cn(
                  "inline-flex items-center gap-1 h-7 px-2 rounded-full text-[10px] font-medium transition-colors",
                  active
                    ? cn(t.activeBg, t.activeText)
                    : "text-[#64748b] hover:bg-[#f8fafc]",
                )}
              >
                <Icon className={cn("w-3 h-3", active ? t.iconColor : "text-[#94a3b8]")} />
                {t.label} ({t.count})
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto px-3 py-2">
        <table className="w-full text-[10px]">
          <thead className="sticky top-0 bg-white">
            <tr className="text-[#94a3b8] text-left border-b border-[#e2e8f0]">
              <th className="pb-2 w-6 font-medium" />
              <th className="pb-2 pr-2 font-medium whitespace-nowrap">Line Item / Mapping</th>
              <th className="pb-2 pr-2 font-medium">Issue</th>
              <th className="pb-2 font-medium text-right whitespace-nowrap">Impact</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-[11px] text-[#94a3b8]">
                  No exceptions in this category.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const selected = selectedId === r.id
                return (
                  <tr
                    key={r.id}
                    tabIndex={0}
                    role="button"
                    onClick={() => onSelectRow(r)}
                    onKeyDown={(ev) => {
                      if (ev.key === "Enter" || ev.key === " ") {
                        ev.preventDefault()
                        onSelectRow(r)
                      }
                    }}
                    className={cn(
                      "border-b border-[#f1f5f9] cursor-pointer transition-colors",
                      selected ? "bg-[#eff6ff]" : "hover:bg-[#f8fafc]",
                    )}
                  >
                    <td className="py-2 align-middle">
                      {r.sev === "error" ? (
                        <AlertCircle className="w-3.5 h-3.5 text-[#dc2626]" />
                      ) : r.sev === "warning" ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-[#d97706]" />
                      ) : (
                        <Info className="w-3.5 h-3.5 text-[#2563eb]" />
                      )}
                    </td>
                    <td className="py-2 pr-2 font-medium text-[#0f172a] whitespace-nowrap align-middle">
                      {r.lineItem}
                    </td>
                    <td className="py-2 pr-2 text-[#64748b] align-middle">{r.issue}</td>
                    <td className="py-2 text-right align-middle">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-[9px] font-semibold",
                          r.impact === "High"
                            ? "bg-[#fef2f2] text-[#dc2626]"
                            : r.impact === "Medium"
                              ? "bg-[#fff7ed] text-[#d97706]"
                              : "bg-[#f0fdf4] text-[#16a34a]",
                        )}
                      >
                        {r.impact}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="px-3 py-2 border-t border-[#f1f5f9] shrink-0 flex justify-end">
        <button
          type="button"
          onClick={onViewAll}
          className="inline-flex items-center gap-1 text-[10px] font-medium text-[#2563eb] hover:underline"
        >
          View all exceptions
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </section>
  )
}

function ValidationSummaryCard({
  passed,
  warnings,
  errors,
  total,
  onViewReport,
}: {
  passed: number
  warnings: number
  errors: number
  total: number
  onViewReport: () => void
}) {
  const pPct = Math.round((passed / total) * 100)
  const wPct = Math.round((warnings / total) * 100)
  const ePct = Math.round((errors / total) * 100)
  const pEnd = (passed / total) * 100
  const wEnd = pEnd + (warnings / total) * 100
  const gradient = `conic-gradient(#16a34a 0 ${pEnd}%, #d97706 ${pEnd}% ${wEnd}%, #dc2626 ${wEnd}% 100%)`

  const legend = [
    { label: "Passed", count: passed, pct: pPct, color: "#16a34a" },
    { label: "Warnings", count: warnings, pct: wPct, color: "#d97706" },
    { label: "Errors", count: errors, pct: ePct, color: "#dc2626" },
  ]

  return (
    <section className="rounded-xl border border-[#e2e8f0] bg-white shadow-sm flex flex-col min-h-[320px] overflow-hidden">
      <div className="border-b border-[#e2e8f0] px-3 py-2.5 shrink-0">
        <h3 className="text-[12px] font-semibold text-[#0f172a]">Validation Summary</h3>
      </div>

      <div className="flex-1 min-h-0 px-4 py-4 flex items-center gap-5">
        <div
          className="relative w-[104px] h-[104px] shrink-0"
          style={{ background: gradient, borderRadius: "9999px" }}
        >
          <div className="absolute inset-[12px] rounded-full bg-white flex flex-col items-center justify-center">
            <span className="text-[20px] font-bold text-[#0f172a] leading-none">{total}</span>
            <span className="text-[9px] text-[#94a3b8] mt-1 text-center leading-tight">
              Total Checks
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          {legend.map((item) => (
            <div
              key={item.label}
              className="grid grid-cols-[auto_1fr_auto_auto] gap-x-3 items-center text-[11px]"
            >
              <span
                className="h-3 w-3 rounded-sm shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[#64748b]">{item.label}</span>
              <span className="font-bold text-[#0f172a] tabular-nums text-right min-w-[12px]">
                {item.count}
              </span>
              <span className="text-[#94a3b8] tabular-nums text-right w-8">{item.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-3 py-2.5 border-t border-[#f1f5f9] shrink-0 flex justify-end">
        <button
          type="button"
          onClick={onViewReport}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-[#2563eb] hover:underline"
        >
          View validation report
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </section>
  )
}

function ImpactAnalysisPanel({
  row,
  sensitivity,
  lineItems,
  shockPct,
  onShockPct,
  canRun,
  onRun,
}: {
  row: WorkspaceRow | undefined
  sensitivity: DetailedSensitivityView | null
  lineItems: FpaLineItem[]
  shockPct: number
  onShockPct: (n: number) => void
  canRun?: boolean
  onRun?: (driverLineItemId: string, shockPct: number) => void
}) {
  const drivers = useMemo(
    () => lineItems.filter((li) => li.id && li.name),
    [lineItems],
  )
  const [driverId, setDriverId] = useState(() => row?.id || "")

  useEffect(() => {
    if (row?.id && drivers.some((d) => d.id === row.id)) {
      setDriverId(row.id)
      return
    }
    setDriverId((prev) => prev || drivers[0]?.id || "")
  }, [row?.id, drivers])

  const fallbackName = row?.name || "Driver"
  const useLive = sensitivity != null
  const driverName =
    sensitivity?.driverName ||
    drivers.find((d) => d.id === driverId)?.name ||
    fallbackName
  const shockLabel = sensitivity?.shockLabel || `+${shockPct}%`
  const impacts = useLive
    ? sensitivity?.impacts || []
    : [
        { lineItemId: "ebitda", name: "EBITDA", deltaTotal: 84965, deltaPct: 5.19 },
        { lineItemId: "cash", name: "Cash Balance", deltaTotal: 84965, deltaPct: 5.19 },
      ]
  const months = useLive && sensitivity?.months?.length
    ? sensitivity.months
    : ["Jan '26", "Mar '26", "May '26", "Jul '26", "Sep '26", "Nov '26"]
  const baseCase = useLive && sensitivity?.baseCase?.length
    ? sensitivity.baseCase
    : [1.02, 1.12, 1.22, 1.32, 1.42, 1.52]
  const shocked = useLive && sensitivity?.shocked?.length
    ? sensitivity.shocked
    : [1.08, 1.2, 1.32, 1.45, 1.58, 1.72]
  const unitLabel = sensitivity?.unitLabel || "USD (000s)"

  const chartW = 280
  const chartH = 160
  const padL = 36
  const padR = 10
  const padT = 28
  const padB = 24
  const plotW = chartW - padL - padR
  const plotH = chartH - padT - padB
  const allVals = [...baseCase, ...shocked]
  const yMin = Math.min(...allVals, 0)
  const yMax = Math.max(...allVals, 1)
  const ySpan = Math.max(yMax - yMin, 1e-6)

  const toX = (i: number) => padL + (i / Math.max(baseCase.length - 1, 1)) * plotW
  const toY = (v: number) => padT + plotH - ((v - yMin) / ySpan) * plotH
  const basePts = baseCase.map((v, i) => `${toX(i)},${toY(v)}`).join(" ")
  const scenPts = shocked.map((v, i) => `${toX(i)},${toY(v)}`).join(" ")

  const yTicks = [yMax, (yMax + yMin) / 2, yMin].map((v) => ({
    v,
    label:
      Math.abs(v) >= 1_000_000
        ? `${(v / 1_000_000).toFixed(1)}M`
        : Math.abs(v) >= 1000
          ? `${(v / 1000).toFixed(0)}K`
          : v.toFixed(1),
  }))

  const fmtDelta = (n: number) => {
    const sign = n >= 0 ? "+" : ""
    return `${sign}${Math.round(n).toLocaleString()}`
  }
  const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`
  const deltaColor = (n: number) => (n >= 0 ? "text-[#16a34a]" : "text-[#dc2626]")

  const leftCards = impacts.slice(0, 2)

  return (
    <section className="rounded-xl border border-[#e2e8f0] bg-white shadow-sm flex flex-col min-h-[320px] overflow-hidden">
      <div className="border-b border-[#e2e8f0] px-3 py-2.5 shrink-0 space-y-2">
        <h3 className="text-[12px] font-semibold text-[#0f172a]">
          Impact Analysis{" "}
          <span className="font-normal text-[#64748b]">
            (if {driverName} {shockLabel})
          </span>
        </h3>
        {canRun ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <select
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              aria-label="Sensitivity driver"
              className="h-7 max-w-[140px] rounded-full border border-[#e2e8f0] bg-white px-2 text-[10px] text-[#0f172a]"
            >
              {drivers.length === 0 ? (
                <option value="">No drivers</option>
              ) : (
                drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))
              )}
            </select>
            <label className="inline-flex items-center gap-1 text-[10px] text-[#64748b]">
              Shock
              <input
                type="number"
                min={-50}
                max={100}
                step={1}
                value={shockPct}
                onChange={(e) => onShockPct(Number(e.target.value) || 0)}
                className="h-7 w-14 rounded-full border border-[#e2e8f0] px-2 text-[10px] text-[#0f172a] tabular-nums"
              />
              %
            </label>
            <button
              type="button"
              disabled={!driverId}
              onClick={() => driverId && onRun?.(driverId, shockPct)}
              className="h-7 rounded-full bg-[#2563eb] px-3 text-[10px] font-medium text-white shadow-sm hover:bg-[#1d4ed8] disabled:opacity-50"
            >
              Run
            </button>
          </div>
        ) : null}
      </div>

      <div className="flex-1 min-h-0 p-3 flex gap-3">
        <div className="flex flex-col gap-2.5 shrink-0 w-[118px]">
          {leftCards.length === 0 ? (
            <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-3 flex-1 flex items-center">
              <p className="text-[10px] text-[#64748b] leading-snug">
                {sensitivity?.emptyMessage || "No impact metrics for this driver."}
              </p>
            </div>
          ) : (
            leftCards.map((imp) => (
              <div
                key={imp.lineItemId}
                className="rounded-lg border border-[#e2e8f0] bg-white px-3 py-3 flex-1 flex flex-col justify-center"
              >
                <p className="text-[10px] text-[#64748b] mb-1.5 truncate" title={imp.name}>
                  {imp.name} Impact
                </p>
                <p className={cn("text-[15px] font-bold leading-none tabular-nums", deltaColor(imp.deltaTotal))}>
                  {fmtDelta(imp.deltaTotal)}
                </p>
                <p className={cn("text-[11px] font-medium mt-1 tabular-nums", deltaColor(imp.deltaPct))}>
                  {fmtPct(imp.deltaPct)}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col min-h-[200px]">
          {!useLive && leftCards.length > 0 ? (
            <p className="text-[9px] text-[#94a3b8] mb-1">Demo preview — waiting for sensitivity API data</p>
          ) : null}
          {sensitivity?.emptyMessage && leftCards.length === 0 ? (
            <p className="text-[11px] text-[#64748b] m-auto text-center px-4">{sensitivity.emptyMessage}</p>
          ) : (
            <>
              <div className="flex items-center justify-center gap-4 mb-1 text-[9px] text-[#64748b] shrink-0">
                <span className="inline-flex items-center gap-1.5">
                  <svg width="20" height="8" aria-hidden>
                    <line x1="0" y1="4" x2="14" y2="4" stroke="#2563eb" strokeWidth="1.5" strokeDasharray="3 2" />
                    <circle cx="17" cy="4" r="2" fill="#2563eb" />
                  </svg>
                  Base Case
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <svg width="20" height="8" aria-hidden>
                    <line x1="0" y1="4" x2="14" y2="4" stroke="#16a34a" strokeWidth="1.5" />
                    <rect x="15" y="2" width="4" height="4" rx="0.5" fill="#16a34a" />
                  </svg>
                  {driverName} {shockLabel}
                </span>
              </div>

              <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full flex-1" preserveAspectRatio="xMidYMid meet">
                <text
                  x={8}
                  y={padT + plotH / 2}
                  fontSize="7"
                  fill="#94a3b8"
                  textAnchor="middle"
                  transform={`rotate(-90 8 ${padT + plotH / 2})`}
                >
                  {unitLabel}
                </text>

                {yTicks.map(({ v, label }) => (
                  <g key={`${v}-${label}`}>
                    <line
                      x1={padL}
                      y1={toY(v)}
                      x2={chartW - padR}
                      y2={toY(v)}
                      stroke="#f1f5f9"
                      strokeWidth="1"
                    />
                    <text x={padL - 4} y={toY(v) + 2} fontSize="7" fill="#94a3b8" textAnchor="end">
                      {label}
                    </text>
                  </g>
                ))}

                <polyline
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                  points={basePts}
                />
                <polyline fill="none" stroke="#16a34a" strokeWidth="1.5" points={scenPts} />

                {baseCase.map((v, i) => (
                  <circle key={`b${i}`} cx={toX(i)} cy={toY(v)} r="2.5" fill="#ffffff" stroke="#2563eb" strokeWidth="1.5" />
                ))}
                {shocked.map((v, i) => (
                  <rect
                    key={`s${i}`}
                    x={toX(i) - 2.5}
                    y={toY(v) - 2.5}
                    width="5"
                    height="5"
                    rx="0.5"
                    fill="#16a34a"
                  />
                ))}

                {months.map((m, i) => (
                  <text
                    key={`${m}-${i}`}
                    x={toX(i)}
                    y={chartH - 6}
                    fontSize="7"
                    fill="#94a3b8"
                    textAnchor="middle"
                  >
                    {m}
                  </text>
                ))}
              </svg>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

function validationStatusStyle(status: "passed" | "warning" | "error") {
  if (status === "passed") return "bg-[#dcfce7] text-[#166534]"
  if (status === "warning") return "bg-[#fff7ed] text-[#d97706]"
  return "bg-[#fef2f2] text-[#dc2626]"
}

function AnalyticsDetailModal({
  kind,
  onClose,
  mappingRows,
  auditRows,
  exceptionRows,
  validationChecks,
  onSelectMapping,
  onSelectAudit,
  onSelectException,
  onSelectValidation,
}: {
  kind: DetailModalKind
  onClose: () => void
  mappingRows: DetailedMappingRow[]
  auditRows: DetailedAuditRow[]
  exceptionRows: DetailedExceptionRow[]
  validationChecks: DetailedValidationCheck[]
  onSelectMapping: (row: DetailedMappingRow) => void
  onSelectAudit: (entry: DetailedAuditRow) => void
  onSelectException: (entry: DetailedExceptionRow) => void
  onSelectValidation: (check: DetailedValidationCheck) => void
}) {
  const open = kind != null
  const errN = exceptionRows.filter((e) => e.sev === "error").length
  const warnN = exceptionRows.filter((e) => e.sev === "warning").length
  const infoN = exceptionRows.filter((e) => e.sev === "info").length
  const passedN = validationChecks.filter((c) => c.status === "passed").length
  const valWarnN = validationChecks.filter((c) => c.status === "warning").length
  const valErrN = validationChecks.filter((c) => c.status === "error").length
  const mappedN = mappingRows.filter((m) => m.ok).length

  const titles: Record<Exclude<DetailModalKind, null>, string> = {
    mappings: "All Data Mappings",
    audit: "Model Audit Log",
    exceptions: "All Exceptions",
    validation: "Validation Report",
  }

  const descriptions: Record<Exclude<DetailModalKind, null>, string> = {
    mappings: `${mappingRows.length} source fields · ${mappedN} mapped`,
    audit: `${auditRows.length} recent changes to this model`,
    exceptions: `${exceptionRows.length} items · ${errN} errors · ${warnN} warnings · ${infoN} info`,
    validation: `${validationChecks.length} checks · ${passedN} passed · ${valWarnN} warnings · ${valErrN} errors`,
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-[#e2e8f0] shrink-0">
          <DialogTitle className="text-[15px] text-[#0f172a]">
            {kind ? titles[kind] : ""}
          </DialogTitle>
          <DialogDescription className="text-[12px] text-[#64748b]">
            {kind ? descriptions[kind] : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-auto px-5 py-3">
          {kind === "mappings" && (
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-[#94a3b8] text-left border-b border-[#e2e8f0]">
                  <th className="pb-2 pr-3 font-medium">Source Field</th>
                  <th className="pb-2 pr-3 font-medium">Source System</th>
                  <th className="pb-2 w-5" aria-hidden />
                  <th className="pb-2 pr-3 font-medium">Target Line Item</th>
                  <th className="pb-2 font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {mappingRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#94a3b8]">
                      No source fields in the mapping catalog yet.
                    </td>
                  </tr>
                ) : (
                  mappingRows.map((r) => (
                  <tr
                    key={r.id}
                    tabIndex={0}
                    role="button"
                    onClick={() => onSelectMapping(r)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        onSelectMapping(r)
                      }
                    }}
                    className="border-b border-[#f1f5f9] hover:bg-[#f8fafc] cursor-pointer"
                  >
                    <td className="py-2.5 pr-3 font-medium text-[#0f172a]">{r.source}</td>
                    <td className="py-2.5 pr-3 text-[#64748b]">{r.system}</td>
                    <td className="py-2.5 text-[#94a3b8]">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </td>
                    <td className="py-2.5 pr-3 text-[#334155]">{r.target}</td>
                    <td className="py-2.5 text-center">
                      {r.ok ? (
                        <CheckCircle2 className="w-4 h-4 text-[#16a34a] mx-auto" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-[#d97706] mx-auto" />
                      )}
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {kind === "audit" && (
            <div className="max-h-[55vh] overflow-auto fpa-thin-scroll">
              <table className="w-full text-[11px] table-fixed">
                <thead className="sticky top-0 bg-white z-[1] shadow-[0_1px_0_#e2e8f0]">
                  <tr className="text-[#94a3b8] text-left">
                    <th className="pb-2 pr-3 font-medium w-[20%]">Time</th>
                    <th className="pb-2 pr-3 font-medium w-[20%]">User</th>
                    <th className="pb-2 pr-3 font-medium w-[22%]">Action</th>
                    <th className="pb-2 font-medium w-[38%]">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditRows.map((e) => {
                    const initials = auditInitials(e.user)
                    const avatar = AUDIT_AVATAR_COLORS[initials] || { bg: "#e2e8f0", text: "#475569" }
                    return (
                      <tr
                        key={e.id}
                        tabIndex={0}
                        role="button"
                        onClick={() => onSelectAudit(e)}
                        onKeyDown={(ev) => {
                          if (ev.key === "Enter" || ev.key === " ") {
                            ev.preventDefault()
                            onSelectAudit(e)
                          }
                        }}
                        className="border-b border-[#f1f5f9] hover:bg-[#f8fafc] cursor-pointer"
                      >
                        <td className="py-2.5 pr-3 text-[#64748b] whitespace-nowrap align-top">
                          {e.time}
                        </td>
                        <td className="py-2.5 pr-3 align-top">
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className="h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-semibold shrink-0"
                              style={{ backgroundColor: avatar.bg, color: avatar.text }}
                            >
                              {initials}
                            </div>
                            <span className="font-medium text-[#0f172a] truncate" title={e.user}>
                              {e.user}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 pr-3 font-medium text-[#0f172a] align-top">
                          <span className="break-words" title={e.action}>
                            {e.action}
                          </span>
                        </td>
                        <td className="py-2.5 text-[#64748b] align-top">
                          <span className="break-words whitespace-pre-wrap" title={e.details}>
                            {e.details || "—"}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {kind === "exceptions" && (
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-[#94a3b8] text-left border-b border-[#e2e8f0]">
                  <th className="pb-2 w-6" />
                  <th className="pb-2 pr-3 font-medium">Line Item / Mapping</th>
                  <th className="pb-2 pr-3 font-medium">Issue</th>
                  <th className="pb-2 font-medium text-right">Impact</th>
                </tr>
              </thead>
              <tbody>
                {exceptionRows.map((r) => (
                  <tr
                    key={r.id}
                    tabIndex={0}
                    role="button"
                    onClick={() => onSelectException(r)}
                    onKeyDown={(ev) => {
                      if (ev.key === "Enter" || ev.key === " ") {
                        ev.preventDefault()
                        onSelectException(r)
                      }
                    }}
                    className="border-b border-[#f1f5f9] hover:bg-[#f8fafc] cursor-pointer"
                  >
                    <td className="py-2.5">
                      {r.sev === "error" ? (
                        <AlertCircle className="w-3.5 h-3.5 text-[#dc2626]" />
                      ) : r.sev === "warning" ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-[#d97706]" />
                      ) : (
                        <Info className="w-3.5 h-3.5 text-[#2563eb]" />
                      )}
                    </td>
                    <td className="py-2.5 pr-3 font-medium text-[#0f172a]">{r.lineItem}</td>
                    <td className="py-2.5 pr-3 text-[#64748b]">{r.issue}</td>
                    <td className="py-2.5 text-right">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-[9px] font-semibold",
                          r.impact === "High"
                            ? "bg-[#fef2f2] text-[#dc2626]"
                            : r.impact === "Medium"
                              ? "bg-[#fff7ed] text-[#d97706]"
                              : "bg-[#f0fdf4] text-[#16a34a]",
                        )}
                      >
                        {r.impact}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {kind === "validation" && (
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-[#94a3b8] text-left border-b border-[#e2e8f0]">
                  <th className="pb-2 pr-3 font-medium">Check</th>
                  <th className="pb-2 pr-3 font-medium">Module</th>
                  <th className="pb-2 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {validationChecks.map((c) => (
                  <tr
                    key={c.id}
                    tabIndex={0}
                    role="button"
                    onClick={() => onSelectValidation(c)}
                    onKeyDown={(ev) => {
                      if (ev.key === "Enter" || ev.key === " ") {
                        ev.preventDefault()
                        onSelectValidation(c)
                      }
                    }}
                    className="border-b border-[#f1f5f9] hover:bg-[#f8fafc] cursor-pointer"
                  >
                    <td className="py-2.5 pr-3 font-medium text-[#0f172a]">{c.check}</td>
                    <td className="py-2.5 pr-3 text-[#64748b]">{c.module}</td>
                    <td className="py-2.5 text-right">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-[9px] font-semibold capitalize",
                          validationStatusStyle(c.status),
                        )}
                      >
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
