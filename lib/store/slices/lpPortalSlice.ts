import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import {
  lpPortalApi,
  LpDashboard,
  LpLedgerEntry as LpLedgerEntryApi,
  LpLedgerDetail,
  LpVaultDocument,
  LpVaultCategory,
  LpVaultVerifyResult,
  LpReport,
  LpReportsPagination,
  LpColleague,
} from "@/lib/api/lp-portal-api"
import { parseDecimal } from "@/lib/lp-portal/format"

/** Legacy ledger row shape used by lp-ledger.tsx */
export interface LpLedgerEntry {
  id: string
  fundId: string
  type: string
  amount: number
  currencyCode: string
  valueDate: string
  description: string
  createdAt: string
}

export interface LpLedgerEntryDetail extends LpLedgerEntry {
  bankConfirmationRef?: string
  bankConfirmationDate?: string
  callNoticeDocumentId?: string
}

function mapLedgerRow(entry: LpLedgerEntryApi): LpLedgerEntry {
  return {
    id: entry.entryId,
    fundId: entry.fundId,
    type: entry.entryType,
    amount: parseDecimal(entry.amount),
    currencyCode: entry.currency,
    valueDate: entry.transactionDate,
    description: entry.description,
    createdAt: entry.transactionDate,
  }
}

async function fetchLegacyDashboard(params: {
  fundId?: string
  presentationCurrency?: "USD" | "ZIG"
}): Promise<LpDashboard> {
  const [session, byFund] = await Promise.all([
    lpPortalApi.getSession(),
    lpPortalApi.getPerformanceByFund(),
  ])
  return {
    client: session.data.client,
    lpRole: session.data.lpRole,
    presentationCurrency: (params.presentationCurrency ?? session.data.presentationCurrency) as "USD" | "ZIG",
    funds: byFund.data.funds.map((fund) => ({
      fundId: fund.fundId,
      fundName: fund.fundName,
      commitment: parseDecimal(fund.paidIn),
      paidIn: parseDecimal(fund.paidIn),
      distributions: parseDecimal(fund.distributions),
      nav: parseDecimal(fund.nav),
      dpi: parseDecimal(fund.dpi),
      tvpi: parseDecimal(fund.tvpi),
      rvpi: parseDecimal(fund.rvpi),
      netIrr: parseDecimal(fund.netIrr),
      currencyCode: session.data.presentationCurrency,
    })),
    exchangeRateWidget: null,
    latestReports: [],
  }
}

interface LpPortalState {
  dashboard: LpDashboard | null
  dashboardLoading: boolean
  dashboardError: string | null

  ledger: LpLedgerEntry[]
  ledgerLoading: boolean
  ledgerError: string | null

  selectedLedgerEntry: LpLedgerEntryDetail | null
  ledgerEntryLoading: boolean
  ledgerEntryError: string | null

  vault: LpVaultDocument[]
  vaultLoading: boolean
  vaultError: string | null
  vaultCategoryFilter: LpVaultCategory | null
  vaultVerifyResultById: Record<string, LpVaultVerifyResult>
  vaultVerifyLoadingById: Record<string, boolean>

  reports: LpReport[]
  reportsPagination: LpReportsPagination
  reportsLoading: boolean
  reportsError: string | null

  colleagues: LpColleague[]
  colleaguesLoading: boolean
  colleaguesError: string | null

  loading: boolean
  error: string | null
}

const initialState: LpPortalState = {
  dashboard: null,
  dashboardLoading: false,
  dashboardError: null,

  ledger: [],
  ledgerLoading: false,
  ledgerError: null,

  selectedLedgerEntry: null,
  ledgerEntryLoading: false,
  ledgerEntryError: null,

  vault: [],
  vaultLoading: false,
  vaultError: null,
  vaultCategoryFilter: null,
  vaultVerifyResultById: {},
  vaultVerifyLoadingById: {},

  reports: [],
  reportsPagination: { page: 1, limit: 20, total: 0, pages: 0 },
  reportsLoading: false,
  reportsError: null,

  colleagues: [],
  colleaguesLoading: false,
  colleaguesError: null,

  loading: false,
  error: null,
}

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

export const fetchLpDashboard = createAsyncThunk(
  'lpPortal/fetchLpDashboard',
  async (params: { fundId?: string; presentationCurrency?: 'USD' | 'ZIG' } = {}, { rejectWithValue }) => {
    try {
      return await fetchLegacyDashboard(params)
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch dashboard')
    }
  }
)

export const fetchLpLedger = createAsyncThunk(
  'lpPortal/fetchLpLedger',
  async (params: { fundId?: string; currencyCode?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await lpPortalApi.getLedger({
        fundId: params.fundId,
        currency: params.currencyCode,
      })
      return response.data.map(mapLedgerRow)
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch capital account ledger')
    }
  }
)

export const fetchLpLedgerEntry = createAsyncThunk(
  'lpPortal/fetchLpLedgerEntry',
  async (entryId: string, { rejectWithValue }) => {
    try {
      const response = await lpPortalApi.getLedgerEntry(entryId)
      const detail = response.data as LpLedgerDetail
      const base: LpLedgerEntryDetail = {
        id: entryId,
        fundId: detail.allocation?.clientId ?? "",
        type: detail.entryType,
        amount: parseDecimal(detail.allocation?.currentCallAmount),
        currencyCode: "USD",
        valueDate: "",
        description: detail.entryType,
        createdAt: "",
        callNoticeDocumentId: detail.callNoticeDocumentId ?? undefined,
      }
      return base
    } catch (error: any) {
      return rejectWithValue(error.message || 'Ledger entry not found')
    }
  }
)

export const fetchLpVault = createAsyncThunk(
  'lpPortal/fetchLpVault',
  async (category: LpVaultCategory | undefined, { rejectWithValue }) => {
    try {
      const response = await lpPortalApi.getVault(category)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch document vault')
    }
  }
)

export const downloadLpVaultDocument = createAsyncThunk(
  'lpPortal/downloadLpVaultDocument',
  async ({ documentId, filename }: { documentId: string; filename: string }, { rejectWithValue }) => {
    try {
      const blob = await lpPortalApi.downloadVaultDocument(documentId)
      downloadBlob(blob, filename)
      return { success: true }
    } catch (error: any) {
      return rejectWithValue(error.message || 'File not available')
    }
  }
)

export const verifyLpVaultDocument = createAsyncThunk(
  'lpPortal/verifyLpVaultDocument',
  async (documentId: string, { rejectWithValue }) => {
    try {
      const response = await lpPortalApi.verifyVaultDocument(documentId)
      return { documentId, data: response.data }
    } catch (error: any) {
      return rejectWithValue({ documentId, message: error.message || 'Failed to verify document' })
    }
  }
)

export const fetchLpReports = createAsyncThunk(
  'lpPortal/fetchLpReports',
  async (fundId: string | undefined, { rejectWithValue }) => {
    try {
      const response = await lpPortalApi.getReports({ fundId })
      return {
        reports: response.data.data,
        pagination: response.data.pagination,
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch performance reports')
    }
  }
)

export const downloadLpReport = createAsyncThunk(
  'lpPortal/downloadLpReport',
  async ({ jobId, filename }: { jobId: string; filename: string }, { rejectWithValue }) => {
    try {
      const blob = await lpPortalApi.downloadReport(jobId)
      downloadBlob(blob, filename)
      return { success: true }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Report not available')
    }
  }
)

export const fetchLpColleagues = createAsyncThunk(
  'lpPortal/fetchLpColleagues',
  async (_, { rejectWithValue }) => {
    try {
      const response = await lpPortalApi.getColleagues()
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch colleagues')
    }
  }
)

export const inviteLpColleague = createAsyncThunk(
  'lpPortal/inviteLpColleague',
  async (
    payload: string | { email: string; role?: string; fundIds?: string[] },
    { dispatch, rejectWithValue },
  ) => {
    try {
      const body =
        typeof payload === "string"
          ? { email: payload, role: "VIEWER", fundIds: [] as string[] }
          : {
              email: payload.email,
              role: payload.role ?? "VIEWER",
              fundIds: payload.fundIds ?? [],
            }
      const response = await lpPortalApi.inviteColleague(body)
      dispatch(fetchLpColleagues())
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'User not found — invite must match an existing account')
    }
  }
)

export const revokeLpColleague = createAsyncThunk(
  'lpPortal/revokeLpColleague',
  async (membershipId: string, { dispatch, rejectWithValue }) => {
    try {
      const response = await lpPortalApi.revokeColleague(membershipId)
      dispatch(fetchLpColleagues())
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to revoke colleague access')
    }
  }
)

const lpPortalSlice = createSlice({
  name: 'lpPortal',
  initialState,
  reducers: {
    setVaultCategoryFilter(state, action) {
      state.vaultCategoryFilter = action.payload
    },
    clearSelectedLedgerEntry(state) {
      state.selectedLedgerEntry = null
      state.ledgerEntryError = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLpDashboard.pending, (state) => { state.dashboardLoading = true; state.dashboardError = null })
      .addCase(fetchLpDashboard.fulfilled, (state, action) => { state.dashboardLoading = false; state.dashboard = action.payload })
      .addCase(fetchLpDashboard.rejected, (state, action) => { state.dashboardLoading = false; state.dashboardError = action.payload as string })

      .addCase(fetchLpLedger.pending, (state) => { state.ledgerLoading = true; state.ledgerError = null })
      .addCase(fetchLpLedger.fulfilled, (state, action) => { state.ledgerLoading = false; state.ledger = action.payload })
      .addCase(fetchLpLedger.rejected, (state, action) => { state.ledgerLoading = false; state.ledgerError = action.payload as string })

      .addCase(fetchLpLedgerEntry.pending, (state) => { state.ledgerEntryLoading = true; state.ledgerEntryError = null; state.selectedLedgerEntry = null })
      .addCase(fetchLpLedgerEntry.fulfilled, (state, action) => { state.ledgerEntryLoading = false; state.selectedLedgerEntry = action.payload })
      .addCase(fetchLpLedgerEntry.rejected, (state, action) => { state.ledgerEntryLoading = false; state.ledgerEntryError = action.payload as string })

      .addCase(fetchLpVault.pending, (state) => { state.vaultLoading = true; state.vaultError = null })
      .addCase(fetchLpVault.fulfilled, (state, action) => { state.vaultLoading = false; state.vault = action.payload })
      .addCase(fetchLpVault.rejected, (state, action) => { state.vaultLoading = false; state.vaultError = action.payload as string })

      .addCase(verifyLpVaultDocument.pending, (state, action) => { state.vaultVerifyLoadingById[action.meta.arg] = true })
      .addCase(verifyLpVaultDocument.fulfilled, (state, action) => {
        state.vaultVerifyLoadingById[action.payload.documentId] = false
        state.vaultVerifyResultById[action.payload.documentId] = action.payload.data
      })
      .addCase(verifyLpVaultDocument.rejected, (state, action) => {
        const payload = action.payload as { documentId: string; message: string }
        state.vaultVerifyLoadingById[payload.documentId] = false
      })

      .addCase(fetchLpReports.pending, (state) => { state.reportsLoading = true; state.reportsError = null })
      .addCase(fetchLpReports.fulfilled, (state, action) => {
        state.reportsLoading = false
        state.reports = action.payload.reports
        state.reportsPagination = action.payload.pagination
      })
      .addCase(fetchLpReports.rejected, (state, action) => { state.reportsLoading = false; state.reportsError = action.payload as string })

      .addCase(fetchLpColleagues.pending, (state) => { state.colleaguesLoading = true; state.colleaguesError = null })
      .addCase(fetchLpColleagues.fulfilled, (state, action) => { state.colleaguesLoading = false; state.colleagues = action.payload })
      .addCase(fetchLpColleagues.rejected, (state, action) => { state.colleaguesLoading = false; state.colleaguesError = action.payload as string })

      .addCase(inviteLpColleague.pending, (state) => { state.loading = true; state.error = null })
      .addCase(inviteLpColleague.fulfilled, (state) => { state.loading = false })
      .addCase(inviteLpColleague.rejected, (state, action) => { state.loading = false; state.error = action.payload as string })

      .addCase(revokeLpColleague.pending, (state) => { state.loading = true; state.error = null })
      .addCase(revokeLpColleague.fulfilled, (state) => { state.loading = false })
      .addCase(revokeLpColleague.rejected, (state, action) => { state.loading = false; state.error = action.payload as string })
  },
})

export const { setVaultCategoryFilter, clearSelectedLedgerEntry } = lpPortalSlice.actions
export default lpPortalSlice.reducer
