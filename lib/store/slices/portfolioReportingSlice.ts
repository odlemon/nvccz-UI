import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { 
  portfolioReportingApi, 
  ReportingScheduleConfig, 
  CreateReportingScheduleRequest 
} from '@/lib/api/portfolio-reporting-api'

interface PortfolioReportingState {
  configs: ReportingScheduleConfig[]
  loading: boolean
  error: string | null
  currentConfig: ReportingScheduleConfig | null
}

const initialState: PortfolioReportingState = {
  configs: [],
  loading: false,
  error: null,
  currentConfig: null,
}

export const fetchScheduleConfigs = createAsyncThunk(
  'portfolioReporting/fetchConfigs',
  async (_, { rejectWithValue }) => {
    try {
      const response = await portfolioReportingApi.getScheduleConfigs()
      if (response.success) {
        // Handle nested configs structure
        return response.data?.configs || []
      }
      return rejectWithValue(response.message || 'Failed to fetch configs')
    } catch (error: any) {
      return rejectWithValue(error.message || 'An error occurred')
    }
  }
)

export const createScheduleConfig = createAsyncThunk(
  'portfolioReporting/createConfig',
  async (data: CreateReportingScheduleRequest, { rejectWithValue }) => {
    try {
      const response = await portfolioReportingApi.createScheduleConfig(data)
      if (response.success) {
        return response.data
      }
      return rejectWithValue(response.message || 'Failed to create config')
    } catch (error: any) {
      return rejectWithValue(error.message || 'An error occurred')
    }
  }
)

export const updateScheduleConfig = createAsyncThunk(
  'portfolioReporting/updateConfig',
  async ({ id, data }: { id: string; data: Partial<CreateReportingScheduleRequest> }, { rejectWithValue }) => {
    try {
      const response = await portfolioReportingApi.updateScheduleConfig(id, data)
      if (response.success) {
        return response.data
      }
      return rejectWithValue(response.message || 'Failed to update config')
    } catch (error: any) {
      return rejectWithValue(error.message || 'An error occurred')
    }
  }
)

export const deleteScheduleConfig = createAsyncThunk(
  'portfolioReporting/deleteConfig',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await portfolioReportingApi.deleteScheduleConfig(id)
      if (response.success) {
        return id
      }
      return rejectWithValue(response.message || 'Failed to delete config')
    } catch (error: any) {
      return rejectWithValue(error.message || 'An error occurred')
    }
  }
)

const portfolioReportingSlice = createSlice({
  name: 'portfolioReporting',
  initialState,
  reducers: {
    setCurrentConfig: (state, action: PayloadAction<ReportingScheduleConfig | null>) => {
      state.currentConfig = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Configs
      .addCase(fetchScheduleConfigs.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchScheduleConfigs.fulfilled, (state, action) => {
        state.loading = false
        state.configs = Array.isArray(action.payload) ? action.payload : []
      })
      .addCase(fetchScheduleConfigs.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Create Config
      .addCase(createScheduleConfig.fulfilled, (state, action) => {
        state.configs.unshift(action.payload)
      })
      // Update Config
      .addCase(updateScheduleConfig.fulfilled, (state, action) => {
        const index = state.configs.findIndex(c => c.id === action.payload.id)
        if (index !== -1) {
          state.configs[index] = action.payload
        }
      })
      // Delete Config
      .addCase(deleteScheduleConfig.fulfilled, (state, action) => {
        state.configs = state.configs.filter(c => c.id !== action.payload)
      })
  },
})

export const { setCurrentConfig, clearError } = portfolioReportingSlice.actions
export default portfolioReportingSlice.reducer
