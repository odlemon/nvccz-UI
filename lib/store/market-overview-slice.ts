import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "./index";

export interface MarketOverviewStock {
  ticker: string;
  name: string;
  exchange_short: string | null;
  exchange_long: string | null;
  mic_code: string;
  currency: string;
  price: number;
  day_high: number;
  day_low: number;
  day_open: number;
  "52_week_high": number | null;
  "52_week_low": number | null;
  market_cap: number | null;
  previous_close_price: number;
  previous_close_price_time: string;
  day_change: number;
  volume: number;
  is_extended_hours_price: boolean;
  last_trade_time: string;
}

interface MarketOverviewState {
  loading: boolean;
  error: string | null;
  data: MarketOverviewStock[];
  meta: {
    requested: number;
    returned: number;
  } | null;
}

const initialState: MarketOverviewState = {
  loading: false,
  error: null,
  data: [],
  meta: null,
};

export const fetchMarketOverview = createAsyncThunk<MarketOverviewStock[], void, { state: RootState }>(
  "marketOverview/fetchMarketOverview",
  async (_, thunkAPI) => {
    try {
      const res = await fetch("/api/market-overview");
      const data = await res.json();
      if (!data.data) throw new Error("API error");
      return data.data || [];
    } catch (err: any) {
      throw err.message || "Failed to fetch market overview";
    }
  }
);

const marketOverviewSlice = createSlice({
  name: "marketOverview",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMarketOverview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMarketOverview.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.meta = {
          requested: action.payload.length,
          returned: action.payload.length,
        };
      })
      .addCase(fetchMarketOverview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch market overview";
      });
  },
});

export default marketOverviewSlice.reducer;