export const acEntity = "Mukuru Capital Partners (Pvt) Ltd"
export const acPeriod = "July 2026"
export const acCurrency = "USD"
export const acFxRate = "ZiG 27.94"
export const acFxRateDetail = "1 USD = 27.94 ZiG"
export const acUser = { name: "Tariro Ncube", initials: "TN" }
export const acRefreshedAt = "18 Jul 2026 08:15"
export const acVersion = "v2026.07.18"

export const acKpis = [
  { id: "cash", label: "Cash & Bank", value: "$2.84m", deltaLabel: "vs Jun 2026", deltaValue: "8.7%", tone: "up" as const, icon: "Landmark" },
  { id: "ar", label: "Receivables", value: "$618.4k", deltaLabel: "vs Jun 2026", deltaValue: "4.3%", tone: "up" as const, icon: "User" },
  { id: "ap", label: "Payables", value: "$401.8k", deltaLabel: "vs Jun 2026", deltaValue: "2.1%", tone: "up" as const, icon: "ShoppingCart" },
  { id: "rev", label: "Revenue YTD", value: "$4.72m", deltaLabel: "vs Jul 2025 YTD", deltaValue: "18.6%", tone: "up" as const, icon: "LineChart" },
  { id: "ni", label: "Net Income", value: "$812.6k", deltaLabel: "vs Jul 2025 YTD", deltaValue: "6.2%", tone: "down" as const, icon: "CircleDollarSign" },
]

/** Values in $ thousands. Variance % plots on the right axis; null = no callout. */
export const acBudgetSeries: { month: string; actual: number; budget: number; variance: number | null }[] = [
  { month: "Jan", actual: 620, budget: 720, variance: 4 },
  { month: "Feb", actual: 660, budget: 510, variance: -3 },
  { month: "Mar", actual: 710, budget: 780, variance: 6 },
  { month: "Apr", actual: 660, budget: 630, variance: 1 },
  { month: "May", actual: 800, budget: 810, variance: 7 },
  { month: "Jun", actual: 880, budget: 870, variance: 9 },
  { month: "Jul", actual: 765, budget: 750, variance: 5 },
  { month: "Aug", actual: 830, budget: 835, variance: null },
  { month: "Sep", actual: 755, budget: 785, variance: null },
  { month: "Oct", actual: 810, budget: 840, variance: null },
  { month: "Nov", actual: 855, budget: 910, variance: null },
  { month: "Dec", actual: 940, budget: 1050, variance: null },
]

export const acCashByCurrency = [
  { currency: "USD", cash: "$2,038,742", pct: "71.7%", vs: "8.7%" },
  { currency: "ZiG", cash: "ZiG 22,401,380", pct: "28.3%", vs: "6.4%" },
]

export const acCashTotal = { cash: "$2,840,122", pct: "100%", vs: "7.9%" }
export const acCashFootnote = "ZiG 27.94 per USD"

export const acControlQueue = [
  { id: "q1", count: "11", tone: "exception" as const, work: "Unreconciled bank items", owner: "T. Chinyoka", age: "3 days", action: "Review", href: "/accounting-v2/bank-reconciliation" },
  { id: "q2", count: "3", tone: "pending" as const, work: "Journals awaiting approval", owner: "R. Dube", age: "2 days", action: "Review", href: "/accounting-v2/journals/new" },
  { id: "q3", count: "4", tone: "exception" as const, work: "Supplier invoices with exceptions", owner: "P. Moyo", age: "1 day", action: "Review", href: "/accounting-v2/payables/match" },
  { id: "q4", count: "calendar" as const, tone: "pending" as const, work: "VAT return pack due", owner: "M. Sibanda", age: "25 Jul 2026", action: "Prepare", href: "/accounting-v2/tax" },
  { id: "q5", count: "1", tone: "pending" as const, work: "Payroll posting pending", owner: "L. Mutasa", age: "Due today", action: "Post", href: "/accounting-v2/journals/new" },
]

export const acControlQueueTotal = 23

export const acRecentPostings = [
  { date: "18 Jul 2026", ref: "GLJ-0734", desc: "Insurance premium – Q3", module: "General Ledger", account: "8100 - Insurance", debit: "8,450.00", credit: "-", currency: "USD", status: "Posted" as const, user: "R. Dube" },
  { date: "18 Jul 2026", ref: "PAY-0718", desc: "Salaries – July 2026", module: "Payroll", account: "5200 - Salaries", debit: "96,000.00", credit: "-", currency: "USD", status: "Posted" as const, user: "L. Mutasa" },
  { date: "17 Jul 2026", ref: "BCR-1192", desc: "FBC USD A/C – Bank fees", module: "Cash Book", account: "6300 - Bank Charges", debit: "-", credit: "125.00", currency: "USD", status: "Posted" as const, user: "T. Chinyoka" },
  { date: "17 Jul 2026", ref: "SINV-8845", desc: "Office Supplies – Net 30", module: "Purchases", account: "6000 - Office Supplies", debit: "1,736.45", credit: "-", currency: "USD", status: "Pending Approval" as const, user: "P. Moyo" },
  { date: "16 Jul 2026", ref: "INV-45621", desc: "Delta Beverages (Pvt) Ltd", module: "Sales", account: "1100 - Trade Receivables", debit: "-", credit: "32,450.00", currency: "USD", status: "Posted" as const, user: "N. Zvobgo" },
  { date: "16 Jul 2026", ref: "JRN-2291", desc: "Accrual – Audit fee", module: "General Ledger", account: "8300 - Professional Fees", debit: "2,750.00", credit: "-", currency: "USD", status: "Pending Approval" as const, user: "R. Dube" },
  { date: "15 Jul 2026", ref: "BCR-1189", desc: "Standard Chartered – Int. receipt", module: "Cash Book", account: "1200 - Bank - USD", debit: "-", credit: "14,250.00", currency: "USD", status: "Posted" as const, user: "T. Chinyoka" },
  { date: "15 Jul 2026", ref: "PINV-6675", desc: "Econet Wireless – Services", module: "Purchases", account: "6100 - Telecommunication", debit: "1,280.75", credit: "-", currency: "USD", status: "Posted" as const, user: "P. Moyo" },
]

export const acPostingsCount = { shown: "1–8", total: 128 }

export const acCloseChecklist = [
  { area: "Bank reconciliations", status: "In progress" as const, pct: 85 },
  { area: "Journals & accruals", status: "In progress" as const, pct: 70 },
  { area: "Intercompany recon.", status: "In progress" as const, pct: 60 },
  { area: "Fixed assets", status: "In progress" as const, pct: 80 },
  { area: "VAT & statutory", status: "Not started" as const, pct: 0 },
  { area: "Management reports", status: "In progress" as const, pct: 75 },
]

export const acCloseReadiness = 74
export const acCloseTarget = { date: "05 Aug 2026", days: 18 }
