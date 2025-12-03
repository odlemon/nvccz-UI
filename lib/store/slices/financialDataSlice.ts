import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { 
  fetchExchangeRates, 
  fetchTopGainers, 
  fetchTopLosers, 
  fetchMarketIndices, 
  fetchSectorIndices,
  fetchAfricanIndices,
  fetchWorldIndices,
  type ExchangeRatesResponse,
  type TopGainersResponse,
  type TopLosersResponse,
  type MarketIndicesResponse,
  type SectorIndicesResponse,
  type AfricanIndicesResponse,
  type WorldIndicesResponse
} from '@/lib/api/financial-data'

interface FinancialDataState {
  exchangeRates: {
    data: ExchangeRatesResponse | null
    loading: boolean
    error: string | null
    lastFetched: number | null
  }
  topGainers: {
    data: TopGainersResponse | null
    loading: boolean
    error: string | null
    lastFetched: number | null
  }
  topLosers: {
    data: TopLosersResponse | null
    loading: boolean
    error: string | null
    lastFetched: number | null
  }
  marketIndices: {
    data: MarketIndicesResponse | null
    loading: boolean
    error: string | null
    lastFetched: number | null
  }
  sectorIndices: {
    data: SectorIndicesResponse | null
    loading: boolean
    error: string | null
    lastFetched: number | null
  }
  africanIndices: {
    data: AfricanIndicesResponse | null
    loading: boolean
    error: string | null
    lastFetched: number | null
  }
  worldIndices: {
    data: WorldIndicesResponse | null
    loading: boolean
    error: string | null
    lastFetched: number | null
  }
}

const initialState: FinancialDataState = {
  exchangeRates: {
    data: null,
    loading: false,
    error: null,
    lastFetched: null
  },
  topGainers: {
    data: null,
    loading: false,
    error: null,
    lastFetched: null
  },
  topLosers: {
    data: null,
    loading: false,
    error: null,
    lastFetched: null
  },
  marketIndices: {
    data: null,
    loading: false,
    error: null,
    lastFetched: null
  },
  sectorIndices: {
    data: null,
    loading: false,
    error: null,
    lastFetched: null
  },
  africanIndices: {
    data: null,
    loading: false,
    error: null,
    lastFetched: null
  },
  worldIndices: {
    data: null,
    loading: false,
    error: null,
    lastFetched: null
  }
}

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000

// Helper function to check if data is stale
const isDataStale = (lastFetched: number | null): boolean => {
  if (!lastFetched) return true
  return Date.now() - lastFetched > CACHE_DURATION
}

// Async thunks for each API endpoint
export const fetchExchangeRatesThunk = createAsyncThunk(
  'financialData/fetchExchangeRates',
  async (_, { getState }) => {
    const state = getState() as { financialData: FinancialDataState }
    const { data, lastFetched } = state.financialData.exchangeRates
    
    // Return cached data if it's still fresh
    if (data && !isDataStale(lastFetched)) {
      return data
    }
    
    return await fetchExchangeRates()
  }
)

export const fetchTopGainersThunk = createAsyncThunk(
  'financialData/fetchTopGainers',
  async (_, { getState }) => {
    const state = getState() as { financialData: FinancialDataState }
    const { data, lastFetched } = state.financialData.topGainers
    
    if (data && !isDataStale(lastFetched)) {
      return data
    }
    
    return await fetchTopGainers()
  }
)

export const fetchTopLosersThunk = createAsyncThunk(
  'financialData/fetchTopLosers',
  async (_, { getState }) => {
    const state = getState() as { financialData: FinancialDataState }
    const { data, lastFetched } = state.financialData.topLosers
    
    if (data && !isDataStale(lastFetched)) {
      return data
    }
    
    return await fetchTopLosers()
  }
)

export const fetchMarketIndicesThunk = createAsyncThunk(
  'financialData/fetchMarketIndices',
  async (_, { getState }) => {
    const state = getState() as { financialData: FinancialDataState }
    const { data, lastFetched } = state.financialData.marketIndices
    
    if (data && !isDataStale(lastFetched)) {
      return data
    }
    
    return await fetchMarketIndices()
  }
)

export const fetchSectorIndicesThunk = createAsyncThunk(
  'financialData/fetchSectorIndices',
  async (_, { getState }) => {
    const state = getState() as { financialData: FinancialDataState }
    const { data, lastFetched } = state.financialData.sectorIndices
    
    if (data && !isDataStale(lastFetched)) {
      return data
    }
    
    return await fetchSectorIndices()
  }
)

export const fetchAfricanIndicesThunk = createAsyncThunk(
  'financialData/fetchAfricanIndices',
  async (_, { getState }) => {
    const state = getState() as { financialData: FinancialDataState }
    const { data, lastFetched } = state.financialData.africanIndices
    
    if (data && !isDataStale(lastFetched)) {
      return data
    }
    
    return await fetchAfricanIndices()
  }
)

export const fetchWorldIndicesThunk = createAsyncThunk(
  'financialData/fetchWorldIndices',
  async (_, { getState }) => {
    const state = getState() as { financialData: FinancialDataState }
    const { data, lastFetched } = state.financialData.worldIndices
    
    if (data && !isDataStale(lastFetched)) {
      return data
    }
    
    return await fetchWorldIndices()
  }
)

// Combined thunk to fetch all data at once
export const fetchAllFinancialDataThunk = createAsyncThunk(
  'financialData/fetchAllFinancialData',
  async (_, { dispatch }) => {
    const results = await Promise.allSettled([
      dispatch(fetchExchangeRatesThunk()),
      dispatch(fetchTopGainersThunk()),
      dispatch(fetchTopLosersThunk()),
      dispatch(fetchMarketIndicesThunk()),
      dispatch(fetchSectorIndicesThunk()),
      dispatch(fetchAfricanIndicesThunk()),
      dispatch(fetchWorldIndicesThunk())
    ])
    
    return results
  }
)

const financialDataSlice = createSlice({
  name: 'financialData',
  initialState,
  reducers: {
    clearError: (state, action: PayloadAction<keyof FinancialDataState>) => {
      state[action.payload].error = null
    },
    clearAllErrors: (state) => {
      Object.keys(state).forEach(key => {
        state[key as keyof FinancialDataState].error = null
      })
    }
  },
  extraReducers: (builder) => {
    // Exchange Rates
    builder
      .addCase(fetchExchangeRatesThunk.pending, (state) => {
        state.exchangeRates.loading = true
        state.exchangeRates.error = null
      })
      .addCase(fetchExchangeRatesThunk.fulfilled, (state, action) => {
        state.exchangeRates.loading = false
        state.exchangeRates.data = action.payload
        state.exchangeRates.lastFetched = Date.now()
        state.exchangeRates.error = null
      })
      .addCase(fetchExchangeRatesThunk.rejected, (state, action) => {
        state.exchangeRates.loading = false
        state.exchangeRates.error = action.error.message || 'Failed to fetch exchange rates'
      })

    // Top Gainers
    builder
      .addCase(fetchTopGainersThunk.pending, (state) => {
        state.topGainers.loading = true
        state.topGainers.error = null
      })
      .addCase(fetchTopGainersThunk.fulfilled, (state, action) => {
        state.topGainers.loading = false
        state.topGainers.data = action.payload
        state.topGainers.lastFetched = Date.now()
        state.topGainers.error = null
      })
      .addCase(fetchTopGainersThunk.rejected, (state, action) => {
        state.topGainers.loading = false
        state.topGainers.error = action.error.message || 'Failed to fetch top gainers'
      })

    // Top Losers
    builder
      .addCase(fetchTopLosersThunk.pending, (state) => {
        state.topLosers.loading = true
        state.topLosers.error = null
      })
      .addCase(fetchTopLosersThunk.fulfilled, (state, action) => {
        state.topLosers.loading = false
        state.topLosers.data = action.payload
        state.topLosers.lastFetched = Date.now()
        state.topLosers.error = null
      })
      .addCase(fetchTopLosersThunk.rejected, (state, action) => {
        state.topLosers.loading = false
        state.topLosers.error = action.error.message || 'Failed to fetch top losers'
      })

    // Market Indices
    builder
      .addCase(fetchMarketIndicesThunk.pending, (state) => {
        state.marketIndices.loading = true
        state.marketIndices.error = null
      })
      .addCase(fetchMarketIndicesThunk.fulfilled, (state, action) => {
        state.marketIndices.loading = false
        state.marketIndices.data = action.payload
        state.marketIndices.lastFetched = Date.now()
        state.marketIndices.error = null
      })
      .addCase(fetchMarketIndicesThunk.rejected, (state, action) => {
        state.marketIndices.loading = false
        state.marketIndices.error = action.error.message || 'Failed to fetch market indices'
      })

    // Sector Indices
    builder
      .addCase(fetchSectorIndicesThunk.pending, (state) => {
        state.sectorIndices.loading = true
        state.sectorIndices.error = null
      })
      .addCase(fetchSectorIndicesThunk.fulfilled, (state, action) => {
        state.sectorIndices.loading = false
        state.sectorIndices.data = action.payload
        state.sectorIndices.lastFetched = Date.now()
        state.sectorIndices.error = null
      })
      .addCase(fetchSectorIndicesThunk.rejected, (state, action) => {
        state.sectorIndices.loading = false
        state.sectorIndices.error = action.error.message || 'Failed to fetch sector indices'
      })

    // African Indices
    builder
      .addCase(fetchAfricanIndicesThunk.pending, (state) => {
        state.africanIndices.loading = true
        state.africanIndices.error = null
      })
      .addCase(fetchAfricanIndicesThunk.fulfilled, (state, action) => {
        state.africanIndices.loading = false
        state.africanIndices.data = action.payload
        state.africanIndices.lastFetched = Date.now()
        state.africanIndices.error = null
      })
      .addCase(fetchAfricanIndicesThunk.rejected, (state, action) => {
        state.africanIndices.loading = false
        state.africanIndices.error = action.error.message || 'Failed to fetch African indices'
      })

    // World Indices
    builder
      .addCase(fetchWorldIndicesThunk.pending, (state) => {
        state.worldIndices.loading = true
        state.worldIndices.error = null
      })
      .addCase(fetchWorldIndicesThunk.fulfilled, (state, action) => {
        state.worldIndices.loading = false
        state.worldIndices.data = action.payload
        state.worldIndices.lastFetched = Date.now()
        state.worldIndices.error = null
      })
      .addCase(fetchWorldIndicesThunk.rejected, (state, action) => {
        state.worldIndices.loading = false
        state.worldIndices.error = action.error.message || 'Failed to fetch world indices'
      })
  }
})

export const { clearError, clearAllErrors } = financialDataSlice.actions
export default financialDataSlice.reducer
