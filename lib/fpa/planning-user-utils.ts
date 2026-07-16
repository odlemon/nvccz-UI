import type { AppUser } from "@/lib/api/users-api"

export function planningUserLabel(u: AppUser) {
  return [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email || u.id
}

export function planningUserDeptId(u: AppUser): string | null {
  if (u.departmentId) return String(u.departmentId)
  if (u.department && typeof u.department === "object" && u.department.id) {
    return String(u.department.id)
  }
  return null
}

/** Match user to a dept by id, or by name when API only has a department string. */
export function planningUserMatchesDept(
  u: AppUser,
  dept: { id: string; name: string } | undefined,
): boolean {
  if (!dept) return false
  const id = planningUserDeptId(u)
  if (id && id === dept.id) return true
  const nameHint =
    (typeof u.department === "string" && u.department) ||
    (u.department && typeof u.department === "object" && u.department.name) ||
    (u as AppUser & { userDepartment?: string }).userDepartment ||
    null
  if (nameHint && String(nameHint).toLowerCase() === dept.name.toLowerCase()) return true
  return false
}
