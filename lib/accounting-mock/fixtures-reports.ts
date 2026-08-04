export const acReportList = [
  "Profit & Loss",
  "Balance Sheet",
  "Cash Flow",
  "Trial Balance",
  "Budget vs Actual",
  "General Ledger Detail",
  "Tax Schedules",
]

export const acReportSet = {
  label: "Report set:",
  value: "Management Accounts · July 2026",
  options: ["Management Accounts · July 2026", "Statutory Accounts · July 2026", "Board Pack · Q2 2026"],
}

export const acPlTitle = "Profit & Loss · For the seven months ended 31 July 2026"

export type AcPlRow = {
  account: string
  julyActual: string
  julyBudget: string
  variance: string
  varianceTone: "cobalt" | "amber" | "red"
  ytdActual: string
  ytdBudget: string
  variancePct: string
  kind: "group" | "child" | "subtotal" | "total"
}

export const acPlRows: AcPlRow[] = [
  { account: "Revenue", julyActual: "$692,450", julyBudget: "$610,000", variance: "$82,450", varianceTone: "cobalt", ytdActual: "$4,722,840", ytdBudget: "$4,320,000", variancePct: "+9.32%", kind: "group" },
  { account: "Service Income", julyActual: "$548,300", julyBudget: "$485,000", variance: "$63,300", varianceTone: "cobalt", ytdActual: "$3,648,670", ytdBudget: "$3,360,000", variancePct: "+8.59%", kind: "child" },
  { account: "Trading Income", julyActual: "$127,150", julyBudget: "$110,000", variance: "$17,150", varianceTone: "cobalt", ytdActual: "$879,170", ytdBudget: "$840,000", variancePct: "+4.66%", kind: "child" },
  { account: "Other Income", julyActual: "$17,000", julyBudget: "$15,000", variance: "$2,000", varianceTone: "cobalt", ytdActual: "$195,000", ytdBudget: "$120,000", variancePct: "+62.50%", kind: "child" },
  { account: "Cost of Goods Sold", julyActual: "$188,900", julyBudget: "$180,000", variance: "-$8,900", varianceTone: "amber", ytdActual: "$1,284,600", ytdBudget: "$1,260,000", variancePct: "+1.95%", kind: "group" },
  { account: "Direct Costs", julyActual: "$156,200", julyBudget: "$150,000", variance: "-$6,200", varianceTone: "amber", ytdActual: "$1,066,800", ytdBudget: "$1,050,000", variancePct: "+1.60%", kind: "child" },
  { account: "Freight & Clearing", julyActual: "$19,400", julyBudget: "$18,000", variance: "-$1,400", varianceTone: "amber", ytdActual: "$131,600", ytdBudget: "$126,000", variancePct: "+4.44%", kind: "child" },
  { account: "Inventory Adjustments", julyActual: "$13,300", julyBudget: "$12,000", variance: "-$1,300", varianceTone: "amber", ytdActual: "$86,200", ytdBudget: "$84,000", variancePct: "+2.62%", kind: "child" },
  { account: "Gross Profit", julyActual: "$503,550", julyBudget: "$430,000", variance: "$73,550", varianceTone: "cobalt", ytdActual: "$3,438,240", ytdBudget: "$3,060,000", variancePct: "+12.35%", kind: "subtotal" },
  { account: "Operating Expenses", julyActual: "$372,760", julyBudget: "$355,000", variance: "-$17,760", varianceTone: "amber", ytdActual: "$2,625,640", ytdBudget: "$2,450,000", variancePct: "+7.17%", kind: "group" },
  { account: "Salaries & Wages", julyActual: "$96,100", julyBudget: "$92,000", variance: "-$4,100", varianceTone: "red", ytdActual: "$672,850", ytdBudget: "$644,000", variancePct: "+4.48%", kind: "child" },
  { account: "Rent & Rates", julyActual: "$28,450", julyBudget: "$26,000", variance: "-$2,450", varianceTone: "red", ytdActual: "$199,150", ytdBudget: "$182,000", variancePct: "+9.43%", kind: "child" },
  { account: "Utilities", julyActual: "$15,280", julyBudget: "$14,000", variance: "-$1,280", varianceTone: "red", ytdActual: "$100,420", ytdBudget: "$98,000", variancePct: "+2.47%", kind: "child" },
  { account: "Professional Fees", julyActual: "$39,700", julyBudget: "$40,000", variance: "$300", varianceTone: "cobalt", ytdActual: "$285,600", ytdBudget: "$280,000", variancePct: "+2.00%", kind: "child" },
  { account: "Marketing", julyActual: "$22,600", julyBudget: "$20,000", variance: "-$2,600", varianceTone: "red", ytdActual: "$148,900", ytdBudget: "$140,000", variancePct: "+6.36%", kind: "child" },
  { account: "Depreciation", julyActual: "$25,100", julyBudget: "$24,000", variance: "-$1,100", varianceTone: "red", ytdActual: "$174,700", ytdBudget: "$168,000", variancePct: "+3.99%", kind: "child" },
  { account: "Other Operating Expenses", julyActual: "$145,530", julyBudget: "$139,000", variance: "-$6,530", varianceTone: "red", ytdActual: "$1,043,020", ytdBudget: "$938,000", variancePct: "+11.19%", kind: "child" },
  { account: "Operating Profit", julyActual: "$130,790", julyBudget: "$75,000", variance: "$55,790", varianceTone: "cobalt", ytdActual: "$812,600", ytdBudget: "$610,000", variancePct: "+33.17%", kind: "subtotal" },
  { account: "Finance Income", julyActual: "$2,850", julyBudget: "$2,000", variance: "$850", varianceTone: "cobalt", ytdActual: "$21,150", ytdBudget: "$14,000", variancePct: "+51.07%", kind: "child" },
  { account: "Finance Costs", julyActual: "$10,250", julyBudget: "$9,000", variance: "-$1,250", varianceTone: "red", ytdActual: "$67,200", ytdBudget: "$63,000", variancePct: "+6.67%", kind: "child" },
  { account: "Profit Before Tax", julyActual: "$123,390", julyBudget: "$68,000", variance: "$55,390", varianceTone: "cobalt", ytdActual: "$766,550", ytdBudget: "$561,000", variancePct: "+36.61%", kind: "subtotal" },
  { account: "Income Tax Expense", julyActual: "$24,990", julyBudget: "$17,000", variance: "-$7,990", varianceTone: "red", ytdActual: "$120,950", ytdBudget: "$95,000", variancePct: "+27.32%", kind: "child" },
  { account: "Net Income", julyActual: "$98,400", julyBudget: "$51,000", variance: "$47,400", varianceTone: "cobalt", ytdActual: "$645,600", ytdBudget: "$466,000", variancePct: "+38.52%", kind: "total" },
]

export const acReportSettings = [
  { label: "Entity", value: "Mukuru Capital Partners (Pvt) Ltd", options: ["Mukuru Capital Partners (Pvt) Ltd", "Mukuru Logistics (Pvt) Ltd", "Mukuru Properties (Pvt) Ltd"] },
  { label: "Period", value: "July 2026 (MTD & YTD)", options: ["July 2026 (MTD & YTD)", "June 2026 (MTD & YTD)", "Q2 2026"] },
  { label: "Currency", value: "USD", options: ["USD", "ZiG", "ZAR"] },
  { label: "Comparative", value: "Budget", options: ["Budget", "Prior year", "Forecast"] },
  { label: "Departments", value: "All Departments (5)", options: ["All Departments (5)", "Finance", "Operations", "Sales", "HR", "IT"] },
  { label: "Projects", value: "All Projects", options: ["All Projects", "Gwanda Solar Project", "Bulawayo Depot"] },
  { label: "Rounding", value: "Nearest USD", options: ["Nearest USD", "Nearest thousand", "Nearest million"] },
  { label: "Notes", value: "Include notes", options: ["Include notes", "Exclude notes"] },
  { label: "Consolidation", value: "Consolidated", options: ["Consolidated", "Entity only"] },
  { label: "Eliminations", value: "Include eliminations", options: ["Include eliminations", "Exclude eliminations"] },
]

export type AcReportControl = {
  title: string
  sub: string
  value?: string
  tone: "ok" | "warning" | "info"
}

export const acReportControls: AcReportControl[] = [
  { title: "Trial balance agrees", sub: "Debits = Credits", value: "$15,842,670.12", tone: "ok" },
  { title: "Missing variance comments", sub: "2 material variances need comments", tone: "warning" },
  { title: "Approval pending", sub: "Submit for review to continue", tone: "info" },
]

export const acReportMeta = [
  { label: "Reviewer", value: "Rudo Chikore" },
  { label: "Approver", value: "Farai Moyo" },
  { label: "Version", value: "v3" },
  { label: "Generated", value: "15 Jul 2026 10:18" },
]
