/** SRD Annual Budget Cycle + Budget Owner Sequence constants */

import type {
  FpaBudgetCycleStage,
  FpaBudgetCycleStatus,
  FpaBudgetInputCategory,
} from "@/lib/api/fpa-api"

export const BUDGET_PURPOSE =
  "Set the formal financial plan for the year — allocate resources, control spending, and measure performance."

export const BUDGET_INPUT_CATEGORIES: Array<{
  id: FpaBudgetInputCategory
  label: string
  description: string
}> = [
  { id: "REVENUE", label: "Revenue", description: "Sales and other income lines" },
  { id: "COST_OF_SALES", label: "Cost of sales", description: "Direct costs of revenue" },
  { id: "PAYROLL", label: "Payroll", description: "Salaries, wages, benefits" },
  { id: "OPERATING_EXPENSES", label: "Operating expenses", description: "Overheads and opex" },
  { id: "DEPARTMENTAL", label: "Departmental costs", description: "Dept-owned cost centres" },
  { id: "PROJECT", label: "Project budgets", description: "Project / initiative spends" },
  { id: "CAPEX", label: "Capex", description: "Capital expenditure" },
  { id: "TAX", label: "Tax", description: "Tax assumptions" },
  { id: "CASH_MOVEMENT", label: "Cash movement", description: "Working capital & cash timing" },
  { id: "FUNDING", label: "Funding", description: "Debt, equity, and funding assumptions" },
]

/** SRD planning cycle types — Annual Budgeting uses ANNUAL_BUDGET. */
export const BUDGET_BASELINE_METHODS = [
  { id: "PRIOR_YEAR_ACTUAL", label: "Prior-year actual" },
  { id: "PRIOR_YEAR_BUDGET", label: "Prior-year budget" },
  { id: "LATEST_FORECAST", label: "Latest forecast" },
  { id: "DRIVER_BASED", label: "Driver-based" },
  { id: "ZERO_BASED", label: "Zero-based" },
  { id: "CUSTOM", label: "Custom" },
  { id: "NONE", label: "None" },
] as const

export const PLANNING_CYCLE_TYPES = [
  { id: "ANNUAL_BUDGET", label: "Annual budget", enabled: true },
  { id: "QUARTERLY_FORECAST", label: "Quarterly forecast", enabled: true },
  { id: "ROLLING_FORECAST", label: "Rolling forecast", enabled: true },
  { id: "REFORECAST", label: "Reforecast", enabled: true },
  { id: "LONG_RANGE_PLAN", label: "Long-range plan", enabled: true },
  { id: "STRATEGIC_PLAN", label: "Strategic plan", enabled: true },
] as const

/** Create-cycle setup sequence (SRD §1) shown in the create modal. */
export const BUDGET_SETUP_SEQUENCE = [
  "Create planning cycle",
  "Select type & published model",
  "Set horizon & actuals cut-off",
  "Select entities / departments",
  "Assign budget owners",
  "Configure drivers & workflow",
  "Validate setup",
  "Open planning cycle",
] as const

/** Visual flow nodes matching the Annual Budget Cycle diagram. */
export const BUDGET_FLOW_NODES: Array<{
  id: string
  label: string
  kind: "step" | "decision" | "return" | "success"
  stage?: FpaBudgetCycleStage
}> = [
  { id: "create", label: "Create planning cycle", kind: "step", stage: "CREATE_CYCLE" },
  { id: "actuals", label: "Load prior actuals & baseline", kind: "step", stage: "LOAD_ACTUALS" },
  { id: "baseline", label: "Open department plans", kind: "step", stage: "LOAD_BASELINE" },
  { id: "assign", label: "Assign budget owners", kind: "step", stage: "ASSIGN_OWNERS" },
  { id: "input", label: "Owners enter drivers & plan", kind: "step", stage: "OWNER_INPUT" },
  { id: "validate", label: "Validate before submit", kind: "step", stage: "VALIDATE" },
  { id: "valid?", label: "Complete and valid?", kind: "decision" },
  { id: "submit", label: "Department submits", kind: "step", stage: "FPA_REVIEW" },
  { id: "fpa", label: "FP&A review & consolidate", kind: "step", stage: "FPA_REVIEW" },
  { id: "fpa?", label: "FP&A accepts?", kind: "decision" },
  { id: "cfo", label: "CFO review", kind: "step", stage: "CFO_REVIEW" },
  { id: "cfo?", label: "CFO approves?", kind: "decision" },
  { id: "lock", label: "Lock approved budget", kind: "success", stage: "LOCK" },
  { id: "pack", label: "Board reporting", kind: "success", stage: "REPORTS" },
  { id: "return", label: "Return for correction", kind: "return" },
]

/** 14.1 Budget Owner Sequence */
export const BUDGET_OWNER_SEQUENCE: Array<{
  step: number
  actor: string
  systemAction: string
}> = [
  { step: 1, actor: "FP&A Manager", systemAction: "Creates the budget cycle and assigns owners" },
  { step: 2, actor: "Arcus", systemAction: "Creates a task list and loads prior actuals and baseline assumptions" },
  { step: 3, actor: "Department Head", systemAction: "Inputs budget lines and commentary" },
  { step: 4, actor: "Arcus", systemAction: "Validates required fields and totals" },
  { step: 5, actor: "Department Head", systemAction: "Submits the budget" },
  { step: 6, actor: "FP&A Manager", systemAction: "Reviews, approves, or returns for correction" },
  { step: 7, actor: "CFO", systemAction: "Reviews the consolidated budget and approves" },
  { step: 8, actor: "Arcus", systemAction: "Locks the approved version and generates dashboards" },
]

export const BUDGET_STATUS_LABEL: Record<FpaBudgetCycleStatus, string> = {
  DRAFT: "Draft",
  LOADING_ACTUALS: "Loading actuals",
  LOADING_BASELINE: "Loading baseline",
  OPEN_FOR_INPUT: "Open for input",
  PENDING_VALIDATION: "Validating",
  PENDING_FPA_REVIEW: "FP&A review",
  PENDING_CFO_REVIEW: "CFO review",
  RETURNED_FOR_CORRECTION: "Returned for correction",
  APPROVED: "Approved",
  LOCKED: "Locked",
}

export function statusTone(
  status: string,
): "info" | "warning" | "success" | "danger" | "neutral" {
  const s = status.toUpperCase()
  if (s.includes("LOCK") || s === "APPROVED") return "success"
  if (s.includes("RETURN") || s.includes("CORRECTION")) return "danger"
  if (s.includes("REVIEW") || s.includes("PENDING") || s.includes("VALID")) return "warning"
  if (s.includes("OPEN") || s.includes("INPUT") || s.includes("DRAFT")) return "info"
  return "neutral"
}

export function stageIndex(stage?: string | null): number {
  const order: FpaBudgetCycleStage[] = [
    "CREATE_CYCLE",
    "LOAD_ACTUALS",
    "LOAD_BASELINE",
    "ASSIGN_OWNERS",
    "OWNER_INPUT",
    "VALIDATE",
    "FPA_REVIEW",
    "CFO_REVIEW",
    "LOCK",
    "REPORTS",
  ]
  if (!stage) return 0
  const i = order.indexOf(stage as FpaBudgetCycleStage)
  return i < 0 ? 0 : i
}

export function formatStageLabel(stage?: string | null): string {
  if (!stage) return "—"
  return stage.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export type CycleNextPrimaryKind =
  | "worksheet"
  | "submit_task"
  | "validate"
  | "submit_fpa"
  | "fpa_accept"
  | "cfo_approve"
  | "lock"
  | "board_pack"
  | "none"

export type CycleNextStep = {
  title: string
  body: string
  primaryKind: CycleNextPrimaryKind
}

function isTaskDone(status?: string | null): boolean {
  const s = String(status || "").toUpperCase()
  return s === "SUBMITTED" || s === "APPROVED" || s === "COMPLETED" || s === "DONE"
}

/** Derive one guided next step for the cycle detail panel. */
export function getCycleNextStep(opts: {
  status: FpaBudgetCycleStatus | string
  myTaskStatus?: string | null
  owners?: Array<{ status?: string | null }> | null
  canEditGrid: boolean
  canSubmitTask: boolean
  canAssignTasks: boolean
  canReviewSubmissions: boolean
  canApproveBudget: boolean
  canLockVersion: boolean
  validationPassed: boolean | null
  hasBoardPack?: boolean
}): CycleNextStep {
  const st = String(opts.status).toUpperCase()
  const myDone = isTaskDone(opts.myTaskStatus)
  const owners = opts.owners || []
  const allOwnersDone =
    owners.length > 0 && owners.every((o) => isTaskDone(o.status))

  if (st === "LOCKED" || st === "REPORTS") {
    if (opts.canEditGrid || opts.canSubmitTask) {
      return {
        title: "Budget locked",
        body: "This plan is locked for changes. You can still open the workspace to view numbers.",
        primaryKind: "worksheet",
      }
    }
    if (opts.canReviewSubmissions || opts.canApproveBudget || opts.canLockVersion || opts.canAssignTasks) {
      return {
        title: "Budget locked",
        body: opts.hasBoardPack
          ? "Open the workspace to view figures, or Workflow & Approvals for the board pack."
          : "Open the workspace to view figures, or Workflow & Approvals for reporting.",
        primaryKind: "worksheet",
      }
    }
    return {
      title: "Budget locked",
      body: "This plan is locked. Open the workspace to view the approved numbers.",
      primaryKind: "worksheet",
    }
  }

  if (st === "APPROVED") {
    if (opts.canEditGrid || opts.canReviewSubmissions || opts.canApproveBudget || opts.canAssignTasks) {
      return {
        title: "Approved — lock in Workflow",
        body: "Open the workspace to review figures, or Workflow & Approvals to lock the version.",
        primaryKind: "worksheet",
      }
    }
    return {
      title: "Approved — lock in Workflow",
      body: "Continue in Workflow & Approvals to lock the approved budget version.",
      primaryKind: "none",
    }
  }

  if (st === "PENDING_CFO_REVIEW") {
    return {
      title: "CFO review in Workflow",
      body:
        opts.canApproveBudget
          ? "Open Workflow & Approvals to approve or return the consolidated budget."
          : "Your part is done for now. The CFO is reviewing in Workflow & Approvals.",
      primaryKind: "none",
    }
  }

  if (st === "PENDING_FPA_REVIEW") {
    return {
      title: "FP&A review in Workflow",
      body:
        opts.canReviewSubmissions
          ? "Open Workflow & Approvals to accept for CFO or return to owners."
          : "Owners have submitted. FP&A is reviewing in Workflow & Approvals.",
      primaryKind: "none",
    }
  }

  if (st === "RETURNED_FOR_CORRECTION") {
    if (opts.canSubmitTask && !myDone) {
      return {
        title: "Fix and resubmit",
        body: "Update the worksheet where needed, then submit your budget again.",
        primaryKind: opts.canEditGrid ? "worksheet" : "submit_task",
      }
    }
    if (opts.canAssignTasks) {
      return {
        title: "Owners fixing inputs",
        body: "The cycle was returned. Wait for owners to resubmit, then validate again.",
        primaryKind: "none",
      }
    }
    return {
      title: "Returned for correction",
      body: "Open the worksheet, fix the issues, and resubmit when ready.",
      primaryKind: opts.canEditGrid ? "worksheet" : "none",
    }
  }

  if (
    st === "OPEN_FOR_INPUT" ||
    st === "PENDING_VALIDATION" ||
    st === "DRAFT" ||
    st === "LOADING_ACTUALS" ||
    st === "LOADING_BASELINE"
  ) {
    // Coordinator path when owners are done (or validation in progress)
    if (
      opts.canAssignTasks &&
      (allOwnersDone || st === "PENDING_VALIDATION" || opts.validationPassed === true)
    ) {
      if (opts.validationPassed === true) {
        return {
          title: "Send to FP&A",
          body: "Validation passed. Submit the cycle for FP&A review.",
          primaryKind: "submit_fpa",
        }
      }
      return {
        title: "Check completeness",
        body: "Owners have submitted. Validate the cycle, then send it to FP&A.",
        primaryKind: "validate",
      }
    }

    if (opts.canSubmitTask && opts.myTaskStatus && myDone) {
      return {
        title: "You're done for now",
        body: opts.canAssignTasks
          ? "Your task is submitted. When other owners finish, validate and send to FP&A."
          : "Your budget is submitted. Waiting on other owners or FP&A review.",
        primaryKind: opts.canAssignTasks && !allOwnersDone ? "none" : "none",
      }
    }

    if (opts.canSubmitTask && !myDone) {
      return {
        title: "Enter your budget",
        body: "Open the worksheet, enter your numbers, then submit when finished.",
        primaryKind: opts.canEditGrid ? "worksheet" : "submit_task",
      }
    }

    if (opts.canAssignTasks) {
      return {
        title: "Waiting on owners",
        body: "Owners are still entering budgets. You can prep actuals/baseline if needed.",
        primaryKind: "none",
      }
    }

    if (opts.canEditGrid) {
      return {
        title: "Enter budget numbers",
        body: "Open the worksheet to work on this plan.",
        primaryKind: "worksheet",
      }
    }
  }

  return {
    title: "Budget cycle",
    body: "Select an action below when it becomes available for your role.",
    primaryKind: "none",
  }
}

export function isOwnerTaskSubmitted(status?: string | null): boolean {
  return isTaskDone(status)
}
