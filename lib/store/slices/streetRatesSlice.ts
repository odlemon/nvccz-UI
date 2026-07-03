import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import {
  exchangeRateDisplayApi,
  type FxWidget,
  type FxCompare,
  type RateQuote,
  type ExchangeRateDisplayConfig,
  type ManualQuotePayload,
} from "@/lib/api/exchange-rate-display-api"

// ─── State ────────────────────────────────────────────────────────────────────
export type HistoryRange = "ALL" | "7D" | "30D" | "90D" | "1Y" | "CUSTOM"
export type HistorySeries = "STREET" | "OFFICIAL" | "BOTH"

interface StreetRatesState {
  widget: FxWidget | null
  widgetLoading: boolean
  widgetError: string | null

  compare: FxCompare | null
  compareLoading: boolean

  historyBySource: Record<string, RateQuote[]>
  historyLoading: boolean
  historyRange: HistoryRange
  historySeries: HistorySeries
  customDateFrom: string | null
  customDateTo: string | null

  context: string
  fromCurrency: string
  toCurrency: string
  globalAsOfDate: string | null

  configs: ExchangeRateDisplayConfig[]
  configsLoading: boolean
  configDrawerOpen: boolean
  configDrawerTarget: ExchangeRateDisplayConfig | null
  configViewOpen: boolean
  configViewTarget: ExchangeRateDisplayConfig | null

  ingestRunning: boolean
  manualQuoteOpen: boolean
  manualQuoteSubmitting: boolean
}

const initialState: StreetRatesState = {
  widget: null,
  widgetLoading: false,
  widgetError: null,

  compare: null,
  compareLoading: false,

  historyBySource: {},
  historyLoading: false,
  historyRange: "ALL",
  historySeries: "BOTH",
  customDateFrom: null,
  customDateTo: null,

  context: "GENERIC",
  fromCurrency: "USD",
  toCurrency: "ZWG",
  globalAsOfDate: null,

  configs: [],
  configsLoading: false,
  configDrawerOpen: false,
  configDrawerTarget: null,
  configViewOpen: false,
  configViewTarget: null,

  ingestRunning: false,
  manualQuoteOpen: false,
  manualQuoteSubmitting: false,
}

// ─── Thunks ───────────────────────────────────────────────────────────────────
export const fetchWidget = createAsyncThunk(
  "streetRates/fetchWidget",
  async (params: { context: string; from?: string; to?: string; asOfDate?: string }) => {
    const res = await exchangeRateDisplayApi.getWidget(params)
    if (!res.success) throw new Error(res.error || "Failed to fetch FX widget")
    return res.data as FxWidget
  }
)

export const fetchCompare = createAsyncThunk(
  "streetRates/fetchCompare",
  async (params?: { from?: string; to?: string; asOfDate?: string }) => {
    const res = await exchangeRateDisplayApi.compareRates(params)
    if (!res.success) throw new Error(res.error || "Failed to fetch rate comparison")
    return res.data as FxCompare
  }
)

export const fetchHistory = createAsyncThunk(
  "streetRates/fetchHistory",
  async (params: { source: string; from?: string; to?: string; dateFrom?: string; dateTo?: string }) => {
    const res = await exchangeRateDisplayApi.getRateHistory(params)
    if (!res.success) throw new Error(res.error || "Failed to fetch rate history")
    return { source: params.source, quotes: res.data ?? [] }
  }
)

export const fetchConfigs = createAsyncThunk(
  "streetRates/fetchConfigs",
  async () => {
    const res = await exchangeRateDisplayApi.listConfigs()
    if (!res.success) throw new Error(res.error || "Failed to fetch configs")
    return res.data ?? []
  }
)

export const createConfig = createAsyncThunk(
  "streetRates/createConfig",
  async (data: Omit<ExchangeRateDisplayConfig, "id" | "createdAt" | "updatedAt">) => {
    const res = await exchangeRateDisplayApi.createConfig(data)
    if (!res.success) throw new Error(res.error || "Failed to create config")
    return res.data as ExchangeRateDisplayConfig
  }
)

export const updateConfig = createAsyncThunk(
  "streetRates/updateConfig",
  async ({ id, data }: { id: string; data: Partial<ExchangeRateDisplayConfig> }) => {
    const res = await exchangeRateDisplayApi.updateConfig(id, data)
    if (!res.success) throw new Error(res.error || "Failed to update config")
    return res.data as ExchangeRateDisplayConfig
  }
)

export const runIngest = createAsyncThunk(
  "streetRates/runIngest",
  async () => {
    const res = await exchangeRateDisplayApi.runIngest()
    if (!res.success) throw new Error(res.error || "Ingest run failed")
    return res.data
  }
)

export const postManualQuote = createAsyncThunk(
  "streetRates/postManualQuote",
  async (data: ManualQuotePayload) => {
    const res = await exchangeRateDisplayApi.postManualQuote(data)
    if (!res.success) throw new Error(res.error || "Failed to post manual quote")
    return res.data
  }
)

// ─── Slice ────────────────────────────────────────────────────────────────────
const streetRatesSlice = createSlice({
  name: "streetRates",
  initialState,
  reducers: {
    setContext(state, action: PayloadAction<string>) {
      state.context = action.payload
    },
    setFromToCurrency(state, action: PayloadAction<{ from: string; to: string }>) {
      state.fromCurrency = action.payload.from
      state.toCurrency = action.payload.to
    },
    setGlobalAsOfDate(state, action: PayloadAction<string | null>) {
      state.globalAsOfDate = action.payload
    },
    setHistoryRange(state, action: PayloadAction<HistoryRange>) {
      state.historyRange = action.payload
    },
    setHistorySeries(state, action: PayloadAction<HistorySeries>) {
      state.historySeries = action.payload
    },
    setCustomDateRange(state, action: PayloadAction<{ from: string | null; to: string | null }>) {
      state.customDateFrom = action.payload.from
      state.customDateTo = action.payload.to
    },
    setConfigDrawerOpen(state, action: PayloadAction<boolean>) {
      state.configDrawerOpen = action.payload
    },
    setConfigDrawerTarget(state, action: PayloadAction<ExchangeRateDisplayConfig | null>) {
      state.configDrawerTarget = action.payload
    },
    setConfigViewOpen(state, action: PayloadAction<boolean>) {
      state.configViewOpen = action.payload
    },
    setConfigViewTarget(state, action: PayloadAction<ExchangeRateDisplayConfig | null>) {
      state.configViewTarget = action.payload
    },
    setManualQuoteOpen(state, action: PayloadAction<boolean>) {
      state.manualQuoteOpen = action.payload
    },
  },
  extraReducers: (builder) => {
    // fetchWidget
    builder
      .addCase(fetchWidget.pending, (state) => { state.widgetLoading = true; state.widgetError = null })
      .addCase(fetchWidget.fulfilled, (state, action) => {
        state.widgetLoading = false
        state.widget = action.payload
      })
      .addCase(fetchWidget.rejected, (state, action) => {
        state.widgetLoading = false
        state.widgetError = action.error.message || "Failed to load widget"
      })

    // fetchCompare
    builder
      .addCase(fetchCompare.pending, (state) => { state.compareLoading = true })
      .addCase(fetchCompare.fulfilled, (state, action) => {
        state.compareLoading = false
        state.compare = action.payload
      })
      .addCase(fetchCompare.rejected, (state) => { state.compareLoading = false })

    // fetchHistory — keyed by source
    builder
      .addCase(fetchHistory.pending, (state) => { state.historyLoading = true })
      .addCase(fetchHistory.fulfilled, (state, action) => {
        state.historyLoading = false
        state.historyBySource[action.payload.source] = Array.isArray(action.payload.quotes) ? action.payload.quotes : []
      })
      .addCase(fetchHistory.rejected, (state) => { state.historyLoading = false })

    // fetchConfigs
    builder
      .addCase(fetchConfigs.pending, (state) => { state.configsLoading = true })
      .addCase(fetchConfigs.fulfilled, (state, action) => {
        state.configsLoading = false
        state.configs = Array.isArray(action.payload) ? action.payload : []
      })
      .addCase(fetchConfigs.rejected, (state) => { state.configsLoading = false })

    // createConfig / updateConfig
    builder.addCase(createConfig.fulfilled, (state, action) => {
      if (action.payload) state.configs = [action.payload, ...state.configs]
      state.configDrawerOpen = false
    })
    builder.addCase(updateConfig.fulfilled, (state, action) => {
      state.configs = state.configs.map((c) => (c.id === action.payload.id ? action.payload : c))
      state.configDrawerOpen = false
    })

    // runIngest
    builder
      .addCase(runIngest.pending, (state) => { state.ingestRunning = true })
      .addCase(runIngest.fulfilled, (state) => { state.ingestRunning = false })
      .addCase(runIngest.rejected, (state) => { state.ingestRunning = false })

    // postManualQuote
    builder
      .addCase(postManualQuote.pending, (state) => { state.manualQuoteSubmitting = true })
      .addCase(postManualQuote.fulfilled, (state) => {
        state.manualQuoteSubmitting = false
        state.manualQuoteOpen = false
      })
      .addCase(postManualQuote.rejected, (state) => { state.manualQuoteSubmitting = false })
  },
})

export const {
  setContext,
  setFromToCurrency,
  setGlobalAsOfDate,
  setHistoryRange,
  setHistorySeries,
  setCustomDateRange,
  setConfigDrawerOpen,
  setConfigDrawerTarget,
  setConfigViewOpen,
  setConfigViewTarget,
  setManualQuoteOpen,
} = streetRatesSlice.actions

export default streetRatesSlice.reducer
