export const acPaymentRunHeader = {
  title: "Payment Run",
  meta: "· PAYRUN-2026-0805-02",
}

export const acPaymentRunMeta = [
  { label: "Scheduled date", value: "05 Aug 2026", icon: "calendar" as const },
  { label: "Funding account", value: "CBZ USD Operating (···3456)", icon: "bank" as const },
  { label: "Status", value: "Finance review", tone: "pending" as const },
]

export type AcPaymentRunStep = {
  n: number
  label: string
  state: "complete" | "current" | "pending" | "locked"
  sub?: string
}

export const acPaymentRunSteps: AcPaymentRunStep[] = [
  { n: 1, label: "Select invoices", state: "complete" },
  { n: 2, label: "Validate beneficiaries", state: "current", sub: "18 of 18 verified" },
  { n: 3, label: "Approve batch", state: "pending", sub: "Pending" },
  { n: 4, label: "Generate bank file", state: "locked", sub: "Locked" },
  { n: 5, label: "Confirm settlement", state: "locked", sub: "Locked" },
]

export const acPaymentRunStats = [
  { label: "Suppliers selected", value: "18", icon: "users" as const },
  { label: "Invoices selected", value: "34", icon: "file" as const },
  { label: "Batch total (USD)", value: "$418,760.40" },
  { label: "Available cash (USD)", value: "$1,602,183.78" },
  { label: "Held payments", value: "2", icon: "alert" as const, tone: "exception" as const },
]

export type AcPaymentRunRow = {
  id: string
  supplier: string
  invoices: string
  dueDate: string
  bank: string
  accountEnding: string
  currency: string
  gross: string
  wht: string
  net: string
  validation: "Verified" | "Review" | "Bank detail mismatch"
  holdReason: string
  selected: boolean
}

export const acPaymentRunRows: AcPaymentRunRow[] = [
  { id: "p1", supplier: "ZimTech Solutions (Pvt) Ltd", invoices: "AP-2026-0187, AP-2026-0204", dueDate: "06 Aug 2026", bank: "Stanbic Bank", accountEnding: "4321", currency: "USD", gross: "31,126.00", wht: "3,150.00", net: "27,976.00", validation: "Verified", holdReason: "—", selected: true },
  { id: "p2", supplier: "ZESA Holdings (Pvt) Ltd", invoices: "AP-2026-0175", dueDate: "07 Aug 2026", bank: "Stanbic Bank", accountEnding: "1456", currency: "USD", gross: "58,430.50", wht: "5,843.05", net: "52,587.45", validation: "Verified", holdReason: "—", selected: true },
  { id: "p3", supplier: "Liquid Telecom Zimbabwe", invoices: "AP-2026-0191", dueDate: "07 Aug 2026", bank: "CBZ Bank", accountEnding: "7788", currency: "USD", gross: "9,842.00", wht: "984.20", net: "8,857.80", validation: "Verified", holdReason: "—", selected: true },
  { id: "p4", supplier: "Grant Thornton Zimbabwe", invoices: "AP-2026-0169", dueDate: "08 Aug 2026", bank: "Stanbic Bank", accountEnding: "8877", currency: "USD", gross: "12,600.00", wht: "1,260.00", net: "11,340.00", validation: "Verified", holdReason: "—", selected: true },
  { id: "p5", supplier: "Delta Beverages (Pvt) Ltd", invoices: "AP-2026-0183, AP-2026-0184", dueDate: "09 Aug 2026", bank: "First Capital Bank", accountEnding: "3344", currency: "USD", gross: "45,000.00", wht: "4,500.00", net: "40,500.00", validation: "Review", holdReason: "Beneficiary name mismatch", selected: true },
  { id: "p6", supplier: "Clover Leaf (Pvt) Ltd", invoices: "AP-2026-0190", dueDate: "10 Aug 2026", bank: "Stanbic Bank", accountEnding: "5566", currency: "USD", gross: "6,780.00", wht: "678.00", net: "6,102.00", validation: "Verified", holdReason: "—", selected: true },
  { id: "p7", supplier: "Office Dynamics (Pvt) Ltd", invoices: "AP-2026-0179", dueDate: "10 Aug 2026", bank: "CBZ Bank", accountEnding: "2233", currency: "USD", gross: "3,250.00", wht: "325.00", net: "2,925.00", validation: "Verified", holdReason: "—", selected: true },
  { id: "p8", supplier: "Metrofile Pvt Ltd", invoices: "AP-2026-0188", dueDate: "11 Aug 2026", bank: "Stanbic Bank", accountEnding: "9988", currency: "USD", gross: "15,420.00", wht: "1,542.00", net: "13,878.00", validation: "Bank detail mismatch", holdReason: "Account number mismatch", selected: true },
  { id: "p9", supplier: "Buffalo Office Products", invoices: "AP-2026-0192", dueDate: "11 Aug 2026", bank: "CBZ Bank", accountEnding: "6611", currency: "USD", gross: "4,890.00", wht: "489.00", net: "4,401.00", validation: "Review", holdReason: "Beneficiary pending verification", selected: false },
  { id: "p10", supplier: "Safari Logistics (Pvt) Ltd", invoices: "AP-2026-0180", dueDate: "12 Aug 2026", bank: "FNB Bank", accountEnding: "8899", currency: "USD", gross: "22,150.00", wht: "2,215.00", net: "19,935.00", validation: "Verified", holdReason: "—", selected: false },
]

export const acPaymentRunPagination = { from: 1, to: 10, total: 18, page: 1, pages: 2, perPage: "10" }

export const acPaymentRunChecks = [
  { label: "Duplicate payments", status: "Clear", sub: "No duplicates found", tone: "cobalt" as const },
  { label: "Sanctions check", status: "Complete", sub: "All beneficiaries screened", tone: "cobalt" as const },
  { label: "Cash coverage", status: "Sufficient", sub: "$1,602,183.78 available", tone: "cobalt" as const },
  { label: "Holds", status: "2", sub: "2 payments on hold", tone: "exception" as const },
]

export const acPaymentRunApproval = [
  { role: "Reviewer", name: "Rudo Chikore", title: "Finance Manager", status: "Pending" },
  { role: "Final approver", name: "Farai Moyo", title: "Finance Director", status: "Pending" },
]

export const acPaymentRunRefreshedAt = "18 Jul 2026 08:15"
export const acPaymentRunVersion = "v2026.07.18"

export const acPaymentRunDrawer = {
  supplier: "ZimTech Solutions (Pvt) Ltd",
  invoices: [
    { ref: "AP-2026-0187", dueDate: "06 Aug 2026", gross: "17,850.00" },
    { ref: "AP-2026-0204", dueDate: "06 Aug 2026", gross: "13,276.00" },
  ],
  totalGross: "31,126.00",
  wht: "3,150.00",
  netPayment: "27,976.00",
  bank: "Stanbic Bank Zimbabwe",
  accountName: "ZimTech Solutions (Pvt) Ltd",
  accountNumber: "9120004321",
  branch: "Borrowdale",
  accountCurrency: "USD",
  changeHistory: [
    { at: "04 Aug 2026 10:14", by: "Tariro Ncube", action: "Beneficiary verified" },
    { at: "03 Aug 2026 16:02", by: "Tariro Ncube", action: "Bank details updated" },
  ],
  document: { name: "ZimTech_Bank_Confirmation_2026.pdf", uploaded: "Uploaded 02 Aug 2026" },
  narration: "Payment of outstanding invoices AP-2026-0187 and AP-2026-0204.",
  glLines: [
    { account: "6200-000", name: "IT Services", debit: "31,126.00", credit: "—" },
    { account: "2100-000", name: "Accounts Payable", debit: "—", credit: "31,126.00" },
  ],
}
