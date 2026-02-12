import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { fundsApi, Fund } from '@/lib/api/funds-api'

interface FundsState {
  funds: Fund[]
  loading: boolean
  error: string | null
}

const initialState: FundsState = {
  funds: [],
  loading: false,
  error: null,
}

export const fetchFunds = createAsyncThunk(
  'funds/fetchFunds',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fundsApi.getAll()
      return response.data.funds
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch funds')
    }
  }
)

const fundsSlice = createSlice({
  name: 'funds',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFunds.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchFunds.fulfilled, (state, action: PayloadAction<Fund[]>) => {
        state.loading = false
        state.funds = action.payload
        state.error = null
      })
      .addCase(fetchFunds.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export default fundsSlice.reducer
