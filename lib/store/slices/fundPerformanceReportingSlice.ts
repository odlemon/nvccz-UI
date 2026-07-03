import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit"
import {
  fundPerformanceReportingApi,
  ReportTemplate,
  CreateReportTemplateRequest,
  UpdateReportTemplateRequest,
  ReportSchedule,
  CreateReportScheduleRequest,
  UpdateReportScheduleRequest,
  ReportDistributionList,
  CreateReportDistributionListRequest,
  UpdateReportDistributionListRequest,
  FundReportRun,
  CreateFundReportRunRequest,
  RunDeliveryLog,
  RunRecipient,
  FundReportAuditEntry,
} from "@/lib/api/fund-performance-reporting-api"

interface FundPerformanceReportingState {
  templates: ReportTemplate[]
  templatesLoading: boolean
  templatesError: string | null

  schedules: ReportSchedule[]
  schedulesLoading: boolean
  // Also carries the known backend Prisma bug's raw message — surfaced
  // verbatim in the UI, never swallowed as a fake empty state.
  schedulesError: string | null

  distributionLists: ReportDistributionList[]
  distributionListsLoading: boolean
  distributionListsError: string | null

  runs: FundReportRun[]
  runsLoading: boolean
  runsError: string | null
  triggerRunLoading: boolean
  triggerRunError: string | null

  runDetailById: Record<string, FundReportRun>
  runDetailLoadingById: Record<string, boolean>
  runLogsById: Record<string, RunDeliveryLog[]>
  runLogsLoadingById: Record<string, boolean>
  runRecipientsById: Record<string, RunRecipient[]>
  runRecipientsLoadingById: Record<string, boolean>

  auditEntries: FundReportAuditEntry[]
  auditLoading: boolean
  auditError: string | null

  selectedFundId: string | null
}

const initialState: FundPerformanceReportingState = {
  templates: [],
  templatesLoading: false,
  templatesError: null,

  schedules: [],
  schedulesLoading: false,
  schedulesError: null,

  distributionLists: [],
  distributionListsLoading: false,
  distributionListsError: null,

  runs: [],
  runsLoading: false,
  runsError: null,
  triggerRunLoading: false,
  triggerRunError: null,

  runDetailById: {},
  runDetailLoadingById: {},
  runLogsById: {},
  runLogsLoadingById: {},
  runRecipientsById: {},
  runRecipientsLoadingById: {},

  auditEntries: [],
  auditLoading: false,
  auditError: null,

  selectedFundId: null,
}

// ── Templates ──
export const fetchTemplates = createAsyncThunk(
  'fundPerformanceReporting/fetchTemplates',
  async (params: { fundId: string; reportLevel?: 'INVESTOR' | 'BOARD' }, { rejectWithValue }) => {
    try {
      const response = await fundPerformanceReportingApi.getTemplates(params.fundId, params.reportLevel)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch report templates')
    }
  }
)

export const createTemplate = createAsyncThunk(
  'fundPerformanceReporting/createTemplate',
  async (data: CreateReportTemplateRequest, { dispatch, rejectWithValue }) => {
    try {
      const response = await fundPerformanceReportingApi.createTemplate(data)
      dispatch(fetchTemplates({ fundId: data.fundId }))
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create report template')
    }
  }
)

export const updateTemplate = createAsyncThunk(
  'fundPerformanceReporting/updateTemplate',
  async ({ id, fundId, data }: { id: string; fundId: string; data: UpdateReportTemplateRequest }, { dispatch, rejectWithValue }) => {
    try {
      const response = await fundPerformanceReportingApi.updateTemplate(id, data)
      dispatch(fetchTemplates({ fundId }))
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update report template')
    }
  }
)

export const deactivateTemplate = createAsyncThunk(
  'fundPerformanceReporting/deactivateTemplate',
  async ({ id, fundId }: { id: string; fundId: string }, { dispatch, rejectWithValue }) => {
    try {
      const response = await fundPerformanceReportingApi.deactivateTemplate(id)
      dispatch(fetchTemplates({ fundId }))
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to deactivate report template')
    }
  }
)

// ── Schedules ──
export const fetchSchedules = createAsyncThunk(
  'fundPerformanceReporting/fetchSchedules',
  async (fundId: string, { rejectWithValue }) => {
    try {
      const response = await fundPerformanceReportingApi.getSchedules(fundId)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch report schedules')
    }
  }
)

export const createSchedule = createAsyncThunk(
  'fundPerformanceReporting/createSchedule',
  async (data: CreateReportScheduleRequest, { dispatch, rejectWithValue }) => {
    try {
      const response = await fundPerformanceReportingApi.createSchedule(data)
      dispatch(fetchSchedules(data.fundId))
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create report schedule')
    }
  }
)

export const updateSchedule = createAsyncThunk(
  'fundPerformanceReporting/updateSchedule',
  async ({ id, fundId, data }: { id: string; fundId: string; data: UpdateReportScheduleRequest }, { dispatch, rejectWithValue }) => {
    try {
      const response = await fundPerformanceReportingApi.updateSchedule(id, data)
      dispatch(fetchSchedules(fundId))
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update report schedule')
    }
  }
)

export const deactivateSchedule = createAsyncThunk(
  'fundPerformanceReporting/deactivateSchedule',
  async ({ id, fundId }: { id: string; fundId: string }, { dispatch, rejectWithValue }) => {
    try {
      const response = await fundPerformanceReportingApi.deactivateSchedule(id)
      dispatch(fetchSchedules(fundId))
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to deactivate report schedule')
    }
  }
)

// ── Distribution Lists ──
export const fetchDistributionLists = createAsyncThunk(
  'fundPerformanceReporting/fetchDistributionLists',
  async (fundId: string, { rejectWithValue }) => {
    try {
      const response = await fundPerformanceReportingApi.getDistributionLists(fundId)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch distribution lists')
    }
  }
)

export const createDistributionList = createAsyncThunk(
  'fundPerformanceReporting/createDistributionList',
  async (data: CreateReportDistributionListRequest, { dispatch, rejectWithValue }) => {
    try {
      const response = await fundPerformanceReportingApi.createDistributionList(data)
      dispatch(fetchDistributionLists(data.fundId))
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create distribution list')
    }
  }
)

export const updateDistributionList = createAsyncThunk(
  'fundPerformanceReporting/updateDistributionList',
  async ({ id, fundId, data }: { id: string; fundId: string; data: UpdateReportDistributionListRequest }, { dispatch, rejectWithValue }) => {
    try {
      const response = await fundPerformanceReportingApi.updateDistributionList(id, data)
      dispatch(fetchDistributionLists(fundId))
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update distribution list')
    }
  }
)

export const deactivateDistributionList = createAsyncThunk(
  'fundPerformanceReporting/deactivateDistributionList',
  async ({ id, fundId }: { id: string; fundId: string }, { dispatch, rejectWithValue }) => {
    try {
      const response = await fundPerformanceReportingApi.deactivateDistributionList(id)
      dispatch(fetchDistributionLists(fundId))
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to deactivate distribution list')
    }
  }
)

// ── Runs ──
export const fetchRuns = createAsyncThunk(
  'fundPerformanceReporting/fetchRuns',
  async (params: { fundId: string; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await fundPerformanceReportingApi.getRuns(params.fundId, params.limit)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch report runs')
    }
  }
)

export const triggerRun = createAsyncThunk(
  'fundPerformanceReporting/triggerRun',
  async (data: CreateFundReportRunRequest, { dispatch, rejectWithValue }) => {
    try {
      const response = await fundPerformanceReportingApi.triggerRun(data)
      dispatch(fetchRuns({ fundId: data.fundId }))
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to trigger report run')
    }
  }
)

export const fetchRunDetail = createAsyncThunk(
  'fundPerformanceReporting/fetchRunDetail',
  async (runId: string, { rejectWithValue }) => {
    try {
      const response = await fundPerformanceReportingApi.getRun(runId)
      return { runId, data: response.data }
    } catch (error: any) {
      return rejectWithValue({ runId, message: error.message || 'Failed to fetch run detail' })
    }
  }
)

export const fetchRunLogs = createAsyncThunk(
  'fundPerformanceReporting/fetchRunLogs',
  async (runId: string, { rejectWithValue }) => {
    try {
      const response = await fundPerformanceReportingApi.getRunLogs(runId)
      return { runId, data: response.data }
    } catch (error: any) {
      return rejectWithValue({ runId, message: error.message || 'Failed to fetch run logs' })
    }
  }
)

export const fetchRunRecipients = createAsyncThunk(
  'fundPerformanceReporting/fetchRunRecipients',
  async (runId: string, { rejectWithValue }) => {
    try {
      const response = await fundPerformanceReportingApi.getRunRecipients(runId)
      return { runId, data: response.data }
    } catch (error: any) {
      return rejectWithValue({ runId, message: error.message || 'Failed to fetch run recipients' })
    }
  }
)

// ── Audit ──
export const fetchAudit = createAsyncThunk(
  'fundPerformanceReporting/fetchAudit',
  async (params: { entityType: string; entityId: string }, { rejectWithValue }) => {
    try {
      const response = await fundPerformanceReportingApi.getAudit(params.entityType, params.entityId)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch audit trail')
    }
  }
)

const fundPerformanceReportingSlice = createSlice({
  name: 'fundPerformanceReporting',
  initialState,
  reducers: {
    setSelectedFundId(state, action: PayloadAction<string | null>) {
      state.selectedFundId = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // Templates
      .addCase(fetchTemplates.pending, (state) => { state.templatesLoading = true; state.templatesError = null })
      .addCase(fetchTemplates.fulfilled, (state, action) => { state.templatesLoading = false; state.templates = action.payload })
      .addCase(fetchTemplates.rejected, (state, action) => { state.templatesLoading = false; state.templatesError = action.payload as string })

      // Schedules
      .addCase(fetchSchedules.pending, (state) => { state.schedulesLoading = true; state.schedulesError = null })
      .addCase(fetchSchedules.fulfilled, (state, action) => { state.schedulesLoading = false; state.schedules = action.payload })
      .addCase(fetchSchedules.rejected, (state, action) => { state.schedulesLoading = false; state.schedulesError = action.payload as string; state.schedules = [] })

      // Distribution Lists
      .addCase(fetchDistributionLists.pending, (state) => { state.distributionListsLoading = true; state.distributionListsError = null })
      .addCase(fetchDistributionLists.fulfilled, (state, action) => { state.distributionListsLoading = false; state.distributionLists = action.payload })
      .addCase(fetchDistributionLists.rejected, (state, action) => { state.distributionListsLoading = false; state.distributionListsError = action.payload as string })

      // Runs
      .addCase(fetchRuns.pending, (state) => { state.runsLoading = true; state.runsError = null })
      .addCase(fetchRuns.fulfilled, (state, action) => { state.runsLoading = false; state.runs = action.payload })
      .addCase(fetchRuns.rejected, (state, action) => { state.runsLoading = false; state.runsError = action.payload as string })
      .addCase(triggerRun.pending, (state) => { state.triggerRunLoading = true; state.triggerRunError = null })
      .addCase(triggerRun.fulfilled, (state) => { state.triggerRunLoading = false })
      .addCase(triggerRun.rejected, (state, action) => { state.triggerRunLoading = false; state.triggerRunError = action.payload as string })

      .addCase(fetchRunDetail.pending, (state, action) => { state.runDetailLoadingById[action.meta.arg] = true })
      .addCase(fetchRunDetail.fulfilled, (state, action) => {
        state.runDetailLoadingById[action.payload.runId] = false
        state.runDetailById[action.payload.runId] = action.payload.data
      })
      .addCase(fetchRunDetail.rejected, (state, action) => {
        const payload = action.payload as { runId: string; message: string }
        state.runDetailLoadingById[payload.runId] = false
      })

      .addCase(fetchRunLogs.pending, (state, action) => { state.runLogsLoadingById[action.meta.arg] = true })
      .addCase(fetchRunLogs.fulfilled, (state, action) => {
        state.runLogsLoadingById[action.payload.runId] = false
        state.runLogsById[action.payload.runId] = action.payload.data
      })
      .addCase(fetchRunLogs.rejected, (state, action) => {
        const payload = action.payload as { runId: string; message: string }
        state.runLogsLoadingById[payload.runId] = false
      })

      .addCase(fetchRunRecipients.pending, (state, action) => { state.runRecipientsLoadingById[action.meta.arg] = true })
      .addCase(fetchRunRecipients.fulfilled, (state, action) => {
        state.runRecipientsLoadingById[action.payload.runId] = false
        state.runRecipientsById[action.payload.runId] = action.payload.data
      })
      .addCase(fetchRunRecipients.rejected, (state, action) => {
        const payload = action.payload as { runId: string; message: string }
        state.runRecipientsLoadingById[payload.runId] = false
      })

      // Audit
      .addCase(fetchAudit.pending, (state) => { state.auditLoading = true; state.auditError = null })
      .addCase(fetchAudit.fulfilled, (state, action) => { state.auditLoading = false; state.auditEntries = action.payload })
      .addCase(fetchAudit.rejected, (state, action) => { state.auditLoading = false; state.auditError = action.payload as string })
  },
})

export const { setSelectedFundId } = fundPerformanceReportingSlice.actions
export default fundPerformanceReportingSlice.reducer
