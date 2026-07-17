import { apiClient, type ApiResponse } from '@/lib/api/api-client'

const FPA = '/v1/fpa'

/** Parse Prisma Decimal strings (and numbers) safely for UI math. */
export function asNumber(value: unknown, fallback = 0): number {
  if (value == null || value === '') return fallback
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback
  const n = Number(String(value).replace(/,/g, ''))
  return Number.isFinite(n) ? n : fallback
}

/** Normalize API currency values (e.g. "US") to ISO 4217 codes for Intl. */
function resolveCurrencyCode(currency?: string | null): string {
  const raw = String(currency || 'USD').trim().toUpperCase()
  if (raw === 'US' || raw === '$' || raw === 'DOLLAR' || raw === 'DOLLARS') return 'USD'
  if (/^[A-Z]{3}$/.test(raw)) return raw
  return 'USD'
}

export function formatMoney(value: unknown, currency = 'USD'): string {
  const n = asNumber(value)
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
  const code = resolveCurrencyCode(currency)
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 0,
    }).format(n)
  } catch {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(n)
  }
}

export type FpaModelStatus = 'DRAFT' | 'OPEN' | 'SUBMITTED' | 'APPROVED' | 'LOCKED' | 'ARCHIVED' | 'ACTIVE' | 'VALID' | 'INVALID' | 'PUBLISHED'
export type FpaVersionStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'LOCKED' | 'ARCHIVED'
export type FpaTaskStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'RETURNED'
  | 'APPROVED'
  | 'CANCELLED'
  | 'OPEN'

export type FpaModelType = 'BUDGET' | 'FORECAST' | 'ROLLING_FORECAST'
export type FpaTimeGranularity = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'
export type FpaBaselineMode =
  | 'NONE'
  | 'ZERO_BASED'
  | 'PRIOR_YEAR_ACTUAL'
  | 'PRIOR_YEAR_BUDGET'
  | 'LATEST_FORECAST'
  | 'DRIVER_BASED'
  | 'CUSTOM'
  | 'ACTUALS_SYNC'
  | 'PRIOR_FORECAST'
  | string

export interface FpaSetupError {
  code: string
  step?: string
  message: string
  field?: string
  severity?: 'ERROR' | 'WARNING' | 'INFO' | string
  category?: string
  lineItemId?: string | null
  moduleId?: string | null
  type?: string
}

export interface FpaSetupValidation {
  passed: boolean
  errors: FpaSetupError[]
  warnings?: FpaSetupError[]
  info?: FpaSetupError[]
  circular?: boolean
  circularPath?: string[]
  circularCheck?: { passed: boolean; path?: string[] | null }
  summary?: {
    total?: number
    passed?: number
    warnings?: number
    errors?: number
    infos?: number
  }
  issues?: FpaSetupError[]
}

export type FpaBuilderModuleStatus = 'DRAFT' | 'VALID' | 'INVALID' | 'PUBLISHED' | 'ARCHIVED'

export interface FpaBuilderModule {
  id: string
  modelId?: string
  code?: string
  name: string
  description?: string | null
  parentId?: string | null
  parentModuleId?: string | null
  calcOrder?: number
  calculationOrder?: number
  sortOrder?: number
  status?: FpaBuilderModuleStatus | string
  dimensionKeys?: string[]
  lineItemCount?: number
  createdAt?: string
  updatedAt?: string
  children?: FpaBuilderModule[]
}

export type FpaDepEdgeKind = 'direct' | 'indirect' | 'external' | 'invalid'

export interface FpaDependencyGraph {
  circular: boolean
  circularPath?: string[]
  view?: string
  modules: Array<{
    id: string
    name: string
    lineItems: Array<{
      id: string
      code: string
      name: string
      kind?: string
    }>
  }>
  edges: Array<{
    id: string
    sourceLineItemId: string
    targetLineItemId: string
    kind: FpaDepEdgeKind | string
  }>
}

export interface FpaFormulaImpactNode {
  id: string
  code: string
  name: string
  moduleId?: string | null
  moduleName?: string | null
}

export interface FpaFormulaMutationResult {
  formula: FpaFormula
  impact?: {
    precedents?: FpaFormulaImpactNode[]
    dependents?: FpaFormulaImpactNode[]
    usedIn?: FpaFormulaImpactNode[]
  }
  graphDelta?: {
    upsertEdges?: FpaDependencyGraph['edges']
    removeEdgeIds?: string[]
  }
}

export interface FpaPublishResult {
  modelId: string
  /** Locked published snapshot (same as publishedVersionId when both present). */
  versionId: string
  publishedVersionId?: string
  /** New DRAFT working copy — Builder should switch here after publish. */
  workingCopyVersionId?: string
  workingCopy?: FpaVersion
  publishedBy?: string
  publishedById?: string
  publishedByName?: string | null
  publishedAt: string
  checksum?: string | null
  status?: string
  versionStatus?: string
  validationResult?: { passed: boolean; errors?: FpaSetupError[]; warnings?: FpaSetupError[] }
  notes?: string | null
  message?: string | null
}

export interface FpaAuditEntry {
  id: string
  at: string
  userId?: string | null
  userName?: string | null
  action: string
  entityType?: string
  entityId?: string | null
  lineItemId?: string | null
  moduleId?: string | null
  cellId?: string | null
  summary?: string
  details?: string | null
  before?: unknown
  after?: unknown
}

export interface FpaDataMappingEntry {
  id: string
  sourceField: string
  sourceSystem: string
  targetLineItemId?: string | null
  targetLineItemName?: string | null
  status: string
  notes?: string | null
  lastSyncedAt?: string | null
  moduleId?: string | null
}

export interface FpaDataMappingsResponse {
  summary: {
    total: number
    mapped: number
    unmapped?: number
    pct: number
  }
  entries: FpaDataMappingEntry[]
  nextCursor?: string | null
}

export interface FpaExceptionItem {
  id?: string
  severity: string
  impact?: string | null
  issueCode?: string | null
  code?: string | null
  type?: string | null
  message: string
  lineItemId?: string | null
  lineItemName?: string | null
  moduleId?: string | null
  mappingId?: string | null
  periodDate?: string | null
  source?: string | null
}

export interface FpaExceptionsResponse {
  modelId?: string
  versionId?: string | null
  scenarioId?: string | null
  moduleId?: string | null
  counts: {
    total?: number
    errors: number
    warnings: number
    info: number
    high?: number
    medium?: number
    low?: number
  }
  items: FpaExceptionItem[]
}

export interface FpaSensitivityImpact {
  lineItemId: string
  name: string
  code?: string
  baseTotal?: number
  shockedTotal?: number
  deltaTotal: number
  deltaPct: number
}

export interface FpaSensitivityAnalysis {
  driver: {
    lineItemId: string
    code?: string
    name: string
    shock: { type: string; value: number }
    shockLabel?: string
  }
  impacts: FpaSensitivityImpact[]
  series: {
    periods: string[]
    baseCase: number[]
    shocked: number[]
    unit?: string
    lineItemId?: string
    lineItemName?: string
  }
  versionId?: string
  scenarioId?: string
  message?: string
}

export interface FpaLineItemTemplate {
  id: string
  name: string
  description?: string
  lineItems: Array<{
    code: string
    name: string
    lineItemType?: string
    dataType?: string
    format?: string
    summaryMethod?: string
    isEditable?: boolean
    expression?: string | null
  }>
}

export interface FpaDimensionMember {
  id: string
  code: string
  name: string
  parentId?: string | null
}

export interface FpaDimension {
  id: string
  key: string
  code: string
  name: string
  dimensionType?: string
  members?: FpaDimensionMember[]
}

export interface FpaModelSetupRequest {
  name: string
  startPeriod: string
  endPeriod: string
  modelType?: FpaModelType | string
  baseCurrency?: string
  timeGranularity?: FpaTimeGranularity | string
  description?: string
  entityIds?: string[]
  departmentIds?: string[]
  accountIds?: string[]
  dimensions?: Array<{ key: string; valueIds: string[] }>
  baseline?: {
    mode?: FpaBaselineMode
    sourceVersionId?: string | null
    sourceScenarioId?: string | null
  }
  lineItems?: Array<{
    code: string
    name: string
    lineItemType?: string
    category?: string
  }>
  formulas?: Array<{ lineItemCode: string; expression: string }>
  drivers?: Array<{
    code: string
    name: string
    value?: number
    category?: string
  }>
  workflow?: {
    name: string
    workflowType?: string
    stages?: unknown[]
    tasks?: Array<{
      title: string
      assigneeId?: string | null
      departmentId?: string | null
    }>
  }
}

export interface FpaModelSetupResult {
  model: FpaModel
  lineItemCount?: number
  driverCount?: number
  workflowId?: string | null
  cellCount?: number
  validation: FpaSetupValidation
}

export interface FpaModel {
  id: string
  name: string
  modelType: string
  description?: string | null
  ownerUserId?: string
  ownerName?: string | null
  ownerAvatarUrl?: string | null
  baseCurrency: string
  startPeriod: string
  endPeriod: string
  timeGranularity: string
  status: FpaModelStatus
  createdById?: string
  createdAt?: string
  updatedAt?: string
  publishedAt?: string | null
  publishedById?: string | null
  publishedByName?: string | null
  defaultScenarioId?: string
  defaultVersionId?: string
  entityIds?: string[]
  departmentIds?: string[]
  accountIds?: string[]
  dimensions?: Array<{ key: string; dimensionId?: string; valueIds: string[] }>
  lineItemCount?: number
  cellCount?: number
  lineItems?: FpaLineItem[]
  scenarios?: FpaScenario[]
  versions?: FpaVersion[]
  drivers?: FpaDriver[]
  workflows?: FpaWorkflow[]
  _count?: { lineItems?: number; scenarios?: number; versions?: number }
}

export interface FpaLineItem {
  id: string
  modelId: string
  code: string
  name: string
  description?: string | null
  lineItemType: string
  category: string
  moduleId?: string | null
  moduleName?: string | null
  dataType?: string
  summaryMethod?: string
  format?: string | null
  currency?: string | null
  currencyCode?: string | null
  unitLabel?: string | null
  displayScale?: number | null
  decimalPlaces?: number | null
  dimensionKeys?: string[]
  isEditable?: boolean
  sortOrder?: number
  parentId?: string | null
  accountId?: string | null
  formulaId?: string | null
  formulas?: FpaFormula[]
  cells?: FpaCell[]
  createdAt?: string
  updatedAt?: string
  createdByName?: string | null
  updatedByName?: string | null
}

/** Stage 4 driver confidence (API enum). */
export type FpaDriverConfidence = "HIGH" | "MEDIUM" | "LOW" | string

/** Stage 4 driver spreading (API enum; distinct from cell Spread tools). */
export type FpaDriverSpreadingMethod =
  | "EVEN"
  | "SEASONAL"
  | "PRIOR_YEAR"
  | "MANUAL"
  | string

export interface FpaDriver {
  id: string
  modelId: string
  code: string
  name: string
  category: string
  value: string | number
  unit?: string | null
  periodDate?: string | null
  scenarioId?: string | null
  versionId?: string | null
  /** Prior-year / actual comparison for Driver Assumptions (Stage 3). */
  priorActual?: number | null
  priorValue?: number | null
  priorPeriodLabel?: string | null
  /** Stage 4 assumptions library metadata. */
  confidence?: FpaDriverConfidence | null
  spreadingMethod?: FpaDriverSpreadingMethod | null
  requiresApproval?: boolean
  createdById?: string
  createdAt?: string
  /** Present on PUT driver when server recalculates dependents. */
  updatedCells?: FpaCell[]
}

export type FpaSpreadMethod =
  | 'EVEN'
  | 'CUSTOM_WEIGHT'
  | 'PRIOR_YEAR_PATTERN'
  | 'HISTORICAL_PATTERN'
  | 'WORKING_DAYS'
  | 'SEASONAL_PROFILE'
  | string

/** Common payload from cell tools after Stage 3 dependents contract. */
export interface FpaCellToolResult {
  updated?: number
  copied?: number
  spreadAcross?: number
  applied?: number
  method?: FpaSpreadMethod
  cells?: FpaCell[]
  updatedCells?: FpaCell[]
}

export interface FpaFormula {
  id: string
  modelId?: string
  lineItemId?: string
  expression: string
  isValid?: boolean
  validationMsg?: string | null
  lineItem?: { id?: string; code?: string; name?: string }
}

export type FpaCellStatus =
  | 'ACTUAL'
  | 'INPUT'
  | 'CALCULATED'
  | 'IMPORTED'
  | 'LOCKED'
  | 'OVERRIDE'
  | 'ERROR'
  | 'PENDING_CALCULATION'
  | string

export interface FpaCell {
  id: string
  modelId: string
  scenarioId: string
  versionId: string
  lineItemId: string
  periodDate: string
  entityId?: string | null
  departmentId?: string | null
  costCentreId?: string | null
  accountId?: string | null
  currencyCode?: string
  value: string | number
  valueType?: string
  sourceType?: string
  /** Prefer over inferred flags when present (budget / planning grid). */
  cellStatus?: FpaCellStatus
  periodRole?: "ACTUAL" | "FORECAST" | string
  isEditable?: boolean
  /** When true (e.g. Actual period via cycle cut-over), treat as non-editable. */
  readOnly?: boolean
  isLocked?: boolean
  formulaId?: string | null
  driverId?: string | null
  /** Optimistic concurrency token for cell updates. */
  recordVersion?: number | null
  lastUpdatedById?: string | null
  lastUpdatedAt?: string | null
  lineItem?: Partial<FpaLineItem>
}

export interface FpaGridPeriod {
  periodDate?: string
  key?: string
  label?: string
  periodRole?: "ACTUAL" | "FORECAST" | string
  readOnly?: boolean
}

export interface FpaGridResponse {
  modelId: string
  versionId?: string
  scenarioId?: string
  moduleId?: string | null
  grain?: "monthly" | "quarterly" | "annual" | string
  page: number
  pageSize: number
  total: number
  lineItems: FpaLineItem[]
  cells: FpaCell[]
  periods?: FpaGridPeriod[]
  /** FY totals by lineItemId using each item's summaryMethod (SUM/AVG/LAST). */
  fyTotals?: Record<string, number>
  /** Last Actual month (period start) when loaded with cycleId. */
  actualCutoff?: string | null
  /** First Forecast month (period start); prefer over FE-derived next month. */
  forecastStartPeriod?: string | null
  ownerName?: string | null
  ownerAvatarUrl?: string | null
  /** Present when grid is loaded with cycleId — departments the caller may edit.
   * `null` / omitted for FP&A full-edit roles → no FE owner lock. */
  assignedDepartmentIds?: string[] | null
}

export interface FpaValidationCheckItem {
  key: string
  label: string
  status: "PASSED" | "WARNING" | "ERROR" | string
  detail?: string | null
  moduleId?: string | null
  moduleName?: string | null
}

export interface FpaValidationChecksResponse {
  modelId: string
  passed: boolean
  summary: {
    total: number
    passed: number
    warnings: number
    errors: number
  }
  checks: FpaValidationCheckItem[]
}

export interface FpaGridValidation {
  severity?: "ERROR" | "WARNING" | "INFO" | string
  code?: string
  message: string
  field?: string
  lineItemId?: string | null
  periodDate?: string | null
}

export interface FpaCellComment {
  id: string
  body: string
  authorName?: string | null
  authorId?: string | null
  createdAt?: string
}

export interface FpaScenario {
  id: string
  modelId: string
  name: string
  scenarioType: string
  description?: string | null
  isOfficial?: boolean
  status?: string
  /** Parent for inheritance (SRD §38 — overrides only). */
  parentScenarioId?: string | null
  inheritsFromScenarioId?: string | null
  parentScenarioName?: string | null
}

/** Canonical compare metric unit codes (backend contract). */
export type FpaCompareMetricUnit = "CURRENCY" | "PERCENT" | "COUNT" | string

export interface FpaScenarioCompareMetric {
  code: string
  label: string
  unit?: FpaCompareMetricUnit
  higherIsFavourable?: boolean
  /** Values keyed by scenario id (null when unavailable). */
  values: Record<string, number | null>
  /** Absolute variance vs anchor, keyed by non-anchor scenario id. */
  varianceAbs?: Record<string, number | null>
  /** Percent variance vs anchor, keyed by non-anchor scenario id. */
  variancePct?: Record<string, number | null>
}

export interface FpaScenarioCompareAssumptionCell {
  driverId?: string | null
  value: number | null
}

export interface FpaScenarioCompareAssumption {
  driverId?: string | null
  driverCode: string
  driverName: string
  unit?: string | null
  category?: string | null
  byScenario: Record<string, FpaScenarioCompareAssumptionCell | number | null>
}

export interface FpaScenarioCompareWaterfallStep {
  key: string
  label: string
  value?: number | null
  delta?: number | null
}

export interface FpaScenarioCompareWaterfall {
  /** Optional when BE omits; FE treats missing as generic bridge. */
  metricCode?: string
  fromScenarioId?: string
  toScenarioId?: string
  steps: FpaScenarioCompareWaterfallStep[]
}

export interface FpaScenarioCompareSensitivityRow {
  driverCode: string
  driverName: string
  low: number
  base: number
  high: number
  impactMetric?: string
  unit?: string
}

/** Enriched multi-scenario compare payload (preferred). Legacy pair fields still accepted. */
export interface FpaScenarioCompareResult {
  versionId?: string
  anchorScenarioId?: string
  scenarios?: Array<{ id: string; name: string; scenarioType?: string }>
  /** Present when enriched Stage 4 contract is live. */
  metrics?: FpaScenarioCompareMetric[]
  assumptions?: FpaScenarioCompareAssumption[]
  waterfall?: FpaScenarioCompareWaterfall | null
  sensitivity?: FpaScenarioCompareSensitivityRow[]
  /** Legacy pair compare (still accepted if enriched fields absent). */
  left?: { id: string; name: string }
  right?: { id: string; name: string }
  rows?: Array<{ code: string; left: number; right: number; delta: number }>
}

export interface FpaScenarioCompareRequest {
  versionId: string
  scenarioIds?: string[]
  compareScenarioId?: string
  anchorScenarioId?: string
  /** Planning cycle scope when comparing inside an MPC worksheet. */
  cycleId?: string
  metrics?: string[]
  includeAssumptions?: boolean
  includeWaterfall?: boolean
  includeSensitivity?: boolean
  waterfallMetric?: string
  waterfallFromScenarioId?: string
  waterfallToScenarioId?: string
}

/** Sync copy result (preferred). */
export interface FpaScenarioCopySyncResult {
  scenario: FpaScenario
  cellsCopied?: number
  driversCopied?: number
}

/** Async copy job when BE returns 202 for large models. */
export interface FpaScenarioCopyJobResult {
  jobId: string
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | string
  pollUrl?: string
  scenario?: FpaScenario
  cellsCopied?: number
  driversCopied?: number
  error?: string | null
}

export type FpaScenarioCopyResult = FpaScenarioCopySyncResult | FpaScenarioCopyJobResult

export function isScenarioCopyJob(
  data: FpaScenarioCopyResult | null | undefined,
): data is FpaScenarioCopyJobResult {
  if (!data || typeof data !== "object") return false
  // Sync payload may include scenario (+ optional copy stats); async starts with jobId only.
  if ("scenario" in data && (data as FpaScenarioCopySyncResult).scenario?.id) return false
  return Boolean((data as FpaScenarioCopyJobResult).jobId)
}

export interface FpaDriverBulkUpdateItem {
  driverId?: string
  code?: string
  scenarioId?: string
  value: number
  unit?: string | null
  name?: string
}

export interface FpaPlanningSummaryKpi {
  code: string
  label: string
  value: number
  displayValue?: string
  deltaPct?: number | null
  deltaLabel?: string | null
  up?: boolean
  unit?: string
  sparkline?: number[]
}

/** Flat KPI bag from Stage 3 planning-summary. */
export interface FpaPlanningSummaryKpiBag {
  revenue?: number
  grossMargin?: number
  grossMarginPct?: number
  ebitda?: number
  [key: string]: number | undefined
}

export interface FpaPlanningSummaryTrendSeries {
  periods?: string[]
  revenue?: number[]
  ebitda?: number[]
  grossMargin?: number[]
}

export interface FpaPlanningSummary {
  modelId?: string
  versionId?: string
  scenarioId?: string
  currency?: string
  asOf?: string
  /** Cycle materiality threshold when cycleId was passed. */
  materialVariancePct?: number
  /** Flat live totals (Stage 3). */
  revenue?: number
  grossMargin?: number
  grossMarginPct?: number
  ebitda?: number
  variance?: {
    amount?: number
    pct?: number
    priorRevenue?: number
    label?: string
  }
  /** Legacy array KPIs or Stage 3 object bag. */
  kpis?: FpaPlanningSummaryKpi[] | FpaPlanningSummaryKpiBag
  trend?:
    | Array<{
        period: string
        label?: string
        actual?: number | null
        plan?: number | null
      }>
    | FpaPlanningSummaryTrendSeries
  workflowSteps?: Array<{
    id: string
    name: string
    stage?: string
    status?: string
    completedTasks?: number
    totalTasks?: number
    percent?: number
  }>
}

export interface FpaVersion {
  id: string
  modelId?: string
  name: string
  status: FpaVersionStatus
  lockedAt?: string | null
  lockedById?: string | null
  publishedAt?: string | null
  publishedById?: string | null
  publishedByName?: string | null
  checksum?: string | null
}

export interface FpaWorkflow {
  id: string
  modelId?: string
  name: string
  workflowType?: string
  stage?: string
  status?: string
  startDate?: string
  endDate?: string
  tasks?: FpaTask[]
  approvals?: unknown[]
  /** Present when workflow is used as a budget cycle (until dedicated cycles API). */
  fiscalYear?: number
  versionId?: string | null
  scenarioId?: string | null
}

/** SRD annual budget cycle status (Budgeting tab). */
export type FpaBudgetCycleStatus =
  | 'DRAFT'
  | 'LOADING_ACTUALS'
  | 'LOADING_BASELINE'
  | 'OPEN_FOR_INPUT'
  | 'PENDING_VALIDATION'
  | 'PENDING_FPA_REVIEW'
  | 'PENDING_CFO_REVIEW'
  | 'RETURNED_FOR_CORRECTION'
  | 'APPROVED'
  | 'LOCKED'

export type FpaBudgetCycleStage =
  | 'CREATE_CYCLE'
  | 'LOAD_ACTUALS'
  | 'LOAD_BASELINE'
  | 'ASSIGN_OWNERS'
  | 'OWNER_INPUT'
  | 'VALIDATE'
  | 'FPA_REVIEW'
  | 'CFO_REVIEW'
  | 'LOCK'
  | 'REPORTS'

export type FpaBudgetInputCategory =
  | 'REVENUE'
  | 'COST_OF_SALES'
  | 'PAYROLL'
  | 'OPERATING_EXPENSES'
  | 'DEPARTMENTAL'
  | 'PROJECT'
  | 'CAPEX'
  | 'TAX'
  | 'CASH_MOVEMENT'
  | 'FUNDING'

export interface FpaBudgetOwnerAssignment {
  departmentId: string
  departmentName?: string
  assigneeId?: string | null
  assigneeName?: string | null
  taskId?: string | null
  status?: FpaTaskStatus | string
  categories?: FpaBudgetInputCategory[]
  dueDate?: string | null
  baselineMethod?: FpaBaselineMode | null
}

export type FpaPlanningType =
  | 'ANNUAL_BUDGET'
  | 'QUARTERLY_FORECAST'
  | 'ROLLING_FORECAST'
  | 'REFORECAST'
  | 'LONG_RANGE_PLAN'
  | 'STRATEGIC_PLAN'
  | string

export interface FpaBudgetCycle {
  id: string
  name: string
  modelId: string
  versionId?: string | null
  scenarioId?: string | null
  workflowId?: string | null
  workflowTemplateId?: string | null
  fiscalYear: number
  status: FpaBudgetCycleStatus
  currentStage: FpaBudgetCycleStage
  planningType?: FpaPlanningType | null
  startDate?: string | null
  endDate?: string | null
  actualsCutoffDate?: string | null
  forecastStartPeriod?: string | null
  submissionDeadline?: string | null
  baseCurrency?: string | null
  cycleOwnerId?: string | null
  entityIds?: string[]
  baselineMode?: FpaBaselineMode | null
  baselineSourceVersionId?: string | null
  owners?: FpaBudgetOwnerAssignment[]
  inputCategories?: FpaBudgetInputCategory[]
  validation?: {
    passed: boolean
    errors: Array<{
      code: string
      message: string
      step?: string
      departmentId?: string
      category?: FpaBudgetInputCategory | string
    }>
  } | null
  lockedAt?: string | null
  lockedById?: string | null
  approvedAt?: string | null
  approvedById?: string | null
  boardPackUrl?: string | null
  actualsRowCount?: number
  /** Material variance commentary threshold (%). Stage 3 MPC. */
  materialVariancePct?: number | null
  /** Present after open when actuals load was attempted. */
  actualsLoadReason?: string | null
  stages?: FpaWorkflowStage[]
  openedAt?: string | null
  fpaReviewAt?: string | null
  cfoReviewAt?: string | null
  createdAt?: string
  updatedAt?: string
  workflow?: FpaWorkflow
  tasks?: FpaTask[]
}

export interface FpaBudgetOwnerCreate {
  departmentId: string
  assigneeId?: string | null
  categories?: FpaBudgetInputCategory[]
  dueDate?: string | null
  baselineMethod?: FpaBaselineMode | null
}

export interface FpaBudgetCycleCreateRequest {
  modelId: string
  name: string
  fiscalYear: number
  planningType?: FpaPlanningType
  versionId?: string
  scenarioId?: string
  startDate?: string
  endDate?: string
  actualsCutoffDate?: string | null
  forecastStartPeriod?: string | null
  submissionDeadline?: string | null
  baseCurrency?: string
  cycleOwnerId?: string
  entityIds?: string[]
  baselineMode?: FpaBaselineMode
  baselineSourceVersionId?: string | null
  workflowTemplateId?: string | null
  loadPriorActuals?: boolean
  loadBaseline?: boolean
  /** When false (default for staged open), cycle is created as DRAFT. */
  openImmediately?: boolean
  inputCategories?: FpaBudgetInputCategory[]
  owners: FpaBudgetOwnerCreate[]
}

export type FpaBudgetCycleUpdateRequest = Partial<Omit<FpaBudgetCycleCreateRequest, 'modelId'>> & {
  owners?: FpaBudgetOwnerCreate[]
}

// —— Model Planning Cycles (distinct entity from PlanningBudgetCycle) ——
// Naming note: the backend returns the cycle name as snake_case `cycle_name`
// and the source model as `sourceModelId` (not `modelId`). The request body
// uses `name` (not `cycle_name`).

export type FpaModelPlanningCycleStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'RETURNED_FOR_CORRECTION'
  | 'APPROVED'
  | 'LOCKED'
  | 'CLOSED'
  | 'ARCHIVED'
  | string

/** Department slice owner on a Model Planning cycle (create + GET/list). */
export interface FpaModelPlanningOwnerCreate {
  departmentId: string
  assigneeId: string
  dueDate?: string | null
}

export interface FpaModelPlanningOwnerAssignment {
  departmentId: string
  departmentName?: string | null
  assigneeId?: string | null
  assigneeName?: string | null
  /** Owner task for department-slice submit — required for Submit UI. */
  taskId?: string | null
  status?: FpaTaskStatus | string | null
  dueDate?: string | null
}

export interface FpaModelPlanningCycle {
  id: string
  /** Backend returns the cycle name as snake_case `cycle_name`. */
  cycle_name: string
  financialYear: number
  planningType: FpaPlanningType
  sourceModelId: string
  sourceModelVersionId: string
  actualsCutoffPeriod?: string | null
  forecastStartPeriod?: string | null
  planningHorizon?: number | null
  baseScenarioId?: string | null
  submissionDeadline?: string | null
  approvalWorkflowId?: string | null
  planningOwnerId?: string | null
  /** Material variance commentary threshold (%). Default 5. */
  materialVariancePct?: number | null
  /** Department / assignee scopes for this cycle. */
  owners?: FpaModelPlanningOwnerAssignment[]
  status: FpaModelPlanningCycleStatus
  currentStage?: string | null
  submittedAt?: string | null
  submittedById?: string | null
  approvedAt?: string | null
  approvedById?: string | null
  lockedAt?: string | null
  lockedById?: string | null
  createdById?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface FpaModelPlanningCycleCreateRequest {
  name: string
  financialYear: number
  planningType: FpaPlanningType
  sourceModelId: string
  sourceModelVersionId: string
  actualsCutoffPeriod?: string | null
  forecastStartPeriod?: string | null
  planningHorizon?: number | null
  baseScenarioId?: string | null
  submissionDeadline?: string | null
  approvalWorkflowId?: string | null
  planningOwnerId?: string | null
  /** Material variance commentary threshold (%). Default 5 on BE. */
  materialVariancePct?: number | null
  /** Optional department budget owners — creates per-dept scopes + tasks. */
  owners?: FpaModelPlanningOwnerCreate[]
}

export type FpaModelPlanningCycleUpdateRequest = Partial<FpaModelPlanningCycleCreateRequest>

export interface FpaModelPlanningCycleSourceModel {
  id: string
  name: string
  code?: string | null
}

export interface FpaModelPlanningCycleSourceVersion {
  id: string
  modelId?: string
  /** Display name — some BE payloads use `label`, others `name` (same as FpaVersion). */
  label?: string | null
  name?: string | null
  status?: string | null
  isPublished?: boolean | null
  createdAt?: string | null
}

export interface FpaModelPlanningCycleSourceScenario {
  id: string
  modelId: string
  name: string
  type?: string | null
}

export interface FpaModelPlanningCycleSources {
  planningTypes: FpaPlanningType[]
  models: FpaModelPlanningCycleSourceModel[]
  versions: FpaModelPlanningCycleSourceVersion[]
  scenarios: FpaModelPlanningCycleSourceScenario[]
}

export interface FpaModelPlanningCycleWorkspace {
  cycle: FpaModelPlanningCycle
  model: { id: string; name?: string | null; code?: string | null }
  version: { id: string; label?: string | null; status?: string | null }
  scenarios: FpaModelPlanningCycleSourceScenario[]
  /** Top-level cut-over (same as cycle fields; convenience for chrome). */
  actualsCutoffPeriod?: string | null
  forecastStartPeriod?: string | null
  grid: {
    modelId: string
    versionId: string
    baseScenarioId?: string | null
    cycleId?: string | null
    actualCutoff?: string | null
    forecastStartPeriod?: string | null
  }
}

/** Model Planning–native owner workspace (do not use budget-cycle owner-workspace). */
export interface FpaModelPlanningOwnerWorkspace {
  cycle: {
    id: string
    status: FpaModelPlanningCycleStatus | string
    cycle_name?: string
    name?: string
    submissionDeadline?: string | null
  }
  owners: FpaModelPlanningOwnerAssignment[]
  myOwner?: FpaModelPlanningOwnerAssignment | null
  canSubmit?: boolean
  unmetRequirements?: Array<{
    code?: string
    message: string
    severity?: "BLOCKING" | "WARNING" | string
  }>
  assignedDepartmentIds?: string[] | null
  readOnly?: boolean
}

export interface FpaModelPlanningTaskCreateRequest {
  title: string
  assigneeId: string
  departmentId?: string | null
  dueDate?: string | null
  priority?: string | null
  description?: string | null
  modelId?: string | null
  versionId?: string | null
}

export interface FpaModelPlanningCycleListResponse {
  items: FpaModelPlanningCycle[]
  total: number
  count: number
}

export interface FpaSetupValidationError {
  code: string
  message: string
  step?: string
  departmentId?: string
  category?: string
}

export interface FpaSetupValidationResult {
  passed: boolean
  message?: string
  errors: FpaSetupValidationError[]
}

export type FpaPlanningAreaStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETE' | string

export interface FpaOwnerWorkspace {
  cycle: {
    id: string
    status: FpaBudgetCycleStatus | string
    name?: string
    submissionDeadline?: string | null
    fiscalYear?: number
  }
  budgetProgress?: { percent: number; trend?: number | null }
  submissionDue?: { date?: string | null; daysRemaining?: number | null }
  openTasks?: {
    count: number
    completedCount?: number
    items?: Array<{ id?: string; title?: string; status?: string; departmentId?: string }>
  }
  validationIssues?: {
    count: number
    needsAttention?: boolean
    items?: Array<{
      code?: string
      message?: string
      status?: 'BLOCKING' | 'COMMENT' | 'DONE' | string
      severity?: string
    }>
  }
  planningAreas?: Array<{
    departmentId?: string
    area: string
    status: FpaPlanningAreaStatus
    filledCells?: number
    totalCells?: number
  }>
  departmentBudgetRegister?: Array<{
    departmentId?: string
    departmentName?: string
    account?: string
    method?: string
    priorYearActual?: number
    currentBudget?: number
    changePct?: number
    ownerName?: string
    status?: string
  }>
  canSubmit?: boolean
  unmetRequirements?: Array<{
    code?: string
    message: string
    severity?: 'BLOCKING' | 'WARNING' | string
  }>
}

export interface FpaWorkflowStage {
  key: string
  label: string
  start?: string | null
  end?: string | null
  status?: 'DONE' | 'ACTIVE' | 'PENDING' | string
}

export interface FpaCycleTask {
  id: string
  title: string
  status: FpaTaskStatus | string
  priority?: string | null
  departmentId?: string | null
  departmentName?: string | null
  assigneeId?: string | null
  assigneeName?: string | null
  reviewerId?: string | null
  reviewerName?: string | null
  dueDate?: string | null
  submittedOn?: string | null
  changeNotes?: string | null
  description?: string | null
  taskKind?: "OWNER_SLICE" | "PLANNING" | string | null
  isDeptPlan?: boolean | null
  workflowId?: string | null
  modelId?: string | null
  versionId?: string | null
  scenarioId?: string | null
  cycleId?: string | null
}

export interface FpaApprovalEvent {
  id?: string
  actorId?: string | null
  actorName?: string | null
  action?: string
  rawAction?: string
  target?: { type?: string; id?: string; title?: string } | null
  comment?: string | null
  commentSnippet?: string | null
  createdAt?: string | null
  /** Legacy approvalHistory shape */
  at?: string | null
  byName?: string | null
}

export interface FpaThreadComment {
  id: string
  body: string
  visibility?: 'INTERNAL' | 'ALL' | string
  authorId?: string | null
  authorName?: string | null
  createdAt?: string | null
  parentCommentId?: string | null
  taskId?: string | null
  cycleId?: string | null
}

/** Alias used by workflow comments endpoints. */
export type FpaWorkflowComment = FpaThreadComment

export interface FpaTaskAttachment {
  id: string
  fileName?: string
  name?: string
  size?: number | null
  sizeBytes?: number | null
  fileSize?: number | null
  mimeType?: string | null
  uploadedAt?: string | null
  createdAt?: string | null
  uploadedByName?: string | null
}

export interface FpaTaskSummary {
  priorFy?: number | null
  request?: number | null
  pctChange?: number | null
  currency?: string | null
  changeNotes?: string | null
  lines?: Array<{
    label: string
    prior?: number | null
    request?: number | null
    pctChange?: number | null
  }>
}

/** FP&A / CFO review board path (SRD §5.4). */
export interface FpaReviewWorkspace {
  cycle?: {
    id: string
    status?: string
    name?: string
    fiscalYear?: number
    progressPercent?: number
  }
  cycleProgress?: { percent?: number; stage?: string; label?: string }
  progress?: {
    percent?: number
    pendingDeltaWoW?: number | null
    returnedDeltaWoW?: number | null
  }
  stages?: FpaWorkflowStage[]
  departmentStatusCounts?: Array<{ status: string; count: number }> | Record<string, number>
  taskQueue?: Array<{
    id?: string
    title?: string
    status?: string
    departmentId?: string
    departmentName?: string
    assigneeId?: string
    assigneeName?: string
    reviewerId?: string | null
    reviewerName?: string | null
    dueDate?: string | null
    submittedOn?: string | null
    changeNotes?: string | null
    priority?: string | null
  }>
  submissionRegister?: Array<{
    departmentId?: string
    departmentName?: string
    ownerName?: string
    status?: string
    dueDate?: string | null
    issueCount?: number
    issues?: string[]
  }>
  approvalHistory?: FpaApprovalEvent[]
  dueDateRisks?: Array<{
    departmentId?: string
    departmentName?: string
    dueDate?: string
    daysRemaining?: number
    severity?: string
  }>
  inspectorChecklist?: Array<{
    code?: string
    label: string
    status?: 'PENDING' | 'DONE' | 'BLOCKING' | string
    note?: string | null
  }>
}

export interface FpaTask {
  id: string
  title: string
  status: FpaTaskStatus | string
  priority?: string
  dueDate?: string | null
  assigneeId?: string | null
  assigneeName?: string | null
  assigneeAvatarUrl?: string | null
  reviewerId?: string | null
  reviewerName?: string | null
  departmentId?: string | null
  workflowId?: string
  modelId?: string | null
  versionId?: string | null
  cycleId?: string | null
  module?: string | null
  href?: string | null
  submittedAt?: string | null
  workflow?: FpaWorkflow
  approvals?: unknown[]
}

export interface FpaVarianceResult {
  id: string
  modelId: string
  lineItemId: string
  lineItemName?: string | null
  departmentId?: string | null
  departmentName?: string | null
  periodDate?: string
  period?: string
  varianceType?: string
  actualValue?: string | number
  planValue?: string | number
  forecastValue?: string | number | null
  varianceAmount?: string | number
  variancePercent?: string | number | null
  actual?: string | number
  plan?: string | number
  forecast?: string | number | null
  varianceAbs?: string | number
  variancePct?: string | number | null
  direction?: string
  commentaryRequired?: boolean
  commentary?: string | null
  commentaryStatus?: string | null
  lineItem?: FpaLineItem
  comments?: FpaComment[]
}

export interface FpaVarianceDepartment {
  departmentId: string
  departmentName: string
  actual: number
  plan: number
  forecast: number | null
  varianceAbs: number
  variancePct: number | null
}

export interface FpaVarianceSummary {
  kpis: {
    revenueVar?: number | null
    opexVar?: number | null
    ebitdaVar?: number | null
  }
  trend: Array<{ period: string; variance: number }>
  tornado: Array<{ departmentId?: string; departmentName: string; varianceAbs: number }>
  departments: FpaVarianceDepartment[]
}

export interface FpaComment {
  id: string
  body?: string
  commentary?: string
  correctiveAction?: string | null
  userName?: string | null
  createdAt?: string
}

export interface FpaHomeDashboard {
  model?: Partial<FpaModel> | null
  versionId?: string | null
  scenarioId?: string | null
  cycleId?: string | null
  activeCycle?: {
    id: string
    name?: string | null
    status?: string | null
    currentStage?: string | null
  } | null
  ownerName?: string | null
  ownerAvatarUrl?: string | null
  kpis?: {
    revenue?: number | string
    ebitda?: number | string
    closingCash?: number | string
    cash?: number | string
    runwayMonths?: number | string
    forecastAccuracy?: number | string | null
    revenueDeltaPct?: number | string | null
    ebitdaDeltaPct?: number | string | null
    closingCashDeltaPct?: number | string | null
    sparklines?: {
      revenue?: number[]
      ebitda?: number[]
      closingCash?: number[]
      runwayMonths?: number[]
      headcount?: number[]
      [key: string]: number[] | undefined
    }
  } | null
  revenueExpenseTrend?: Array<{
    period: string
    revenue?: number | string | null
    expense?: number | string | null
    expenses?: number | string | null
    ebitda?: number | string | null
  }>
  cashByMonth?: Array<{
    period: string
    opening?: number | string
    inflows?: number | string
    outflows?: number | string
    closing?: number | string
  }>
  workflowProgress?: Array<{
    id?: string
    name?: string
    stage?: string
    status?: string
    completedTasks?: number
    totalTasks?: number
    percent?: number
  }>
  workflowStatusSlices?: Array<{ status: string; count: number }>
  openTasks?: FpaTask[]
  scenarioCompare?: {
    anchorScenarioId?: string | null
    scenarios?: Array<{ id: string; name: string; scenarioType?: string | null }>
    metrics?: Array<{
      key: string
      label: string
      values: Array<{
        scenarioId: string
        scenarioName: string
        value: number | null
        varianceAbs?: number | null
        variancePct?: number | null
      }>
    }>
    left?: { id?: string; name?: string; revenue?: number; ebitda?: number }
    right?: { id?: string; name?: string; revenue?: number; ebitda?: number }
  }
  overBudgetDepartments?: Array<{
    departmentId: string
    departmentName?: string | null
    ownerName?: string | null
    ownerAvatarUrl?: string | null
    plan: number
    actual: number
    overBy: number
  }>
  cashRunway?: {
    closingCash?: number | null
    runwayMonths?: number | null
    monthlyBurn?: number | null
    byMonth?: Array<{
      period: string
      closingCash?: number | null
      balance?: number | null
    }>
  } | null
  recentActivity?: FpaHomeActivity[]
  activity?: FpaHomeActivity[]
  message?: string
}

export interface FpaHomeActivity {
  id?: string
  title?: string
  body?: string | null
  actorName?: string | null
  actorAvatarUrl?: string | null
  createdAt?: string | null
  kind?: string | null
  href?: string | null
}

export interface FpaWorkforceDomain {
  kpis?: {
    headcount?: number | null
    budgetHeadcount?: number | null
    openRoles?: number | null
    hiresYtd?: number | null
    attritionPct?: number | null
    avgSalary?: number | null
    sparklines?: Record<string, number[]>
  } | null
  hirePlan?: Array<{ period: string; planned: number; actual: number }>
  attritionTrend?: Array<{ period: string; pct: number }>
  departments?: Array<{
    departmentId: string
    departmentName: string
    entity?: string | null
    headcount: number
    budgetHeadcount: number
    hires: number
    attritionPct: number
    avgSalary: number
    openRoles: number
    salary?: number | null
    status?: string | null
  }>
}

export interface FpaRevenueDomain {
  kpis?: {
    revenue?: number | null
    budget?: number | null
    forecast?: number | null
    yoyPct?: number | null
  } | null
  waterfall?: Array<{ key: string; label: string; value?: number | null; delta?: number | null }>
  monthly?: Array<{
    period: string
    actual?: number | null
    budget?: number | null
    forecast?: number | null
  }>
  streams?: Array<{
    id: string
    name: string
    region?: string | null
    method?: string | null
    actual: number
    budget: number
    forecast: number
    yoyPct?: number | null
    sharePct?: number | null
  }>
}

export interface FpaExpenseDomain {
  kpis?: {
    opex?: number | null
    budget?: number | null
    forecast?: number | null
    variancePct?: number | null
  } | null
  alerts?: Array<{
    departmentId: string
    departmentName: string
    severityPct?: number | null
    severityAmount?: number | null
    severity?: string | null
  }>
  byCategory?: Array<{ category: string; amount: number; sharePct?: number | null }>
  monthlyBurn?: Array<{
    period: string
    actual?: number | null
    budget?: number | null
    forecast?: number | null
  }>
  bridge?: Array<{ key: string; label: string; value?: number | null; delta?: number | null }>
  departments?: Array<{
    departmentId: string
    departmentName: string
    budget: number
    actual: number
    runRate?: number | null
    forecast: number
    headcount?: number | null
    status?: string | null
  }>
}

export interface FpaCashDomain {
  kpis?: {
    closingCash?: number | null
    netCashFlow?: number | null
    runwayMonths?: number | null
  } | null
  periods?: string[]
  rows?: Array<{
    id: string
    label: string
    rowType: 'INFLOW' | 'OUTFLOW' | 'TOTAL' | string
    values: Record<string, number | null>
  }>
}

export interface FpaDomainView {
  modelId: string
  category: string
  scope?: FpaDomainScope
  availableFilters?: FpaDomainAvailableFilters
  lineItems?: FpaLineItem[]
  drivers?: FpaDriver[]
  kpis?:
    | FpaWorkforceDomain['kpis']
    | FpaRevenueDomain['kpis']
    | FpaExpenseDomain['kpis']
    | FpaCashDomain['kpis']
  hirePlan?: FpaWorkforceDomain['hirePlan']
  attritionTrend?: FpaWorkforceDomain['attritionTrend']
  departments?:
    | FpaWorkforceDomain['departments']
    | FpaExpenseDomain['departments']
  waterfall?: FpaRevenueDomain['waterfall']
  monthly?: FpaRevenueDomain['monthly']
  streams?: FpaRevenueDomain['streams']
  alerts?: FpaExpenseDomain['alerts']
  byCategory?: FpaExpenseDomain['byCategory']
  monthlyBurn?: FpaExpenseDomain['monthlyBurn']
  bridge?: FpaExpenseDomain['bridge']
  periods?: FpaCashDomain['periods']
  rows?: FpaCashDomain['rows']
}

export interface FpaDomainScope {
  modelId?: string | null
  versionId?: string | null
  scenarioId?: string | null
  entityId?: string | null
  periodFrom?: string | null
  periodTo?: string | null
}

export interface FpaDomainAvailableFilters {
  entities?: Array<{ id: string; name: string }>
  periods?: string[]
}

export interface FpaDomainSensitivityOverride {
  driverCode: string
  value: number
}

export interface FpaDomainSensitivityResult {
  scope?: FpaDomainScope
  overrides: FpaDomainSensitivityOverride[]
  base: FpaDomainView
  preview: FpaDomainView
  persisted: false
}

export type FpaExportType =
  | 'BOARD_PACK'
  | 'MANAGEMENT_REPORT'
  | 'FINANCIAL_STATEMENTS'
  | 'DEPT_EXPENSES'

export interface FpaExportJob {
  id: string
  modelId: string
  versionId?: string
  exportType: FpaExportType | string
  status: string
  downloadUrl?: string | null
  url?: string | null
  period?: string | null
  payloadJson?: unknown
  createdAt?: string | null
  completedAt?: string | null
}

export interface FpaExportCapability {
  code: FpaExportType | string
  enabled: boolean
  reason?: string | null
}

export interface FpaExportCapabilities {
  exportTypes: FpaExportCapability[]
}

export interface FpaSyncSource {
  id: string
  label: string
  status: string
  lastSyncAt?: string | null
  lastError?: string | null
}

export interface FpaSettings {
  variance: {
    commentaryThresholdPct: number
    enforceCommentary: boolean
    blockSubmitWithoutCommentary: boolean
  }
  workflow: {
    path: string
    requireCfoSignature: boolean
    allowRerunAfterReturn: boolean
  }
  syncSources: FpaSyncSource[]
}

export interface FpaRollingForecast {
  modelId: string
  versionId?: string | null
  scenarioId?: string | null
  cycleId?: string | null
  actualsCutoff?: string | null
  forecastStart?: string | null
  horizonMonths: number
  activeMethod?: string | null
  kpis?: {
    revenue?: number | null
    ebitda?: number | null
    cash?: number | null
    closingCash?: number | null
    runwayMonths?: number | null
    accuracyPct?: number | null
  } | null
  trend?: Array<{
    period: string
    actual?: number | null
    forecast?: number | null
    budget?: number | null
  }>
  methods?: Array<{
    code: string
    label: string
    revenue?: number | null
    ebitda?: number | null
    cash?: number | null
    runwayMonths?: number | null
    confidence?: string | null
  }>
}

export interface ForecastEntity {
  id: string
  name: string
  type: string
  base_currency?: string
  baseCurrency?: string
  is_default?: boolean
  account_count?: number
  created_at?: string
  status?: string
  reason?: string | null
  archivedAt?: string | null
}

export interface ForecastChartAccount {
  id?: string
  code?: string
  account_code?: string
  name?: string
  account_name?: string
  accountType?: string | null
  account_type?: string | null
  isActive?: boolean
  is_active?: boolean
}

function qs(params?: Record<string, string | number | undefined | null>): string {
  if (!params) return ''
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') sp.set(k, String(v))
  })
  const s = sp.toString()
  return s ? `?${s}` : ''
}

/** Typed FP&A client for `/v1/fpa/*` + forecast entities. Errors propagate as ApiError. */
export const fpaApi = {
  // —— Models ——
  listModels: (params?: { status?: string; ownerUserId?: string; q?: string }) =>
    apiClient.get<ApiResponse<FpaModel[]>>(`${FPA}/models${qs(params)}`),

  getModel: (modelId: string) =>
    apiClient.get<ApiResponse<FpaModel>>(`${FPA}/models/${modelId}`),

  createModel: (body: {
    name: string
    startPeriod: string
    endPeriod: string
    modelType?: string
    baseCurrency?: string
    timeGranularity?: string
    description?: string
    ownerUserId?: string
  }) => apiClient.post<ApiResponse<FpaModel>>(`${FPA}/models`, body),

  /** Atomic create: model + scope/COA/dimensions/baseline/line items/formulas/drivers/workflow. */
  setupModel: (body: FpaModelSetupRequest) =>
    apiClient.post<ApiResponse<FpaModelSetupResult>>(`${FPA}/models/setup`, body),

  putModelScope: (modelId: string, body: { entityIds: string[]; departmentIds: string[] }) =>
    apiClient.put<ApiResponse<{ modelId: string; entityIds: string[]; departmentIds: string[] }>>(
      `${FPA}/models/${modelId}/scope`,
      body,
    ),

  putModelCoa: (modelId: string, body: { entityId?: string; accountIds: string[] }) =>
    apiClient.put<ApiResponse<{ modelId: string; entityId?: string; accountIds: string[] }>>(
      `${FPA}/models/${modelId}/coa`,
      body,
    ),

  putModelDimensions: (
    modelId: string,
    body: { dimensions: Array<{ key: string; valueIds: string[] }> },
  ) =>
    apiClient.put<
      ApiResponse<{ modelId: string; dimensions: Array<{ key: string; dimensionId: string; valueIds: string[] }> }>
    >(`${FPA}/models/${modelId}/dimensions`, body),

  getModelDimensions: (modelId: string) =>
    apiClient.get<
      ApiResponse<{
        modelId: string
        dimensions: Array<{ key: string; dimensionId?: string; valueIds: string[] }>
      }>
    >(`${FPA}/models/${modelId}/dimensions`),

  listDimensions: () => apiClient.get<ApiResponse<FpaDimension[]>>(`${FPA}/dimensions`),

  /** Heal missing default formulas + minimal scope/COA when empty. Idempotent. */
  seedModelDefaults: (modelId: string) =>
    apiClient.post<
      ApiResponse<{
        modelId?: string
        formulasCreated?: number
        formulas?: FpaFormula[] | { modelId?: string; formulasCreated?: number; formulas?: FpaFormula[] }
        scopeCoa?: {
          modelId?: string
          seededScope?: boolean
          seededCoa?: boolean
          entityIds?: string[]
          departmentIds?: string[]
          accountIds?: string[]
        }
      }>
    >(`${FPA}/models/${modelId}/seed-defaults`, {}),

  postModelBaseline: (
    modelId: string,
    body: {
      mode: FpaBaselineMode
      sourceVersionId?: string | null
      sourceScenarioId?: string | null
    },
  ) =>
    apiClient.post<
      ApiResponse<{
        modelId: string
        mode: string
        sourceVersionId?: string | null
        sourceScenarioId?: string | null
        cellsCopied?: number
      }>
    >(`${FPA}/models/${modelId}/baseline`, body),

  validateModel: (modelId: string) =>
    apiClient.post<ApiResponse<FpaSetupValidation>>(`${FPA}/models/${modelId}/validate`, {}),

  getValidationSummary: (modelId: string) =>
    apiClient.get<
      ApiResponse<{
        total: number
        passed: number
        warnings: number
        errors: number
        infos?: number
        circular?: boolean
        circularPath?: string[]
        circularCheck?: { passed: boolean; path?: string[] | null }
      }>
    >(`${FPA}/models/${modelId}/validation-summary`),

  getValidationChecks: (modelId: string) =>
    apiClient.get<ApiResponse<FpaValidationChecksResponse>>(
      `${FPA}/models/${modelId}/validation-checks`,
    ),

  bulkCreateLineItems: (
    modelId: string,
    body: {
      lineItems: Array<{
        code: string
        name: string
        lineItemType?: string
        category?: string
        moduleId?: string
      }>
    },
  ) =>
    apiClient.post<
      ApiResponse<FpaLineItem[] | { modelId: string; count: number; lineItems: FpaLineItem[] }>
    >(`${FPA}/models/${modelId}/line-items/bulk`, body),

  updateModel: (modelId: string, body: Partial<FpaModel>) =>
    apiClient.put<ApiResponse<FpaModel>>(`${FPA}/models/${modelId}`, body),

  archiveModel: (modelId: string) =>
    apiClient.post<ApiResponse<FpaModel>>(`${FPA}/models/${modelId}/archive`),

  // —— Modules (Builder tree) ——
  listModules: (modelId: string) =>
    apiClient.get<ApiResponse<FpaBuilderModule[]>>(`${FPA}/models/${modelId}/modules`),

  createModule: (
    modelId: string,
    body: {
      name: string
      code?: string
      parentModuleId?: string | null
      parentId?: string | null
      dimensionKeys?: string[]
      calculationOrder?: number
      calcOrder?: number
      description?: string
    },
  ) => apiClient.post<ApiResponse<FpaBuilderModule>>(`${FPA}/models/${modelId}/modules`, body),

  updateModule: (
    moduleId: string,
    body: Partial<{
      name: string
      description: string | null
      dimensionKeys: string[]
      calculationOrder: number
      calcOrder: number
      status: string
      parentModuleId: string | null
      parentId: string | null
    }>,
  ) => apiClient.put<ApiResponse<FpaBuilderModule>>(`${FPA}/modules/${moduleId}`, body),

  putModuleDimensions: (moduleId: string, body: { dimensionKeys: string[] }) =>
    apiClient.put<ApiResponse<FpaBuilderModule>>(`${FPA}/modules/${moduleId}/dimensions`, body),

  duplicateModule: (moduleId: string) =>
    apiClient.post<
      ApiResponse<
        FpaBuilderModule & {
          moduleIdMap?: Record<string, string>
          lineItemIdMap?: Record<string, string>
        }
      >
    >(`${FPA}/modules/${moduleId}/duplicate`, {}),

  deleteModule: (moduleId: string, params?: { cascade?: boolean }) =>
    apiClient.delete<ApiResponse<{ id: string; deleted: boolean; cascade?: boolean }>>(
      `${FPA}/modules/${moduleId}${qs(params)}`,
    ),

  // —— Line items ——
  listLineItems: (
    modelId: string,
    params?: { moduleId?: string; category?: string; type?: string },
  ) =>
    apiClient.get<ApiResponse<FpaLineItem[]>>(
      `${FPA}/models/${modelId}/line-items${qs(params)}`,
    ),

  createLineItem: (
    modelId: string,
    body: {
      code: string
      name: string
      lineItemType?: string
      category?: string
      moduleId?: string
      dataType?: string
      summaryMethod?: string
      format?: string
      isEditable?: boolean
      sortOrder?: number
      accountId?: string
      description?: string
      displayScale?: number
      decimalPlaces?: number
      currency?: string | null
      currencyCode?: string | null
      dimensionKeys?: string[]
    },
  ) => apiClient.post<ApiResponse<FpaLineItem>>(`${FPA}/models/${modelId}/line-items`, body),

  updateLineItem: (
    lineItemId: string,
    body: Partial<{
      name: string
      description: string | null
      format: string | null
      currency: string | null
      currencyCode: string | null
      displayScale: number
      decimalPlaces: number
      summaryMethod: string
      dimensionKeys: string[]
      moduleId: string | null
      lineItemType: string
      isEditable: boolean
      sortOrder: number
    }>,
  ) => apiClient.put<ApiResponse<FpaLineItem>>(`${FPA}/line-items/${lineItemId}`, body),

  reorderLineItem: (lineItemId: string, body: { sortOrder: number }) =>
    apiClient.put<ApiResponse<FpaLineItem>>(`${FPA}/line-items/${lineItemId}/reorder`, body),

  putLineItemDimensions: (lineItemId: string, body: { dimensionKeys: string[] }) =>
    apiClient.put<ApiResponse<FpaLineItem>>(`${FPA}/line-items/${lineItemId}/dimensions`, body),

  deleteLineItem: (lineItemId: string) =>
    apiClient.delete<ApiResponse<{ deleted: boolean; id: string }>>(
      `${FPA}/line-items/${lineItemId}`,
    ),

  // —— Drivers ——
  listDrivers: (params: {
    modelId: string
    scenarioId?: string
    versionId?: string
    /** Improves priorActual resolution against cycle cutoff / prior FY. */
    cycleId?: string
    category?: string
  }) =>
    apiClient.get<ApiResponse<FpaDriver[]>>(
      `${FPA}/models/${params.modelId}/drivers${qs({
        scenarioId: params.scenarioId,
        versionId: params.versionId,
        cycleId: params.cycleId,
        category: params.category,
      })}`,
    ),

  createDriver: (
    modelId: string,
    body: {
      code: string
      name: string
      category?: string
      value?: number
      unit?: string
      periodDate?: string
      scenarioId?: string
      versionId?: string
      confidence?: FpaDriverConfidence
      spreadingMethod?: FpaDriverSpreadingMethod
      requiresApproval?: boolean
    },
  ) => apiClient.post<ApiResponse<FpaDriver>>(`${FPA}/models/${modelId}/drivers`, body),

  updateDriver: (
    driverId: string,
    body: {
      value?: number
      unit?: string | null
      periodDate?: string | null
      name?: string
      category?: string
      confidence?: FpaDriverConfidence | null
      spreadingMethod?: FpaDriverSpreadingMethod | null
      requiresApproval?: boolean
    },
  ) =>
    apiClient.put<ApiResponse<FpaDriver & { updatedCells?: FpaCell[] }>>(
      `${FPA}/drivers/${driverId}`,
      body,
    ),

  /** Soft-fail when driver is referenced by formulas/cells → 409. */
  deleteDriver: (driverId: string) =>
    apiClient.delete<ApiResponse<{ deleted?: boolean } | null>>(`${FPA}/drivers/${driverId}`),

  /** Bulk driver value updates (assumptions editor / multi-scenario save). */
  bulkUpdateDrivers: (
    modelId: string,
    body: { versionId: string; updates: FpaDriverBulkUpdateItem[] },
  ) =>
    apiClient.put<
      ApiResponse<{ updated: number; drivers: FpaDriver[] }>
    >(`${FPA}/models/${modelId}/drivers/bulk`, body),

  // —— Formulas ——
  validateFormula: (expression: string) =>
    apiClient.post<
      ApiResponse<{ valid: boolean; lineCodes?: string[]; driverCodes?: string[]; message?: string | null }>
    >(`${FPA}/formulas/validate`, { expression }),

  dependencyCheck: (body: {
    modelId: string
    expression?: string
    formulaId?: string | null
    dependsOnLineItemCodes?: string[]
    lineCodes?: string[]
  }) =>
    apiClient.post<
      ApiResponse<{
        circular: boolean
        path: string[] | null
        lineCodes?: string[]
        graph?: Record<string, string[]>
      }>
    >(`${FPA}/formulas/dependency-check`, body),

  createFormula: (modelId: string, body: { lineItemId: string; expression: string }) =>
    apiClient.post<ApiResponse<FpaFormula | FpaFormulaMutationResult>>(
      `${FPA}/models/${modelId}/formulas`,
      body,
    ),

  updateFormula: (formulaId: string, body: { expression?: string; lineItemId?: string }) =>
    apiClient.put<ApiResponse<FpaFormula | FpaFormulaMutationResult>>(
      `${FPA}/formulas/${formulaId}`,
      body,
    ),

  getImpactMap: (formulaId: string) =>
    apiClient.get<
      ApiResponse<{
        precedents?: FpaFormulaImpactNode[]
        dependents?: FpaFormulaImpactNode[]
        usedIn?: FpaFormulaImpactNode[]
        formula?: FpaFormula
        lineCodes?: string[]
        driverCodes?: string[]
      }>
    >(`${FPA}/formulas/${formulaId}/impact-map`),

  getDependencyGraph: (
    modelId: string,
    params?: { view?: 'module' | 'line-item'; moduleId?: string },
  ) =>
    apiClient.get<ApiResponse<FpaDependencyGraph>>(
      `${FPA}/models/${modelId}/dependency-graph${qs(params)}`,
    ),

  // —— Publish ——
  publishVersion: (
    versionId: string,
    body?: { notes?: string; notifyUserIds?: string[] },
  ) =>
    apiClient.post<ApiResponse<FpaPublishResult>>(
      `${FPA}/versions/${versionId}/publish`,
      body ?? {},
    ),

  publishModel: (modelId: string, body?: { notes?: string; notifyUserIds?: string[] }) =>
    apiClient.post<ApiResponse<FpaPublishResult>>(
      `${FPA}/models/${modelId}/publish`,
      body ?? {},
    ),

  testCalculation: (
    versionId: string,
    body?: { scenarioId?: string | null; moduleId?: string | null; pageSize?: number },
  ) =>
    apiClient.post<
      ApiResponse<{
        versionId: string
        scenarioId?: string
        calculatedAt?: string
        message?: string
        grid?: FpaGridResponse
      }>
    >(`${FPA}/versions/${versionId}/test-calculation`, body ?? {}),

  // —— Audit ——
  getModelAudit: (
    modelId: string,
    params?: {
      limit?: number
      cursor?: string
      offset?: number
      q?: string
      action?: string
      userId?: string
      from?: string
      to?: string
      moduleId?: string
      entityType?: string
    },
  ) =>
    apiClient.get<
      ApiResponse<{ entries: FpaAuditEntry[]; nextCursor?: string | null } | FpaAuditEntry[]>
    >(`${FPA}/models/${modelId}/audit${qs(params)}`),

  getDataMappings: (
    modelId: string,
    params?: {
      moduleId?: string
      sourceSystem?: string
      q?: string
      unmappedOnly?: boolean
      limit?: number
      cursor?: string
    },
  ) =>
    apiClient.get<ApiResponse<FpaDataMappingsResponse>>(
      `${FPA}/models/${modelId}/data-mappings${qs(params)}`,
    ),

  createDataMapping: (
    modelId: string,
    body: {
      sourceSystem: string
      sourceField: string
      targetLineItemId: string
      status?: string
      notes?: string
      moduleId?: string
    },
  ) =>
    apiClient.post<ApiResponse<FpaDataMappingEntry>>(
      `${FPA}/models/${modelId}/data-mappings`,
      body,
    ),

  updateDataMapping: (
    modelId: string,
    mappingId: string,
    body: Partial<{
      sourceSystem: string
      sourceField: string
      targetLineItemId: string | null
      status: string
      notes: string | null
      moduleId: string | null
    }>,
  ) =>
    apiClient.put<ApiResponse<FpaDataMappingEntry>>(
      `${FPA}/models/${modelId}/data-mappings/${mappingId}`,
      body,
    ),

  deleteDataMapping: (modelId: string, mappingId: string) =>
    apiClient.delete<ApiResponse<{ deleted: boolean; id: string }>>(
      `${FPA}/models/${modelId}/data-mappings/${mappingId}`,
    ),

  /**
   * Seed Arcus-owned source-field catalog (Custom/CSV, Excel, API, Manual, Procurement,
   * Fixed Assets, Stock, Portfolio, Accounting GL, Payroll, CRM, Banking, Loan).
   * SaaS connectors (NetSuite/Salesforce/…) are blocked server-side.
   */
  seedDataMappingCatalog: (
    modelId: string,
    body?: {
      systems?: string[]
      moduleId?: string
      replaceExisting?: boolean
    },
  ) =>
    apiClient.post<
      ApiResponse<{
        createdFields: number
        createdMappings: number
        summary: FpaDataMappingsResponse["summary"]
      }>
    >(`${FPA}/models/${modelId}/data-mappings/seed-catalog`, body || {}),

  refreshDataMappings: (
    modelId: string,
    body?: { replaceExisting?: boolean },
  ) =>
    apiClient.post<ApiResponse<FpaDataMappingsResponse>>(
      `${FPA}/models/${modelId}/data-mappings/refresh`,
      body ?? { replaceExisting: false },
    ),

  /**
   * Multipart CSV/Excel ingest for mapping catalog (shipped 80e6e1c).
   * POST /v1/fpa/models/:id/data-mappings/import
   * form fields: file, sourceSystem ("Custom / CSV" | "Excel"), optional moduleId
   */
  importDataMappingFile: (
    modelId: string,
    args: { file: File; sourceSystem: string; moduleId?: string },
  ) => {
    const form = new FormData()
    form.append("file", args.file)
    form.append("sourceSystem", args.sourceSystem)
    if (args.moduleId) form.append("moduleId", args.moduleId)
    return apiClient.postFormData<
      ApiResponse<{
        createdFields?: number
        createdMappings?: number
        rowsImported?: number
        summary?: FpaDataMappingsResponse["summary"]
      }>
    >(`${FPA}/models/${modelId}/data-mappings/import`, form)
  },

  getExceptions: (
    modelId: string,
    params?: {
      versionId?: string
      scenarioId?: string
      moduleId?: string
      severity?: string
      limit?: number
      cursor?: string
    },
  ) =>
    apiClient.get<ApiResponse<FpaExceptionsResponse>>(
      `${FPA}/models/${modelId}/exceptions${qs(params)}`,
    ),

  runSensitivityAnalysis: (
    modelId: string,
    body: {
      versionId: string
      scenarioId: string
      driverLineItemId: string
      shock: { type: "PERCENT" | "ABSOLUTE"; value: number }
      targetLineItemIds?: string[]
      periodRange?: { from: string; to: string }
    },
  ) =>
    apiClient.post<ApiResponse<FpaSensitivityAnalysis>>(
      `${FPA}/models/${modelId}/sensitivity-analysis`,
      body,
    ),

  // —— Templates ——
  listLineItemTemplates: () =>
    apiClient.get<ApiResponse<FpaLineItemTemplate[]>>(`${FPA}/line-item-templates`),

  applyLineItemTemplate: (
    modelId: string,
    moduleId: string,
    body: { templateId: string },
  ) =>
    apiClient.post<
      ApiResponse<{
        templateId: string
        moduleId: string
        lineItems: FpaLineItem[]
        formulas: FpaFormula[]
      }>
    >(`${FPA}/models/${modelId}/modules/${moduleId}/apply-template`, body),

  // —— Grid / cells ——
  getGrid: (
    modelId: string,
    params?: {
      versionId?: string
      scenarioId?: string
      cycleId?: string
      /** View-by department slice (must be authorised for owners). */
      departmentId?: string
      page?: number
      pageSize?: number
      lineItemId?: string
      moduleId?: string
      grain?: "monthly" | "quarterly" | "annual"
    },
  ) => apiClient.get<ApiResponse<FpaGridResponse>>(`${FPA}/models/${modelId}/grid${qs(params)}`),

  updateGridCells: (
    modelId: string,
    body: {
      versionId: string
      scenarioId: string
      updates: Array<{
        lineItemId: string
        periodKey?: string
        periodDate?: string
        value: number
      }>
    },
  ) =>
    apiClient.put<ApiResponse<{ updated: number; cells: FpaCell[] }>>(
      `${FPA}/models/${modelId}/grid/cells`,
      body,
    ),

  updateCell: (
    modelId: string,
    body:
      | {
          cellId: string
          value: number
          reason?: string
          valueType?: string
          sourceType?: string
          recordVersion?: number
          cycleId?: string
          departmentId?: string
        }
      | {
          versionId: string
          scenarioId: string
          lineItemId: string
          periodDate: string
          value: number
          valueType?: string
          sourceType?: string
          recordVersion?: number
          cycleId?: string
          departmentId?: string
        },
  ) =>
    apiClient.post<
      ApiResponse<FpaCell & { updatedCells?: FpaCell[] }>
    >(`${FPA}/models/${modelId}/cells/update`, body),

  bulkUpdateCells: (
    modelId: string,
    updates: Array<Record<string, unknown>>,
  ) =>
    apiClient.post<ApiResponse<{ updated: number; cells: FpaCell[] }>>(
      `${FPA}/models/${modelId}/cells/bulk-update`,
      { updates },
    ),

  bulkCellOperation: (
    modelId: string,
    body: {
      operation:
        | 'FILL_RIGHT'
        | 'FILL_DOWN'
        | 'COPY_PRIOR_PERIOD'
        | 'COPY_PRIOR_YEAR'
        | 'PERCENT_INCREASE'
        | 'PERCENT_DECREASE'
        | 'CLEAR_EDITABLE'
        | string
      versionId: string
      scenarioId: string
      lineItemId: string
      ratePct?: number
      cycleId?: string
      fromPeriodDate?: string
      periodDates?: string[]
    },
  ) =>
    apiClient.post<ApiResponse<FpaCellToolResult>>(
      `${FPA}/models/${modelId}/cells/bulk-operation`,
      body,
    ),

  spreadCells: (
    modelId: string,
    body: {
      versionId: string
      scenarioId: string
      lineItemId: string
      value: number
      method?: FpaSpreadMethod
      weights?: number[]
      periodDates?: string[]
      cycleId?: string
      /** When omitted, BE targets company-level cells only. */
      departmentId?: string
    },
  ) =>
    apiClient.post<ApiResponse<FpaCellToolResult>>(
      `${FPA}/models/${modelId}/cells/spread`,
      body,
    ),

  copyForward: (
    modelId: string,
    body: {
      versionId: string
      scenarioId: string
      lineItemId: string
      fromPeriodDate: string
      cycleId?: string
    },
  ) =>
    apiClient.post<ApiResponse<FpaCellToolResult>>(
      `${FPA}/models/${modelId}/cells/copy-forward`,
      body,
    ),

  applyGrowth: (
    modelId: string,
    body: {
      versionId: string
      scenarioId: string
      lineItemIds: string[]
      periodFrom: string
      periodTo: string
      ratePercent: number
      mode?: "COMPOUND" | "FLAT"
      cycleId?: string
    },
  ) =>
    apiClient.post<ApiResponse<FpaCellToolResult>>(
      `${FPA}/models/${modelId}/cells/apply-growth`,
      body,
    ),

  /** Optional explicit recalc (Stage 3). Prefer updatedCells on write endpoints. */
  recalculateModel: (
    modelId: string,
    body: { versionId: string; scenarioId: string; cycleId?: string },
  ) =>
    apiClient.post<ApiResponse<FpaCellToolResult | { recalculated?: number }>>(
      `${FPA}/models/${modelId}/recalculate`,
      body,
    ),

  getCellDetail: (modelId: string, cellId: string) =>
    apiClient.get<
      ApiResponse<{
        cell?: FpaCell
        lineItem?: Partial<FpaLineItem> | { name?: string; code?: string }
        periodDate?: string
        departmentId?: string | null
        departmentName?: string | null
        entityId?: string | null
        entityName?: string | null
        versionId?: string
        versionName?: string
        scenarioId?: string
        scenarioName?: string
        value?: number | string
        cellStatus?: FpaCellStatus
        formula?: string | { expression?: string; id?: string } | null
        currentDrivers?: Array<{ id?: string; name?: string; value?: number | string; unit?: string }>
        history?: unknown[]
        comments?: FpaCellComment[]
        [key: string]: unknown
      }>
    >(`${FPA}/models/${modelId}/cells/${cellId}/detail`),

  getCellTrace: (modelId: string, cellId: string) =>
    apiClient.get<
      ApiResponse<{
        root?: { cellId?: string; expression?: string; value?: number | string }
        nodes?: Array<{
          id?: string
          label?: string
          kind?: string
          value?: number | string
          expression?: string
        }>
        edges?: Array<{ from?: string; to?: string }>
        [key: string]: unknown
      }>
    >(`${FPA}/models/${modelId}/cells/${cellId}/trace`),

  cellHistory: (modelId: string, cellId: string) =>
    apiClient.get<ApiResponse<unknown[]>>(`${FPA}/models/${modelId}/cells/${cellId}/history`),

  listCellComments: (modelId: string, cellId: string) =>
    apiClient.get<ApiResponse<FpaCellComment[]>>(
      `${FPA}/models/${modelId}/cells/${cellId}/comments`,
    ),

  addCellComment: (modelId: string, cellId: string, body: { body: string }) =>
    apiClient.post<ApiResponse<FpaCellComment>>(
      `${FPA}/models/${modelId}/cells/${cellId}/comments`,
      body,
    ),

  getGridValidations: (
    modelId: string,
    params?: { versionId?: string; scenarioId?: string; cycleId?: string },
  ) =>
    apiClient.get<ApiResponse<FpaGridValidation[] | { errors?: FpaGridValidation[]; items?: FpaGridValidation[] }>>(
      `${FPA}/models/${modelId}/grid/validations${qs(params)}`,
    ),

  // —— Scenarios ——
  listScenarios: (modelId?: string) =>
    apiClient.get<ApiResponse<FpaScenario[]>>(`${FPA}/scenarios${qs({ modelId })}`),

  /** Nested REST — same payload as listScenarios(?modelId=). */
  listModelScenarios: (modelId: string) =>
    apiClient.get<ApiResponse<FpaScenario[]>>(`${FPA}/models/${modelId}/scenarios`),

  /** Nested REST — versions for a model (also embedded on GET /models/:id). */
  listModelVersions: (modelId: string) =>
    apiClient.get<ApiResponse<FpaVersion[]>>(`${FPA}/models/${modelId}/versions`),

  createScenario: (body: {
    modelId: string
    name: string
    scenarioType?: string
    description?: string
    /** When set, BE should create as override child of this scenario (preferred over empty create). */
    inheritFromScenarioId?: string
    versionId?: string
  }) => apiClient.post<ApiResponse<FpaScenario>>(`${FPA}/scenarios`, body),

  copyScenario: (
    scenarioId: string,
    body: {
      versionId: string
      name: string
      scenarioType?: string
      description?: string
      /** Keep link to source for inheritance display. */
      inheritFromSource?: boolean
    },
  ) =>
    apiClient.post<ApiResponse<FpaScenarioCopyResult>>(
      `${FPA}/scenarios/${scenarioId}/copy`,
      body,
    ),

  /** Poll async scenario copy job (Stage 4 large-model path). */
  getScenarioCopyJob: (jobId: string) =>
    apiClient.get<ApiResponse<FpaScenarioCopyJobResult>>(
      `${FPA}/scenarios/copy-jobs/${jobId}`,
    ),

  promoteScenario: (
    scenarioId: string,
    body?: { versionId?: string; name?: string },
  ) =>
    apiClient.post<ApiResponse<FpaScenario | { scenario: FpaScenario }>>(
      `${FPA}/scenarios/${scenarioId}/promote`,
      body ?? {},
    ),

  updateScenario: (
    scenarioId: string,
    body: {
      name?: string
      description?: string | null
      scenarioType?: string
      parentScenarioId?: string | null
    },
  ) => apiClient.put<ApiResponse<FpaScenario>>(`${FPA}/scenarios/${scenarioId}`, body),

  /** Alias — BE accepts PUT or PATCH. */
  patchScenario: (
    scenarioId: string,
    body: {
      name?: string
      description?: string | null
      scenarioType?: string
      parentScenarioId?: string | null
    },
  ) => apiClient.patch<ApiResponse<FpaScenario>>(`${FPA}/scenarios/${scenarioId}`, body),

  archiveScenario: (scenarioId: string) =>
    apiClient.post<ApiResponse<FpaScenario | { scenario: FpaScenario }>>(
      `${FPA}/scenarios/${scenarioId}/archive`,
      {},
    ),

  compareScenarios: (scenarioId: string, body: FpaScenarioCompareRequest) =>
    apiClient.post<ApiResponse<FpaScenarioCompareResult>>(
      `${FPA}/scenarios/${scenarioId}/compare`,
      body,
    ),

  /** Scoped KPIs / trend / workflow for Planning Workspace chrome (live from committed cells). */
  getPlanningSummary: (
    modelId: string,
    params: { versionId: string; scenarioId: string; cycleId?: string },
  ) =>
    apiClient.get<ApiResponse<FpaPlanningSummary>>(
      `${FPA}/models/${modelId}/planning-summary${qs(params)}`,
    ),

  // —— Versions ——
  createVersion: (body: { modelId: string; name: string }) =>
    apiClient.post<ApiResponse<FpaVersion>>(`${FPA}/versions`, body),

  lockVersion: (versionId: string, body?: { reason?: string }) =>
    apiClient.post<ApiResponse<{ version: FpaVersion; lock?: unknown }>>(
      `${FPA}/versions/${versionId}/lock`,
      body ?? {},
    ),

  /** Never silent-unlocks — creates a new DRAFT working copy with cells copied. */
  requestReopenVersion: (versionId: string, body: { reason: string }) =>
    apiClient.post<
      ApiResponse<{ version: FpaVersion; sourceVersionId?: string; cellsCopied?: number }>
    >(`${FPA}/versions/${versionId}/request-reopen`, body),

  archiveVersion: (versionId: string) =>
    apiClient.post<ApiResponse<FpaVersion>>(`${FPA}/versions/${versionId}/archive`),

  seedVersionCells: (
    versionId: string,
    body?: {
      scenarioId?: string
      sourceVersionId?: string | null
      fillMissing?: boolean
      force?: boolean
    },
  ) =>
    apiClient.post<
      ApiResponse<{
        versionId?: string
        cellCount?: number
        seeded?: number
        cellsSeeded?: number
        filled?: number
        filledMissing?: boolean
        total?: number
        skipped?: boolean
        version?: FpaVersion
      }>
    >(`${FPA}/versions/${versionId}/seed-cells`, body ?? {}),

  // —— Workflow & tasks ——
  listWorkflows: (params?: { modelId?: string; workflowType?: string; status?: string }) =>
    apiClient.get<ApiResponse<FpaWorkflow[]>>(`${FPA}/workflows${qs(params)}`),

  createWorkflow: (body: Record<string, unknown>) =>
    apiClient.post<ApiResponse<FpaWorkflow>>(`${FPA}/workflows`, body),

  getWorkflow: (id: string) =>
    apiClient.get<ApiResponse<FpaWorkflow>>(`${FPA}/workflows/${id}`),

  myTasks: (params?: { modelId?: string; versionId?: string; status?: string }) =>
    apiClient.get<ApiResponse<FpaTask[]>>(`${FPA}/tasks/my-tasks${qs(params)}`),

  submitTask: (id: string, body?: { comment?: string; changeNotes?: string; notes?: string }) =>
    apiClient.post<ApiResponse<FpaTask>>(`${FPA}/tasks/${id}/submit`, body ?? {}),

  returnTask: (id: string, body?: { comment?: string }) =>
    apiClient.post<ApiResponse<FpaTask>>(`${FPA}/tasks/${id}/return`, body ?? {}),

  approveTask: (id: string, body?: { comment?: string }) =>
    apiClient.post<ApiResponse<FpaTask>>(`${FPA}/tasks/${id}/approve`, body ?? {}),

  patchTask: (id: string, body: { status: string }) =>
    apiClient.patch<ApiResponse<FpaTask>>(`${FPA}/tasks/${id}`, body),

  reassignTask: (id: string, body: { assigneeId: string; comment?: string }) =>
    apiClient.post<ApiResponse<FpaTask>>(`${FPA}/tasks/${id}/reassign`, body),

  getTaskSummary: (id: string) =>
    apiClient.get<ApiResponse<FpaTaskSummary>>(`${FPA}/tasks/${id}/summary`),

  listTaskComments: (id: string) =>
    apiClient.get<ApiResponse<FpaWorkflowComment[]>>(`${FPA}/tasks/${id}/comments`),

  postTaskComment: (id: string, body: { body: string; visibility?: 'INTERNAL' | 'ALL' }) =>
    apiClient.post<ApiResponse<FpaWorkflowComment>>(`${FPA}/tasks/${id}/comments`, body),

  listTaskAttachments: (id: string) =>
    apiClient.get<ApiResponse<FpaTaskAttachment[]>>(`${FPA}/tasks/${id}/attachments`),

  uploadTaskAttachment: (id: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiClient.postFormData<ApiResponse<FpaTaskAttachment>>(
      `${FPA}/tasks/${id}/attachments`,
      form,
    )
  },

  downloadAttachment: (id: string) =>
    apiClient.get<Blob>(`${FPA}/attachments/${id}/download`, { responseType: 'blob' }),

  deleteAttachment: (id: string) =>
    apiClient.delete<ApiResponse<{ deleted?: boolean }>>(`${FPA}/attachments/${id}`),

  // —— Annual budget cycles (Budgeting tab — preferred over bare workflows) ——
  listBudgetCycles: (params?: { modelId?: string; fiscalYear?: number; status?: string }) =>
    apiClient.get<ApiResponse<FpaBudgetCycle[]>>(`${FPA}/budget-cycles${qs(params)}`),

  createBudgetCycle: (body: FpaBudgetCycleCreateRequest) =>
    apiClient.post<ApiResponse<FpaBudgetCycle>>(`${FPA}/budget-cycles`, body),

  getBudgetCycle: (id: string) =>
    apiClient.get<ApiResponse<FpaBudgetCycle>>(`${FPA}/budget-cycles/${id}`),

  listBudgetCycleTasks: (
    id: string,
    params?: {
      status?: string
      departmentId?: string
      assigneeId?: string
      priority?: string
    },
  ) =>
    apiClient.get<ApiResponse<FpaCycleTask[]>>(
      `${FPA}/budget-cycles/${id}/tasks${qs(params)}`,
    ),

  exportBudgetCycleTasksCsv: (id: string) =>
    apiClient.get<Blob>(`${FPA}/budget-cycles/${id}/tasks/export`, { responseType: 'blob' }),

  listBudgetApprovalEvents: (id: string) =>
    apiClient.get<ApiResponse<FpaApprovalEvent[]>>(
      `${FPA}/budget-cycles/${id}/approval-events`,
    ),

  listBudgetCycleComments: (id: string) =>
    apiClient.get<ApiResponse<FpaWorkflowComment[]>>(`${FPA}/budget-cycles/${id}/comments`),

  postBudgetCycleComment: (
    id: string,
    body: { body: string; visibility?: 'INTERNAL' | 'ALL' },
  ) =>
    apiClient.post<ApiResponse<FpaWorkflowComment>>(
      `${FPA}/budget-cycles/${id}/comments`,
      body,
    ),

  updateBudgetCycle: (id: string, body: FpaBudgetCycleUpdateRequest) =>
    apiClient.patch<ApiResponse<FpaBudgetCycle>>(`${FPA}/budget-cycles/${id}`, body),

  /** Alias — some environments expose PUT for the same setup update. */
  putBudgetCycle: (id: string, body: FpaBudgetCycleUpdateRequest) =>
    apiClient.put<ApiResponse<FpaBudgetCycle>>(`${FPA}/budget-cycles/${id}`, body),

  validateBudgetSetup: (id: string) =>
    apiClient.post<ApiResponse<FpaSetupValidationResult>>(
      `${FPA}/budget-cycles/${id}/validate-setup`,
    ),

  openBudgetCycle: (
    id: string,
    body?: { loadPriorActuals?: boolean; loadBaseline?: boolean },
  ) =>
    apiClient.post<
      ApiResponse<
        FpaBudgetCycle & {
          actualsRowCount?: number
          actualsLoadReason?: string | null
        }
      >
    >(`${FPA}/budget-cycles/${id}/open`, body ?? {}),

  getOwnerWorkspace: (id: string) =>
    apiClient.get<ApiResponse<FpaOwnerWorkspace>>(
      `${FPA}/budget-cycles/${id}/owner-workspace`,
    ),

  getReviewWorkspace: (id: string) =>
    apiClient.get<ApiResponse<FpaReviewWorkspace>>(
      `${FPA}/budget-cycles/${id}/review-workspace`,
    ),

  validateOwnerSubmit: (id: string, body?: { departmentIds?: string[] }) =>
    apiClient.post<
      ApiResponse<{
        passed?: boolean
        canSubmit?: boolean
        errors?: FpaSetupValidationError[]
        unmetRequirements?: FpaOwnerWorkspace['unmetRequirements']
      }>
    >(`${FPA}/budget-cycles/${id}/validate-owner-submit`, body ?? {}),

  loadBudgetActuals: (id: string, body?: { periodStart?: string; periodEnd?: string }) =>
    apiClient.post<
      ApiResponse<FpaBudgetCycle & { rowCount?: number; actualsRowCount?: number; actualsLoadReason?: string }>
    >(`${FPA}/budget-cycles/${id}/load-actuals`, body ?? {}),

  loadBudgetBaseline: (
    id: string,
    body?: {
      mode?: FpaBaselineMode
      sourceVersionId?: string | null
    },
  ) => apiClient.post<ApiResponse<FpaBudgetCycle>>(`${FPA}/budget-cycles/${id}/load-baseline`, body ?? {}),

  assignBudgetOwners: (
    id: string,
    body: {
      owners: Array<{
        departmentId: string
        assigneeId?: string | null
        categories?: FpaBudgetInputCategory[]
        dueDate?: string | null
        baselineMethod?: FpaBaselineMode | null
      }>
    },
  ) => apiClient.put<ApiResponse<FpaBudgetCycle>>(`${FPA}/budget-cycles/${id}/owners`, body),

  /** Legacy open-cycle validate (post-open). Prefer validateBudgetSetup for DRAFT. */
  validateBudgetCycle: (id: string) =>
    apiClient.post<
      ApiResponse<{
        passed: boolean
        message?: string
        errors: Array<{
          code: string
          message: string
          step?: string
          departmentId?: string
          category?: string
        }>
      }>
    >(`${FPA}/budget-cycles/${id}/validate`),

  submitBudgetForFpaReview: (id: string, body?: { comment?: string }) =>
    apiClient.post<ApiResponse<FpaBudgetCycle>>(`${FPA}/budget-cycles/${id}/submit-fpa`, body ?? {}),

  fpaAcceptBudget: (id: string, body?: { comment?: string }) =>
    apiClient.post<ApiResponse<FpaBudgetCycle>>(`${FPA}/budget-cycles/${id}/fpa-accept`, body ?? {}),

  fpaReturnBudget: (
    id: string,
    body: { comment: string; departmentIds?: string[] },
  ) => apiClient.post<ApiResponse<FpaBudgetCycle>>(`${FPA}/budget-cycles/${id}/fpa-return`, body),

  cfoApproveBudget: (id: string, body?: { comment?: string }) =>
    apiClient.post<ApiResponse<FpaBudgetCycle>>(`${FPA}/budget-cycles/${id}/cfo-approve`, body ?? {}),

  cfoReturnBudget: (id: string, body: { comment: string }) =>
    apiClient.post<ApiResponse<FpaBudgetCycle>>(`${FPA}/budget-cycles/${id}/cfo-return`, body),

  lockBudgetCycle: (id: string, body?: { reason?: string }) =>
    apiClient.post<ApiResponse<FpaBudgetCycle>>(`${FPA}/budget-cycles/${id}/lock`, body ?? {}),

  generateBudgetBoardPack: (id: string) =>
    apiClient.post<
      ApiResponse<{
        id?: string
        exportJobId?: string
        boardPackUrl?: string
        url?: string
        cycle: FpaBudgetCycle
      }>
    >(`${FPA}/budget-cycles/${id}/board-pack`),

  getBudgetCycleSummary: (id: string) =>
    apiClient.get<
      ApiResponse<{
        byCategory: Array<{ category: FpaBudgetInputCategory; plan: number; priorActual?: number }>
        byDepartment: Array<{ departmentId: string; name?: string; plan: number; status: string }>
      }>
    >(`${FPA}/budget-cycles/${id}/summary`),

  // —— Actuals ——
  syncActuals: (body: {
    modelId: string
    versionId?: string
    scenarioId?: string
    periodStart?: string
    periodEnd?: string
  }) => apiClient.post<ApiResponse<unknown>>(`${FPA}/actuals/sync`, body),

  listActualSnapshots: (params: {
    modelId?: string
    periodStart?: string
    periodEnd?: string
  }) => apiClient.get<ApiResponse<unknown[]>>(`${FPA}/actuals/snapshots${qs(params)}`),

  // —— Variance ——
  calculateVariance: (body: {
    modelId: string
    versionId: string
    scenarioId?: string
    cycleId?: string
    varianceType?: string
  }) =>
    apiClient.post<ApiResponse<{ count: number; results: FpaVarianceResult[] }>>(
      `${FPA}/variance/calculate`,
      body,
    ),

  listVarianceResults: (params?: {
    modelId?: string
    versionId?: string
    varianceType?: string
    direction?: string
    limit?: number
  }) =>
    apiClient.get<ApiResponse<FpaVarianceResult[]>>(`${FPA}/variance/results${qs(params)}`),

  addVarianceCommentary: (
    varianceId: string,
    body: { body?: string; commentary?: string; correctiveAction?: string },
  ) =>
    apiClient.post<ApiResponse<FpaComment>>(`${FPA}/variance/${varianceId}/commentary`, body),

  getVarianceSummary: (params: { modelId: string; versionId?: string }) =>
    apiClient.get<ApiResponse<FpaVarianceSummary>>(`${FPA}/variance/summary${qs(params)}`),

  // —— Home ——
  getDashboard: (params?: {
    modelId?: string
    versionId?: string
    scenarioId?: string
    cycleId?: string
    period?: string
  }) =>
    apiClient.get<ApiResponse<FpaHomeDashboard>>(`${FPA}/home/dashboard${qs(params)}`),

  // —— Domain ——
  getDomainView: (
    category: 'workforce' | 'revenue' | 'expense' | 'cash',
    params?: string | {
      modelId?: string
      versionId?: string
      scenarioId?: string
      entityId?: string
      periodFrom?: string
      periodTo?: string
    },
  ) =>
    apiClient.get<ApiResponse<FpaDomainView>>(
      `${FPA}/domain/${category}${qs(typeof params === 'string' ? { modelId: params } : params)}`,
    ),

  previewDomainSensitivity: (
    category: 'workforce' | 'revenue' | 'expense' | 'cash',
    body: {
      modelId: string
      versionId: string
      scenarioId: string
      entityId?: string
      periodFrom?: string
      periodTo?: string
      overrides: FpaDomainSensitivityOverride[]
    },
  ) =>
    apiClient.post<ApiResponse<FpaDomainSensitivityResult>>(
      `${FPA}/domain/${category}/sensitivity`,
      body,
    ),

  // —— Exports ——
  createExport: (body: {
    modelId: string
    versionId?: string
    exportType: FpaExportType
    period?: string
    meta?: Record<string, unknown>
  }) => apiClient.post<ApiResponse<FpaExportJob>>(`${FPA}/exports/board-pack`, body),

  listExports: (params: { modelId: string; limit?: number }) =>
    apiClient.get<ApiResponse<FpaExportJob[]>>(`${FPA}/exports${qs(params)}`),

  getExportCapabilities: () =>
    apiClient.get<ApiResponse<FpaExportCapabilities>>(`${FPA}/exports/capabilities`),

  getExport: (exportId: string) =>
    apiClient.get<ApiResponse<FpaExportJob>>(`${FPA}/exports/${exportId}`),

  downloadExport: (exportId: string) =>
    apiClient.get<ApiResponse<{ downloadUrl?: string; url?: string } | Blob | ArrayBuffer>>(
      `${FPA}/exports/${exportId}/download`,
    ),

  resolveExportDownloadUrl: async (job: Pick<FpaExportJob, 'id' | 'downloadUrl' | 'url'>) => {
    const direct = job.downloadUrl || job.url
    if (direct) return direct
    try {
      const res = await fpaApi.downloadExport(job.id)
      if (res.success && res.data && typeof res.data === 'object' && !(res.data instanceof Blob)) {
        const data = res.data as { downloadUrl?: string; url?: string }
        return data.downloadUrl || data.url || null
      }
    } catch {
      /* fall through */
    }
    return null
  },

  // —— Rolling forecast ——
  getRollingForecast: (
    modelId: string,
    params?: { versionId?: string; scenarioId?: string; cycleId?: string },
  ) =>
    apiClient.get<ApiResponse<FpaRollingForecast>>(
      `${FPA}/models/${modelId}/rolling-forecast${qs(params)}`,
    ),

  updateRollingForecastCutoff: (
    modelId: string,
    body: {
      versionId?: string
      scenarioId?: string
      cycleId?: string
      actualsCutoff: string
      horizonMonths: number
    },
  ) =>
    apiClient.put<ApiResponse<FpaRollingForecast>>(
      `${FPA}/models/${modelId}/rolling-forecast/cutoff`,
      body,
    ),

  updateRollingForecastMethod: (
    modelId: string,
    body: { versionId?: string; scenarioId?: string; cycleId?: string; method: string },
  ) =>
    apiClient.put<ApiResponse<FpaRollingForecast>>(
      `${FPA}/models/${modelId}/rolling-forecast/method`,
      body,
    ),

  rollForwardForecast: (
    modelId: string,
    body: {
      versionId?: string
      scenarioId?: string
      cycleId?: string
      months?: number
    },
  ) =>
    apiClient.post<ApiResponse<FpaRollingForecast>>(
      `${FPA}/models/${modelId}/rolling-forecast/roll-forward`,
      body,
    ),

  // —— AI stubs ——
  aiSuggest: (body: { modelId: string; lineItemCode: string }) =>
    apiClient.post<ApiResponse<unknown>>(`${FPA}/ai/suggest`, body),

  aiCommentaryDraft: (body: { modelId: string; varianceId: string }) =>
    apiClient.post<ApiResponse<unknown>>(`${FPA}/ai/commentary-draft`, body),

  // —— Forecast entities (outside /v1/fpa) ——
  listEntities: () =>
    apiClient.get<ApiResponse<ForecastEntity[]>>('/forecast-entities'),

  getEntity: (id: string) =>
    apiClient.get<ApiResponse<ForecastEntity>>(`/forecast-entities/${id}`),

  createEntity: (body: Record<string, unknown>) =>
    apiClient.post<ApiResponse<ForecastEntity>>('/forecast-entities', body),

  archiveEntity: (id: string, body: { archive: true; reason: string }) =>
    apiClient.delete<ApiResponse<ForecastEntity>>(`/forecast-entities/${id}`, {
      body: JSON.stringify(body),
    }),

  getChartOfAccounts: (
    entityId: string,
    params?: { account_type?: string; is_active?: string; for_posting?: string },
  ) =>
    apiClient.get<ApiResponse<ForecastChartAccount[]>>(
      `/forecast-entities/${entityId}/chart-of-accounts${qs(params)}`,
    ),

  // —— Persisted FP&A settings ——
  getSettings: () =>
    apiClient.get<ApiResponse<FpaSettings>>(`${FPA}/settings`),

  updateSettings: (body: FpaSettings) =>
    apiClient.put<ApiResponse<FpaSettings>>(`${FPA}/settings`, body),

  connectSyncSource: (sourceId: string) =>
    apiClient.post<ApiResponse<FpaSyncSource>>(
      `${FPA}/settings/sync-sources/${sourceId}/connect`,
      {},
    ),

  disconnectSyncSource: (sourceId: string) =>
    apiClient.post<ApiResponse<FpaSyncSource>>(
      `${FPA}/settings/sync-sources/${sourceId}/disconnect`,
      {},
    ),

  syncSyncSource: (sourceId: string) =>
    apiClient.post<ApiResponse<FpaSyncSource>>(
      `${FPA}/settings/sync-sources/${sourceId}/sync`,
      {},
    ),

  // —— Model Planning Cycles (distinct from /budget-cycles) ——
  listModelPlanningCycles: (params?: {
    modelId?: string
    planningType?: string
    status?: string
    ownerId?: string
  }) =>
    apiClient.get<ApiResponse<FpaModelPlanningCycleListResponse>>(
      `${FPA}/model-planning/cycles${qs(params)}`,
    ),

  createModelPlanningCycle: (body: FpaModelPlanningCycleCreateRequest) =>
    apiClient.post<ApiResponse<FpaModelPlanningCycle>>(`${FPA}/model-planning/cycles`, body),

  getModelPlanningCycle: (id: string) =>
    apiClient.get<ApiResponse<FpaModelPlanningCycle>>(`${FPA}/model-planning/cycles/${id}`),

  getModelPlanningCycleWorkspace: (id: string) =>
    apiClient.get<ApiResponse<FpaModelPlanningCycleWorkspace>>(
      `${FPA}/model-planning/cycles/${id}/workspace`,
    ),

  getModelPlanningOwnerWorkspace: (id: string) =>
    apiClient.get<ApiResponse<FpaModelPlanningOwnerWorkspace>>(
      `${FPA}/model-planning/cycles/${id}/owner-workspace`,
    ),

  assignModelPlanningOwners: (
    id: string,
    body: { owners: FpaModelPlanningOwnerCreate[] },
  ) =>
    apiClient.put<ApiResponse<FpaModelPlanningCycle>>(
      `${FPA}/model-planning/cycles/${id}/owners`,
      body,
    ),

  listModelPlanningCycleTasks: (
    id: string,
    params?: {
      status?: string
      departmentId?: string
      assigneeId?: string
      priority?: string
    },
  ) =>
    apiClient.get<ApiResponse<FpaCycleTask[]>>(
      `${FPA}/model-planning/cycles/${id}/tasks${qs(params)}`,
    ),

  createModelPlanningCycleTask: (id: string, body: FpaModelPlanningTaskCreateRequest) =>
    apiClient.post<ApiResponse<FpaCycleTask>>(
      `${FPA}/model-planning/cycles/${id}/tasks`,
      body,
    ),

  // —— Model Planning cycle comments + activity (MPC-native) ——
  listModelPlanningCycleComments: (id: string) =>
    apiClient.get<ApiResponse<FpaWorkflowComment[]>>(
      `${FPA}/model-planning/cycles/${id}/comments`,
    ),
  postModelPlanningCycleComment: (
    id: string,
    body: { body: string; parentCommentId?: string | null },
  ) =>
    apiClient.post<ApiResponse<FpaWorkflowComment>>(
      `${FPA}/model-planning/cycles/${id}/comments`,
      body,
    ),
  listModelPlanningCycleActivity: (id: string) =>
    apiClient.get<ApiResponse<FpaApprovalEvent[]>>(
      `${FPA}/model-planning/cycles/${id}/activity`,
    ),

  submitModelPlanningCycle: (id: string, body?: { note?: string }) =>
    apiClient.post<ApiResponse<FpaModelPlanningCycle>>(
      `${FPA}/model-planning/cycles/${id}/submit`,
      body ?? {},
    ),

  acceptModelPlanningCycleReview: (id: string, body?: { comment?: string }) =>
    apiClient.post<ApiResponse<FpaModelPlanningCycle>>(
      `${FPA}/model-planning/cycles/${id}/review/accept`,
      body ?? {},
    ),

  returnModelPlanningCycleReview: (
    id: string,
    body: { departmentId: string; taskId: string; comment: string },
  ) =>
    apiClient.post<ApiResponse<FpaModelPlanningCycle>>(
      `${FPA}/model-planning/cycles/${id}/review/return`,
      body,
    ),

  approveModelPlanningCycleByCfo: (
    id: string,
    body: { comment?: string; scenarioId?: string },
  ) =>
    apiClient.post<ApiResponse<FpaModelPlanningCycle>>(
      `${FPA}/model-planning/cycles/${id}/cfo-approve`,
      body,
    ),

  returnModelPlanningCycleByCfo: (
    id: string,
    body: { comment: string; scenarioId?: string },
  ) =>
    apiClient.post<ApiResponse<FpaModelPlanningCycle>>(
      `${FPA}/model-planning/cycles/${id}/cfo-return`,
      body,
    ),

  lockModelPlanningCycle: (id: string, body: { reason: string }) =>
    apiClient.post<ApiResponse<FpaModelPlanningCycle>>(
      `${FPA}/model-planning/cycles/${id}/lock`,
      body,
    ),

  requestModelPlanningCycleReopen: (id: string, body: { reason: string }) =>
    apiClient.post<ApiResponse<FpaModelPlanningCycle>>(
      `${FPA}/model-planning/cycles/${id}/request-reopen`,
      body,
    ),

  updateModelPlanningCycle: (id: string, body: FpaModelPlanningCycleUpdateRequest) =>
    apiClient.put<ApiResponse<FpaModelPlanningCycle>>(
      `${FPA}/model-planning/cycles/${id}`,
      body,
    ),

  deleteModelPlanningCycle: (id: string) =>
    apiClient.delete<ApiResponse<{ id: string; deleted: boolean }>>(
      `${FPA}/model-planning/cycles/${id}`,
    ),

  listModelPlanningCycleSources: (modelId?: string) =>
    apiClient.get<ApiResponse<FpaModelPlanningCycleSources>>(
      `${FPA}/model-planning/cycles/sources${qs(modelId ? { modelId } : undefined)}`,
    ),
}
