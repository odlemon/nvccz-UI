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
// ASYNC THUNKS - PURCHASE ORDERS (Phase 2 - To be implemented later)
// ============================================================================

// export const fetchPurchaseOrders = createAsyncThunk(
//   'procurementV2/fetchPurchaseOrders',
//   async (filters?: PurchaseOrderFilters) => {
//     const response = await procurementApiV2.getPurchaseOrders(filters)
//     return response
//   }
// )

// export const fetchPurchaseOrderById = createAsyncThunk('procurementV2/fetchPurchaseOrderById', async (id: string) => {
//   const response = await procurementApiV2.getPurchaseOrderById(id)
//   return response.data
// })

// export const createPurchaseOrder = createAsyncThunk(
//   'procurementV2/createPurchaseOrder',
//   async (payload: CreatePurchaseOrderRequest) => {
//     const response = await procurementApiV2.createPurchaseOrder(payload)
//     return response.data
//   }
// )

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

    // Purchase Orders (Phase 2 - To be implemented later)
    // builder
    //   .addCase(fetchPurchaseOrders.pending, (state) => {
    //     state.purchaseOrdersLoading = true
    //     state.error = null
    //   })
    //   .addCase(fetchPurchaseOrders.fulfilled, (state, action) => {
    //     state.purchaseOrdersLoading = false
    //     state.purchaseOrders = action.payload.data
    //     state.purchaseOrdersCount = action.payload.data.length
    //   })
    //   .addCase(fetchPurchaseOrders.rejected, (state, action) => {
    //     state.purchaseOrdersLoading = false
    //     state.error = action.error.message || 'Failed to fetch purchase orders'
    //   })
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


export const {
  clearError,
  clearSuccessMessage,
  setRequisitionFilters,
  setRfqFilters,
  setQuotationFilters,
  resetFilters,
} = procurementV2Slice.actions

export default procurementV2Slice.reducer
