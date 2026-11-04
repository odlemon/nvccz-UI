import { getRolePermissions, type RoleCode } from "@/lib/config/role-permissions"
import { resolveRoleCode } from "@/lib/utils/resolve-role-code"

const PORTFOLIO_RESOURCES = [
  "dashboard", "deals", "funds", "capital_calls", "distributions", "companies",
  "cash_accounts", "cash_overview", "cash_ledger", "reservations", "statement_imports",
  "reconciliations", "exceptions", "period_close", "e_signatures", "documents_vault",
  "reports_vault", "reporting_schedules", "fund_performance", "lp_management", "mailer_lists", "settings",
] as const

/** Translate the previous hard-coded module role into the resource grants used by the Portfolio shell. */
export function legacyPortfolioGrants(roleCode: string | null | undefined): Record<string, boolean> {
  if (!roleCode) return {}
  const identity = String(roleCode).trim().toUpperCase().replace(/[\s-]+/g, "_")
  const resolved = resolveRoleCode(roleCode) ?? roleCode as RoleCode
  const role = getRolePermissions(resolved)
  const module = role?.modules.find((entry) => entry.moduleId === "portfolio-management" || entry.moduleId === "portfolio-v11")
  const protectedAdmin = ["CEO", "ADMIN", "ADMINISTRATOR", "SYSADMIN", "SYSTEM_ADMIN", "SYSTEM_ADMINISTRATOR"].includes(identity)
  const actions = protectedAdmin || module?.access === "full"
    ? ["view", "create", "edit", "approve", "export", "manage", "delete"]
    : module?.access === "write"
      ? ["view", "create", "edit"]
      : module?.access === "read"
        ? ["view"]
        : []

  return Object.fromEntries(PORTFOLIO_RESOURCES.flatMap((resource) =>
    actions.map((action) => [`portfolio.${resource}.${action}`, true]),
  ))
}
