import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { cashbookApi, type FiscalCalendarResponse, type FiscalLockDraftItem, type FiscalPolicy, type FiscalAuditEntry } from '@/lib/api/cashbook-api'

interface CashbookState {
  // Entry Types
  entryTypes: any[]
  entryTypesLoading: boolean
  entryTypesError: string | null

  // Period Lockout
  periods: any[]
  periodsLoading: boolean
  periodsError: string | null
  periodStatus: any | null

  // Fiscal Calendar
  fiscalCalendar: FiscalCalendarResponse | null
  fiscalCalendarLoading: boolean
  fiscalCalendarError: string | null
  fiscalAuditLog: FiscalAuditEntry[]
  fiscalAuditLoading: boolean

  // Contra Entries
  contraConfigs: any[]
  contraConfigsLoading: boolean
  contraConfigsError: string | null
}

const initialState: CashbookState = {
  entryTypes: [],
  entryTypesLoading: false,
  entryTypesError: null,

  periods: [],
  periodsLoading: false,
  periodsError: null,
  periodStatus: null,

  fiscalCalendar: null,
  fiscalCalendarLoading: false,
  fiscalCalendarError: null,
  fiscalAuditLog: [],
  fiscalAuditLoading: false,

  contraConfigs: [],
  contraConfigsLoading: false,
  contraConfigsError: null,
}

// Entry Types Thunks
export const fetchEntryTypes = createAsyncThunk(
  'cashbook/fetchEntryTypes',
  async (filters?: { transactionType?: string; isActive?: boolean }) => {
    const response = await cashbookApi.getEntryTypes(filters)
    // Handle response structure: response.data or response.message
    return Array.isArray(response.data) 
      ? response.data 
      : Array.isArray(response.message) 
        ? response.message 
        : []
  }
)

export const createEntryType = createAsyncThunk(
  'cashbook/createEntryType',
  async (data: any) => {
    const response = await cashbookApi.createEntryType(data)
    return response.data || response.message
  }
)

export const updateEntryType = createAsyncThunk(
  'cashbook/updateEntryType',
  async ({ id, data }: { id: string; data: any }) => {
    const response = await cashbookApi.updateEntryType(id, data)
    return response.data || response.message
  }
)

export const deleteEntryType = createAsyncThunk(
  'cashbook/deleteEntryType',
  async (id: string) => {
    await cashbookApi.deleteEntryType(id)
    return id
  }
)

// Period Lockout Thunks
export const fetchPeriods = createAsyncThunk(
  'cashbook/fetchPeriods',
  async (filters?: { year?: number; isLocked?: boolean }) => {
    const response = await cashbookApi.getPeriods(filters)
    // Handle response structure
    return Array.isArray(response.data) 
      ? response.data 
      : Array.isArray(response.message) 
        ? response.message 
        : []
  }
)

export const lockPeriod = createAsyncThunk(
  'cashbook/lockPeriod',
  async (data: { period: string; isLocked: boolean; reason?: string }) => {
    const response = await cashbookApi.lockPeriod(data)
    return response.data || response.message
  }
)

export const fetchPeriodStatus = createAsyncThunk(
  'cashbook/fetchPeriodStatus',
  async (period: string) => {
    const response = await cashbookApi.getPeriodStatus(period)
    return response.data || response.message
  }
)

// Fiscal Calendar Thunks
export const fetchFiscalCalendar = createAsyncThunk(
  'cashbook/fetchFiscalCalendar',
  async () => {
    const response = await cashbookApi.getFiscalCalendar()
    return response.data
  }
)

export const saveLocksDraft = createAsyncThunk(
  'cashbook/saveLocksDraft',
  async (draft: FiscalLockDraftItem[]) => {
    const response = await cashbookApi.saveLocksDraft(draft)
    return response.data
  }
)

export const commitLocks = createAsyncThunk(
  'cashbook/commitLocks',
  async (reason?: string) => {
    const response = await cashbookApi.commitLocks(reason)
    return response.data
  }
)

export const updateFiscalPolicy = createAsyncThunk(
  'cashbook/updateFiscalPolicy',
  async (policy: Partial<FiscalPolicy>) => {
    const response = await cashbookApi.updateFiscalPolicy(policy)
    return response.data
  }
)

export const fetchFiscalAuditLog = createAsyncThunk(
  'cashbook/fetchFiscalAuditLog',
  async (params?: { take?: number; skip?: number }) => {
    const response = await cashbookApi.getFiscalAuditLog(params)
    return Array.isArray(response.data) ? response.data : []
  }
)

// Contra Entry Thunks
export const fetchContraConfigs = createAsyncThunk(
  'cashbook/fetchContraConfigs',
  async (filters?: { entryType?: string; glAccountId?: string; isEnabled?: boolean }) => {
    const response = await cashbookApi.getContraConfigs(filters)
    // Handle response structure
    return Array.isArray(response.data) 
      ? response.data 
      : Array.isArray(response.message) 
        ? response.message 
        : []
  }
)

export const configureContraEntry = createAsyncThunk(
  'cashbook/configureContraEntry',
  async (data: any) => {
    const response = await cashbookApi.configureContraEntry(data)
    return response.data || response.message
  }
)

export const updateContraConfig = createAsyncThunk(
  'cashbook/updateContraConfig',
  async ({ id, data }: { id: string; data: any }) => {
    const response = await cashbookApi.updateContraConfig(id, data)
    return response.data || response.message
  }
)

export const deleteContraConfig = createAsyncThunk(
  'cashbook/deleteContraConfig',
  async (id: string) => {
    await cashbookApi.deleteContraConfig(id)
    return id
  }
)

const cashbookSlice = createSlice({
  name: 'cashbook',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Entry Types
    builder
      .addCase(fetchEntryTypes.pending, (state) => {
        state.entryTypesLoading = true
        state.entryTypesError = null
      })
      .addCase(fetchEntryTypes.fulfilled, (state, action) => {
        state.entryTypesLoading = false
        state.entryTypes = Array.isArray(action.payload) ? action.payload : []
      })
      .addCase(fetchEntryTypes.rejected, (state, action) => {
        state.entryTypesLoading = false
        state.entryTypesError = action.error.message || 'Failed to fetch entry types'
        state.entryTypes = []
      })
      .addCase(createEntryType.fulfilled, (state, action) => {
        if (action.payload && action.payload.id) {
          state.entryTypes.push(action.payload)
        }
      })
      .addCase(updateEntryType.fulfilled, (state, action) => {
        if (action.payload && action.payload.id) {
          const index = state.entryTypes.findIndex(et => et.id === action.payload.id)
          if (index !== -1) {
            state.entryTypes[index] = action.payload
          }
        }
      })
      .addCase(deleteEntryType.fulfilled, (state, action) => {
        state.entryTypes = state.entryTypes.filter(et => et.id !== action.payload)
      })

    // Period Lockout
    builder
      .addCase(fetchPeriods.pending, (state) => {
        state.periodsLoading = true
        state.periodsError = null
      })
      .addCase(fetchPeriods.fulfilled, (state, action) => {
        state.periodsLoading = false
        state.periods = Array.isArray(action.payload) ? action.payload : []
      })
      .addCase(fetchPeriods.rejected, (state, action) => {
        state.periodsLoading = false
        state.periodsError = action.error.message || 'Failed to fetch periods'
        state.periods = []
      })
      .addCase(lockPeriod.fulfilled, (state, action) => {
        if (action.payload && action.payload.id) {
          const index = state.periods.findIndex(p => p.id === action.payload.id)
          if (index !== -1) {
            state.periods[index] = action.payload
          } else {
            state.periods.push(action.payload)
          }
        }
      })
      .addCase(fetchPeriodStatus.fulfilled, (state, action) => {
        state.periodStatus = action.payload
      })

    // Fiscal Calendar
    builder
      .addCase(fetchFiscalCalendar.pending, (state) => {
        state.fiscalCalendarLoading = true
        state.fiscalCalendarError = null
      })
      .addCase(fetchFiscalCalendar.fulfilled, (state, action) => {
        state.fiscalCalendarLoading = false
        state.fiscalCalendar = action.payload || null
      })
      .addCase(fetchFiscalCalendar.rejected, (state, action) => {
        state.fiscalCalendarLoading = false
        state.fiscalCalendarError = action.error.message || 'Failed to fetch fiscal calendar'
      })

    // Fiscal Audit Log
    builder
      .addCase(fetchFiscalAuditLog.pending, (state) => {
        state.fiscalAuditLoading = true
      })
      .addCase(fetchFiscalAuditLog.fulfilled, (state, action) => {
        state.fiscalAuditLoading = false
        state.fiscalAuditLog = Array.isArray(action.payload) ? action.payload : []
      })
      .addCase(fetchFiscalAuditLog.rejected, (state) => {
        state.fiscalAuditLoading = false
      })

    // Contra Entries
    builder
      .addCase(fetchContraConfigs.pending, (state) => {
        state.contraConfigsLoading = true
        state.contraConfigsError = null
      })
      .addCase(fetchContraConfigs.fulfilled, (state, action) => {
        state.contraConfigsLoading = false
        state.contraConfigs = Array.isArray(action.payload) ? action.payload : []
      })
      .addCase(fetchContraConfigs.rejected, (state, action) => {
        state.contraConfigsLoading = false
        state.contraConfigsError = action.error.message || 'Failed to fetch contra configs'
        state.contraConfigs = []
      })
      .addCase(configureContraEntry.fulfilled, (state, action) => {
        if (action.payload && action.payload.id) {
          const index = state.contraConfigs.findIndex(c => c.id === action.payload.id)
          if (index !== -1) {
            state.contraConfigs[index] = action.payload
          } else {
            state.contraConfigs.push(action.payload)
          }
        }
      })
      .addCase(deleteContraConfig.fulfilled, (state, action) => {
        state.contraConfigs = state.contraConfigs.filter(c => c.id !== action.payload)
      })
  },
})

export default cashbookSlice.reducer
