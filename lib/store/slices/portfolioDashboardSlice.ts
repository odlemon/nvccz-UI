import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { applicationsApi, Application } from '@/lib/api/applications-api'
import { fundsApi, Fund } from '@/lib/api/funds-api'
import { portfolioCompaniesApi, PortfolioCompany } from '@/lib/api/portfolio-companies-api'
import { portfolioApi, type PortfolioDashboardData, type PortfolioDashboardParams } from '@/lib/api/portfolio-api'

export interface PortfolioDashboardState {
  applications: Application[]
  funds: Fund[]
  companies: PortfolioCompany[]
  isLoading: boolean
  error: string | null
  metrics: {
    totalInvested: number
    totalRequested: number
    activeCompanies: number
    totalApplications: number
    totalDisbursed: number
  }
  // Dashboard V2
  dashboardData: PortfolioDashboardData | null
  dashboardLoading: boolean
  dashboardError: string | null
}

const initialState: PortfolioDashboardState = {
  applications: [],
  funds: [],
  companies: [],
  isLoading: false,
  error: null,
  metrics: {
    totalInvested: 0,
    totalRequested: 0,
    activeCompanies: 0,
    totalApplications: 0,
    totalDisbursed: 0
  },
  // Dashboard V2
  dashboardData: null,
  dashboardLoading: false,
  dashboardError: null,
}

export const fetchPortfolioDashboardData = createAsyncThunk(
  'portfolioDashboard/fetchData',
  async (_, { rejectWithValue }) => {
    try {
      const [applicationsRes, fundsRes, companiesRes] = await Promise.all([
        applicationsApi.getAll(),
        fundsApi.getAll(),
        portfolioCompaniesApi.getAll()
      ])

      return {
        applications: applicationsRes.data.applications || [],
        funds: fundsRes.data.funds || [],
        companies: companiesRes.data || []
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch dashboard data')
    }
  }
)

// Dashboard V2 thunk
export const fetchPortfolioDashboard = createAsyncThunk(
  'portfolioDashboard/fetchPortfolioDashboard',
  async (params: PortfolioDashboardParams = {}, { rejectWithValue }) => {
    try {
      const response = await portfolioApi.getDashboard(params)
      if (!response.success) {
        return rejectWithValue(response.message || 'Failed to fetch portfolio dashboard')
      }
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch portfolio dashboard')
    }
  }
)

const portfolioDashboardSlice = createSlice({
  name: 'portfolioDashboard',
  initialState,
  reducers: {
    clearDashboardData: (state) => {
      return initialState
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPortfolioDashboardData.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchPortfolioDashboardData.fulfilled, (state, action) => {
        state.isLoading = false
        state.applications = action.payload.applications
        state.funds = action.payload.funds
        state.companies = action.payload.companies

        // Calculate metrics
        const totalDisbursed = action.payload.funds.reduce((sum, fund) => {
          const fundDisbursed = (fund.fundDisbursements || [])
            .filter(d => d.status === 'DISBURSED')
            .reduce((s, d) => s + Number(d.amount || 0), 0)
          return sum + fundDisbursed
        }, 0)

        const totalInvested = action.payload.companies.reduce((sum, company) => 
          sum + (Number(company.totalInvested) || 0), 0
        )

        const totalRequested = action.payload.applications.reduce((sum, app) => 
          sum + (Number(app.requestedAmount) || 0), 0
        )

        const activeCompanies = action.payload.companies.filter(c => 
          c.status === 'ACTIVE'
        ).length

        state.metrics = {
          totalInvested,
          totalRequested,
          activeCompanies,
          totalApplications: action.payload.applications.length,
          totalDisbursed
        }
      })
      .addCase(fetchPortfolioDashboardData.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // Dashboard V2
      .addCase(fetchPortfolioDashboard.pending, (state) => {
        state.dashboardLoading = true
        state.dashboardError = null
      })
      .addCase(fetchPortfolioDashboard.fulfilled, (state, action) => {
        state.dashboardLoading = false
        state.dashboardData = action.payload
      })
      .addCase(fetchPortfolioDashboard.rejected, (state, action) => {
        state.dashboardLoading = false
        state.dashboardError = action.payload as string
      })
  }
})

export const { clearDashboardData } = portfolioDashboardSlice.actions
export default portfolioDashboardSlice.reducer
