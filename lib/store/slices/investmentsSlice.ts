import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import {
  investmentsApi,
  type Security,
  type PriceTick,
  type LatestPriceEntry,
  type Fund,
  type Holding,
  type PortfolioPnL,
  type Trade,
  type RoutingHop,
  type IngestBatch,
  type ValidationQueueItem,
} from "@/lib/api/investments-api"

// ─── State ────────────────────────────────────────────────────────────────────
interface InvestmentsState {
  // Securities / watchlist
  securities: Security[]
  securitiesLoading: boolean
  latestPrices: Record<string, PriceTick>
  pricesLoading: boolean
  watchlist: Security[]
  watchlistLoading: boolean
  ingestRunning: boolean
  lastIngestSource: string | null
  priceHistoryCache: Record<string, PriceTick[]>
  priceHistoryLoadingIds: Record<string, boolean>
  priceDrawerOpen: boolean
  priceDrawerTarget: Security | null
  dashboardFocusSecurityId: string | null

  // Funds + holdings
  funds: Fund[]
  fundsLoading: boolean
  selectedFundId: string | null
  holdings: Holding[]
  holdingsLoading: boolean
  pnl: PortfolioPnL | null
  pnlLoading: boolean
  pnlPeriod: "MTD" | "QTD" | "YTD"
  valuationRunning: boolean

  // Trades
  trades: Trade[]
  tradesLoading: boolean
  selectedTrade: Trade | null
  selectedTradeLoading: boolean
  executing: boolean
  executingError: string | null

  // Validation queue
  validationQueue: ValidationQueueItem[]
  validationLoading: boolean

  // Ingest batches
  ingestBatches: IngestBatch[]
  batchesLoading: boolean

  // UI
  executeTradeModalOpen: boolean
  securityConfigModalOpen: boolean
  securityConfigTarget: Security | null
  tradeFilter: "ALL" | "DRAFT" | "ROUTING" | "SETTLED" | "SETTLEMENT_FAILED"
}

const initialState: InvestmentsState = {
  securities: [],
  securitiesLoading: false,
  latestPrices: {},
  pricesLoading: false,
  watchlist: [],
  watchlistLoading: false,
  ingestRunning: false,
  lastIngestSource: null,
  priceHistoryCache: {},
  priceHistoryLoadingIds: {},
  priceDrawerOpen: false,
  priceDrawerTarget: null,
  dashboardFocusSecurityId: null,

  funds: [],
  fundsLoading: false,
  selectedFundId: null,
  holdings: [],
  holdingsLoading: false,
  pnl: null,
  pnlLoading: false,
  pnlPeriod: "YTD",
  valuationRunning: false,

  trades: [],
  tradesLoading: false,
  selectedTrade: null,
  selectedTradeLoading: false,
  executing: false,
  executingError: null,

  validationQueue: [],
  validationLoading: false,

  ingestBatches: [],
  batchesLoading: false,

  executeTradeModalOpen: false,
  securityConfigModalOpen: false,
  securityConfigTarget: null,
  tradeFilter: "ALL",
}

// ─── Thunks — Market Data ─────────────────────────────────────────────────────
export const fetchSecurities = createAsyncThunk(
  "investments/fetchSecurities",
  async (params?: { exchange?: string; asset_class?: string }) => {
    const res = await investmentsApi.listSecurities(params)
    if (!res.success) throw new Error(res.error || "Failed to fetch securities")
    return res.data ?? []
  }
)

export const fetchLatestPrices = createAsyncThunk(
  "investments/fetchLatestPrices",
  async () => {
    const res = await investmentsApi.getLatestPrices()
    if (!res.success) throw new Error(res.error || "Failed to fetch prices")
    return res.data ?? []
  }
)

export const fetchSecurityPriceHistory = createAsyncThunk(
  "investments/fetchSecurityPriceHistory",
  async (securityId: string) => {
    const res = await investmentsApi.getSecurityPrices(securityId)
    if (!res.success) throw new Error(res.error || "Failed to fetch price history")
    return { securityId, ticks: res.data ?? [] }
  }
)

export const fetchWatchlist = createAsyncThunk(
  "investments/fetchWatchlist",
  async () => {
    const res = await investmentsApi.getWatchlist()
    if (!res.success) throw new Error(res.error || "Failed to fetch watchlist")
    return res.data ?? []
  }
)

export const runIngest = createAsyncThunk(
  "investments/runIngest",
  async (sourceCode: string) => {
    const res = await investmentsApi.runIngest(sourceCode)
    if (!res.success) throw new Error(res.error || "Ingest run failed")
    return { ...res.data, sourceCode }
  }
)

export const fetchIngestBatches = createAsyncThunk(
  "investments/fetchIngestBatches",
  async (params?: { source?: string }) => {
    const res = await investmentsApi.listIngestBatches(params)
    if (!res.success) throw new Error(res.error || "Failed to fetch batches")
    return res.data ?? []
  }
)

export const fetchBatchDetail = createAsyncThunk(
  "investments/fetchBatchDetail",
  async (id: string) => {
    const res = await investmentsApi.getIngestBatch(id)
    if (!res.success) throw new Error(res.error || "Failed to fetch batch")
    return res.data as IngestBatch
  }
)

export const fetchValidationQueue = createAsyncThunk(
  "investments/fetchValidationQueue",
  async () => {
    const res = await investmentsApi.getValidationQueue()
    if (!res.success) throw new Error(res.error || "Failed to fetch validation queue")
    return res.data ?? []
  }
)

export const approveValidationTick = createAsyncThunk(
  "investments/approveValidationTick",
  async (tickId: string) => {
    const res = await investmentsApi.approveValidationTick(tickId)
    if (!res.success) throw new Error(res.error || "Approval failed")
    return tickId
  }
)

export const rejectValidationTick = createAsyncThunk(
  "investments/rejectValidationTick",
  async ({ tickId, reason }: { tickId: string; reason: string }) => {
    const res = await investmentsApi.rejectValidationTick(tickId, reason)
    if (!res.success) throw new Error(res.error || "Rejection failed")
    return tickId
  }
)

// ─── Thunks — Portfolio ───────────────────────────────────────────────────────
export const fetchFunds = createAsyncThunk(
  "investments/fetchFunds",
  async () => {
    const res = await investmentsApi.listFunds()
    if (!res.success) throw new Error(res.error || "Failed to fetch funds")
    return res.data ?? []
  }
)

export const fetchFundHoldings = createAsyncThunk(
  "investments/fetchFundHoldings",
  async (fundId: string) => {
    const res = await investmentsApi.getFundHoldings(fundId)
    if (!res.success) throw new Error(res.error || "Failed to fetch holdings")
    return res.data ?? []
  }
)

export const fetchFundPnL = createAsyncThunk(
  "investments/fetchFundPnL",
  async ({ fundId, period }: { fundId: string; period?: "MTD" | "QTD" | "YTD" }) => {
    const res = await investmentsApi.getFundPnL(fundId, { period })
    if (!res.success) throw new Error(res.error || "Failed to fetch P&L")
    return res.data as PortfolioPnL
  }
)

export const runValuation = createAsyncThunk(
  "investments/runValuation",
  async (fundId: string) => {
    const res = await investmentsApi.runValuation(fundId)
    if (!res.success) throw new Error(res.error || "Valuation run failed")
    return res.data
  }
)

// ─── Thunks — Trades ─────────────────────────────────────────────────────────
export const fetchTrades = createAsyncThunk(
  "investments/fetchTrades",
  async (params?: { status?: string; fund_id?: string }) => {
    const res = await investmentsApi.listTrades(params)
    if (!res.success) throw new Error(res.error || "Failed to fetch trades")
    return res.data ?? []
  }
)

export const fetchTrade = createAsyncThunk(
  "investments/fetchTrade",
  async (id: string) => {
    const res = await investmentsApi.getTrade(id)
    if (!res.success) throw new Error(res.error || "Failed to fetch trade")
    return res.data as Trade
  }
)

export const createTrade = createAsyncThunk(
  "investments/createTrade",
  async (data: Parameters<typeof investmentsApi.createTrade>[0]) => {
    const res = await investmentsApi.createTrade(data)
    if (!res.success) throw new Error(res.error || "Failed to create trade")
    return res.data as Trade
  }
)

export const executeTrade = createAsyncThunk(
  "investments/executeTrade",
  async (id: string) => {
    const res = await investmentsApi.executeTrade(id)
    if (!res.success) throw new Error(res.error || "Failed to execute trade")
    return res.data as Trade
  }
)

export const retryHop = createAsyncThunk(
  "investments/retryHop",
  async ({ tradeId, hopId }: { tradeId: string; hopId: string }) => {
    const res = await investmentsApi.retryHop(tradeId, hopId)
    if (!res.success) throw new Error(res.error || "Retry failed")
    return res.data as RoutingHop
  }
)

export const confirmHop = createAsyncThunk(
  "investments/confirmHop",
  async ({ tradeId, hopId }: { tradeId: string; hopId: string }) => {
    const res = await investmentsApi.confirmHop(tradeId, hopId)
    if (!res.success) throw new Error(res.error || "Confirm failed")
    return res.data as RoutingHop
  }
)

// ─── Slice ────────────────────────────────────────────────────────────────────
const investmentsSlice = createSlice({
  name: "investments",
  initialState,
  reducers: {
    setSelectedFundId(state, action: PayloadAction<string | null>) {
      state.selectedFundId = action.payload
    },
    setExecuteTradeModalOpen(state, action: PayloadAction<boolean>) {
      state.executeTradeModalOpen = action.payload
    },
    setSecurityConfigModalOpen(state, action: PayloadAction<boolean>) {
      state.securityConfigModalOpen = action.payload
    },
    setSecurityConfigTarget(state, action: PayloadAction<Security | null>) {
      state.securityConfigTarget = action.payload
    },
    setPriceDrawerOpen(state, action: PayloadAction<boolean>) {
      state.priceDrawerOpen = action.payload
    },
    setPriceDrawerTarget(state, action: PayloadAction<Security | null>) {
      state.priceDrawerTarget = action.payload
    },
    setDashboardFocusSecurityId(state, action: PayloadAction<string | null>) {
      state.dashboardFocusSecurityId = action.payload
    },
    setTradeFilter(state, action: PayloadAction<InvestmentsState["tradeFilter"]>) {
      state.tradeFilter = action.payload
    },
    setPnlPeriod(state, action: PayloadAction<"MTD" | "QTD" | "YTD">) {
      state.pnlPeriod = action.payload
    },
    clearSelectedTrade(state) {
      state.selectedTrade = null
    },
  },
  extraReducers: (builder) => {
    // fetchSecurities
    builder
      .addCase(fetchSecurities.pending, (state) => { state.securitiesLoading = true })
      .addCase(fetchSecurities.fulfilled, (state, action) => {
        state.securitiesLoading = false
        state.securities = Array.isArray(action.payload) ? action.payload : []
      })
      .addCase(fetchSecurities.rejected, (state) => { state.securitiesLoading = false })

    // fetchLatestPrices — store as a map keyed by symbol and by security id
    builder
      .addCase(fetchLatestPrices.pending, (state) => { state.pricesLoading = true })
      .addCase(fetchLatestPrices.fulfilled, (state, action) => {
        state.pricesLoading = false
        const map: Record<string, PriceTick> = {}
        const entries = Array.isArray(action.payload) ? action.payload : []
        for (const entry of entries as LatestPriceEntry[]) {
          if (entry?.security?.symbol) map[entry.security.symbol] = entry.latestTick
          if (entry?.security?.id)     map[entry.security.id]     = entry.latestTick
        }
        state.latestPrices = { ...state.latestPrices, ...map }
      })
      .addCase(fetchLatestPrices.rejected, (state) => { state.pricesLoading = false })

    // fetchSecurityPriceHistory — cached per security id so the drawer and
    // dashboard chart can each focus a different security without clobbering
    // each other's data.
    builder
      .addCase(fetchSecurityPriceHistory.pending, (state, action) => {
        state.priceHistoryLoadingIds[action.meta.arg] = true
      })
      .addCase(fetchSecurityPriceHistory.fulfilled, (state, action) => {
        state.priceHistoryLoadingIds[action.payload.securityId] = false
        state.priceHistoryCache[action.payload.securityId] = Array.isArray(action.payload.ticks) ? action.payload.ticks : []
      })
      .addCase(fetchSecurityPriceHistory.rejected, (state, action) => {
        state.priceHistoryLoadingIds[action.meta.arg] = false
      })

    // fetchWatchlist
    builder
      .addCase(fetchWatchlist.pending, (state) => { state.watchlistLoading = true })
      .addCase(fetchWatchlist.fulfilled, (state, action) => {
        state.watchlistLoading = false
        state.watchlist = Array.isArray(action.payload) ? action.payload : []
      })
      .addCase(fetchWatchlist.rejected, (state) => { state.watchlistLoading = false })

    // runIngest
    builder
      .addCase(runIngest.pending, (state) => { state.ingestRunning = true })
      .addCase(runIngest.fulfilled, (state, action) => {
        state.ingestRunning = false
        state.lastIngestSource = (action.payload as any)?.sourceCode ?? null
      })
      .addCase(runIngest.rejected, (state) => { state.ingestRunning = false })

    // fetchIngestBatches
    builder
      .addCase(fetchIngestBatches.pending, (state) => { state.batchesLoading = true })
      .addCase(fetchIngestBatches.fulfilled, (state, action) => {
        state.batchesLoading = false
        state.ingestBatches = Array.isArray(action.payload) ? action.payload : []
      })
      .addCase(fetchIngestBatches.rejected, (state) => { state.batchesLoading = false })

    // fetchBatchDetail — update matching batch in list
    builder.addCase(fetchBatchDetail.fulfilled, (state, action) => {
      state.ingestBatches = state.ingestBatches.map((b) =>
        b.batch_id === action.payload.batch_id ? action.payload : b
      )
    })

    // fetchValidationQueue
    builder
      .addCase(fetchValidationQueue.pending, (state) => { state.validationLoading = true })
      .addCase(fetchValidationQueue.fulfilled, (state, action) => {
        state.validationLoading = false
        state.validationQueue = Array.isArray(action.payload) ? action.payload : []
      })
      .addCase(fetchValidationQueue.rejected, (state) => { state.validationLoading = false })

    // approveValidationTick / rejectValidationTick — optimistic removal
    builder.addCase(approveValidationTick.fulfilled, (state, action) => {
      state.validationQueue = state.validationQueue.filter((v) => v.tick_id !== action.payload)
    })
    builder.addCase(rejectValidationTick.fulfilled, (state, action) => {
      state.validationQueue = state.validationQueue.filter((v) => v.tick_id !== action.payload)
    })

    // fetchFunds
    builder
      .addCase(fetchFunds.pending, (state) => { state.fundsLoading = true })
      .addCase(fetchFunds.fulfilled, (state, action) => {
        state.fundsLoading = false
        const list = Array.isArray(action.payload) ? action.payload : []
        state.funds = list
        if (!state.selectedFundId && list.length > 0) {
          state.selectedFundId = list[0].id
        }
      })
      .addCase(fetchFunds.rejected, (state) => { state.fundsLoading = false })

    // fetchFundHoldings
    builder
      .addCase(fetchFundHoldings.pending, (state) => { state.holdingsLoading = true })
      .addCase(fetchFundHoldings.fulfilled, (state, action) => {
        state.holdingsLoading = false
        state.holdings = Array.isArray(action.payload) ? action.payload : []
      })
      .addCase(fetchFundHoldings.rejected, (state) => { state.holdingsLoading = false })

    // fetchFundPnL
    builder
      .addCase(fetchFundPnL.pending, (state) => { state.pnlLoading = true })
      .addCase(fetchFundPnL.fulfilled, (state, action) => {
        state.pnlLoading = false
        state.pnl = action.payload ?? null
      })
      .addCase(fetchFundPnL.rejected, (state) => { state.pnlLoading = false })

    // runValuation
    builder
      .addCase(runValuation.pending, (state) => { state.valuationRunning = true })
      .addCase(runValuation.fulfilled, (state) => { state.valuationRunning = false })
      .addCase(runValuation.rejected, (state) => { state.valuationRunning = false })

    // fetchTrades
    builder
      .addCase(fetchTrades.pending, (state) => { state.tradesLoading = true })
      .addCase(fetchTrades.fulfilled, (state, action) => {
        state.tradesLoading = false
        state.trades = Array.isArray(action.payload) ? action.payload : []
      })
      .addCase(fetchTrades.rejected, (state) => { state.tradesLoading = false })

    // fetchTrade
    builder
      .addCase(fetchTrade.pending, (state) => { state.selectedTradeLoading = true })
      .addCase(fetchTrade.fulfilled, (state, action) => {
        state.selectedTradeLoading = false
        state.selectedTrade = action.payload
      })
      .addCase(fetchTrade.rejected, (state) => { state.selectedTradeLoading = false })

    // createTrade
    builder.addCase(createTrade.fulfilled, (state, action) => {
      if (action.payload) state.trades = [action.payload, ...state.trades]
    })

    // executeTrade
    builder
      .addCase(executeTrade.pending, (state) => { state.executing = true; state.executingError = null })
      .addCase(executeTrade.fulfilled, (state, action) => {
        state.executing = false
        state.selectedTrade = action.payload
        state.trades = state.trades.map((t) =>
          t.id === action.payload.id ? action.payload : t
        )
        state.executeTradeModalOpen = false
      })
      .addCase(executeTrade.rejected, (state, action) => {
        state.executing = false
        state.executingError = action.error.message || "Execute failed"
      })

    // retryHop / confirmHop — update hop in selectedTrade
    const updateHopInTrade = (state: InvestmentsState, hop: RoutingHop) => {
      if (state.selectedTrade?.routingHops) {
        state.selectedTrade.routingHops = state.selectedTrade.routingHops.map((h) =>
          h.id === hop.id ? hop : h
        )
      }
    }
    builder.addCase(retryHop.fulfilled,   (state, action) => updateHopInTrade(state, action.payload))
    builder.addCase(confirmHop.fulfilled,  (state, action) => updateHopInTrade(state, action.payload))
  },
})

export const {
  setSelectedFundId,
  setExecuteTradeModalOpen,
  setSecurityConfigModalOpen,
  setSecurityConfigTarget,
  setPriceDrawerOpen,
  setPriceDrawerTarget,
  setDashboardFocusSecurityId,
  setTradeFilter,
  setPnlPeriod,
  clearSelectedTrade,
} = investmentsSlice.actions

export default investmentsSlice.reducer
