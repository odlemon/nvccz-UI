import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import * as stiApi from '@/lib/api/short-term-investments-api'
import type {
  STISettings,
  STIInstrument,
  STIDashboard,
  RateEntry,
  AccrualEntry,
  AuditTrailEntry,
} from '@/lib/api/short-term-investments-api'

// ─── State ───────────────────────────────────────────────────────────────────

interface ShortTermInvestmentsState {
  // Settings
  settings: STISettings | null
  settingsLoading: boolean
  settingsError: string | null

  // Instruments
  instruments: STIInstrument[]
  instrumentsLoading: boolean
  instrumentsError: string | null

  // Dashboard
  dashboard: STIDashboard | null
  dashboardLoading: boolean
  dashboardError: string | null

  // Selected instrument detail
  selectedInstrument: STIInstrument | null
  rateHistory: RateEntry[]
  rateHistoryLoading: boolean
  accruals: AccrualEntry[]
  accrualsLoading: boolean
  auditTrail: AuditTrailEntry[]
  auditTrailLoading: boolean
}

const initialState: ShortTermInvestmentsState = {
  settings: null,
  settingsLoading: false,
  settingsError: null,

  instruments: [],
  instrumentsLoading: false,
  instrumentsError: null,

  dashboard: null,
  dashboardLoading: false,
  dashboardError: null,

  selectedInstrument: null,
  rateHistory: [],
  rateHistoryLoading: false,
  accruals: [],
  accrualsLoading: false,
  auditTrail: [],
  auditTrailLoading: false,
}

// ─── Thunks ──────────────────────────────────────────────────────────────────

export const fetchSTISettings = createAsyncThunk(
  'sti/fetchSettings',
  async (_, { rejectWithValue }) => {
    try {
      const res = await stiApi.getSTISettings()
      return res.data
    } catch (e: any) {
      return rejectWithValue(e.message || 'Failed to fetch settings')
    }
  }
)

export const updateSTISettings = createAsyncThunk(
  'sti/updateSettings',
  async (body: stiApi.UpdateSTISettingsRequest, { rejectWithValue }) => {
    try {
      const res = await stiApi.updateSTISettings(body)
      return res.data
    } catch (e: any) {
      return rejectWithValue(e.message || 'Failed to update settings')
    }
  }
)

export const fetchSTIDashboard = createAsyncThunk(
  'sti/fetchDashboard',
  async (params: { asOfIso?: string; broker?: string; currencyId?: string }, { rejectWithValue }) => {
    try {
      const res = await stiApi.getSTIDashboard(params)
      return res.data
    } catch (e: any) {
      return rejectWithValue(e.message || 'Failed to fetch dashboard')
    }
  }
)

export const fetchSTIInstruments = createAsyncThunk(
  'sti/fetchInstruments',
  async (params: { status?: string; search?: string; page?: number; limit?: number } | undefined, { rejectWithValue }) => {
    try {
      const res = await stiApi.getInstruments(params)
      return res.data
    } catch (e: any) {
      return rejectWithValue(e.message || 'Failed to fetch instruments')
    }
  }
)

export const fetchRateHistory = createAsyncThunk(
  'sti/fetchRateHistory',
  async (instrumentId: string, { rejectWithValue }) => {
    try {
      const res = await stiApi.getRateHistory(instrumentId)
      return res.data
    } catch (e: any) {
      return rejectWithValue(e.message || 'Failed to fetch rate history')
    }
  }
)

export const fetchAccruals = createAsyncThunk(
  'sti/fetchAccruals',
  async (instrumentId: string, { rejectWithValue }) => {
    try {
      const res = await stiApi.getAccruals(instrumentId)
      return res.data
    } catch (e: any) {
      return rejectWithValue(e.message || 'Failed to fetch accruals')
    }
  }
)

export const fetchAuditTrail = createAsyncThunk(
  'sti/fetchAuditTrail',
  async (instrumentId: string, { rejectWithValue }) => {
    try {
      const res = await stiApi.getAuditTrail(instrumentId)
      return res.data
    } catch (e: any) {
      return rejectWithValue(e.message || 'Failed to fetch audit trail')
    }
  }
)

// ─── Slice ───────────────────────────────────────────────────────────────────

const shortTermInvestmentsSlice = createSlice({
  name: 'shortTermInvestments',
  initialState,
  reducers: {
    setSelectedInstrument(state, action: PayloadAction<STIInstrument | null>) {
      state.selectedInstrument = action.payload
    },
    clearInstrumentDetail(state) {
      state.selectedInstrument = null
      state.rateHistory = []
      state.accruals = []
      state.auditTrail = []
    },
  },
  extraReducers: (builder) => {
    // Settings
    builder.addCase(fetchSTISettings.pending, (state) => { state.settingsLoading = true; state.settingsError = null })
    builder.addCase(fetchSTISettings.fulfilled, (state, action) => { state.settingsLoading = false; state.settings = action.payload })
    builder.addCase(fetchSTISettings.rejected, (state, action) => { state.settingsLoading = false; state.settingsError = action.payload as string })

    builder.addCase(updateSTISettings.fulfilled, (state, action) => { state.settings = action.payload })

    // Dashboard
    builder.addCase(fetchSTIDashboard.pending, (state) => { state.dashboardLoading = true; state.dashboardError = null })
    builder.addCase(fetchSTIDashboard.fulfilled, (state, action) => { state.dashboardLoading = false; state.dashboard = action.payload })
    builder.addCase(fetchSTIDashboard.rejected, (state, action) => { state.dashboardLoading = false; state.dashboardError = action.payload as string })

    // Instruments
    builder.addCase(fetchSTIInstruments.pending, (state) => { state.instrumentsLoading = true; state.instrumentsError = null })
    builder.addCase(fetchSTIInstruments.fulfilled, (state, action) => { state.instrumentsLoading = false; state.instruments = action.payload })
    builder.addCase(fetchSTIInstruments.rejected, (state, action) => { state.instrumentsLoading = false; state.instrumentsError = action.payload as string })

    // Rate history
    builder.addCase(fetchRateHistory.pending, (state) => { state.rateHistoryLoading = true })
    builder.addCase(fetchRateHistory.fulfilled, (state, action) => { state.rateHistoryLoading = false; state.rateHistory = action.payload })
    builder.addCase(fetchRateHistory.rejected, (state) => { state.rateHistoryLoading = false })

    // Accruals
    builder.addCase(fetchAccruals.pending, (state) => { state.accrualsLoading = true })
    builder.addCase(fetchAccruals.fulfilled, (state, action) => { state.accrualsLoading = false; state.accruals = action.payload })
    builder.addCase(fetchAccruals.rejected, (state) => { state.accrualsLoading = false })

    // Audit trail
    builder.addCase(fetchAuditTrail.pending, (state) => { state.auditTrailLoading = true })
    builder.addCase(fetchAuditTrail.fulfilled, (state, action) => { state.auditTrailLoading = false; state.auditTrail = action.payload })
    builder.addCase(fetchAuditTrail.rejected, (state) => { state.auditTrailLoading = false })
  },
})

export const { setSelectedInstrument, clearInstrumentDetail } = shortTermInvestmentsSlice.actions
export default shortTermInvestmentsSlice.reducer
