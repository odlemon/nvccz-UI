export type PeriodType = 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY'
export type FormStatus  = 'DRAFT' | 'SUBMITTED' | 'REVIEWED' | 'REJECTED'

/** Three-year comparison column: [current, prior1, prior2] */
export type V3 = [number, number, number]
/** Two-year comparison column: [current, prior] */
export type V2 = [number, number]

export const z3 = (): V3 => [0, 0, 0]
export const z2 = (): V2 => [0, 0]

// ─── Income Statement (3-year comparison) ────────────────────────────────────

export interface IncomeStatementData {
  // Revenue
  grossSales: V3
  returnsRefunds: V3
  otherRevenue: V3
  // Cost of Goods Sold
  goodsPurchased: V3
  materials: V3
  labour: V3
  overhead: V3
  // Operating Expenses
  advertisingPromotion: V3
  badDebt: V3
  bankServiceCharges: V3
  computerInternet: V3
  deliveryFreight: V3
  furnitureEquipment: V3
  insurance: V3
  maintenanceRepairs: V3
  mileage: V3
  officeSupplies: V3
  otherExpenses: V3
  payrollProcessing: V3
  postageDelivery: V3
  professionalServices: V3
  rentLease: V3
  researchDevelopment: V3
  salariesBenefitsWages: V3
  travel: V3
  utilitiesTelephone: V3
  depreciationAmortization: V3
  // Non-operating
  nonOperatingRevenues: V3
  interestExpense: V3
  incomeTaxExpense: V3
  // Below-the-line
  discontinuedOperations: V3
  accountingChanges: V3
  extraordinaryItems: V3
}

// ─── Balance Sheet (2-year comparison) ───────────────────────────────────────

export interface BalanceSheetData {
  // Current Assets
  cash: V2
  accountsReceivable: V2
  inventory: V2
  prepaidExpenses: V2
  shortTermInvestments: V2
  // Fixed Assets
  longTermInvestments: V2
  propertyPlantEquipment: V2
  accumulatedDepreciation: V2
  intangibleAssets: V2
  // Other Assets
  deferredIncomeTax: V2
  otherAssets: V2
  // Current Liabilities
  accountsPayable: V2
  shortTermLoans: V2
  incomeTaxesPayable: V2
  accruedSalariesWages: V2
  unearnedRevenue: V2
  currentPortionLTD: V2
  // Long-Term Liabilities
  longTermDebt: V2
  deferredIncomeTaxLiab: V2
  otherLiabilities: V2
  // Owner's Equity
  ownersInvestment: V2
  retainedEarnings: V2
  otherEquity: V2
}

// ─── Cash Flow (2-year comparison) ───────────────────────────────────────────

export interface CashFlowData {
  cashAtBeginning: V2
  cashFromCustomers: V2
  cashFromOtherOperations: V2
  paidInventory: V2
  paidAdminExpenses: V2
  paidWages: V2
  paidInterest: V2
  paidIncomeTaxes: V2
  proceedsFromPropertySales: V2
  principalCollected: V2
  proceedsFromInvestmentSales: V2
  purchaseOfProperty: V2
  loansToOtherEntities: V2
  purchaseOfInvestments: V2
  proceedsFromStockIssuance: V2
  borrowingProceeds: V2
  stockRepurchase: V2
  loanRepayments: V2
  dividendsPaid: V2
}

// ─── Non-Financial KPIs ──────────────────────────────────────────────────────

export interface NonFinancialKPIData {
  // Customer Acquisition
  newCustomersAcquired: number
  activeCustomers: number
  // Customer Retention
  customersAtBeginning: number
  customersAtEnd: number
  // Customer Satisfaction
  complaintsPerPeriod: number
  complaintResolutionDays: number
  // Market Penetration
  marketOutlets: number
  // Innovations
  newProductsLaunched: number
  newSystemsAutomations: number
  rdBudget: number
  // HR & Culture
  staffTurnoverCount: number
  trainingsAndCertifications: number
  employeeEngagements: number
  healthSafetyTrainings: number
  // ESG — Governance
  boardMeetingsFrequency: number
  boardCompositionCount: number
  timelyManagementReports: number
  // ESG — Environmental
  emissionsWasteReduced: number
  accidentsReduced: number
  // ESG — Social
  youthWomenEmpowered: number
  jobsCreated: number
  csrActivities: number
}

// ─── Root form ───────────────────────────────────────────────────────────────

export interface ReportingFormData {
  periodType: PeriodType
  periodStart: string
  periodEnd: string
  incomeStatement: IncomeStatementData
  balanceSheet: BalanceSheetData
  cashFlow: CashFlowData
  nonFinancialKPIs: NonFinancialKPIData
}

// ─── Empty defaults ──────────────────────────────────────────────────────────

export const EMPTY_INCOME_STATEMENT: IncomeStatementData = {
  grossSales: z3(), returnsRefunds: z3(), otherRevenue: z3(),
  goodsPurchased: z3(), materials: z3(), labour: z3(), overhead: z3(),
  advertisingPromotion: z3(), badDebt: z3(), bankServiceCharges: z3(),
  computerInternet: z3(), deliveryFreight: z3(), furnitureEquipment: z3(),
  insurance: z3(), maintenanceRepairs: z3(), mileage: z3(), officeSupplies: z3(),
  otherExpenses: z3(), payrollProcessing: z3(), postageDelivery: z3(),
  professionalServices: z3(), rentLease: z3(), researchDevelopment: z3(),
  salariesBenefitsWages: z3(), travel: z3(), utilitiesTelephone: z3(),
  depreciationAmortization: z3(),
  nonOperatingRevenues: z3(), interestExpense: z3(), incomeTaxExpense: z3(),
  discontinuedOperations: z3(), accountingChanges: z3(), extraordinaryItems: z3(),
}

export const EMPTY_BALANCE_SHEET: BalanceSheetData = {
  cash: z2(), accountsReceivable: z2(), inventory: z2(), prepaidExpenses: z2(), shortTermInvestments: z2(),
  longTermInvestments: z2(), propertyPlantEquipment: z2(), accumulatedDepreciation: z2(), intangibleAssets: z2(),
  deferredIncomeTax: z2(), otherAssets: z2(),
  accountsPayable: z2(), shortTermLoans: z2(), incomeTaxesPayable: z2(),
  accruedSalariesWages: z2(), unearnedRevenue: z2(), currentPortionLTD: z2(),
  longTermDebt: z2(), deferredIncomeTaxLiab: z2(), otherLiabilities: z2(),
  ownersInvestment: z2(), retainedEarnings: z2(), otherEquity: z2(),
}

export const EMPTY_CASH_FLOW: CashFlowData = {
  cashAtBeginning: z2(),
  cashFromCustomers: z2(), cashFromOtherOperations: z2(),
  paidInventory: z2(), paidAdminExpenses: z2(), paidWages: z2(), paidInterest: z2(), paidIncomeTaxes: z2(),
  proceedsFromPropertySales: z2(), principalCollected: z2(), proceedsFromInvestmentSales: z2(),
  purchaseOfProperty: z2(), loansToOtherEntities: z2(), purchaseOfInvestments: z2(),
  proceedsFromStockIssuance: z2(), borrowingProceeds: z2(),
  stockRepurchase: z2(), loanRepayments: z2(), dividendsPaid: z2(),
}

export const EMPTY_NON_FINANCIAL_KPIS: NonFinancialKPIData = {
  newCustomersAcquired: 0, activeCustomers: 0,
  customersAtBeginning: 0, customersAtEnd: 0,
  complaintsPerPeriod: 0, complaintResolutionDays: 0,
  marketOutlets: 0,
  newProductsLaunched: 0, newSystemsAutomations: 0, rdBudget: 0,
  staffTurnoverCount: 0, trainingsAndCertifications: 0, employeeEngagements: 0, healthSafetyTrainings: 0,
  boardMeetingsFrequency: 0, boardCompositionCount: 0, timelyManagementReports: 0,
  emissionsWasteReduced: 0, accidentsReduced: 0,
  youthWomenEmpowered: 0, jobsCreated: 0, csrActivities: 0,
}
