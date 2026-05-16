// ============================================================================
// PROCUREMENT REDUX SLICE
// Complete state management for the new procurement flow
// ============================================================================

import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import { procurementApiV2 } from '@/lib/api/procurement-api-v2'
import type {
  PurchaseRequisition,
  CreateRequisitionRequest,
  RequisitionFilters,
  RFQ,
  CreateRFQRequest,
  RFQFilters,
  Quotation,
  SubmitQuotationRequest,
  QuotationFilters,
  ApprovalConfiguration,
  CreateApprovalConfigRequest,
  DashboardData,
  PurchaseOrder,
  GoodsReceivedNote,
  ProcurementInvoice,
  InvoicePayment,
  ComparisonMatrix,
  RFQClarification,
  VendorRegistration,
  KYCDocument,
  VendorBank,
  ApplicantDrawdown,
  CreateApplicantRequisitionRequest,
} from '@/lib/api/procurement-api-v2'

// ============================================================================
// STATE INTERFACE
// ============================================================================

interface ProcurementState {
  // Dashboard
  dashboard: DashboardData | null
  dashboardLoading: boolean

  // Approval Configurations
  approvalConfigs: ApprovalConfiguration[]
  approvalConfigsLoading: boolean

  // Purchase Requisitions
  requisitions: PurchaseRequisition[]
  requisitionsCount: number
  currentRequisition: PurchaseRequisition | null
  requisitionsLoading: boolean
  myRequisitions: PurchaseRequisition[]
  myRequisitionsCount: number
  pendingApprovalRequisitions: PurchaseRequisition[]
  pendingApprovalCount: number

  // RFQs
  rfqs: RFQ[]
  rfqsCount: number
  currentRfq: RFQ | null
  rfqsLoading: boolean

  // Quotations
  quotations: Quotation[]
  quotationsCount: number
  currentQuotation: Quotation | null
  quotationsLoading: boolean

  // Purchase Orders
  purchaseOrders: PurchaseOrder[]
  purchaseOrdersCount: number
  currentPurchaseOrder: PurchaseOrder | null
  purchaseOrdersLoading: boolean

  // Goods Received Notes
  grns: GoodsReceivedNote[]
  grnsCount: number
  grnsLoading: boolean

  // Invoices & Payments
  invoices: ProcurementInvoice[]
  invoicesCount: number
  invoicesLoading: boolean
  payments: InvoicePayment[]
  paymentsLoading: boolean

  // Vendor Management
  pendingVendors: VendorRegistration[]
  pendingVendorsLoading: boolean

  // Suite 02 - Investee / Applicant
  investeeRequisitions: PurchaseRequisition[]
  investeeRequisitionsCount: number
  slaBreachedRequisitions: PurchaseRequisition[]
  investeeRequisitionsLoading: boolean
  applicantDrawdown: ApplicantDrawdown | null
  applicantRequisitions: PurchaseRequisition[]
  applicantRequisitionsLoading: boolean

  // RFQ Enhancements
  comparisonMatrix: ComparisonMatrix | null
  rfqClarifications: RFQClarification[]

  // UI State
  error: string | null
  successMessage: string | null
  filters: {
    requisitions: RequisitionFilters
    rfqs: RFQFilters
    quotations: QuotationFilters
  }
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: ProcurementState = {
  dashboard: null,
  dashboardLoading: false,

  approvalConfigs: [],
  approvalConfigsLoading: false,

  requisitions: [],
  requisitionsCount: 0,
  currentRequisition: null,
  requisitionsLoading: false,
  myRequisitions: [],
  myRequisitionsCount: 0,
  pendingApprovalRequisitions: [],
  pendingApprovalCount: 0,

  rfqs: [],
  rfqsCount: 0,
  currentRfq: null,
  rfqsLoading: false,

  quotations: [],
  quotationsCount: 0,
  currentQuotation: null,
  quotationsLoading: false,

  purchaseOrders: [],
  purchaseOrdersCount: 0,
  currentPurchaseOrder: null,
  purchaseOrdersLoading: false,

  grns: [],
  grnsCount: 0,
  grnsLoading: false,

  invoices: [],
  invoicesCount: 0,
  invoicesLoading: false,
  payments: [],
  paymentsLoading: false,

  pendingVendors: [],
  pendingVendorsLoading: false,

  investeeRequisitions: [],
  investeeRequisitionsCount: 0,
  slaBreachedRequisitions: [],
  investeeRequisitionsLoading: false,
  applicantDrawdown: null,
  applicantRequisitions: [],
  applicantRequisitionsLoading: false,

  comparisonMatrix: null,
  rfqClarifications: [],

  error: null,
  successMessage: null,
  filters: {
    requisitions: { limit: 50, offset: 0 },
    rfqs: { limit: 50, offset: 0 },
    quotations: { limit: 50, offset: 0 },
  },
}

// ============================================================================
// ASYNC THUNKS - DASHBOARD
// ============================================================================

export const fetchDashboard = createAsyncThunk('procurementV2/fetchDashboard', async () => {
  const response = await procurementApiV2.getDashboard()
  return response.data
})

// ============================================================================
// ASYNC THUNKS - APPROVAL CONFIGURATIONS
// ============================================================================

export const fetchApprovalConfigs = createAsyncThunk('procurementV2/fetchApprovalConfigs', async () => {
  const response = await procurementApiV2.getApprovalConfigs()
  return response.data
})

export const createApprovalConfig = createAsyncThunk(
  'procurementV2/createApprovalConfig',
  async (payload: CreateApprovalConfigRequest) => {
    const response = await procurementApiV2.createApprovalConfig(payload)
    return response.data
  }
)

export const updateApprovalConfig = createAsyncThunk(
  'procurementV2/updateApprovalConfig',
  async ({ id, payload }: { id: string; payload: CreateApprovalConfigRequest }) => {
    const response = await procurementApiV2.updateApprovalConfig(id, payload)
    return response.data
  }
)

// ============================================================================
// ASYNC THUNKS - REQUISITIONS
// ============================================================================

export const fetchRequisitions = createAsyncThunk(
  'procurementV2/fetchRequisitions',
  async (filters?: RequisitionFilters) => {
    const response = await procurementApiV2.getRequisitions(filters)
    return response
  }
)

export const fetchRequisitionById = createAsyncThunk('procurementV2/fetchRequisitionById', async (id: string) => {
  const response = await procurementApiV2.getRequisitionById(id)
  return response.data
})

export const fetchPendingApprovalRequisitions = createAsyncThunk(
  'procurementV2/fetchPendingApprovalRequisitions',
  async () => {
    const response = await procurementApiV2.getPendingApprovalRequisitions()
    return response
  }
)

export const fetchMyRequisitions = createAsyncThunk(
  'procurementV2/fetchMyRequisitions',
  async () => {
    const response = await procurementApiV2.getMyRequisitions()
    return response
  }
)

export const createRequisition = createAsyncThunk(
  'procurementV2/createRequisition',
  async (payload: CreateRequisitionRequest) => {
    const response = await procurementApiV2.createRequisition(payload)
    return response.data
  }
)

export const submitRequisition = createAsyncThunk('procurementV2/submitRequisition', async (id: string) => {
  const response = await procurementApiV2.submitRequisition(id)
  return response.data
})

export const approveRequisition = createAsyncThunk('procurementV2/approveRequisition', async (id: string) => {
  const response = await procurementApiV2.approveRequisition(id)
  return response.data
})

export const rejectRequisition = createAsyncThunk(
  'procurementV2/rejectRequisition',
  async ({ id, rejectionReason }: { id: string; rejectionReason: string }) => {
    const response = await procurementApiV2.rejectRequisition(id, rejectionReason)
    return response.data
  }
)

// ============================================================================
// ASYNC THUNKS - SUITE 02: INVESTEE / APPLICANT
// ============================================================================

export const fetchInvesteeRequisitions = createAsyncThunk(
  'procurementV2/fetchInvesteeRequisitions',
  async () => {
    const response = await procurementApiV2.getInvesteeRequisitions()
    return response
  }
)

export const fetchSlaBreachedRequisitions = createAsyncThunk(
  'procurementV2/fetchSlaBreachedRequisitions',
  async () => {
    const response = await procurementApiV2.getInvesteeRequisitionsSlaBreached()
    return response
  }
)

export const fetchApplicantDrawdown = createAsyncThunk(
  'procurementV2/fetchApplicantDrawdown',
  async () => {
    const response = await procurementApiV2.getApplicantDrawdown()
    return response.data
  }
)

export const createApplicantRequisition = createAsyncThunk(
  'procurementV2/createApplicantRequisition',
  async (payload: CreateApplicantRequisitionRequest) => {
    const response = await procurementApiV2.createApplicantRequisition(payload)
    return response.data
  }
)

export const submitApplicantRequisition = createAsyncThunk(
  'procurementV2/submitApplicantRequisition',
  async (id: string) => {
    const response = await procurementApiV2.submitApplicantRequisition(id)
    return response.data
  }
)

export const cancelApplicantRequisition = createAsyncThunk(
  'procurementV2/cancelApplicantRequisition',
  async (id: string) => {
    const response = await procurementApiV2.cancelApplicantRequisition(id)
    return response.data
  }
)

// ============================================================================
// ASYNC THUNKS - RFQ
// ============================================================================

export const fetchRfqs = createAsyncThunk('procurementV2/fetchRfqs', async (filters?: RFQFilters) => {
  const response = await procurementApiV2.getRFQs(filters)
  return response
})

export const fetchRfqById = createAsyncThunk('procurementV2/fetchRfqById', async (rfqNumber: string) => {
  const response = await procurementApiV2.getRFQByNumber(rfqNumber)
  return response.data
})

export const createRfq = createAsyncThunk('procurementV2/createRfq', async (payload: CreateRFQRequest) => {
  const response = await procurementApiV2.createRFQ(payload)
  return response.data
})

// ============================================================================
// ASYNC THUNKS - QUOTATIONS
// ============================================================================

export const fetchQuotations = createAsyncThunk('procurementV2/fetchQuotations', async (filters?: QuotationFilters) => {
  const response = await procurementApiV2.getQuotations(filters)
  return response
})

export const fetchQuotationById = createAsyncThunk('procurementV2/fetchQuotationById', async (id: string) => {
  const response = await procurementApiV2.getQuotationById(id)
  return response.data
})

export const fetchQuotationsByRfq = createAsyncThunk('procurementV2/fetchQuotationsByRfq', async (rfqNumber: string) => {
  const response = await procurementApiV2.getQuotationsByRFQ(rfqNumber)
  return response
})

export const submitQuotation = createAsyncThunk(
  'procurementV2/submitQuotation',
  async (payload: SubmitQuotationRequest) => {
    const response = await procurementApiV2.submitQuotation(payload)
    return response.data
  }
)

export const acceptQuotation = createAsyncThunk(
  'procurementV2/acceptQuotation',
  async (id: string) => {
    const response = await procurementApiV2.acceptQuotation(id)
    return response.data
  }
)

export const rejectQuotation = createAsyncThunk(
  'procurementV2/rejectQuotation',
  async ({ id, rejectionReason, reviewNotes }: { id: string; rejectionReason: string; reviewNotes?: string }) => {
    const response = await procurementApiV2.rejectQuotation(id, { rejectionReason, reviewNotes })
    return response.data
  }
)

export const deleteQuotation = createAsyncThunk('procurementV2/deleteQuotation', async (id: string) => {
  await procurementApiV2.deleteQuotation(id)
  return id
})

// ============================================================================
// ASYNC THUNKS - PURCHASE ORDERS (Suite 04)
// ============================================================================

export const fetchPurchaseOrders = createAsyncThunk(
  'procurementV2/fetchPurchaseOrders',
  async (filters?: { status?: string; vendorId?: string; limit?: number; offset?: number }) => {
    const response = await procurementApiV2.getPurchaseOrders(filters)
    return response
  }
)

export const fetchPurchaseOrderById = createAsyncThunk('procurementV2/fetchPurchaseOrderById', async (id: string) => {
  const response = await procurementApiV2.getPurchaseOrderById(id)
  return response.data
})

export const createPurchaseOrder = createAsyncThunk(
  'procurementV2/createPurchaseOrder',
  async (payload: any) => {
    const response = await procurementApiV2.createPurchaseOrder(payload)
    return response.data
  }
)

export const sendPurchaseOrder = createAsyncThunk('procurementV2/sendPurchaseOrder', async (id: string) => {
  const response = await procurementApiV2.sendPurchaseOrder(id)
  return response.data
})

export const convertPOToBill = createAsyncThunk('procurementV2/convertPOToBill', async (id: string) => {
  const response = await procurementApiV2.convertToBill(id)
  return response.data
})

export const cancelPOLine = createAsyncThunk(
  'procurementV2/cancelPOLine',
  async ({ poId, lineId }: { poId: string; lineId: string }) => {
    const response = await procurementApiV2.cancelPOLine(poId, lineId)
    return response.data
  }
)

// ============================================================================
// ASYNC THUNKS - GOODS RECEIVED NOTES (Suite 05)
// ============================================================================

export const fetchGRNs = createAsyncThunk(
  'procurementV2/fetchGRNs',
  async (filters?: { poId?: string; status?: string; limit?: number; offset?: number }) => {
    const response = await procurementApiV2.getGRNs(filters)
    return response
  }
)

export const createGRN = createAsyncThunk('procurementV2/createGRN', async (payload: any) => {
  const response = await procurementApiV2.createGRN(payload)
  return response.data
})

// ============================================================================
// ASYNC THUNKS - INVOICES & PAYMENTS
// ============================================================================

export const fetchInvoices = createAsyncThunk(
  'procurementV2/fetchInvoices',
  async (params?: { status?: string; vendorId?: string; limit?: number; offset?: number }) => {
    const response = await procurementApiV2.getInvoices(params)
    return response
  }
)

export const approveInvoice = createAsyncThunk(
  'procurementV2/approveInvoice',
  async ({ id, approvalNotes }: { id: string; approvalNotes?: string }) => {
    const response = await procurementApiV2.approveInvoice(id, { approvalNotes })
    return response.data
  }
)

export const processInvoicePayment = createAsyncThunk(
  'procurementV2/processInvoicePayment',
  async ({ id, formData }: { id: string; formData: FormData }) => {
    const response = await procurementApiV2.processInvoicePayment(id, formData)
    return response.data
  }
)

export const fetchPayments = createAsyncThunk(
  'procurementV2/fetchPayments',
  async (params?: { status?: string; invoiceId?: string; limit?: number; offset?: number }) => {
    const response = await procurementApiV2.getPayments(params)
    return response
  }
)

// ============================================================================
// ASYNC THUNKS - RFQ ENHANCEMENTS (Suite 03)
// ============================================================================

export const getComparisonMatrix = createAsyncThunk('procurementV2/getComparisonMatrix', async (rfqId: string) => {
  const response = await procurementApiV2.getComparisonMatrix(rfqId)
  return response.data
})

export const awardRFQ = createAsyncThunk(
  'procurementV2/awardRFQ',
  async ({ rfqId, quotationId }: { rfqId: string; quotationId: string }) => {
    const response = await procurementApiV2.awardRFQ(rfqId, { quotationId })
    return response.data
  }
)

export const getRFQClarifications = createAsyncThunk('procurementV2/getRFQClarifications', async (rfqId: string) => {
  const response = await procurementApiV2.getRFQClarifications(rfqId)
  return response.data || []
})

export const postRFQClarification = createAsyncThunk(
  'procurementV2/postRFQClarification',
  async ({ rfqId, body, attachmentUrl }: { rfqId: string; body: string; attachmentUrl?: string }) => {
    const response = await procurementApiV2.postRFQClarification(rfqId, { body, attachmentUrl })
    return response.data
  }
)

export const extendRFQDeadline = createAsyncThunk(
  'procurementV2/extendRFQDeadline',
  async ({ rfqId, newDeadline }: { rfqId: string; newDeadline: string }) => {
    const response = await procurementApiV2.extendRFQDeadline(rfqId, { newDeadline })
    return response.data
  }
)

// ============================================================================
// ASYNC THUNKS - VENDOR MANAGEMENT (Suite 01)
// ============================================================================

export const fetchPendingVendors = createAsyncThunk('procurementV2/fetchPendingVendors', async () => {
  const response = await procurementApiV2.getPendingVendors()
  return response.data || []
})

export const approveVendorRegistration = createAsyncThunk('procurementV2/approveVendorRegistration', async (id: string) => {
  const response = await procurementApiV2.approveVendorRegistration(id)
  return response.data
})

export const blacklistVendor = createAsyncThunk(
  'procurementV2/blacklistVendor',
  async ({ id, reason }: { id: string; reason: string }) => {
    const response = await procurementApiV2.blacklistVendor(id, { reason })
    return response.data
  }
)

export const unblacklistVendor = createAsyncThunk(
  'procurementV2/unblacklistVendor',
  async ({ id, reason }: { id: string; reason: string }) => {
    const response = await procurementApiV2.unblacklistVendor(id, { reason })
    return response.data
  }
)

// ============================================================================
// SLICE
// ============================================================================

const procurementV2Slice = createSlice({
  name: 'procurementV2',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null
    },
    setRequisitionFilters: (state, action: PayloadAction<Partial<RequisitionFilters>>) => {
      state.filters.requisitions = { ...state.filters.requisitions, ...action.payload }
    },
    setRfqFilters: (state, action: PayloadAction<Partial<RFQFilters>>) => {
      state.filters.rfqs = { ...state.filters.rfqs, ...action.payload }
    },
    setQuotationFilters: (state, action: PayloadAction<Partial<QuotationFilters>>) => {
      state.filters.quotations = { ...state.filters.quotations, ...action.payload }
    },
    resetFilters: (state) => {
      state.filters = initialState.filters
    },
  },
  extraReducers: (builder) => {
    // Dashboard
    builder
      .addCase(fetchDashboard.pending, (state) => {
        state.dashboardLoading = true
        state.error = null
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.dashboardLoading = false
        if (action.payload) {
          state.dashboard = action.payload
        }
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.dashboardLoading = false
        state.error = action.error.message || 'Failed to fetch dashboard'
      })

    // Approval Configurations
    builder
      .addCase(fetchApprovalConfigs.pending, (state) => {
        state.approvalConfigsLoading = true
        state.error = null
      })
      .addCase(fetchApprovalConfigs.fulfilled, (state, action) => {
        state.approvalConfigsLoading = false
        if (action.payload) {
          state.approvalConfigs = action.payload
        }
      })
      .addCase(fetchApprovalConfigs.rejected, (state, action) => {
        state.approvalConfigsLoading = false
        state.error = action.error.message || 'Failed to fetch approval configurations'
      })
      .addCase(createApprovalConfig.fulfilled, (state, action) => {
        if (action.payload) {
          state.approvalConfigs.unshift(action.payload)
          state.successMessage = 'Approval configuration created successfully'
        }
      })
      .addCase(updateApprovalConfig.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.approvalConfigs.findIndex((c) => c.id === action.payload?.id)
          if (index !== -1) {
            state.approvalConfigs[index] = action.payload
          }
          state.successMessage = 'Approval configuration updated successfully'
        }
      })

    // Requisitions
    builder
      .addCase(fetchRequisitions.pending, (state) => {
        state.requisitionsLoading = true
        state.error = null
      })
      .addCase(fetchRequisitions.fulfilled, (state, action) => {
        state.requisitionsLoading = false
        if (action.payload.data) {
          state.requisitions = action.payload.data
        }
        state.requisitionsCount = action.payload.count || 0
      })
      .addCase(fetchRequisitions.rejected, (state, action) => {
        state.requisitionsLoading = false
        state.error = action.error.message || 'Failed to fetch requisitions'
      })
      .addCase(fetchRequisitionById.fulfilled, (state, action) => {
        if (action.payload) {
          state.currentRequisition = action.payload
        }
      })
      .addCase(fetchPendingApprovalRequisitions.fulfilled, (state, action) => {
        if (action.payload.data) {
          state.pendingApprovalRequisitions = action.payload.data
        }
        state.pendingApprovalCount = action.payload.count || 0
      })
      .addCase(fetchMyRequisitions.fulfilled, (state, action) => {
        if (action.payload.data) {
          state.myRequisitions = action.payload.data
        }
        state.myRequisitionsCount = action.payload.count || 0
      })
      .addCase(createRequisition.fulfilled, (state, action) => {
        if (action.payload) {
          state.requisitions.unshift(action.payload)
          state.successMessage = 'Requisition created successfully'
        }
      })
      .addCase(submitRequisition.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.requisitions.findIndex((r) => r.id === action.payload?.id)
          if (index !== -1) {
            state.requisitions[index] = action.payload
          }
          if (state.currentRequisition?.id === action.payload.id) {
            state.currentRequisition = action.payload
          }
          state.successMessage = 'Requisition submitted for approval'
        }
      })
      .addCase(approveRequisition.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.requisitions.findIndex((r) => r.id === action.payload?.id)
          if (index !== -1) {
            state.requisitions[index] = action.payload
          }
          state.pendingApprovalRequisitions = state.pendingApprovalRequisitions.filter((r) => r.id !== action.payload?.id)
          state.successMessage = 'Requisition approved successfully'
        }
      })
      .addCase(rejectRequisition.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.requisitions.findIndex((r) => r.id === action.payload?.id)
          if (index !== -1) {
            state.requisitions[index] = action.payload
          }
          state.pendingApprovalRequisitions = state.pendingApprovalRequisitions.filter((r) => r.id !== action.payload?.id)
          state.successMessage = 'Requisition rejected'
        }
      })

    // RFQs
    builder
      .addCase(fetchRfqs.pending, (state) => {
        state.rfqsLoading = true
        state.error = null
      })
      .addCase(fetchRfqs.fulfilled, (state, action) => {
        state.rfqsLoading = false
        if (action.payload.data) {
          state.rfqs = action.payload.data
        }
        state.rfqsCount = action.payload.count || 0
      })
      .addCase(fetchRfqs.rejected, (state, action) => {
        state.rfqsLoading = false
        state.error = action.error.message || 'Failed to fetch RFQs'
      })
      .addCase(fetchRfqById.fulfilled, (state, action) => {
        if (action.payload) {
          state.currentRfq = action.payload
        }
      })
      .addCase(createRfq.fulfilled, (state, action) => {
        if (action.payload) {
          state.rfqs.unshift(action.payload)
          state.successMessage = 'RFQ created and sent to vendors successfully'
        }
      })

    // Quotations
    builder
      .addCase(fetchQuotations.pending, (state) => {
        state.quotationsLoading = true
        state.error = null
      })
      .addCase(fetchQuotations.fulfilled, (state, action) => {
        state.quotationsLoading = false
        if (action.payload.data) {
          state.quotations = action.payload.data
        }
        state.quotationsCount = action.payload.count || 0
      })
      .addCase(fetchQuotations.rejected, (state, action) => {
        state.quotationsLoading = false
        state.error = action.error.message || 'Failed to fetch quotations'
      })
      .addCase(fetchQuotationById.fulfilled, (state, action) => {
        if (action.payload) {
          state.currentQuotation = action.payload
        }
      })
      .addCase(fetchQuotationsByRfq.fulfilled, (state, action) => {
        if (action.payload.data) {
          state.quotations = action.payload.data
        }
        state.quotationsCount = action.payload.count || 0
      })
      .addCase(submitQuotation.fulfilled, (state, action) => {
        if (action.payload) {
          state.quotations.unshift(action.payload)
          state.successMessage = 'Quotation submitted successfully'
        }
      })
      .addCase(acceptQuotation.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.quotations.findIndex((q) => q.id === action.payload?.id)
          if (index !== -1) {
            state.quotations[index] = action.payload
          }
          state.successMessage = 'Quotation accepted successfully'
        }
      })
      .addCase(rejectQuotation.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.quotations.findIndex((q) => q.id === action.payload?.id)
          if (index !== -1) {
            state.quotations[index] = action.payload
          }
          state.successMessage = 'Quotation rejected'
        }
      })
      .addCase(deleteQuotation.fulfilled, (state, action) => {
        state.quotations = state.quotations.filter((q) => q.id !== action.payload)
        state.successMessage = 'Quotation deleted successfully'
      })

    // Purchase Orders
    builder
      .addCase(fetchPurchaseOrders.pending, (state) => {
        state.purchaseOrdersLoading = true
        state.error = null
      })
      .addCase(fetchPurchaseOrders.fulfilled, (state, action) => {
        state.purchaseOrdersLoading = false
        if (action.payload.data) {
          state.purchaseOrders = action.payload.data
        }
        state.purchaseOrdersCount = action.payload.count || 0
      })
      .addCase(fetchPurchaseOrders.rejected, (state, action) => {
        state.purchaseOrdersLoading = false
        state.error = action.error.message || 'Failed to fetch purchase orders'
      })
      .addCase(fetchPurchaseOrderById.fulfilled, (state, action) => {
        if (action.payload) {
          state.currentPurchaseOrder = action.payload
        }
      })
      .addCase(createPurchaseOrder.fulfilled, (state, action) => {
        if (action.payload) {
          state.purchaseOrders.unshift(action.payload)
          state.successMessage = 'Purchase order created successfully'
        }
      })
      .addCase(sendPurchaseOrder.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.purchaseOrders.findIndex((po) => po.id === action.payload?.id)
          if (index !== -1) {
            state.purchaseOrders[index] = action.payload
          }
          if (state.currentPurchaseOrder?.id === action.payload.id) {
            state.currentPurchaseOrder = action.payload
          }
          state.successMessage = 'Purchase order sent successfully'
        }
      })
      .addCase(convertPOToBill.fulfilled, (state, action) => {
        if (action.payload) {
          state.invoices.unshift(action.payload)
          state.successMessage = 'Purchase order converted to bill successfully'
        }
      })
      .addCase(cancelPOLine.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.purchaseOrders.findIndex((po) => po.id === action.payload?.id)
          if (index !== -1) {
            state.purchaseOrders[index] = action.payload
          }
          state.successMessage = 'PO line cancelled successfully'
        }
      })

    // GRNs
    builder
      .addCase(fetchGRNs.pending, (state) => {
        state.grnsLoading = true
        state.error = null
      })
      .addCase(fetchGRNs.fulfilled, (state, action) => {
        state.grnsLoading = false
        if (action.payload.data) {
          state.grns = action.payload.data
        }
        state.grnsCount = action.payload.count || 0
      })
      .addCase(fetchGRNs.rejected, (state, action) => {
        state.grnsLoading = false
        state.error = action.error.message || 'Failed to fetch GRNs'
      })
      .addCase(createGRN.fulfilled, (state, action) => {
        if (action.payload) {
          state.grns.unshift(action.payload)
          state.successMessage = 'GRN created successfully'
        }
      })

    // Invoices & Payments
    builder
      .addCase(fetchInvoices.pending, (state) => {
        state.invoicesLoading = true
        state.error = null
      })
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.invoicesLoading = false
        if (action.payload.data) {
          state.invoices = action.payload.data
        }
        state.invoicesCount = action.payload.count || 0
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.invoicesLoading = false
        state.error = action.error.message || 'Failed to fetch invoices'
      })
      .addCase(approveInvoice.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.invoices.findIndex((inv) => inv.id === action.payload?.id)
          if (index !== -1) {
            state.invoices[index] = action.payload
          }
          state.successMessage = 'Invoice approved successfully'
        }
      })
      .addCase(processInvoicePayment.fulfilled, (state, action) => {
        if (action.payload) {
          state.payments.unshift(action.payload)
          state.successMessage = 'Payment processed successfully'
        }
      })
      .addCase(fetchPayments.pending, (state) => {
        state.paymentsLoading = true
        state.error = null
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.paymentsLoading = false
        if (action.payload.data) {
          state.payments = action.payload.data
        }
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.paymentsLoading = false
        state.error = action.error.message || 'Failed to fetch payments'
      })

    // RFQ Enhancements
    builder
      .addCase(getComparisonMatrix.fulfilled, (state, action) => {
        if (action.payload) {
          state.comparisonMatrix = action.payload
        }
      })
      .addCase(awardRFQ.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.rfqs.findIndex((rfq) => rfq.rfqNumber === action.payload?.rfqNumber)
          if (index !== -1) {
            state.rfqs[index] = action.payload
          }
          state.successMessage = 'RFQ awarded successfully'
        }
      })
      .addCase(getRFQClarifications.fulfilled, (state, action) => {
        if (action.payload) {
          state.rfqClarifications = action.payload
        }
      })
      .addCase(postRFQClarification.fulfilled, (state, action) => {
        if (action.payload && Array.isArray(state.rfqClarifications)) {
          state.rfqClarifications.push(action.payload)
        }
        state.successMessage = 'Clarification posted successfully'
      })
      .addCase(extendRFQDeadline.fulfilled, (state, action) => {
        if (action.payload && state.currentRfq) {
          state.currentRfq.rfqDeadline = action.payload.rfqDeadline
          state.successMessage = 'RFQ deadline extended successfully'
        }
      })

    // Vendor Management
    builder
      .addCase(fetchPendingVendors.pending, (state) => {
        state.pendingVendorsLoading = true
        state.error = null
      })
      .addCase(fetchPendingVendors.fulfilled, (state, action) => {
        state.pendingVendorsLoading = false
        if (Array.isArray(action.payload)) {
          state.pendingVendors = action.payload
        }
      })
      .addCase(fetchPendingVendors.rejected, (state, action) => {
        state.pendingVendorsLoading = false
        state.error = action.error.message || 'Failed to fetch pending vendors'
      })
      .addCase(approveVendorRegistration.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.pendingVendors.findIndex((v) => v.id === action.payload?.id)
          if (index !== -1) {
            state.pendingVendors.splice(index, 1)
          }
          state.successMessage = 'Vendor approved successfully'
        }
      })
      .addCase(blacklistVendor.fulfilled, (state, action) => {
        state.successMessage = 'Vendor blacklisted successfully'
      })
      .addCase(unblacklistVendor.fulfilled, (state, action) => {
        state.successMessage = 'Vendor unblacklisted successfully'
      })

    // Suite 02: Investee / Applicant
    builder
      .addCase(fetchInvesteeRequisitions.pending, (state) => {
        state.investeeRequisitionsLoading = true
        state.error = null
      })
      .addCase(fetchInvesteeRequisitions.fulfilled, (state, action) => {
        state.investeeRequisitionsLoading = false
        if (action.payload.data) {
          state.investeeRequisitions = action.payload.data
        }
        state.investeeRequisitionsCount = action.payload.count || 0
      })
      .addCase(fetchInvesteeRequisitions.rejected, (state, action) => {
        state.investeeRequisitionsLoading = false
        state.error = action.error.message || 'Failed to fetch investee requisitions'
      })
      .addCase(fetchSlaBreachedRequisitions.fulfilled, (state, action) => {
        if (action.payload.data) {
          state.slaBreachedRequisitions = action.payload.data
        }
      })
      .addCase(fetchApplicantDrawdown.pending, (state) => {
        state.applicantRequisitionsLoading = true
        state.error = null
      })
      .addCase(fetchApplicantDrawdown.fulfilled, (state, action) => {
        state.applicantRequisitionsLoading = false
        if (action.payload) {
          state.applicantDrawdown = action.payload
          state.applicantRequisitions = action.payload.requisitions || []
        }
      })
      .addCase(fetchApplicantDrawdown.rejected, (state, action) => {
        state.applicantRequisitionsLoading = false
        state.error = action.error.message || 'Failed to fetch applicant drawdown'
      })
      .addCase(createApplicantRequisition.fulfilled, (state, action) => {
        if (action.payload) {
          state.applicantRequisitions.unshift(action.payload)
          state.successMessage = 'Drawdown request created successfully'
        }
      })
      .addCase(submitApplicantRequisition.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.applicantRequisitions.findIndex((r) => r.id === action.payload?.id)
          if (index !== -1) {
            state.applicantRequisitions[index] = action.payload
          }
          state.successMessage = 'Request submitted for VC review'
        }
      })
      .addCase(cancelApplicantRequisition.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.applicantRequisitions.findIndex((r) => r.id === action.payload?.id)
          if (index !== -1) {
            state.applicantRequisitions[index] = action.payload
          }
          state.successMessage = 'Request cancelled'
        }
      })
  },
})

// ============================================================================
// EXPORTS
// ============================================================================

// Selectors
import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '../store'

export const selectProcurementState = (state: RootState) => state.procurementV2
export const selectDashboard = createSelector(selectProcurementState, (state) => state.dashboard)
export const selectAllRequisitions = createSelector(selectProcurementState, (state) => state.requisitions)
export const selectMyRequisitions = createSelector(selectProcurementState, (state) => state.myRequisitions)
export const selectPendingApprovalRequisitions = createSelector(selectProcurementState, (state) => state.pendingApprovalRequisitions)
export const selectAllRFQs = createSelector(selectProcurementState, (state) => state.rfqs)
export const selectAllQuotations = createSelector(selectProcurementState, (state) => state.quotations)
export const selectQuotationsState = createSelector(selectProcurementState, (state) => ({
  quotations: state.quotations,
  quotationsCount: state.quotationsCount,
  quotationsLoading: state.quotationsLoading,
  error: state.error,
}))
export const selectRFQsState = createSelector(selectProcurementState, (state) => ({
  rfqs: state.rfqs,
  rfqsCount: state.rfqsCount,
  rfqsLoading: state.rfqsLoading,
  error: state.error,
}))
export const selectRequisitionsState = createSelector(selectProcurementState, (state) => ({
  requisitions: state.requisitions,
  requisitionsCount: state.requisitionsCount,
  requisitionsLoading: state.requisitionsLoading,
  myRequisitions: state.myRequisitions,
  myRequisitionsCount: state.myRequisitionsCount,
  pendingApprovalRequisitions: state.pendingApprovalRequisitions,
  pendingApprovalCount: state.pendingApprovalCount,
  error: state.error,
}))
export const selectPurchaseOrdersState = createSelector(selectProcurementState, (state) => ({
  purchaseOrders: state.purchaseOrders,
  purchaseOrdersCount: state.purchaseOrdersCount,
  purchaseOrdersLoading: state.purchaseOrdersLoading,
  currentPurchaseOrder: state.currentPurchaseOrder,
  error: state.error,
}))
export const selectGRNsState = createSelector(selectProcurementState, (state) => ({
  grns: state.grns,
  grnsCount: state.grnsCount,
  grnsLoading: state.grnsLoading,
  error: state.error,
}))
export const selectInvoicesState = createSelector(selectProcurementState, (state) => ({
  invoices: state.invoices,
  invoicesCount: state.invoicesCount,
  invoicesLoading: state.invoicesLoading,
  payments: state.payments,
  paymentsLoading: state.paymentsLoading,
  error: state.error,
}))
export const selectVendorsState = createSelector(selectProcurementState, (state) => ({
  pendingVendors: state.pendingVendors,
  pendingVendorsLoading: state.pendingVendorsLoading,
  error: state.error,
}))
export const selectRFQEnhancementsState = createSelector(selectProcurementState, (state) => ({
  comparisonMatrix: state.comparisonMatrix,
  rfqClarifications: state.rfqClarifications,
}))


export const {
  clearError,
  clearSuccessMessage,
  setRequisitionFilters,
  setRfqFilters,
  setQuotationFilters,
  resetFilters,
} = procurementV2Slice.actions

export default procurementV2Slice.reducer
