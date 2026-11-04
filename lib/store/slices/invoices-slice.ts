import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { accountingApi, Invoice, Customer, CreateInvoiceRequest, MarkAsPaidRequest, VoidInvoiceRequest, InvoicesResponse } from '@/lib/api/accounting-api'

interface InvoicesState {
  invoices: Invoice[]
  customers: Customer[]
  selectedInvoice: Invoice | null
  loading: boolean
  customersLoading: boolean
  error: string | null
  activeFetchId: string | null
  filters: Record<string, any>
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  stats: {
    total: number
    draft: number
    sent: number
    paid: number
    void: number
    totalAmount: number
    draftAmount: number
    sentAmount: number
    paidAmount: number
    voidAmount: number
  }
}

const initialState: InvoicesState = {
  invoices: [],
  customers: [],
  selectedInvoice: null,
  loading: false,
  customersLoading: false,
  error: null,
  activeFetchId: null,
  filters: {},
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  },
  stats: {
    total: 0,
    draft: 0,
    sent: 0,
    paid: 0,
    void: 0,
    totalAmount: 0,
    draftAmount: 0,
    sentAmount: 0,
    paidAmount: 0,
    voidAmount: 0
  }
}

// Async thunks
export const fetchInvoices = createAsyncThunk(
  'invoices/fetchInvoices',
  async (filters?: Record<string, any>) => {
    const response = await accountingApi.getInvoices(filters)
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch invoices')
    }
    return response.data
  }
)

export const fetchCustomers = createAsyncThunk(
  'invoices/fetchCustomers',
  async () => {
    const response = await accountingApi.getCustomers({ limit: 10000 })
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch customers')
    }
    return response.data.customers
  }
)

export const createInvoice = createAsyncThunk(
  'invoices/createInvoice',
  async (data: CreateInvoiceRequest) => {
    const response = await accountingApi.createInvoice(data)
    if (!response.success) {
      throw new Error(response.message || 'Failed to create invoice')
    }
    return response.data
  }
)

export const updateInvoice = createAsyncThunk(
  'invoices/updateInvoice',
  async ({ id, data }: { id: string; data: Partial<CreateInvoiceRequest> }) => {
    const response = await accountingApi.updateInvoice(id, data as CreateInvoiceRequest)
    if (!response.success) {
      throw new Error(response.message || 'Failed to update invoice')
    }
    return response.data
  }
)

export const sendInvoice = createAsyncThunk(
  'invoices/sendInvoice',
  async (id: string) => {
    const response = await accountingApi.sendInvoice(id)
    if (!response.success) {
      throw new Error(response.message || 'Failed to send invoice')
    }
    return response.data
  }
)

export const markInvoiceAsPaid = createAsyncThunk(
  'invoices/markInvoiceAsPaid',
  async ({ id, data }: { id: string; data: MarkAsPaidRequest }) => {
    const response = await accountingApi.markInvoiceAsPaid(id, data)
    if (!response.success) {
      throw new Error(response.message || 'Failed to mark invoice as paid')
    }
    return response.data
  }
)

export const voidInvoice = createAsyncThunk(
  'invoices/voidInvoice',
  async ({ id, data }: { id: string; data: VoidInvoiceRequest }) => {
    const response = await accountingApi.voidInvoice(id, data)
    if (!response.success) {
      throw new Error(response.message || 'Failed to void invoice')
    }
    return response.data
  }
)

export const fetchInvoiceById = createAsyncThunk(
  'invoices/fetchInvoiceById',
  async (id: string) => {
    const response = await accountingApi.getInvoiceById(id)
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch invoice')
    }
    return response.data
  }
)

const invoicesSlice = createSlice({
  name: 'invoices',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Record<string, any>>) => {
      state.filters = action.payload
    },
    clearFilters: (state) => {
      state.filters = {}
    },
    setSelectedInvoice: (state, action: PayloadAction<Invoice | null>) => {
      state.selectedInvoice = action.payload
    },
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch invoices
      .addCase(fetchInvoices.pending, (state, action) => {
        state.loading = true
        state.error = null
        state.activeFetchId = action.meta.requestId
      })
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        if (state.activeFetchId !== action.meta.requestId) return
        if (!action.payload) return
        state.loading = false
        state.activeFetchId = null
        state.invoices = action.payload.invoices
        state.pagination = {
          total: action.payload.total,
          page: action.payload.page,
          limit: action.payload.limit,
          totalPages: action.payload.totalPages
        }
        
        // Calculate stats
        const stats = action.payload.invoices.reduce((acc, invoice) => {
          acc.total++
          const amount = parseFloat(invoice.totalAmount)
          acc.totalAmount += amount

          switch (invoice.status) {
            case 'DRAFT':
              acc.draft++
              acc.draftAmount += amount
              break
            case 'SENT':
              acc.sent++
              acc.sentAmount += amount
              break
            case 'PAID':
              acc.paid++
              acc.paidAmount += amount
              break
            case 'VOID':
              acc.void++
              acc.voidAmount += amount
              break
          }
          return acc
        }, {
          total: 0,
          draft: 0,
          sent: 0,
          paid: 0,
          void: 0,
          totalAmount: 0,
          draftAmount: 0,
          sentAmount: 0,
          paidAmount: 0,
          voidAmount: 0
        })
        
        state.stats = stats
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        if (state.activeFetchId !== action.meta.requestId) return
        state.loading = false
        state.activeFetchId = null
        state.error = action.error.message || 'Failed to fetch invoices'
      })
      
      // Fetch customers
      .addCase(fetchCustomers.pending, (state) => {
        state.customersLoading = true
        state.error = null
      })
      .addCase(fetchCustomers.fulfilled, (state, action: PayloadAction<Customer[]>) => {
        state.customersLoading = false
        state.customers = action.payload
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.customersLoading = false
        state.error = action.error.message || 'Failed to fetch customers'
      })
      
      // Create invoice
      .addCase(createInvoice.fulfilled, (state, action: PayloadAction<Invoice>) => {
        state.invoices.unshift(action.payload)
        state.stats.total++
        state.stats.draft++
      })
      
      // Update invoice
      .addCase(updateInvoice.fulfilled, (state, action: PayloadAction<Invoice>) => {
        const index = state.invoices.findIndex(inv => inv.id === action.payload.id)
        if (index !== -1) {
          state.invoices[index] = action.payload
        }
        if (state.selectedInvoice?.id === action.payload.id) {
          state.selectedInvoice = action.payload
        }
      })
      
      // Send invoice
      .addCase(sendInvoice.fulfilled, (state, action: PayloadAction<Invoice>) => {
        const index = state.invoices.findIndex(inv => inv.id === action.payload.id)
        if (index !== -1) {
          state.invoices[index] = action.payload
        }
        if (state.selectedInvoice?.id === action.payload.id) {
          state.selectedInvoice = action.payload
        }
      })
      
      // Mark as paid
      .addCase(markInvoiceAsPaid.fulfilled, (state, action: PayloadAction<Invoice>) => {
        const index = state.invoices.findIndex(inv => inv.id === action.payload.id)
        if (index !== -1) {
          state.invoices[index] = action.payload
        }
        if (state.selectedInvoice?.id === action.payload.id) {
          state.selectedInvoice = action.payload
        }
      })
      
      // Void invoice
      .addCase(voidInvoice.fulfilled, (state, action: PayloadAction<Invoice>) => {
        const index = state.invoices.findIndex(inv => inv.id === action.payload.id)
        if (index !== -1) {
          state.invoices[index] = action.payload
        }
        if (state.selectedInvoice?.id === action.payload.id) {
          state.selectedInvoice = action.payload
        }
      })
      
      // Fetch invoice by ID
      .addCase(fetchInvoiceById.fulfilled, (state, action: PayloadAction<Invoice>) => {
        state.selectedInvoice = action.payload
        const index = state.invoices.findIndex(inv => inv.id === action.payload.id)
        if (index !== -1) {
          state.invoices[index] = action.payload
        }
      })
  }
})

export const { setFilters, clearFilters, setSelectedInvoice, clearError } = invoicesSlice.actions
export default invoicesSlice.reducer
