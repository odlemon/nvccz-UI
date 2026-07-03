import { apiClient } from './api-client'

interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data: T
  timestamp?: string
}

// PLACEHOLDER — GET/POST/PATCH memberships were all empty or unsampled; shape inferred.
export type LpRole = 'VIEWER' | 'MANAGER'
export type MembershipStatus = string

export interface LpPortalMembership {
  membershipId: string
  clientId: string
  clientLegalName: string | null
  userId: string
  userEmail: string | null
  lpRole: LpRole | null
  fundIds: string[]
  status: MembershipStatus | null
  createdAt: string
}

export interface CreateLpMembershipRequest {
  clientId: string
  userId: string
  lpRole?: LpRole
  fundIds: string[]
}

export type VaultDocumentCategory =
  | 'TAX'
  | 'AUDIT'
  | 'PERFORMANCE_REPORT'
  | 'CALL_NOTICE'
  | 'MANUAL'
  | 'QUARTERLY_STATEMENT'

export interface PublishDocumentRequest {
  file: File
  clientId: string
  category: VaultDocumentCategory
  title: string
  fundId?: string
}

export interface MfaPolicy {
  id: 'default'
  requireMfaForLp: boolean
  issuerName: string
  createdAt: string
  updatedAt: string
}

class LpPortalAdminApiService {
  private readonly BASE = '/lp-portal/admin'

  getMemberships(): Promise<ApiResponse<LpPortalMembership[]>> {
    return apiClient.get(`${this.BASE}/memberships`)
  }

  inviteMembership(data: CreateLpMembershipRequest): Promise<ApiResponse<LpPortalMembership>> {
    return apiClient.post(`${this.BASE}/memberships`, data)
  }

  revokeMembership(membershipId: string): Promise<ApiResponse<LpPortalMembership>> {
    return apiClient.patch(`${this.BASE}/memberships/${membershipId}/revoke`)
  }

  publishDocument(data: PublishDocumentRequest): Promise<ApiResponse<any>> {
    const fd = new FormData()
    fd.append('file', data.file)
    fd.append('clientId', data.clientId)
    fd.append('category', data.category)
    fd.append('title', data.title)
    if (data.fundId) fd.append('fundId', data.fundId)
    // Never set Content-Type manually here — postFormData lets the browser
    // generate the multipart boundary; a hardcoded header would strip it.
    return apiClient.postFormData(`${this.BASE}/documents`, fd)
  }

  getMfaPolicy(): Promise<ApiResponse<MfaPolicy>> {
    return apiClient.get(`${this.BASE}/mfa-policy`)
  }

  updateMfaPolicy(data: { requireMfaForLp: boolean; issuerName: string }): Promise<ApiResponse<MfaPolicy>> {
    return apiClient.put(`${this.BASE}/mfa-policy`, data)
  }
}

export const lpPortalAdminApi = new LpPortalAdminApiService()
