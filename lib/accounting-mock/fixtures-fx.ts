export const acFxHeader = {
  title: "Foreign Exchange Revaluation",
  meta: "· July 2026",
  subtitle: "Revalue foreign-currency monetary items to approved closing rates",
}

export const acFxFilters = {
  entity: "Mukuru Capital Partners (Pvt) Ltd",
  periodEnd: "31 Jul 2026",
  functionalCurrency: "USD",
  rateSource: "Approved treasury rates",
}

export const acFxStats = [
  { label: "Foreign-currency accounts", value: "28" },
  { label: "ZiG exposure", value: "ZiG 42.6m", sub: "USD 1.52m (book value)" },
  { label: "ZAR exposure", value: "R3.8m", sub: "USD 213,060 (book value)" },
  { label: "Unrealised gain", value: "$46,820", sub: "0.64% of book value", tone: "cobalt" as const },
  { label: "Exceptions", value: "2", sub: "Require attention", tone: "exception" as const },
]

export type AcFxRow = {
  account: string
  name: string
  currency: string
  foreignBalance: string
  bookRate: string
  closingRate: string
  usdBook: string
  usdRevalued: string
  gainLoss: string
  journal: string
  status: "Compliant" | "Missing rate" | "Not revalued"
  loss?: boolean
}

export const acFxRows: AcFxRow[] = [
  { account: "1100-003", name: "CBZ Bank - ZiG Current", currency: "ZiG", foreignBalance: "18,750,000.00", bookRate: "27.3000", closingRate: "27.94", usdBook: "686,813.19", usdRevalued: "670,375.98", gainLoss: "(16,437.21)", journal: "JV-REV-0726-001", status: "Compliant", loss: true },
  { account: "1200-002", name: "Trade Receivables - ZiG", currency: "ZiG", foreignBalance: "12,450,000.00", bookRate: "27.3000", closingRate: "27.94", usdBook: "456,043.96", usdRevalued: "445,333.15", gainLoss: "(10,710.81)", journal: "JV-REV-0726-002", status: "Compliant", loss: true },
  { account: "2100-001", name: "Trade Payables - ZAR", currency: "ZAR", foreignBalance: "2,100,000.00", bookRate: "17.2500", closingRate: "17.82", usdBook: "121,739.13", usdRevalued: "117,845.57", gainLoss: "(3,893.56)", journal: "JV-REV-0726-003", status: "Compliant", loss: true },
  { account: "2100-003", name: "Software Payable - EUR", currency: "EUR", foreignBalance: "80,000.00", bookRate: "0.9050", closingRate: "—", usdBook: "72,400.00", usdRevalued: "—", gainLoss: "—", journal: "—", status: "Missing rate" },
  { account: "1300-001", name: "VAT Receivable - ZiG", currency: "ZiG", foreignBalance: "3,250,000.00", bookRate: "27.3000", closingRate: "27.94", usdBook: "118,681.32", usdRevalued: "116,226.62", gainLoss: "(2,454.70)", journal: "JV-REV-0726-004", status: "Compliant", loss: true },
  { account: "2100-002", name: "Sundry Creditors - ZAR", currency: "ZAR", foreignBalance: "850,000.00", bookRate: "17.2500", closingRate: "17.82", usdBook: "49,739.13", usdRevalued: "47,295.79", gainLoss: "(2,443.34)", journal: "JV-REV-0726-005", status: "Compliant", loss: true },
  { account: "1400-001", name: "Prepayments - USD", currency: "USD", foreignBalance: "25,000.00", bookRate: "1.0000", closingRate: "1.0000", usdBook: "25,000.00", usdRevalued: "25,000.00", gainLoss: "—", journal: "—", status: "Not revalued" },
  { account: "2100-004", name: "Consulting Payable - USD", currency: "USD", foreignBalance: "12,500.00", bookRate: "1.0000", closingRate: "1.0000", usdBook: "12,500.00", usdRevalued: "12,500.00", gainLoss: "—", journal: "—", status: "Not revalued" },
]

export const acFxPagination = { shown: "1–8", total: "28" }

export type AcFxJournalLine = {
  n: number
  account: string
  name: string
  debit: string
  credit: string
  narration: string
}

export const acFxJournalRef = "JV-REV-0726-ALL"

export const acFxJournalLines: AcFxJournalLine[] = [
  { n: 1, account: "8200-001", name: "FX Gain/(Loss) - Revaluation", debit: "52,140.00", credit: "—", narration: "FX revaluation - July 2026" },
  { n: 2, account: "1100-003", name: "CBZ Bank - ZiG Current", debit: "—", credit: "16,437.21", narration: "Revalue ZiG bank balance" },
  { n: 3, account: "1200-002", name: "Trade Receivables - ZiG", debit: "—", credit: "10,710.81", narration: "Revalue ZiG receivables" },
  { n: 4, account: "2100-001", name: "Trade Payables - ZAR", debit: "—", credit: "3,893.56", narration: "Revalue ZAR payables" },
  { n: 5, account: "1300-001", name: "VAT Receivable - ZiG", debit: "—", credit: "2,454.70", narration: "Revalue ZiG VAT receivable" },
  { n: 6, account: "2100-002", name: "Sundry Creditors - ZAR", debit: "—", credit: "2,443.34", narration: "Revalue ZAR creditors" },
]

export const acFxJournalTotal = { debit: "52,140.00", credit: "52,140.00" }

export const acFxBalanceCheck = {
  debits: "$52,140.00",
  credits: "$52,140.00",
  balanced: true,
}

export const acFxMakerChecker = [
  { label: "Prepared by", name: "R. Dube", at: "18 Jul 2026 08:15" },
  { label: "Reviewed by", name: "T. Chinyoka", at: "18 Jul 2026 10:42" },
  { label: "Approved by", name: "L. Mutasa", at: "18 Jul 2026 11:05" },
]
