export const acJournalMeta = {
  id: "JE-2026-0715-0042",
  status: "Draft",
  entity: "Mukuru Capital Partners (Pvt) Ltd",
  journalDate: "15 Jul 2026",
  postingPeriod: "July 2026",
  source: "Manual",
  description: "July accrued professional fees",
  reference: "JE-2026-0715-0042",
  department: "Finance",
  currency: "USD",
  attachment: "Professional_Fees_Invoice_July2026.pdf",
  attachmentSize: "128 KB",
}

export const acJournalEntityOptions = [
  "Mukuru Capital Partners (Pvt) Ltd",
  "Mukuru Holdings Limited",
  "MCP Treasury Services",
]
export const acJournalDateOptions = ["15 Jul 2026", "16 Jul 2026", "31 Jul 2026"]
export const acJournalPeriodOptions = ["July 2026", "June 2026", "August 2026"]
export const acJournalSourceOptions = ["Manual", "Import", "Recurring", "System"]
export const acJournalDeptOptions = ["Finance", "Operations", "Sales", "HR", "IT", "Corporate"]
export const acJournalCurrencyOptions = ["USD", "ZiG", "ZAR", "GBP"]
export const acJournalTaxOptions = [
  "WHT - Services (10%)",
  "VAT - Standard (15%)",
  "Exempt",
  "Zero rated",
]

export const acJournalSteps = [
  { step: 1, label: "Draft", state: "done" as const },
  { step: 2, label: "Validate", state: "done" as const },
  { step: 3, label: "Submit", state: "current" as const },
  { step: 4, label: "Approve", state: "todo" as const },
  { step: 5, label: "Post", state: "todo" as const },
]

export type AcJournalLine = {
  line: number
  code: string
  account: string
  desc: string
  dept: string
  project: string
  tax: string
  debit: string
  credit: string
}

export const acJournalLines: AcJournalLine[] = [
  {
    line: 1,
    code: "6200-010",
    account: "Professional Fees Expense",
    desc: "July legal advisory fees",
    dept: "Finance",
    project: "—",
    tax: "WHT - Services (10%)",
    debit: "31,500.00",
    credit: "0.00",
  },
  {
    line: 2,
    code: "2250-000",
    account: "VAT Control Payable",
    desc: "VAT on professional fees (15%)",
    dept: "Finance",
    project: "—",
    tax: "VAT - Standard (15%)",
    debit: "4,725.00",
    credit: "0.00",
  },
  {
    line: 3,
    code: "2100-010",
    account: "Withholding Tax Payable",
    desc: "WHT on professional fees (10%)",
    dept: "Finance",
    project: "—",
    tax: "WHT - Services (10%)",
    debit: "3,150.00",
    credit: "0.00",
  },
  {
    line: 4,
    code: "2000-020",
    account: "Accounts Payable - Local",
    desc: "Accrued professional fees - July",
    dept: "Finance",
    project: "—",
    tax: "Exempt",
    debit: "0.00",
    credit: "48,750.00",
  },
]

export const acJournalTotals = {
  debit: "$ 48,750.00",
  credit: "$ 48,750.00",
  state: "Balanced",
}

export const acJournalValidations = [
  { label: "Debits equal credits", value: "$48,750.00", tone: "ok" as const },
  { label: "Period is open", value: "July 2026", tone: "ok" as const },
  { label: "All accounts are active", value: "", tone: "ok" as const },
  { label: "Supporting document attached", value: "", tone: "ok" as const },
  {
    label: "Withholding tax treatment requires reviewer confirmation",
    value: "",
    tone: "warn" as const,
  },
]

export const acJournalApprovers = [
  {
    initials: "TN",
    name: "Tariro Ncube",
    role: "Preparer",
    state: "In progress",
    stamp: "15 Jul 2026 10:15",
    active: true,
  },
  { initials: "RC", name: "Rudo Chikore", role: "Reviewer", state: "Pending review", active: false },
  { initials: "FM", name: "Farai Moyo", role: "Final approver", state: "Pending approval", active: false },
]

export const acJournalMakerChecker = {
  title: "Maker-checker separation enforced.",
  body: "You cannot approve your own entry.",
}

export const acJournalVersions = [
  { version: "v1.0", label: "Current draft", user: "Tariro Ncube", stamp: "15 Jul 2026 10:15", current: true },
  { version: "v0.2", label: "Draft saved", user: "Tariro Ncube", stamp: "15 Jul 2026 09:58" },
  { version: "v0.1", label: "Draft created", user: "Tariro Ncube", stamp: "15 Jul 2026 09:42" },
]

export const acJournalAudit = [
  { label: "Created by", value: "Tariro Ncube" },
  { label: "Created on", value: "15 Jul 2026 09:42" },
  { label: "Last modified", value: "15 Jul 2026 10:15" },
  { label: "Entry ID", value: "JE-2026-0715-0042" },
]
