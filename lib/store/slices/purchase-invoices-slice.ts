import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { accountingApi, PurchaseInvoice, CreatePurchaseInvoiceRequest, UpdatePurchaseInvoiceRequest, SubmitPurchaseInvoiceRequest, PayPurchaseInvoiceRequest, PurchaseInvoicesResponse } from '@/lib/api/accounting-api'

// Async thunks
export const fetchPurchaseInvoices = createAsyncThunk(
  'purchaseInvoices/fetchPurchaseInvoices',
  async (params?: {
    page?: number
    limit?: number
    status?: 'DRAFT' | 'POSTED'
    paymentStatus?: 'PENDING' | 'PAID'
    search?: string
    vendorId?: string
    currencyId?: string
    startDate?: string
    endDate?: string
  }) => {
    const response = await accountingApi.getPurchaseInvoices(params)
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch purchase invoices')
    }
    return response.data
  }
)

export const fetchPurchaseInvoiceById = createAsyncThunk(
  'purchaseInvoices/fetchPurchaseInvoiceById',
  async (id: string) => {
    const response = await accountingApi.getPurchaseInvoiceById(id)
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch purchase invoice')
    }
    return response.data
  }
)

export const createPurchaseInvoice = createAsyncThunk(
  'purchaseInvoices/createPurchaseInvoice',
  async (data: CreatePurchaseInvoiceRequest) => {
    const response = await accountingApi.createPurchaseInvoice(data)
    if (!response.success) {
      throw new Error(response.error || 'Failed to create purchase invoice')
    }
    return response.data
  }
)

export const updatePurchaseInvoice = createAsyncThunk(
  'purchaseInvoices/updatePurchaseInvoice',
  async ({ id, data }: { id: string; data: UpdatePurchaseInvoiceRequest }) => {
    const response = await accountingApi.updatePurchaseInvoice(id, data)
    if (!response.success) {
      throw new Error(response.error || 'Failed to update purchase invoice')
    }
    return response.data
  }
)

export const submitPurchaseInvoice = createAsyncThunk(
  'purchaseInvoices/submitPurchaseInvoice',
  async ({ id, data }: { id: string; data: SubmitPurchaseInvoiceRequest }) => {
    const response = await accountingApi.submitPurchaseInvoice(id, data)
    if (!response.success) {
      throw new Error(response.error || 'Failed to submit purchase invoice')
    }
    return response.data
  }
)

export const payPurchaseInvoice = createAsyncThunk(
  'purchaseInvoices/payPurchaseInvoice',
  async ({ id, data }: { id: string; data: PayPurchaseInvoiceRequest }) => {
    const response = await accountingApi.payPurchaseInvoice(id, data)
    if (!response.success) {
      throw new Error(response.error || 'Failed to pay purchase invoice')
    }
    return response.data
  }
)

interface PurchaseInvoicesState {
  purchaseInvoices: PurchaseInvoice[]
  selectedPurchaseInvoice: PurchaseInvoice | null
  loading: boolean
  error: string | null
  filters: {
    status?: 'DRAFT' | 'POSTED'
    paymentStatus?: 'PENDING' | 'PAID'
    search?: string
    vendorId?: string
    currencyId?: string
    startDate?: string
    endDate?: string
  }
  stats: {
    total: number
    draft: number
    posted: number
    pending: number
    paid: number
    totalAmount: number
    draftAmount: number
    postedAmount: number
    pendingAmount: number
    paidAmount: number
  }
  pagination: {
    page: number
    limit: number
    totalPages: number
    total: number
  }
}

const initialState: PurchaseInvoicesState = {
  purchaseInvoices: [],
  selectedPurchaseInvoice: null,
  loading: false,
  error: null,
  filters: {},
  stats: {
    total: 0,
    draft: 0,
    posted: 0,
    pending: 0,
    paid: 0,
    totalAmount: 0,
    draftAmount: 0,
    postedAmount: 0,
    pendingAmount: 0,
    paidAmount: 0
  },
  pagination: {
    page: 1,
    limit: 10,
    totalPages: 0,
    total: 0
  }
}

const purchaseInvoicesSlice = createSlice({
  name: 'purchaseInvoices',
  initialState,
  reducers: {
    setPurchaseInvoiceFilters: (state, action: PayloadAction<any>) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearPurchaseInvoiceFilters: (state) => {
      state.filters = {}
    },
    setSelectedPurchaseInvoice: (state, action: PayloadAction<PurchaseInvoice | null>) => {
      state.selectedPurchaseInvoice = action.payload
    },
    clearPurchaseInvoiceError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    // Fetch purchase invoices
    builder
      .addCase(fetchPurchaseInvoices.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchPurchaseInvoices.fulfilled, (state, action: PayloadAction<PurchaseInvoicesResponse>) => {
        state.loading = false
        state.purchaseInvoices = action.payload.invoices
        state.pagination = {
          page: action.payload.page,
          limit: 10,
          totalPages: action.payload.totalPages,
          total: action.payload.total
        }
        
        // Calculate stats
        const invoices = action.payload.invoices
        state.stats = {
          total: invoices.length,
          draft: invoices.filter(i => i.status === 'DRAFT').length,
          posted: invoices.filter(i => i.status === 'POSTED').length,
          pending: invoices.filter(i => i.paymentStatus === 'PENDING').length,
          paid: invoices.filter(i => i.paymentStatus === 'PAID').length,
          totalAmount: invoices.reduce((sum, i) => sum + parseFloat(i.totalAmount), 0),
          draftAmount: invoices.filter(i => i.status === 'DRAFT').reduce((sum, i) => sum + parseFloat(i.totalAmount), 0),
          postedAmount: invoices.filter(i => i.status === 'POSTED').reduce((sum, i) => sum + parseFloat(i.totalAmount), 0),
          pendingAmount: invoices.filter(i => i.paymentStatus === 'PENDING').reduce((sum, i) => sum + parseFloat(i.totalAmount), 0),
          paidAmount: invoices.filter(i => i.paymentStatus === 'PAID').reduce((sum, i) => sum + parseFloat(i.totalAmount), 0)
        }
      })
      .addCase(fetchPurchaseInvoices.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch purchase invoices'
      })

    // Fetch single purchase invoice
    builder
      .addCase(fetchPurchaseInvoiceById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchPurchaseInvoiceById.fulfilled, (state, action: PayloadAction<PurchaseInvoice>) => {
        state.loading = false
        state.selectedPurchaseInvoice = action.payload
        
        // Update in list if exists
        const index = state.purchaseInvoices.findIndex(i => i.id === action.payload.id)
        if (index !== -1) {
          state.purchaseInvoices[index] = action.payload
        }
      })
      .addCase(fetchPurchaseInvoiceById.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch purchase invoice'
      })

    // Create purchase invoice
    builder
      .addCase(createPurchaseInvoice.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createPurchaseInvoice.fulfilled, (state, action: PayloadAction<PurchaseInvoice>) => {
        state.loading = false
        state.purchaseInvoices.unshift(action.payload)
        state.stats.total += 1
        state.stats.draft += 1
      })
      .addCase(createPurchaseInvoice.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to create purchase invoice'
      })

    // Update purchase invoice
    builder
      .addCase(updatePurchaseInvoice.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updatePurchaseInvoice.fulfilled, (state, action: PayloadAction<PurchaseInvoice>) => {
        state.loading = false
        const index = state.purchaseInvoices.findIndex(i => i.id === action.payload.id)
        if (index !== -1) {
          state.purchaseInvoices[index] = action.payload
        }
        if (state.selectedPurchaseInvoice?.id === action.payload.id) {
          state.selectedPurchaseInvoice = action.payload
        }
      })
      .addCase(updatePurchaseInvoice.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to update purchase invoice'
      })

    // Submit purchase invoice
    builder
      .addCase(submitPurchaseInvoice.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(submitPurchaseInvoice.fulfilled, (state, action: PayloadAction<PurchaseInvoice>) => {
        state.loading = false
        const index = state.purchaseInvoices.findIndex(i => i.id === action.payload.id)
        if (index !== -1) {
          state.purchaseInvoices[index] = action.payload
        }
        if (state.selectedPurchaseInvoice?.id === action.payload.id) {
          state.selectedPurchaseInvoice = action.payload
        }
      })
      .addCase(submitPurchaseInvoice.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to submit purchase invoice'
      })

    // Pay purchase invoice
    builder
      .addCase(payPurchaseInvoice.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(payPurchaseInvoice.fulfilled, (state, action: PayloadAction<PurchaseInvoice>) => {
        state.loading = false
        const index = state.purchaseInvoices.findIndex(i => i.id === action.payload.id)
        if (index !== -1) {
          state.purchaseInvoices[index] = action.payload
        }
        if (state.selectedPurchaseInvoice?.id === action.payload.id) {
          state.selectedPurchaseInvoice = action.payload
        }
      })
      .addCase(payPurchaseInvoice.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to pay purchase invoice'
      })
  }
})

export const {
  setPurchaseInvoiceFilters,
  clearPurchaseInvoiceFilters,
  setSelectedPurchaseInvoice,
  clearPurchaseInvoiceError
} = purchaseInvoicesSlice.actions

export default purchaseInvoicesSlice.reducer
