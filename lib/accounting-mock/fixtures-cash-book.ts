export const acCashAccountOptions = [
  "CBZ USD Operating",
  "CBZ ZiG Operating",
  "CBZ USD Savings",
  "Petty Cash – Head Office",
]

export const acCashDateOptions = ["15 Jul 2026", "14 Jul 2026", "31 Jul 2026"]

export const acCashSummary = [
  { label: "OPENING BALANCE", value: "$1,946,220.40" },
  { label: "INFLOWS", value: "$482,911.00" },
  { label: "OUTFLOWS", value: "$391,887.62" },
  { label: "CLOSING BALANCE", value: "$2,037,243.78", accent: true },
  { label: "AVAILABLE AFTER COMMITMENTS", value: "$1,602,183.78" },
]

export const acCashTabs = ["All", "Receipts", "Payments", "Transfers", "Unreconciled"]

export type AcCashRow = {
  date: string
  valueDate: string
  ref: string
  counterparty: string
  desc: string
  category: string
  inflow: string
  outflow: string
  balance: string
  recon: "Matched" | "Pending" | "Exception"
}

export const acCashRows: AcCashRow[] = [
  {
    date: "15 Jul 2026",
    valueDate: "15 Jul 2026",
    ref: "RCPT-01527",
    counterparty: "AgriGold Exports (Pvt) Ltd",
    desc: "Sale proceeds – Invoice INV-2214",
    category: "Sales Receipts",
    inflow: "58,420.00",
    outflow: "–",
    balance: "2,037,243.78",
    recon: "Matched",
  },
  {
    date: "15 Jul 2026",
    valueDate: "15 Jul 2026",
    ref: "PAY-08491",
    counterparty: "ZIMRA",
    desc: "VAT payment – June 2026",
    category: "Tax – VAT",
    inflow: "–",
    outflow: "38,420.00",
    balance: "1,978,823.78",
    recon: "Matched",
  },
  {
    date: "15 Jul 2026",
    valueDate: "15 Jul 2026",
    ref: "PAY-08490",
    counterparty: "ZimTech Solutions (Pvt) Ltd",
    desc: "Payment – INV-7783",
    category: "Office Supplies",
    inflow: "–",
    outflow: "17,850.00",
    balance: "1,940,973.78",
    recon: "Pending",
  },
  {
    date: "15 Jul 2026",
    valueDate: "15 Jul 2026",
    ref: "PAY-08489",
    counterparty: "Mukuru Capital Partners (Pvt) Ltd",
    desc: "Payroll – July 2026",
    category: "Salaries & Wages",
    inflow: "–",
    outflow: "96,000.00",
    balance: "1,844,973.78",
    recon: "Matched",
  },
  {
    date: "14 Jul 2026",
    valueDate: "14 Jul 2026",
    ref: "TRF-00231",
    counterparty: "CBZ USD Investment",
    desc: "Transfer to investment account",
    category: "Transfers",
    inflow: "–",
    outflow: "250,000.00",
    balance: "1,940,973.78",
    recon: "Matched",
  },
  {
    date: "14 Jul 2026",
    valueDate: "14 Jul 2026",
    ref: "PAY-08488",
    counterparty: "Mavambo Foods (Pvt) Ltd",
    desc: "Payment – INV-5561",
    category: "Cost of Sales",
    inflow: "–",
    outflow: "72,500.00",
    balance: "2,190,973.78",
    recon: "Pending",
  },
  {
    date: "14 Jul 2026",
    valueDate: "14 Jul 2026",
    ref: "CHG-04123",
    counterparty: "CBZ Bank Limited",
    desc: "Bank charges – June 2026",
    category: "Bank Charges",
    inflow: "–",
    outflow: "145.62",
    balance: "2,263,473.78",
    recon: "Matched",
  },
  {
    date: "13 Jul 2026",
    valueDate: "13 Jul 2026",
    ref: "RCPT-01526",
    counterparty: "Exporta (Pvt) Ltd",
    desc: "Sale proceeds – Invoice INV-2207",
    category: "Sales Receipts",
    inflow: "214,600.00",
    outflow: "–",
    balance: "2,263,619.40",
    recon: "Matched",
  },
  {
    date: "13 Jul 2026",
    valueDate: "13 Jul 2026",
    ref: "PAY-08487",
    counterparty: "BancABC Custody Services",
    desc: "Custody fees – June 2026",
    category: "Bank Charges",
    inflow: "–",
    outflow: "1,200.00",
    balance: "2,049,019.40",
    recon: "Exception",
  },
  {
    date: "10 Jul 2026",
    valueDate: "10 Jul 2026",
    ref: "RCPT-01525",
    counterparty: "Rainbow Tourism Group",
    desc: "Sale proceeds – Invoice INV-2198",
    category: "Sales Receipts",
    inflow: "120,000.00",
    outflow: "–",
    balance: "2,050,219.40",
    recon: "Matched",
  },
]

export const acCashPager = {
  summary: "1–10 of 214 transactions",
  pages: ["1", "2", "3", "4", "5", "…", "22"],
  perPage: "10 / page",
  perPageOptions: ["10 / page", "25 / page", "50 / page"],
}

export const acCashObligations = [
  { date: "17 Jul 2026", label: "Payroll – July 2026", amount: "$96,000.00", due: "In 2 days" },
  { date: "20 Jul 2026", label: "ZIMRA VAT – June 2026", amount: "$38,420.00", due: "In 5 days" },
  { date: "22 Jul 2026", label: "Supplier batch payments", amount: "$214,600.00", due: "In 7 days" },
]

export const acCashObligationsTotal = "$349,020.00"

export const acCashLiquidity = [
  { currency: "USD", value: "$2,037,243.78", pct: 62, bar: "#0B1739" },
  { currency: "ZiG", value: "ZiG 8,412,530.45", pct: 38, bar: "#2563EB" },
]

export const acCashControls = [
  { label: "Last bank feed", value: "Today, 09:42", dot: true },
  { label: "Unreconciled items", value: "18", accent: true },
  { label: "Statement coverage", value: "Up to 14 Jul 2026" },
  { label: "Next statement", value: "17 Jul 2026" },
]

export const acCashTransfer = {
  fromAccount: "CBZ USD Operating",
  fromAvailable: "$1,602,183.78",
  toAccount: "CBZ ZiG Account",
  toAvailable: "ZiG 8,412,530.45",
  currency: "USD",
  amount: "50,000.00",
  rate: "ZiG  27.9400",
  estimated: "ZiG 1,397,000.00",
}

export const acCashTransferToOptions = ["CBZ ZiG Account", "CBZ USD Savings", "CBZ USD Investment"]
