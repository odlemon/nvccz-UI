export const acReconTitle = {
  account: "CBZ USD Operating",
  date: "31 Jul 2026",
}

export const acReconSteps = [
  { step: 1, label: "Import statement", state: "done" as const },
  { step: 2, label: "Auto-match", state: "done" as const },
  { step: 3, label: "Resolve exceptions", state: "current" as const },
  { step: 4, label: "Review", state: "todo" as const },
  { step: 5, label: "Sign off", state: "todo" as const },
]

export const acReconKpis = [
  { label: "Statement balance", value: "$2,037,243.78", tone: "neutral" as const },
  { label: "Ledger balance", value: "$2,025,403.78", tone: "neutral" as const },
  { label: "Difference", value: "$11,840.00", tone: "exception" as const },
  { label: "Statement lines", value: "184", tone: "neutral" as const },
  { label: "Matched", value: "92%", tone: "posted" as const },
  { label: "Exceptions", value: "11", tone: "exception" as const },
]

export type AcReconStatementLine = {
  date: string
  narrative: string
  amount: string
  ref: string
  status: "Matched" | "Unmatched"
}

export const acReconStatementLines: AcReconStatementLine[] = [
  { date: "31 Jul 2026", narrative: "OPENING BALANCE", amount: "2,000,000.00", ref: "—", status: "Matched" },
  { date: "31 Jul 2026", narrative: "Interest Credit", amount: "2,145.67", ref: "INT/0726", status: "Matched" },
  { date: "28 Jul 2026", narrative: "Fees - Swift", amount: "-25.00", ref: "FEE0728", status: "Matched" },
  { date: "24 Jul 2026", narrative: "Payment - Delta Beverages", amount: "-152,300.00", ref: "DD00424", status: "Matched" },
  { date: "20 Jul 2026", narrative: "ZESA Prepayment", amount: "-18,450.00", ref: "ZESA0720", status: "Matched" },
  { date: "15 Jul 2026", narrative: "RTGS 0049281 ZIMRA", amount: "-38,420.00", ref: "RTGS0049281", status: "Unmatched" },
  { date: "14 Jul 2026", narrative: "Deposit - ABC Pvt Ltd", amount: "120,000.00", ref: "DEP0714", status: "Matched" },
  { date: "13 Jul 2026", narrative: "Bank Charge", amount: "-12.00", ref: "BC0713", status: "Matched" },
  { date: "10 Jul 2026", narrative: "Payment - OK Zimbabwe", amount: "-84,750.00", ref: "DD00410", status: "Matched" },
  { date: "08 Jul 2026", narrative: "NMB Transfer Fee", amount: "-7.50", ref: "FEE0708", status: "Matched" },
]

export const acReconStatementPager = {
  summary: "Showing 1 to 10 of 184 entries",
  pages: ["1", "2", "3", "4", "5", "…", "19"],
}

export type AcReconMatch = {
  confidence: number
  date: string
  desc: string
  amount: string
  ref: string
}

export const acReconMatches: AcReconMatch[] = [
  { confidence: 96, date: "15 Jul 2026", desc: "ZIMRA - PAYE/Withholding Tax July 2026", amount: "-38,420.00", ref: "JRN0726-1542" },
  { confidence: 82, date: "15 Jul 2026", desc: "Taxes - PAYE Payable", amount: "-38,420.00", ref: "JRN0726-1511" },
  { confidence: 61, date: "15 Jul 2026", desc: "Tax Payment - ZIMRA", amount: "-38,420.00", ref: "JRN0726-1477" },
]

export const acReconMatchDetails = {
  statementLine: "15 Jul 2026 · RTGS 0049281 ZIMRA",
  statementAmount: "-38,420.00 USD",
  ledgerLine: "ZIMRA - PAYE/Withholding Tax July 2026 (JRN0726-1542)",
  ledgerAmount: "-38,420.00 USD",
  variance: "0.00 (0.00%)",
  rule: "Exact amount, date within 1 day",
}

export const acReconException = {
  status: "Unmatched",
  reason: "Reference mismatch",
  statementLine: "15 Jul 2026 · RTGS 0049281 ZIMRA",
  statementAmount: "-38,420.00 USD",
  ledgerLine: "ZIMRA - PAYE/Withholding Tax July 2026 (JRN0726-1542)",
  ledgerAmount: "-38,420.00 USD",
  owner: "Rudo Chikore",
  priority: "Medium",
  comment:
    "ZIMRA payment captured in bulk journal without RTGS reference. Please match and update reference.",
  commentCount: "127 / 500",
  evidence: "RTGS_0049281_ZIMRA_15Jul2026.pdf",
  evidenceSize: "268 KB",
}

export const acReconOwnerOptions = ["Rudo Chikore", "Tariro Ncube", "Tendai Musarurwa"]
export const acReconPriorityOptions = ["Low", "Medium", "High"]

export const acReconSummaryBar = {
  matched: "$3,842,118.16",
  unmatched: "$27,560.00",
  difference: "$11,840.00",
  lastAutoMatch: "31 Jul 2026 09:42 by Tendai Musarurwa",
}

export const acReconRules = [
  { id: 1, name: "Exact reference match", conditions: "Reference must match exactly", action: "Auto-match", exceptions: "0" },
  { id: 2, name: "Amount & date tolerance", conditions: "Amount variance ≤ $50.00 and date within ±2 days", action: "Auto-match", exceptions: "2" },
  { id: 3, name: "Bank charges rule", conditions: "Narrative contains \"bank charge\" or \"fees\" and amount ≤ $150.00", action: "Auto-match", exceptions: "1" },
]
