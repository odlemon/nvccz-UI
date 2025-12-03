import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Currency } from '@/lib/api/accounting-api'

interface CurrenciesState {
  items: Currency[]
  loading: boolean
  error: string | null
}

const initialState: CurrenciesState = {
  items: [],
  loading: false,
  error: null,
}

const currenciesSlice = createSlice({
  name: 'currencies',
  initialState,
  reducers: {
    setCurrenciesLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setCurrenciesError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    setCurrencies: (state, action: PayloadAction<Currency[]>) => {
      state.items = action.payload
    },
  },
})

export const { setCurrenciesLoading, setCurrenciesError, setCurrencies } = currenciesSlice.actions
export default currenciesSlice.reducer


