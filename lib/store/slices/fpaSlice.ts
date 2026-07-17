import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import {
  fpaApi,
  type FpaModel,
  type FpaScenario,
  type FpaTask,
  type FpaVersion,
  type FpaHomeDashboard,
  type FpaVarianceResult,
} from '@/lib/api/fpa-api'
import { errorMessage, logFpaGap } from '@/lib/fpa/fpa-api-gaps'
import { normalizeFpaHomeDashboard } from '@/lib/fpa/normalize-home-dashboard'

export interface FpaState {
  selectedModelId: string | null
  selectedVersionId: string | null
  selectedScenarioId: string | null
  models: FpaModel[]
  scenarios: FpaScenario[]
  versions: FpaVersion[]
  tasks: FpaTask[]
  varianceRows: FpaVarianceResult[]
  dashboard: FpaHomeDashboard | null
  loadingModels: boolean
  loadingDashboard: boolean
  error: string | null
  bootstrapped: boolean
}

const initialState: FpaState = {
  selectedModelId: null,
  selectedVersionId: null,
  selectedScenarioId: null,
  models: [],
  scenarios: [],
  versions: [],
  tasks: [],
  varianceRows: [],
  dashboard: null,
  loadingModels: false,
  loadingDashboard: false,
  error: null,
  bootstrapped: false,
}

export const fetchFpaModels = createAsyncThunk('fpa/fetchModels', async (_, { rejectWithValue }) => {
  try {
    const res = await fpaApi.listModels()
    if (!res.success) {
      logFpaGap({
        category: 'broken',
        path: '/v1/fpa/models',
        method: 'GET',
        message: res.message || 'listModels failed',
        impact: 'Models list and module bootstrap empty',
        response: res,
      })
      return rejectWithValue(res.message || 'Failed to load models')
    }
    return res.data || []
  } catch (err) {
    logFpaGap({
      category: 'broken',
      path: '/v1/fpa/models',
      method: 'GET',
      message: errorMessage(err),
      impact: 'Models list and module bootstrap empty',
      response: err,
    })
    return rejectWithValue(errorMessage(err))
  }
})

export const bootstrapFpaSelection = createAsyncThunk(
  'fpa/bootstrapSelection',
  async (preferredModelId: string | undefined, { rejectWithValue }) => {
    try {
      const listRes = await fpaApi.listModels()
      if (!listRes.success) throw new Error(listRes.message || 'Failed to list models')
      const models = listRes.data || []
      const active = models.filter((m) => m.status !== 'ARCHIVED')
      // Prefer published models for Planning Workspace; fall back to any active.
      const published = active.filter((m) => String(m.status).toUpperCase() === 'PUBLISHED')
      const model =
        (preferredModelId && active.find((m) => m.id === preferredModelId)) ||
        published[0] ||
        active[0] ||
        models[0] ||
        null

      if (!model) {
        return {
          models,
          model: null as FpaModel | null,
          scenarios: [] as FpaScenario[],
          versions: [] as FpaVersion[],
          selectedModelId: null as string | null,
          selectedScenarioId: null as string | null,
          selectedVersionId: null as string | null,
        }
      }

      const detailRes = await fpaApi.getModel(model.id)
      const detail = detailRes.success && detailRes.data ? detailRes.data : model
      let scenarios = detail.scenarios || []
      let versions = detail.versions || []

      const [scenarioRes, versionRes] = await Promise.all([
        scenarios.length ? Promise.resolve(null) : fpaApi.listModelScenarios(model.id),
        versions.length ? Promise.resolve(null) : fpaApi.listModelVersions(model.id),
      ])
      if (scenarioRes) {
        if (!scenarioRes.success) throw new Error(scenarioRes.message || 'Failed to load model scenarios')
        scenarios = scenarioRes.data || []
      }
      if (versionRes) {
        if (!versionRes.success) throw new Error(versionRes.message || 'Failed to load model versions')
        versions = versionRes.data || []
      }

      const selectedScenarioId =
        scenarios.find((s) => s.id === detail.defaultScenarioId)?.id ||
        scenarios.find((s) => s.scenarioType === 'BASE' || /base/i.test(s.name))?.id ||
        scenarios[0]?.id ||
        null

      // Prefer locked/published (planning snapshot) then default, then working draft.
      const selectedVersionId =
        versions.find((v) => v.id === detail.defaultVersionId)?.id ||
        versions.find((v) => {
          const st = String(v.status).toUpperCase()
          return st === 'LOCKED' || st === 'PUBLISHED'
        })?.id ||
        versions.find((v) => /working/i.test(v.name) || v.status === 'DRAFT')?.id ||
        versions[0]?.id ||
        null

      return {
        models,
        model: detail,
        scenarios,
        versions,
        selectedModelId: model.id,
        selectedScenarioId,
        selectedVersionId,
      }
    } catch (err) {
      logFpaGap({
        category: 'broken',
        path: '/v1/fpa/models',
        method: 'GET',
        message: errorMessage(err),
        impact: 'Cannot select model/version/scenario for FP&A screens',
        response: err,
      })
      return rejectWithValue(errorMessage(err))
    }
  },
)

export const fetchFpaDashboard = createAsyncThunk(
  'fpa/fetchDashboard',
  async (
    params:
      | {
          modelId?: string
          versionId?: string
          scenarioId?: string
          cycleId?: string
          period?: string
        }
      | undefined,
    { rejectWithValue },
  ) => {
    try {
      const res = await fpaApi.getDashboard(params)
      if (!res.success) {
        logFpaGap({
          category: 'broken',
          path: '/v1/fpa/home/dashboard',
          method: 'GET',
          message: res.message || 'dashboard failed',
          impact: 'Home board empty',
          response: res,
          request: params,
        })
        return rejectWithValue(res.message || 'Failed to load dashboard')
      }
      return normalizeFpaHomeDashboard(res.data || null)
    } catch (err) {
      logFpaGap({
        category: 'broken',
        path: '/v1/fpa/home/dashboard',
        method: 'GET',
        message: errorMessage(err),
        impact: 'Home board empty',
        response: err,
        request: params,
      })
      return rejectWithValue(errorMessage(err))
    }
  },
)

export const fetchMyFpaTasks = createAsyncThunk('fpa/fetchMyTasks', async (_, { rejectWithValue }) => {
  try {
    const res = await fpaApi.myTasks()
    if (!res.success) return rejectWithValue(res.message || 'Failed to load tasks')
    return res.data || []
  } catch (err) {
    logFpaGap({
      category: 'broken',
      path: '/v1/fpa/tasks/my-tasks',
      method: 'GET',
      message: errorMessage(err),
      impact: 'Workflow / Home open tasks empty',
      response: err,
    })
    return rejectWithValue(errorMessage(err))
  }
})

const fpaSlice = createSlice({
  name: 'fpa',
  initialState,
  reducers: {
    setSelectedModelId(state, action: PayloadAction<string | null>) {
      state.selectedModelId = action.payload
    },
    setSelectedVersionId(state, action: PayloadAction<string | null>) {
      state.selectedVersionId = action.payload
    },
    setSelectedScenarioId(state, action: PayloadAction<string | null>) {
      state.selectedScenarioId = action.payload
    },
    setModels(state, action: PayloadAction<FpaModel[]>) {
      state.models = action.payload
    },
    setScenarios(state, action: PayloadAction<FpaScenario[]>) {
      state.scenarios = action.payload
    },
    setVersions(state, action: PayloadAction<FpaVersion[]>) {
      state.versions = action.payload
    },
    setTasks(state, action: PayloadAction<FpaTask[]>) {
      state.tasks = action.payload
    },
    setVarianceRows(state, action: PayloadAction<FpaVarianceResult[]>) {
      state.varianceRows = action.payload
    },
    clearFpaError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFpaModels.pending, (state) => {
        state.loadingModels = true
        state.error = null
      })
      .addCase(fetchFpaModels.fulfilled, (state, action) => {
        state.loadingModels = false
        state.models = action.payload
      })
      .addCase(fetchFpaModels.rejected, (state, action) => {
        state.loadingModels = false
        state.error = (action.payload as string) || 'Failed to load models'
      })
      .addCase(bootstrapFpaSelection.pending, (state, action) => {
        state.loadingModels = true
        state.error = null
        if (action.meta.arg) {
          state.selectedModelId = action.meta.arg
          state.selectedScenarioId = null
          state.selectedVersionId = null
          state.scenarios = []
          state.versions = []
        }
      })
      .addCase(bootstrapFpaSelection.fulfilled, (state, action) => {
        if (action.meta.arg && state.selectedModelId !== action.meta.arg) return
        state.loadingModels = false
        state.bootstrapped = true
        state.models = action.payload.models
        state.scenarios = action.payload.scenarios
        state.versions = action.payload.versions
        state.selectedModelId = action.payload.selectedModelId
        state.selectedScenarioId = action.payload.selectedScenarioId
        state.selectedVersionId = action.payload.selectedVersionId
      })
      .addCase(bootstrapFpaSelection.rejected, (state, action) => {
        if (action.meta.arg && state.selectedModelId !== action.meta.arg) return
        state.loadingModels = false
        state.bootstrapped = true
        state.error = (action.payload as string) || 'Bootstrap failed'
      })
      .addCase(fetchFpaDashboard.pending, (state) => {
        state.loadingDashboard = true
      })
      .addCase(fetchFpaDashboard.fulfilled, (state, action) => {
        const requested = action.meta.arg
        if (
          (requested?.modelId && requested.modelId !== state.selectedModelId) ||
          (requested?.versionId && requested.versionId !== state.selectedVersionId) ||
          (requested?.scenarioId && requested.scenarioId !== state.selectedScenarioId)
        ) {
          return
        }
        state.loadingDashboard = false
        state.dashboard = action.payload
        if (action.payload?.openTasks) state.tasks = action.payload.openTasks
      })
      .addCase(fetchFpaDashboard.rejected, (state, action) => {
        const requested = action.meta.arg
        if (
          (requested?.modelId && requested.modelId !== state.selectedModelId) ||
          (requested?.versionId && requested.versionId !== state.selectedVersionId) ||
          (requested?.scenarioId && requested.scenarioId !== state.selectedScenarioId)
        ) {
          return
        }
        state.loadingDashboard = false
        state.error = (action.payload as string) || 'Dashboard failed'
      })
      .addCase(fetchMyFpaTasks.fulfilled, (state, action) => {
        state.tasks = action.payload
      })
  },
})

export const {
  setSelectedModelId,
  setSelectedVersionId,
  setSelectedScenarioId,
  setModels,
  setScenarios,
  setVersions,
  setTasks,
  setVarianceRows,
  clearFpaError,
} = fpaSlice.actions

export default fpaSlice.reducer
