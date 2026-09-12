/**
 * System audit log — backend contract: GET /api/audit-logs
 * (nvccz/src/routes/auditRoutes.ts -> AuditLogController.list, model `AuditLog`).
 *
 * Query params: page (default 1), limit (default 50, capped server-side at 100),
 * entityType, entityId, adminId, action — all optional.
 *
 * This is the platform-wide audit table (logins, record creation/update, exports),
 * not an accounting-specific one: the accounting module's "Immutable Audit Trail"
 * page and the Settings > Audit trail tab both render from it. `oldValues`/`newValues`
 * carry the before/after evidence the page's detail column claims to show.
 */
import { apiClient } from './api-client'

export interface AuditLogRow {
  id: string
  adminId: string | null
  targetId: string | null
  action: string
  entityType: string | null
  entityId: string | null
  timestamp: string
  ipAddress: string | null
  userAgent: string | null
  admin: { id: string; email: string; firstName: string; lastName: string } | null
  oldValues: unknown | null
  newValues: unknown | null
}

interface ApiRes<T> {
  success: boolean
  data: T
  message?: string
}

export async function getAuditLogs(limit = 100): Promise<ApiRes<{ items: AuditLogRow[] }>> {
  return apiClient.get<ApiRes<{ items: AuditLogRow[] }>>(`/audit-logs?page=1&limit=${limit}`)
}
