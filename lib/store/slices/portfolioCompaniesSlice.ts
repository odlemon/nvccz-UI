import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { portfolioCompaniesApi, PortfolioCompany } from '@/lib/api/portfolio-companies-api'
import { portfolioApi, PortfolioFinancialReport, ReviewFinancialReportRequest } from '@/lib/api/portfolio-api'

interface PortfolioCompaniesState {
  companies: PortfolioCompany[]
  selectedCompany: PortfolioCompany | null
  loading: boolean
  error: string | null
  financialReports: PortfolioFinancialReport[]
  financialReportsLoading: boolean
  financialReportsError: string | null
}

const initialState: PortfolioCompaniesState = {
  companies: [],
  selectedCompany: null,
  loading: false,
  error: null,
  financialReports: [],
  financialReportsLoading: false,
  financialReportsError: null,
}

export const fetchPortfolioCompanies = createAsyncThunk(
  'portfolioCompanies/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await portfolioCompaniesApi.getAllWithInvestments()
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch portfolio companies')
    }
  }
)

export const fetchCompanyById = createAsyncThunk(
  'portfolioCompanies/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await portfolioCompaniesApi.getById(id)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch company details')
    }
  }
)

export const fetchCompanyFinancialReports = createAsyncThunk(
  'portfolioCompanies/fetchCompanyFinancialReports',
  async (companyId: string, { rejectWithValue }) => {
    try {
      const response = await portfolioApi.getCompanyFinancialReports(companyId)
      const payload = response?.data
      if (Array.isArray(payload)) {
        return payload
      }
      if (payload && typeof payload === 'object' && Array.isArray((payload as any).items)) {
        return (payload as any).items
      }
      return []
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch financial reports')
    }
  }
)

export const reviewFinancialReport = createAsyncThunk(
  'portfolioCompanies/reviewFinancialReport',
  async (
    { companyId, reportId, data }: { companyId: string; reportId: string; data: ReviewFinancialReportRequest },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const response = await portfolioApi.reviewFinancialReport(companyId, reportId, data)
      dispatch(fetchCompanyFinancialReports(companyId))
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to review report')
    }
  }
)

const portfolioCompaniesSlice = createSlice({
  name: 'portfolioCompanies',
  initialState,
  reducers: {
    setSelectedCompany: (state, action: PayloadAction<PortfolioCompany | null>) => {
      state.selectedCompany = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPortfolioCompanies.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchPortfolioCompanies.fulfilled, (state, action) => {
        state.loading = false
        state.companies = action.payload
      })
      .addCase(fetchPortfolioCompanies.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(fetchCompanyFinancialReports.pending, (state) => {
        state.financialReportsLoading = true
        state.financialReportsError = null
      })
      .addCase(fetchCompanyFinancialReports.fulfilled, (state, action) => {
        state.financialReportsLoading = false
        state.financialReports = action.payload || []
      })
      .addCase(fetchCompanyFinancialReports.rejected, (state, action) => {
        state.financialReportsLoading = false
        state.financialReportsError = action.payload as string
      })
      .addCase(reviewFinancialReport.pending, (state) => {
        // Optionally set a submitting state
      })
      .addCase(reviewFinancialReport.rejected, (state, action) => {
        // Optionally handle review error
      })
  },
})

export const { setSelectedCompany } = portfolioCompaniesSlice.actions

export default portfolioCompaniesSlice.reducer
