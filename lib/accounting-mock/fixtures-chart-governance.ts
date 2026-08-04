export const acCgHeader = {
  version: "FY2026 v4",
  versionOptions: ["FY2026 v4", "FY2026 v3", "FY2025 v12"],
  effectiveDate: "01 Aug 2026",
  status: "Draft changes",
}

export type AcCgTreeNode = {
  code: string
  name: string
  count: number
  depth: number
  expandable?: boolean
  expanded?: boolean
  selected?: boolean
}

export const acCgTree: AcCgTreeNode[] = [
  { code: "1", name: "Assets", count: 172, depth: 0, expandable: true },
  { code: "2", name: "Liabilities", count: 96, depth: 0, expandable: true },
  { code: "3", name: "Equity", count: 18, depth: 0, expandable: true },
  { code: "4", name: "Revenue", count: 46, depth: 0, expandable: true },
  { code: "5", name: "Cost of Sales", count: 28, depth: 0, expandable: true },
  { code: "6", name: "Expenses", count: 112, depth: 0, expandable: true, expanded: true },
  { code: "6100", name: "Administrative Expenses", count: 24, depth: 1, expandable: true },
  { code: "6200", name: "Operating Expenses", count: 18, depth: 1, expandable: true, expanded: true },
  { code: "6200-000", name: "Operating Expenses (Suspense)", count: 0, depth: 2 },
  { code: "6200-010", name: "Professional Fees Expense", count: 0, depth: 2, selected: true },
  { code: "6200-020", name: "Consulting Fees Expense", count: 0, depth: 2 },
  { code: "6200-030", name: "Legal Fees Expense", count: 0, depth: 2 },
  { code: "6200-040", name: "Audit Fees Expense", count: 0, depth: 2 },
  { code: "7", name: "Other Income", count: 12, depth: 0, expandable: true },
  { code: "8", name: "Other Expenses", count: 9, depth: 0, expandable: true },
]

export type AcCgAccountRow = {
  code: string
  name: string
  type: string
  currRule: string
  taxRule: string
  reconcReq: string
  postingAllowed: string
  parent: string
  status: string
}

export const acCgAccounts: AcCgAccountRow[] = [
  { code: "6200-000", name: "Operating Expenses (Suspense)", type: "Posting", currRule: "USD & ZiG", taxRule: "Standard VAT", reconcReq: "Yes", postingAllowed: "Yes", parent: "6200", status: "Active" },
  { code: "6200-010", name: "Professional Fees Expense", type: "Posting", currRule: "USD & ZiG", taxRule: "WHT Services 10%", reconcReq: "Yes", postingAllowed: "Yes", parent: "6200", status: "Active" },
  { code: "6200-020", name: "Consulting Fees Expense", type: "Posting", currRule: "USD & ZiG", taxRule: "WHT Services 10%", reconcReq: "Yes", postingAllowed: "Yes", parent: "6200", status: "Active" },
  { code: "6200-030", name: "Legal Fees Expense", type: "Posting", currRule: "USD & ZiG", taxRule: "WHT Services 10%", reconcReq: "Yes", postingAllowed: "Yes", parent: "6200", status: "Active" },
  { code: "6200-040", name: "Audit Fees Expense", type: "Posting", currRule: "USD & ZiG", taxRule: "WHT Services 10%", reconcReq: "Yes", postingAllowed: "Yes", parent: "6200", status: "Active" },
  { code: "6200-050", name: "Bank Charges Expense", type: "Posting", currRule: "USD & ZiG", taxRule: "Standard VAT", reconcReq: "Yes", postingAllowed: "Yes", parent: "6200", status: "Active" },
  { code: "6200-060", name: "Courier & Postage Expense", type: "Posting", currRule: "USD & ZiG", taxRule: "Standard VAT", reconcReq: "No", postingAllowed: "Yes", parent: "6200", status: "Active" },
  { code: "6200-070", name: "Printing & Stationery Expense", type: "Posting", currRule: "USD & ZiG", taxRule: "Standard VAT", reconcReq: "No", postingAllowed: "Yes", parent: "6200", status: "Active" },
  { code: "6200-080", name: "Travel & Accommodation Expense", type: "Posting", currRule: "USD & ZiG", taxRule: "Standard VAT", reconcReq: "Yes", postingAllowed: "Yes", parent: "6200", status: "Active" },
  { code: "6200-090", name: "Meals & Entertainment Expense", type: "Posting", currRule: "USD & ZiG", taxRule: "Standard VAT", reconcReq: "Yes", postingAllowed: "Yes", parent: "6200", status: "Active" },
]

export const acCgAccountDetail = {
  code: "6200-010",
  name: "Professional Fees Expense",
  accountName: "Professional Fees Expense",
  reportingGroup: "Operating Expenses",
  type: "Posting",
  normalBalance: "Debit",
  currencies: ["USD", "ZiG"],
  taxRule: "WHT Services 10%",
  departmentRequired: "Optional",
  projectRequired: "Optional",
  reconciliationOwner: "Rudo Chikore",
  effectiveDate: "01 Aug 2026",
  governanceChecks: [
    "Code format is valid (4-4-3)",
    "Unique code",
    "Parent account is active",
    "Currency rule valid",
    "Tax rule valid",
    "User permissions validated",
  ],
  recurringJournals: [
    { ref: "PAY-0007", desc: "Supplier payments" },
    { ref: "JRN-0215", desc: "Monthly accruals" },
    { ref: "JRN-0248", desc: "Professional fees accrual" },
  ],
  impactPreview: [
    { area: "P&L statement", impact: "Operating Expenses will increase" },
    { area: "Tax schedule", impact: "Affects WHT Services 10% schedule" },
    { area: "Budget model", impact: "Linked to FY2026 Operating Budget" },
  ],
}

export const acCgChangeSummary = {
  additions: 6,
  edits: 3,
  deactivations: 1,
  preparedBy: { initials: "TN", name: "Tariro Ncube", date: "18 Jul 2026 10:32" },
  reviewer: { initials: "FM", name: "Farai Moyo", status: "—" },
}

export type AcCgChangeRow = {
  num: number
  changeType: string
  accountCode: string
  accountName: string
  field: string
  oldValue: string
  newValue: string
  reason: string
  auditNote: string
  tone?: "deactivation"
}

export const acCgChanges: AcCgChangeRow[] = [
  { num: 1, changeType: "Addition", accountCode: "6200-100", accountName: "IT Support Expense", field: "—", oldValue: "—", newValue: "New account", reason: "New expense category for IT support costs.", auditNote: "Created for new vendor requirements." },
  { num: 2, changeType: "Addition", accountCode: "6200-110", accountName: "Subscriptions Expense", field: "—", oldValue: "—", newValue: "New account", reason: "Track subscription-based services.", auditNote: "Created for reporting accuracy." },
  { num: 3, changeType: "Addition", accountCode: "6200-120", accountName: "Training & Development Expense", field: "—", oldValue: "—", newValue: "New account", reason: "Capture staff training expenses.", auditNote: "Support talent development tracking." },
  { num: 4, changeType: "Addition", accountCode: "6200-130", accountName: "Repairs & Maintenance Expense", field: "—", oldValue: "—", newValue: "New account", reason: "Separate repairs & maintenance costs.", auditNote: "Improves cost visibility." },
  { num: 5, changeType: "Addition", accountCode: "6200-140", accountName: "Telephone & Internet Expense", field: "—", oldValue: "—", newValue: "New account", reason: "New account for telecom costs.", auditNote: "Operational reporting enhancement." },
  { num: 6, changeType: "Addition", accountCode: "6200-150", accountName: "Software Licences Expense", field: "—", oldValue: "—", newValue: "New account", reason: "Track software licence costs.", auditNote: "Compliance and audit readiness." },
  { num: 7, changeType: "Edit", accountCode: "6200-050", accountName: "Bank Charges Expense", field: "Tax rule", oldValue: "Standard VAT", newValue: "WHT Services 10%", reason: "Align with withholding tax policy.", auditNote: "Per tax policy update 15 Jul 2026." },
  { num: 8, changeType: "Edit", accountCode: "6200-060", accountName: "Courier & Postage Expense", field: "Reconciliation required", oldValue: "No", newValue: "Yes", reason: "Improve control over courier postings.", auditNote: "Control improvement initiative." },
  { num: 9, changeType: "Edit", accountCode: "6200-080", accountName: "Travel & Accommodation Expense", field: "Project required", oldValue: "Optional", newValue: "Required", reason: "Require project for travel charges.", auditNote: "Enhance project costing accuracy." },
  { num: 10, changeType: "Deactivation", accountCode: "4200-070", accountName: "Old Consulting Fees", field: "Status", oldValue: "Active", newValue: "Inactive", reason: "Duplicate account. Merged into 6200-020.", auditNote: "Consolidation of duplicate accounts.", tone: "deactivation" },
]
