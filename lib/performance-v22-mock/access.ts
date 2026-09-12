/**
 * Performance V22 — real access control, replacing the demo role toggle.
 *
 * WHY THIS EXISTS
 * ---------------
 * The vendored runtime shipped a client-side "demo role" dropdown (`#roleSelect`, labelled
 * `aria-label="Demo role"`) whose five fictional roles — SysAdmin / Executive /
 * HR-M&E Manager / Department Manager / Employee — matched no real role held by any real
 * user. Its own copy said "your current demo role". It existed only because nothing resolved
 * permissions from the signed-in user.
 *
 * This module does that resolution. The signed-in user's real `roleCode` and
 * `departmentRole` decide the permission set and the data scope; the toggle is removed.
 *
 * HOW THE MAPPING WORKS
 * ---------------------
 * Rather than enumerate all 36 `RoleCode`s, the tier is derived from two facts that already
 * exist for every role:
 *
 *   1. `getModuleAccessLevel(roleCode, 'performance-management')` -> full | write | read | none
 *      This is the per-role grant already deliberated in ROLE_PERMISSIONS_MAP.
 *   2. `departmentRole === 'HEAD'` -> the user leads their department.
 *
 * Those map onto the scopes the runtime's own `MatanhoDynamicRBAC` v24.5 registry declares
 * (organization / department / self), so the tiers are the module's own model, not invented:
 *
 *   SYSADMIN / admin roleCode            -> admin        (all permissions, organisation)
 *   full  + org-wide role                -> executive    (organisation)
 *   full  + HR role                      -> hr           (organisation, people)
 *   write, or full + departmentRole HEAD -> manager       (department)
 *   read                                 -> individual    (self)
 *   none                                 -> no access
 *
 * The permission strings are the runtime's own vocabulary (`view_kpi`, `manage_team_tasks`,
 * …) so `allowed()` and `canPage()` keep working unchanged — only their input becomes real.
 */
import { getModuleAccessLevel, type RoleCode } from "@/lib/config/role-permissions"

export type PerfTier = "admin" | "executive" | "hr" | "manager" | "individual" | "none"
export type PerfScopeLevel = "organization" | "department" | "self" | "none"

export interface PerfAccess {
  /** Display label shown where the demo toggle used to be. The user's real role name. */
  label: string
  tier: PerfTier
  scope: PerfScopeLevel
  /** Runtime permission vocabulary; `['*']` for admin. */
  permissions: string[]
  /** Department the user belongs to, for department-scoped filtering. */
  department: string | null
  /** True when the user leads that department. */
  isDepartmentHead: boolean
  userId: string | null
}

/** Runtime permission vocabulary, copied from the sets the runtime already defines. */
const PERMISSIONS: Record<Exclude<PerfTier, "none">, string[]> = {
  admin: ["*"],
  executive: [
    "view_org", "view_strategy", "edit_strategy", "view_kpi", "approve_kpi", "view_financial",
    "view_tasks", "view_reviews", "initiate_reviews", "sign_reviews", "view_corrective",
    "approve_corrective", "view_reports", "generate_reports", "publish_reports",
    "view_compliance", "generate_compliance", "view_vault", "edit_strategy_docs",
    "edit_report_docs", "publish_docs", "view_alerts", "view_audit",
  ],
  hr: [
    "view_org", "view_strategy", "view_kpi", "view_tasks", "view_reviews", "initiate_reviews",
    "manage_reviews", "view_corrective", "create_corrective", "view_reports",
    "generate_reports", "view_compliance", "generate_compliance", "view_vault", "edit_hr_docs",
    "edit_report_docs", "view_alerts", "view_audit", "manage_roles_limited",
  ],
  manager: [
    "view_team", "view_strategy", "view_kpi", "manage_team_kpi", "view_tasks",
    "manage_team_tasks", "view_reviews", "manager_reviews", "view_corrective",
    "create_corrective", "view_reports", "view_vault", "edit_team_docs", "view_alerts",
  ],
  individual: [
    "view_self", "view_strategy", "view_kpi", "view_tasks", "update_own_tasks", "view_reviews",
    "self_reviews", "peer_reviews", "view_reports", "view_vault", "edit_own_docs", "view_alerts",
  ],
}

const SCOPE: Record<PerfTier, PerfScopeLevel> = {
  admin: "organization",
  executive: "organization",
  hr: "organization",
  manager: "department",
  individual: "self",
  none: "none",
}

/** roleCodes that carry organisation-wide performance authority regardless of grant level. */
const EXECUTIVE_ROLES = new Set(["CEO", "CIO", "CFO", "BOARD_CHAIR"])
const HR_ROLES = new Set(["HR_MGR", "HR_OFF", "HR_COORD"])
const ADMIN_ROLES = new Set(["SYSADMIN", "IT_MGR"])

export interface PerfUserLike {
  roleCode?: string | null
  role?: { name?: string | null } | string | null
  departmentRole?: string | null
  userDepartment?: string | null
  id?: string | null
  firstName?: string | null
  lastName?: string | null
}

function roleLabel(user: PerfUserLike): string {
  const r = user.role
  if (r && typeof r === "object" && typeof r.name === "string" && r.name.trim()) return r.name.trim()
  if (typeof r === "string" && r.trim()) return r.trim()
  return String(user.roleCode || "Unknown role")
}

/**
 * Resolve the signed-in user's real performance access.
 *
 * Returns tier `none` when the role holds no `performance-management` grant — the module
 * should not render for them at all, which middleware already enforces at the route.
 */
export function resolvePerfAccess(user: PerfUserLike | null | undefined): PerfAccess {
  const label = user ? roleLabel(user) : "Signed out"
  const roleCode = String(user?.roleCode || "") as RoleCode
  const departmentRole = String(user?.departmentRole || "").toUpperCase()
  const isDepartmentHead = departmentRole === "HEAD"
  const department = user?.userDepartment ? String(user.userDepartment) : null
  const userId = user?.id ? String(user.id) : null

  if (!user || !roleCode) {
    return { label, tier: "none", scope: "none", permissions: [], department, isDepartmentHead, userId }
  }

  // `admin` is a real roleCode on this system (admin@nts.com) alongside SYSADMIN.
  if (ADMIN_ROLES.has(roleCode) || roleCode.toLowerCase() === "admin") {
    return { label, tier: "admin", scope: SCOPE.admin, permissions: PERMISSIONS.admin, department, isDepartmentHead, userId }
  }

  let level: ReturnType<typeof getModuleAccessLevel> = "none"
  try {
    level = getModuleAccessLevel(roleCode, "performance-management")
  } catch {
    level = "none"
  }

  if (level === "none") {
    return { label, tier: "none", scope: "none", permissions: [], department, isDepartmentHead, userId }
  }

  let tier: PerfTier
  if (HR_ROLES.has(roleCode)) tier = "hr"
  else if (EXECUTIVE_ROLES.has(roleCode)) tier = "executive"
  else if (level === "full" && !isDepartmentHead) tier = "executive"
  else if (level === "full" || level === "write") tier = "manager"
  else tier = "individual"

  return {
    label,
    tier,
    scope: SCOPE[tier],
    permissions: PERMISSIONS[tier as Exclude<PerfTier, "none">],
    department,
    isDepartmentHead,
    userId,
  }
}

/**
 * Scope a collection to what this user may see.
 *
 * `organization` sees everything; `department` sees rows whose department matches theirs;
 * `self` sees rows they own. Rows with no department/owner are visible to organisation-level
 * users only — an unattributed row is not "mine", and showing it to everyone would leak.
 *
 * This is display scoping. It is NOT a substitute for server-side filtering, which does not
 * exist yet on these endpoints (see design-refs/performance-role-matrix.md §4).
 */
export function scopeRows<T>(
  rows: T[],
  access: PerfAccess,
  get: (row: T) => { department?: string | null; ownerId?: string | null; owner?: string | null },
): T[] {
  if (access.scope === "organization") return rows
  if (access.scope === "none") return []
  return rows.filter((row) => {
    const meta = get(row)
    if (access.scope === "department") {
      return !!access.department && meta.department === access.department
    }
    // self
    if (access.userId && meta.ownerId) return meta.ownerId === access.userId
    if (meta.owner && access.label) return false // name match is not identity; do not guess
    return false
  })
}
