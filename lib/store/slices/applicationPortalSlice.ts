import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit"
import applicationPortalApiService, {
  ApplicantProfile,
  Application,
  ApplicationTimeline,
  PortfolioCompany,
  Dashboard,
  Investment,
  Valuation,
  ReportsData,
  TermSheet,
  UpdateProfileRequest,
  UpdateCompanyRequest,
  InitiateInvestmentImplementationRequest,
  FinancialReport,
  UploadFinancialReportRequest,
  SubmitFinancialReportsRequest,
  SubmitPeriodKPIsRequest,
  FinancialReportType,
  Letterhead,
  UpdateLetterheadRequest,
} from "@/lib/api/application-portal-api"

interface ApplicationPortalState {
  // Profile
  profile: ApplicantProfile | null
  profileLoading: boolean
  profileError: string | null

  // Application
  application: Application | null
  applicationLoading: boolean
  applicationError: string | null

  // Timeline
  timeline: ApplicationTimeline | null
  timelineLoading: boolean
  timelineError: string | null

  // Portfolio Company
  company: PortfolioCompany | null
  companyLoading: boolean
  companyError: string | null

  // Dashboard
  dashboard: Dashboard | null
  dashboardLoading: boolean
  dashboardError: string | null

  // Investment
  investment: Investment | null
  investmentLoading: boolean
  investmentError: string | null

  // Valuations
  valuations: Valuation[]
  valuationsLoading: boolean
  valuationsError: string | null

  // Reports
  reports: ReportsData | null
  reportsLoading: boolean
  reportsError: string | null

  // Term Sheets
  termSheets: TermSheet[]
  termSheetsLoading: boolean
  termSheetsError: string | null
  termSheetsPagination: {
    total: number
    page: number
    totalPages: number
  }

  // Financial Reports
  financialReports: FinancialReport[]
  financialReportsLoading: boolean
  financialReportsError: string | null

  // Letterhead
  letterhead: Letterhead | null
  letterheadLoading: boolean
  letterheadError: string | null
  letterheadSaving: boolean
  letterheadLogoUploading: boolean

  // General
  loading: boolean
  error: string | null
}

const initialState: ApplicationPortalState = {
  profile: null,
  profileLoading: false,
  profileError: null,

  application: null,
  applicationLoading: false,
  applicationError: null,

  timeline: null,
  timelineLoading: false,
  timelineError: null,

  company: null,
  companyLoading: false,
  companyError: null,

  dashboard: null,
  dashboardLoading: false,
  dashboardError: null,

  investment: null,
  investmentLoading: false,
  investmentError: null,

  valuations: [],
  valuationsLoading: false,
  valuationsError: null,

  reports: null,
  reportsLoading: false,
  reportsError: null,

  termSheets: [],
  termSheetsLoading: false,
  termSheetsError: null,
  termSheetsPagination: {
    total: 0,
    page: 1,
    totalPages: 1,
  },

  financialReports: [],
  financialReportsLoading: false,
  financialReportsError: null,

  letterhead: null,
  letterheadLoading: false,
  letterheadError: null,
  letterheadSaving: false,
  letterheadLogoUploading: false,

  loading: false,
  error: null,
}

// Async thunks
export const fetchProfile = createAsyncThunk(
  'applicationPortal/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await applicationPortalApiService.getProfile()
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch profile')
    }
  }
)

export const updateProfile = createAsyncThunk(
  'applicationPortal/updateProfile',
  async (data: UpdateProfileRequest, { dispatch, rejectWithValue }) => {
    try {
      const response = await applicationPortalApiService.updateProfile(data)
      dispatch(fetchProfile())
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update profile')
    }
  }
)

export const fetchApplication = createAsyncThunk(
  'applicationPortal/fetchApplication',
  async (_, { rejectWithValue }) => {
    try {
      const response = await applicationPortalApiService.getApplication()
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch application')
    }
  }
)

export const fetchTimeline = createAsyncThunk(
  'applicationPortal/fetchTimeline',
  async (_, { rejectWithValue }) => {
    try {
      const response = await applicationPortalApiService.getApplicationTimeline()
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch timeline')
    }
  }
)

export const fetchCompany = createAsyncThunk(
  'applicationPortal/fetchCompany',
  async (_, { rejectWithValue }) => {
    try {
      const response = await applicationPortalApiService.getCompany()
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch company')
    }
  }
)

export const updateCompany = createAsyncThunk(
  'applicationPortal/updateCompany',
  async (data: UpdateCompanyRequest, { dispatch, rejectWithValue }) => {
    try {
      const response = await applicationPortalApiService.updateCompany(data)
      dispatch(fetchCompany())
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update company')
    }
  }
)

export const fetchLetterhead = createAsyncThunk(
  'applicationPortal/fetchLetterhead',
  async (portfolioCompanyId: string, { rejectWithValue }) => {
    try {
      const response = await applicationPortalApiService.getLetterhead(portfolioCompanyId)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch letterhead')
    }
  }
)

export const updateLetterhead = createAsyncThunk(
  'applicationPortal/updateLetterhead',
  async (
    { portfolioCompanyId, data }: { portfolioCompanyId: string; data: UpdateLetterheadRequest },
    { rejectWithValue }
  ) => {
    try {
      const response = await applicationPortalApiService.updateLetterhead(portfolioCompanyId, data)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update letterhead')
    }
  }
)

export const deleteLetterhead = createAsyncThunk(
  'applicationPortal/deleteLetterhead',
  async (portfolioCompanyId: string, { rejectWithValue }) => {
    try {
      await applicationPortalApiService.deleteLetterhead(portfolioCompanyId)
      return true
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete letterhead')
    }
  }
)

export const uploadLetterheadLogo = createAsyncThunk(
  'applicationPortal/uploadLetterheadLogo',
  async (
    { portfolioCompanyId, file }: { portfolioCompanyId: string; file: File },
    { rejectWithValue }
  ) => {
    try {
      const response = await applicationPortalApiService.uploadLetterheadLogo(portfolioCompanyId, file)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to upload letterhead logo')
    }
  }
)

export const fetchDashboard = createAsyncThunk(
  'applicationPortal/fetchDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const response = await applicationPortalApiService.getDashboard()
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch dashboard')
    }
  }
)

export const fetchInvestment = createAsyncThunk(
  'applicationPortal/fetchInvestment',
  async (_, { rejectWithValue }) => {
    try {
      const response = await applicationPortalApiService.getInvestment()
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch investment')
    }
  }
)

export const fetchValuations = createAsyncThunk(
  'applicationPortal/fetchValuations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await applicationPortalApiService.getValuations()
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch valuations')
    }
  }
)

export const fetchReports = createAsyncThunk(
  'applicationPortal/fetchReports',
  async (_, { rejectWithValue }) => {
    try {
      const response = await applicationPortalApiService.getReports()
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch reports')
    }
  }
)

export const signTermSheet = createAsyncThunk(
  'applicationPortal/signTermSheet',
  async ({ termSheetId, signature }: { termSheetId: string, signature: Blob | File }, { dispatch, rejectWithValue }) => {
    try {
      const response = await applicationPortalApiService.signTermSheet(termSheetId, signature);
      dispatch(fetchTermSheets());
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to sign term sheet');
    }
  }
);
export const fetchTermSheets = createAsyncThunk(
  'applicationPortal/fetchTermSheets',
  async (params?: { page?: number; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await applicationPortalApiService.getMyTermSheets(params)
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch term sheets')
    }
  }
)

export const initiateInvestmentImplementation = createAsyncThunk(
  'applicationPortal/initiateInvestmentImplementation',
  async (data: InitiateInvestmentImplementationRequest, { dispatch, rejectWithValue }) => {
    try {
      const response = await applicationPortalApiService.initiateInvestmentImplementation(data)
      // Refresh application and timeline after initiating
      dispatch(fetchApplication())
      dispatch(fetchTimeline())
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to initiate investment implementation')
    }
  }
)

export const fetchFinancialReports = createAsyncThunk(
  'applicationPortal/fetchFinancialReports',
  async (_, { rejectWithValue }) => {
    try {
      const response = await applicationPortalApiService.getFinancialReports()
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch financial reports')
    }
  }
)

export const downloadFinancialReportTemplate = createAsyncThunk(
  'applicationPortal/downloadFinancialReportTemplate',
  async (reportType: FinancialReportType, { rejectWithValue }) => {
    try {
      const csvString = await applicationPortalApiService.downloadFinancialReportTemplate(reportType)
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${reportType.toLowerCase()}_template.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      return { success: true }
    } catch (error: any) {
      return rejectWithValue(error.message || `Failed to download ${reportType} template`)
    }
  }
)

export const uploadFinancialReport = createAsyncThunk(
  'applicationPortal/uploadFinancialReport',
  async (data: UploadFinancialReportRequest, { dispatch, rejectWithValue }) => {
    try {
      const response = await applicationPortalApiService.uploadFinancialReport(data)
      dispatch(fetchFinancialReports())
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to upload financial report')
    }
  }
)

export const submitFinancialReports = createAsyncThunk(
  'applicationPortal/submitFinancialReports',
  async (data: SubmitFinancialReportsRequest, { dispatch, rejectWithValue }) => {
    try {
      const response = await applicationPortalApiService.submitFinancialReports(data)
      dispatch(fetchFinancialReports())
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to submit financial reports')
    }
  }
)

export const submitPeriodKPIs = createAsyncThunk(
  'applicationPortal/submitPeriodKPIs',
  async (data: SubmitPeriodKPIsRequest, { rejectWithValue }) => {
    try {
      const response = await applicationPortalApiService.submitPeriodKPIs(data)
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to submit period KPIs')
    }
  }
)

// Slice
const applicationPortalSlice = createSlice({
  name: 'applicationPortal',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
      state.profileError = null
      state.applicationError = null
      state.timelineError = null
      state.companyError = null
      state.dashboardError = null
      state.investmentError = null
      state.valuationsError = null
      state.reportsError = null
      state.termSheetsError = null
      state.financialReportsError = null
    },
    clearProfile: (state) => {
      state.profile = null
    },
    clearApplication: (state) => {
      state.application = null
    },
    clearTimeline: (state) => {
      state.timeline = null
    },
    clearCompany: (state) => {
      state.company = null
    },
    clearDashboard: (state) => {
      state.dashboard = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Profile
      .addCase(fetchProfile.pending, (state) => {
        state.profileLoading = true
        state.profileError = null
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.profileLoading = false
        state.profile = action.payload.data
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.profileLoading = false
        state.profileError = action.payload as string
      })

      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true
      })
      .addCase(updateProfile.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      // Fetch Application
      .addCase(fetchApplication.pending, (state) => {
        state.applicationLoading = true
        state.applicationError = null
      })
      .addCase(fetchApplication.fulfilled, (state, action) => {
        state.applicationLoading = false
        state.application = action.payload.data
      })
      .addCase(fetchApplication.rejected, (state, action) => {
        state.applicationLoading = false
        state.applicationError = action.payload as string
      })

      // Fetch Timeline
      .addCase(fetchTimeline.pending, (state) => {
        state.timelineLoading = true
        state.timelineError = null
      })
      .addCase(fetchTimeline.fulfilled, (state, action) => {
        state.timelineLoading = false
        state.timeline = action.payload.data
      })
      .addCase(fetchTimeline.rejected, (state, action) => {
        state.timelineLoading = false
        state.timelineError = action.payload as string
      })

      // Fetch Company
      .addCase(fetchCompany.pending, (state) => {
        state.companyLoading = true
        state.companyError = null
      })
      .addCase(fetchCompany.fulfilled, (state, action) => {
        state.companyLoading = false
        state.company = action.payload.data
      })
      .addCase(fetchCompany.rejected, (state, action) => {
        state.companyLoading = false
        state.companyError = action.payload as string
      })

      // Update Company
      .addCase(updateCompany.pending, (state) => {
        state.loading = true
      })
      .addCase(updateCompany.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(updateCompany.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      // Fetch Dashboard
      .addCase(fetchDashboard.pending, (state) => {
        state.dashboardLoading = true
        state.dashboardError = null
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.dashboardLoading = false
        state.dashboard = action.payload.data
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.dashboardLoading = false
        state.dashboardError = action.payload as string
      })

      // Fetch Investment
      .addCase(fetchInvestment.pending, (state) => {
        state.investmentLoading = true
        state.investmentError = null
      })
      .addCase(fetchInvestment.fulfilled, (state, action) => {
        state.investmentLoading = false
        state.investment = action.payload.data
      })
      .addCase(fetchInvestment.rejected, (state, action) => {
        state.investmentLoading = false
        state.investmentError = action.payload as string
      })

      // Fetch Valuations
      .addCase(fetchValuations.pending, (state) => {
        state.valuationsLoading = true
        state.valuationsError = null
      })
      .addCase(fetchValuations.fulfilled, (state, action) => {
        state.valuationsLoading = false
        state.valuations = action.payload.data
      })
      .addCase(fetchValuations.rejected, (state, action) => {
        state.valuationsLoading = false
        state.valuationsError = action.payload as string
      })

      // Fetch Reports
      .addCase(fetchReports.pending, (state) => {
        state.reportsLoading = true
        state.reportsError = null
      })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.reportsLoading = false
        state.reports = action.payload.data
      })
      .addCase(fetchReports.rejected, (state, action) => {
        state.reportsLoading = false
        state.reportsError = action.payload as string
      })

      // Sign Term Sheet
      .addCase(signTermSheet.pending, (state) => {
        state.loading = true
      })
      .addCase(signTermSheet.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(signTermSheet.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      // Fetch Term Sheets
      .addCase(fetchTermSheets.pending, (state) => {
        state.termSheetsLoading = true
        state.termSheetsError = null
      })
      .addCase(fetchTermSheets.fulfilled, (state, action) => {
        state.termSheetsLoading = false
        state.termSheets = action.payload.data.termSheets
        state.termSheetsPagination = {
          total: action.payload.data.total,
          page: action.payload.data.page,
          totalPages: action.payload.data.totalPages,
        }
      })
      .addCase(fetchTermSheets.rejected, (state, action) => {
        state.termSheetsLoading = false
        state.termSheetsError = action.payload as string
      })

      // Initiate Investment Implementation
      .addCase(initiateInvestmentImplementation.pending, (state) => {
        state.loading = true
      })
      .addCase(initiateInvestmentImplementation.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(initiateInvestmentImplementation.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      // Financial Reports
      .addCase(fetchFinancialReports.pending, (state) => {
        state.financialReportsLoading = true
        state.financialReportsError = null
      })
      .addCase(fetchFinancialReports.fulfilled, (state, action: PayloadAction<FinancialReport[]>) => {
        state.financialReportsLoading = false
        state.financialReports = action.payload
      })
      .addCase(fetchFinancialReports.rejected, (state, action) => {
        state.financialReportsLoading = false
        state.financialReportsError = action.payload as string
      })
      .addCase(uploadFinancialReport.pending, (state) => {
        state.loading = true
      })
      .addCase(uploadFinancialReport.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(uploadFinancialReport.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(submitFinancialReports.pending, (state) => {
        state.loading = true
      })
      .addCase(submitFinancialReports.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(submitFinancialReports.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(submitPeriodKPIs.pending, (state) => {
        state.loading = true
      })
      .addCase(submitPeriodKPIs.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(submitPeriodKPIs.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      // Letterhead
      .addCase(fetchLetterhead.pending, (state) => {
        state.letterheadLoading = true
        state.letterheadError = null
      })
      .addCase(fetchLetterhead.fulfilled, (state, action: PayloadAction<Letterhead>) => {
        state.letterheadLoading = false
        state.letterhead = action.payload
      })
      .addCase(fetchLetterhead.rejected, (state, action) => {
        state.letterheadLoading = false
        state.letterheadError = action.payload as string
        state.letterhead = null
      })
      .addCase(updateLetterhead.pending, (state) => {
        state.letterheadSaving = true
      })
      .addCase(updateLetterhead.fulfilled, (state, action: PayloadAction<Letterhead>) => {
        state.letterheadSaving = false
        state.letterhead = action.payload
      })
      .addCase(updateLetterhead.rejected, (state, action) => {
        state.letterheadSaving = false
        state.letterheadError = action.payload as string
      })
      .addCase(deleteLetterhead.pending, (state) => {
        state.letterheadSaving = true
      })
      .addCase(deleteLetterhead.fulfilled, (state) => {
        state.letterheadSaving = false
        state.letterhead = null
      })
      .addCase(deleteLetterhead.rejected, (state, action) => {
        state.letterheadSaving = false
        state.letterheadError = action.payload as string
      })
      .addCase(uploadLetterheadLogo.pending, (state) => {
        state.letterheadLogoUploading = true
      })
      .addCase(uploadLetterheadLogo.fulfilled, (state, action: PayloadAction<Letterhead>) => {
        state.letterheadLogoUploading = false
        state.letterhead = action.payload
      })
      .addCase(uploadLetterheadLogo.rejected, (state, action) => {
        state.letterheadLogoUploading = false
        state.letterheadError = action.payload as string
      })
  },
})

export const {
  clearError,
  clearProfile,
  clearApplication,
  clearTimeline,
  clearCompany,
  clearDashboard,
} = applicationPortalSlice.actions

export default applicationPortalSlice.reducer
