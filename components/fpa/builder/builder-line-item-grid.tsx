"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  Expand,
  FileSpreadsheet,
  Filter,
  Grid3X3,
  Info,
  Link2,
  Minimize2,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  User,
} from "lucide-react"
import type { FpaLineItem, FpaLineItemTemplate } from "@/lib/api/fpa-api"
import { lineItemKind } from "@/components/fpa/grid/cell-state"
import { cn } from "@/lib/utils"
import type { ModuleGroup } from "./builder-modules-tree"
import { toast } from "sonner"

type CentreTab = "items" | "templates" | "validations" | "history"
type ViewGrain = "Monthly" | "Quarterly" | "Annual"

type HistoryRow = {
  id: string
  action: string
  target: string
  detail: string
  user: string
  when: string
}

type ValidationRow = {
  id: string
  severity: "ok" | "warn" | "error"
  rule: string
  detail: string
  lineItemId?: string | null
}

function grainPeriodLabels(monthly: string[], grain: ViewGrain): string[] {
  if (grain === "Monthly") return monthly
  if (grain === "Quarterly") {
    const out: string[] = []
    for (let i = 0; i < monthly.length; i += 3) {
      const chunk = monthly.slice(i, i + 3)
      if (!chunk.length) break
      const year = chunk[0]?.match(/(\d{4})/)?.[1]
      out.push(year ? `Q${Math.floor(i / 3) + 1} ${year}` : `Q${Math.floor(i / 3) + 1}`)
    }
    return out.length ? out : ["Q1"]
  }
  const year = monthly[0]?.match(/(\d{4})/)?.[1]
  return [year ? `FY${year}` : "Annual"]
}

function aggregatePreview(
  values: Array<number | null | undefined>,
  grain: ViewGrain,
): Array<number | null> {
  if (grain === "Monthly") return values.map((v) => (v == null || Number.isNaN(v) ? null : v))
  if (grain === "Quarterly") {
    const out: Array<number | null> = []
    for (let i = 0; i < values.length; i += 3) {
      const chunk = values.slice(i, i + 3)
      if (!chunk.length) break
      const nums = chunk.filter((v): v is number => v != null && !Number.isNaN(v))
      out.push(nums.length ? nums.reduce((a, b) => a + b, 0) : null)
    }
    return out
  }
  const nums = values.filter((v): v is number => v != null && !Number.isNaN(v))
  return [nums.length ? nums.reduce((a, b) => a + b, 0) : null]
}

type DemoRow = {
  id: string
  name: string
  kind: "INPUT" | "CALCULATED"
  formula: string
  values: Array<number | null>
  format?: "number" | "currency" | "percent"
  tint?: boolean
}

const PERIODS = ["Jan 2026", "Feb 2026", "Mar 2026", "Apr 2026", "May 2026", "Jun 2026"]

function cloneRows(rows: DemoRow[]): DemoRow[] {
  return rows.map((r) => ({ ...r, values: [...r.values] }))
}

const UNITS_PRICING: DemoRow[] = [
  {
    id: "units-sold",
    name: "Units Sold",
    kind: "INPUT",
    formula: "Input",
    values: [10480, 11200, 10850, 12100, 11940, 12560],
    format: "number",
  },
  {
    id: "price",
    name: "Price",
    kind: "INPUT",
    formula: "Input",
    values: [95, 95, 95, 97, 97, 99],
    format: "currency",
  },
  {
    id: "revenue",
    name: "Revenue",
    kind: "CALCULATED",
    formula: "=[Units Sold] * [Price]",
    values: [996560, 1064000, 1030750, 1173700, 1158180, 1243440],
    format: "currency",
    tint: true,
  },
  {
    id: "discounts",
    name: "Discounts",
    kind: "INPUT",
    formula: "Input",
    values: [0.05, 0.05, 0.048, 0.05, 0.052, 0.05],
    format: "percent",
  },
  {
    id: "net-revenue",
    name: "Net Revenue",
    kind: "CALCULATED",
    formula: "=[Revenue] * (1 - [Discounts])",
    values: [946732, 1010800, 981274, 1115015, 1097955, 1181268],
    format: "currency",
    tint: true,
  },
  {
    id: "cogs",
    name: "COGS",
    kind: "INPUT",
    formula: "Input",
    values: [420000, 448000, 434000, 484000, 477600, 502400],
    format: "currency",
  },
  {
    id: "gross-profit",
    name: "Gross Profit",
    kind: "CALCULATED",
    formula: "=[Net Revenue] - [COGS]",
    values: [526732, 562800, 547274, 631015, 620355, 678868],
    format: "currency",
    tint: true,
  },
  {
    id: "gross-margin",
    name: "Gross Margin %",
    kind: "CALCULATED",
    formula: "=[Gross Profit] / [Net Revenue]",
    values: [0.557, 0.557, 0.558, 0.566, 0.565, 0.575],
    format: "percent",
  },
  {
    id: "returns",
    name: "Returns Reserve",
    kind: "INPUT",
    formula: "Input",
    values: [0.012, 0.012, 0.011, 0.012, 0.013, 0.012],
    format: "percent",
  },
  {
    id: "adjusted-gp",
    name: "Adjusted Gross Profit",
    kind: "CALCULATED",
    formula: "=[Gross Profit] * (1 - [Returns Reserve])",
    values: [520411, 556046, 541254, 623443, 612290, 670721],
    format: "currency",
    tint: true,
  },
]

const REVENUE_SUMMARY: DemoRow[] = [
  {
    id: "gross-rev",
    name: "Gross Revenue",
    kind: "CALCULATED",
    formula: "=[Units & Pricing].[Revenue]",
    values: [996560, 1064000, 1030750, 1173700, 1158180, 1243440],
    format: "currency",
    tint: true,
  },
  {
    id: "net-rev-sum",
    name: "Net Revenue",
    kind: "CALCULATED",
    formula: "=[Units & Pricing].[Net Revenue]",
    values: [946732, 1010800, 981274, 1115015, 1097955, 1181268],
    format: "currency",
    tint: true,
  },
  {
    id: "deferred",
    name: "Deferred Revenue",
    kind: "INPUT",
    formula: "Input",
    values: [120000, 125000, 128000, 131000, 134000, 138000],
    format: "currency",
  },
  {
    id: "recognized",
    name: "Recognized Revenue",
    kind: "CALCULATED",
    formula: "=[Net Revenue] - DELTA([Deferred Revenue])",
    values: [941732, 1005800, 978274, 1112015, 1094955, 1177268],
    format: "currency",
    tint: true,
  },
]

const OPEX_SUMMARY: DemoRow[] = [
  {
    id: "sales-mkt",
    name: "Sales & Marketing",
    kind: "INPUT",
    formula: "Input",
    values: [180000, 185000, 190000, 195000, 200000, 205000],
    format: "currency",
  },
  {
    id: "rd-spend",
    name: "R&D",
    kind: "INPUT",
    formula: "Input",
    values: [140000, 142000, 145000, 148000, 150000, 155000],
    format: "currency",
  },
  {
    id: "ga",
    name: "G&A",
    kind: "INPUT",
    formula: "Input",
    values: [90000, 91000, 92000, 93000, 94000, 95000],
    format: "currency",
  },
  {
    id: "total-opex",
    name: "Total Opex",
    kind: "CALCULATED",
    formula: "=[Sales & Marketing] + [R&D] + [G&A]",
    values: [410000, 418000, 427000, 436000, 444000, 455000],
    format: "currency",
    tint: true,
  },
  {
    id: "opex-pct",
    name: "Opex % of Net Revenue",
    kind: "CALCULATED",
    formula: "=[Total Opex] / [Net Revenue]",
    values: [0.433, 0.414, 0.435, 0.391, 0.404, 0.385],
    format: "percent",
  },
]

const WORKFORCE_HC: DemoRow[] = [
  {
    id: "hc-start",
    name: "Opening Headcount",
    kind: "INPUT",
    formula: "Input",
    values: [120, 122, 125, 128, 130, 134],
    format: "number",
  },
  {
    id: "hires",
    name: "Hires",
    kind: "INPUT",
    formula: "Input",
    values: [4, 5, 5, 3, 6, 4],
    format: "number",
  },
  {
    id: "attrition",
    name: "Attrition",
    kind: "INPUT",
    formula: "Input",
    values: [2, 2, 2, 1, 2, 2],
    format: "number",
  },
  {
    id: "hc-end",
    name: "Closing Headcount",
    kind: "CALCULATED",
    formula: "=[Opening Headcount] + [Hires] - [Attrition]",
    values: [122, 125, 128, 130, 134, 136],
    format: "number",
    tint: true,
  },
  {
    id: "avg-comp",
    name: "Avg Comp / FTE",
    kind: "INPUT",
    formula: "Input",
    values: [9500, 9500, 9600, 9600, 9700, 9700],
    format: "currency",
  },
  {
    id: "payroll",
    name: "Payroll Cost",
    kind: "CALCULATED",
    formula: "=[Closing Headcount] * [Avg Comp / FTE]",
    values: [1159000, 1187500, 1228800, 1248000, 1299800, 1319200],
    format: "currency",
    tint: true,
  },
]

const DISCOUNTS_ADJ: DemoRow[] = [
  {
    id: "list-price",
    name: "List Price",
    kind: "INPUT",
    formula: "Input",
    values: [100, 100, 100, 102, 102, 104],
    format: "currency",
  },
  {
    id: "promo",
    name: "Promo Rate",
    kind: "INPUT",
    formula: "Input",
    values: [0.03, 0.04, 0.03, 0.05, 0.04, 0.03],
    format: "percent",
  },
  {
    id: "volume-disc",
    name: "Volume Discount",
    kind: "INPUT",
    formula: "Input",
    values: [0.02, 0.02, 0.018, 0.02, 0.022, 0.02],
    format: "percent",
  },
  {
    id: "net-price",
    name: "Net Price",
    kind: "CALCULATED",
    formula: "=[List Price] * (1 - [Promo Rate] - [Volume Discount])",
    values: [95, 94, 95.2, 94.86, 95.88, 98.8],
    format: "currency",
    tint: true,
  },
]

/** Demo datasets keyed by module leaf id from the left tree. */
export const MODULE_LINE_ITEMS: Record<string, DemoRow[]> = {
  "units-pricing": UNITS_PRICING,
  "revenue-summary": REVENUE_SUMMARY,
  "discounts-adjustments": DISCOUNTS_ADJ,
  "net-revenue": REVENUE_SUMMARY.filter((r) =>
    ["net-rev-sum", "recognized", "deferred"].includes(r.id),
  ),
  "opex-summary": OPEX_SUMMARY,
  "sales-marketing": OPEX_SUMMARY.filter((r) => r.id === "sales-mkt" || r.id === "total-opex"),
  "g-and-a": OPEX_SUMMARY.filter((r) => r.id === "ga" || r.id === "total-opex"),
  rd: OPEX_SUMMARY.filter((r) => r.id === "rd-spend" || r.id === "total-opex"),
  headcount: WORKFORCE_HC,
  compensation: WORKFORCE_HC.filter((r) =>
    ["avg-comp", "payroll", "hc-end"].includes(r.id),
  ),
  "hiring-plan": WORKFORCE_HC.filter((r) =>
    ["hires", "attrition", "hc-end"].includes(r.id),
  ),
}

function rowsForLeaf(leafId: string | null | undefined): DemoRow[] {
  if (!leafId) return cloneRows(UNITS_PRICING)
  if (MODULE_LINE_ITEMS[leafId]) return cloneRows(MODULE_LINE_ITEMS[leafId])
  // Generic fallback so every module leaf still shows distinct interactive rows
  const label = leafId
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
  return cloneRows([
    {
      id: `${leafId}-driver`,
      name: `${label} Driver`,
      kind: "INPUT",
      formula: "Input",
      values: [100, 105, 110, 115, 120, 125],
      format: "number",
    },
    {
      id: `${leafId}-rate`,
      name: `${label} Rate`,
      kind: "INPUT",
      formula: "Input",
      values: [0.1, 0.1, 0.11, 0.11, 0.12, 0.12],
      format: "percent",
    },
    {
      id: `${leafId}-result`,
      name: `${label} Result`,
      kind: "CALCULATED",
      formula: `=[${label} Driver] * (1 + [${label} Rate])`,
      values: [110, 115.5, 122.1, 127.65, 134.4, 140],
      format: "number",
      tint: true,
    },
  ])
}

const TEMPLATES = [
  {
    id: "saas-rev",
    name: "SaaS Revenue Pack",
    desc: "Units, price, ARR, churn, and net revenue formulas",
    items: 8,
    tag: "Revenue",
  },
  {
    id: "cogs-pack",
    name: "COGS & Margin Pack",
    desc: "COGS drivers with gross profit and margin %",
    items: 5,
    tag: "Margin",
  },
  {
    id: "discount",
    name: "Discount & Adjustments",
    desc: "Promo rates, volume discounts, returns reserve",
    items: 4,
    tag: "Pricing",
  },
  {
    id: "workforce",
    name: "Workforce Drivers",
    desc: "Headcount, hires, attrition, and payroll cost",
    items: 6,
    tag: "People",
  },
]

const VALIDATION_ROWS = [
  { id: "v1", severity: "ok" as const, rule: "Circular dependency check", detail: "No cycles detected in this module" },
  { id: "v2", severity: "ok" as const, rule: "Formula references resolve", detail: "All bracket refs found in model" },
  {
    id: "v3",
    severity: "warn" as const,
    rule: "Discount range",
    detail: "May 2026 discount 5.2% is above the 5% threshold",
  },
  {
    id: "v4",
    severity: "error" as const,
    rule: "Price continuity",
    detail: "Price jumps >2% between Mar and Apr without comment",
  },
]

const HISTORY_ROWS = [
  {
    id: "h1",
    action: "Updated formula",
    target: "Revenue",
    user: "Sarah Delgado",
    when: "May 12, 2026 9:12 AM",
    detail: "=[Units Sold] * [Price]",
  },
  {
    id: "h2",
    action: "Edited input",
    target: "Units Sold · Jan 2026",
    user: "Michael Chen",
    when: "May 11, 2026 4:40 PM",
    detail: "10,200 → 10,480",
  },
  {
    id: "h3",
    action: "Added line item",
    target: "Returns Reserve",
    user: "Sarah Delgado",
    when: "May 10, 2026 11:05 AM",
    detail: "INPUT · percent",
  },
  {
    id: "h4",
    action: "Applied template",
    target: "SaaS Revenue Pack",
    user: "Michael Chen",
    when: "May 8, 2026 2:18 PM",
    detail: "8 line items inserted",
  },
]

/** Renders formulas with highlighted [Line Item] refs. */
function FormulaText({ formula }: { formula: string }) {
  if (!formula || formula === "Input") {
    return <span className="text-[#94a3b8] font-sans">Input</span>
  }
  const parts = formula.split(/(\[[^\]]+\])/g)
  return (
    <span className="font-mono text-[11px] leading-snug">
      {parts.map((part, i) =>
        part.startsWith("[") && part.endsWith("]") ? (
          <span
            key={i}
            className="inline rounded bg-[#eff6ff] px-1 py-0.5 text-[#2563eb] font-medium mx-0.5"
          >
            {part}
          </span>
        ) : (
          <span key={i} className="text-[#334155]">
            {part}
          </span>
        ),
      )}
    </span>
  )
}

type Props = {
  module: ModuleGroup | null
  pathOverride?: { parent: string; leaf: string } | null
  /** Module tree leaf id — switches demo line items */
  leafId?: string | null
  items: FpaLineItem[]
  selectedId: string | null
  periodLabels: string[]
  /** ISO period keys aligned with periodLabels / preview columns */
  periodKeys?: string[]
  previewByLine: Record<string, Array<number | null>>
  canEdit: boolean
  onSelect: (li: FpaLineItem) => void
  onAddLineItem: () => void
  centreTab: CentreTab
  onCentreTab: (t: CentreTab) => void
  currency?: string
  useHardcoded?: boolean
  demoCreate?: {
    name: string
    code: string
    kind: "INPUT" | "CALCULATED"
    nonce: number
  } | null
  demoFormulaPatch?: {
    rowId: string
    formula: string
    nonce: number
  } | null
  onDemoSelect?: (id: string, name: string, formula: string, kind: "INPUT" | "CALCULATED") => void
  onCellCommit?: (rowId: string, periodIndex: number, value: number) => void
  onFormulaCommit?: (rowId: string, formula: string) => void
  /** Open A.4 detailed workspace for current module leaf */
  onOpenDetailedWorkspace?: () => void
  templates?: FpaLineItemTemplate[]
  templatesLoading?: boolean
  onApplyTemplate?: (templateId: string, templateName: string) => void
  validationRows?: ValidationRow[]
  historyRows?: HistoryRow[]
  onFocusValidation?: (lineItemId: string | null | undefined) => void
}

export function BuilderLineItemGrid({
  module,
  pathOverride,
  leafId,
  items,
  selectedId,
  periodLabels,
  periodKeys = [],
  previewByLine,
  canEdit,
  onSelect,
  onAddLineItem,
  centreTab,
  onCentreTab,
  currency = "USD",
  useHardcoded = true,
  demoCreate,
  demoFormulaPatch,
  onDemoSelect,
  onCellCommit,
  onFormulaCommit,
  onOpenDetailedWorkspace,
  templates,
  templatesLoading = false,
  onApplyTemplate,
  validationRows,
  historyRows,
  onFocusValidation,
}: Props) {
  const cardRef = useRef<HTMLElement>(null)
  const [rows, setRows] = useState<DemoRow[]>(() => rowsForLeaf(leafId))
  const [selectedDemoId, setSelectedDemoId] = useState<string | null>(null)
  const [editing, setEditing] = useState<{ rowId: string; col: "formula" | number } | null>(null)
  const [draft, setDraft] = useState("")
  const [filter, setFilter] = useState<"all" | "input" | "calc">("all")
  const [rowQuery, setRowQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "links">("grid")
  const [viewGrain, setViewGrain] = useState<ViewGrain>("Monthly")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showFilterBar, setShowFilterBar] = useState(false)

  // Switch dataset when module leaf changes
  useEffect(() => {
    const next = rowsForLeaf(leafId)
    setRows(next)
    setEditing(null)
    setFilter("all")
    setRowQuery("")
    const first = next.find((r) => r.kind === "CALCULATED") || next[0]
    if (first) {
      setSelectedDemoId(first.id)
      onDemoSelect?.(
        first.id,
        first.name,
        first.kind === "INPUT" ? "" : first.formula,
        first.kind,
      )
    }
  }, [leafId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Instant create — append row without remounting / reloading module
  useEffect(() => {
    if (!demoCreate) return
    const id = demoCreate.code.toLowerCase().replace(/[^a-z0-9]+/g, "-")
    const row: DemoRow = {
      id,
      name: demoCreate.name,
      kind: demoCreate.kind,
      formula: demoCreate.kind === "INPUT" ? "Input" : "=[ ]",
      values: [0, 0, 0, 0, 0, 0],
      format: "number",
      tint: demoCreate.kind === "CALCULATED",
    }
    setRows((prev) => {
      if (prev.some((r) => r.id === id || r.name === demoCreate.name)) {
        return prev.map((r) => (r.id === id ? { ...r, name: demoCreate.name, kind: demoCreate.kind } : r))
      }
      return [...prev, row]
    })
    setSelectedDemoId(id)
    setFilter("all")
    onCentreTab("items")
    onDemoSelect?.(
      id,
      demoCreate.name,
      demoCreate.kind === "INPUT" ? "" : "=[ ]",
      demoCreate.kind,
    )
  }, [demoCreate?.nonce]) // eslint-disable-line react-hooks/exhaustive-deps

  // Instant formula save from inspector
  useEffect(() => {
    if (!demoFormulaPatch) return
    setRows((prev) =>
      prev.map((r) =>
        r.id === demoFormulaPatch.rowId
          ? { ...r, formula: demoFormulaPatch.formula, kind: "CALCULATED", tint: true }
          : r,
      ),
    )
  }, [demoFormulaPatch?.nonce]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener("fullscreenchange", onFs)
    return () => document.removeEventListener("fullscreenchange", onFs)
  }, [])

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await cardRef.current?.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch {
      toast.error("Fullscreen not available in this browser")
    }
  }, [])

  const pathTitle = pathOverride ? (
    <>
      <span className="text-[#64748b] font-medium">{pathOverride.parent}</span>
      <span className="text-[#94a3b8] mx-1">/</span>
      <span>{pathOverride.leaf}</span>
    </>
  ) : module ? (
    <span>{module.label}</span>
  ) : (
    "Line items"
  )

  const tabs: Array<{ id: CentreTab; label: string }> = [
    { id: "items", label: "Line Items" },
    { id: "templates", label: "Templates" },
    { id: "validations", label: "Validations" },
    { id: "history", label: "History" },
  ]

  const monthlyPeriods = useMemo(() => {
    return useHardcoded || !periodLabels.length ? PERIODS : periodLabels.slice(0, 12)
  }, [useHardcoded, periodLabels])

  const periods = useMemo(
    () => grainPeriodLabels(monthlyPeriods, viewGrain),
    [monthlyPeriods, viewGrain],
  )

  const aggregateValues = useCallback(
    (values: Array<number | null>) => aggregatePreview(values, viewGrain),
    [viewGrain],
  )

  const visibleRows = useMemo(() => {
    if (!useHardcoded) return []
    let list = rows
    if (filter === "input") list = list.filter((r) => r.kind === "INPUT")
    if (filter === "calc") list = list.filter((r) => r.kind === "CALCULATED")
    const q = rowQuery.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.formula.toLowerCase().includes(q),
      )
    }
    return list
  }, [rows, filter, useHardcoded, rowQuery])

  const fmt = (v: number | null | undefined, format: DemoRow["format"] = "number") => {
    if (v == null || Number.isNaN(v)) return "—"
    if (format === "percent") return `${(v * 100).toFixed(1)}%`
    if (format === "currency")
      return v.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    return v.toLocaleString("en-US", { maximumFractionDigits: 0 })
  }

  const fmtCell = (row: DemoRow, values: Array<number | null>, i: number) => {
    const v = values[i]
    if (row.format === "percent" && viewGrain !== "Monthly" && v != null) {
      // show average of monthly percents for Q/FY
      const monthly = row.values.filter((x): x is number => x != null)
      const avg =
        monthly.length === 0 ? 0 : monthly.reduce((a, b) => a + b, 0) / monthly.length
      return `${(avg * 100).toFixed(1)}%`
    }
    return fmt(v, row.format)
  }

  const startEdit = (rowId: string, col: "formula" | number, initial: string) => {
    if (!canEdit) return
    setEditing({ rowId, col })
    setDraft(initial)
  }

  const commitEdit = () => {
    if (!editing) return
    const { rowId, col } = editing
    if (col === "formula") {
      setRows((prev) =>
        prev.map((r) => (r.id === rowId ? { ...r, formula: draft || r.formula } : r)),
      )
      onFormulaCommit?.(rowId, draft)
      const row = rows.find((r) => r.id === rowId)
      if (row) {
        onDemoSelect?.(rowId, row.name, draft || row.formula, "CALCULATED")
      }
      // no toast spam — parent / inline already feedback
    } else {
      if (viewGrain !== "Monthly") {
        toast.message("Switch to Monthly view to edit period cells")
        setEditing(null)
        return
      }
      const n = Number(String(draft).replace(/[,%]/g, ""))
      if (!Number.isFinite(n)) {
        toast.error("Enter a valid number")
        setEditing(null)
        return
      }
      const row = rows.find((r) => r.id === rowId)
      let store = n
      if (row?.format === "percent" && n > 1) store = n / 100
      setRows((prev) =>
        prev.map((r) => {
          if (r.id !== rowId) return r
          const values = [...r.values]
          values[col] = store
          return { ...r, values }
        }),
      )
      onCellCommit?.(rowId, col, store)
    }
    setEditing(null)
  }

  const selectDemo = (row: DemoRow) => {
    setSelectedDemoId(row.id)
    onDemoSelect?.(row.id, row.name, row.kind === "INPUT" ? "" : row.formula, row.kind)
  }

  return (
    <section
      ref={cardRef}
      className={cn(
        "fpa-thin-scroll flex flex-col min-h-0 flex-1 rounded-xl border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden",
        isFullscreen && "rounded-none",
      )}
    >
      <div className="px-4 pt-3 pb-0 shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-[14px] font-semibold text-[#0f172a] min-w-0 truncate">{pathTitle}</h2>
          <Info className="w-3.5 h-3.5 text-[#94a3b8] shrink-0" aria-hidden />
          <div className="ml-auto flex items-center gap-1.5">
            {onOpenDetailedWorkspace ? (
              <button
                type="button"
                onClick={onOpenDetailedWorkspace}
                className="h-8 inline-flex items-center gap-1 rounded-md border border-[#bfdbfe] bg-[#eff6ff] px-2.5 text-[11px] font-medium text-[#2563eb] hover:bg-[#dbeafe]"
                title="Open detailed workspace"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Detailed workspace
              </button>
            ) : null}
            <button
              type="button"
              disabled={!canEdit}
              onClick={onAddLineItem}
              className="h-8 inline-flex items-center gap-1 rounded-full bg-[#2563eb] px-3 text-[12px] font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" /> Line Item
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("grid")
                onCentreTab("items")
              }}
              className={cn(
                "h-8 w-8 inline-flex items-center justify-center rounded-md border",
                viewMode === "grid"
                  ? "border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb]"
                  : "border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]",
              )}
              title="Grid view"
              aria-label="Grid view"
            >
              <Grid3X3 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("links")
                onCentreTab("items")
              }}
              className={cn(
                "h-8 w-8 inline-flex items-center justify-center rounded-md border",
                viewMode === "links"
                  ? "border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb]"
                  : "border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]",
              )}
              title="Formula links view"
              aria-label="Links view"
            >
              <Link2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => void toggleFullscreen()}
              className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]"
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Expand className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-end gap-4 border-b border-[#e2e8f0]">
          <div className="flex gap-4">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onCentreTab(t.id)}
                className={cn(
                  "h-9 text-[13px] font-medium border-b-2 -mb-px px-0.5",
                  centreTab === t.id
                    ? "border-[#2563eb] text-[#2563eb]"
                    : "border-transparent text-[#64748b] hover:text-[#334155]",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          {centreTab === "items" && (
            <div className="ml-auto pb-1.5 flex items-center gap-1.5">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as typeof filter)}
                className="h-7 rounded-md border border-[#e2e8f0] bg-white px-2 text-[11px] text-[#334155]"
              >
                <option value="all">All</option>
                <option value="input">Inputs</option>
                <option value="calc">Calculated</option>
              </select>
              <button
                type="button"
                onClick={() => setShowFilterBar((v) => !v)}
                className={cn(
                  "h-7 w-7 inline-flex items-center justify-center rounded-md border",
                  showFilterBar
                    ? "border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb]"
                    : "border-[#e2e8f0] text-[#64748b]",
                )}
                aria-label="Toggle search filter"
                title="Search line items"
              >
                <Filter className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {centreTab === "items" && showFilterBar && (
          <div className="py-2">
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94a3b8]" />
              <input
                value={rowQuery}
                onChange={(e) => setRowQuery(e.target.value)}
                placeholder="Filter by name or formula…"
                className="h-8 w-full rounded-md border border-[#e2e8f0] pl-8 pr-3 text-[12px]"
              />
            </div>
          </div>
        )}
      </div>

      {centreTab === "templates" && (
        <TemplatesPanel
          canEdit={canEdit}
          templates={templates}
          loading={templatesLoading}
          onApply={(id, name) => {
            if (onApplyTemplate) onApplyTemplate(id, name)
            else toast.success(`Applied “${name}” to ${pathOverride?.leaf || "module"}`)
          }}
        />
      )}
      {centreTab === "validations" && (
        <ValidationsPanel
          moduleLabel={pathOverride?.leaf}
          rows={validationRows}
          onFocus={onFocusValidation}
        />
      )}
      {centreTab === "history" && (
        <HistoryPanel moduleLabel={pathOverride?.leaf} rows={historyRows} />
      )}

      {centreTab === "items" && (
        <>
          <div className="flex-1 overflow-auto min-h-0">
            {viewMode === "links" ? (
              <LinksView
                rows={visibleRows}
                selectedId={selectedDemoId}
                onSelect={selectDemo}
              />
            ) : useHardcoded ? (
              <table className="w-full text-[12px] border-collapse min-w-[900px]">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-[#f8fafc] text-[#64748b] border-b border-[#e2e8f0]">
                    <th className="w-8 px-2 py-2 font-medium sticky left-0 bg-[#f8fafc]">#</th>
                    <th className="px-3 py-2 font-medium sticky left-8 bg-[#f8fafc] min-w-[160px] text-left">
                      Line Item
                    </th>
                    <th className="px-3 py-2 font-medium min-w-[220px] text-left">Formula</th>
                    <th
                      colSpan={periods.length}
                      className="px-3 py-1.5 font-medium text-center border-l border-[#e2e8f0]"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <span>
                          FY2026 ({currency})
                        </span>
                        <button type="button" className="text-[#94a3b8]" aria-label="More">
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </th>
                  </tr>
                  <tr className="bg-[#f8fafc] text-[#64748b] border-b border-[#e2e8f0]">
                    <th className="sticky left-0 bg-[#f8fafc]" />
                    <th className="sticky left-8 bg-[#f8fafc]" />
                    <th />
                    {periods.map((p) => (
                      <th
                        key={p}
                        className="px-3 py-2 font-medium text-right whitespace-nowrap border-l border-[#f1f5f9]"
                      >
                        {p}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3 + periods.length}
                        className="px-4 py-12 text-center text-[#94a3b8]"
                      >
                        No line items match this filter.
                      </td>
                    </tr>
                  ) : (
                    visibleRows.map((row, idx) => {
                      const sel = selectedDemoId === row.id
                      const displayValues = aggregateValues(row.values)
                      return (
                        <tr
                          key={row.id}
                          className={cn(
                            "border-b border-[#f1f5f9] cursor-pointer",
                            sel || row.tint ? "bg-[#eff6ff]/70" : "hover:bg-[#f8fafc]",
                          )}
                          onClick={() => selectDemo(row)}
                        >
                          <td
                            className={cn(
                              "px-2 py-2 text-[#94a3b8] sticky left-0",
                              sel || row.tint ? "bg-[#eff6ff]" : "bg-white",
                            )}
                          >
                            {idx + 1}
                          </td>
                          <td
                            className={cn(
                              "px-3 py-2 sticky left-8",
                              sel || row.tint ? "bg-[#eff6ff]" : "bg-white",
                            )}
                          >
                            <div className="flex items-center gap-2">
                              {row.kind === "INPUT" ? (
                                <BarChart3 className="w-3.5 h-3.5 text-[#16a34a] shrink-0" />
                              ) : (
                                <span className="inline-flex h-5 min-w-[22px] items-center justify-center rounded bg-[#eff6ff] px-1 text-[10px] font-bold italic text-[#2563eb] shrink-0">
                                  fx
                                </span>
                              )}
                              <span className="font-medium text-[#0f172a]">{row.name}</span>
                            </div>
                          </td>
                          <td
                            className="px-2 py-1"
                            onDoubleClick={(e) => {
                              e.stopPropagation()
                              if (row.kind !== "CALCULATED") return
                              startEdit(row.id, "formula", row.formula)
                            }}
                          >
                            {editing?.rowId === row.id && editing.col === "formula" ? (
                              <input
                                autoFocus
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                onBlur={commitEdit}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") commitEdit()
                                  if (e.key === "Escape") setEditing(null)
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full h-8 rounded border-2 border-[#2563eb] px-2 text-[11px] font-mono outline-none"
                              />
                            ) : (
                              <span
                                className={cn(
                                  "inline-flex w-full items-center rounded px-1.5 py-1 min-h-[28px]",
                                  sel && row.kind === "CALCULATED" && "ring-2 ring-[#2563eb] bg-white",
                                )}
                              >
                                <FormulaText formula={row.formula} />
                              </span>
                            )}
                          </td>
                          {periods.map((_, i) => {
                            const isEditing =
                              editing?.rowId === row.id &&
                              editing.col === i &&
                              viewGrain === "Monthly"
                            const editable = row.kind === "INPUT" && viewGrain === "Monthly"
                            return (
                              <td
                                key={`${row.id}-${i}`}
                                className={cn(
                                  "px-2 py-1 text-right tabular-nums border-l border-[#f8fafc]",
                                  row.kind === "CALCULATED" ? "text-[#64748b]" : "text-[#0f172a]",
                                )}
                                onDoubleClick={(e) => {
                                  e.stopPropagation()
                                  if (!editable) {
                                    toast.message(
                                      row.kind === "CALCULATED"
                                        ? "Calculated cells are formula-driven"
                                        : "Switch to Monthly to edit",
                                    )
                                    return
                                  }
                                  const v = row.values[i]
                                  startEdit(
                                    row.id,
                                    i,
                                    v == null
                                      ? ""
                                      : row.format === "percent"
                                        ? String(+(v * 100).toFixed(2))
                                        : String(v),
                                  )
                                }}
                              >
                                {isEditing ? (
                                  <input
                                    autoFocus
                                    value={draft}
                                    onChange={(e) => setDraft(e.target.value)}
                                    onBlur={commitEdit}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") commitEdit()
                                      if (e.key === "Escape") setEditing(null)
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full h-8 rounded border-2 border-[#2563eb] px-2 text-right text-[12px] tabular-nums outline-none"
                                  />
                                ) : (
                                  <span
                                    className={cn(
                                      "inline-block min-w-[4rem] rounded px-1 py-1",
                                      editable && canEdit && "hover:bg-white/80",
                                    )}
                                  >
                                    {fmtCell(row, displayValues, i)}
                                  </span>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            ) : (
              <LiveItemsTable
                items={items}
                selectedId={selectedId}
                periodLabels={monthlyPeriods}
                periodKeys={periodKeys}
                previewByLine={previewByLine}
                viewGrain={viewGrain}
                canEdit={canEdit}
                onSelect={onSelect}
                onCellCommit={onCellCommit}
              />
            )}
          </div>

          <div className="px-4 py-2 border-t border-[#e2e8f0] flex flex-wrap items-center gap-4 text-[12px] text-[#64748b] bg-white shrink-0">
            <button
              type="button"
              disabled={!canEdit}
              onClick={onAddLineItem}
              className="inline-flex items-center gap-1 text-[#2563eb] font-medium disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" /> Add line item
            </button>
            <span>
              {useHardcoded ? visibleRows.length : items.length} line item
              {(useHardcoded ? visibleRows.length : items.length) === 1 ? "" : "s"}
              {filter !== "all" || rowQuery ? " (filtered)" : ""}
            </span>
            <span className="ml-auto flex items-center gap-3">
              <label className="inline-flex items-center gap-1">
                View:
                <select
                  value={viewGrain}
                  onChange={(e) =>
                    setViewGrain(e.target.value as ViewGrain)
                  }
                  className="h-7 rounded-md border border-[#e2e8f0] bg-white px-1.5 text-[12px] font-medium text-[#0f172a]"
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Annual">Annual</option>
                </select>
              </label>
              <span>
                Currency: <span className="text-[#0f172a] font-medium">{currency}</span>
              </span>
            </span>
          </div>
        </>
      )}
    </section>
  )
}

function LinksView({
  rows,
  selectedId,
  onSelect,
}: {
  rows: DemoRow[]
  selectedId: string | null
  onSelect: (row: DemoRow) => void
}) {
  const calc = rows.filter((r) => r.kind === "CALCULATED")
  return (
    <div className="p-4 space-y-3">
      <p className="text-[12px] text-[#64748b]">
        Formula links for this module — click a node to select it in the inspector.
      </p>
      <div className="grid gap-3">
        {calc.length === 0 ? (
          <p className="text-[13px] text-[#94a3b8] py-8 text-center">
            No calculated items in the current filter.
          </p>
        ) : (
          calc.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => onSelect(row)}
              className={cn(
                "text-left rounded-xl border px-4 py-3 transition-colors",
                selectedId === row.id
                  ? "border-[#2563eb] bg-[#eff6ff]"
                  : "border-[#e2e8f0] bg-white hover:border-[#bfdbfe]",
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex h-5 min-w-[22px] items-center justify-center rounded bg-[#eff6ff] px-1 text-[10px] font-bold italic text-[#2563eb]">
                  fx
                </span>
                <span className="text-[13px] font-semibold text-[#0f172a]">{row.name}</span>
              </div>
              <div className="pl-1">
                <FormulaText formula={row.formula} />
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}

function TemplatesPanel({
  canEdit,
  templates,
  loading,
  onApply,
}: {
  canEdit: boolean
  templates?: FpaLineItemTemplate[]
  loading?: boolean
  onApply: (id: string, name: string) => void
}) {
  const [q, setQ] = useState("")
  const live = templates != null
  const source = live
    ? templates.map((t) => ({
        id: t.id,
        name: t.name,
        desc: t.description || "Starter pack for this module",
        items: t.lineItems?.length ?? 0,
        tag: "Template",
      }))
    : TEMPLATES
  const list = source.filter(
    (t) =>
      !q.trim() ||
      t.name.toLowerCase().includes(q.toLowerCase()) ||
      t.desc.toLowerCase().includes(q.toLowerCase()) ||
      t.tag.toLowerCase().includes(q.toLowerCase()),
  )
  return (
    <div className="flex-1 overflow-auto p-4 space-y-4 bg-[#fafbfc]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-[14px] font-semibold text-[#0f172a]">Line item templates</h3>
          <p className="text-[12px] text-[#64748b] mt-0.5">
            {live
              ? "Apply a template into the current module, then tweak formulas."
              : "Drop a starter pack into the current module, then tweak formulas."}
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94a3b8]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search templates…"
            className="h-9 w-full rounded-full border border-[#e2e8f0] bg-white pl-8 pr-3 text-[12px]"
          />
        </div>
      </div>
      {loading ? (
        <p className="text-center text-[13px] text-[#94a3b8] py-10">Loading templates…</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {list.map((t) => (
            <article
              key={t.id}
              className="rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-[#93c5fd] transition-colors"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eff6ff] text-[#2563eb]">
                  <Sparkles className="w-4 h-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-[13px] font-semibold text-[#0f172a]">{t.name}</h4>
                    <span className="rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[10px] font-medium text-[#64748b]">
                      {t.tag}
                    </span>
                  </div>
                  <p className="text-[12px] text-[#64748b] mt-1 leading-relaxed">{t.desc}</p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] text-[#94a3b8]">
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      {t.items} line items
                    </span>
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => onApply(t.id, t.name)}
                      className="h-8 rounded-full bg-[#2563eb] px-3.5 text-[11px] font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-50"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
          {!list.length && (
            <p className="col-span-full text-center text-[13px] text-[#94a3b8] py-10">
              {q.trim()
                ? `No templates match “${q}”.`
                : live
                  ? "No templates available from the API yet."
                  : "No templates."}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function ValidationsPanel({
  moduleLabel,
  rows,
  onFocus,
}: {
  moduleLabel?: string
  rows?: ValidationRow[]
  onFocus?: (lineItemId: string | null | undefined) => void
}) {
  const [sev, setSev] = useState<"all" | "ok" | "warn" | "error">("all")
  const source = rows ?? VALIDATION_ROWS
  const list = source.filter((v) => sev === "all" || v.severity === sev)
  const counts = {
    ok: source.filter((v) => v.severity === "ok").length,
    warn: source.filter((v) => v.severity === "warn").length,
    error: source.filter((v) => v.severity === "error").length,
  }
  return (
    <div className="flex-1 overflow-auto p-4 space-y-4 bg-[#fafbfc]">
      <div>
        <h3 className="text-[14px] font-semibold text-[#0f172a]">
          Validations{moduleLabel ? ` · ${moduleLabel}` : ""}
        </h3>
        <p className="text-[12px] text-[#64748b] mt-0.5">
          Live checks for this model. Focus jumps you to the related line item when available.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: "all" as const, label: `All (${source.length})` },
            { id: "ok" as const, label: `Passed (${counts.ok})` },
            { id: "warn" as const, label: `Warnings (${counts.warn})` },
            { id: "error" as const, label: `Errors (${counts.error})` },
          ] as const
        ).map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => setSev(chip.id)}
            className={cn(
              "h-8 rounded-full border px-3 text-[11px] font-medium",
              sev === chip.id
                ? "border-[#2563eb] bg-[#eff6ff] text-[#2563eb]"
                : "border-[#e2e8f0] bg-white text-[#475569] hover:bg-[#f8fafc]",
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>
      <ul className="rounded-xl border border-[#e2e8f0] bg-white overflow-hidden divide-y divide-[#f1f5f9] shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        {list.map((v) => (
          <li key={v.id} className="flex items-start gap-3 px-4 py-3.5">
            <span
              className={cn(
                "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                v.severity === "ok" && "bg-[#dcfce7] text-[#16a34a]",
                v.severity === "warn" && "bg-[#fef3c7] text-[#d97706]",
                v.severity === "error" && "bg-[#fee2e2] text-[#dc2626]",
              )}
            >
              {v.severity === "ok" ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : v.severity === "warn" ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-[#0f172a]">{v.rule}</p>
              <p className="text-[12px] text-[#64748b] mt-0.5 leading-relaxed">{v.detail}</p>
            </div>
            <button
              type="button"
              className="h-8 shrink-0 rounded-full border border-[#e2e8f0] px-3 text-[11px] font-medium text-[#2563eb] hover:bg-[#eff6ff]"
              onClick={() => {
                if (onFocus) onFocus(v.lineItemId)
                else toast.message(`Focused rule: ${v.rule}`)
              }}
            >
              Focus
            </button>
          </li>
        ))}
        {!list.length && (
          <li className="px-4 py-10 text-center text-[13px] text-[#94a3b8]">
            {rows != null && !source.length
              ? "No validation issues — run Validate Model to refresh."
              : "No issues in this filter."}
          </li>
        )}
      </ul>
    </div>
  )
}

function HistoryPanel({
  moduleLabel,
  rows,
}: {
  moduleLabel?: string
  rows?: HistoryRow[]
}) {
  const [q, setQ] = useState("")
  const source = rows ?? HISTORY_ROWS
  const list = source.filter(
    (h) =>
      !q.trim() ||
      h.action.toLowerCase().includes(q.toLowerCase()) ||
      h.target.toLowerCase().includes(q.toLowerCase()) ||
      h.user.toLowerCase().includes(q.toLowerCase()) ||
      h.detail.toLowerCase().includes(q.toLowerCase()),
  )
  return (
    <div className="flex-1 overflow-auto p-4 space-y-4 bg-[#fafbfc]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-[14px] font-semibold text-[#0f172a]">
            Change history{moduleLabel ? ` · ${moduleLabel}` : ""}
          </h3>
          <p className="text-[12px] text-[#64748b] mt-0.5">
            Who changed formulas and inputs in this model.
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94a3b8]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search history…"
            className="h-9 w-full rounded-full border border-[#e2e8f0] bg-white pl-8 pr-3 text-[12px]"
          />
        </div>
      </div>
      <ol className="relative space-y-0 border-l border-[#e2e8f0] ml-3">
        {list.map((h) => (
          <li key={h.id} className="relative pl-6 pb-5 last:pb-0">
            <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-[#2563eb] ring-4 ring-white" />
            <div className="rounded-xl border border-[#e2e8f0] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="flex flex-wrap items-start gap-2 justify-between">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-[#0f172a]">
                    {h.action}{" "}
                    <span className="text-[#2563eb] font-medium">{h.target}</span>
                  </p>
                  {h.detail ? (
                    <p className="text-[12px] text-[#64748b] mt-1 font-mono">{h.detail}</p>
                  ) : null}
                  <p className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-[#94a3b8]">
                    <span className="inline-flex items-center gap-1">
                      <User className="w-3 h-3" /> {h.user}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="w-3 h-3" /> {h.when}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </li>
        ))}
        {!list.length && (
          <li className="pl-6 py-10 text-[13px] text-[#94a3b8]">
            {q.trim()
              ? `No history matches “${q}”.`
              : rows != null
                ? "No audit entries yet."
                : "No history."}
          </li>
        )}
      </ol>
    </div>
  )
}

function LiveItemsTable({
  items,
  selectedId,
  periodLabels,
  periodKeys,
  previewByLine,
  viewGrain,
  canEdit,
  onSelect,
  onCellCommit,
}: {
  items: FpaLineItem[]
  selectedId: string | null
  periodLabels: string[]
  periodKeys: string[]
  previewByLine: Record<string, Array<number | null>>
  viewGrain: ViewGrain
  canEdit: boolean
  onSelect: (li: FpaLineItem) => void
  onCellCommit?: (lineItemId: string, periodIndex: number, value: number) => void
}) {
  const [editing, setEditing] = useState<{ rowId: string; col: number } | null>(null)
  const [draft, setDraft] = useState("")
  const displayLabels = useMemo(
    () => grainPeriodLabels(periodLabels, viewGrain),
    [periodLabels, viewGrain],
  )
  const monthlyOnly = viewGrain === "Monthly"

  const fmt = (v: number | null | undefined) => {
    if (v == null || Number.isNaN(v)) return "—"
    return v.toLocaleString("en-US", { maximumFractionDigits: 2 })
  }

  const commit = (rawValue?: string) => {
    if (!editing || !onCellCommit || !monthlyOnly) {
      setEditing(null)
      return
    }
    const raw = String(rawValue ?? draft).replace(/,/g, "").trim()
    const num = Number(raw)
    if (!Number.isFinite(num)) {
      setEditing(null)
      return
    }
    onCellCommit(editing.rowId, editing.col, num)
    setEditing(null)
  }

  return (
    <table className="w-full text-[12px] border-collapse min-w-[720px]">
      <thead className="sticky top-0 z-10 bg-[#f8fafc]">
        <tr className="text-left text-[#64748b] border-b border-[#e2e8f0]">
          <th className="w-8 px-2 py-2 font-medium">#</th>
          <th className="px-3 py-2 font-medium min-w-[150px]">Line Item</th>
          <th className="px-3 py-2 font-medium min-w-[180px]">Formula</th>
          {displayLabels.map((p) => (
            <th key={p} className="px-3 py-2 font-medium text-right whitespace-nowrap">
              {p}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {items.map((li, idx) => {
          const kind = lineItemKind(li)
          const fx = li.formulas?.[0]?.expression
          const preview = aggregatePreview(previewByLine[li.id] || [], viewGrain)
          const sel = selectedId === li.id
          const editableRow = kind === "INPUT" && canEdit && Boolean(onCellCommit) && monthlyOnly
          return (
            <tr
              key={li.id}
              className={cn(
                "border-b border-[#f1f5f9] cursor-pointer",
                sel ? "bg-[#eff6ff]" : "hover:bg-[#f8fafc]",
              )}
              onClick={() => onSelect(li)}
            >
              <td className="px-2 py-2 text-[#94a3b8]">{idx + 1}</td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  {kind === "INPUT" ? (
                    <BarChart3 className="w-3.5 h-3.5 text-[#16a34a] shrink-0" />
                  ) : (
                    <span className="inline-flex h-5 min-w-[22px] items-center justify-center rounded bg-[#eff6ff] px-1 text-[10px] font-bold italic text-[#2563eb] shrink-0">
                      fx
                    </span>
                  )}
                  <span className="font-medium text-[#0f172a]">{li.name}</span>
                </div>
              </td>
              <td className="px-3 py-2">
                <FormulaText formula={kind === "CALCULATED" ? fx || "—" : "Input"} />
              </td>
              {displayLabels.map((_, i) => {
                const isEditing = monthlyOnly && editing?.rowId === li.id && editing.col === i
                const hasPeriod = Boolean(periodKeys[i])
                return (
                  <td
                    key={`${li.id}-${i}`}
                    className={cn(
                      "px-2 py-1 text-right tabular-nums",
                      editableRow && hasPeriod && "hover:bg-white/80",
                    )}
                    onDoubleClick={(e) => {
                      e.stopPropagation()
                      if (!monthlyOnly) {
                        toast.message("Switch to Monthly to edit period cells")
                        return
                      }
                      if (!editableRow || !hasPeriod) {
                        if (kind === "CALCULATED") {
                          toast.message("Calculated cells are formula-driven")
                        }
                        return
                      }
                      setEditing({ rowId: li.id, col: i })
                      setDraft(
                        preview[i] == null || Number.isNaN(preview[i] as number)
                          ? ""
                          : String(preview[i]),
                      )
                    }}
                  >
                    {isEditing ? (
                      <input
                        autoFocus
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onBlur={(e) => commit(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commit((e.target as HTMLInputElement).value)
                          if (e.key === "Escape") setEditing(null)
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full h-8 rounded border-2 border-[#2563eb] px-2 text-right text-[11px] outline-none"
                      />
                    ) : (
                      <span
                        className={cn(
                          "inline-block w-full min-h-[28px] px-1 py-1",
                          editableRow && hasPeriod && "cursor-text",
                        )}
                        title={
                          !monthlyOnly
                            ? "Switch to Monthly to edit"
                            : editableRow && hasPeriod
                              ? "Double-click to edit"
                              : kind === "CALCULATED"
                                ? "Calculated from formula"
                                : undefined
                        }
                      >
                        {fmt(preview[i])}
                      </span>
                    )}
                  </td>
                )
              })}
            </tr>
          )
        })}
        {!items.length && (
          <tr>
            <td colSpan={3 + displayLabels.length} className="px-4 py-10 text-center text-[#94a3b8]">
              No line items{canEdit ? " — add one to start." : "."}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  )
}

type CreateProps = {
  open: boolean
  onClose: () => void
  onCreate: (body: {
    code: string
    name: string
    lineItemType: string
    category: string
    dataType?: string
    summaryMethod?: string
    isEditable?: boolean
  }) => Promise<void>
  defaultCategory: string
}

export function CreateLineItemDialog({ open, onClose, onCreate, defaultCategory }: CreateProps) {
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [kind, setKind] = useState<"INPUT" | "CALCULATED">("INPUT")
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-xl space-y-3">
        <h3 className="text-sm font-semibold text-[#0f172a]">Add line item</h3>
        <label className="block text-xs text-[#64748b]">
          Name
          <input
            className="mt-1 w-full h-9 rounded-full border border-[#e2e8f0] px-3 text-sm"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (!code)
                setCode(
                  e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]+/g, "_")
                    .slice(0, 24),
                )
            }}
          />
        </label>
        <label className="block text-xs text-[#64748b]">
          Code
          <input
            className="mt-1 w-full h-9 rounded-full border border-[#e2e8f0] px-3 text-sm font-mono"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
        </label>
        <label className="block text-xs text-[#64748b]">
          Type
          <select
            className="mt-1 w-full h-9 rounded-full border border-[#e2e8f0] px-3 text-sm"
            value={kind}
            onChange={(e) => setKind(e.target.value as "INPUT" | "CALCULATED")}
          >
            <option value="INPUT">INPUT / Driver</option>
            <option value="CALCULATED">CALCULATED</option>
          </select>
        </label>
        {err && <p className="text-[11px] text-[#b91c1c]">{err}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            className="h-9 rounded-full border px-3 text-xs"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy || !name.trim() || !code.trim()}
            className="h-9 rounded-full bg-[#2563eb] px-4 text-xs text-white disabled:opacity-50"
            onClick={async () => {
              setBusy(true)
              setErr(null)
              try {
                await onCreate({
                  name: name.trim(),
                  code: code.trim(),
                  lineItemType: kind === "CALCULATED" ? "CALC" : "REVENUE",
                  category: defaultCategory || "General",
                  dataType: "CURRENCY",
                  summaryMethod: "SUM",
                  isEditable: kind === "INPUT",
                })
                setName("")
                setCode("")
                onClose()
              } catch (e) {
                setErr(e instanceof Error ? e.message : "Create failed")
              } finally {
                setBusy(false)
              }
            }}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  )
}
