import { apiClient, type ApiResponse } from '@/lib/api/api-client'

export interface AppRole {
  id: string
  name: string
  description?: string | null
  /** Generic, actively-enforced permission taxonomy — do not overwrite blindly. */
  permissions: unknown
  /** Portfolio module's own page-level read/write matrix (Settings > Roles & Access). */
  portfolioSettingsPermissions?: Record<string, { read?: boolean; write?: boolean }> | null
  createdAt: string
  updatedAt: string
  _count?: { users: number }
}

export const rolesApi = {
  getAll: async (): Promise<ApiResponse<AppRole[]>> => {
    return apiClient.get<ApiResponse<AppRole[]>>('/roles')
  },
  /**
   * Updates ONLY the Portfolio-owned permissions column. Never sends `permissions`,
   * `name` or `description` — the backend replaces `permissions` wholesale rather
   * than merging, and that field is used for real platform authorization elsewhere.
   */
  updatePortfolioSettingsPermissions: async (
    roleId: string,
    portfolioSettingsPermissions: Record<string, { read?: boolean; write?: boolean }>,
  ): Promise<ApiResponse<AppRole>> => {
    return apiClient.put<ApiResponse<AppRole>>(`/roles/${roleId}`, { portfolioSettingsPermissions })
  },
}
