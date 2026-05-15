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
  id?: string
  rfqNumber: string
  requisitionId?: string
  title: string
  description: string
  items?: RFQItem[]
  itemsSnapshot?: { items: RFQItem[] }
  status: 'DRAFT' | 'OPEN' | 'SENT' | 'CLOSED' | 'CANCELLED'
  visibility?: 'INVITED_ONLY' | 'PUBLIC'
  vendors?: Array<{
    id: string
    name: string
    email: string
  }>
  createdAt: string
  updatedAt?: string
  createdById?: string
  rfqDeadline?: string
  closingAt?: string
  deliveryAddress?: string
  specialRequirements?: string
  expectedDeliveryDate?: string
  createdBy?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

export interface RFQItem {
  itemName: string
  description?: string | null
  quantity: number
  unit: string
  unitPrice?: number | string | null
  lineTotal?: number | string | null
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
  procurementRfqId?: string
  vendorId?: string
  vendorName: string
  vendorEmail: string
  companyName: string
  taxEIN?: string | null
  contactPerson?: string | null
  phoneNumber?: string | null
  address?: string | null
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED'
  validUntil: string
  subtotal: string | number
  taxAmount: string | number
  totalAmount: string | number
  currencyCode: string
  paymentTerms?: string | null
  deliveryTerms?: string | null
  deliveryTime?: string | null
  notes?: string | null
  attachments?: any
  technicalScoreJson?: any
  reviewedById?: string | null
  reviewedAt?: string | null
  reviewNotes?: string | null
  rejectionReason?: string | null
  rejectionContentFingerprint?: string | null
  invoiceId?: string | null
  submittedAt: string
  updatedAt: string
  items: QuotationItem[]
  reviewedBy?: {
    id: string
    firstName: string
    lastName: string
    email: string
  } | null
  invoice?: any
}

export interface QuotationItem {
  id: string
  quotationId: string
  itemName: string
  description?: string | null
  quantity: string | number
  unit: string
  unitPrice: string | number
  totalPrice: string | number
  specifications?: any
  brand?: string | null
  model?: string | null
  warranty?: string | null
  createdAt: string
  updatedAt: string
}

// Response shape for getQuotationsByRFQ — includes the RFQ snapshot alongside quotations
export interface QuotationsByRFQResponse {
  success: boolean
  message?: string
  data?: Quotation[]
  rfq?: RFQ
  count?: number
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

// Purchase Order Types
export interface PurchaseOrder {
  id: string
  poNumber: string
  quotationId: string
  vendorId: string
  vendorName: string
  status: 'DRAFT' | 'SENT' | 'ACKNOWLEDGED' | 'DELIVERED' | 'BILLED' | 'PAID' | 'CANCELLED'
  totalAmount: string
  currencyCode: string
  poDate: string
  expectedDeliveryDate: string
  deliveryAddress?: string
  notes?: string
  items: PurchaseOrderItem[]
  createdAt: string
  updatedAt: string
  sentAt?: string
  acknowledgedAt?: string
  acknowledgedBy?: string
}

export interface PurchaseOrderItem {
  id: string
  poId: string
  itemName: string
  description: string
  quantity: number
  unit: string
  unitPrice: string
  totalPrice: string
  status?: string
}

// GRN Types
export interface GoodsReceivedNote {
  id: string
  grnNumber: string
  purchaseOrderId: string
  purchaseOrder?: PurchaseOrder
  status: 'DRAFT' | 'RECEIVED' | 'PARTIALLY_RECEIVED' | 'APPROVED' | 'REJECTED'
  receivedDate: string
  receivedById: string
  receivedBy?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  qualityStatus: 'PENDING' | 'PASSED' | 'FAILED'
  qualityNotes?: string | null
  approvedById?: string | null
  approvedAt?: string | null
  attachmentUrls?: string[] | null
  latitude?: number | null
  longitude?: number | null
  geoCapturedAt?: string | null
  submittedByInvestee: boolean
  items: GRNItem[]
  createdAt: string
  updatedAt: string
  // Virtual/Joined fields for UI
  poNumber?: string
  vendorName?: string
  totalItems?: number
  receivedItems?: number
}

export interface GRNItem {
  id: string
  grnId: string
  purchaseOrderItemId: string
  purchaseOrderItem?: any
  quantityOrdered: string | number
  quantityReceived: string | number
  quantityAccepted: string | number
  quantityRejected: string | number
  qualityStatus: 'PENDING' | 'PASSED' | 'FAILED'
  qualityNotes?: string | null
  lineType?: string
  milestoneDescription?: string | null
  serialNumbers?: string[] | null
  createdAt: string
  updatedAt: string
  // Virtual/Joined fields for UI
  itemName?: string
  unit?: string
  poQuantity?: number
}

// Invoice Types
export interface ProcurementInvoice {
  id: string
  invoiceNumber: string
  vendorId: string
  vendorName: string
  poId?: string
  grnId?: string
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'PAID' | 'PARTIALLY_PAID' | 'REJECTED'
  invoiceDate: string
  dueDate: string
  subtotal: string
  taxAmount: string
  totalAmount: string
  paidAmount: string
  paymentStatus: 'PENDING' | 'PARTIALLY_PAID' | 'FULLY_PAID'
  currencyCode: string
  items?: any[]
  payments?: InvoicePayment[]
  createdAt: string
  updatedAt: string
}

export interface InvoicePayment {
  id: string
  invoiceId: string
  amount: string
  paymentDate: string
  paymentMethod: string
  status: 'PENDING' | 'COMPLETED' | 'FAILED'
}

// RFQ Comparison & Clarifications
export interface ComparisonMatrix {
  rfqId: string
  rfqNumber: string
  items: Array<{
    id: string
    itemName: string
    quantity: number
    unit: string
  }>
  vendors: Array<{
    id: string
    quotationId: string
    vendorName: string
    vendorEmail: string
    validUntil: string
    currencyCode: string
    itemPrices: Record<string, string>
    totalPrice: string
  }>
}

export interface RFQClarification {
  id: string
  rfqId: string
  vendorId: string
  vendorName: string
  question: string
  askedAt: string
  answer?: string
  answeredAt?: string
  answeredBy?: string
}

// Vendor Registration & KYC
export interface VendorRegistration {
  id: string
  kycUploadToken: string
  kycDocumentsUrl?: string
  companyName: string
  name?: string
  email: string
  contactPerson: string
  phoneNumber: string
  industry: string
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'
  registrationStatus?: 'DRAFT' | 'KYC_PENDING' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'ACTIVE'
  banks?: Array<{
    id?: string
    name: string
    bankAccount: string
    branchCode?: string
    currency?: string
    swiftBicCode?: string
  }>
  createdAt: string
  updatedAt: string
}

export interface VendorSelfRegistrationRequest {
  companyName: string
  name?: string
  email: string
  contactPerson: string
  phoneNumber: string
  industry: string
  banks?: Array<{
    bankName: string
    accountName: string
    accountNumber: string
    branchCode?: string
    currencyCode?: 'USD' | 'ZWL' | 'ZIG'
    swiftCode?: string
  }>
}

export interface KYCDocument {
  id: string
  registrationId: string
  documentType: 'CR14' | 'BANK_LETTER' | 'CERTIFICATE_OF_INCORPORATION' | 'ITF263' | 'OTHER'
  fileUrl: string
  fileName: string
  uploadedAt: string
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED'
}

export interface VendorBank {
  id: string
  vendorId: string
  bankName: string
  accountNumber: string
  accountHolder: string
  branchCode?: string
  swiftCode?: string
  iban?: string
  isPrimary: boolean
}

// Suite 06 AI Invoice Intake
export interface InvoiceIntake {
  id: string
  status: 'PENDING' | 'EXTRACTED' | 'VERIFIED' | 'DRAFT_BILL' | 'MATCHED' | 'ERROR'
  invoiceFile: string
  invoiceNumber?: string
  vendorName?: string
  totalAmount?: string
  extractedData?: any
  verificationErrors?: string[]
  createdAt: string
  updatedAt: string
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
   * Response includes both `data` (quotations) and `rfq` (the RFQ with itemsSnapshot)
   */
  async getQuotationsByRFQ(rfqNumber: string): Promise<QuotationsByRFQResponse> {
    return apiClient.get<QuotationsByRFQResponse>(`/vendor-quotations/rfq/${rfqNumber}`)
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

  // ============================================================================
  // RFQ ENHANCEMENTS (Suite 03)
  // ============================================================================

  /**
   * Get RFQ comparison matrix with all vendor quotations normalized
   * Required Role: PROC_MGR, PROC_OFF, or BUYER
   */
  async getComparisonMatrix(rfqId: string): Promise<ProcurementResponse<ComparisonMatrix>> {
    return apiClient.get<ProcurementResponse<ComparisonMatrix>>(`/procurement/rfqs/${rfqId}/comparison-matrix`)
  }

  /**
   * Award RFQ to a selected vendor quotation
   * Required Role: PROC_MGR or PROC_OFF
   */
  async awardRFQ(rfqId: string, data: { quotationId: string }): Promise<ProcurementResponse<RFQ>> {
    return apiClient.post<ProcurementResponse<RFQ>>(`/procurement/rfqs/${rfqId}/award`, data)
  }

  /**
   * Extend RFQ closing deadline
   * Required Role: PROC_MGR or PROC_OFF
   */
  async extendRFQDeadline(rfqId: string, data: { newDeadline: string }): Promise<ProcurementResponse<RFQ>> {
    return apiClient.patch<ProcurementResponse<RFQ>>(`/procurement/rfqs/${rfqId}/closing`, data)
  }

  /**
   * Get RFQ clarifications
   * Required Role: PROC_MGR, PROC_OFF, or BUYER
   */
  async getRFQClarifications(rfqId: string): Promise<ProcurementResponse<RFQClarification[]>> {
    return apiClient.get<ProcurementResponse<RFQClarification[]>>(`/procurement/rfqs/${rfqId}/clarifications`)
  }

  /**
   * Post a clarification to an RFQ (staff reply to vendor question or new clarification to all)
   * If clarificationId is provided, replies to that specific question. Otherwise posts to all vendors.
   * Required Role: PROC_MGR, PROC_OFF, or BUYER
   */
  async postRFQClarification(rfqId: string, data: { clarificationId?: string; answer: string }): Promise<ProcurementResponse<RFQClarification>> {
    const endpoint = data.clarificationId
      ? `/procurement/rfqs/${rfqId}/clarifications/${data.clarificationId}/reply`
      : `/procurement/rfqs/${rfqId}/clarifications`
    return apiClient.post<ProcurementResponse<RFQClarification>>(endpoint, { answer: data.answer })
  }

  /**
   * Get publicly available RFQs (no authentication required)
   */
  async getPublicRFQs(): Promise<ProcurementResponse<RFQ[]>> {
    return apiClient.get<ProcurementResponse<RFQ[]>>('/public/procurement/rfqs')
  }

  // ============================================================================
  // PURCHASE ORDERS (Suite 04)
  // ============================================================================

  /**
   * Get all purchase orders
   * Required Role: PROC_MGR, PROC_OFF, or BUYER
   */
  async getPurchaseOrders(filters?: { status?: string; vendorId?: string; limit?: number; offset?: number }): Promise<ProcurementResponse<PurchaseOrder[]>> {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.vendorId) params.append('vendorId', filters.vendorId)
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())

    const queryString = params.toString()
    const url = `/procurement/purchase-orders${queryString ? `?${queryString}` : ''}`
    return apiClient.get<ProcurementResponse<PurchaseOrder[]>>(url)
  }

  /**
   * Get a single purchase order by ID
   * Required Role: PROC_MGR, PROC_OFF, or BUYER
   */
  async getPurchaseOrderById(id: string): Promise<ProcurementResponse<PurchaseOrder>> {
    return apiClient.get<ProcurementResponse<PurchaseOrder>>(`/procurement/purchase-orders/${id}`)
  }

  /**
   * Create a new purchase order
   * Required Role: PROC_MGR or PROC_OFF
   */
  async createPurchaseOrder(data: any): Promise<ProcurementResponse<PurchaseOrder>> {
    return apiClient.post<ProcurementResponse<PurchaseOrder>>('/procurement/purchase-orders', data)
  }

  /**
   * Send purchase order to vendor
   * Required Role: PROC_MGR or PROC_OFF
   */
  async sendPurchaseOrder(id: string): Promise<ProcurementResponse<PurchaseOrder>> {
    return apiClient.post<ProcurementResponse<PurchaseOrder>>(`/procurement/purchase-orders/${id}/send`, {})
  }

  /**
   * Convert purchase order to bill (creates invoice)
   * Required Role: PROC_MGR or PROC_OFF
   */
  async convertToBill(id: string): Promise<ProcurementResponse<ProcurementInvoice>> {
    return apiClient.post<ProcurementResponse<ProcurementInvoice>>(`/procurement/purchase-orders/${id}/convert-to-bill`, {})
  }

  /**
   * Download PO as PDF
   * Required Role: PROC_MGR, PROC_OFF, or BUYER
   * Returns: Blob (PDF file)
   */
  async downloadPOPDF(id: string): Promise<Blob> {
    const response = await fetch(`/api/procurement/purchase-orders/${id}/pdf`, {
      headers: { 'Authorization': `Bearer ${document.cookie}` }
    })
    return response.blob()
  }

  /**
   * Cancel a PO line item
   * Required Role: PROC_MGR or PROC_OFF
   */
  async cancelPOLine(poId: string, lineId: string): Promise<ProcurementResponse<PurchaseOrder>> {
    return apiClient.patch<ProcurementResponse<PurchaseOrder>>(`/procurement/purchase-orders/${poId}/lines/${lineId}/cancel`, {})
  }

  /**
   * Acknowledge PO via token (vendor endpoint - public)
   */
  async acknowledgeViaToken(token: string): Promise<ProcurementResponse<PurchaseOrder>> {
    return apiClient.post<ProcurementResponse<PurchaseOrder>>(`/public/purchase-orders/${token}/acknowledge`, {})
  }

  // ============================================================================
  // GOODS RECEIVED NOTES (Suite 05)
  // ============================================================================

  /**
   * Get all GRNs
   * Required Role: PROC_MGR, PROC_OFF, or WAREHOUSE
   */
  async getGRNs(filters?: { 
    purchaseOrderId?: string; 
    vendorId?: string; 
    status?: string; 
    qualityStatus?: string;
    submittedByInvestee?: boolean;
    grnNumber?: string;
    limit?: number; 
    offset?: number 
  }): Promise<ProcurementResponse<GoodsReceivedNote[]>> {
    const params = new URLSearchParams()
    if (filters?.purchaseOrderId) params.append('purchaseOrderId', filters.purchaseOrderId)
    if (filters?.vendorId) params.append('vendorId', filters.vendorId)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.qualityStatus) params.append('qualityStatus', filters.qualityStatus)
    if (filters?.submittedByInvestee !== undefined) params.append('submittedByInvestee', filters.submittedByInvestee.toString())
    if (filters?.grnNumber) params.append('grnNumber', filters.grnNumber)
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())

    const queryString = params.toString()
    const url = `/procurement/goods-received-notes${queryString ? `?${queryString}` : ''}`
    return apiClient.get<ProcurementResponse<GoodsReceivedNote[]>>(url)
  }

  /**
   * Create a new GRN
   * Required Role: WAREHOUSE or PROC_MGR
   */
  async createGRN(data: any): Promise<ProcurementResponse<GoodsReceivedNote>> {
    return apiClient.post<ProcurementResponse<GoodsReceivedNote>>('/procurement/goods-received-notes', data)
  }

  // ---- Applicant / Investee GRN endpoints (portfolio-scoped) ------------------

  /**
   * List investee GRNs (portfolio-scoped).
   * Endpoint: GET /applicant/procurement/goods-received-notes
   * Server returns { items, total, limit, offset } under `data`.
   */
  async getApplicantGRNs(filters?: {
    purchaseOrderId?: string
    status?: string
    limit?: number
    offset?: number
  }): Promise<ProcurementResponse<{ items: GoodsReceivedNote[]; total: number; limit: number; offset: number }>> {
    const params = new URLSearchParams()
    params.append('limit', String(filters?.limit ?? 50))
    params.append('offset', String(filters?.offset ?? 0))
    if (filters?.purchaseOrderId) params.append('purchaseOrderId', filters.purchaseOrderId)
    if (filters?.status) params.append('status', filters.status)
    return apiClient.get<ProcurementResponse<{ items: GoodsReceivedNote[]; total: number; limit: number; offset: number }>>(
      `/applicant/procurement/goods-received-notes?${params.toString()}`
    )
  }

  /**
   * Get an investee GRN by id (portfolio-scoped).
   */
  async getApplicantGRN(id: string): Promise<ProcurementResponse<GoodsReceivedNote>> {
    return apiClient.get<ProcurementResponse<GoodsReceivedNote>>(
      `/applicant/procurement/goods-received-notes/${id}`
    )
  }

  /**
   * Create an investee GRN. PO must belong to applicant portfolio PR.
   * Payload shape: { purchaseOrderId, receivedDate (ISO), items: [{ purchaseOrderItemId, quantityReceived, quantityAccepted, quantityRejected, qualityStatus }] }
   */
  async createApplicantGRN(data: {
    purchaseOrderId: string
    receivedDate: string
    items: Array<{
      purchaseOrderItemId: string
      quantityReceived: number
      quantityAccepted: number
      quantityRejected: number
      qualityStatus: 'PASSED' | 'FAILED' | 'PARTIAL'
    }>
  }): Promise<ProcurementResponse<GoodsReceivedNote>> {
    return apiClient.post<ProcurementResponse<GoodsReceivedNote>>(
      '/applicant/procurement/goods-received-notes',
      data
    )
  }

  // ============================================================================
  // INVOICES & PAYMENTS
  // ============================================================================

  /**
   * Get all invoices
   * Required Role: PROC_MGR, PROC_OFF, or FINANCE
   */
  async getInvoices(params?: { status?: string; vendorId?: string; limit?: number; offset?: number }): Promise<ProcurementResponse<ProcurementInvoice[]>> {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append('status', params.status)
    if (params?.vendorId) queryParams.append('vendorId', params.vendorId)
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())

    const queryString = queryParams.toString()
    const url = `/procurement/invoices${queryString ? `?${queryString}` : ''}`
    return apiClient.get<ProcurementResponse<ProcurementInvoice[]>>(url)
  }

  /**
   * Create an invoice (vendor endpoint - public)
   */
  async createInvoice(data: any): Promise<ProcurementResponse<ProcurementInvoice>> {
    return apiClient.post<ProcurementResponse<ProcurementInvoice>>('/procurement/invoices', data)
  }

  /**
   * Approve an invoice
   * Required Role: PROC_MGR or FINANCE
   */
  async approveInvoice(id: string, data: { approvalNotes?: string }): Promise<ProcurementResponse<ProcurementInvoice>> {
    return apiClient.put<ProcurementResponse<ProcurementInvoice>>(`/procurement/invoices/${id}/approve`, data)
  }

  /**
   * Process invoice payment (supports file upload for proof)
   * Required Role: FINANCE
   */
  async processInvoicePayment(id: string, formData: FormData): Promise<ProcurementResponse<InvoicePayment>> {
    return apiClient.post<ProcurementResponse<InvoicePayment>>(`/procurement/invoices/${id}/payment`, formData)
  }

  /**
   * Get all payments
   * Required Role: FINANCE or PROC_MGR
   */
  async getPayments(params?: { status?: string; invoiceId?: string; limit?: number; offset?: number }): Promise<ProcurementResponse<InvoicePayment[]>> {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append('status', params.status)
    if (params?.invoiceId) queryParams.append('invoiceId', params.invoiceId)
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())

    const queryString = queryParams.toString()
    const url = `/procurement/payments${queryString ? `?${queryString}` : ''}`
    return apiClient.get<ProcurementResponse<InvoicePayment[]>>(url)
  }

  // ============================================================================
  // SUITE 06: AI INVOICE INTAKE & 3-WAY MATCH
  // ============================================================================

  /**
   * Create a new invoice intake
   * Required Role: FINANCE or PROC_MGR
   */
  async createIntake(data: any): Promise<ProcurementResponse<InvoiceIntake>> {
    return apiClient.post<ProcurementResponse<InvoiceIntake>>('/procurement/suite06/intakes', data)
  }

  /**
   * Extract invoice data using AI
   * Required Role: FINANCE or PROC_MGR
   */
  async extractIntake(id: string): Promise<ProcurementResponse<InvoiceIntake>> {
    return apiClient.post<ProcurementResponse<InvoiceIntake>>(`/procurement/suite06/intakes/${id}/extract`, {})
  }

  /**
   * Verify extracted invoice data
   * Required Role: FINANCE or PROC_MGR
   */
  async verifyIntake(id: string, data: { verifiedData: any }): Promise<ProcurementResponse<InvoiceIntake>> {
    return apiClient.patch<ProcurementResponse<InvoiceIntake>>(`/procurement/suite06/intakes/${id}/verify`, data)
  }

  /**
   * Create draft bill from verified intake
   * Required Role: FINANCE or PROC_MGR
   */
  async createDraftBill(id: string): Promise<ProcurementResponse<ProcurementInvoice>> {
    return apiClient.post<ProcurementResponse<ProcurementInvoice>>(`/procurement/suite06/intakes/${id}/create-draft-bill`, {})
  }

  /**
   * Run 3-way match (PO vs GRN vs Vendor Bill)
   * Required Role: FINANCE or PROC_MGR
   */
  async runMatch(purchaseInvoiceId: string): Promise<ProcurementResponse<any>> {
    return apiClient.post<ProcurementResponse<any>>(`/procurement/suite06/purchase-invoices/${purchaseInvoiceId}/run-match`, {})
  }

  /**
   * Get CFO dashboard summary for Suite 06
   * Required Role: CFO or FINANCE
   */
  async getCFODashboard(): Promise<ProcurementResponse<any>> {
    return apiClient.get<ProcurementResponse<any>>('/procurement/suite06/cfo-dashboard')
  }

  /**
   * Get verification queue (invoices pending manual review)
   * Required Role: FINANCE or PROC_MGR
   */
  async getVerificationQueue(take?: number): Promise<ProcurementResponse<InvoiceIntake[]>> {
    const url = take ? `/procurement/suite06/verification-queue?take=${take}` : '/procurement/suite06/verification-queue'
    return apiClient.get<ProcurementResponse<InvoiceIntake[]>>(url)
  }

  // ============================================================================
  // VENDOR SELF-REGISTRATION & KYC (Suite 01 - PUBLIC)
  // ============================================================================

  /**
   * Vendor self-registration (public endpoint - no auth)
   */
  async vendorSelfRegister(data: VendorSelfRegistrationRequest): Promise<ProcurementResponse<VendorRegistration>> {
    return apiClient.post<ProcurementResponse<VendorRegistration>>('/public/vendor-registration', data)
  }

  /**
   * Get registration by token (public endpoint - no auth)
   */
  async getRegistrationByToken(token: string): Promise<ProcurementResponse<VendorRegistration>> {
    return apiClient.get<ProcurementResponse<VendorRegistration>>(`/public/vendor-registration/${token}`)
  }

  /**
   * Get KYC requirements for token (public endpoint - no auth)
   */
  async getKYCRequirements(token: string): Promise<ProcurementResponse<any>> {
    return apiClient.get<ProcurementResponse<any>>(`/public/vendor-registration/${token}/kyc-requirements`)
  }

  /**
   * Upload KYC documents (public endpoint - no auth, multipart form data)
   */
  async uploadKYCDocuments(token: string, formData: FormData): Promise<ProcurementResponse<KYCDocument[]>> {
    return apiClient.post<ProcurementResponse<KYCDocument[]>>(`/public/vendor-registration/${token}/kyc-documents`, formData)
  }

  /**
   * Get uploaded KYC documents (public endpoint - no auth)
   */
  async getKYCDocuments(token: string): Promise<ProcurementResponse<KYCDocument[]>> {
    return apiClient.get<ProcurementResponse<KYCDocument[]>>(`/public/vendor-registration/${token}/kyc-documents`)
  }

  /**
   * Download a KYC document (public endpoint - no auth)
   * Returns: Blob (file)
   */
  async downloadKYCDoc(token: string, docId: string): Promise<Blob> {
    const response = await fetch(`/api/public/vendor-registration/${token}/kyc-documents/${docId}/download`)
    return response.blob()
  }

  // ============================================================================
  // VENDOR MANAGEMENT (Suite 01 - STAFF)
  // ============================================================================

  /**
   * Get pending vendor registrations (awaiting KYC review)
   * Required Role: PROC_MGR or ADMIN
   */
  async getPendingVendors(): Promise<ProcurementResponse<VendorRegistration[]>> {
    return apiClient.get<ProcurementResponse<VendorRegistration[]>>('/accounting/vendors/pending-review')
  }

  /**
   * Approve a vendor registration
   * Required Role: PROC_MGR or ADMIN
   */
  async approveVendorRegistration(id: string): Promise<ProcurementResponse<VendorRegistration>> {
    return apiClient.put<ProcurementResponse<VendorRegistration>>(`/accounting/vendors/${id}/approve-registration`, {})
  }

  /**
   * Blacklist a vendor
   * Required Role: PROC_MGR or ADMIN
   */
  async blacklistVendor(id: string, data: { reason: string }): Promise<ProcurementResponse<any>> {
    return apiClient.post<ProcurementResponse<any>>(`/accounting/vendors/${id}/blacklist`, data)
  }

  /**
   * Unblacklist a vendor
   * Required Role: PROC_MGR or ADMIN
   */
  async unblacklistVendor(id: string, data: { reason: string }): Promise<ProcurementResponse<any>> {
    return apiClient.post<ProcurementResponse<any>>(`/accounting/vendors/${id}/unblacklist`, data)
  }

  /**
   * Get vendor bank accounts
   * Required Role: PROC_MGR, ADMIN, or FINANCE
   */
  async getVendorBanks(id: string): Promise<ProcurementResponse<VendorBank[]>> {
    return apiClient.get<ProcurementResponse<VendorBank[]>>(`/accounting/vendors/${id}/banks`)
  }

  /**
   * Add a bank account to vendor
   * Required Role: PROC_MGR or ADMIN
   */
  async addVendorBank(id: string, data: any): Promise<ProcurementResponse<VendorBank>> {
    return apiClient.post<ProcurementResponse<VendorBank>>(`/accounting/vendors/${id}/banks`, data)
  }

  /**
   * Update vendor bank account
   * Required Role: PROC_MGR or ADMIN
   */
  async updateVendorBank(id: string, bankId: string, data: any): Promise<ProcurementResponse<VendorBank>> {
    return apiClient.put<ProcurementResponse<VendorBank>>(`/accounting/vendors/${id}/banks/${bankId}`, data)
  }

  /**
   * Get vendor KYC documents
   * Required Role: PROC_MGR, ADMIN, or FINANCE
   */
  async getVendorKYCDocs(id: string): Promise<ProcurementResponse<KYCDocument[]>> {
    return apiClient.get<ProcurementResponse<KYCDocument[]>>(`/accounting/vendors/${id}/kyc-documents`)
  }

  /**
   * Download KYC document (staff side)
   * Returns: Blob (file)
   */
  async downloadStaffKYCDoc(docId: string): Promise<Blob> {
    const response = await fetch(`/api/accounting/vendors/kyc-documents/${docId}/download`)
    return response.blob()
  }

  // ─── SUITE 02: INVESTEE / APPLICANT ───

  /**
   * Get investee (portfolio-linked) purchase requisitions
   * Scope: CFO, SYSADMIN, PROC_MGR see all; FundManagers see PRs for their fund(s)
   */
  async getInvesteeRequisitions(): Promise<ProcurementResponse<PurchaseRequisition[]>> {
    return apiClient.get<ProcurementResponse<PurchaseRequisition[]>>('/procurement/requisitions/investee')
  }

  /**
   * Get investee PRs pending VC executive review longer than 48 hours (SLA breach)
   * Same fund scope as getInvesteeRequisitions
   */
  async getInvesteeRequisitionsSlaBreached(): Promise<ProcurementResponse<PurchaseRequisition[]>> {
    return apiClient.get<ProcurementResponse<PurchaseRequisition[]>>('/procurement/requisitions/investee/sla-breached')
  }

  /**
   * Get applicant drawdown summary and PR ledger
   * Auth: applicant with portfolio company
   */
  async getApplicantDrawdown(): Promise<ProcurementResponse<ApplicantDrawdown>> {
    return apiClient.get<ProcurementResponse<ApplicantDrawdown>>('/applicant/procurement/drawdown')
  }

  /**
   * Create investee purchase requisition (draft)
   * Auth: applicant with portfolio company
   */
  async createApplicantRequisition(data: CreateApplicantRequisitionRequest): Promise<ProcurementResponse<PurchaseRequisition>> {
    return apiClient.post<ProcurementResponse<PurchaseRequisition>>('/applicant/procurement/requisitions', data)
  }

  /**
   * Submit investee PR for VC executive review
   * Auth: applicant for the portfolio company only
   */
  async submitApplicantRequisition(id: string): Promise<ProcurementResponse<PurchaseRequisition>> {
    return apiClient.put<ProcurementResponse<PurchaseRequisition>>(`/applicant/procurement/requisitions/${id}/submit`, {})
  }

  /**
   * Cancel investee PR before RFQ award (returns to DRAFT)
   * Allowed for DRAFT or PENDING_VC_EXECUTIVE_REVIEW only
   */
  async cancelApplicantRequisition(id: string): Promise<ProcurementResponse<PurchaseRequisition>> {
    return apiClient.post<ProcurementResponse<PurchaseRequisition>>(`/applicant/procurement/requisitions/${id}/cancel`, {})
  }

  /**
   * Create GRN return-to-vendor record (stub / workflow)
   * Auth: procurement staff with PO approval rights
   */
  async createGRNReturn(data: { purchaseOrderId: string }): Promise<any> {
    return apiClient.post('/procurement/grn-return-to-vendor', data)
  }

  // ============================================================================
  // SUITE 06: AI INVOICE INTAKE, 3-WAY MATCH & VERIFICATION
  // ============================================================================

  /**
   * Create a Suite 06 invoice intake. Accepts either:
   *  - `documentFile` (File) — sent as multipart/form-data under `document`
   *  - `documentUrl` (string) — sent as JSON
   * Other fields go through as form fields / JSON properties.
   */
  async createInvoiceIntake(data: {
    documentFile?: File
    documentUrl?: string
    vendorId?: string
    sourcePurchaseOrderId?: string
    goodsReceivedNoteId?: string
  }): Promise<ProcurementResponse<InvoiceIntake>> {
    if (data.documentFile) {
      const fd = new FormData()
      fd.append('document', data.documentFile)
      if (data.vendorId) fd.append('vendorId', data.vendorId)
      if (data.sourcePurchaseOrderId) fd.append('sourcePurchaseOrderId', data.sourcePurchaseOrderId)
      if (data.goodsReceivedNoteId) fd.append('goodsReceivedNoteId', data.goodsReceivedNoteId)
      return apiClient.postFormData<ProcurementResponse<InvoiceIntake>>(
        '/procurement/suite06/intakes',
        fd,
      )
    }

    const { documentFile, ...jsonPayload } = data
    return apiClient.post<ProcurementResponse<InvoiceIntake>>(
      '/procurement/suite06/intakes',
      jsonPayload,
    )
  }

  async getInvoiceIntake(id: string): Promise<ProcurementResponse<InvoiceIntake>> {
    return apiClient.get<ProcurementResponse<InvoiceIntake>>(`/procurement/suite06/intakes/${id}`)
  }

  async extractInvoiceData(id: string): Promise<ProcurementResponse<ExtractedInvoiceData>> {
    return apiClient.post<ProcurementResponse<ExtractedInvoiceData>>(`/procurement/suite06/intakes/${id}/extract`)
  }

  async verifyInvoiceIntake(id: string): Promise<ProcurementResponse<InvoiceIntake>> {
    return apiClient.patch<ProcurementResponse<InvoiceIntake>>(`/procurement/suite06/intakes/${id}/verify`)
  }

  async createDraftBillFromIntake(id: string, data?: { invoiceNumberOverride?: string, invoiceDateOverride?: string }): Promise<ProcurementResponse<ProcurementInvoice>> {
    return apiClient.post<ProcurementResponse<ProcurementInvoice>>(`/procurement/suite06/intakes/${id}/create-draft-bill`, data || {})
  }

  async getVerificationQueue(take: number = 50): Promise<ProcurementResponse<InvoiceIntake[]>> {
    return apiClient.get<ProcurementResponse<InvoiceIntake[]>>(`/procurement/suite06/verification-queue?take=${take}`)
  }

  async getSuite06Intakes(filters?: { vendorId?: string; status?: string; take?: number; skip?: number }): Promise<ProcurementResponse<Suite06IntakesResponse>> {
    const params = new URLSearchParams()
    if (filters?.take) params.append('take', filters.take.toString())
    else params.append('take', '50')
    
    if (filters?.skip) params.append('skip', filters.skip.toString())
    else params.append('skip', '0')
    
    if (filters?.vendorId) params.append('vendorId', filters.vendorId)
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status)
    
    return apiClient.get<ProcurementResponse<Suite06IntakesResponse>>(`/procurement/suite06/intakes?${params.toString()}`)
  }

  async upsertFieldCorrections(data: VendorFieldCorrections): Promise<ProcurementResponse<any>> {
    return apiClient.post<ProcurementResponse<any>>('/procurement/suite06/field-corrections', data)
  }

  async runThreeWayMatch(purchaseInvoiceId: string): Promise<ProcurementResponse<ThreeWayMatchResult>> {
    return apiClient.post<ProcurementResponse<ThreeWayMatchResult>>(`/procurement/suite06/purchase-invoices/${purchaseInvoiceId}/run-match`)
  }

  async getCFODashboard(): Promise<ProcurementResponse<CFODashboardData>> {
    return apiClient.get<ProcurementResponse<CFODashboardData>>('/procurement/suite06/cfo-dashboard')
  }
}

// ============================================================================
// SUITE 06: AI INVOICE INTAKE & 3-WAY MATCH TYPES
// ============================================================================

export interface InvoiceIntake {
  id: string
  documentUrl: string
  vendorId?: string
  vendorName?: string
  status: 'PENDING' | 'EXTRACTED' | 'VERIFIED' | 'PROCESSED'
  extractedData?: ExtractedInvoiceData
  createdAt: string
  updatedAt: string
}

export interface IntakeItemV2 {
  id: string
  intakeNumber: string
  documentUrl: string
  rawExtractedText: string | null
  extractedPayloadJson: any | null
  status: 'DRAFT' | 'EXTRACTED' | 'VERIFIED' | 'MATCHED' | 'DRAFT_BILL' | 'ERROR'
  overallConfidence: string | null
  vendorId: string | null
  sourcePurchaseOrderId: string | null
  goodsReceivedNoteId: string | null
  purchaseInvoiceId: string | null
  taxParseStatus: string | null
  createdById: string
  createdAt: string
  updatedAt: string
  vendor: {
    id: string
    name: string
    bpNumber: string | null
  } | null
  sourcePurchaseOrder: {
    id: string
    poNumber: string
  } | null
  goodsReceivedNote: {
    id: string
    grnNumber: string
  } | null
  purchaseInvoice: any | null
}

export interface Suite06IntakesResponse {
  items: IntakeItemV2[]
  total: number
  skip: number
  take: number
}

export interface ExtractedInvoiceData {
  invoiceNumber: string
  invoiceDate: string
  dueDate: string
  vendorName: string
  vendorId?: string
  totalAmount: string
  currency: string
  items: ExtractedLineItem[]
  confidence: number
}

export interface ExtractedLineItem {
  itemName: string
  description?: string
  quantity: string
  unitPrice: string
  totalPrice: string
  unit: string
}

export interface VendorFieldCorrections {
  vendorId: string
  fieldMappings: Record<string, string>
  createdAt?: string
}

export interface ThreeWayMatchResult {
  purchaseInvoiceId: string
  status: 'MATCHED' | 'DISPUTED'
  matchDetails: {
    poMatch: MatchLineResult[]
    grnMatch: MatchLineResult[]
    priceVariance: PriceVariance[]
    quantityVariance: QuantityVariance[]
  }
  disputes: string[]
}

export interface MatchLineResult {
  lineId: string
  itemName: string
  status: 'MATCHED' | 'UNMATCHED' | 'PARTIAL'
  matchPercentage: number
}

export interface PriceVariance {
  lineId: string
  poPrice: string
  invoicePrice: string
  variance: string
  variancePercentage: number
}

export interface QuantityVariance {
  lineId: string
  poQuantity: string
  grnQuantity: string
  invoiceQuantity: string
  variance: string
}

export interface CFODashboardData {
  vendorBillsMatched: number
  vendorBillsDisputed: number
  intakesPendingHumanVerification: number
  totalIntakes: number
}

// Export singleton instance
export const procurementApiV2 = new ProcurementApiServiceV2()

// ─── TYPES: SUITE 02 ───

export interface ApplicantDrawdown {
  totalInvestmentAward: string
  committed: string
  reserved: string
  available: string
  totalApprovedDrawdownAmount: string
  ledgerApprovedPrs: any[]
  requisitions: PurchaseRequisition[]
}

export interface CreateApplicantRequisitionRequest {
  title: string
  description: string
  priority: string
  justification: string
  sourcingCategory: string
  drawdownRequestAmount: number
  useOfFundsDocumentUrl: string
  department: string
  portfolioCompanyId?: string
  fundId?: string
  items: {
    itemName: string
    description: string
    quantity: number
    unit: string
    specifications?: Record<string, any>
  }[]
}
