export type FundOperatingModel = "PRIVATE_CAPITAL" | "OPEN_ENDED"
export type ValuationStatus = "ESTIMATED" | "PROVISIONAL" | "FINAL" | "RESTATED"
export type PortalStatus =
  | ValuationStatus
  | "DRAFT"
  | "ISSUED"
  | "ACKNOWLEDGED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "AWAITING_INVESTOR"
  | "AWAITING_INTERNAL"
  | "RESOLVED"
  | "CLOSED"
  | "PUBLISHED"
  | "RESTATED"
  | "ACTIVE"
  | "REQUIRES_SIGNATURE"
  | "ALLOCATED"
  | "AWAITING_NAV"

export interface LpFund {
  id: string
  publicReference: string
  name: string
  shortName: string
  operatingModel: FundOperatingModel
  currency: "USD" | "GBP" | "ZAR"
  shareClass?: string
  asOfDate: string
  valuationStatus: ValuationStatus
  investorAccountReference: string
}

export interface KpiFixture {
  id: string
  label: string
  value: string
  helper?: string
  change?: string
  tone?: "default" | "positive" | "warning" | "critical"
}

export interface CapitalCallFixture {
  reference: string
  fundId: string
  issueDate: string
  dueDate: string
  amount: number
  paid: number
  outstanding: number
  currency: string
  status: PortalStatus
  acknowledgedAt?: string
  documentName: string
  bankDestination: string
}

export interface DistributionFixture {
  reference: string
  fundId: string
  date: string
  type: string
  gross: number
  adjustments: number
  netPaid: number
  currency: string
  status: PortalStatus
  documentName: string
  bankDestination: string
}

export interface DealingRequestFixture {
  reference: string
  fundId: string
  type: "SUBSCRIPTION" | "REDEMPTION"
  shareClass: string
  amount: number
  units?: number
  currency: string
  submittedOn: string
  expectedSettlement: string
  status: PortalStatus
}

export interface ActivityFixture {
  id: string
  transactionDate: string
  effectiveDate: string
  fundId: string
  type: string
  reference: string
  originalCurrency: string
  originalAmount: number
  reportingCurrency: string
  reportingAmount: number
  exchangeRate: number
  status: PortalStatus
  documentName?: string
}

export interface DocumentFixture {
  id: string
  name: string
  fundId: string
  category: string
  period: string
  publishedDate: string
  version: string
  accessScope: string
  status: PortalStatus
  fileSize: string
  checksum: string
  downloadCount: number
}

export interface RequestFixture {
  reference: string
  type: string
  fundId?: string
  subject: string
  submittedBy: string
  submittedOn: string
  lastUpdated: string
  status: PortalStatus
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT"
}

export interface MessageFixture {
  id: string
  threadReference: string
  subject: string
  linkedRecord: string
  sender: string
  sentAt: string
  body: string
  unread: boolean
  attachments: string[]
}

export interface NoticeFixture {
  id: string
  title: string
  fundId?: string
  publishedAt: string
  requiresAcknowledgement: boolean
  acknowledged: boolean
  unread: boolean
}

export interface OrganisationUserFixture {
  id: string
  name: string
  email: string
  role: "Investor Admin" | "Viewer" | "Signatory"
  fundIds: string[]
  mfaEnabled: boolean
  status: "ACTIVE" | "SUSPENDED" | "INVITED"
}

export interface PerformancePointFixture {
  date: string
  fundId: string
  nav: number
  paidIn?: number
  distributions?: number
  navPerUnit?: number
  investorReturn?: number
}

export const lpFunds: LpFund[] = [
  {
    id: "growth-fund-i",
    publicReference: "FND-AGFI",
    name: "Arcus Growth Fund I",
    shortName: "Growth Fund I",
    operatingModel: "PRIVATE_CAPITAL",
    currency: "USD",
    asOfDate: "2026-06-30",
    valuationStatus: "FINAL",
    investorAccountReference: "INV-AGFI-1042",
  },
  {
    id: "equity-opportunities",
    publicReference: "FND-AEOF",
    name: "Arcus Equity Opportunities Fund",
    shortName: "Equity Opportunities",
    operatingModel: "OPEN_ENDED",
    currency: "USD",
    shareClass: "Class A USD",
    asOfDate: "2026-06-30",
    valuationStatus: "FINAL",
    investorAccountReference: "INV-AEOF-2218",
  },
]

export const privateCapitalKpis: KpiFixture[] = [
  { id: "commitment", label: "Total Commitment", value: "US$5,000,000" },
  { id: "paid-in", label: "Paid-In Capital", value: "US$3,750,000" },
  { id: "unfunded", label: "Unfunded Commitment", value: "US$1,100,000", helper: "Commitment less called capital" },
  { id: "distributions", label: "Total Distributions", value: "US$1,820,000", tone: "positive" },
  { id: "nav", label: "Current NAV", value: "US$4,420,000", helper: "Final · 30 Jun 2026" },
  { id: "irr", label: "Net IRR", value: "18.4%", change: "+1.2% vs prior quarter", tone: "positive" },
  { id: "tvpi", label: "TVPI", value: "1.66x" },
  { id: "dpi", label: "DPI", value: "0.49x" },
  { id: "rvpi", label: "RVPI", value: "1.18x" },
]

export const openEndedKpis: KpiFixture[] = [
  { id: "account-value", label: "Account Value", value: "US$2,845,390", helper: "Final · 30 Jun 2026" },
  { id: "units", label: "Units Held", value: "184,233.4821" },
  { id: "nav-per-unit", label: "NAV Per Unit", value: "US$15.4448" },
  { id: "ytd-return", label: "YTD Return", value: "+12.82%", tone: "positive" },
  { id: "subscriptions", label: "Net Subscriptions", value: "US$2,150,000" },
  { id: "redemptions", label: "Redemptions", value: "US$350,000" },
]

export const capitalCalls: CapitalCallFixture[] = [
  { reference: "CC-013", fundId: "growth-fund-i", issueDate: "2026-07-01", dueDate: "2026-07-20", amount: 150000, paid: 0, outstanding: 150000, currency: "USD", status: "ISSUED", documentName: "CC-013 Capital Call Notice.pdf", bankDestination: "•••• 4812" },
  { reference: "CC-012", fundId: "growth-fund-i", issueDate: "2026-06-01", dueDate: "2026-06-20", amount: 250000, paid: 250000, outstanding: 0, currency: "USD", status: "PAID", acknowledgedAt: "2026-06-04", documentName: "CC-012 Capital Call Notice.pdf", bankDestination: "•••• 4812" },
  { reference: "CC-011", fundId: "growth-fund-i", issueDate: "2026-02-01", dueDate: "2026-02-15", amount: 500000, paid: 500000, outstanding: 0, currency: "USD", status: "PAID", acknowledgedAt: "2026-02-03", documentName: "CC-011 Capital Call Notice.pdf", bankDestination: "•••• 4812" },
]

export const distributions: DistributionFixture[] = [
  { reference: "DIST-008", fundId: "growth-fund-i", date: "2026-03-20", type: "Exit Proceeds", gross: 500000, adjustments: 10000, netPaid: 490000, currency: "USD", status: "PAID", documentName: "DIST-008 Statement.pdf", bankDestination: "•••• 7719" },
  { reference: "DIST-007", fundId: "growth-fund-i", date: "2025-12-12", type: "Dividend", gross: 180000, adjustments: 3600, netPaid: 176400, currency: "USD", status: "PAID", documentName: "DIST-007 Statement.pdf", bankDestination: "•••• 7719" },
]

export const dealingRequests: DealingRequestFixture[] = [
  { reference: "SUB-024", fundId: "equity-opportunities", type: "SUBSCRIPTION", shareClass: "Class A USD", amount: 500000, units: 32935.9432, currency: "USD", submittedOn: "2026-05-22", expectedSettlement: "2026-06-03", status: "ALLOCATED" },
  { reference: "RDM-016", fundId: "equity-opportunities", type: "REDEMPTION", shareClass: "Class A USD", amount: 250000, units: 16186.7702, currency: "USD", submittedOn: "2026-07-08", expectedSettlement: "2026-08-05", status: "UNDER_REVIEW" },
]

export const accountActivity: ActivityFixture[] = [
  { id: "txn-1007", transactionDate: "2026-07-08", effectiveDate: "2026-08-03", fundId: "equity-opportunities", type: "Redemption Request", reference: "RDM-016", originalCurrency: "USD", originalAmount: -250000, reportingCurrency: "USD", reportingAmount: -250000, exchangeRate: 1, status: "UNDER_REVIEW" },
  { id: "txn-1006", transactionDate: "2026-07-01", effectiveDate: "2026-07-01", fundId: "growth-fund-i", type: "Capital Call", reference: "CC-013", originalCurrency: "USD", originalAmount: 150000, reportingCurrency: "USD", reportingAmount: 150000, exchangeRate: 1, status: "ISSUED", documentName: "CC-013 Capital Call Notice.pdf" },
  { id: "txn-1005", transactionDate: "2026-05-22", effectiveDate: "2026-06-01", fundId: "equity-opportunities", type: "Subscription", reference: "SUB-024", originalCurrency: "USD", originalAmount: 500000, reportingCurrency: "USD", reportingAmount: 500000, exchangeRate: 1, status: "ALLOCATED", documentName: "SUB-024 Confirmation.pdf" },
  { id: "txn-1004", transactionDate: "2026-03-20", effectiveDate: "2026-03-20", fundId: "growth-fund-i", type: "Distribution", reference: "DIST-008", originalCurrency: "USD", originalAmount: -490000, reportingCurrency: "USD", reportingAmount: -490000, exchangeRate: 1, status: "PAID", documentName: "DIST-008 Statement.pdf" },
]

export const portalDocuments: DocumentFixture[] = [
  { id: "doc-101", name: "Q2 2026 Investor Report", fundId: "growth-fund-i", category: "Fund Reports", period: "Q2 2026", publishedDate: "2026-07-10", version: "1.0", accessScope: "Investor organisation", status: "PUBLISHED", fileSize: "4.8 MB", checksum: "9b28c40e…b5a3d124", downloadCount: 2 },
  { id: "doc-102", name: "June 2026 Investor Statement", fundId: "equity-opportunities", category: "Statements", period: "Jun 2026", publishedDate: "2026-07-05", version: "1.0", accessScope: "Investor account", status: "PUBLISHED", fileSize: "1.2 MB", checksum: "2ac18d11…70f214bc", downloadCount: 1 },
  { id: "doc-103", name: "CC-013 Capital Call Notice", fundId: "growth-fund-i", category: "Capital Calls", period: "Jul 2026", publishedDate: "2026-07-01", version: "1.0", accessScope: "Investor account", status: "REQUIRES_SIGNATURE", fileSize: "820 KB", checksum: "f402aa9c…0109f22a", downloadCount: 3 },
  { id: "doc-104", name: "2025 Audited Financial Statements", fundId: "growth-fund-i", category: "Financial Statements", period: "FY 2025", publishedDate: "2026-04-18", version: "2.0", accessScope: "Fund investors", status: "RESTATED", fileSize: "7.6 MB", checksum: "a811d510…8f39ab06", downloadCount: 4 },
]

export const portalRequests: RequestFixture[] = [
  { reference: "REQ-1082", type: "Capital Activity", fundId: "growth-fund-i", subject: "Confirm payment reference for CC-013", submittedBy: "Jane Smith", submittedOn: "2026-07-12", lastUpdated: "2026-07-16", status: "AWAITING_INVESTOR", priority: "HIGH" },
  { reference: "REQ-1074", type: "Account / Statement", fundId: "equity-opportunities", subject: "June statement reconciliation", submittedBy: "Jane Smith", submittedOn: "2026-07-07", lastUpdated: "2026-07-15", status: "UNDER_REVIEW", priority: "NORMAL" },
  { reference: "REQ-1031", type: "Profile / Access", subject: "Add finance colleague", submittedBy: "Jane Smith", submittedOn: "2026-05-14", lastUpdated: "2026-05-19", status: "CLOSED", priority: "NORMAL" },
]

export const portalMessages: MessageFixture[] = [
  { id: "msg-201", threadReference: "REQ-1082", subject: "Capital Call #13 – Payment reference", linkedRecord: "CC-013", sender: "Arcus Fund Operations", sentAt: "2026-07-16T14:10:00Z", body: "Please confirm the remittance reference that will accompany your payment.", unread: true, attachments: [] },
  { id: "msg-202", threadReference: "REQ-1074", subject: "June statement reconciliation", linkedRecord: "June 2026 Statement", sender: "Miriam Dube", sentAt: "2026-07-15T09:42:00Z", body: "We have attached the transaction-level reconciliation requested.", unread: true, attachments: ["June-Reconciliation.xlsx"] },
  { id: "msg-203", threadReference: "REQ-1074", subject: "June statement reconciliation", linkedRecord: "June 2026 Statement", sender: "Jane Smith", sentAt: "2026-07-14T15:22:00Z", body: "Thank you. Please include the NAV approval date.", unread: false, attachments: [] },
]

export const portalNotices: NoticeFixture[] = [
  { id: "notice-31", title: "Q2 2026 investor report is available", fundId: "growth-fund-i", publishedAt: "2026-07-10", requiresAcknowledgement: false, acknowledged: false, unread: true },
  { id: "notice-30", title: "Capital Call CC-013 issued", fundId: "growth-fund-i", publishedAt: "2026-07-01", requiresAcknowledgement: true, acknowledged: false, unread: true },
  { id: "notice-29", title: "June NAV finalised", fundId: "equity-opportunities", publishedAt: "2026-07-05", requiresAcknowledgement: false, acknowledged: true, unread: false },
]

export const organisationUsers: OrganisationUserFixture[] = [
  { id: "usr-1", name: "Jane Smith", email: "jane.smith@arcuscapital.example", role: "Investor Admin", fundIds: ["growth-fund-i", "equity-opportunities"], mfaEnabled: true, status: "ACTIVE" },
  { id: "usr-2", name: "Tawanda Moyo", email: "tawanda.moyo@arcuscapital.example", role: "Signatory", fundIds: ["growth-fund-i"], mfaEnabled: true, status: "ACTIVE" },
  { id: "usr-3", name: "Rudo Maposa", email: "rudo.maposa@arcuscapital.example", role: "Viewer", fundIds: ["growth-fund-i", "equity-opportunities"], mfaEnabled: true, status: "ACTIVE" },
]

export const performanceHistory: PerformancePointFixture[] = [
  { date: "2025-06-30", fundId: "growth-fund-i", nav: 3610000, paidIn: 3250000, distributions: 1140000 },
  { date: "2025-12-31", fundId: "growth-fund-i", nav: 3980000, paidIn: 3250000, distributions: 1316400 },
  { date: "2026-03-31", fundId: "growth-fund-i", nav: 4210000, paidIn: 3750000, distributions: 1806400 },
  { date: "2026-06-30", fundId: "growth-fund-i", nav: 4420000, paidIn: 3750000, distributions: 1820000 },
  { date: "2025-06-30", fundId: "equity-opportunities", nav: 2280000, navPerUnit: 13.2014, investorReturn: 0.041 },
  { date: "2025-12-31", fundId: "equity-opportunities", nav: 2520000, navPerUnit: 13.6899, investorReturn: 0.079 },
  { date: "2026-03-31", fundId: "equity-opportunities", nav: 2675000, navPerUnit: 14.5197, investorReturn: 0.086 },
  { date: "2026-06-30", fundId: "equity-opportunities", nav: 2845390, navPerUnit: 15.4448, investorReturn: 0.1282 },
]

export const lpPortalUnreadCounts = {
  requests: 3,
  messages: portalMessages.filter((message) => message.unread).length,
  notices: 5,
  notifications: 6,
}

export const lpPortalOrganisation = {
  name: "Arcus Capital Partners LP",
  reportingCurrency: "USD",
  userName: "Jane Smith",
  role: "Investor Administrator",
}
