/**
 * Procurement API V2
 * Updated to match the new backend API structure
 * Includes: Requisitions, RFQs, Quotations, Approval Configs, Dashboard
 */

import { apiClient } from './api-client'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ProcurementItem {
  id?: string
  requisitionId?: string
  itemName: string
  description: string
  quantity: string | number
  unitPrice: string | number
  totalPrice?: string | number
  unit: string
  preferredVendorId?: string
  specifications?: any
  brand?: string
  model?: string
  warranty?: string
  createdAt?: string
  updatedAt?: string
  preferredVendor?: any
}

export interface PurchaseRequisition {
  id: string
  requisitionNumber: string
  title: string
  description: string
  requestedById: string
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'CONVERTED_TO_PO' | 'RFQ_SENT'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  justification?: string
  approvedById?: string
  approvedAt?: string
  rejectionReason?: string
  totalAmount: string
  currencyId?: string
  createdAt: string
  updatedAt: string
  department: string
  requestedBy: {
    id: string
    firstName: string
    lastName: string
    email: string
    userDepartment?: string
    departmentRole?: string
    roleCode?: string
  }
  approvedBy?: {
    id: string
    firstName: string
    lastName: string
    email: string
    userDepartment?: string
    departmentRole?: string
    roleCode?: string
  }
  currency?: any
  items: ProcurementItem[]
  purchaseOrders?: any[]
}

export interface CreateRequisitionRequest {
  title: string
  description: string
  department: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  justification: string
  items: Array<{
    itemName: string
    description: string
    quantity: number
    unit: string
    specifications?: any
  }>
}

export interface RequisitionFilters {
  status?: string
  priority?: string
  department?: string
  limit?: number
  offset?: number
}

// RFQ Types
export interface RFQ {
  rfqNumber: string
  title: string
  description: string
  items: RFQItem[]
  status: 'DRAFT' | 'SENT' | 'CLOSED' | 'CANCELLED'
  vendors: Array<{
    id: string
    name: string
    email: string
  }>
  createdAt: string
  createdById: string
  rfqDeadline?: string
  deliveryAddress?: string
  specialRequirements?: string
  expectedDeliveryDate?: string
  createdBy: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

export interface RFQItem {
  itemName: string
  description?: string
  quantity: number
  unit: string
  specifications?: any
}

export interface CreateRFQRequest {
  requisitionId: string
  title: string
  description: string
  vendorIds: string[]
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  expectedDeliveryDate?: string
  deliveryAddress?: string
  rfqDeadline?: string
  specialRequirements?: string
  items: RFQItem[]
}

export interface RFQFilters {
  rfqNumber?: string
  requisitionId?: string
  limit?: number
  offset?: number
}

// Quotation Types
export interface Quotation {
  id: string
  quotationNumber: string
  rfqNumber: string
  requisitionId: string
  vendorName: string
  vendorEmail: string
  companyName: string
  taxEIN?: string
  contactPerson?: string
  phoneNumber?: string
  address?: string
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED'
  validUntil: string
  subtotal: string
  taxAmount: string
  totalAmount: string
  currencyCode: string
  paymentTerms?: string
  deliveryTerms?: string
  deliveryTime?: string
  notes?: string
  attachments?: any
  reviewedById?: string
  reviewedAt?: string
  reviewNotes?: string
  rejectionReason?: string
  invoiceId?: string
  submittedAt: string
  updatedAt: string
  items: QuotationItem[]
  reviewedBy?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  invoice?: any
}

export interface QuotationItem {
  id: string
  quotationId: string
  itemName: string
  description: string
  quantity: string
  unit: string
  unitPrice: string
  totalPrice: string
  specifications?: any
  brand?: string
  model?: string
  warranty?: string
  createdAt: string
  updatedAt: string
}

export interface SubmitQuotationRequest {
  rfqNumber: string
  requisitionId: string
  vendorName: string
  vendorEmail: string
  companyName: string
  taxEIN?: string
  contactPerson?: string
  phoneNumber?: string
  address?: string
  validUntil: string
  currencyCode: string
  paymentTerms?: string
  deliveryTerms?: string
  deliveryTime?: string
  notes?: string
  attachments?: any
  items: Array<{
    itemName: string
    description: string
    quantity: number
    unit: string
    unitPrice: number
    specifications?: any
    brand?: string
    model?: string
    warranty?: string
  }>
}

export interface QuotationFilters {
  status?: string
  rfqNumber?: string
  vendorEmail?: string
  limit?: number
  offset?: number
}

// Approval Configuration Types
export interface ApprovalConfiguration {
  id: string
  name: string
  description: string
  isActive: boolean
  createdById: string
  createdAt: any
  updatedAt: any
  department: string
  createdBy: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  stages: ApprovalStage[]
  _count: {
    requests: number
  }
}

export interface ApprovalStage {
  id: string
  configId: string
  stageType: 'PURCHASE_REQUISITION' | 'PURCHASE_ORDER' | 'INVOICE' | 'GRN'
  stepNumber: number
  stepName: string
  stepType: 'USER' | 'ROLE' | 'DEPARTMENT'
  isRequired: boolean
  canDelegate: boolean
  autoApprove: boolean
  approvalOrder: 'SEQUENTIAL' | 'PARALLEL'
  roleCode?: string
  userId?: string
  departmentId?: string
}

export interface CreateApprovalConfigRequest {
  name: string
  description: string
  department: string
  stages: Array<{
    stageType: 'PURCHASE_REQUISITION' | 'PURCHASE_ORDER' | 'INVOICE' | 'GRN'
    steps: Array<{
      stepNumber: number
      stepName: string
      stepType: 'USER' | 'ROLE' | 'DEPARTMENT'
      roleCode?: string
      userId?: string
      departmentId?: string
      isRequired: boolean
      approvalOrder: 'SEQUENTIAL' | 'PARALLEL'
    }>
  }>
}

// Dashboard Types
export interface DashboardData {
  requisitions: {
    summary: {
      total: number
      pending: number
      approved: number
      rejected: number
      draft: number
    }
    byStatus: Array<{
      status: string
      count: number
      totalAmount: number
    }>
    recent: PurchaseRequisition[]
  }
  invoices: {
    summary: {
      total: number
      pending: number
      approved: number
      paid: number
      partiallyPaid: number
    }
    amounts: {
      totalSubtotal: number
      totalTax: number
      totalAmount: number
      averageAmount: number
      paidAmount: number
      pendingPaymentAmount: number
    }
    byStatus: Array<{
      status: string
      count: number
      totalAmount: number
    }>
    byPaymentStatus: Array<{
      paymentStatus: string
      count: number
      totalAmount: number
    }>
    recent: any[]
  }
  rfqs: {
    summary: {
      total: number
      active: number
    }
    recent: any[]
  }
  quotations: {
    summary: {
      total: number
      pending: number
      accepted: number
      rejected: number
    }
    byStatus: Array<{
      status: string
      count: number
      totalAmount: number
    }>
    recent: any[]
  }
  payments: {
    recent: any[]
  }
  vendors: {
    topVendors: Array<{
      vendor: {
        id: string
        name: string
        email: string
      }
      invoiceCount: number
      totalAmount: number
    }>
  }
  lastUpdated: string
}

// Generic Response Type
export interface ProcurementResponse<T> {
  success: boolean
  message?: string
  data?: T
  count?: number
  limit?: number
  offset?: number
  department?: string
}

// ============================================================================
// API CLASS
// ============================================================================

class ProcurementApiServiceV2 {
  
  // ============================================================================
  // DASHBOARD
  // ============================================================================
  
  /**
   * Get dashboard statistics
   * Required Role: Any authenticated user
   */
  async getDashboard(): Promise<ProcurementResponse<DashboardData>> {
    return apiClient.get<ProcurementResponse<DashboardData>>('/procurement/dashboard')
  }

  // ============================================================================
  // APPROVAL CONFIGURATIONS
  // ============================================================================
  
  /**
   * Get all approval configurations
   * Required Role: PROC_MGR, PROC_OFF, or ADMIN
   */
  async getApprovalConfigs(): Promise<ProcurementResponse<ApprovalConfiguration[]>> {
    return apiClient.get<ProcurementResponse<ApprovalConfiguration[]>>('/procurement-approval-configs')
  }

  /**
   * Create a new approval configuration
   * Required Role: ADMIN
   * Note: System only allows one config per department—use this to seed it
   */
  async createApprovalConfig(data: CreateApprovalConfigRequest): Promise<ProcurementResponse<ApprovalConfiguration>> {
    return apiClient.post<ProcurementResponse<ApprovalConfiguration>>('/procurement-approval-configs', data)
  }

  /**
   * Update an approval configuration
   * Required Role: ADMIN or PROC_MGR
   */
  async updateApprovalConfig(id: string, data: CreateApprovalConfigRequest): Promise<ProcurementResponse<ApprovalConfiguration>> {
    return apiClient.put<ProcurementResponse<ApprovalConfiguration>>(`/procurement-approval-configs/${id}`, data)
  }

  // ============================================================================
  // REQUISITIONS
  // ============================================================================
  
  /**
   * Get all requisitions for user's department
   * Required Role: Department HEAD, DEPUTY, or PROC_MGR
   * Returns requisitions filtered by the department they target
   */
  async getRequisitions(filters?: RequisitionFilters): Promise<ProcurementResponse<PurchaseRequisition[]>> {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.priority) params.append('priority', filters.priority)
    if (filters?.department) params.append('department', filters.department)
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())
    
    const queryString = params.toString()
    const url = `/procurement/requisitions${queryString ? `?${queryString}` : ''}`
    return apiClient.get<ProcurementResponse<PurchaseRequisition[]>>(url)
  }

  /**
   * Get requisitions created by the logged-in user
   * Required Role: Any authenticated user
   */
  async getMyRequisitions(): Promise<ProcurementResponse<PurchaseRequisition[]>> {
    return apiClient.get<ProcurementResponse<PurchaseRequisition[]>>('/procurement/requisitions/my')
  }

  /**
   * Get requisitions pending approval for user's department
   * Required Role: Department HEAD, DEPUTY, or PROC_MGR
   */
  async getPendingApprovalRequisitions(): Promise<ProcurementResponse<PurchaseRequisition[]>> {
    return apiClient.get<ProcurementResponse<PurchaseRequisition[]>>('/procurement/requisitions/pending-approval')
  }

  /**
   * Get a single requisition by ID
   * Required Role: Department HEAD, DEPUTY, or PROC_MGR
   */
  async getRequisitionById(id: string): Promise<ProcurementResponse<PurchaseRequisition>> {
    return apiClient.get<ProcurementResponse<PurchaseRequisition>>(`/procurement/requisitions/${id}`)
  }

  /**
   * Create a new requisition
   * Required Role: Any authenticated user
   */
  async createRequisition(data: CreateRequisitionRequest): Promise<ProcurementResponse<PurchaseRequisition>> {
    return apiClient.post<ProcurementResponse<PurchaseRequisition>>('/procurement/requisitions', data)
  }

  /**
   * Submit a requisition for approval
   * Required Role: Requisition creator
   */
  async submitRequisition(id: string): Promise<ProcurementResponse<PurchaseRequisition>> {
    return apiClient.post<ProcurementResponse<PurchaseRequisition>>(`/procurement/requisitions/${id}/submit`, {})
  }

  /**
   * Approve a requisition
   * Required Role: Department HEAD, DEPUTY, or PROC_MGR
   */
  async approveRequisition(id: string): Promise<ProcurementResponse<PurchaseRequisition>> {
    return apiClient.post<ProcurementResponse<PurchaseRequisition>>(`/procurement/requisitions/${id}/approve`, {})
  }

  /**
   * Reject a requisition
   * Required Role: Department HEAD, DEPUTY, or PROC_MGR
   */
  async rejectRequisition(id: string, rejectionReason: string): Promise<ProcurementResponse<PurchaseRequisition>> {
    return apiClient.post<ProcurementResponse<PurchaseRequisition>>(`/procurement/requisitions/${id}/reject`, { rejectionReason })
  }

  // ============================================================================
  // RFQs (Request for Quotation)
  // ============================================================================
  
  /**
   * Get all RFQs
   * Required Role: PROC_MGR, PROC_OFF, or BUYER
   */
  async getRFQs(filters?: RFQFilters): Promise<ProcurementResponse<RFQ[]>> {
    const params = new URLSearchParams()
    if (filters?.rfqNumber) params.append('rfqNumber', filters.rfqNumber)
    if (filters?.requisitionId) params.append('requisitionId', filters.requisitionId)
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())
    
    const queryString = params.toString()
    const url = `/procurement/rfq${queryString ? `?${queryString}` : ''}`
    return apiClient.get<ProcurementResponse<RFQ[]>>(url)
  }

  /**
   * Get a single RFQ by number
   * Required Role: PROC_MGR, PROC_OFF, or BUYER
   */
  async getRFQByNumber(rfqNumber: string): Promise<ProcurementResponse<RFQ>> {
    return apiClient.get<ProcurementResponse<RFQ>>(`/procurement/rfq/${rfqNumber}`)
  }

  /**
   * Create a new RFQ
   * Required Role: PROC_MGR, PROC_OFF, or BUYER
   */
  async createRFQ(data: CreateRFQRequest): Promise<ProcurementResponse<RFQ>> {
    return apiClient.post<ProcurementResponse<RFQ>>('/procurement/rfq', data)
  }

  // ============================================================================
  // QUOTATIONS
  // ============================================================================
  
  /**
   * Get all quotations
   * Required Role: PROC_MGR, PROC_OFF, or BUYER
   */
  async getQuotations(filters?: QuotationFilters): Promise<ProcurementResponse<Quotation[]>> {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.rfqNumber) params.append('rfqNumber', filters.rfqNumber)
    if (filters?.vendorEmail) params.append('vendorEmail', filters.vendorEmail)
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())
    
    const queryString = params.toString()
    const url = `/vendor-quotations${queryString ? `?${queryString}` : ''}`
    return apiClient.get<ProcurementResponse<Quotation[]>>(url)
  }

  /**
   * Get quotations for a specific RFQ
   * Required Role: PROC_MGR, PROC_OFF, or BUYER
   */
  async getQuotationsByRFQ(rfqNumber: string): Promise<ProcurementResponse<Quotation[]>> {
    return apiClient.get<ProcurementResponse<Quotation[]>>(`/vendor-quotations/rfq/${rfqNumber}`)
  }

  /**
   * Get a single quotation by ID
   * Required Role: PROC_MGR, PROC_OFF, or BUYER
   */
  async getQuotationById(id: string): Promise<ProcurementResponse<Quotation>> {
    return apiClient.get<ProcurementResponse<Quotation>>(`/vendor-quotations/${id}`)
  }

  /**
   * Submit a quotation (vendor endpoint - public)
   * This endpoint is used by vendors to submit their quotes
   */
  async submitQuotation(data: SubmitQuotationRequest): Promise<ProcurementResponse<Quotation>> {
    return apiClient.post<ProcurementResponse<Quotation>>('/vendor-quotations/submit', data)
  }

  /**
   * Accept a quotation
   * Required Role: PROC_MGR or PROC_OFF
   */
  async acceptQuotation(id: string): Promise<ProcurementResponse<Quotation>> {
    return apiClient.post<ProcurementResponse<Quotation>>(`/vendor-quotations/${id}/accept`, {})
  }

  /**
   * Reject a quotation
   * Required Role: PROC_MGR or PROC_OFF
   */
  async rejectQuotation(id: string, data: { rejectionReason: string, reviewNotes?: string }): Promise<ProcurementResponse<Quotation>> {
    return apiClient.post<ProcurementResponse<Quotation>>(`/vendor-quotations/${id}/reject`, data)
  }

  /**
   * Delete a quotation
   * Required Role: PROC_MGR or ADMIN
   */
  async deleteQuotation(id: string): Promise<ProcurementResponse<void>> {
    return apiClient.delete<ProcurementResponse<void>>(`/vendor-quotations/${id}`)
  }
}

// Export singleton instance
export const procurementApiV2 = new ProcurementApiServiceV2()
