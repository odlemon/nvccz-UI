import type { UserDetails } from "@/lib/api/auth-api"
import type { User } from "@/lib/store/slices/authSlice"

/** Shape expected by Matanho home-v3 runtime (`D.user`). */
export type Hv3SessionUser = {
  name: string
  firstName: string
  role: string
  location: string
  email: string
  initials: string
  image?: string
}

export function initialsFromNames(firstName?: string, lastName?: string): string {
  const f = (firstName || "").trim().charAt(0)
  const l = (lastName || "").trim().charAt(0)
  const out = `${f}${l}`.toUpperCase()
  return out || "U"
}

export function buildHv3SessionUser(
  user: Pick<User, "firstName" | "lastName" | "email" | "role"> | null,
  userDetails: UserDetails | null
): Hv3SessionUser | null {
  if (!user && !userDetails) return null

  const firstName = userDetails?.firstName || user?.firstName || ""
  const lastName = userDetails?.lastName || user?.lastName || ""
  const email = userDetails?.email || user?.email || ""
  const name =
    [firstName, lastName].filter(Boolean).join(" ") || email.split("@")[0] || "User"

  const role =
    userDetails?.role?.name ||
    userDetails?.departmentRole ||
    user?.role ||
    "Team member"

  const location = userDetails?.userDepartment || ""

  return {
    name,
    firstName: firstName || name.split(" ")[0] || "User",
    role,
    location,
    email,
    initials: initialsFromNames(firstName, lastName),
  }
}

export function mergeHv3DataWithSession<T extends { user: Hv3SessionUser }>(
  base: T,
  sessionUser: Hv3SessionUser | null
): T {
  if (!sessionUser) return base
  return {
    ...base,
    user: {
      ...base.user,
      ...sessionUser,
      image: sessionUser.image || base.user.image,
    },
  }
}
