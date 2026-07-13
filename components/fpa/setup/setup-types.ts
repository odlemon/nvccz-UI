import type { FpaBaselineMode, FpaSetupError } from "@/lib/api/fpa-api"

export const SETUP_STEPS = [
  { id: "create", label: "Create model", short: "1" },
  { id: "type", label: "Select model type", short: "2" },
  { id: "horizon", label: "Select time horizon", short: "3" },
  { id: "entities", label: "Select entities and departments", short: "4" },
  { id: "coa", label: "Select chart of accounts", short: "5" },
  { id: "dimensions", label: "Select dimensions", short: "6" },
  { id: "baseline", label: "Select baseline", short: "7" },
  { id: "lineItems", label: "Create line items", short: "8" },
  { id: "formulas", label: "Configure formulas", short: "9" },
  { id: "drivers", label: "Configure drivers", short: "10" },
  { id: "workflow", label: "Configure workflow", short: "11" },
  { id: "validate", label: "Validate model", short: "12" },
] as const

export type SetupStepId = (typeof SETUP_STEPS)[number]["id"]

export interface SetupDraft {
  /** Set after successful POST /models/setup when validation.passed is false (fix loop). */
  modelId: string | null
  defaultScenarioId: string | null
  defaultVersionId: string | null
  name: string
  description: string
  baseCurrency: string
  modelType: string
  startPeriod: string
  endPeriod: string
  timeGranularity: string
  entityIds: string[]
  departmentIds: string[]
  accountIds: string[]
  dimensions: Array<{ key: string; valueIds: string[] }>
  baselineMode: FpaBaselineMode
  sourceVersionId: string
  sourceScenarioId: string
  lineItems: Array<{ code: string; name: string; lineItemType: string; category: string }>
  formulas: Array<{ lineItemCode: string; expression: string }>
  drivers: Array<{ code: string; name: string; value: number; category: string }>
  workflowName: string
  workflowTasks: Array<{ title: string }>
}

export function emptySetupDraft(year = new Date().getFullYear()): SetupDraft {
  return {
    modelId: null,
    defaultScenarioId: null,
    defaultVersionId: null,
    name: "",
    description: "",
    baseCurrency: "USD",
    modelType: "BUDGET",
    startPeriod: `${year}-01-01`,
    endPeriod: `${year}-12-01`,
    timeGranularity: "MONTHLY",
    entityIds: [],
    departmentIds: [],
    accountIds: [],
    dimensions: [],
    baselineMode: "NONE",
    sourceVersionId: "",
    sourceScenarioId: "",
    lineItems: [],
    formulas: [],
    drivers: [],
    workflowName: "",
    workflowTasks: [{ title: "Finance input" }],
  }
}

/** Map API validation step names → modal step ids. */
export function mapApiStepToSetupStep(apiStep?: string): SetupStepId | null {
  if (!apiStep) return null
  const s = apiStep.toLowerCase().replace(/[_-]/g, "")
  const map: Record<string, SetupStepId> = {
    create: "create",
    createmodel: "create",
    name: "create",
    type: "type",
    modeltype: "type",
    horizon: "horizon",
    period: "horizon",
    entities: "entities",
    entity: "entities",
    departments: "entities",
    scope: "entities",
    coa: "coa",
    accounts: "coa",
    dimensions: "dimensions",
    dimension: "dimensions",
    baseline: "baseline",
    lineitems: "lineItems",
    lineitem: "lineItems",
    formulas: "formulas",
    formula: "formulas",
    drivers: "drivers",
    driver: "drivers",
    workflow: "workflow",
    validate: "validate",
  }
  return map[s] ?? null
}

export function validationToChecks(errors: FpaSetupError[], passed: boolean) {
  if (!errors.length && passed) {
    return {
      passed: true,
      checks: [{ id: "server", label: "Server validation", ok: true }],
    }
  }
  return {
    passed,
    checks: errors.map((e, i) => ({
      id: e.code || `err-${i}`,
      label: e.message,
      ok: false,
      detail: [e.code, e.step, e.field].filter(Boolean).join(" · ") || undefined,
    })),
  }
}

export const AVAILABLE_DIMENSIONS = [
  { key: "REGION", label: "Region" },
  { key: "PRODUCT", label: "Product line" },
  { key: "CHANNEL", label: "Channel" },
] as const
