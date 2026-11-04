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

export interface RbacCatalogueItem {
  module: string
  resource: string
  label: string
  actions: Array<'view' | 'create' | 'edit' | 'approve' | 'export' | 'manage' | 'delete'>
}

export interface RbacRole extends Pick<AppRole, 'id' | 'name' | 'description'> {
  users: number
  permissions: string[]
  modules: string[]
  protected: boolean
}

export interface PortfolioEffectiveAccess {
  source: 'legacy' | 'configured' | 'protected-admin'
  subjectId: string | null
  policyVersion: number | null
  assignmentRevision: number | null
  permissions: Record<string, boolean>
  canManagePolicies: boolean
}

export interface PortfolioPolicyRole {
  id: string
  name: string
  description?: string | null
  status: string
  revision: number
  globalRoleId?: string | null
  globalRole?: { id: string; name: string; description?: string | null } | null
  activeVersion?: { id: string; version: number; permissions: Record<string, boolean> } | null
  draftVersion?: { id: string; version: number; permissions: Record<string, boolean> } | null
  legacyPermissions?: string[]
  members?: Array<{ id: string; firstName: string; lastName: string; email: string; departmentRole?: string | null; updatedAt?: string }>
  memberCount?: number
  _count?: { assignments: number }
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
  getRbacEffective: async (): Promise<ApiResponse<{ permissions: string[]; modules: string[]; isAdministrator: boolean }>> => {
    return apiClient.get('/roles/rbac/effective')
  },
  getRbacCatalogue: async (): Promise<ApiResponse<{ modules: RbacCatalogueItem[]; aliases: Record<string, string> }>> => {
    return apiClient.get('/roles/rbac/catalog')
  },
  getRbacMatrix: async (): Promise<ApiResponse<{ catalogue: RbacCatalogueItem[]; roles: RbacRole[] }>> => {
    return apiClient.get('/roles/rbac/matrix')
  },
  createRbacRole: async (input: { name: string; description?: string; cloneFromId?: string }): Promise<ApiResponse<RbacRole>> => {
    return apiClient.post('/roles/rbac/roles', input)
  },
  replaceRbacGrants: async (roleId: string, permissions: string[]): Promise<ApiResponse<{ id: string; permissions: string[] }>> => {
    return apiClient.put(`/roles/${roleId}/rbac-grants`, { permissions })
  },
  assignRbacRole: async (userId: string, roleId: string): Promise<ApiResponse<{ userId: string; roleId: string; role: string }>> => {
    return apiClient.post('/roles/rbac/assign', { userId, roleId })
  },
  deleteRbacRole: async (roleId: string): Promise<ApiResponse<{ id: string; name: string }>> => {
    return apiClient.delete(`/roles/rbac/roles/${roleId}`)
  },
  getPortfolioEffective: async (): Promise<ApiResponse<PortfolioEffectiveAccess>> => apiClient.get('/roles/rbac/portfolio/effective'),
  getPortfolioCatalogue: async (): Promise<ApiResponse<{ version: string; actions: string[]; resources: Array<{ key: string; label: string; permissions: string[] }> }>> => apiClient.get('/roles/rbac/portfolio/catalog'),
  getPortfolioRoles: async (): Promise<ApiResponse<PortfolioPolicyRole[]>> => apiClient.get('/roles/rbac/portfolio/roles'),
  getPortfolioHistory: async (subjectId?: string): Promise<ApiResponse<any[]>> => apiClient.get(`/roles/rbac/portfolio/history${subjectId ? `?subjectId=${encodeURIComponent(subjectId)}` : ''}`),
  createPortfolioRole: async (input: { name: string; description?: string; globalRoleId?: string; permissions?: Record<string, boolean> }): Promise<ApiResponse<PortfolioPolicyRole>> => apiClient.post('/roles/rbac/portfolio/roles', input),
  savePortfolioDraft: async (roleId: string, permissions: Record<string, boolean>, expectedRevision: number): Promise<ApiResponse<any>> => apiClient.put(`/roles/rbac/portfolio/roles/${roleId}/draft`, { permissions, expectedRevision }),
  activatePortfolioRole: async (roleId: string, expectedRevision: number): Promise<ApiResponse<any>> => apiClient.post(`/roles/rbac/portfolio/roles/${roleId}/activate`, { expectedRevision }),
  disablePortfolioRole: async (roleId: string, expectedRevision: number): Promise<ApiResponse<any>> => apiClient.post(`/roles/rbac/portfolio/roles/${roleId}/disable`, { expectedRevision }),
  restorePortfolioRole: async (roleId: string, expectedRevision: number): Promise<ApiResponse<any>> => apiClient.post(`/roles/rbac/portfolio/roles/${roleId}/restore`, { expectedRevision }),
  previewPortfolioRole: async (roleId: string): Promise<ApiResponse<{ changed: Array<{ key: string; from: boolean; to: boolean }>; affectedAssignments: number; activeVersion: number | null; draftVersion: number | null; status: string }>> => apiClient.post(`/roles/rbac/portfolio/roles/${roleId}/preview`, {}),
  assignPortfolioRole: async (userId: string, subjectId: string): Promise<ApiResponse<any>> => apiClient.put(`/roles/rbac/portfolio/assignments/${userId}`, { subjectId }),
  removePortfolioRole: async (userId: string): Promise<ApiResponse<any>> => apiClient.delete(`/roles/rbac/portfolio/assignments/${userId}`),
  deletePortfolioRole: async (roleId: string): Promise<ApiResponse<any>> => apiClient.delete(`/roles/rbac/portfolio/roles/${roleId}`),
}
