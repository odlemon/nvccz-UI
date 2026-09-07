/**
 * Generic (non-journal) approvals — backend contract: GET /api/approvals/my-pending
 * (nvccz/src/routes/approvalRoutes.ts, ApprovalService.getMyPendingApprovals). Type-agnostic
 * by stageType; real rows originate from three places today — ChartOfAccountsUpdateService
 * (stageType MASTER_DATA_COA, no amount concept), PurchaseInvoiceController (PAYMENT_EXECUTION,
 * entityData.amountUsd/currencyCode, single or batch pay above the $10k USD threshold), and
 * ShortTermInvestmentController (INVESTMENT_BOOKING, entityData.amountUsd/currencyCode, new
 * trades above the $50k USD threshold). Scoped to the current user's own assigned approvals,
 * not a global queue (that's the endpoint's own shape).
 */
import { apiClient } from './api-client'

export interface PendingApproval {
  id: string
  status: string
  request: {
    id: string
    entityId: string
    entityData: {
      amountUsd?: number
      currencyCode?: string
      kind?: 'SINGLE' | 'BATCH'
      invoiceIds?: string[]
      paymentReference?: string
      issuer?: string
      principal?: number
    } | null
    status: string
    requestedBy: { id: string; firstName: string; lastName: string; email: string } | null
  }
  stage: {
    stepNumber: number
    stepName: string
    stageType: string
  }
  approver: { id: string; firstName: string; lastName: string; email: string } | null
}

interface ApiRes<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}

export async function getMyPendingApprovals(): Promise<ApiRes<PendingApproval[]>> {
  return apiClient.get<ApiRes<PendingApproval[]>>('/approvals/my-pending')
}

/** `id` here is the real `Approval.id` (the top-level `id` on a PendingApproval row above), not the ApprovalRequest id. */
export async function approveApprovalRequest(id: string, comments?: string): Promise<ApiRes<unknown>> {
  return apiClient.post<ApiRes<unknown>>(`/approvals/${id}/approve`, { comments })
}

export async function rejectApprovalRequest(id: string, comments?: string): Promise<ApiRes<unknown>> {
  return apiClient.post<ApiRes<unknown>>(`/approvals/${id}/reject`, { comments })
}
