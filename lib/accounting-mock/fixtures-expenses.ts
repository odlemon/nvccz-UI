export const acExpenseKpis = [
  { id: "unsubmitted", label: "Unsubmitted", value: "$8,460.00", count: "6 claims", tone: "navy" as const },
  { id: "manager", label: "Awaiting manager", value: "$12,740.30", count: "9 claims", tone: "amber" as const },
  { id: "finance", label: "Finance review", value: "$6,320.45", count: "5 claims", tone: "amber" as const },
  { id: "approved", label: "Approved for payment", value: "$18,950.80", count: "11 claims", tone: "cobalt" as const },
  { id: "exceptions", label: "Policy exceptions", value: "4", count: "4 claims", tone: "red" as const },
]

export type AcExpenseStatus = "Finance review" | "Awaiting manager" | "Approved" | "Paid"

export type AcExpenseRow = {
  id: string
  employee: string
  department: string
  submitted: string
  category: string
  currency: string
  amount: string
  receiptCoverage: string
  policyResult: string
  policyTone: "neutral" | "exception" | "warning"
  status: AcExpenseStatus
}

export const acExpenseRows: AcExpenseRow[] = [
  { id: "EXP-2026-0723", employee: "Rudo Chikore", department: "Operations", submitted: "23 Jul 2026", category: "Client meeting", currency: "USD", amount: "$356.75", receiptCoverage: "100%", policyResult: "Compliant", policyTone: "neutral", status: "Finance review" },
  { id: "EXP-2026-0718", employee: "Nyasha Moyo", department: "Projects", submitted: "18 Jul 2026", category: "Travel & accommodation", currency: "USD", amount: "$1,842.60", receiptCoverage: "92%", policyResult: "Exceptions", policyTone: "exception", status: "Awaiting manager" },
  { id: "EXP-2026-0716", employee: "Chipo Mhlanga", department: "Finance", submitted: "16 Jul 2026", category: "Training", currency: "USD", amount: "$980.00", receiptCoverage: "100%", policyResult: "Compliant", policyTone: "neutral", status: "Finance review" },
  { id: "EXP-2026-0714", employee: "Tendai Sibanda", department: "Sales", submitted: "14 Jul 2026", category: "Fuel", currency: "USD", amount: "$214.40", receiptCoverage: "100%", policyResult: "Compliant", policyTone: "neutral", status: "Awaiting manager" },
  { id: "EXP-2026-0713", employee: "Farai Moyo", department: "Operations", submitted: "13 Jul 2026", category: "Site visit", currency: "USD", amount: "$612.35", receiptCoverage: "86%", policyResult: "Missing info", policyTone: "warning", status: "Awaiting manager" },
  { id: "EXP-2026-0710", employee: "Rudo Chikore", department: "Operations", submitted: "10 Jul 2026", category: "Client meeting", currency: "USD", amount: "$275.60", receiptCoverage: "100%", policyResult: "Compliant", policyTone: "neutral", status: "Approved" },
  { id: "EXP-2026-0709", employee: "Nyasha Moyo", department: "Projects", submitted: "09 Jul 2026", category: "Transport", currency: "USD", amount: "$128.90", receiptCoverage: "100%", policyResult: "Compliant", policyTone: "neutral", status: "Approved" },
  { id: "EXP-2026-0707", employee: "Chipo Mhlanga", department: "Finance", submitted: "07 Jul 2026", category: "Office supplies", currency: "USD", amount: "$162.50", receiptCoverage: "100%", policyResult: "Compliant", policyTone: "neutral", status: "Paid" },
  { id: "EXP-2026-0702", employee: "Tendai Sibanda", department: "Sales", submitted: "02 Jul 2026", category: "Client entertainment", currency: "USD", amount: "$438.25", receiptCoverage: "95%", policyResult: "Compliant", policyTone: "neutral", status: "Paid" },
]

export const acExpenseDetail = {
  id: "EXP-2026-0718",
  title: "Nyasha Moyo · Bulawayo site visit",
  status: "Awaiting manager" as const,
  submitted: "Submitted 18 Jul 2026, 10:42",
  amount: "$1,842.60",
  info: [
    { label: "Trip dates", value: "15 Jul 2026 – 17 Jul 2026" },
    { label: "Project", value: "Gwanda Solar Project" },
    { label: "Cost centre", value: "Projects – Field Operations" },
    { label: "Purpose", value: "Site visit and progress review" },
    { label: "VAT treatment", value: "Standard-rated (VAT claimable)" },
  ],
  policyExceptions: [
    { text: "Hotel rate exceeds limit by $92.00", tone: "exception" as const },
    { text: "Missing attendee list", tone: "warning" as const },
  ],
  duplicateDetection: "No duplicates found",
  perDiemRule: "Within per-diem limits",
  lines: [
    { date: "15 Jul 2026", desc: "Flight Harare → Bulawayo", category: "Transport", amount: "$342.60", receipt: "Yes" },
    { date: "15 Jul 2026", desc: "Taxi – Airport to Hotel", category: "Transport", amount: "$28.00", receipt: "Yes" },
    { date: "15 Jul 2026", desc: "Hotel – Bulawayo (1 night)", category: "Accommodation", amount: "$142.00", receipt: "Yes", highlight: true },
    { date: "16 Jul 2026", desc: "Client lunch – Builders Inn", category: "Meals", amount: "$96.50", receipt: "Yes" },
    { date: "16 Jul 2026", desc: "Fuel – Company vehicle", category: "Fuel", amount: "$64.00", receipt: "Yes" },
    { date: "17 Jul 2026", desc: "Per diem – Meals & incidentals", category: "Per diem", amount: "$1,169.50", receipt: "N/A" },
  ],
  budget: {
    costCentre: "Projects – Field Operations",
    budget: "$120,000.00",
    spent: "$78,430.20",
    claim: "$1,842.60",
    remaining: "$39,727.20",
  },
  approvals: [
    { name: "Nyasha Moyo", role: "Employee", status: "Approved", date: "18 Jul 2026, 10:42" },
    { name: "Blessing Dube", role: "Line Manager", status: "Pending", date: "—" },
    { name: "Tinashe Chigumba", role: "Finance Reviewer", status: "Pending", date: "—" },
    { name: "Tatenda Zinyemba", role: "Finance Manager", status: "Pending", date: "—" },
  ],
}

export const acExpensePagination = {
  showing: "1–12",
  total: 34,
  page: 1,
  pages: 2,
  perPage: "25 per page",
}
