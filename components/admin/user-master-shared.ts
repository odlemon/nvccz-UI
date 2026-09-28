import type { UserStatus } from "@/lib/api/admin-api"

/** Display helpers shared by the /users table, form and drawer (SRD "User Master"). */

export const STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
  LOCKED: "Locked",
  DEACTIVATED: "Deactivated",
}

export const STATUS_BADGE_CLASS: Record<UserStatus, string> = {
  ACTIVE: "bg-green-50 text-green-700 border-green-200",
  SUSPENDED: "bg-amber-50 text-amber-700 border-amber-200",
  LOCKED: "bg-red-50 text-red-700 border-red-200",
  DEACTIVATED: "bg-gray-100 text-gray-600 border-gray-300",
}

export function statusLabel(status?: string | null): string {
  const key = String(status || "ACTIVE").toUpperCase() as UserStatus
  return STATUS_LABELS[key] || key
}

/** "PROCUREMENT_MANAGER" -> "Procurement manager" */
export function humanize(code?: string | null): string {
  if (!code) return ""
  const s = String(code).replace(/_/g, " ").toLowerCase()
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function formatMoney(n?: number | null): string {
  if (n == null) return ""
  return Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function formatDate(iso?: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

/** yyyy-mm-dd for an <input type="date">. */
export function toDateInput(iso?: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10)
}
