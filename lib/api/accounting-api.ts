import { Vendor } from '@/components/accounting/vendors-management'
import { apiClient } from './api-client'
import { AccountingResponse, ChartOfAccount, CreateChartOfAccountRequest } from './chart-of-accounts-api'
import { ExpenseCategory } from '@/components/accounting/expense-categories-management'

// Re-export Vendor type for use in other modules
export type { Vendor }

// Types matching accounting entities
export interface AccountingCurrency {
  id: string
  code: string
  name: string
  symbol: string
  isActive: boolean
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateCurrencyRequest {
  code: string
  name: string
  symbol: string
  isDefault?: boolean
  isActive?: boolean
}

// Invoice interfaces
export interface InvoiceItem {
  description: string
  amount?: number
  category?: string
  taxRate?: number
  quantity?: number
  unitPrice?: number
}

export interface Invoice {
  id: string
  customerId: string
  amount: string
  vatAmount: string
  totalAmount: string
  currencyId: string
  transactionDate: string
  description: string
  invoiceNumber: string
  items: InvoiceItem[]
  isTaxable: boolean
  status: 'DRAFT' | 'SENT' | 'PAID' | 'VOID'
  paymentMethod: string
  exchangeRateAtCreation: string | null
  paymentCurrencyId: string | null
  amountInPaymentCurrency: string | null
  paymentDate: string | null
  journalEntryId: string
  isActive: boolean
  createdById: string
  createdAt: string
  updatedAt: string
  customer: InvoiceCustomer
  currency: AccountingCurrency
  journalEntry: {
    id: string
    referenceNumber: string
    status: string
  }
}

export interface InvoiceCustomer {
  id: string
  name: string
  taxNumber: string
  contactPerson: string
  email: string
  phone: string
  address: string
  paymentTerms: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateInvoiceRequest {
  customerId: string
  amount: number
  currencyId: string
  transactionDate: string
  description: string
  invoiceDate?: string
  invoiceNumber?: string
  isTaxable: boolean
  exchangeRateAtCreation?: number
  items: InvoiceItem[]
}

export interface MarkAsPaidRequest {
  paymentMethod: 'CASH' | 'BANK' | 'CARD' | 'CHEQUE'
  paymentCurrencyId: string
}

export interface VoidInvoiceRequest {
  reason: string
}

export interface InvoicesResponse {
  invoices: Invoice[]
  total: number
  page: number
  limit: number
  totalPages: number
}


export interface Account {
  id: string
  accountNumber: string
  accountName: string
  accountType: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE'
  parentAccountId?: string
  isActive: boolean
  balance: number
  createdAt: string
  updatedAt: string
}

export interface JournalEntry {
  id: string
  journalNumber: string
  description: string
  journalDate: string
  totalDebit: number
  totalCredit: number
  status: 'DRAFT' | 'POSTED' | 'REVERSED'
  createdAt: string
  updatedAt: string
  lines: JournalLine[]
}

export interface JournalLine {
  id: string
  accountId: string
  description: string
  debitAmount: number
  creditAmount: number
  account: Account
}

export interface Customer {
  id: string
  name: string
  taxNumber?: string | null
  contactPerson?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  paymentTerms?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateCustomerRequest {
  name: string
  taxNumber?: string
  contactPerson?: string
  email?: string
  phone?: string
  address?: string
  paymentTerms?: string
  isActive?: boolean
}

export interface CustomersResponse {
  customers: Customer[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface Supplier {
  id: string
  supplierNumber: string
  name: string
  email: string
  phone: string
  address: string
  isActive: boolean
  balance: number
  createdAt: string
  updatedAt: string
}

// Removed duplicate Invoice interface - using the one above with proper types

// Purchase Invoice interfaces
export interface PurchaseInvoiceItem {
  itemName: string
  description: string
  quantity: number
  unitPrice: number
  totalPrice?: number
  unit: string
  vatRate: number
}

export interface PurchaseInvoice {
  id: string
  invoiceNumber: string
  vendorId: string
  invoiceDate: string
  dueDate: string
  subtotal: string
  vatAmount: string
  totalAmount: string
  currencyId: string
  description: string
  status: 'DRAFT' | 'POSTED'
  paymentStatus: 'PENDING' | 'PAID'
  paymentMethod: string | null
  isTaxable: boolean
  journalEntryId: string | null
  paymentJournalEntryId: string | null
  cashbookEntryId: string | null
  paidAmount: string
  outstandingAmount: string
  paymentDate: string | null
  paymentReference: string | null
  notes: string
  createdById: string
  createdAt: string
  updatedAt: string
  vendor: {
    id: string
    name: string
    taxNumber: string
    contactPerson: string
    email: string
    phone: string
    address: string
    paymentTerms: string
    isActive: boolean
    createdAt: string
    updatedAt: string
  }
  currency: AccountingCurrency
  journalEntry: {
    id: string
    referenceNumber: string
    status: string
  } | null
  paymentJournalEntry: any | null
  items: PurchaseInvoiceItem[]
}

export interface CreatePurchaseInvoiceRequest {
  vendorId: string
  invoiceDate: string
  dueDate: string
  currencyId: string
  description: string
  items: PurchaseInvoiceItem[]
  isTaxable: boolean
  invoiceNumber?: string
  notes?: string
}

export interface UpdatePurchaseInvoiceRequest {
  vendorId?: string
  invoiceDate?: string
  dueDate?: string
  description?: string
  items?: PurchaseInvoiceItem[]
  isTaxable?: boolean
  notes?: string
}

export interface SubmitPurchaseInvoiceRequest {
  paymentMethod: 'BANK' | 'CASH'
  expenseAccountId: string
  bankId: string
}

export interface PayPurchaseInvoiceRequest {
  paymentMethod: 'BANK' | 'CASH'
  bankId: string
  paymentDate: string
  paymentReference?: string
  notes?: string
}

export interface PurchaseInvoicesResponse {
  invoices: PurchaseInvoice[]
  total: number
  page: number
  totalPages: number
}

export interface PurchaseInvoiceBank {
  id: string
  name: string
  accountNumber: string
  currency: AccountingCurrency
  glAccount: ChartOfAccount
  isActive: boolean
}

// Asset interfaces
export interface Asset {
  id: string
  assetName: string
  assetCode: string
  description: string
  purchaseDate: string
  cost: string
  usefulLifeYears: number
  depreciationMethod: string
  currentBookValue: string
  salvageValue: string
  assetAccountId: string
  accumulatedDepreciationAccountId: string
  depreciationExpenseAccountId: string
  status: string
  disposalDate?: string
  disposalValue?: string
  disposalGainLoss?: string
  location?: string
  serialNumber?: string
  warrantyExpiry?: string
  isActive: boolean
  createdById: string
  createdAt: string
  updatedAt: string
  assetAccount: ChartOfAccount
  accumulatedDepreciationAccount: ChartOfAccount
  depreciationExpenseAccount: ChartOfAccount
  createdBy: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  depreciationRecords: DepreciationRecord[]
  disposalRecords?: any[]
}

export interface DepreciationRecord {
  id: string
  assetId: string
  period: string
  depreciationAmount: string
  accumulatedDepreciation: string
  bookValue: string
  isPosted: boolean
  postedAt?: string
  createdById: string
  createdAt: string
}

export interface CreateAssetRequest {
  assetName: string
  assetCode: string
  description: string
  cost: number
  usefulLifeYears: number
  depreciationMethod: string
  assetAccountId: string
  accumulatedDepreciationAccountId: string
  depreciationExpenseAccountId: string
  purchaseDate: string
  location?: string
  vendor?: string
}

export interface UpdateAssetRequest {
  assetName: string
  description: string
  location?: string
  vendor?: string
}

export interface CalculateDepreciationRequest {
  depreciationDate: string
  period: string
}

export interface DisposeAssetRequest {
  disposalDate: string
  disposalAmount: number
  notes?: string
  disposalValue: number
  disposalMethod: 'SALE' | 'SCRAP' | 'DONATION' | 'TRADE_IN'
}

export interface DepreciationScheduleItem {
  period: string
  depreciationAmount: number
  accumulatedDepreciation: number
  bookValue: number
  isPosted: boolean
}

export interface RevalueAssetRequest {
  newValue: number
  revaluationDate: string
  notes?: string
}

// Credit Note interfaces
export interface CreditNote {
  id: string
  customerId: string
  invoiceId: string
  amount: string
  vatAmount: string
  totalAmount: string
  currencyId: string
  creditNoteNumber: string
  reason: string
  status: 'DRAFT' | 'SENT' | 'APPLIED' | 'VOID'
  appliedAmount: string
  remainingAmount: string
  isActive: boolean
  journalEntryId: string | null
  createdById: string
  createdAt: string
  updatedAt: string
  customer: {
    id: string
    name: string
    email: string
  }
  originalInvoice: {
    id: string
    invoiceNumber: string
    totalAmount: string
  }
  currency: {
    id: string
    code: string
    symbol: string
  }
  createdBy: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

export interface CreateCreditNoteRequest {
  invoiceId: string
  amount: number
  totalAmount: number
  reason: string
  description: string
  creditNoteDate: string
}

export interface UpdateCreditNoteRequest {
  amount: number
  reason: string
  description: string
}

export interface ApplyCreditNoteRequest {
  invoiceId: string
  amount: number
}

export interface DashboardStats {
  invoices: {
    count: number
    totalAmount: number
    change: number
  }
  creditNotes: {
    count: number
    totalAmount: number
    change: number
  }
  customers: {
    count: number
    totalValue: number
    change: number
  }
  expenses: {
    count: number
    totalAmount: number
    change: number
  }
}

// New Dashboard V2 Types
export interface MetricValue {
  value: number
  change: number
  changePercent: number
}

export interface GrossProfitMetric extends MetricValue {
  grossProfitPercent: number
}

export interface AccountingDashboardMetrics {
  revenue: MetricValue
  cogs: MetricValue
  grossProfit: GrossProfitMetric
  netProfit: MetricValue
}

export interface MonthlyDataPoint {
  month: string
  monthNumber: number
  revenue: number
  cogs: number
  grossProfit: number
  grossProfitPercent: number
  netProfit: number
}

export interface ExpenseBreakdown {
  category: string
  amount: number
  percentage?: number
  change?: number
}

export interface AssetBreakdown {
  category: string
  amount: number
  percent: number
}

export interface AssetsData {
  summary: AssetBreakdown[]
  detailed: AssetBreakdown[]
  total: number
}

export interface LiabilityEquityItem {
  category: string
  amount: number
  percent: number
}

export interface LiabilitiesEquityData {
  summary: LiabilityEquityItem[]
  detailed: LiabilityEquityItem[]
  total: number
}

export interface AccountingDashboardData {
  metrics: AccountingDashboardMetrics
  monthlyData: MonthlyDataPoint[]
  expenses: ExpenseBreakdown[]
  assets: AssetsData
  liabilitiesEquity: LiabilitiesEquityData
  period?: {
    startDate: string
    endDate: string
    periodType: string
    benchmarkType: string
  }
  currency?: {
    id: string
    code: string
    name: string
  }
  generatedAt?: string
}

export interface AccountingDashboardParams {
  period?: 'MTD' | 'QTD' | 'YTD' | 'CUSTOM'
  benchmark?: 'LAST_MONTH' | 'LAST_QUARTER' | 'LAST_YEAR'
  startDate?: string
  endDate?: string
  currencyId?: string
}

export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    borderColor: string
    backgroundColor: string
    fill: boolean
  }[]
}

// Inventory interfaces
export interface InventoryItem {
  id: string
  itemName: string
  skuNumber?: string | null
  description?: string | null
  costOfPurchase: string
  quantityOnHand: string
  reorderLevel?: string | null
  unitOfMeasure?: string | null
  supplierId?: string | null
  inventoryAssetAccountId?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  supplier?: {
    id: string
    name: string
  } | null
  inventoryAssetAccount?: {
    id: string
    accountNo: string
    accountName: string
  } | null
  stockMovements?: StockMovement[]
}

export interface InventoryListResponse {
  items: InventoryItem[]
  total: number
  page: number
  totalPages: number
}

export interface StockMovement {
  id: string
  itemId: string
  movementType: 'IN' | 'OUT' | 'ADJUSTMENT'
  quantity: string
  unitCost?: string | null
  totalCost?: string | null
  reference?: string | null
  description?: string | null
  createdById?: string
  createdAt?: string
  createdBy?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

export interface CreateInventoryRequest {
  itemName: string
  skuNumber?: string
  description?: string
  costOfPurchase: number
  quantityOnHand?: number
  reorderLevel?: number
  unitOfMeasure?: string
  vendorId?: string
  inventoryAssetAccountId?: string
}

export interface UpdateInventoryRequest {
  itemName?: string
  description?: string
  costOfPurchase?: number
  quantityOnHand?: number
  reorderLevel?: number
  unitOfMeasure?: string
  vendorId?: string
  inventoryAssetAccountId?: string
}

export interface CreateStockMovementRequest {
  itemId: string
  movementType: 'IN' | 'OUT' | 'ADJUSTMENT'
  quantity: number
  unitCost?: number
  referenceNumber?: string
  notes?: string
}

// Inventory valuation & reorder types
export interface InventoryValuationItem {
  itemId: string
  itemName: string
  quantity: number
  unitCost: number
  totalValue: number
}

export interface InventoryValuationResponse {
  totalValue: number
  itemCount: number
  valuation: InventoryValuationItem[]
}

export interface ReorderAlertItem {
  itemId: string
  itemName: string
  currentQuantity: number
  reorderLevel: number
}

export interface CogsRequest {
  itemId: string
  quantity: number
  method: 'FIFO' | 'LIFO' | 'AVERAGE'
}

export interface CogsResponse {
  itemId: string
  itemName: string
  quantity: number
  unitCost: number
  totalCost: number
}

export interface StockAdjustmentRequest {
  itemId: string
  adjustmentQuantity: number
  reason: string
  notes?: string
}

export interface StockAdjustmentResponse {
  id: string
  itemId: string
  adjustmentQuantity: string
  reason: string
  notes?: string
  createdAt: string
}

// Exchange Rates types
export interface ExchangeRate {
  id: string
  date: string // effective date ISO
  fromCurrencyId: string
  toCurrencyId: string
  rate: string
  isActive: boolean
  notes?: string | null
  createdById?: string
  createdAt: string
  fromCurrency?: AccountingCurrency
  toCurrency?: AccountingCurrency
  createdBy?: { id: string; firstName: string; lastName: string; email: string }
}

export interface CreateExchangeRateRequest {
  fromCurrencyId: string
  toCurrencyId: string
  rate: number
  effectiveDate: string
  notes?: string
}

export interface UpdateExchangeRateRequest {
  rate?: number
  effectiveDate?: string
  notes?: string
  isActive?: boolean
}

export interface ExchangeRatesResponse {
  exchangeRates: ExchangeRate[]
  total: number
  page: number
  totalPages: number
}

// Balance Sheet types
export interface BalanceSheetAccount {
  accountNo: string
  accountName: string
  balance: number
}
export interface BalanceSheetSection {
  accounts: BalanceSheetAccount[]
  total: number
  accumulatedDepreciation?: number
}
export interface BalanceSheetAssets {
  currentAssets: BalanceSheetSection
  fixedAssets: BalanceSheetSection
  otherAssets: BalanceSheetSection
  totalAssets: number
}
export interface BalanceSheetLiabilities {
  currentLiabilities: BalanceSheetSection
  longTermLiabilities: BalanceSheetSection
  totalLiabilities: number
}
export interface BalanceSheetEquity {
  accounts: BalanceSheetAccount[]
  total: number
  retainedEarnings: number
}
export interface BalanceSheetData {
  asOfDate: string
  currency: string
  assets: BalanceSheetAssets
  liabilities: BalanceSheetLiabilities
  equity: BalanceSheetEquity
  totalLiabilitiesAndEquity: number
  isBalanced: boolean
  difference: number
}
export interface BalanceSheetResponse {
  asOfDate: string
  currency: string
  assets: BalanceSheetAssets
  liabilities: BalanceSheetLiabilities
  equity: BalanceSheetEquity
  totalLiabilitiesAndEquity: number
  isBalanced: boolean
  difference: number
}

// Cash Flow types
export interface CashFlowAccount {
  accountId: string
  accountNo: string
  accountName: string
  accountType: string
  financialStatement: string
  totalDebits: number
  totalCredits: number
  netAmount: number
  cashFlowCategory: string
}
export interface CashFlowSection {
  accounts: CashFlowAccount[]
  total: number
  description: string
}
export interface CashFlowData {
  period: { startDate: string; endDate: string }
  operatingActivities: CashFlowSection
  investingActivities: CashFlowSection
  financingActivities: CashFlowSection
  netCashFlow: number
  beginningCashBalance: number
  endingCashBalance: number
  currency: { id: string; code: string; name: string }
  generatedAt: string
}
export interface CashFlowResponse extends CashFlowData { }

// --- BANK RECONCILIATION TYPES ---
export interface BankReconciliation {
  id: string
  fileName: string
  fileUrl: string
  status: 'PENDING' | 'COMPLETED' | 'FAILED'
  totalTransactions: number
  matchedCount: number
  unmatchedCount: number
  confidenceThreshold: number
  overallAccuracy: number | null
  notes: string | null
  createdById: string
  createdAt: string
  updatedAt: string
  createdBy: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  bankTransactions: BankTransaction[]
  reconciliationResults: any[]
}

export interface BankTransaction {
  id: string
  description: string
  amount: string
  transactionDate: string
  reference: string
  isMatched: boolean
  confidenceScore: number | null
  matchedJournalEntryId: string | null
  notes: string | null
}

export interface BankReconciliationSummary {
  totalReconciliations: number
  completedReconciliations: number
  pendingReconciliations: number
  failedReconciliations: number
  totalTransactions: number
  matchedTransactions: number
  unmatchedTransactions: number
  averageAccuracy: number | null
}

export interface BankReconciliationAuditTrail {
  // Define as per API response
  id: string
  action: string
  performedBy: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  timestamp: string
  details: string
}

export interface BankReconciliationUploadResponse {
  id: string
  fileName: string
  fileUrl: string
  status: string
  createdAt: string
}

export interface ApproveMatchRequest {
  bankTransactionId: string
  journalEntryId: string
  reconciliationId: string
}

// --- CASHBOOK TYPES ---
export interface CashbookBank {
  id: string
  name: string
  accountNumber: string
  currencyId: string
  glAccountId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  glAccount: {
    id: string
    accountNo: string
    accountName: string
    accountType: string
    financialStatement: string
    notes: string
    parentId: string | null
    isActive: boolean
    createdAt: string
    updatedAt: string
  }
  currency: {
    id: string
    code: string
    name: string
    symbol: string
    isActive: boolean
    isDefault: boolean
    createdAt: string
    updatedAt: string
  }
}

export interface CashbookEntry {
  id: string
  bankId: string
  transactionDate: string
  description: string
  amount: string
  type: 'RECEIPT' | 'PAYMENT'
  reference: string
  status: string
  counterpartyType: 'CUSTOMER' | 'VENDOR' | 'GL' | 'SUPPLIER'
  glAccountId: string | null
  customerId: string | null
  vendorId: string | null
  journalEntryId: string | null
  isReconciled: boolean
  reconciledAt: string | null
  reconciledById: string | null
  createdById: string
  createdAt: string
  updatedAt: string
  customer?: any
  vendor?: any
  glAccount?: any
  bank?: any
}

export interface CashbookBankPosition {
  bankId: string
  balance: number
  currencyId: string
  lastTransactionDate?: string
  openingBalance: number
  closingBalance: number
  totalReceipts: number
  totalPayments: number
  reconciledBalance: number
  unreconciledBalance: number
}

// --- CASHBOOK REPORT TYPES ---
export interface CashbookCashFlowEntry {
  id: string
  date: string
  type: 'RECEIPT' | 'PAYMENT'
  description: string
  amount: number
  reference: string
  counterparty: string
  bank: string
}

export interface CashbookCashFlowSummary {
  totalReceipts: number
  totalPayments: number
  netCashFlow: number
}

export interface CashbookCashFlowReport {
  period: {
    startDate: string
    endDate: string
  }
  summary: CashbookCashFlowSummary
  entries: CashbookCashFlowEntry[]
}

export interface CashbookBalanceCheckBank {
  id: string
  name: string
  accountNumber: string
  currency: string
}

export interface CashbookBalanceCheckCashbook {
  totalReceipts: number
  totalPayments: number
  netBalance: number
  entryCount: number
  reconciledCount: number
  unreconciledCount: number
}

export interface CashbookBalanceCheckReconciliation {
  totalReceipts: number
  totalPayments: number
  netBalance: number
  reconciliationCount: number
  matchedTransactions: number
  unmatchedTransactions: number
}

export interface CashbookBalanceCheckDifferences {
  receiptDifference: number
  paymentDifference: number
  netDifference: number
  isBalanced: boolean
}

export interface CashbookBalanceCheckStatus {
  isBalanced: boolean
  hasUnreconciledEntries: boolean
  hasUnmatchedTransactions: boolean
  needsAttention: boolean
}

export interface CashbookBalanceCheckSummary {
  message: string
  recommendations: string[]
}

export interface CashbookBalanceCheckReport {
  bank: CashbookBalanceCheckBank
  period: {
    startDate: string
    endDate: string
  }
  cashbook: CashbookBalanceCheckCashbook
  bankReconciliation: CashbookBalanceCheckReconciliation
  differences: CashbookBalanceCheckDifferences
  status: CashbookBalanceCheckStatus
  summary: CashbookBalanceCheckSummary
}
export interface JournalEntryFilters {
  search?: string
  status?: 'PENDING' | 'POSTED' | 'VOID'
  page?: number
  limit?: number
}
// --- ACCOUNTING API ---
class AccountingApiService {
  // Currencies
  async getCurrencies(): Promise<AccountingResponse<AccountingCurrency[]>> {
    return apiClient.get<AccountingResponse<AccountingCurrency[]>>('/accounting/currencies')
  }

  async getCurrencyById(id: string): Promise<AccountingResponse<AccountingCurrency>> {
    return apiClient.get<AccountingResponse<AccountingCurrency>>(`/accounting/currencies/${id}`)
  }

  async createCurrency(data: CreateCurrencyRequest): Promise<AccountingResponse<AccountingCurrency>> {
    return apiClient.post<AccountingResponse<AccountingCurrency>>('/accounting/currencies', data)
  }

  async updateCurrency(id: string, data: CreateCurrencyRequest): Promise<AccountingResponse<AccountingCurrency>> {
    return apiClient.put<AccountingResponse<AccountingCurrency>>(`/accounting/currencies/${id}`, data)
  }

  async deleteCurrency(id: string): Promise<AccountingResponse<any>> {
    return apiClient.delete<AccountingResponse<any>>(`/accounting/currencies/${id}`)
  }

  // Chart of Accounts
  async getAccounts(): Promise<AccountingResponse<Account[]>> {
    return apiClient.get<AccountingResponse<Account[]>>('/accounting/accounts')
  }

  async getAccountById(id: string): Promise<AccountingResponse<Account>> {
    return apiClient.get<AccountingResponse<Account>>(`/accounting/accounts/${id}`)
  }

  async createAccount(data: Partial<Account>): Promise<AccountingResponse<Account>> {
    return apiClient.post<AccountingResponse<Account>>('/accounting/accounts', data)
  }

  async updateAccount(id: string, data: Partial<Account>): Promise<AccountingResponse<Account>> {
    return apiClient.put<AccountingResponse<Account>>(`/accounting/accounts/${id}`, data)
  }

  async deleteAccount(id: string): Promise<AccountingResponse<any>> {
    return apiClient.delete<AccountingResponse<any>>(`/accounting/accounts/${id}`)
  }

  // Journal Entries
  async getJournalEntries(filters?: JournalEntryFilters): Promise<AccountingResponse<JournalEntry[]>> {
    // Build query params
    const params = new URLSearchParams()

    if (filters?.search) {
      params.append('search', filters.search.trim())
    }

    if (filters?.status) {
      params.append('status', filters.status)
    }

    if (filters?.page) {
      params.append('page', filters.page.toString())
    }

    if (filters?.limit) {
      params.append('limit', filters.limit.toString())
    }

    const queryString = params.toString()
    const url = queryString
      ? `/accounting/journal-entries?${queryString}`
      : '/accounting/journal-entries'

    return apiClient.get<AccountingResponse<JournalEntry[]>>(url)
  }

  async getJournalEntryById(id: string): Promise<AccountingResponse<JournalEntry>> {
    return apiClient.get<AccountingResponse<JournalEntry>>(`/accounting/journal-entries/${id}`)
  }

  async createJournalEntry(data: any): Promise<AccountingResponse<JournalEntry>> {
    return apiClient.post<AccountingResponse<JournalEntry>>('/accounting/journal-entries', data)
  }

  async updateJournalEntry(id: string, data: Partial<JournalEntry>): Promise<AccountingResponse<JournalEntry>> {
    return apiClient.put<AccountingResponse<JournalEntry>>(`/accounting/journal-entries/${id}`, data)
  }

  async deleteJournalEntry(id: string): Promise<AccountingResponse<any>> {
    return apiClient.delete<AccountingResponse<any>>(`/accounting/journal-entries/${id}`)
  }

  // Customers
  async getCustomers(params?: {
    page?: number
    limit?: number
    isActive?: boolean
  }): Promise<AccountingResponse<CustomersResponse>> {
    const queryString = params ? `?${new URLSearchParams(
      Object.entries(params).filter(([_, value]) => value !== undefined).map(([key, value]) => [key, String(value)])
    ).toString()}` : ''

    const response = await apiClient.get<AccountingResponse<CustomersResponse>>(`/accounting/customers${queryString}`)
    return response
  }

  async getCustomerById(id: string): Promise<AccountingResponse<Customer>> {
    const response = await apiClient.get<AccountingResponse<Customer>>(`/accounting/customers/${id}`)
    return response
  }

  async createCustomer(data: CreateCustomerRequest): Promise<AccountingResponse<Customer>> {
    const response = await apiClient.post<AccountingResponse<Customer>>('/accounting/customers', data)
    return response
  }

  async updateCustomer(id: string, data: CreateCustomerRequest): Promise<AccountingResponse<Customer>> {
    const response = await apiClient.put<AccountingResponse<Customer>>(`/accounting/customers/${id}`, data)
    return response
  }

  async deleteCustomer(id: string): Promise<AccountingResponse<any>> {
    const response = await apiClient.delete<AccountingResponse<any>>(`/accounting/customers/${id}`)
    return response
  }

  // Suppliers
  async getSuppliers(): Promise<AccountingResponse<Supplier[]>> {
    return apiClient.get<AccountingResponse<Supplier[]>>('/accounting/suppliers')
  }

  async getSupplierById(id: string): Promise<AccountingResponse<Supplier>> {
    return apiClient.get<AccountingResponse<Supplier>>(`/accounting/suppliers/${id}`)
  }

  async createSupplier(data: Partial<Supplier>): Promise<AccountingResponse<Supplier>> {
    return apiClient.post<AccountingResponse<Supplier>>('/accounting/suppliers', data)
  }

  async updateSupplier(id: string, data: Partial<Supplier>): Promise<AccountingResponse<Supplier>> {
    return apiClient.put<AccountingResponse<Supplier>>(`/accounting/suppliers/${id}`, data)
  }

  async deleteSupplier(id: string): Promise<AccountingResponse<any>> {
    return apiClient.delete<AccountingResponse<any>>(`/accounting/suppliers/${id}`)
  }

  // Invoices
  async getInvoices(params?: {
    page?: number
    limit?: number
    status?: 'DRAFT' | 'SENT' | 'PAID' | 'VOID'
    search?: string
    customerId?: string
    currencyId?: string
    startDate?: string
    endDate?: string
    isActive?: boolean
  }): Promise<AccountingResponse<InvoicesResponse>> {
    const queryParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value))
        }
      })
    }

    const queryString = queryParams.toString()
    const url = queryString ? `/accounting/invoices?${queryString}` : '/accounting/invoices'

    return apiClient.get<AccountingResponse<InvoicesResponse>>(url)
  }

  async getInvoiceById(id: string): Promise<AccountingResponse<Invoice>> {
    return apiClient.get<AccountingResponse<Invoice>>(`/accounting/invoices/${id}`)
  }

  async createInvoice(data: CreateInvoiceRequest): Promise<AccountingResponse<Invoice>> {
    return apiClient.post<AccountingResponse<Invoice>>('/accounting/invoices', data)
  }

  async updateInvoice(id: string, data: CreateInvoiceRequest): Promise<AccountingResponse<Invoice>> {
    return apiClient.put<AccountingResponse<Invoice>>(`/accounting/invoices/${id}`, data)
  }

  async deleteInvoice(id: string): Promise<AccountingResponse<any>> {
    return apiClient.delete<AccountingResponse<any>>(`/accounting/invoices/${id}`)
  }

  async sendInvoice(id: string): Promise<AccountingResponse<Invoice>> {
    return apiClient.patch<AccountingResponse<Invoice>>(`/accounting/invoices/${id}/send`)
  }

  async markInvoiceAsPaid(id: string, data: MarkAsPaidRequest): Promise<AccountingResponse<Invoice>> {
    return apiClient.patch<AccountingResponse<Invoice>>(`/accounting/invoices/${id}/mark-as-paid`, data)
  }

  async voidInvoice(id: string, data: VoidInvoiceRequest): Promise<AccountingResponse<Invoice>> {
    return apiClient.patch<AccountingResponse<Invoice>>(`/accounting/invoices/${id}/void`, data)
  }

  // Assets
  async getAssets(): Promise<AccountingResponse<{ assets: Asset[], total: number, page: number, totalPages: number }>> {
    return apiClient.get<AccountingResponse<{ assets: Asset[], total: number, page: number, totalPages: number }>>('/accounting/assets')
  }

  async getAsset(id: string): Promise<AccountingResponse<Asset>> {
    return apiClient.get<AccountingResponse<Asset>>(`/accounting/assets/${id}`)
  }

  async createAsset(data: CreateAssetRequest): Promise<AccountingResponse<Asset>> {
    return apiClient.post<AccountingResponse<Asset>>('/accounting/assets', data)
  }

  async updateAsset(id: string, data: UpdateAssetRequest): Promise<AccountingResponse<Asset>> {
    return apiClient.put<AccountingResponse<Asset>>(`/accounting/assets/${id}`, data)
  }

  async deleteAsset(id: string): Promise<AccountingResponse<void>> {
    return apiClient.delete<AccountingResponse<void>>(`/accounting/assets/${id}`)
  }

  async calculateDepreciation(id: string, data: CalculateDepreciationRequest): Promise<AccountingResponse<DepreciationRecord>> {
    return apiClient.post<AccountingResponse<DepreciationRecord>>(`/accounting/assets/${id}/depreciation`, data)
  }

  // Post depreciation
  async postDepreciation(depreciationId: string): Promise<AccountingResponse<void>> {
    return apiClient.post<AccountingResponse<void>>(`/accounting/assets/depreciation/${depreciationId}/post`, {})
  }

  async disposeAsset(id: string, data: DisposeAssetRequest): Promise<AccountingResponse<void>> {
    return apiClient.post<AccountingResponse<void>>(`/accounting/assets/${id}/dispose`, data)
  }

  async getDepreciationSchedule(id: string): Promise<AccountingResponse<DepreciationScheduleItem[]>> {
    return apiClient.get<AccountingResponse<DepreciationScheduleItem[]>>(`/accounting/assets/${id}/depreciation-schedule`)
  }

  // Dashboard
  async getDashboardStats(month: string, currencyId: string): Promise<AccountingResponse<DashboardStats>> {
    return apiClient.get<AccountingResponse<DashboardStats>>(`/accounting/dashboard/stats?month=${month}&currencyId=${currencyId}`)
  }

  async getSalesChart(currencyId: string): Promise<AccountingResponse<ChartData>> {
    return apiClient.get<AccountingResponse<ChartData>>(`/accounting/dashboard/sales-chart?currencyId=${currencyId}`)
  }

  async getCreditNotesChart(currencyId: string): Promise<AccountingResponse<ChartData>> {
    return apiClient.get<AccountingResponse<ChartData>>(`/accounting/dashboard/credit-notes-chart?currencyId=${currencyId}`)
  }

  async getDashboard(params: AccountingDashboardParams = {}): Promise<AccountingResponse<AccountingDashboardData>> {
    const queryParams = new URLSearchParams()
    if (params.period) queryParams.append('period', params.period)
    if (params.benchmark) queryParams.append('benchmark', params.benchmark)
    if (params.startDate) queryParams.append('startDate', params.startDate)
    if (params.endDate) queryParams.append('endDate', params.endDate)
    if (params.currencyId) queryParams.append('currencyId', params.currencyId)
    
    const queryString = queryParams.toString()
    return apiClient.get<AccountingResponse<AccountingDashboardData>>(
      `/accounting/dashboard${queryString ? `?${queryString}` : ''}`
    )
  }

  async getRecentExpenses(limit: number = 10, currencyId: string): Promise<AccountingResponse<Expense[]>> {
    return apiClient.get<AccountingResponse<Expense[]>>(`/accounting/expenses/recent?limit=${limit}&currencyId=${currencyId}`)
  }

  // Reports
  async getTrialBalance(date?: string): Promise<AccountingResponse<any>> {
    // Deprecated: use new getTrialBalanceV2
    return apiClient.get<AccountingResponse<any>>('/accounting/reports/trial-balance', { params: { date } })
  }

  // NEW: Flexible trial balance API
  async getTrialBalanceV2(params: {
    periodType?: string;
    periodValue?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
    currencyId?: string;
  }): Promise<AccountingResponse<any>> {
    const queryString = params ? `?${new URLSearchParams(
      Object.entries(params).filter(([_, value]) => value !== undefined && value !== null).map(([key, value]) => [key, String(value)])
    ).toString()}` : '';
    return apiClient.get<AccountingResponse<any>>(`/accounting/trial-balance${queryString}`);
  }

  async getTrialBalanceSummaryV2(params: {
    periodType?: string;
    periodValue?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
    currencyId?: string;
  }): Promise<AccountingResponse<any>> {
    const queryString = params ? `?${new URLSearchParams(
      Object.entries(params).filter(([_, value]) => value !== undefined && value !== null).map(([key, value]) => [key, String(value)])
    ).toString()}` : '';
    return apiClient.get<AccountingResponse<any>>(`/accounting/trial-balance/summary${queryString}`);
  }

  async getIncomeStatementV2(params: {
    periodType?: string;
    periodValue?: string;
    startDate?: string;
    endDate?: string;
    currencyId?: string;
  }): Promise<AccountingResponse<IncomeStatementData>> {
    const queryString = params ? `?${new URLSearchParams(
      Object.entries(params).filter(([_, value]) => value !== undefined && value !== null).map(([key, value]) => [key, String(value)])
    ).toString()}` : '';
    return apiClient.get<AccountingResponse<IncomeStatementData>>(`/accounting/income-statement${queryString}`);
  }

  async getCashFlowV2(params: {
    periodType?: string;
    periodValue?: string;
    startDate?: string;
    endDate?: string;
    currencyId?: string;
  }): Promise<AccountingResponse<CashFlowResponse>> {
    const queryString = params ? `?${new URLSearchParams(
      Object.entries(params).filter(([_, value]) => value !== undefined && value !== null).map(([key, value]) => [key, String(value)])
    ).toString()}` : '';
    return apiClient.get<AccountingResponse<CashFlowResponse>>(`/accounting/cash-flow${queryString}`);
  }

  async getBalanceSheetV2(params: {
    periodType?: string;
    periodValue?: string;
    asOfDate?: string;
    currencyId?: string;
  }): Promise<AccountingResponse<BalanceSheetResponse>> {
    const queryString = params ? `?${new URLSearchParams(
      Object.entries(params).filter(([_, value]) => value !== undefined && value !== null).map(([key, value]) => [key, String(value)])
    ).toString()}` : '';
    return apiClient.get<AccountingResponse<BalanceSheetResponse>>(`/accounting/balance-sheet${queryString}`);
  }

  // Chart of Accounts
  async getChartOfAccounts(params?: {
    accountType?: string
    isActive?: boolean
    parentId?: string
  }): Promise<AccountingResponse<ChartOfAccount[]>> {
    const queryString = params ? `?${new URLSearchParams(
      Object.entries(params).filter(([_, value]) => value !== undefined).map(([key, value]) => [key, String(value)])
    ).toString()}` : ''

    const response = await apiClient.get<AccountingResponse<ChartOfAccount[]>>(`/accounting/chart-of-accounts${queryString}`)
    return response
  }

  async getChartOfAccountById(id: string): Promise<AccountingResponse<ChartOfAccount>> {
    const response = await apiClient.get<AccountingResponse<ChartOfAccount>>(`/accounting/chart-of-accounts/${id}`)
    return response
  }

  async createChartOfAccount(data: CreateChartOfAccountRequest): Promise<AccountingResponse<ChartOfAccount>> {
    const response = await apiClient.post<AccountingResponse<ChartOfAccount>>('/accounting/chart-of-accounts', data)
    return response
  }

  async updateChartOfAccount(id: string, data: CreateChartOfAccountRequest): Promise<AccountingResponse<ChartOfAccount>> {
    const response = await apiClient.put<AccountingResponse<ChartOfAccount>>(`/accounting/chart-of-accounts/${id}`, data)
    return response
  }

  async deleteChartOfAccount(id: string): Promise<AccountingResponse<any>> {
    const response = await apiClient.delete<AccountingResponse<any>>(`/accounting/chart-of-accounts/${id}`)
    return response
  }

  // Vendors
  async getVendors(params?: {
    page?: number
    limit?: number
    isActive?: boolean
  }): Promise<AccountingResponse<Vendor[]>> {
    const queryString = params ? `?${new URLSearchParams(
      Object.entries(params).filter(([_, value]) => value !== undefined).map(([key, value]) => [key, String(value)])
    ).toString()}` : ''

    const response = await apiClient.get<AccountingResponse<Vendor[]>>(`/cashbook/vendors${queryString}`)
    return response
  }

  async getVendorById(id: string): Promise<AccountingResponse<Vendor>> {
    const response = await apiClient.get<AccountingResponse<Vendor>>(`/accounting/vendors/${id}`)
    return response
  }

  async createVendor(data: CreateVendorRequest): Promise<AccountingResponse<Vendor>> {
    const response = await apiClient.post<AccountingResponse<Vendor>>('/accounting/vendors', data)
    return response
  }

  async updateVendor(id: string, data: CreateVendorRequest): Promise<AccountingResponse<Vendor>> {
    const response = await apiClient.put<AccountingResponse<Vendor>>(`/accounting/vendors/${id}`, data)
    return response
  }

  async deleteVendor(id: string): Promise<AccountingResponse<any>> {
    const response = await apiClient.delete<AccountingResponse<any>>(`/accounting/vendors/${id}`)
    return response
  }

  // Expense Categories
  async getExpenseCategories(params?: {
    page?: number
    limit?: number
    isActive?: boolean
    parentId?: string
  }): Promise<AccountingResponse<ExpenseCategory[]>> {
    const queryString = params ? `?${new URLSearchParams(
      Object.entries(params).filter(([_, value]) => value !== undefined).map(([key, value]) => [key, String(value)])
    ).toString()}` : ''

    const response = await apiClient.get<AccountingResponse<ExpenseCategory[]>>(`/accounting/expense-categories${queryString}`)
    return response
  }

  async getExpenseCategoryById(id: string): Promise<AccountingResponse<ExpenseCategory>> {
    const response = await apiClient.get<AccountingResponse<ExpenseCategory>>(`/accounting/expense-categories/${id}`)
    return response
  }

  async createExpenseCategory(data: CreateExpenseCategoryRequest): Promise<AccountingResponse<ExpenseCategory>> {
    const response = await apiClient.post<AccountingResponse<ExpenseCategory>>('/accounting/expense-categories', data)
    return response
  }

  async updateExpenseCategory(id: string, data: CreateExpenseCategoryRequest): Promise<AccountingResponse<ExpenseCategory>> {
    const response = await apiClient.put<AccountingResponse<ExpenseCategory>>(`/accounting/expense-categories/${id}`, data)
    return response
  }

  async deleteExpenseCategory(id: string): Promise<AccountingResponse<any>> {
    const response = await apiClient.delete<AccountingResponse<any>>(`/accounting/expense-categories/${id}`)
    return response
  }

  // Expenses
  async getExpenses(params?: {
    page?: number
    limit?: number
    search?: string
    isActive?: boolean
    status?: 'DRAFT' | 'POSTED' | 'VOID'
  }): Promise<AccountingResponse<Expense[]>> {
    const queryString = params ? `?${new URLSearchParams(
      Object.entries(params).filter(([_, value]) => value !== undefined).map(([key, value]) => [key, String(value)])
    ).toString()}` : ''

    const response = await apiClient.get<AccountingResponse<Expense[]>>(`/accounting/expenses${queryString}`)
    return response
  }

  async getExpenseById(id: string): Promise<AccountingResponse<Expense>> {
    const response = await apiClient.get<AccountingResponse<Expense>>(`/accounting/expenses/${id}`)
    return response
  }

  async createExpense(data: CreateExpenseRequest): Promise<AccountingResponse<Expense>> {
    const response = await apiClient.post<AccountingResponse<Expense>>('/accounting/expenses', data)
    return response
  }

  async updateExpense(id: string, data: CreateExpenseRequest): Promise<AccountingResponse<Expense>> {
    const response = await apiClient.put<AccountingResponse<Expense>>(`/accounting/expenses/${id}`, data)
    return response
  }

  async deleteExpense(id: string): Promise<AccountingResponse<any>> {
    const response = await apiClient.delete<AccountingResponse<any>>(`/accounting/expenses/${id}`)
    return response
  }

  // Journal Entry Actions
  async postJournalEntry(entryId: string): Promise<AccountingResponse<any>> {
    return apiClient.patch<AccountingResponse<any>>(`/accounting/journal-entries/${entryId}/post`)
  }

  async voidJournalEntry(entryId: string): Promise<AccountingResponse<any>> {
    return apiClient.patch<AccountingResponse<any>>(`/accounting/journal-entries/${entryId}/void`)
  }

  // Trial Balance
  async getTrialBalance(date?: string): Promise<AccountingResponse<TrialBalanceData>> {
    const queryString = date ? `?date=${date}` : ''
    return apiClient.get<AccountingResponse<TrialBalanceData>>(`/accounting/trial-balance${queryString}`)
  }

  async getTrialBalanceSummary(date?: string): Promise<AccountingResponse<TrialBalanceSummary>> {
    const queryString = date ? `?date=${date}` : ''
    return apiClient.get<AccountingResponse<TrialBalanceSummary>>(`/accounting/trial-balance/summary${queryString}`)
  }

  // Credit Notes
  async getCreditNotes(): Promise<AccountingResponse<{ creditNotes: CreditNote[], total: number, page: number, totalPages: number }>> {
    return apiClient.get<AccountingResponse<{ creditNotes: CreditNote[], total: number, page: number, totalPages: number }>>('/accounting/credit-notes')
  }

  async getCreditNote(id: string): Promise<AccountingResponse<CreditNote>> {
    return apiClient.get<AccountingResponse<CreditNote>>(`/accounting/credit-notes/${id}`)
  }

  async getCustomerCreditNotes(customerId: string): Promise<AccountingResponse<{ creditNotes: CreditNote[], total: number, page: number, totalPages: number }>> {
    return apiClient.get<AccountingResponse<{ creditNotes: CreditNote[], total: number, page: number, totalPages: number }>>(`/accounting/credit-notes/customer/${customerId}`)
  }

  async createCreditNote(data: CreateCreditNoteRequest): Promise<AccountingResponse<CreditNote>> {
    return apiClient.post<AccountingResponse<CreditNote>>('/accounting/credit-notes', data)
  }

  async updateCreditNote(id: string, data: UpdateCreditNoteRequest): Promise<AccountingResponse<CreditNote>> {
    return apiClient.put<AccountingResponse<CreditNote>>(`/accounting/credit-notes/${id}`, data)
  }

  async sendCreditNote(id: string): Promise<AccountingResponse<CreditNote>> {
    return apiClient.post<AccountingResponse<CreditNote>>(`/accounting/credit-notes/${id}/send`, {})
  }

  async applyCreditNote(id: string, data: ApplyCreditNoteRequest): Promise<AccountingResponse<void>> {
    return apiClient.post<AccountingResponse<void>>(`/accounting/credit-notes/${id}/apply`, data)
  }

  async deleteCreditNote(id: string): Promise<AccountingResponse<void>> {
    return apiClient.delete<AccountingResponse<void>>(`/accounting/credit-notes/${id}`)
  }

  // Inventory endpoints
  async getInventoryItems(): Promise<AccountingResponse<InventoryListResponse>> {
    return apiClient.get<AccountingResponse<InventoryListResponse>>('/accounting/inventory/items')
  }

  async getInventoryItem(id: string): Promise<AccountingResponse<InventoryItem>> {
    return apiClient.get<AccountingResponse<InventoryItem>>(`/accounting/inventory/items/${id}`)
  }

  async createInventoryItem(data: CreateInventoryRequest): Promise<AccountingResponse<InventoryItem>> {
    return apiClient.post<AccountingResponse<InventoryItem>>('/accounting/inventory/items', data)
  }

  async updateInventoryItem(id: string, data: UpdateInventoryRequest): Promise<AccountingResponse<InventoryItem>> {
    return apiClient.put<AccountingResponse<InventoryItem>>(`/accounting/inventory/items/${id}`, data)
  }

  async deleteInventoryItem(id: string): Promise<AccountingResponse<void>> {
    return apiClient.delete<AccountingResponse<void>>(`/accounting/inventory/items/${id}`)
  }

  async createStockMovement(data: CreateStockMovementRequest): Promise<AccountingResponse<StockMovement>> {
    return apiClient.post<AccountingResponse<StockMovement>>('/accounting/inventory/movements', data)
  }

  async getStockMovements(itemId: string): Promise<AccountingResponse<{ movements: StockMovement[], total: number, page: number, totalPages: number }>> {
    return apiClient.get<AccountingResponse<{ movements: StockMovement[], total: number, page: number, totalPages: number }>>(`/accounting/inventory/items/${itemId}/movements`)
  }

  // Inventory valuation/reorder/cogs/adjustments
  async getInventoryValuation(): Promise<AccountingResponse<InventoryValuationResponse>> {
    return apiClient.get<AccountingResponse<InventoryValuationResponse>>('/accounting/inventory/valuation')
  }

  async getReorderAlerts(): Promise<AccountingResponse<ReorderAlertItem[]>> {
    return apiClient.get<AccountingResponse<ReorderAlertItem[]>>('/accounting/inventory/reorder-alerts')
  }

  async calculateCogs(data: CogsRequest): Promise<AccountingResponse<CogsResponse>> {
    return apiClient.post<AccountingResponse<CogsResponse>>('/accounting/inventory/calculate-cogs', data)
  }

  async createStockAdjustment(data: StockAdjustmentRequest): Promise<AccountingResponse<StockAdjustmentResponse>> {
    return apiClient.post<AccountingResponse<StockAdjustmentResponse>>('/accounting/inventory/adjustments', data)
  }

  // Exchange rates (multi-currency)
  async getExchangeRates(params?: { page?: number; limit?: number }): Promise<AccountingResponse<ExchangeRatesResponse>> {
    const query = params ? `?${new URLSearchParams(Object.entries(params).filter(([_, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString()}` : ''
    return apiClient.get<AccountingResponse<ExchangeRatesResponse>>(`/accounting/multi-currency/exchange-rates${query}`)
  }

  async getExchangeRateById(id: string): Promise<AccountingResponse<ExchangeRate>> {
    return apiClient.get<AccountingResponse<ExchangeRate>>(`/accounting/multi-currency/exchange-rates/${id}`)
  }

  async createExchangeRate(data: CreateExchangeRateRequest): Promise<AccountingResponse<ExchangeRate>> {
    return apiClient.post<AccountingResponse<ExchangeRate>>('/accounting/multi-currency/exchange-rates', data)
  }

  async updateExchangeRate(id: string, data: UpdateExchangeRateRequest): Promise<AccountingResponse<ExchangeRate>> {
    return apiClient.put<AccountingResponse<ExchangeRate>>(`/accounting/multi-currency/exchange-rates/${id}`, data)
  }

  async deleteExchangeRate(id: string): Promise<AccountingResponse<any>> {
    return apiClient.delete<AccountingResponse<any>>(`/accounting/multi-currency/exchange-rates/${id}`)
  }

  // Balance Sheet
  async generateBalanceSheet(data: { asOfDate: string; currencyId: string }): Promise<AccountingResponse<BalanceSheetResponse>> {
    return apiClient.post<AccountingResponse<BalanceSheetResponse>>('/accounting/balance-sheet/generate', data)
  }
  async getBalanceSheet(asOfDate: string, currencyId: string): Promise<AccountingResponse<BalanceSheetResponse>> {
    return apiClient.get<AccountingResponse<BalanceSheetResponse>>(`/accounting/balance-sheet?asOfDate=${asOfDate}&currencyId=${currencyId}`)
  }

  // Cash Flow
  async generateCashFlow(data: { startDate: string; endDate: string; currencyId: string }): Promise<AccountingResponse<CashFlowResponse>> {
    return apiClient.post<AccountingResponse<CashFlowResponse>>('/accounting/cash-flow/generate', data)
  }
  async getCashFlow(startDate: string, endDate: string, currencyId: string): Promise<AccountingResponse<CashFlowResponse>> {
    return apiClient.get<AccountingResponse<CashFlowResponse>>(`/accounting/cash-flow?startDate=${startDate}&endDate=${endDate}&currencyId=${currencyId}`)
  }

  // Bank Reconciliation CRUD
  async getBankReconciliations(): Promise<any> {
    return apiClient.get<any>('/accounting/bank-reconciliation')
  }
  async getBankReconciliation(id: string): Promise<AccountingResponse<BankReconciliation>> {
    return apiClient.get<AccountingResponse<BankReconciliation>>(`/accounting/bank-reconciliation/${id}`)
  }
  async deleteBankReconciliation(id: string): Promise<AccountingResponse<void>> {
    return apiClient.delete<AccountingResponse<void>>(`/accounting/bank-reconciliation/${id}`)
  }
  async getBankReconciliationSummary(): Promise<AccountingResponse<BankReconciliationSummary>> {
    return apiClient.get<AccountingResponse<BankReconciliationSummary>>('/accounting/bank-reconciliation/summary')
  }
  async uploadBankReconciliationFile(file: File): Promise<AccountingResponse<BankReconciliationUploadResponse>> {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post<AccountingResponse<BankReconciliationUploadResponse>>('/accounting/bank-reconciliation/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
  async getBankReconciliationAuditTrail(id: string): Promise<AccountingResponse<BankReconciliationAuditTrail[]>> {
    return apiClient.get<AccountingResponse<BankReconciliationAuditTrail[]>>(`/accounting/bank-reconciliation/${id}/audit-trail`)
  }
  async getBankReconciliationUnmatched(id: string): Promise<AccountingResponse<BankTransaction[]>> {
    return apiClient.get<AccountingResponse<BankTransaction[]>>(`/accounting/bank-reconciliation/${id}/unmatched`)
  }
  async getBankTransactionMatches(transactionId: string): Promise<AccountingResponse<any[]>> {
    return apiClient.get<AccountingResponse<any[]>>(`/accounting/bank-reconciliation/transactions/${transactionId}/matches`)
  }
  async approveBankReconciliationMatch(data: ApproveMatchRequest): Promise<AccountingResponse<void>> {
    return apiClient.post<AccountingResponse<void>>('/accounting/bank-reconciliation/approve-match', data)
  }
  async rejectBankReconciliationResult(resultId: string): Promise<AccountingResponse<void>> {
    return apiClient.post<AccountingResponse<void>>(`/accounting/bank-reconciliation/results/${resultId}/reject`, {})
  }

  // Purchase Invoices (Accounts Payable)
  async getPurchaseInvoices(params?: {
    page?: number
    limit?: number
    status?: 'DRAFT' | 'POSTED'
    paymentStatus?: 'PENDING' | 'PAID'
    search?: string
    vendorId?: string
    currencyId?: string
    startDate?: string
    endDate?: string
  }): Promise<AccountingResponse<PurchaseInvoicesResponse>> {
    const queryParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value))
        }
      })
    }

    const queryString = queryParams.toString()
    const url = queryString ? `/accounting/purchase-invoices?${queryString}` : '/accounting/purchase-invoices'

    return apiClient.get<AccountingResponse<PurchaseInvoicesResponse>>(url)
  }

  async getPurchaseInvoiceById(id: string): Promise<AccountingResponse<PurchaseInvoice>> {
    return apiClient.get<AccountingResponse<PurchaseInvoice>>(`/accounting/purchase-invoices/${id}`)
  }

  async createPurchaseInvoice(data: CreatePurchaseInvoiceRequest): Promise<AccountingResponse<PurchaseInvoice>> {
    return apiClient.post<AccountingResponse<PurchaseInvoice>>('/accounting/purchase-invoices', data)
  }

  async updatePurchaseInvoice(id: string, data: UpdatePurchaseInvoiceRequest): Promise<AccountingResponse<PurchaseInvoice>> {
    return apiClient.put<AccountingResponse<PurchaseInvoice>>(`/accounting/purchase-invoices/${id}`, data)
  }

  async deletePurchaseInvoice(id: string): Promise<AccountingResponse<any>> {
    return apiClient.delete<AccountingResponse<any>>(`/accounting/purchase-invoices/${id}`)
  }

  async submitPurchaseInvoice(id: string, data: SubmitPurchaseInvoiceRequest): Promise<AccountingResponse<PurchaseInvoice>> {
    return apiClient.post<AccountingResponse<PurchaseInvoice>>(`/accounting/purchase-invoices/${id}/submit`, data)
  }

  async payPurchaseInvoice(id: string, data: PayPurchaseInvoiceRequest): Promise<AccountingResponse<PurchaseInvoice>> {
    return apiClient.post<AccountingResponse<PurchaseInvoice>>(`/accounting/purchase-invoices/${id}/pay`, data)
  }

  async getPurchaseInvoiceBanks(): Promise<AccountingResponse<PurchaseInvoiceBank[]>> {
    return apiClient.get<AccountingResponse<PurchaseInvoiceBank[]>>('/accounting/purchase-invoices/banks')
  }

  async getPurchaseInvoiceExpenseAccounts(): Promise<AccountingResponse<ChartOfAccount[]>> {
    return apiClient.get<AccountingResponse<ChartOfAccount[]>>('/accounting/purchase-invoices/expense-accounts')
  }

}

export const accountingApi = new AccountingApiService()




