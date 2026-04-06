export type PeriodType = 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY'
export type FormStatus = 'DRAFT' | 'SUBMITTED' | 'REVIEWED' | 'REJECTED'

export interface IncomeStatementData {
  totalRevenue: number
  otherIncome: number
  costOfGoodsSold: number
  sellingExpenses: number
  adminExpenses: number
  depreciationAmortization: number
  rdExpenses: number
  otherOperatingExpenses: number
  financeIncome: number
  financeExpense: number
  incomeTax: number
}

export interface BalanceSheetData {
  // Current Assets
  cashEquivalents: number
  accountsReceivable: number
  inventory: number
  prepaidExpenses: number
  otherCurrentAssets: number
  // Non-Current Assets
  propertyPlantEquipment: number
  intangibleAssets: number
  longTermInvestments: number
  otherNonCurrentAssets: number
  // Current Liabilities
  accountsPayable: number
  shortTermLoans: number
  accruedExpenses: number
  currentPortionLTD: number
  otherCurrentLiabilities: number
  // Non-Current Liabilities
  longTermLoans: number
  deferredTaxLiabilities: number
  otherNonCurrentLiabilities: number
  // Equity
  shareCapital: number
  retainedEarnings: number
  additionalPaidInCapital: number
  otherEquity: number
}

export interface CashFlowData {
  cashAtBeginning: number
  // Operations receipts
  cashFromCustomers: number
  cashFromOtherOperations: number
  // Operations payments
  paidInventory: number
  paidAdminExpenses: number
  paidWages: number
  paidInterest: number
  paidIncomeTaxes: number
  // Investing receipts
  proceedsFromPropertySales: number
  principalCollected: number
  proceedsFromInvestmentSales: number
  // Investing payments
  purchaseOfProperty: number
  loansToOtherEntities: number
  purchaseOfInvestments: number
  // Financing receipts
  proceedsFromStockIssuance: number
  borrowingProceeds: number
  // Financing payments
  stockRepurchase: number
  loanRepayments: number
  dividendsPaid: number
}

export interface NonFinancialKPIData {
  totalCustomers: number
  newCustomers: number
  lostCustomers: number
  monthlyRecurringRevenue: number
  customerAcquisitionCost: number
  avgRevenuePerCustomer: number
  totalHeadcount: number
  newHires: number
  staffDepartures: number
  trainingHours: number
  unitSales: number
  avgSellingPrice: number
  variableCostPerUnit: number
  inventoryUnits: number
  newProductsLaunched: number
  patentsFiled: number
  conversionRate: number
}

export interface ReportingFormData {
  periodType: PeriodType
  periodStart: string
  periodEnd: string
  incomeStatement: IncomeStatementData
  balanceSheet: BalanceSheetData
  cashFlow: CashFlowData
  nonFinancialKPIs: NonFinancialKPIData
}

export const EMPTY_INCOME_STATEMENT: IncomeStatementData = {
  totalRevenue: 0, otherIncome: 0, costOfGoodsSold: 0,
  sellingExpenses: 0, adminExpenses: 0, depreciationAmortization: 0,
  rdExpenses: 0, otherOperatingExpenses: 0,
  financeIncome: 0, financeExpense: 0, incomeTax: 0,
}

export const EMPTY_BALANCE_SHEET: BalanceSheetData = {
  cashEquivalents: 0, accountsReceivable: 0, inventory: 0, prepaidExpenses: 0, otherCurrentAssets: 0,
  propertyPlantEquipment: 0, intangibleAssets: 0, longTermInvestments: 0, otherNonCurrentAssets: 0,
  accountsPayable: 0, shortTermLoans: 0, accruedExpenses: 0, currentPortionLTD: 0, otherCurrentLiabilities: 0,
  longTermLoans: 0, deferredTaxLiabilities: 0, otherNonCurrentLiabilities: 0,
  shareCapital: 0, retainedEarnings: 0, additionalPaidInCapital: 0, otherEquity: 0,
}

export const EMPTY_CASH_FLOW: CashFlowData = {
  cashAtBeginning: 0,
  cashFromCustomers: 0, cashFromOtherOperations: 0,
  paidInventory: 0, paidAdminExpenses: 0, paidWages: 0, paidInterest: 0, paidIncomeTaxes: 0,
  proceedsFromPropertySales: 0, principalCollected: 0, proceedsFromInvestmentSales: 0,
  purchaseOfProperty: 0, loansToOtherEntities: 0, purchaseOfInvestments: 0,
  proceedsFromStockIssuance: 0, borrowingProceeds: 0,
  stockRepurchase: 0, loanRepayments: 0, dividendsPaid: 0,
}

export const EMPTY_NON_FINANCIAL_KPIS: NonFinancialKPIData = {
  totalCustomers: 0, newCustomers: 0, lostCustomers: 0,
  monthlyRecurringRevenue: 0, customerAcquisitionCost: 0, avgRevenuePerCustomer: 0,
  totalHeadcount: 0, newHires: 0, staffDepartures: 0, trainingHours: 0,
  unitSales: 0, avgSellingPrice: 0, variableCostPerUnit: 0, inventoryUnits: 0,
  newProductsLaunched: 0, patentsFiled: 0, conversionRate: 0,
}
