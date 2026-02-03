import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { accountingApi, AccountingCurrency, ChartOfAccount, Customer, Vendor, ExpenseCategory, Expense, TrialBalanceData, TrialBalanceSummary, IncomeStatementData, Asset, CreditNote, CreateCreditNoteRequest, InventoryItem, InventoryListResponse, CreateInventoryRequest, UpdateInventoryRequest, StockMovement, CreateStockMovementRequest, InventoryValuationResponse, ReorderAlertItem, CogsRequest, CogsResponse, StockAdjustmentRequest, StockAdjustmentResponse, ExchangeRate, CreateExchangeRateRequest, UpdateExchangeRateRequest, BalanceSheetResponse, CashFlowResponse, CashbookBank, CashbookEntry, Invoice, InvoiceCustomer, AccountingDashboardData, AccountingDashboardParams } from '@/lib/api/accounting-api'
import {
  BankReconciliation,
  BankTransaction,
  BankReconciliationSummary,
  BankReconciliationAuditTrail,
  BankReconciliationUploadResponse,
  ApproveMatchRequest
} from '@/lib/api/accounting-api'
import { CashbookBankPosition } from '@/lib/api/accounting-api'
import {
  CashbookCashFlowReport,
  CashbookBalanceCheckReport
} from '@/lib/api/accounting-api'
import { cashbookApi } from '@/lib/api/cashbook-api'

// Async thunks for expenses
export const fetchExpenses = createAsyncThunk(
  'accounting/fetchExpenses',
  async (params?: { page?: number; limit?: number; search?: string; isActive?: boolean; status?: 'DRAFT' | 'POSTED' | 'VOID' }) => {
    const response = await accountingApi.getExpenses(params)
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch expenses')
    }
    return response.data
  }
)

export const fetchExpenseById = createAsyncThunk(
  'accounting/fetchExpenseById',
  async (id: string) => {
    const response = await accountingApi.getExpenseById(id)
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch expense')
    }
    return response.data
  }
)

export const createExpense = createAsyncThunk(
  'accounting/createExpense',
  async (data: any) => {
    const response = await accountingApi.createExpense(data)
    if (!response.success) {
      throw new Error(response.error || 'Failed to create expense')
    }
    return response.data
  }
)

export const updateExpense = createAsyncThunk(
  'accounting/updateExpense',
  async ({ id, data }: { id: string; data: any }) => {
    const response = await accountingApi.updateExpense(id, data)
    if (!response.success) {
      throw new Error(response.error || 'Failed to update expense')
    }
    return response.data
  }
)

export const deleteExpense = createAsyncThunk(
  'accounting/deleteExpense',
  async (id: string) => {
    const response = await accountingApi.deleteExpense(id)
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete expense')
    }
    return id
  }
)

// Async thunks for reference data
export const fetchCurrencies = createAsyncThunk(
  'accounting/fetchCurrencies',
  async () => {
    const response = await accountingApi.getCurrencies()
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch currencies')
    }
    return response.data
  }
)

export const fetchVendors = createAsyncThunk(
  'accounting/fetchVendors',
  async () => {
    const response = await accountingApi.getVendors()
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch vendors')
    }
    return response.data
  }
)

export const fetchExpenseCategories = createAsyncThunk(
  'accounting/fetchExpenseCategories',
  async () => {
    const response = await accountingApi.getExpenseCategories()
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch expense categories')
    }
    return response.data
  }
)

// Add new async thunks for posting and voiding journal entries
export const postJournalEntry = createAsyncThunk(
  'accounting/postJournalEntry',
  async (entryId: string, { rejectWithValue }) => {
    try {
      const response = await accountingApi.postJournalEntry(entryId)
      if (!response.success) {
        return rejectWithValue(response.error || response.message || 'Failed to post journal entry')
      }
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error')
    }
  }
)

export const voidJournalEntry = createAsyncThunk(
  'accounting/voidJournalEntry',
  async (entryId: string, { rejectWithValue }) => {
    try {
      const response = await accountingApi.voidJournalEntry(entryId)
      if (!response.success) {
        return rejectWithValue(response.error || response.message || 'Failed to void journal entry')
      }
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error')
    }
  }
)

// Add the missing async thunk for chart of accounts
export const fetchChartOfAccounts = createAsyncThunk(
  'accounting/fetchChartOfAccounts',
  async (params?: {
    accountType?: string
    isActive?: boolean
    parentId?: string
  }) => {
    const response = await accountingApi.getChartOfAccounts(params)
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch chart of accounts')
    }
    return response.data
  }
)

// Trial Balance thunks
export const fetchTrialBalance = createAsyncThunk(
  'accounting/fetchTrialBalance',
  async (params: {
    periodType?: string;
    periodValue?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
    currencyId?: string;
  }) => {
    const response = await accountingApi.getTrialBalanceV2(params)
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch trial balance')
    }
    return response.data
  }
)

export const fetchTrialBalanceSummary = createAsyncThunk(
  'accounting/fetchTrialBalanceSummary',
  async (params: {
    periodType?: string;
    periodValue?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
    currencyId?: string;
  }) => {
    const response = await accountingApi.getTrialBalanceSummaryV2(params)
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch trial balance summary')
    }
    return response.data
  }
)

// Income Statement thunk
export const fetchIncomeStatement = createAsyncThunk(
  'accounting/fetchIncomeStatement',
  async (params: {
    periodType?: string;
    periodValue?: string;
    startDate?: string;
    endDate?: string;
    currencyId?: string;
  }) => {
    const response = await accountingApi.getIncomeStatementV2(params)
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch income statement')
    }
    return response.data
  }
)

// Assets thunks
export const fetchAssets = createAsyncThunk(
  'accounting/fetchAssets',
  async () => {
    const response = await accountingApi.getAssets()
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch assets')
    }
    return response.data
  }
)

export const fetchAsset = createAsyncThunk(
  'accounting/fetchAsset',
  async (id: string) => {
    const response = await accountingApi.getAsset(id)
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch asset')
    }
    return response.data
  }
)

// Assets thunks
export const postDepreciation = createAsyncThunk(
  'accounting/postDepreciation',
  async (depreciationId: string) => {
    const response = await accountingApi.postDepreciation(depreciationId)
    if (!response.success) {
      throw new Error(response.error || 'Failed to post depreciation')
    }
    return depreciationId
  }
)

// Credit Notes thunks
export const fetchCreditNotes = createAsyncThunk(
  'accounting/fetchCreditNotes',
  async (filters?: { status?: string }) => {
    const response = await accountingApi.getCreditNotes()
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch credit notes')
    }
    return response.data
  }
)

export const fetchCreditNote = createAsyncThunk(
  'accounting/fetchCreditNote',
  async (id: string) => {
    const response = await accountingApi.getCreditNote(id)
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch credit note')
    }
    return response.data
  }
)

export const createCreditNote = createAsyncThunk(
  'accounting/createCreditNote',
  async (data: CreateCreditNoteRequest) => {
    const response = await accountingApi.createCreditNote(data)
    if (!response.success) {
      throw new Error(response.error || 'Failed to create credit note')
    }
    return response.data
  }
)

export const sendCreditNote = createAsyncThunk(
  'accounting/sendCreditNote',
  async (id: string) => {
    const response = await accountingApi.sendCreditNote(id)
    if (!response.success) {
      throw new Error(response.error || 'Failed to send credit note')
    }
    return response.data
  }
)

export const applyCreditNote = createAsyncThunk(
  'accounting/applyCreditNote',
  async ({ id, data }: { id: string, data: { invoiceId: string, amount: number } }) => {
    const response = await accountingApi.applyCreditNote(id, data)
    if (!response.success) {
      throw new Error(response.error || 'Failed to apply credit note')
    }
    return { id, ...data }
  }
)

export const deleteCreditNote = createAsyncThunk(
  'accounting/deleteCreditNote',
  async (id: string) => {
    const response = await accountingApi.deleteCreditNote(id)
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete credit note')
    }
    return id
  }
)

// Make sure these thunks exist and are exported
export const fetchCustomers = createAsyncThunk(
  'accounting/fetchCustomers',
  async () => {
    console.log('Fetching customers...')
    const response = await accountingApi.getCustomers()
    console.log('Customers response:', response)
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch customers')
    }
    return response.data
  }
)

// Inventory thunks
export const fetchInventoryItems = createAsyncThunk(
  'accounting/fetchInventoryItems',
  async () => {
    const response = await accountingApi.getInventoryItems()
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch inventory items')
    }
    return response.data
  }
)

export const fetchInventoryItem = createAsyncThunk(
  'accounting/fetchInventoryItem',
  async (id: string) => {
    const response = await accountingApi.getInventoryItem(id)
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch inventory item')
    }
    return response.data
  }
)

export const createInventoryItem = createAsyncThunk(
  'accounting/createInventoryItem',
  async (data: CreateInventoryRequest) => {
    const response = await accountingApi.createInventoryItem(data)
    if (!response.success) {
      throw new Error(response.error || 'Failed to create inventory item')
    }
    return response.data
  }
)

export const updateInventoryItem = createAsyncThunk(
  'accounting/updateInventoryItem',
  async ({ id, data }: { id: string; data: UpdateInventoryRequest }) => {
    const response = await accountingApi.updateInventoryItem(id, data)
    if (!response.success) {
      throw new Error(response.error || 'Failed to update inventory item')
    }
    return response.data
  }
)

export const postStockMovement = createAsyncThunk(
  'accounting/postStockMovement',
  async (data: CreateStockMovementRequest) => {
    const response = await accountingApi.createStockMovement(data)
    if (!response.success) {
      throw new Error(response.error || 'Failed to record stock movement')
    }
    return response.data
  }
)

export const fetchStockMovements = createAsyncThunk(
  'accounting/fetchStockMovements',
  async (itemId: string) => {
    const response = await accountingApi.getStockMovements(itemId)
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch stock movements')
    }
    return response.data
  }
)

// Valuation & reorder thunks
export const fetchInventoryValuation = createAsyncThunk(
  'accounting/fetchInventoryValuation',
  async () => {
    const response = await accountingApi.getInventoryValuation()
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch inventory valuation')
    }
    return response.data
  }
)

export const fetchReorderAlerts = createAsyncThunk(
  'accounting/fetchReorderAlerts',
  async () => {
    const response = await accountingApi.getReorderAlerts()
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch reorder alerts')
    }
    return response.data
  }
)

export const calculateCogs = createAsyncThunk(
  'accounting/calculateCogs',
  async (data: CogsRequest) => {
    const response = await accountingApi.calculateCogs(data)
    if (!response.success) {
      throw new Error(response.error || 'Failed to calculate COGS')
    }
    return response.data
  }
)

export const postInventoryAdjustment = createAsyncThunk(
  'accounting/postInventoryAdjustment',
  async (data: StockAdjustmentRequest) => {
    const response = await accountingApi.createStockAdjustment(data)
    if (!response.success) {
      throw new Error(response.error || 'Failed to create stock adjustment')
    }
    return response.data
  }
)

// New async thunks for exchange rates
export const fetchExchangeRates = createAsyncThunk(
  'accounting/fetchExchangeRates',
  async (params?: { page?: number; limit?: number }) => {
    const response = await accountingApi.getExchangeRates(params)
    if (!response.success) throw new Error(response.error || 'Failed to fetch exchange rates')
    return response.data
  }
)

export const createExchangeRate = createAsyncThunk(
  'accounting/createExchangeRate',
  async (data: CreateExchangeRateRequest, { rejectWithValue }) => {
    try {
      const response = await accountingApi.createExchangeRate(data)
      if (!response.success) return rejectWithValue(response.error || 'Failed to create exchange rate')
      return response.data
    } catch (err: any) {
      return rejectWithValue(err.message)
    }
  }
)

export const updateExchangeRate = createAsyncThunk(
  'accounting/updateExchangeRate',
  async ({ id, data }: { id: string; data: UpdateExchangeRateRequest }, { rejectWithValue }) => {
    try {
      const response = await accountingApi.updateExchangeRate(id, data)
      if (!response.success) return rejectWithValue(response.error || 'Failed to update exchange rate')
      return response.data
    } catch (err: any) {
      return rejectWithValue(err.message)
    }
  }
)

export const deleteExchangeRate = createAsyncThunk(
  'accounting/deleteExchangeRate',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await accountingApi.deleteExchangeRate(id)
      if (!response.success) return rejectWithValue(response.error || 'Failed to delete exchange rate')
      return id
    } catch (err: any) {
      return rejectWithValue(err.message)
    }
  }
)

// Balance Sheet thunks
export const generateBalanceSheet = createAsyncThunk(
  'accounting/generateBalanceSheet',
  async (data: { asOfDate: string; currencyId: string }) => {
    const response = await accountingApi.generateBalanceSheet(data)
    if (!response.success) throw new Error(response.error || 'Failed to generate balance sheet')
    return response.data
  }
)
export const fetchBalanceSheet = createAsyncThunk(
  'accounting/fetchBalanceSheet',
  async (params: {
    periodType?: string;
    periodValue?: string;
    asOfDate?: string;
    currencyId?: string;
  }) => {
    const response = await accountingApi.getBalanceSheetV2(params)
    if (!response.success) throw new Error(response.error || 'Failed to fetch balance sheet')
    return response.data
  }
)

// Cash Flow thunks
export const generateCashFlow = createAsyncThunk(
  'accounting/generateCashFlow',
  async (data: { startDate: string; endDate: string; currencyId: string }) => {
    const response = await accountingApi.generateCashFlow(data)
    if (!response.success) throw new Error(response.error || 'Failed to generate cash flow statement')
    return response.data
  }
)
export const fetchCashFlow = createAsyncThunk(
  'accounting/fetchCashFlow',
  async (params: {
    periodType?: string;
    periodValue?: string;
    startDate?: string;
    endDate?: string;
    currencyId?: string;
  }) => {
    const response = await accountingApi.getCashFlowV2(params)
    if (!response.success) throw new Error(response.error || 'Failed to fetch cash flow statement')
    return response.data
  }
)

// --- BANK RECONCILIATION THUNKS ---
export const fetchBankReconciliations = createAsyncThunk(
  'accounting/fetchBankReconciliations',
  async () => {
    const response = await accountingApi.getBankReconciliations()
    if (!response.success) throw new Error(response.error || 'Failed to fetch bank reconciliations')
    return response.data
  }
)
export const fetchBankReconciliation = createAsyncThunk(
  'accounting/fetchBankReconciliation',
  async (id: string) => {
    const response = await accountingApi.getBankReconciliation(id)
    if (!response.success) throw new Error(response.error || 'Failed to fetch bank reconciliation')
    return response.data
  }
)
export const deleteBankReconciliation = createAsyncThunk(
  'accounting/deleteBankReconciliation',
  async (id: string) => {
    const response = await accountingApi.deleteBankReconciliation(id)
    if (!response.success) throw new Error(response.error || 'Failed to delete bank reconciliation')
    return id
  }
)
export const fetchBankReconciliationSummary = createAsyncThunk(
  'accounting/fetchBankReconciliationSummary',
  async () => {
    const response = await accountingApi.getBankReconciliationSummary()
    if (!response.success) throw new Error(response.error || 'Failed to fetch summary')
    return response.data
  }
)
export const uploadBankReconciliationFile = createAsyncThunk(
  'accounting/uploadBankReconciliationFile',
  async (file: File, { rejectWithValue }) => {
    try {
      const response = await accountingApi.uploadBankReconciliationFile(file)
      if (!response.success) return rejectWithValue(response.error || 'Failed to upload file')
      return response.data
    } catch (err: any) {
      return rejectWithValue(err.message)
    }
  }
)
export const fetchBankReconciliationAuditTrail = createAsyncThunk(
  'accounting/fetchBankReconciliationAuditTrail',
  async (id: string) => {
    const response = await accountingApi.getBankReconciliationAuditTrail(id)
    if (!response.success) throw new Error(response.error || 'Failed to fetch audit trail')
    return response.data
  }
)
export const fetchBankReconciliationUnmatched = createAsyncThunk(
  'accounting/fetchBankReconciliationUnmatched',
  async (id: string) => {
    const response = await accountingApi.getBankReconciliationUnmatched(id)
    if (!response.success) throw new Error(response.error || 'Failed to fetch unmatched transactions')
    return response.data
  }
)
export const fetchBankTransactionMatches = createAsyncThunk(
  'accounting/fetchBankTransactionMatches',
  async (transactionId: string) => {
    const response = await accountingApi.getBankTransactionMatches(transactionId)
    if (!response.success) throw new Error(response.error || 'Failed to fetch matches')
    return response.data
  }
)
export const approveBankReconciliationMatch = createAsyncThunk(
  'accounting/approveBankReconciliationMatch',
  async (data: ApproveMatchRequest, { rejectWithValue }) => {
    try {
      const response = await accountingApi.approveBankReconciliationMatch(data)
      if (!response.success) return rejectWithValue(response.error || 'Failed to approve match')
      return data
    } catch (err: any) {
      return rejectWithValue(err.message)
    }
  }
)
export const rejectBankReconciliationResult = createAsyncThunk(
  'accounting/rejectBankReconciliationResult',
  async (resultId: string, { rejectWithValue }) => {
    try {
      const response = await accountingApi.rejectBankReconciliationResult(resultId)
      if (!response.success) return rejectWithValue(response.error || 'Failed to reject result')
      return resultId
    } catch (err: any) {
      return rejectWithValue(err.message)
    }
  }
)

// --- Cashbook async thunks ---
export const fetchCashbookBanks = createAsyncThunk(
  'accounting/fetchCashbookBanks',
  async () => {
    const response = await cashbookApi.getCashbookBanks()
    if (!response.success) throw new Error(response.error || 'Failed to fetch banks')
    return response.data
  }
)

export const fetchCashbookEntries = createAsyncThunk(
  'accounting/fetchCashbookEntries',
  async (params: { bankId: string }) => {
    const response = await cashbookApi.getCashbookEntries(params)
    if (!response.success) throw new Error(response.error || 'Failed to fetch entries')
    return response.data
  }
)

export const fetchCashbookBankPosition = createAsyncThunk(
  'accounting/fetchCashbookBankPosition',
  async (bankId: string) => {
    const response = await cashbookApi.getCashbookBankPosition(bankId)
    if (!response.success) throw new Error(response.error || 'Failed to fetch bank position')
    return response.data
  }
)

//createCashbookReceipt
export const createCashbookReceipt = createAsyncThunk(
  'accounting/createCashbookReceipt',
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await cashbookApi.createCashbookReceipt(data)
      if (!response.success) return rejectWithValue(response.error || 'Failed to create cashbook receipt')
      return response.data
    } catch (err: any) {
      return rejectWithValue(err.message)
    }
  }
)

// Async thunks for cashbook reports
export const fetchCashbookCashFlowReport = createAsyncThunk(
  'accounting/fetchCashbookCashFlowReport',
  async (params: { bankId: string; startDate: string; endDate: string }) => {
    const response = await cashbookApi.getCashbookCashFlowReport(params)
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch cash flow report')
    }
    return response.data
  }
)

export const fetchCashbookBalanceCheck = createAsyncThunk(
  'accounting/fetchCashbookBalanceCheck',
  async (params: { bankId: string; startDate: string; endDate: string }) => {
    const response = await cashbookApi.getCashbookBalanceCheck(params)
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch balance check')
    }
    return response.data
  }
)

// Dashboard V2 thunk
export const fetchAccountingDashboard = createAsyncThunk(
  'accounting/fetchAccountingDashboard',
  async (params: AccountingDashboardParams = {}) => {
    const response = await accountingApi.getDashboard(params)
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch accounting dashboard')
    }
    return response.data
  }
)

interface AccountingState {
  // Expenses
  expenses: Expense[]
  selectedExpense: Expense | null
  invoices: Invoice[]
  // customers: InvoiceCustomer[]
  selectedInvoice: Invoice | null
  expensesLoading: boolean
  expensesError: string | null
  expensesTotalPages: number
  expensesCurrentPage: number
  
  // Reference data
  currencies: AccountingCurrency[]
  customers: Customer[]
  vendors: Vendor[]
  expenseCategories: ExpenseCategory[]
  
  // Loading states for reference data
  currenciesLoading: boolean
  customersLoading: boolean
  vendorsLoading: boolean
  categoriesLoading: boolean
  
  // Error states for reference data
  currenciesError: string | null
  customersError: string | null
  vendorsError: string | null
  categoriesError: string | null

  // Posting and voiding states
  isPosting: boolean
  isVoiding: boolean
  isPostingJournalEntry: boolean
  isVoidingJournalEntry: boolean

  // Journal entries
  journalEntries: any[]

  // Chart of accounts
  chartOfAccounts: ChartOfAccount[]
  chartOfAccountsLoading: boolean
  chartOfAccountsError: string | null

  // Trial Balance
  trialBalance: TrialBalanceData | null
  trialBalanceSummary: TrialBalanceSummary | null
  trialBalanceLoading: boolean
  trialBalanceError: string | null
  trialBalanceSummaryLoading: boolean
  trialBalanceSummaryError: string | null

  // Income Statement
  incomeStatement: IncomeStatementData | null
  incomeStatementLoading: boolean
  incomeStatementError: string | null

  // Assets
  assets: Asset[]
  assetsLoading: boolean
  assetsError: string | null
  selectedAsset: Asset | null
  selectedAssetLoading: boolean
  selectedAssetError: string | null

  // Credit Notes
  creditNotes: CreditNote[]
  creditNotesLoading: boolean
  creditNotesError: string | null
  selectedCreditNote: CreditNote | null
  selectedCreditNoteLoading: boolean
  selectedCreditNoteError: string | null

  // Inventory
  inventoryItems: InventoryItem[]
  inventoryLoading: boolean
  inventoryError: string | null
  selectedInventoryItem: InventoryItem | null
  selectedInventoryLoading: boolean
  selectedInventoryError: string | null

  // Stock movements for selected item
  stockMovements: StockMovement[]
  stockMovementsLoading: boolean
  stockMovementsError: string | null

  // Inventory valuation
  inventoryValuation: InventoryValuationResponse | null
  inventoryValuationLoading: boolean
  inventoryValuationError: string | null

  // Reorder alerts
  reorderAlerts: ReorderAlertItem[]
  reorderAlertsLoading: boolean
  reorderAlertsError: string | null

  // COGS calculation
  cogsResult: CogsResponse | null
  cogsLoading: boolean
  cogsError: string | null

  // Stock adjustment
  adjustmentLoading: boolean
  adjustmentError: string | null

  // Exchange rates
  exchangeRates: ExchangeRate[]
  exchangeRatesLoading: boolean
  exchangeRatesError: string | null

  // Balance Sheet
  balanceSheet: BalanceSheetResponse | null
  balanceSheetLoading: boolean
  balanceSheetError: string | null
  // Cash Flow
  cashFlow: CashFlowResponse | null
  cashFlowLoading: boolean
  cashFlowError: string | null

  // Bank Reconciliation
  bankReconciliations: BankReconciliation[]
  bankReconciliationLoading: boolean
  bankReconciliationError: string | null
  selectedBankReconciliation: BankReconciliation | null
  selectedBankReconciliationLoading: boolean
  selectedBankReconciliationError: string | null
  bankReconciliationSummary: BankReconciliationSummary | null
  bankReconciliationSummaryLoading: boolean
  bankReconciliationSummaryError: string | null
  bankReconciliationAuditTrail: BankReconciliationAuditTrail[]
  bankReconciliationAuditTrailLoading: boolean
  bankReconciliationAuditTrailError: string | null
  bankReconciliationUploadLoading: boolean
  bankReconciliationUploadError: string | null
  bankReconciliationUnmatched: BankTransaction[]
  bankReconciliationUnmatchedLoading: boolean
  bankReconciliationUnmatchedError: string | null
  bankTransactionMatches: any[]
  bankTransactionMatchesLoading: boolean
  bankTransactionMatchesError: string | null

  // Cashbook
  cashbookBanks: CashbookBank[]
  cashbookBanksLoading: boolean
  cashbookBanksError: string | null
  selectedCashbookBank: CashbookBank | null

  cashbookEntries: CashbookEntry[]
  cashbookEntriesLoading: boolean
  cashbookEntriesError: string | null

  // Cashbook Bank Position
  cashbookBankPosition: CashbookBankPosition | null
  cashbookBankPositionLoading: boolean
  cashbookBankPositionError: string | null

  // Cashbook Reports
  cashbookCashFlowReport: CashbookCashFlowReport | null
  cashbookCashFlowReportLoading: boolean
  cashbookCashFlowReportError: string | null
  cashbookBalanceCheckReport: CashbookBalanceCheckReport | null
  cashbookBalanceCheckReportLoading: boolean
  cashbookBalanceCheckReportError: string | null

  // Selected currency for management
  selectedCurrency: AccountingCurrency | null

  // Dashboard V2
  dashboardData: AccountingDashboardData | null
  dashboardLoading: boolean
  dashboardError: string | null
}

const initialState: AccountingState = {
  // Expenses
  expenses: [],
  selectedExpense: null,
  expensesLoading: false,
  expensesError: null,
  expensesTotalPages: 0,
  expensesCurrentPage: 1,
  
  // Reference data
  currencies: [],
  customers: [],
  vendors: [],
  expenseCategories: [],
  
  // Loading states
  currenciesLoading: false,
  customersLoading: false,
  vendorsLoading: false,
  categoriesLoading: false,
  
  // Error states
  currenciesError: null,
  customersError: null,
  vendorsError: null,
  categoriesError: null,

  // Posting and voiding states
  isPosting: false,
  isVoiding: false,
  isPostingJournalEntry: false,
  isVoidingJournalEntry: false,

  // Journal entries
  journalEntries: [],

  // Chart of accounts
  chartOfAccounts: [],
  chartOfAccountsLoading: false,
  chartOfAccountsError: null,

  // Trial Balance
  trialBalance: null,
  trialBalanceSummary: null,
  trialBalanceLoading: false,
  trialBalanceError: null,
  trialBalanceSummaryLoading: false,
  trialBalanceSummaryError: null,

  // Income Statement
  incomeStatement: null,
  incomeStatementLoading: false,
  incomeStatementError: null,

  // Assets
  assets: [],
  assetsLoading: false,
  assetsError: null,
  selectedAsset: null,
  selectedAssetLoading: false,
  selectedAssetError: null,

  // Credit Notes
  creditNotes: [],
  creditNotesLoading: false,
  creditNotesError: null,
  selectedCreditNote: null,
  selectedCreditNoteLoading: false,
  selectedCreditNoteError: null,

  // Inventory
  inventoryItems: [],
  inventoryLoading: false,
  inventoryError: null,
  selectedInventoryItem: null,
  selectedInventoryLoading: false,
  selectedInventoryError: null,

  // Stock movements
  stockMovements: [],
  stockMovementsLoading: false,
  stockMovementsError: null,

  // Inventory valuation
  inventoryValuation: null,
  inventoryValuationLoading: false,
  inventoryValuationError: null,

  // Reorder alerts
  reorderAlerts: [],
  reorderAlertsLoading: false,
  reorderAlertsError: null,

  // COGS calculation
  cogsResult: null,
  cogsLoading: false,
  cogsError: null,

  // Stock adjustment
  adjustmentLoading: false,
  adjustmentError: null,

  // Exchange rates
  exchangeRates: [],
  exchangeRatesLoading: false,
  exchangeRatesError: null,

  // Balance Sheet
  balanceSheet: null,
  balanceSheetLoading: false,
  balanceSheetError: null,
  // Cash Flow
  cashFlow: null,
  cashFlowLoading: false,
  cashFlowError: null,

  // Bank Reconciliation
  bankReconciliations: [],
  bankReconciliationLoading: false,
  bankReconciliationError: null,
  selectedBankReconciliation: null,
  selectedBankReconciliationLoading: false,
  selectedBankReconciliationError: null,
  bankReconciliationSummary: null,
  bankReconciliationSummaryLoading: false,
  bankReconciliationSummaryError: null,
  bankReconciliationAuditTrail: [],
  bankReconciliationAuditTrailLoading: false,
  bankReconciliationAuditTrailError: null,
  bankReconciliationUploadLoading: false,
  bankReconciliationUploadError: null,
  bankReconciliationUnmatched: [],
  bankReconciliationUnmatchedLoading: false,
  bankReconciliationUnmatchedError: null,
  bankTransactionMatches: [],
  bankTransactionMatchesLoading: false,
  bankTransactionMatchesError: null,

  // Cashbook
  cashbookBanks: [],
  cashbookBanksLoading: false,
  cashbookBanksError: null,
  selectedCashbookBank: null,

  cashbookEntries: [],
  cashbookEntriesLoading: false,
  cashbookEntriesError: null,

  // Cashbook Bank Position
  cashbookBankPosition: null,
  cashbookBankPositionLoading: false,
  cashbookBankPositionError: null,

  // Cashbook Reports
  cashbookCashFlowReport: null,
  cashbookCashFlowReportLoading: false,
  cashbookCashFlowReportError: null,
  cashbookBalanceCheckReport: null,
  cashbookBalanceCheckReportLoading: false,
  cashbookBalanceCheckReportError: null,

  // createCashbookReceipt
  cashbookReceiptLoading: false,
  cashbookReceiptError: null,

  // Selected currency for management
  selectedCurrency: null,

  // Dashboard V2
  dashboardData: null,
  dashboardLoading: false,
  dashboardError: null,
}

const accountingSlice = createSlice({
  name: 'accounting',
  initialState,
  reducers: {
    setSelectedExpense: (state, action: PayloadAction<Expense | null>) => {
      state.selectedExpense = action.payload
    },
    clearExpensesError: (state) => {
      state.expensesError = null
    },
    clearTrialBalanceError: (state) => {
      state.trialBalanceError = null
    },
    clearTrialBalanceSummaryError: (state) => {
      state.trialBalanceSummaryError = null
    },
    clearIncomeStatementError: (state) => {
      state.incomeStatementError = null
    },
    clearAssetsError: (state) => {
      state.assetsError = null
    },
    setSelectedAsset: (state, action) => {
      state.selectedAsset = action.payload
    },
    clearCreditNotesError: (state) => {
      state.creditNotesError = null
    },
    setSelectedCreditNote: (state, action) => {
      state.selectedCreditNote = action.payload
    },
    clearSelectedCreditNote: (state) => {
      state.selectedCreditNote = null
    },
    clearDashboardErrors: (state) => {
      state.dashboardStatsError = null
      state.salesChartError = null
      state.creditNotesChartError = null
      state.recentExpensesError = null
    },
    setSelectedInventoryItem: (state, action: PayloadAction<InventoryItem | null>) => {
      state.selectedInventoryItem = action.payload
    },
    setSelectedBankReconciliation: (state, action) => {
      state.selectedBankReconciliation = action.payload
    },
    clearBankReconciliationError: (state) => {
      state.bankReconciliationError = null
    },
    clearBankReconciliationUploadError: (state) => {
      state.bankReconciliationUploadError = null
    },
    clearBankReconciliationAuditTrailError: (state) => {
      state.bankReconciliationAuditTrailError = null
    },
    clearBankReconciliationUnmatchedError: (state) => {
      state.bankReconciliationUnmatchedError = null
    },
    clearBankTransactionMatchesError: (state) => {
      state.bankTransactionMatchesError = null
    },
    setSelectedCashbookBank: (state, action: PayloadAction<CashbookBank | null>) => {
      state.selectedCashbookBank = action.payload
    },
    clearCashbookBanksError: (state) => {
      state.cashbookBanksError = null
    },
    clearCashbookEntriesError: (state) => {
      state.cashbookEntriesError = null
    },

    //createCashbookReceipt
    createCashbookReceipt: (state, action: PayloadAction<CashbookEntry>) => {
      state.cashbookEntries.push(action.payload)
    },

    // set errors createCashbookReceipt
    setCashbookReceiptError: (state, action: PayloadAction<string | null>) => {
      state.cashbookReceiptError = action.payload
    },

    // Currency management reducers
    setCurrenciesLoading: (state, action: PayloadAction<boolean>) => {
      state.currenciesLoading = action.payload
    },
    setCurrencies: (state, action: PayloadAction<AccountingCurrency[]>) => {
      state.currencies = action.payload
    },
    setCurrenciesError: (state, action: PayloadAction<string | null>) => {
      state.currenciesError = action.payload
    },
    removeCurrency: (state, action: PayloadAction<string>) => {
      state.currencies = state.currencies.filter(c => c.id !== action.payload)
    },
    updateCurrency: (state, action: PayloadAction<AccountingCurrency>) => {
      const index = state.currencies.findIndex(c => c.id === action.payload.id)
      if (index !== -1) state.currencies[index] = action.payload
    },
    setSelectedCurrency: (state, action: PayloadAction<AccountingCurrency | null>) => {
      state.selectedCurrency = action.payload
    },
  },
  extraReducers: (builder) => {
    // Fetch expenses
    builder
      .addCase(fetchExpenses.pending, (state) => {
        state.expensesLoading = true
        state.expensesError = null
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.expensesLoading = false
        // API returns expenses directly in data array
        state.expenses = action.payload || []
        // For now, we don't have pagination info in the response
        state.expensesTotalPages = 1
        state.expensesCurrentPage = 1
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.expensesLoading = false
        state.expensesError = action.error.message || 'Failed to fetch expenses'
      })

    // Fetch expense by ID
    builder
      .addCase(fetchExpenseById.fulfilled, (state, action) => {
        state.selectedExpense = action.payload
      })

    // Create expense
    builder
      .addCase(createExpense.fulfilled, (state, action) => {
        state.expenses.unshift(action.payload)
      })

    // Update expense
    builder
      .addCase(updateExpense.fulfilled, (state, action) => {
        const index = state.expenses.findIndex(expense => expense.id === action.payload.id)
        if (index !== -1) {
          state.expenses[index] = action.payload
        }
        if (state.selectedExpense?.id === action.payload.id) {
          state.selectedExpense = action.payload
        }
      })

    // Delete expense
    builder
      .addCase(deleteExpense.fulfilled, (state, action) => {
        state.expenses = state.expenses.filter(expense => expense.id !== action.payload)
        if (state.selectedExpense?.id === action.payload) {
          state.selectedExpense = null
        }
      })

    // Fetch currencies
    builder
      .addCase(fetchCurrencies.pending, (state) => {
        state.currenciesLoading = true
        state.currenciesError = null
      })
      .addCase(fetchCurrencies.fulfilled, (state, action) => {
        state.currenciesLoading = false
        state.currencies = action.payload
      })
      .addCase(fetchCurrencies.rejected, (state, action) => {
        state.currenciesLoading = false
        state.currenciesError = action.error.message || 'Failed to fetch currencies'
      })

    // Fetch vendors
    builder
      .addCase(fetchVendors.pending, (state) => {
        state.vendorsLoading = true
        state.vendorsError = null
      })
      .addCase(fetchVendors.fulfilled, (state, action) => {
        state.vendorsLoading = false
        state.vendors = action.payload
      })
      .addCase(fetchVendors.rejected, (state, action) => {
        state.vendorsLoading = false
        state.vendorsError = action.error.message || 'Failed to fetch vendors'
      })

    // Fetch expense categories
    builder
      .addCase(fetchExpenseCategories.pending, (state) => {
        state.categoriesLoading = true
        state.categoriesError = null
      })
      .addCase(fetchExpenseCategories.fulfilled, (state, action) => {
        state.categoriesLoading = false
        state.expenseCategories = action.payload
      })
      .addCase(fetchExpenseCategories.rejected, (state, action) => {
        state.categoriesLoading = false
        state.categoriesError = action.error.message || 'Failed to fetch expense categories'
      })

      // Post journal entry
      .addCase(postJournalEntry.pending, (state) => {
        state.isPostingJournalEntry = true
      })
      .addCase(postJournalEntry.fulfilled, (state, action) => {
        state.isPostingJournalEntry = false
        // Update the journal entry in the list if it exists
        const index = state.journalEntries.findIndex(entry => entry.id === action.meta.arg)
        if (index !== -1) {
          // Update the entry with the returned data from API
          state.journalEntries[index] = { ...state.journalEntries[index], ...action.payload }
        }
      })
      .addCase(postJournalEntry.rejected, (state) => {
        state.isPostingJournalEntry = false
      })
      
      // Void journal entry
      .addCase(voidJournalEntry.pending, (state) => {
        state.isVoidingJournalEntry = true
      })
      .addCase(voidJournalEntry.fulfilled, (state, action) => {
        state.isVoidingJournalEntry = false
        // Update the journal entry in the list if it exists
        const index = state.journalEntries.findIndex(entry => entry.id === action.meta.arg)
        if (index !== -1) {
          // Update the entry with the returned data from API
          state.journalEntries[index] = { ...state.journalEntries[index], ...action.payload }
        }
      })
      .addCase(voidJournalEntry.rejected, (state) => {
        state.isVoidingJournalEntry = false
      })

      // Fetch chart of accounts
      .addCase(fetchChartOfAccounts.pending, (state) => {
        state.chartOfAccountsLoading = true
        state.chartOfAccountsError = null
      })
      .addCase(fetchChartOfAccounts.fulfilled, (state, action) => {
        state.chartOfAccountsLoading = false
        state.chartOfAccounts = action.payload
      })
      .addCase(fetchChartOfAccounts.rejected, (state, action) => {
        state.chartOfAccountsLoading = false
        state.chartOfAccountsError = action.error.message || 'Failed to fetch chart of accounts'
      })

      // Fetch trial balance
      .addCase(fetchTrialBalance.pending, (state) => {
        state.trialBalanceLoading = true
        state.trialBalanceError = null
      })
      .addCase(fetchTrialBalance.fulfilled, (state, action) => {
        state.trialBalanceLoading = false
        state.trialBalance = action.payload
      })
      .addCase(fetchTrialBalance.rejected, (state, action) => {
        state.trialBalanceLoading = false
        state.trialBalanceError = action.error.message || 'Failed to fetch trial balance'
      })
      
      // Fetch trial balance summary
      .addCase(fetchTrialBalanceSummary.pending, (state) => {
        state.trialBalanceSummaryLoading = true
        state.trialBalanceSummaryError = null
      })
      .addCase(fetchTrialBalanceSummary.fulfilled, (state, action) => {
        state.trialBalanceSummaryLoading = false
        state.trialBalanceSummary = action.payload
      })
      .addCase(fetchTrialBalanceSummary.rejected, (state, action) => {
        state.trialBalanceSummaryLoading = false
        state.trialBalanceSummaryError = action.error.message || 'Failed to fetch trial balance summary'
      })

      // Fetch income statement
      .addCase(fetchIncomeStatement.pending, (state) => {
        state.incomeStatementLoading = true
        state.incomeStatementError = null
      })
      .addCase(fetchIncomeStatement.fulfilled, (state, action) => {
        state.incomeStatementLoading = false
        state.incomeStatement = action.payload
      })
      .addCase(fetchIncomeStatement.rejected, (state, action) => {
        state.incomeStatementLoading = false
        state.incomeStatementError = action.error.message || 'Failed to fetch income statement'
      })

      // Fetch assets
      .addCase(fetchAssets.pending, (state) => {
        state.assetsLoading = true
        state.assetsError = null
      })
      .addCase(fetchAssets.fulfilled, (state, action) => {
        state.assetsLoading = false
        state.assets = action.payload.assets
      })
      .addCase(fetchAssets.rejected, (state, action) => {
        state.assetsLoading = false
        state.assetsError = action.error.message || 'Failed to fetch assets'
      })
      
      // Fetch asset
      .addCase(fetchAsset.pending, (state) => {
        state.selectedAssetLoading = true
        state.selectedAssetError = null
      })
      .addCase(fetchAsset.fulfilled, (state, action) => {
        state.selectedAssetLoading = false
        state.selectedAsset = action.payload
      })
      .addCase(fetchAsset.rejected, (state, action) => {
        state.selectedAssetLoading = false
        state.selectedAssetError = action.error.message || 'Failed to fetch asset'
      })

      // Fetch credit notes
      .addCase(fetchCreditNotes.pending, (state) => {
        state.creditNotesLoading = true
        state.creditNotesError = null
      })
      .addCase(fetchCreditNotes.fulfilled, (state, action) => {
        state.creditNotesLoading = false
        state.creditNotes = action.payload.creditNotes
      })
      .addCase(fetchCreditNotes.rejected, (state, action) => {
        state.creditNotesLoading = false
        state.creditNotesError = action.error.message || 'Failed to fetch credit notes'
      })
      
      // Fetch single credit note
      .addCase(fetchCreditNote.pending, (state) => {
        state.selectedCreditNoteLoading = true
        state.selectedCreditNoteError = null
      })
      .addCase(fetchCreditNote.fulfilled, (state, action) => {
        state.selectedCreditNoteLoading = false
        state.selectedCreditNote = action.payload
      })
      .addCase(fetchCreditNote.rejected, (state, action) => {
        state.selectedCreditNoteLoading = false
        state.selectedCreditNoteError = action.error.message || 'Failed to fetch credit note'
      })
      
      // Create credit note
      .addCase(createCreditNote.pending, (state) => {
        state.creditNotesLoading = true
        state.creditNotesError = null
      })
      .addCase(createCreditNote.fulfilled, (state, action) => {
        state.creditNotesLoading = false
        state.creditNotes.push(action.payload)
      })
      .addCase(createCreditNote.rejected, (state, action) => {
        state.creditNotesLoading = false
        state.creditNotesError = action.error.message || 'Failed to create credit note'
      })
      
      // Send credit note
      .addCase(sendCreditNote.fulfilled, (state, action) => {
        const index = state.creditNotes.findIndex(cn => cn.id === action.payload.id)
        if (index !== -1) {
          state.creditNotes[index] = action.payload
        }
        if (state.selectedCreditNote?.id === action.payload.id) {
          state.selectedCreditNote = action.payload
        }
      })
      
      // Apply credit note
      .addCase(applyCreditNote.fulfilled, (state, action) => {
        const index = state.creditNotes.findIndex(cn => cn.id === action.payload.id)
        if (index !== -1) {
          state.creditNotes[index].status = 'APPLIED'
        }
      })
      
      // Delete credit note
      .addCase(deleteCreditNote.fulfilled, (state, action) => {
        state.creditNotes = state.creditNotes.filter(cn => cn.id !== action.payload)
        if (state.selectedCreditNote?.id === action.payload) {
          state.selectedCreditNote = null
        }
      })

      // Inventory
      .addCase(fetchInventoryItems.pending, (state) => {
        state.inventoryLoading = true
        state.inventoryError = null
      })
      .addCase(fetchInventoryItems.fulfilled, (state, action) => {
        state.inventoryLoading = false
        state.inventoryItems = action.payload.items || []
      })
      .addCase(fetchInventoryItems.rejected, (state, action) => {
        state.inventoryLoading = false
        state.inventoryError = action.error.message || 'Failed to fetch inventory items'
      })

      .addCase(fetchInventoryItem.pending, (state) => {
        state.selectedInventoryLoading = true
        state.selectedInventoryError = null
      })
      .addCase(fetchInventoryItem.fulfilled, (state, action) => {
        state.selectedInventoryLoading = false
        state.selectedInventoryItem = action.payload
      })
      .addCase(fetchInventoryItem.rejected, (state, action) => {
        state.selectedInventoryLoading = false
        state.selectedInventoryError = action.error.message || 'Failed to fetch inventory item'
      })

      .addCase(createInventoryItem.pending, (state) => {
        state.inventoryLoading = true
        state.inventoryError = null
      })
      .addCase(createInventoryItem.fulfilled, (state, action) => {
        state.inventoryLoading = false
        state.inventoryItems.unshift(action.payload)
      })
      .addCase(createInventoryItem.rejected, (state, action) => {
        state.inventoryLoading = false
        state.inventoryError = action.error.message || 'Failed to create inventory item'
      })

      .addCase(updateInventoryItem.fulfilled, (state, action) => {
        const idx = state.inventoryItems.findIndex(i => i.id === action.payload.id)
        if (idx !== -1) state.inventoryItems[idx] = action.payload
        if (state.selectedInventoryItem?.id === action.payload.id) state.selectedInventoryItem = action.payload
      })

      // Stock movements
      .addCase(fetchStockMovements.pending, (state) => {
        state.stockMovementsLoading = true
        state.stockMovementsError = null
      })
      .addCase(fetchStockMovements.fulfilled, (state, action) => {
        state.stockMovementsLoading = false
        state.stockMovements = action.payload.movements || []
      })
      .addCase(fetchStockMovements.rejected, (state, action) => {
        state.stockMovementsLoading = false
        state.stockMovementsError = action.error.message || 'Failed to fetch stock movements'
      })

      .addCase(postStockMovement.pending, (state) => {
        state.stockMovementsLoading = true
      })
      .addCase(postStockMovement.fulfilled, (state, action) => {
        state.stockMovementsLoading = false
        state.stockMovements.unshift(action.payload)
        // update quantityOnHand in inventoryItems if present
        const idx = state.inventoryItems.findIndex(i => i.id === action.payload.itemId)
        if (idx !== -1) {
          const current = parseFloat(state.inventoryItems[idx].quantityOnHand || '0')
          const delta = parseFloat(action.payload.quantity || '0')
          state.inventoryItems[idx].quantityOnHand = action.payload.movementType === 'IN'
            ? String(current + delta)
            : String(current - delta)
        }
      })
      .addCase(postStockMovement.rejected, (state, action) => {
        state.stockMovementsLoading = false
        state.stockMovementsError = action.error.message || 'Failed to record stock movement'
      })

      // Inventory valuation
      .addCase(fetchInventoryValuation.pending, (state) => {
        state.inventoryValuationLoading = true
        state.inventoryValuationError = null
      })
      .addCase(fetchInventoryValuation.fulfilled, (state, action) => {
        state.inventoryValuationLoading = false
        state.inventoryValuation = action.payload
      })
      .addCase(fetchInventoryValuation.rejected, (state, action) => {
        state.inventoryValuationLoading = false
        state.inventoryValuationError = action.error.message || 'Failed to fetch inventory valuation'
      })

      // Reorder alerts
      .addCase(fetchReorderAlerts.pending, (state) => {
        state.reorderAlertsLoading = true
        state.reorderAlertsError = null
      })
      .addCase(fetchReorderAlerts.fulfilled, (state, action) => {
        state.reorderAlertsLoading = false
        state.reorderAlerts = action.payload || []
      })
      .addCase(fetchReorderAlerts.rejected, (state, action) => {
        state.reorderAlertsLoading = false
        state.reorderAlertsError = action.error.message || 'Failed to fetch reorder alerts'
      })

      // Calculate COGS
      .addCase(calculateCogs.pending, (state) => {
        state.cogsLoading = true
        state.cogsError = null
        state.cogsResult = null
      })
      .addCase(calculateCogs.fulfilled, (state, action) => {
        state.cogsLoading = false
        state.cogsResult = action.payload
      })
      .addCase(calculateCogs.rejected, (state, action) => {
        state.cogsLoading = false
        state.cogsError = action.error.message || 'Failed to calculate COGS'
      })

      // Stock adjustment
      .addCase(postInventoryAdjustment.pending, (state) => {
        state.adjustmentLoading = true
        state.adjustmentError = null
      })
      .addCase(postInventoryAdjustment.fulfilled, (state, action) => {
        state.adjustmentLoading = false
        // optionally push adjustment into stockMovements if shape matches
      })
      .addCase(postInventoryAdjustment.rejected, (state, action) => {
        state.adjustmentLoading = false
        state.adjustmentError = action.error.message || 'Failed to post stock adjustment'
      })

      // Fetch exchange rates
      .addCase(fetchExchangeRates.pending, (state) => {
        state.exchangeRatesLoading = true
        state.exchangeRatesError = null
      })
      .addCase(fetchExchangeRates.fulfilled, (state, action) => {
        state.exchangeRatesLoading = false
        state.exchangeRates = action.payload?.exchangeRates || []
      })
      .addCase(fetchExchangeRates.rejected, (state, action) => {
        state.exchangeRatesLoading = false
        state.exchangeRatesError = action.error.message || 'Failed to fetch exchange rates'
      })

      // Create exchange rate
      .addCase(createExchangeRate.pending, (state) => {
        state.exchangeRatesLoading = true
        state.exchangeRatesError = null
      })
      .addCase(createExchangeRate.fulfilled, (state, action) => {
        state.exchangeRatesLoading = false
        state.exchangeRates.unshift(action.payload)
      })
      .addCase(createExchangeRate.rejected, (state, action) => {
        state.exchangeRatesLoading = false
        state.exchangeRatesError = action.payload as string || action.error.message || 'Failed to create exchange rate'
      })

      // Update exchange rate
      .addCase(updateExchangeRate.pending, (state) => {
        state.exchangeRatesLoading = true
        state.exchangeRatesError = null
      })
      .addCase(updateExchangeRate.fulfilled, (state, action) => {
        state.exchangeRatesLoading = false
        const idx = state.exchangeRates.findIndex(e => e.id === action.payload.id)
        if (idx !== -1) state.exchangeRates[idx] = action.payload
      })
      .addCase(updateExchangeRate.rejected, (state, action) => {
        state.exchangeRatesLoading = false
        state.exchangeRatesError = action.payload as string || action.error.message || 'Failed to update exchange rate'
      })

      // Delete exchange rate
      .addCase(deleteExchangeRate.pending, (state) => {
        state.exchangeRatesLoading = true
        state.exchangeRatesError = null
      })
      .addCase(deleteExchangeRate.fulfilled, (state, action) => {
        state.exchangeRatesLoading = false
        state.exchangeRates = state.exchangeRates.filter(e => e.id !== action.payload)
      })
      .addCase(deleteExchangeRate.rejected, (state, action) => {
        state.exchangeRatesLoading = false
        state.exchangeRatesError = action.payload as string || action.error.message || 'Failed to delete exchange rate'
      })

      // Balance Sheet
      .addCase(generateBalanceSheet.pending, (state) => {
        state.balanceSheetLoading = true
        state.balanceSheetError = null
      })
      .addCase(generateBalanceSheet.fulfilled, (state, action) => {
        state.balanceSheetLoading = false
        state.balanceSheet = action.payload
      })
      .addCase(generateBalanceSheet.rejected, (state, action) => {
        state.balanceSheetLoading = false
        state.balanceSheetError = action.error.message || 'Failed to generate balance sheet'
      })
      .addCase(fetchBalanceSheet.pending, (state) => {
        state.balanceSheetLoading = true
        state.balanceSheetError = null
      })
      .addCase(fetchBalanceSheet.fulfilled, (state, action) => {
        state.balanceSheetLoading = false
        state.balanceSheet = action.payload
      })
      .addCase(fetchBalanceSheet.rejected, (state, action) => {
        state.balanceSheetLoading = false
        state.balanceSheetError = action.error.message || 'Failed to fetch balance sheet'
      })

    // Cash Flow
    builder
      .addCase(generateCashFlow.pending, (state) => {
        state.cashFlowLoading = true
        state.cashFlowError = null
      })
      .addCase(generateCashFlow.fulfilled, (state, action) => {
        state.cashFlowLoading = false
        state.cashFlow = action.payload
      })
      .addCase(generateCashFlow.rejected, (state, action) => {
        state.cashFlowLoading = false
        state.cashFlowError = action.error.message || 'Failed to generate cash flow statement'
      })
      .addCase(fetchCashFlow.pending, (state) => {
        state.cashFlowLoading = true
        state.cashFlowError = null
      })
      .addCase(fetchCashFlow.fulfilled, (state, action) => {
        state.cashFlowLoading = false
        state.cashFlow = action.payload
      })
      .addCase(fetchCashFlow.rejected, (state, action) => {
        state.cashFlowLoading = false
        state.cashFlowError = action.error.message || 'Failed to fetch cash flow statement'
      })

    // Bank Reconciliation
    builder
      .addCase(fetchBankReconciliations.pending, (state) => {
        state.bankReconciliationLoading = true
        state.bankReconciliationError = null
      })
      .addCase(fetchBankReconciliations.fulfilled, (state, action) => {
        state.bankReconciliationLoading = false
        state.bankReconciliations = action.payload.banks || []
      })
      .addCase(fetchBankReconciliations.rejected, (state, action) => {
        state.bankReconciliationLoading = false
        state.bankReconciliationError = action.error.message || 'Failed to fetch bank reconciliations'
      })
      .addCase(fetchBankReconciliation.pending, (state) => {
        state.selectedBankReconciliationLoading = true
        state.selectedBankReconciliationError = null
      })
      .addCase(fetchBankReconciliation.fulfilled, (state, action) => {
        state.selectedBankReconciliationLoading = false
        state.selectedBankReconciliation = action.payload
      })
      .addCase(fetchBankReconciliation.rejected, (state, action) => {
        state.selectedBankReconciliationLoading = false
        state.selectedBankReconciliationError = action.error.message || 'Failed to fetch bank reconciliation'
      })
      .addCase(deleteBankReconciliation.fulfilled, (state, action) => {
        state.bankReconciliations = state.bankReconciliations.filter(r => r.id !== action.payload)
        if (state.selectedBankReconciliation?.id === action.payload) state.selectedBankReconciliation = null
      })
      .addCase(fetchBankReconciliationSummary.pending, (state) => {
        state.bankReconciliationSummaryLoading = true
        state.bankReconciliationSummaryError = null
      })
      .addCase(fetchBankReconciliationSummary.fulfilled, (state, action) => {
        state.bankReconciliationSummaryLoading = false
        state.bankReconciliationSummary = action.payload
      })
      .addCase(fetchBankReconciliationSummary.rejected, (state, action) => {
        state.bankReconciliationSummaryLoading = false
        state.bankReconciliationSummaryError = action.error.message || 'Failed to fetch summary'
      })
      .addCase(uploadBankReconciliationFile.pending, (state) => {
        state.bankReconciliationUploadLoading = true
        state.bankReconciliationUploadError = null
      })
      .addCase(uploadBankReconciliationFile.fulfilled, (state, action) => {
        state.bankReconciliationUploadLoading = false
        // Optionally add uploaded file to list
      })
      .addCase(uploadBankReconciliationFile.rejected, (state, action) => {
        state.bankReconciliationUploadLoading = false
        state.bankReconciliationUploadError = action.payload as string || action.error.message || 'Failed to upload file'
      })
      .addCase(fetchBankReconciliationAuditTrail.pending, (state) => {
        state.bankReconciliationAuditTrailLoading = true
        state.bankReconciliationAuditTrailError = null
      })
      .addCase(fetchBankReconciliationAuditTrail.fulfilled, (state, action) => {
        state.bankReconciliationAuditTrailLoading = false
        state.bankReconciliationAuditTrail = action.payload || []
      })
      .addCase(fetchBankReconciliationAuditTrail.rejected, (state, action) => {
        state.bankReconciliationAuditTrailLoading = false
        state.bankReconciliationAuditTrailError = action.error.message || 'Failed to fetch audit trail'
      })
      .addCase(fetchBankReconciliationUnmatched.pending, (state) => {
        state.bankReconciliationUnmatchedLoading = true
        state.bankReconciliationUnmatchedError = null
      })
      .addCase(fetchBankReconciliationUnmatched.fulfilled, (state, action) => {
        state.bankReconciliationUnmatchedLoading = false
        state.bankReconciliationUnmatched = action.payload || []
      })
      .addCase(fetchBankReconciliationUnmatched.rejected, (state, action) => {
        state.bankReconciliationUnmatchedLoading = false
        state.bankReconciliationUnmatchedError = action.error.message || 'Failed to fetch unmatched transactions'
      })
      .addCase(fetchBankTransactionMatches.pending, (state) => {
        state.bankTransactionMatchesLoading = true
        state.bankTransactionMatchesError = null
      })
      .addCase(fetchBankTransactionMatches.fulfilled, (state, action) => {
        state.bankTransactionMatchesLoading = false
        state.bankTransactionMatches = action.payload || []
      })
      .addCase(fetchBankTransactionMatches.rejected, (state, action) => {
        state.bankTransactionMatchesLoading = false
        state.bankTransactionMatchesError = action.error.message || 'Failed to fetch matches'
      })
      .addCase(approveBankReconciliationMatch.fulfilled, (state, action) => {
        // Optionally update state to reflect approval
      })
      .addCase(rejectBankReconciliationResult.fulfilled, (state, action) => {
        // Optionally update state to reflect rejection
      })

      // Cashbook Banks
      .addCase(fetchCashbookBanks.pending, (state) => {
        state.cashbookBanksLoading = true
        state.cashbookBanksError = null
      })
      .addCase(fetchCashbookBanks.fulfilled, (state, action) => {
        state.cashbookBanksLoading = false
        state.cashbookBanks = Array.isArray(action.payload) ? action.payload : []
      })
      .addCase(fetchCashbookBanks.rejected, (state, action) => {
        state.cashbookBanksLoading = false
        state.cashbookBanksError = action.error.message || 'Failed to fetch banks'
      })

    // Cashbook Entries
    builder
      .addCase(fetchCashbookEntries.pending, (state) => {
        state.cashbookEntriesLoading = true
        state.cashbookEntriesError = null
      })
      .addCase(fetchCashbookEntries.fulfilled, (state, action) => {
        state.cashbookEntriesLoading = false
        state.cashbookEntries = Array.isArray(action.payload?.entries) ? action.payload?.entries : []
      })
      .addCase(fetchCashbookEntries.rejected, (state, action) => {
        state.cashbookEntriesLoading = false
        state.cashbookEntriesError = action.error.message || 'Failed to fetch entries'
      })
      .addCase(fetchCashbookBankPosition.pending, (state) => {
        state.cashbookBankPositionLoading = true
        state.cashbookBankPositionError = null
      })
      .addCase(fetchCashbookBankPosition.fulfilled, (state, action) => {
        state.cashbookBankPositionLoading = false
        state.cashbookBankPosition = action.payload
      })
      .addCase(fetchCashbookBankPosition.rejected, (state, action) => {
        state.cashbookBankPositionLoading = false
        state.cashbookBankPositionError = action.error.message || 'Failed to fetch bank position'
      })

      //customers, chart of accounts, vendors
      builder.addCase(fetchCustomers.pending, (state) => {
        state.customersLoading = true
        state.customersError = null
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.customersLoading = false
        state.customers = action.payload?.customers ?? []
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.customersLoading = false
        state.customersError = action.error.message || 'Failed to fetch customers'
      })

      //createCashbookReceipt
      builder.addCase(createCashbookReceipt.pending, (state) => {
        state.cashbookReceiptLoading = true
        state.cashbookReceiptError = null
      })
      .addCase(createCashbookReceipt.fulfilled, (state, action) => {
        state.cashbookReceiptLoading = false
        state.cashbookReceipts.push(action.payload)
      })
      .addCase(createCashbookReceipt.rejected, (state, action) => {
        state.cashbookReceiptLoading = false
        state.cashbookReceiptError = action.error.message || 'Failed to create cashbook receipt'
      })

      // Cashbook Cash Flow Report
      .addCase(fetchCashbookCashFlowReport.pending, (state) => {
        state.cashbookCashFlowReportLoading = true
        state.cashbookCashFlowReportError = null
      })
      .addCase(fetchCashbookCashFlowReport.fulfilled, (state, action) => {
        state.cashbookCashFlowReportLoading = false
        state.cashbookCashFlowReport = action.payload
      })
      .addCase(fetchCashbookCashFlowReport.rejected, (state, action) => {
        state.cashbookCashFlowReportLoading = false
        state.cashbookCashFlowReportError = action.error.message || 'Failed to fetch cash flow report'
      })

    // Cashbook Balance Check
    builder
      .addCase(fetchCashbookBalanceCheck.pending, (state) => {
        state.cashbookBalanceCheckReportLoading = true
        state.cashbookBalanceCheckReportError = null
      })
      .addCase(fetchCashbookBalanceCheck.fulfilled, (state, action) => {
        state.cashbookBalanceCheckReportLoading = false
        state.cashbookBalanceCheckReport = action.payload
      })
      .addCase(fetchCashbookBalanceCheck.rejected, (state, action) => {
        state.cashbookBalanceCheckReportLoading = false
        state.cashbookBalanceCheckReportError = action.error.message || 'Failed to fetch balance check'
      })

    // Dashboard V2
    builder
      .addCase(fetchAccountingDashboard.pending, (state) => {
        state.dashboardLoading = true
        state.dashboardError = null
      })
      .addCase(fetchAccountingDashboard.fulfilled, (state, action) => {
        state.dashboardLoading = false
        state.dashboardData = action.payload
      })
      .addCase(fetchAccountingDashboard.rejected, (state, action) => {
        state.dashboardLoading = false
        state.dashboardError = action.error.message || 'Failed to fetch dashboard'
      })
  }
})

export const { 
  setSelectedExpense, 
  clearExpensesError, 
  clearTrialBalanceError, 
  clearTrialBalanceSummaryError,
  clearIncomeStatementError,
  clearAssetsError,
  setSelectedAsset,
  clearCreditNotesError,
  setSelectedCreditNote,
  clearSelectedCreditNote,
  clearDashboardErrors,
  setSelectedInventoryItem,
  setSelectedBankReconciliation,
  clearBankReconciliationError,
  clearBankReconciliationUploadError,
  clearBankReconciliationAuditTrailError,
  clearBankReconciliationUnmatchedError,
  clearBankTransactionMatchesError,

  //cashbook
  setSelectedCashbookBank,
  clearCashbookBanksError,
  clearCashbookEntriesError,

  // Currency management actions
  setCurrenciesLoading,
  setCurrencies,
  setCurrenciesError,
  removeCurrency,
  updateCurrency,
  setSelectedCurrency,
} = accountingSlice.actions

export default accountingSlice.reducer

// This file must exist at the specified path for Next.js to build successfully.
// If you renamed or moved the file, restore it to:
// c:\Users\Administrator\Documents\Projects\nvccz-new-main\lib\store\slices\accounting-slice.ts
// If you are using accountingSlice.ts instead, rename it to accounting-slice.ts or update your imports accordingly.