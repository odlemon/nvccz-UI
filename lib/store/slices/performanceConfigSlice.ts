import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit"
import {
  performanceConfigApi,
  ScorecardPillar,
  StrategicTheme,
  PerformanceStrategy,
  CompanyGoalLineWeight,
} from "@/lib/api/performance-config-api"

interface PerformanceConfigState {
  visionStatement: string
  activeStrategyId: string | null
  pillars: ScorecardPillar[]
  themes: StrategicTheme[]
  strategies: PerformanceStrategy[]
  archives: PerformanceStrategy[]
  goalLineWeights: Record<string, CompanyGoalLineWeight[]>
  loading: boolean
  saving: boolean
  error: string | null
}

const initialState: PerformanceConfigState = {
  visionStatement: "",
  activeStrategyId: null,
  pillars: [],
  themes: [],
  strategies: [],
  archives: [],
  goalLineWeights: {},
  loading: false,
  saving: false,
  error: null,
}

export const fetchVisionStatement = createAsyncThunk(
  "performanceConfig/fetchVision",
  async () => {
    const res = await performanceConfigApi.getVisionStatement()
    return res.data
  }
)

export const fetchScorecardPillars = createAsyncThunk(
  "performanceConfig/fetchPillars",
  async () => {
    const res = await performanceConfigApi.getScorecardPillars()
    return res.data
  }
)

export const setPillarWeights = createAsyncThunk(
  "performanceConfig/setPillarWeights",
  async (pillarWeights: Record<string, number>) => {
    await performanceConfigApi.setPillarWeights(pillarWeights)
    const res = await performanceConfigApi.getScorecardPillars()
    return res.data
  }
)

export const fetchThemes = createAsyncThunk(
  "performanceConfig/fetchThemes",
  async () => {
    const res = await performanceConfigApi.getThemes()
    return res.data
  }
)

export const createTheme = createAsyncThunk(
  "performanceConfig/createTheme",
  async (data: { name: string; description?: string; color?: string }) => {
    const res = await performanceConfigApi.createTheme(data)
    return res.data
  }
)

export const tagGoalsToTheme = createAsyncThunk(
  "performanceConfig/tagGoals",
  async ({ themeId, goalIds }: { themeId: string; goalIds: string[] }) => {
    await performanceConfigApi.tagGoalsToTheme(themeId, goalIds)
    return { themeId, goalIds }
  }
)

export const fetchStrategies = createAsyncThunk(
  "performanceConfig/fetchStrategies",
  async (includeArchived: boolean = false) => {
    const res = await performanceConfigApi.getStrategies(includeArchived)
    return res.data
  }
)

export const fetchArchives = createAsyncThunk(
  "performanceConfig/fetchArchives",
  async () => {
    const res = await performanceConfigApi.getArchives()
    return res.data
  }
)

export const createStrategy = createAsyncThunk(
  "performanceConfig/createStrategy",
  async (data: {
    title: string
    periodStart: string
    periodEnd: string
    visionStatement?: string
    pillarWeights?: Record<string, number>
    metadata?: Record<string, any>
  }) => {
    const res = await performanceConfigApi.createStrategy(data)
    return res.data
  }
)

export const updateStrategy = createAsyncThunk(
  "performanceConfig/updateStrategy",
  async ({ id, data }: { id: string; data: Record<string, any> }) => {
    const res = await performanceConfigApi.updateStrategy(id, data)
    return res.data
  }
)

export const archiveStrategy = createAsyncThunk(
  "performanceConfig/archiveStrategy",
  async (id: string) => {
    await performanceConfigApi.archiveStrategy(id)
    return id
  }
)

export const uploadStrategyDocument = createAsyncThunk(
  "performanceConfig/uploadDocument",
  async ({
    id,
    file,
    strategicGoalId,
  }: {
    id: string
    file: File
    strategicGoalId?: string
  }) => {
    const res = await performanceConfigApi.uploadStrategyDocument(id, file, strategicGoalId)
    return res.data
  }
)

export const fetchGoalLineWeights = createAsyncThunk(
  "performanceConfig/fetchGoalLineWeights",
  async (pillarId: string) => {
    const res = await performanceConfigApi.getCompanyGoalLineWeights(pillarId)
    return { pillarId, goals: res.data?.goals ?? [] }
  }
)

export const setGoalLineWeights = createAsyncThunk(
  "performanceConfig/setGoalLineWeights",
  async ({
    pillarId,
    goalWeights,
  }: {
    pillarId: string
    goalWeights: Record<string, number>
  }) => {
    await performanceConfigApi.setCompanyGoalLineWeights(pillarId, goalWeights)
    const res = await performanceConfigApi.getCompanyGoalLineWeights(pillarId)
    return { pillarId, goals: res.data?.goals ?? [] }
  }
)

export const updateGoalScorecardMetadata = createAsyncThunk(
  "performanceConfig/updateGoalScorecard",
  async ({ goalId, data }: { goalId: string; data: Record<string, any> }) => {
    await performanceConfigApi.updateGoalScorecardMetadata(goalId, data)
    return { goalId, data }
  }
)

const slice = createSlice({
  name: "performanceConfig",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVisionStatement.fulfilled, (state, action) => {
        if (action.payload) {
          state.visionStatement = action.payload.visionStatement || ""
          state.activeStrategyId = action.payload.strategyId || null
        }
      })
      .addCase(fetchScorecardPillars.fulfilled, (state, action) => {
        state.pillars = action.payload || []
      })
      .addCase(setPillarWeights.pending, (state) => {
        state.saving = true
      })
      .addCase(setPillarWeights.fulfilled, (state, action) => {
        state.saving = false
        state.pillars = action.payload || []
      })
      .addCase(setPillarWeights.rejected, (state, action) => {
        state.saving = false
        state.error = action.error.message || "Failed to update pillar weights"
      })
      .addCase(fetchThemes.fulfilled, (state, action) => {
        state.themes = action.payload || []
      })
      .addCase(createTheme.fulfilled, (state, action) => {
        if (action.payload) state.themes.unshift(action.payload)
      })
      .addCase(fetchStrategies.fulfilled, (state, action) => {
        state.strategies = action.payload || []
      })
      .addCase(fetchArchives.fulfilled, (state, action) => {
        state.archives = action.payload || []
      })
      .addCase(createStrategy.fulfilled, (state, action) => {
        if (action.payload) state.strategies.unshift(action.payload)
      })
      .addCase(updateStrategy.fulfilled, (state, action) => {
        const idx = state.strategies.findIndex((s) => s.id === action.payload?.id)
        if (idx >= 0 && action.payload) state.strategies[idx] = action.payload
      })
      .addCase(archiveStrategy.fulfilled, (state, action) => {
        state.strategies = state.strategies.filter((s) => s.id !== action.payload)
      })
      .addCase(uploadStrategyDocument.fulfilled, (state, action) => {
        const idx = state.strategies.findIndex((s) => s.id === action.payload?.id)
        if (idx >= 0 && action.payload) state.strategies[idx] = action.payload
      })
      .addCase(fetchGoalLineWeights.fulfilled, (state, action) => {
        state.goalLineWeights[action.payload.pillarId] = action.payload.goals
      })
      .addCase(setGoalLineWeights.pending, (state) => {
        state.saving = true
      })
      .addCase(setGoalLineWeights.fulfilled, (state, action) => {
        state.saving = false
        state.goalLineWeights[action.payload.pillarId] = action.payload.goals
      })
      .addCase(setGoalLineWeights.rejected, (state, action) => {
        state.saving = false
        state.error = action.error.message || "Failed to update goal weights"
      })
  },
})

export const { clearError } = slice.actions
export default slice.reducer
