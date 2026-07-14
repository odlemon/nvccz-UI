import type {
  FpaAuditEntry,
  FpaDataMappingEntry,
  FpaDataMappingsResponse,
  FpaExceptionItem,
  FpaExceptionsResponse,
  FpaFormulaImpactNode,
  FpaGridValidation,
  FpaLineItem,
  FpaSensitivityAnalysis,
  FpaSetupError,
  FpaValidationChecksResponse,
} from "@/lib/api/fpa-api"
import { lineItemKind } from "@/components/fpa/grid/cell-state"

export type DetailedWorkspaceRow = {
  id: string
  name: string
  kind: "INPUT" | "CALCULATED"
  formula: string
  values: number[]
  fy: number
  format?: "number" | "currency" | "percent"
  formulaId?: string | null
}

export type DetailedAuditRow = {
  id: string
  time: string
  user: string
  action: string
  details: string
  lineItemId?: string | null
}

export type DetailedExceptionRow = {
  id: string
  sev: "error" | "warning" | "info"
  lineItem: string
  issue: string
  impact: "High" | "Medium" | "Low"
  lineItemId?: string | null
}

export type DetailedValidationCheck = {
  id: string
  check: string
  status: "passed" | "warning" | "error"
  module: string
  lineItemId?: string | null
  detail?: string
}

export type DetailedMappingRow = {
  id: string
  source: string
  system: string
  target: string
  targetLineItemId?: string | null
  ok: boolean
  status: string
  notes?: string | null
}

export type DetailedCellMeta = {
  lastCalculatedAt?: string | null
  formulaUpdatedAt?: string | null
  formulaUpdatedByName?: string | null
  validationStatus?: string | null
  expression?: string | null
  value?: number | string | null
}

export type DetailedTraceNode = {
  id: string
  label: string
  kind: "driver" | "calculated" | "result"
  value?: number | string | null
  expression?: string | null
}

export type DetailedTraceEdge = { from: string; to: string }

export type DetailedTraceView = {
  nodes: DetailedTraceNode[]
  edges: DetailedTraceEdge[]
  rootExpression?: string | null
  rootValue?: number | string | null
}

export type DetailedSensitivityView = {
  driverName: string
  shockLabel: string
  impacts: Array<{
    lineItemId: string
    name: string
    deltaTotal: number
    deltaPct: number
  }>
  months: string[]
  baseCase: number[]
  shocked: number[]
  unitLabel: string
  seriesName?: string
  emptyMessage?: string
}

function inferFormat(li: FpaLineItem): "number" | "currency" | "percent" {
  const fmt = String(li.format || li.dataType || "").toLowerCase()
  if (fmt.includes("percent") || fmt.includes("%")) return "percent"
  if (fmt.includes("currency") || li.currencyCode || li.currency) return "currency"
  return "number"
}

function sumValues(values: Array<number | null | undefined>): number {
  return values.reduce<number>((acc, v) => acc + (typeof v === "number" && Number.isFinite(v) ? v : 0), 0)
}

export function buildDetailedRows(
  items: FpaLineItem[],
  periodCount: number,
  previewByLine: Record<string, Array<number | null>>,
  fyTotals?: Record<string, number> | null,
): DetailedWorkspaceRow[] {
  return items.map((li) => {
    const valuesRaw = previewByLine[li.id] ?? Array.from({ length: periodCount }, () => null)
    const values = valuesRaw.map((v) => (typeof v === "number" && Number.isFinite(v) ? v : 0))
    const kind = lineItemKind(li) === "CALCULATED" ? "CALCULATED" : "INPUT"
    const expression = li.formulas?.[0]?.expression?.trim()
    const fyFromApi = fyTotals?.[li.id]
    return {
      id: li.id,
      name: li.name,
      kind,
      formula: kind === "CALCULATED" && expression ? expression : "—",
      values,
      fy:
        typeof fyFromApi === "number" && Number.isFinite(fyFromApi)
          ? fyFromApi
          : sumValues(valuesRaw),
      format: inferFormat(li),
      formulaId: li.formulas?.[0]?.id ?? li.formulaId ?? null,
    }
  })
}

function humanizeAuditAction(action?: string): string {
  const a = String(action || "Change").trim()
  if (!a) return "Change"
  return a
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatAuditValue(v: unknown): string {
  if (v == null) return "—"
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v)
  if (typeof v === "object") {
    const o = v as Record<string, unknown>
    if (o.name != null) return String(o.name)
    if (o.code != null) return String(o.code)
    if (o.expression != null) return String(o.expression)
    if (o.value != null) return String(o.value)
    try {
      return JSON.stringify(o)
    } catch {
      return "Updated"
    }
  }
  return String(v)
}

/** Prefer readable summary; never dump raw before/after JSON into the table. */
export function formatAuditDetails(entry: {
  summary?: string
  entityType?: string
  entityId?: string | null
  before?: unknown
  after?: unknown
  action?: string
}): string {
  const summary = String(entry.summary || "").trim()
  if (summary && !summary.startsWith("{") && !summary.startsWith("[")) {
    return summary
  }

  if (summary.startsWith("{") || summary.startsWith("[")) {
    try {
      const parsed = JSON.parse(summary) as {
        before?: unknown
        after?: unknown
        name?: string
        message?: string
      }
      if (parsed.message) return String(parsed.message)
      if (parsed.name) return String(parsed.name)
      const before = parsed.before ?? entry.before
      const after = parsed.after ?? entry.after
      if (before != null || after != null) {
        const b = formatAuditValue(before)
        const a = formatAuditValue(after)
        if (b !== "—" && a !== "—" && b !== a) return `${b} → ${a}`
        if (a !== "—") return a
        if (b !== "—") return b
      }
    } catch {
      /* fall through */
    }
  }

  if (entry.before != null || entry.after != null) {
    const b = formatAuditValue(entry.before)
    const a = formatAuditValue(entry.after)
    if (b !== "—" && a !== "—" && b !== a) return `${b} → ${a}`
    if (a !== "—") return a
    if (b !== "—") return b
  }

  if (entry.entityType) {
    return entry.entityType.replace(/_/g, " ")
  }
  return "—"
}

export function buildAuditUiRows(entries: FpaAuditEntry[]): DetailedAuditRow[] {
  return entries.map((e, i) => ({
    id: e.id || `audit-${i}`,
    time: e.at
      ? new Date(e.at).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
      : "",
    user: e.userName || e.userId || "User",
    action: humanizeAuditAction(e.action),
    details: formatAuditDetails({
      ...e,
      summary: e.summary || e.details || undefined,
    }),
    lineItemId:
      e.lineItemId ||
      (e.entityType?.toLowerCase().includes("line") && e.entityId ? e.entityId : null),
  }))
}

function impactFromSeverity(sev: string): "High" | "Medium" | "Low" {
  const s = sev.toUpperCase()
  if (s === "ERROR") return "High"
  if (s === "WARNING" || s === "WARN") return "Medium"
  return "Low"
}

function lineItemLabel(
  lineItemId: string | null | undefined,
  lookup: Map<string, FpaLineItem>,
): string {
  if (!lineItemId) return "Model"
  return lookup.get(lineItemId)?.name || "Line item"
}

function moduleLabel(
  err: FpaSetupError | FpaGridValidation,
  lookup: Map<string, FpaLineItem>,
): string {
  const liId = "lineItemId" in err ? err.lineItemId : undefined
  if (liId) {
    const li = lookup.get(liId)
    if (li?.moduleName) return li.moduleName
    if (li?.category) return li.category
  }
  if ("moduleId" in err && err.moduleId) return String(err.moduleId)
  if ("field" in err && err.field) return err.field
  return "Model"
}

export function buildExceptionRows(
  errors: FpaSetupError[],
  warnings: FpaSetupError[],
  info: FpaSetupError[],
  gridValidations: FpaGridValidation[],
  lineItems: FpaLineItem[],
): DetailedExceptionRow[] {
  const lookup = new Map(lineItems.map((li) => [li.id, li]))
  const rows: DetailedExceptionRow[] = []

  const pushSetup = (list: FpaSetupError[], sev: DetailedExceptionRow["sev"], prefix: string) => {
    list.forEach((e, i) => {
      rows.push({
        id: `${prefix}-${e.code || i}`,
        sev,
        lineItem: lineItemLabel(e.lineItemId, lookup),
        issue: e.message,
        impact: impactFromSeverity(e.severity || sev),
        lineItemId: e.lineItemId,
      })
    })
  }

  pushSetup(errors, "error", "err")
  pushSetup(warnings, "warning", "warn")
  pushSetup(info, "info", "info")

  gridValidations.forEach((v, i) => {
    const sevRaw = String(v.severity || "INFO").toUpperCase()
    const sev: DetailedExceptionRow["sev"] =
      sevRaw === "ERROR" ? "error" : sevRaw === "WARNING" || sevRaw === "WARN" ? "warning" : "info"
    rows.push({
      id: `grid-${v.code || i}`,
      sev,
      lineItem: lineItemLabel(v.lineItemId, lookup),
      issue: v.message,
      impact: impactFromSeverity(sevRaw),
      lineItemId: v.lineItemId,
    })
  })

  return rows
}

export function buildValidationChecks(
  errors: FpaSetupError[],
  warnings: FpaSetupError[],
  info: FpaSetupError[],
  gridValidations: FpaGridValidation[],
  lineItems: FpaLineItem[],
): DetailedValidationCheck[] {
  const lookup = new Map(lineItems.map((li) => [li.id, li]))
  const rows: DetailedValidationCheck[] = []

  const push = (
    list: Array<FpaSetupError | FpaGridValidation>,
    status: DetailedValidationCheck["status"],
    prefix: string,
  ) => {
    list.forEach((e, i) => {
      const message = "message" in e ? e.message : ""
      const code = "code" in e && e.code ? e.code : message.slice(0, 48) || "Check"
      rows.push({
        id: `${prefix}-${i}`,
        check: code,
        status,
        module: moduleLabel(e, lookup),
        lineItemId: "lineItemId" in e ? e.lineItemId : undefined,
      })
    })
  }

  push(errors, "error", "v-err")
  push(warnings, "warning", "v-warn")
  push(info, "warning", "v-info")
  push(gridValidations, "warning", "v-grid")

  return rows
}

export function buildValidationChecksFromCatalog(
  data: FpaValidationChecksResponse | null | undefined,
): DetailedValidationCheck[] {
  if (!data?.checks?.length) return []
  return data.checks.map((c) => {
    const statusRaw = String(c.status || "").toUpperCase()
    const status: DetailedValidationCheck["status"] =
      statusRaw === "ERROR" ? "error" : statusRaw === "WARNING" ? "warning" : "passed"
    return {
      id: c.key,
      check: c.label || c.key,
      status,
      module: c.moduleName || c.moduleId || "Model",
      detail: c.detail || undefined,
    }
  })
}

export function impactNodeNames(nodes?: FpaFormulaImpactNode[]): string[] {
  return (nodes || []).map((n) => n.name).filter(Boolean)
}

export function validationSummaryFromCounts(
  summary: {
    total?: number
    passed?: number
    warnings?: number
    errors?: number
  } | null,
  exceptionRows: DetailedExceptionRow[],
): { total: number; passed: number; warnings: number; errors: number } {
  if (summary && typeof summary.total === "number") {
    return {
      total: summary.total,
      passed: summary.passed ?? 0,
      warnings: summary.warnings ?? 0,
      errors: summary.errors ?? 0,
    }
  }
  const errors = exceptionRows.filter((e) => e.sev === "error").length
  const warnings = exceptionRows.filter((e) => e.sev === "warning").length
  const info = exceptionRows.filter((e) => e.sev === "info").length
  const failed = errors + warnings
  const passed = Math.max(0, failed === 0 ? 1 : 0)
  return {
    total: failed + passed + info,
    passed,
    warnings: warnings + info,
    errors,
  }
}

function mappingOk(status: string): boolean {
  const s = status.toUpperCase()
  return s === "MAPPED" || s === "OK" || s === "ACTIVE" || s === "SUGGESTED"
}

/** Soft-rename legacy SaaS source labels to Arcus-owned names for display. */
export function normalizeMappingSourceSystem(sourceSystem: string | null | undefined): string {
  const raw = String(sourceSystem || "").trim()
  if (!raw) return raw
  const key = raw.toLowerCase()
  if (key.includes("netsuite")) return "Accounting GL"
  if (key.includes("salesforce")) return "CRM"
  if (key.includes("workday") || key.includes("adp")) return "Payroll"
  if (key.includes("plaid")) return "Banking"
  return raw
}

/** When backend catalog is empty, derive provisional mappings from the model's own line items. */
export function inferSuggestedMappingsFromLineItems(
  lineItems: FpaLineItem[],
  moduleId?: string | null,
): FpaDataMappingsResponse {
  const items = (moduleId
    ? lineItems.filter((li) => li.moduleId === moduleId)
    : lineItems
  ).filter((li) => li.id && li.name)

  // Prefixes match backend seed-catalog sample fields (Arcus-owned).
  const entries: FpaDataMappingEntry[] = items.map((li, i) => {
    const code = String(li.code || li.name || `LI_${i}`).toUpperCase().replace(/\s+/g, "_")
    const type = String(li.lineItemType || li.category || "").toUpperCase()
    const blob = `${code} ${type}`
    let sourceSystem = "Custom / CSV"
    let sourceField = `CSV.${code}`

    if (/HEADCOUNT|HC\b|FTE|PAYROLL|SALARY|WAGE/.test(blob)) {
      sourceSystem = "Payroll"
      sourceField = `PR.${code}`
    } else if (/PROCURE|PO_|VENDOR|PURCHASE/.test(blob)) {
      sourceSystem = "Procurement"
      sourceField = `PROC.${code}`
    } else if (/ASSET|CAPEX|DEPRECIAT|FA_/.test(blob)) {
      sourceSystem = "Fixed Assets"
      sourceField = `FA.${code}`
    } else if (/STOCK|INVENTOR|SKU|COGS/.test(blob)) {
      sourceSystem = "Stock"
      sourceField = `INV.${code}`
    } else if (/PORTFOLIO|NAV|AUM|HOLDING/.test(blob)) {
      sourceSystem = "Portfolio"
      sourceField = `PF.${code}`
    } else if (/LOAN|DEBT|FACILITY|INTEREST/.test(blob)) {
      sourceSystem = "Loan"
      sourceField = `LOAN.${code}`
    } else if (/BOOKING|PIPELINE|CRM|ARR|MRR|CHURN|UNIT|PRICE|SEAT|SALES/.test(blob)) {
      sourceSystem = "CRM"
      sourceField = `CRM.${code}`
    } else if (/CASH|BANK|TREASURY|BALANCE/.test(blob)) {
      sourceSystem = "Banking"
      sourceField = `BANK.${code}`
    } else if (/ASSUMPTION|DRIVER|MANUAL|INPUT/.test(blob) || type === "INPUT" || type === "DRIVER") {
      sourceSystem = "Manual"
      sourceField = `MANUAL.${code}`
    } else if (/REV|REVENUE|INCOME|GL_|ACCOUNT/.test(blob)) {
      sourceSystem = "Accounting GL"
      sourceField = `GL_ACCOUNT.${code}`
    } else if (/EXCEL|XLSX|SHEET/.test(blob)) {
      sourceSystem = "Excel"
      sourceField = `XLS.${code}`
    } else if (/API|INTEGRATION|WEBHOOK/.test(blob)) {
      sourceSystem = "API"
      sourceField = `API.${code}`
    }

    return {
      id: `suggested-${li.id}`,
      sourceField,
      sourceSystem,
      targetLineItemId: li.id,
      targetLineItemName: li.name,
      status: "SUGGESTED",
    }
  })

  const total = entries.length
  return {
    summary: {
      total,
      mapped: 0,
      unmapped: total,
      pct: 0,
    },
    entries,
    nextCursor: null,
  }
}

export function buildMappingUiRows(entries: FpaDataMappingEntry[]): DetailedMappingRow[] {
  return entries.map((e, i) => ({
    id: e.id || `map-${i}`,
    source: e.sourceField,
    system: normalizeMappingSourceSystem(e.sourceSystem),
    target: e.targetLineItemName || (e.targetLineItemId ? "Line item" : "Unmapped"),
    targetLineItemId: e.targetLineItemId,
    ok: mappingOk(e.status) && Boolean(e.targetLineItemId),
    status: e.status,
    notes: e.notes ?? null,
  }))
}

export function buildTraceViewFromApi(data: {
  root?: { cellId?: string; expression?: string; value?: number | string }
  nodes?: Array<{
    id?: string
    label?: string
    kind?: string
    value?: number | string
    expression?: string
  }>
  edges?: Array<{ from?: string; to?: string }>
} | null | undefined): DetailedTraceView | null {
  if (!data?.nodes?.length) return null
  const nodes: DetailedTraceNode[] = data.nodes
    .filter((n) => n.id)
    .map((n) => {
      const kindRaw = String(n.kind || "").toUpperCase()
      let kind: DetailedTraceNode["kind"] = "calculated"
      if (kindRaw.includes("RESULT") || kindRaw.includes("OUTPUT")) kind = "result"
      else if (
        kindRaw.includes("INPUT") ||
        kindRaw.includes("DRIVER") ||
        kindRaw.includes("PRECEDENT") ||
        kindRaw.includes("LINE_ITEM") ||
        kindRaw === "LINE"
      ) {
        kind = "driver"
      } else if (kindRaw.includes("DEPENDENT") || kindRaw.includes("CALC")) {
        kind = "calculated"
      }
      return {
        id: String(n.id),
        label: n.label || String(n.id),
        kind,
        value: n.value ?? null,
        expression: n.expression ?? null,
      }
    })
  const edges: DetailedTraceEdge[] = (data.edges || [])
    .filter((e) => e.from && e.to)
    .map((e) => ({ from: String(e.from), to: String(e.to) }))
  return {
    nodes,
    edges,
    rootExpression: data.root?.expression ?? null,
    rootValue: data.root?.value ?? null,
  }
}

export function buildCellMetaFromDetail(data: {
  lastCalculatedAt?: unknown
  formulaUpdatedAt?: unknown
  formulaUpdatedByName?: unknown
  validationStatus?: unknown
  formula?: unknown
  value?: unknown
} | null | undefined): DetailedCellMeta | null {
  if (!data) return null
  const formula =
    typeof data.formula === "string"
      ? data.formula
      : data.formula && typeof data.formula === "object" && "expression" in data.formula
        ? String((data.formula as { expression?: string }).expression || "")
        : null
  return {
    lastCalculatedAt: data.lastCalculatedAt != null ? String(data.lastCalculatedAt) : null,
    formulaUpdatedAt: data.formulaUpdatedAt != null ? String(data.formulaUpdatedAt) : null,
    formulaUpdatedByName:
      data.formulaUpdatedByName != null ? String(data.formulaUpdatedByName) : null,
    validationStatus: data.validationStatus != null ? String(data.validationStatus) : null,
    expression: formula,
    value: (data.value as number | string | null | undefined) ?? null,
  }
}

export function mappingSummaryPct(summary?: FpaDataMappingsResponse["summary"] | null): number {
  if (!summary) return 0
  if (typeof summary.pct === "number" && Number.isFinite(summary.pct)) {
    return Math.round(summary.pct)
  }
  if (summary.total > 0) return Math.round((summary.mapped / summary.total) * 100)
  return 0
}

function sevFromApi(raw: string): DetailedExceptionRow["sev"] {
  const s = raw.toUpperCase()
  if (s === "ERROR" || s === "ERR") return "error"
  if (s === "WARNING" || s === "WARN") return "warning"
  return "info"
}

function impactLabel(raw?: string | null, sev?: string): DetailedExceptionRow["impact"] {
  const s = String(raw || "").toUpperCase()
  if (s === "HIGH") return "High"
  if (s === "MEDIUM") return "Medium"
  if (s === "LOW") return "Low"
  return impactFromSeverity(sev || "INFO")
}

export function buildExceptionRowsFromFeed(
  feed: FpaExceptionsResponse | null | undefined,
): DetailedExceptionRow[] {
  if (!feed?.items?.length) return []
  return feed.items.map((e: FpaExceptionItem, i) => ({
    id: e.id || e.mappingId || `exc-${e.issueCode || e.code || i}`,
    sev: sevFromApi(e.severity),
    lineItem:
      e.lineItemName ||
      (e.type === "MAPPING" || e.code === "UNMAPPED_SOURCE"
        ? "Mapping"
        : e.lineItemId
          ? "Line item"
          : "Model"),
    issue: e.message,
    impact: impactLabel(e.impact, e.severity),
    lineItemId: e.lineItemId,
  }))
}

function formatPeriodLabel(iso: string, index: number): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso || `P${index + 1}`
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }).replace(" ", " '")
}

function downsampleSeries(values: number[], maxPoints: number): number[] {
  if (values.length <= maxPoints) return values
  const out: number[] = []
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.round((i / (maxPoints - 1)) * (values.length - 1))
    out.push(values[idx])
  }
  return out
}

export function buildSensitivityView(
  data: FpaSensitivityAnalysis | null | undefined,
): DetailedSensitivityView | null {
  if (!data) return null
  const shockVal = data.driver?.shock?.value ?? 5
  const shockType = String(data.driver?.shock?.type || "PERCENT").toUpperCase()
  const shockLabel =
    data.driver?.shockLabel ||
    (shockType === "PERCENT" ? `+${shockVal}%` : `+${shockVal}`)
  const periods = data.series?.periods || []
  const baseCase = data.series?.baseCase || []
  const shocked = data.series?.shocked || []
  const maxPts = 6
  const months = (() => {
    if (!periods.length) return ["—"]
    if (periods.length <= maxPts) return periods.map((p, i) => formatPeriodLabel(p, i))
    const out: string[] = []
    for (let i = 0; i < maxPts; i++) {
      const idx = Math.round((i / (maxPts - 1)) * (periods.length - 1))
      out.push(formatPeriodLabel(periods[idx], idx))
    }
    return out
  })()

  const baseDown = downsampleSeries(baseCase, Math.min(maxPts, Math.max(baseCase.length, 1)))
  const shockDown = downsampleSeries(shocked, Math.min(maxPts, Math.max(shocked.length, 1)))

  const impacts = (data.impacts || [])
    .slice()
    .sort((a, b) => Math.abs(b.deltaTotal) - Math.abs(a.deltaTotal))
    .slice(0, 4)
    .map((x) => ({
      lineItemId: x.lineItemId,
      name: x.name,
      deltaTotal: x.deltaTotal,
      deltaPct: x.deltaPct,
    }))

  const unit = String(data.series?.unit || "CURRENCY").toUpperCase()
  const unitLabel =
    unit.includes("000") || unit.includes("THOUSAND")
      ? "USD (000s)"
      : unit === "CURRENCY"
        ? "USD"
        : data.series?.unit || "Value"

  return {
    driverName: data.driver?.name || "Driver",
    shockLabel,
    impacts,
    months: months.length ? months : ["—"],
    baseCase: baseDown.length ? baseDown : [0],
    shocked: shockDown.length ? shockDown : [0],
    unitLabel,
    seriesName: data.series?.lineItemName,
    emptyMessage:
      impacts.length === 0
        ? data.message ||
          "No downstream calculated impacts for this driver — add formula line items or pick another driver."
        : undefined,
  }
}
