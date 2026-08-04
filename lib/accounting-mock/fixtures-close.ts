export const acCloseHeader = {
  period: "July 2026",
  status: "Open",
  owner: "Rudo Chikore",
  targetDate: "05 Aug 2026",
}

export const acCloseKpis = [
  { id: "completion", label: "Overall completion", value: "74%", sub: "", kind: "donut" as const },
  { id: "controls", label: "Controls complete", value: "11 of 15", sub: "73%", icon: "check" as const },
  { id: "journals", label: "Unposted journals", value: "2", sub: "Requires posting", icon: "journal" as const },
  { id: "recon", label: "Unreconciled accounts", value: "3", sub: "Needs attention", icon: "alert" as const },
  { id: "tax", label: "Tax packs due", value: "2", sub: "Due before close", icon: "calendar" as const },
]

export type AcCloseTaskStatus = "Complete" | "In review" | "Exception" | "Blocked"

export type AcCloseTask = {
  id: string
  task: string
  dependency: string
  owner: string
  due: string
  evidence: string
  status: AcCloseTaskStatus
}

export type AcCloseWorkstream = {
  id: string
  name: string
  icon: "bank" | "payable" | "receivable" | "payroll" | "assets" | "investments" | "tax" | "statements"
  tasks: AcCloseTask[]
}

export const acCloseWorkstreams: AcCloseWorkstream[] = [
  {
    id: "bank",
    name: "Bank & Cash",
    icon: "bank",
    tasks: [
      { id: "bank-1", task: "Sign off CBZ USD reconciliation", dependency: "CBZ USD statement", owner: "Tariro Ncube", due: "25 Jul 2026", evidence: "2", status: "Complete" },
      { id: "bank-2", task: "Reconcile Petty Cash USD", dependency: "Petty cash count", owner: "Rudo Chikore", due: "25 Jul 2026", evidence: "1", status: "Complete" },
    ],
  },
  {
    id: "ap",
    name: "Accounts Payable",
    icon: "payable",
    tasks: [
      { id: "ap-1", task: "Reconcile supplier statements", dependency: "Supplier statements", owner: "Tariro Ncube", due: "26 Jul 2026", evidence: "3", status: "Complete" },
      { id: "ap-2", task: "Review and post AP accruals", dependency: "GRNI listing", owner: "Rudo Chikore", due: "27 Jul 2026", evidence: "1", status: "Complete" },
    ],
  },
  {
    id: "ar",
    name: "Accounts Receivable",
    icon: "receivable",
    tasks: [
      { id: "ar-1", task: "Reconcile debtor accounts", dependency: "Debtor statements", owner: "Tariro Ncube", due: "26 Jul 2026", evidence: "2", status: "Complete" },
      { id: "ar-2", task: "Review doubtful debts provision", dependency: "Ageing report", owner: "Farai Moyo", due: "27 Jul 2026", evidence: "1", status: "Complete" },
    ],
  },
  {
    id: "payroll",
    name: "Payroll",
    icon: "payroll",
    tasks: [
      { id: "payroll-1", task: "Post July payroll journal", dependency: "Payroll run July 2026", owner: "Rudo Chikore", due: "25 Jul 2026", evidence: "1", status: "In review" },
    ],
  },
  {
    id: "assets",
    name: "Fixed Assets",
    icon: "assets",
    tasks: [
      { id: "assets-1", task: "Run depreciation", dependency: "Asset register", owner: "Tariro Ncube", due: "25 Jul 2026", evidence: "1", status: "In review" },
    ],
  },
  {
    id: "investments",
    name: "Short-Term Investments",
    icon: "investments",
    tasks: [
      { id: "invest-1", task: "Accrue investment interest", dependency: "Investment statements", owner: "Tariro Ncube", due: "25 Jul 2026", evidence: "1", status: "In review" },
    ],
  },
  {
    id: "tax",
    name: "Tax",
    icon: "tax",
    tasks: [
      { id: "tax-1", task: "Prepare VAT return pack", dependency: "VAT detail report", owner: "Tariro Ncube", due: "25 Jul 2026", evidence: "2", status: "Exception" },
      { id: "tax-2", task: "Prepare PAYE & WHT returns", dependency: "Payroll journal", owner: "Rudo Chikore", due: "26 Jul 2026", evidence: "1", status: "In review" },
    ],
  },
  {
    id: "statements",
    name: "Financial Statements",
    icon: "statements",
    tasks: [
      { id: "fs-1", task: "Review trial balance", dependency: "All ledgers", owner: "Farai Moyo", due: "03 Aug 2026", evidence: "1", status: "In review" },
      { id: "fs-2", task: "Lock period", dependency: "All tasks complete", owner: "Rudo Chikore", due: "05 Aug 2026", evidence: "—", status: "Blocked" },
    ],
  },
]

export const acCloseVatDetail = {
  title: "Prepare VAT return pack",
  due: "25 Jul 2026",
  status: "Exception" as const,
  reconciliations: [
    { reconciliation: "Sales VAT", ledger: "VAT Output", status: "Complete" as const, amount: "$76,420.00" },
    { reconciliation: "Input VAT", ledger: "VAT Input", status: "Complete" as const, amount: "$38,000.00" },
    { reconciliation: "Imports", ledger: "VAT Imports", status: "In review" as const, amount: "$1,250.00" },
    { reconciliation: "Withholding tax", ledger: "WHT Control", status: "Complete" as const, amount: "$1,600.00" },
  ],
  summary: {
    output: "$76,420.00",
    input: "$38,000.00",
    net: "$38,420.00",
  },
  checklist: [
    { id: "c1", label: "All source ledgers linked", done: true },
    { id: "c2", label: "Exceptions", sub: "2 supplier tax invoices missing", done: false, exception: true, action: "View items" },
    { id: "c3", label: "Draft VAT201 submitted", done: false },
  ],
  reviewer: "Tariro Ncube",
  approver: "Farai Moyo",
  attachments: [
    { name: "VAT_return_pack_July2026_draft.pdf", size: "256 KB", date: "24 Jul 2026", type: "pdf" as const },
    { name: "VAT_detail_July2026.xlsx", size: "142 KB", date: "24 Jul 2026", type: "xlsx" as const },
  ],
  comment: {
    author: "Rudo Chikore",
    initials: "RC",
    text: "Awaiting invoices from ZimImports (Pvt) Ltd and BuildCo Supplies.",
    date: "24 Jul 2026, 10:32",
  },
  timeline: [
    { label: "Reconciliation completed", by: "Tariro Ncube", date: "24 Jul 2026, 09:15", tone: "ok" as const },
    { label: "Marked exception", by: "Tariro Ncube", date: "24 Jul 2026, 09:18", tone: "exception" as const },
  ],
}

export const acCloseFooter = {
  dependencies: { done: 12, total: 15, label: "Complete" },
  evidence: { count: "27 files", label: "Across tasks" },
  audit: { status: "Complete", label: "All actions captured" },
}
