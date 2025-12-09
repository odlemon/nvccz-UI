import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "./index";

export interface ZSEStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  currency: string;
  exchange: string;
  lastUpdated: string;
  estimated: boolean;
}

interface ZSEStocksState {
  loading: boolean;
  error: string | null;
  stocks: ZSEStock[];
}

const initialState: ZSEStocksState = {
  loading: false,
  error: null,
  stocks: [],
};

export const fetchZSEStocks = createAsyncThunk<ZSEStock[], void, { state: RootState }>(
  "zseStocks/fetchZSEStocks",
  async (_, thunkAPI) => {
    try {
      const res = await fetch("/api/zse");
      const data = await res.json();
      if (!data.success) throw new Error("API error");
      return data.stocks || [];
    } catch (err: any) {
      throw err.message || "Failed to fetch ZSE stocks";
    }
  }
);

const zseStocksSlice = createSlice({
  name: "zseStocks",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchZSEStocks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchZSEStocks.fulfilled, (state, action) => {
        state.loading = false;
        state.stocks = action.payload;
      })
      .addCase(fetchZSEStocks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch ZSE stocks";
      });
  },
});

export default zseStocksSlice.reducer;
