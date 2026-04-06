import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import {
  scorecardApiService,
  type DepartmentScorecard,
  type UserScorecard,
} from "@/lib/api/scorecard-service"

export interface ScorecardState {
  departmentScorecard: DepartmentScorecard | null
  userScorecard: UserScorecard | null
  loading: boolean
  error: string | null
}

const initialState: ScorecardState = {
  departmentScorecard: null,
  userScorecard: null,
  loading: false,
  error: null,
}

// Async Thunks
export const fetchDepartmentScorecard = createAsyncThunk(
  "scorecard/fetchDepartmentScorecard",
  async (departmentName: string, { rejectWithValue }) => {
    try {
      const response = await scorecardApiService.getDepartmentScorecard(departmentName)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  },
)

export const fetchUserScorecard = createAsyncThunk(
  "scorecard/fetchUserScorecard",
  async (_, { rejectWithValue }) => {
    try {
      const response = await scorecardApiService.getUserScorecard()
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  },
)

// Scorecard Slice
const scorecardSlice = createSlice({
  name: "scorecard",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // Department Scorecard
      .addCase(fetchDepartmentScorecard.pending, (state) => {
        state.loading = true
        state.error = null
        state.departmentScorecard = null
      })
      .addCase(fetchDepartmentScorecard.fulfilled, (state, action: PayloadAction<DepartmentScorecard>) => {
        state.loading = false
        state.departmentScorecard = action.payload
      })
      .addCase(fetchDepartmentScorecard.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // User Scorecard
      .addCase(fetchUserScorecard.pending, (state) => {
        state.loading = true
        state.error = null
        state.userScorecard = null
      })
      .addCase(fetchUserScorecard.fulfilled, (state, action: PayloadAction<UserScorecard>) => {
        state.loading = false
        state.userScorecard = action.payload
      })
      .addCase(fetchUserScorecard.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { setLoading, setError } = scorecardSlice.actions
export default scorecardSlice.reducer
