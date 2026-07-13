import type {
  FpaAuditEntry,
  FpaFormulaImpactNode,
  FpaGridValidation,
  FpaLineItem,
  FpaSetupError,
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
): DetailedWorkspaceRow[] {
  return items.map((li) => {
    const valuesRaw = previewByLine[li.id] ?? Array.from({ length: periodCount }, () => null)
    const values = valuesRaw.map((v) => (typeof v === "number" && Number.isFinite(v) ? v : 0))
    const kind = lineItemKind(li) === "CALCULATED" ? "CALCULATED" : "INPUT"
    const expression = li.formulas?.[0]?.expression?.trim()
    return {
      id: li.id,
      name: li.name,
      kind,
      formula: kind === "CALCULATED" && expression ? expression : "—",
      values,
      fy: sumValues(valuesRaw),
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
    details: formatAuditDetails(e),
    lineItemId:
      e.entityType?.toLowerCase().includes("line") && e.entityId ? e.entityId : null,
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
