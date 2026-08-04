/** Accounting V2 — Receivables / Collections mock fixtures (slide 07). */

export const acArOutstanding = {
  label: "Outstanding",
  value: "$618,420",
}

export type AcArBucket = {
  id: string
  label: string
  value: string
  tone?: "exception"
}

export const acArBuckets: AcArBucket[] = [
  { id: "current", label: "Current", value: "$322,100" },
  { id: "b1", label: "1–30 days", value: "$164,320" },
  { id: "b2", label: "31–60 days", value: "$82,000" },
  { id: "b3", label: "61+ days", value: "$50,000", tone: "exception" },
]

export const acArDso = {
  label: "DSO",
  value: "38 days",
  note: "Above target",
}

export type AcArAgeingSegment = {
  id: string
  label: string
  amount: string
  weight: number
  color: string
}

export const acArAgeing: AcArAgeingSegment[] = [
  { id: "current", label: "Current (0–30)", amount: "$322,100", weight: 322100, color: "#0B1739" },
  { id: "b1", label: "1–30 days", amount: "$164,320", weight: 164320, color: "#2563EB" },
  { id: "b2", label: "31–60 days", amount: "$82,000", weight: 82000, color: "#D8E8FF" },
  { id: "b3", label: "61+ days", amount: "$50,000", weight: 50000, color: "#DC2626" },
]

export type AcArStatus = "Overdue" | "Part-paid" | "Paid" | "Promise to pay"

export type AcArInvoice = {
  invoice: string
  customer: string
  issueDate: string
  dueDate: string
  currency: string
  original: string
  outstanding: string
  age: string
  status: AcArStatus
}

export const acArInvoices: AcArInvoice[] = [
  { invoice: "INV-2026-00481", customer: "Mavambo Foods", issueDate: "31 May 2026", dueDate: "30 Jun 2026", currency: "USD", original: "$42,600.00", outstanding: "$42,600.00", age: "31", status: "Overdue" },
  { invoice: "INV-2026-00472", customer: "BancABC Custody", issueDate: "28 May 2026", dueDate: "27 Jun 2026", currency: "USD", original: "$68,250.00", outstanding: "$12,250.00", age: "34", status: "Part-paid" },
  { invoice: "INV-2026-00465", customer: "ZimGrowth Fund I", issueDate: "20 May 2026", dueDate: "19 Jun 2026", currency: "USD", original: "$95,000.00", outstanding: "$0.00", age: "42", status: "Paid" },
  { invoice: "INV-2026-00458", customer: "Nyamunda Agro", issueDate: "15 May 2026", dueDate: "14 Jun 2026", currency: "USD", original: "$36,800.00", outstanding: "$36,800.00", age: "47", status: "Overdue" },
  { invoice: "INV-2026-00451", customer: "Zambezi Advisory", issueDate: "10 May 2026", dueDate: "09 Jun 2026", currency: "USD", original: "$28,750.00", outstanding: "$8,750.00", age: "52", status: "Part-paid" },
  { invoice: "INV-2026-00439", customer: "Mavambo Foods", issueDate: "30 Apr 2026", dueDate: "30 May 2026", currency: "USD", original: "$39,200.00", outstanding: "$0.00", age: "62", status: "Paid" },
  { invoice: "INV-2026-00428", customer: "BancABC Custody", issueDate: "25 Apr 2026", dueDate: "25 May 2026", currency: "USD", original: "$52,500.00", outstanding: "$52,500.00", age: "67", status: "Overdue" },
  { invoice: "INV-2026-00416", customer: "ZimGrowth Fund I", issueDate: "18 Apr 2026", dueDate: "18 May 2026", currency: "USD", original: "$110,000.00", outstanding: "$33,000.00", age: "74", status: "Promise to pay" },
  { invoice: "INV-2026-00403", customer: "Nyamunda Agro", issueDate: "12 Apr 2026", dueDate: "12 May 2026", currency: "USD", original: "$27,450.00", outstanding: "$27,450.00", age: "80", status: "Overdue" },
  { invoice: "INV-2026-00392", customer: "Zambezi Advisory", issueDate: "05 Apr 2026", dueDate: "05 May 2026", currency: "USD", original: "$21,870.00", outstanding: "$0.00", age: "87", status: "Paid" },
]

export const acArPagination = {
  showing: "Showing 1 to 10 of 48 invoices",
  pages: ["1", "2", "3", "4", "5"],
}

export const acArDetail = {
  invoice: "INV-2026-00481",
  customer: "Mavambo Foods",
  outstanding: "$42,600.00",
  dueDate: "30 Jun 2026",
  daysOverdue: "31 days",
  contactName: "Rutendo Dube",
  contactEmail: "rutendo.dube@mavambo.co.zw",
  contactPhone: "+263 771 234 567",
  revenueAccount: "4000 · Management Fees",
  revenueSegment: "Zimbabwe & Regional",
  taxTreatment: "Standard-rated (15%)",
  taxCode: "ZWL VAT",
  notes: "Monthly management fee for May 2026.",
}

export type AcArActivity = {
  id: string
  icon: "mail" | "eye" | "bell" | "calendar"
  title: string
  detail?: string
  meta: string
  tone?: "pending"
}

export const acArActivity: AcArActivity[] = [
  {
    id: "emailed",
    icon: "mail",
    title: "Invoice emailed to rutendo.dube@mavambo.co.zw",
    meta: "31 May 2026 at 09:12 by System",
  },
  { id: "opened", icon: "eye", title: "Invoice opened", meta: "31 May 2026 at 09:45 by Recipient" },
  {
    id: "reminder",
    icon: "bell",
    title: "Reminder sent (Overdue – 7 days)",
    meta: "07 Jul 2026 at 09:00 by Tariro Ncube",
  },
  {
    id: "promise",
    icon: "calendar",
    title: "Promise recorded",
    detail: "Promise to pay $42,600.00 on 15 Jul 2026",
    meta: "08 Jul 2026 at 11:22 by Rutendo Dube",
    tone: "pending",
  },
]
