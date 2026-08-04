export const acTaxBreadcrumb = ["Financial Reports", "Tax", "VAT", "July 2026"]

export const acTaxHeader = {
  title: "Tax Return Pack",
  meta: "· VAT · July 2026",
}

export type AcTaxMetaItem = {
  label: string
  value: string
  tone?: "cobalt" | "pending"
  /** Rendered without the leading vertical divider (grouped with the previous item). */
  grouped?: boolean
}

export const acTaxMeta: AcTaxMetaItem[] = [
  { label: "Entity", value: "Mukuru Capital Partners (Pvt) Ltd" },
  { label: "Tax period", value: "01 Jul 2026 – 31 Jul 2026" },
  { label: "Due date", value: "25 Aug 2026", tone: "cobalt" },
  { label: "Status", value: "Review required", tone: "pending", grouped: true },
  { label: "Pack reference", value: "VAT-2026-07-001" },
  { label: "Last updated", value: "18 Jul 2026 09:14" },
  { label: "Updated by", value: "Tariro Ncube" },
]

export const acTaxTabs = ["VAT", "PAYE/P2", "Withholding Tax", "Income Tax", "Transfer Pricing"]

export type AcTaxStep = {
  n: number
  label: string
  state: "complete" | "current" | "pending"
}

export const acTaxSteps: AcTaxStep[] = [
  { n: 1, label: "Compile source data", state: "complete" },
  { n: 2, label: "Reconcile", state: "complete" },
  { n: 3, label: "Resolve exceptions", state: "current" },
  { n: 4, label: "Review", state: "pending" },
  { n: 5, label: "File", state: "pending" },
]

export const acTaxStats = [
  { label: "Output VAT", value: "$76,420.00" },
  { label: "Input VAT", value: "$38,000.00" },
  { label: "Imports VAT", value: "$1,250.00" },
  { label: "Adjustments", value: "$0.00" },
  { label: "Net payable", value: "$38,420.00", tone: "cobalt" as const },
]

export const acTaxCoverage = {
  label: "Source coverage",
  value: "98%",
  sub: "(412 of 420 txns)",
}

export type AcTaxRow = {
  id: string
  section: string
  child?: boolean
  ledger: string
  box: string
  txns: string
  glAmount: string
  taxAmount: string
  difference: string
  evidence: string
  status: "Reconciled" | "Exception"
}

export const acTaxRows: AcTaxRow[] = [
  { id: "sales-vat", section: "Sales VAT (Output VAT)", ledger: "Sales Ledger", box: "Box 1", txns: "212", glAmount: "$382,100.00", taxAmount: "$76,420.00", difference: "$0.00", evidence: "104 docs", status: "Reconciled" },
  { id: "std-supplies", section: "Standard-rated supplies", child: true, ledger: "Sales Ledger", box: "Box 1a", txns: "186", glAmount: "$378,200.00", taxAmount: "$75,640.00", difference: "$0.00", evidence: "98 docs", status: "Reconciled" },
  { id: "zero-supplies", section: "Zero-rated supplies", child: true, ledger: "Sales Ledger", box: "Box 1b", txns: "26", glAmount: "$0.00", taxAmount: "$0.00", difference: "$0.00", evidence: "6 docs", status: "Reconciled" },
  { id: "input-vat", section: "Purchases / Input VAT", ledger: "Purchases Ledger", box: "Box 4", txns: "168", glAmount: "$190,000.00", taxAmount: "$38,000.00", difference: "$0.00", evidence: "82 docs", status: "Reconciled" },
  { id: "std-purchases", section: "Standard-rated purchases", child: true, ledger: "Purchases Ledger", box: "Box 4a", txns: "134", glAmount: "$182,200.00", taxAmount: "$36,400.00", difference: "$0.00", evidence: "72 docs", status: "Reconciled" },
  { id: "missing-invoices", section: "Missing supplier tax invoices", child: true, ledger: "Purchases Ledger", box: "Box 4a", txns: "6", glAmount: "$9,200.00", taxAmount: "$1,840.00", difference: "$1,840.00", evidence: "0 docs", status: "Exception" },
  { id: "capital-goods", section: "Capital goods", child: true, ledger: "Purchases Ledger", box: "Box 4b", txns: "18", glAmount: "$7,000.00", taxAmount: "$1,440.00", difference: "$0.00", evidence: "10 docs", status: "Reconciled" },
  { id: "imports", section: "Imports", ledger: "Imports Ledger", box: "Box 5", txns: "12", glAmount: "$6,250.00", taxAmount: "$1,250.00", difference: "$0.00", evidence: "12 docs", status: "Reconciled" },
  { id: "customs", section: "Customs & clearance", child: true, ledger: "Imports Ledger", box: "Box 5a", txns: "12", glAmount: "$6,250.00", taxAmount: "$1,250.00", difference: "$0.00", evidence: "12 docs", status: "Reconciled" },
  { id: "credit-notes", section: "Credit notes", ledger: "Sales Ledger", box: "Box 11", txns: "8", glAmount: "-$4,800.00", taxAmount: "-$960.00", difference: "$0.00", evidence: "8 docs", status: "Reconciled" },
  { id: "adjustments", section: "Adjustments", ledger: "General Ledger", box: "Box 12", txns: "0", glAmount: "$0.00", taxAmount: "$0.00", difference: "$0.00", evidence: "0 docs", status: "Reconciled" },
  { id: "tax-code-mismatch", section: "Tax code mismatch", child: true, ledger: "General Ledger", box: "Box 12", txns: "1", glAmount: "$0.00", taxAmount: "$420.00", difference: "$420.00", evidence: "0 docs", status: "Exception" },
]

export const acTaxTotals = {
  txns: "400",
  glAmount: "$573,550.00",
  taxAmount: "$114,130.00",
  difference: "$2,260.00",
  evidence: "206 docs",
}

export const acTaxLegend = [
  { label: "Reconciled", tone: "cobalt" as const },
  { label: "Exception", tone: "exception" as const },
  { label: "Not applicable", tone: "faint" as const },
]

export const acTaxRefreshedAt = "18 Jul 2026 09:14"

export const acTaxException = {
  counter: "Exception 1 of 2",
  title: "Missing supplier tax invoices",
  sub: "Purchases / Input VAT  ·  Box 4a",
  amountLabel: "Amount",
  amount: "$1,840.00",
}

export const acTaxExceptionDetails = [
  { label: "Invoice", value: "AP-2026-0187" },
  { label: "Supplier", value: "ZimTech Solutions (Pvt) Ltd" },
  { label: "Invoice date", value: "12 Jul 2026" },
  { label: "GL date", value: "12 Jul 2026" },
  { label: "Ledger", value: "Purchases Ledger" },
  { label: "GL account", value: "5000 – Cost of Sales" },
]

export const acTaxExceptionAmounts = [
  { label: "Amount (USD)", value: "$9,200.00" },
  { label: "Tax code", value: "TxStd – Standard-rated" },
  { label: "Expected VAT", value: "$1,840.00" },
  { label: "Captured VAT", value: "$0.00", tone: "exception" as const },
]

export const acTaxEvidence = {
  meta: "0 of 2 uploaded",
  docs: [
    { label: "Supplier tax invoice (required)", value: "—" },
    { label: "GRN / Receiving note (required)", value: "—" },
  ],
}

export const acTaxCorrection = {
  note: "Post to claim input VAT once valid tax invoice is obtained.",
  lines: [
    { account: "1420", name: "Input VAT – Standard Rated", debit: "$1,840.00", credit: "—" },
    { account: "5000", name: "Cost of Sales", debit: "—", credit: "$1,840.00" },
  ],
}

export const acTaxAssignment = {
  assignee: "Tariro Ncube",
  assignees: ["Tariro Ncube", "Rudo Chikore", "Farai Moyo"],
  dueDate: "21 Jul 2026",
  priority: "Medium",
}

export const acTaxReviewChain = [
  { name: "Rudo Chikore", role: "Reviewer", date: "22 Jul 2026", status: "Pending" },
  { name: "Farai Moyo", role: "Approver", date: "24 Jul 2026", status: "Pending" },
]

export const acTaxVersions = [
  { version: "v1.0", action: "Compiled", at: "18 Jul 2026 08:35", by: "Tariro Ncube", current: true },
  { version: "v0.2", action: "Reconciled", at: "17 Jul 2026 16:22", by: "Tariro Ncube" },
  { version: "v0.1", action: "Compiled", at: "17 Jul 2026 15:10", by: "Tariro Ncube" },
]

export const acTaxFilingHistory = "No submissions yet."
