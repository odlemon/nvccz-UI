/**
 * FP&A (forecasting) action permissions — SRD “Users and Permissions”.
 *
 * Role mapping (product → RoleCode):
 * - CFO / Finance Director → CFO (+ CEO / admin override)
 * - FP&A Manager → FIN_MGR
 * - Financial Analyst → FIN_OFF, ACCOUNTANT, INV_ANALYST
 * - Department Head / Budget Owner → OPS_MGR, HR_MGR, SALES_MGR, MKT_MGR, FIN_ASST
 * - Executive / Board Viewer → BOARD_CHAIR, BOARD_MEMBER, LIMITED_PARTNER
 * - System Administrator → SYSADMIN (config); literal `admin` role bypasses all checks
 */

export const FPA_ACTIONS = {
  VIEW_HOME: 'fpa-view-home',
  VIEW_ALL_ENTITIES: 'fpa-view-all-entities',
  VIEW_APPROVED_ONLY: 'fpa-view-approved-only',

  CREATE_MODEL: 'fpa-create-model',
  EDIT_MODEL: 'fpa-edit-model',
  CONFIGURE_BUILDER: 'fpa-configure-builder',

  EDIT_GRID: 'fpa-edit-grid',
  EDIT_OWN_DEPARTMENT: 'fpa-edit-own-department',

  CONFIGURE_DRIVERS: 'fpa-configure-drivers',
  CREATE_SCENARIO: 'fpa-create-scenario',
  COMPARE_SCENARIOS: 'fpa-compare-scenarios',

  ASSIGN_TASKS: 'fpa-assign-tasks',
  SUBMIT_TASK: 'fpa-submit-task',
  REVIEW_SUBMISSIONS: 'fpa-review-submissions',
  APPROVE_BUDGET: 'fpa-approve-budget',
  RETURN_TASK: 'fpa-return-task',
  LOCK_VERSION: 'fpa-lock-version',

  ADD_COMMENTARY: 'fpa-add-commentary',
  INVESTIGATE_VARIANCE: 'fpa-investigate-variance',
  PREPARE_REPORTS: 'fpa-prepare-reports',
  EXPORT_BOARD_PACK: 'fpa-export-board-pack',

  MANAGE_SETTINGS: 'fpa-manage-settings',
} as const

export type FpaAction = (typeof FPA_ACTIONS)[keyof typeof FPA_ACTIONS]

export const FPA_SUBMODULES_FULL = {
  'fpa-home': 'full',
  'fpa-models': 'full',
  'fpa-model-builder': 'full',
  'fpa-worksheet': 'full',
  'fpa-budget': 'full',
  'fpa-rolling': 'full',
  'fpa-scenarios': 'full',
  'fpa-drivers': 'full',
  'fpa-workforce': 'full',
  'fpa-revenue': 'full',
  'fpa-expenses': 'full',
  'fpa-cashflow': 'full',
  'fpa-variance': 'full',
  'fpa-reports': 'full',
  'fpa-workflow': 'full',
  'fpa-settings': 'full',
} as const

export const FPA_SUBMODULES_MANAGER = {
  'fpa-home': 'full',
  'fpa-models': 'full',
  'fpa-model-builder': 'full',
  'fpa-worksheet': 'write',
  'fpa-budget': 'write',
  'fpa-rolling': 'write',
  'fpa-scenarios': 'full',
  'fpa-drivers': 'full',
  'fpa-workforce': 'write',
  'fpa-revenue': 'write',
  'fpa-expenses': 'write',
  'fpa-cashflow': 'write',
  'fpa-variance': 'write',
  'fpa-reports': 'write',
  'fpa-workflow': 'full',
  'fpa-settings': 'write',
} as const

export const FPA_SUBMODULES_ANALYST = {
  'fpa-home': 'full',
  'fpa-models': 'write',
  'fpa-model-builder': 'write',
  'fpa-worksheet': 'write',
  'fpa-budget': 'write',
  'fpa-rolling': 'write',
  'fpa-scenarios': 'write',
  'fpa-drivers': 'write',
  'fpa-workforce': 'write',
  'fpa-revenue': 'write',
  'fpa-expenses': 'write',
  'fpa-cashflow': 'write',
  'fpa-variance': 'write',
  'fpa-reports': 'write',
  'fpa-workflow': 'write',
  'fpa-settings': 'none',
} as const

export const FPA_SUBMODULES_DEPT_OWNER = {
  'fpa-home': 'read',
  'fpa-models': 'read',
  'fpa-model-builder': 'none',
  'fpa-worksheet': 'write',
  'fpa-budget': 'write',
  'fpa-rolling': 'read',
  'fpa-scenarios': 'read',
  'fpa-drivers': 'read',
  'fpa-workforce': 'write',
  'fpa-revenue': 'write',
  'fpa-expenses': 'write',
  'fpa-cashflow': 'read',
  'fpa-variance': 'write',
  'fpa-reports': 'read',
  'fpa-workflow': 'write',
  'fpa-settings': 'none',
} as const

export const FPA_SUBMODULES_VIEWER = {
  'fpa-home': 'read',
  'fpa-models': 'read',
  'fpa-model-builder': 'none',
  'fpa-worksheet': 'read',
  'fpa-budget': 'read',
  'fpa-rolling': 'read',
  'fpa-scenarios': 'read',
  'fpa-drivers': 'read',
  'fpa-workforce': 'read',
  'fpa-revenue': 'read',
  'fpa-expenses': 'read',
  'fpa-cashflow': 'read',
  'fpa-variance': 'read',
  'fpa-reports': 'read',
  'fpa-workflow': 'read',
  'fpa-settings': 'none',
} as const

const ALL = Object.values(FPA_ACTIONS)

const CFO_ACTIONS = ALL.filter((a) => a !== FPA_ACTIONS.VIEW_APPROVED_ONLY)

const MANAGER_ACTIONS = [
  FPA_ACTIONS.VIEW_HOME,
  FPA_ACTIONS.VIEW_ALL_ENTITIES,
  FPA_ACTIONS.CREATE_MODEL,
  FPA_ACTIONS.EDIT_MODEL,
  FPA_ACTIONS.CONFIGURE_BUILDER,
  FPA_ACTIONS.EDIT_GRID,
  FPA_ACTIONS.CONFIGURE_DRIVERS,
  FPA_ACTIONS.CREATE_SCENARIO,
  FPA_ACTIONS.COMPARE_SCENARIOS,
  FPA_ACTIONS.ASSIGN_TASKS,
  FPA_ACTIONS.SUBMIT_TASK,
  FPA_ACTIONS.REVIEW_SUBMISSIONS,
  FPA_ACTIONS.RETURN_TASK,
  FPA_ACTIONS.ADD_COMMENTARY,
  FPA_ACTIONS.INVESTIGATE_VARIANCE,
  FPA_ACTIONS.PREPARE_REPORTS,
  FPA_ACTIONS.EXPORT_BOARD_PACK,
  FPA_ACTIONS.MANAGE_SETTINGS,
] as const

const ANALYST_ACTIONS = [
  FPA_ACTIONS.VIEW_HOME,
  FPA_ACTIONS.EDIT_GRID,
  FPA_ACTIONS.EDIT_OWN_DEPARTMENT,
  FPA_ACTIONS.CONFIGURE_DRIVERS,
  FPA_ACTIONS.COMPARE_SCENARIOS,
  FPA_ACTIONS.SUBMIT_TASK,
  FPA_ACTIONS.ADD_COMMENTARY,
  FPA_ACTIONS.INVESTIGATE_VARIANCE,
  FPA_ACTIONS.PREPARE_REPORTS,
  FPA_ACTIONS.CREATE_SCENARIO,
] as const

const DEPT_OWNER_ACTIONS = [
  FPA_ACTIONS.VIEW_HOME,
  FPA_ACTIONS.EDIT_OWN_DEPARTMENT,
  FPA_ACTIONS.EDIT_GRID,
  FPA_ACTIONS.SUBMIT_TASK,
  FPA_ACTIONS.ADD_COMMENTARY,
  FPA_ACTIONS.INVESTIGATE_VARIANCE,
] as const

const VIEWER_ACTIONS = [
  FPA_ACTIONS.VIEW_HOME,
  FPA_ACTIONS.VIEW_APPROVED_ONLY,
  FPA_ACTIONS.COMPARE_SCENARIOS,
  FPA_ACTIONS.PREPARE_REPORTS,
] as const

const SYSADMIN_ACTIONS = [
  ...ALL.filter((a) => a !== FPA_ACTIONS.VIEW_APPROVED_ONLY),
] as const

export const FPA_ROLE_PERMISSIONS: Record<
  string,
  {
    access: 'full' | 'read' | 'write' | 'none'
    subModules: Record<string, 'full' | 'read' | 'write' | 'none'>
    actions: readonly string[]
  }
> = {
  // Admin / C-level — full finance override (admin role also hard-bypasses in hooks)
  CEO: { access: 'full', subModules: { ...FPA_SUBMODULES_FULL }, actions: CFO_ACTIONS },
  CFO: { access: 'full', subModules: { ...FPA_SUBMODULES_FULL }, actions: CFO_ACTIONS },

  // FP&A Manager
  FIN_MGR: { access: 'write', subModules: { ...FPA_SUBMODULES_MANAGER }, actions: MANAGER_ACTIONS },

  // Financial Analyst
  FIN_OFF: { access: 'write', subModules: { ...FPA_SUBMODULES_ANALYST }, actions: ANALYST_ACTIONS },
  ACCOUNTANT: { access: 'write', subModules: { ...FPA_SUBMODULES_ANALYST }, actions: ANALYST_ACTIONS },
  INV_ANALYST: { access: 'write', subModules: { ...FPA_SUBMODULES_ANALYST }, actions: ANALYST_ACTIONS },

  // Department Head / Budget Owner (+ junior finance input)
  FIN_ASST: { access: 'write', subModules: { ...FPA_SUBMODULES_DEPT_OWNER }, actions: DEPT_OWNER_ACTIONS },
  OPS_MGR: { access: 'write', subModules: { ...FPA_SUBMODULES_DEPT_OWNER }, actions: DEPT_OWNER_ACTIONS },
  HR_MGR: { access: 'write', subModules: { ...FPA_SUBMODULES_DEPT_OWNER }, actions: DEPT_OWNER_ACTIONS },
  SALES_MGR: { access: 'write', subModules: { ...FPA_SUBMODULES_DEPT_OWNER }, actions: DEPT_OWNER_ACTIONS },
  MKT_MGR: { access: 'write', subModules: { ...FPA_SUBMODULES_DEPT_OWNER }, actions: DEPT_OWNER_ACTIONS },

  // Executive / Board Viewer
  BOARD_CHAIR: { access: 'read', subModules: { ...FPA_SUBMODULES_VIEWER }, actions: VIEWER_ACTIONS },
  BOARD_MEMBER: { access: 'read', subModules: { ...FPA_SUBMODULES_VIEWER }, actions: VIEWER_ACTIONS },
  LIMITED_PARTNER: { access: 'read', subModules: { ...FPA_SUBMODULES_VIEWER }, actions: VIEWER_ACTIONS },

  // System Administrator — full access in this product (admin also bypasses)
  SYSADMIN: { access: 'full', subModules: { ...FPA_SUBMODULES_FULL }, actions: SYSADMIN_ACTIONS },
  IT_MGR: {
    access: 'read',
    subModules: { ...FPA_SUBMODULES_VIEWER, 'fpa-settings': 'full' },
    actions: [FPA_ACTIONS.VIEW_HOME, FPA_ACTIONS.MANAGE_SETTINGS],
  },
}

export function canPerformFpaAction(roleCode: string | null | undefined, action: string): boolean {
  if (!roleCode) return false
  if (roleCode.toLowerCase() === 'admin') return true
  const pack = FPA_ROLE_PERMISSIONS[roleCode]
  if (!pack) return false
  return (pack.actions as readonly string[]).includes(action)
}

export function getFpaModuleAccess(roleCode: string | null | undefined): 'full' | 'read' | 'write' | 'none' {
  if (!roleCode) return 'none'
  if (roleCode.toLowerCase() === 'admin') return 'full'
  return FPA_ROLE_PERMISSIONS[roleCode]?.access ?? 'none'
}

export function getFpaSubModuleAccess(
  roleCode: string | null | undefined,
  subModuleId: string,
): 'full' | 'read' | 'write' | 'none' {
  if (!roleCode) return 'none'
  if (roleCode.toLowerCase() === 'admin') return 'full'
  const pack = FPA_ROLE_PERMISSIONS[roleCode]
  if (!pack) return 'none'
  return pack.subModules[subModuleId] ?? 'none'
}

/** ModulePermission fragment for role-permissions.ts */
export function fpaModulePermission(roleCode: string) {
  const pack = FPA_ROLE_PERMISSIONS[roleCode]
  if (!pack) return null
  return {
    moduleId: 'forecasting' as const,
    access: pack.access,
    subModules: { ...pack.subModules },
    actions: [...pack.actions],
  }
}
