import { getRolePermissions, type RoleCode } from "@/lib/config/role-permissions"

const ROLE_ALIASES: Record<string, RoleCode> = {
  ADMIN: "CEO",
  ADMINISTRATOR: "CEO",
  "CHIEF EXECUTIVE OFFICER": "CEO",
  "CHIEF FINANCIAL OFFICER": "CFO",
  "FINANCE MANAGER": "FIN_MGR",
  "OPERATIONS MANAGER": "OPS_MGR",
}

/** Best-effort map from login cookie / display role strings to RoleCode. */
export function resolveRoleCode(input: string | null | undefined): RoleCode | null {
  if (!input?.trim()) return null

  const trimmed = input.trim()
  const upper = trimmed.toUpperCase()
  const underscored = upper.replace(/[\s-]+/g, "_")

  const candidates = [trimmed, upper, underscored]
  for (const candidate of candidates) {
    if (getRolePermissions(candidate as RoleCode)) {
      return candidate as RoleCode
    }
  }

  const alias = ROLE_ALIASES[upper] ?? ROLE_ALIASES[underscored.replace(/_/g, " ")]
  return alias ?? null
}
