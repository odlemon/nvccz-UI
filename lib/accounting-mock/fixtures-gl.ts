export type AcGlNode = {
  code: string
  name: string
  amount: string
  depth: number
  expandable?: boolean
  expanded?: boolean
  selected?: boolean
  strong?: boolean
}

export const acGlTree: AcGlNode[] = [
  { code: "1", name: "Assets", amount: "$23,045,129.21", depth: 0, expandable: true, expanded: true, strong: true },
  { code: "11", name: "Current Assets", amount: "$7,842,118.07", depth: 1, expandable: true, expanded: true, strong: true },
  { code: "1100", name: "Cash & Cash Equivalents", amount: "$5,912,674.76", depth: 2, expandable: true, expanded: true, strong: true },
  { code: "1100", name: "CBZ USD Operating", amount: "$2,037,243.78", depth: 3, selected: true },
  { code: "1101", name: "CBZ ZiG Operating", amount: "ZiG 3,245,210.00", depth: 3 },
  { code: "1102", name: "Petty Cash – Head Office", amount: "$1,615.80", depth: 3 },
  { code: "1103", name: "CBZ USD Savings", amount: "$632,604.38", depth: 3 },
  { code: "1104", name: "Cash in Transit", amount: "$1,200.00", depth: 3 },
  { code: "12", name: "Trade & Other Receivables", amount: "$1,342,885.15", depth: 1, expandable: true, strong: true },
  { code: "13", name: "Inventory", amount: "$587,412.43", depth: 1, expandable: true, strong: true },
  { code: "14", name: "Prepayments", amount: "$112,145.73", depth: 1, expandable: true, strong: true },
  { code: "2", name: "Liabilities", amount: "$8,517,406.32", depth: 0, expandable: true, strong: true },
  { code: "3", name: "Equity", amount: "$9,864,221.11", depth: 0, expandable: true, strong: true },
  { code: "4", name: "Revenue", amount: "$18,642,337.90", depth: 0, expandable: true, strong: true },
  { code: "5", name: "Expenses", amount: "$13,434,429.80", depth: 0, expandable: true, strong: true },
]

export const acGlAccount = {
  code: "1100",
  name: "CBZ USD Operating",
  status: "Active",
  openingLabel: "Opening balance (01 Jul 2026)",
  opening: "$1,946,220.40",
  closingLabel: "Closing balance (31 Jul 2026)",
  closing: "$2,037,243.78",
  totalDebits: "$482,911.00",
  totalCredits: "$391,887.62",
}

export type AcGlRow = {
  date: string
  ref: string
  account: string
  desc: string
  dept: string
  debit: string
  credit: string
  balance: string
  source: string
  status: "Posted" | "Pending"
  strong?: boolean
}

export const acGlRows: AcGlRow[] = [
  { date: "01 Jul 2026", ref: "Opening Balance", account: "1100", desc: "Opening balance", dept: "—", debit: "—", credit: "—", balance: "1,946,220.40", source: "System", status: "Posted" },
  { date: "02 Jul 2026", ref: "JE-2026-0702-0001", account: "1100", desc: "Inter-company funding – MCP Holdings", dept: "Corporate", debit: "150,000.00", credit: "—", balance: "2,096,220.40", source: "Journal", status: "Posted" },
  { date: "04 Jul 2026", ref: "AP-2026-0187", account: "1100", desc: "Payment – Office supplies – Metrofile Pvt Ltd", dept: "Operations", debit: "—", credit: "2,350.00", balance: "2,093,870.40", source: "AP Payment", status: "Posted" },
  { date: "07 Jul 2026", ref: "JE-2026-0707-0012", account: "1100", desc: "Collections – Sales receipts", dept: "Sales", debit: "28,750.00", credit: "—", balance: "2,122,620.40", source: "Journal", status: "Posted" },
  { date: "10 Jul 2026", ref: "PAY-2026-07-0005", account: "1100", desc: "Payroll run – July 2026", dept: "HR", debit: "—", credit: "35,420.00", balance: "2,087,200.40", source: "Payroll", status: "Posted" },
  { date: "14 Jul 2026", ref: "AP-2026-0225", account: "1100", desc: "Payment – Stationery – Buffalo Office Products", dept: "Operations", debit: "—", credit: "1,875.60", balance: "2,085,324.80", source: "AP Payment", status: "Posted" },
  { date: "16 Jul 2026", ref: "JE-2026-0716-0033", account: "1100", desc: "Bank charges – CBZ USD", dept: "Finance", debit: "—", credit: "12.00", balance: "2,085,312.80", source: "Journal", status: "Posted" },
  { date: "18 Jul 2026", ref: "AR-2026-0143", account: "1100", desc: "Customer payment – Delta Wholesalers", dept: "Sales", debit: "12,900.00", credit: "—", balance: "2,098,212.80", source: "AR Receipt", status: "Posted" },
  { date: "21 Jul 2026", ref: "AP-2026-0267", account: "1100", desc: "Payment – Internet services – Liquid Telecom", dept: "IT", debit: "—", credit: "850.00", balance: "2,097,362.80", source: "AP Payment", status: "Pending" },
  { date: "25 Jul 2026", ref: "JE-2026-0725-0040", account: "1100", desc: "Refund received – Customer overpayment", dept: "Sales", debit: "3,000.00", credit: "—", balance: "2,100,362.80", source: "Journal", status: "Posted" },
  { date: "28 Jul 2026", ref: "AP-2026-0301", account: "1100", desc: "Payment – Utilities – ZESA", dept: "Facilities", debit: "—", credit: "4,120.00", balance: "2,096,242.80", source: "AP Payment", status: "Posted" },
  { date: "29 Jul 2026", ref: "JE-2026-0729-0041", account: "1100", desc: "Inter-account transfer – to CBZ Saving USD", dept: "Finance", debit: "—", credit: "50,000.00", balance: "2,046,242.80", source: "Journal", status: "Posted" },
  { date: "30 Jul 2026", ref: "JE-2026-0730-0042", account: "1100", desc: "Accrued interest received", dept: "Finance", debit: "2,550.00", credit: "—", balance: "2,048,792.80", source: "Journal", status: "Posted" },
  { date: "31 Jul 2026", ref: "BR-2026-0731", account: "1100", desc: "Bank reconciliation – July 2026", dept: "Finance", debit: "—", credit: "11,549.02", balance: "2,037,243.78", source: "Bank Recon", status: "Posted", strong: true },
]

export const acGlTotals = {
  records: "13 records",
  debit: "482,911.00",
  credit: "391,887.62",
  balance: "2,037,243.78",
}

export const acGlAccountDetails = [
  { label: "Bank", value: "CBZ Bank Limited" },
  { label: "Account number", value: "01234567890123" },
  { label: "IBAN", value: "—" },
  { label: "Branch", value: "Corporate Banking" },
  { label: "Notes", value: "Operating account for USD transactions" },
]

export const acGlAudit = [
  { label: "Created", value: "15 Jan 2025 09:14", sub: "by Praise Moyo" },
  { label: "Last updated", value: "31 Jul 2026 16:45", sub: "by Tariro Ncube" },
  { label: "Last reconciled", value: "31 Jul 2026 16:45", sub: "by Tariro Ncube" },
  { label: "Reconciliation ref", value: "BR-2026-0731" },
]
